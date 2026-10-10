/**
 * 把已经写完正文的页面在 docs-tree.mjs 里标成 { existing: true }。
 *
 *   node scripts/docs-env/mark-existing.mjs            # 扫全部，凡是没有 planned: true 的就标
 *   node scripts/docs-env/mark-existing.mjs query data # 只处理这几个 section
 *
 * 这个标记是「文件被误删后 scaffold 不会悄悄重建成空占位」的唯一保险。
 * 顺便把已经没用的 legacy(...) 去掉——正文写完之后它就是死信息了。
 *
 * 改完记得 npm run scaffold，并确认四个生成文件 git diff 为空。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const EN = path.join(ROOT, 'docs');
const TREE = path.join(ROOT, 'scripts/docs-tree.mjs');
const sections = process.argv.slice(2);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : (/\.mdx?$/.test(e.name) ? [p] : []);
  });

const written = walk(EN)
  .filter((f) => !/^planned: true$/m.test(fs.readFileSync(f, 'utf8')))
  .map((f) => path.relative(EN, f).replace(/\.mdx?$/, ''))
  .filter((id) => !sections.length || sections.some((s) => id.startsWith(s + '/')));

/** 从 doc( 的左括号出发找配对的右括号，字符串里的括号要跳过 */
function closeParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"') {
      const q = c;
      i++;
      while (i < text.length && text[i] !== q) i += text[i] === '\\' ? 2 : 1;
    } else if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i;
  }
  throw new Error('括号不配对');
}

let src = fs.readFileSync(TREE, 'utf8');
const done = [];
const missing = [];

for (const id of written) {
  const m = new RegExp(`doc\\('${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`).exec(src);
  if (!m) { missing.push(id); continue; }
  const open = src.indexOf('(', m.index);
  const close = closeParen(src, open);
  const call = src.slice(m.index, close + 1);
  if (call.includes('existing: true')) continue;
  const body = call.slice(0, -1).replace(/,\s*legacy\('[^']*'\)\s*$/, '').replace(/,\s*$/, '');
  src = src.slice(0, m.index) + body.trimEnd() + ', { existing: true })' + src.slice(close + 1);
  done.push(id);
}

fs.writeFileSync(TREE, src);
console.log(`标记了 ${done.length} 个：`);
for (const d of done) console.log('  ', d);
if (missing.length) {
  console.log(`\n树里找不到这些（可能是 category 的 index 页，不是 doc 节点）：`);
  for (const m of missing) console.log('  ', m);
}
