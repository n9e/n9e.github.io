/**
 * 中英两棵文档树的一致性检查。放进每批的收尾动作里。
 *
 *   node scripts/docs-env/check-parity.mjs
 *
 * 查三件事：
 *   1. 两边的文件集合完全相同；
 *   2. 同一页的 planned 状态相同（不能一边写完了另一边还是占位）；
 *   3. 同一页的标题层级结构相同（数量和层级）。
 *      两边标题一漂，跨页 #锚点 链接就会只在一个语言下断，
 *      而 onBrokenAnchors 只是 warn，159 页的构建日志里没人看得见。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const EN = path.join(ROOT, 'docs');
const ZH = path.join(ROOT, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current');

const walk = (dir, base = dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p, base);
    return /\.mdx?$/.test(e.name) ? [path.relative(base, p)] : [];
  });

const read = (f) => fs.readFileSync(f, 'utf8');
const isPlanned = (s) => /^planned:\s*true\s*$/m.test(s.split('---')[1] || '');
// 只看正文里的 ATX 标题，跳过 front matter 和代码块
const headings = (s) => {
  const body = s.replace(/^---[\s\S]*?\n---\n/, '');
  const lines = body.split('\n');
  const out = [];
  let inFence = false;
  for (const l of lines) {
    if (/^\s*```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{2,4})\s+/.exec(l);
    if (m) out.push(m[1].length);
  }
  return out;
};

const en = new Set(walk(EN));
const zh = new Set(walk(ZH));
let bad = 0;

for (const f of en) if (!zh.has(f)) { console.log(`  只有英文：${f}`); bad++; }
for (const f of zh) if (!en.has(f)) { console.log(`  只有中文：${f}`); bad++; }

let planned = 0;
for (const f of [...en].filter((f) => zh.has(f)).sort()) {
  const a = read(path.join(EN, f));
  const b = read(path.join(ZH, f));
  const pa = isPlanned(a);
  const pb = isPlanned(b);
  if (pa !== pb) { console.log(`  占位状态不一致：${f}（en=${pa} zh=${pb}）`); bad++; continue; }
  if (pa) { planned++; continue; }
  const ha = headings(a).join(',');
  const hb = headings(b).join(',');
  if (ha !== hb) { console.log(`  标题结构不一致：${f}\n    en=[${ha}]\n    zh=[${hb}]`); bad++; }
}

const total = en.size;
console.log(`\n共 ${total} 页，${planned} 页仍是占位，${total - planned} 页有正文。`);
if (bad) { console.log(`${bad} 处不一致`); process.exit(1); }
console.log('中英一致 ✓');
