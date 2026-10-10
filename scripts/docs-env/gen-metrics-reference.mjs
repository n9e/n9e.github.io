/**
 * 生成「内置指标」参考表，两个来源并起来。
 *
 *   node scripts/docs-env/gen-metrics-reference.mjs [--locale zh]
 *
 * 只读跑着的实例是不够的：带标签的 counter/gauge 在第一次被观测之前
 * 根本不出现在 /metrics 里，所以一个刚起来、还没发过通知的实例上，
 * `n9e_alert_alert_notify_total` 这类指标是查不到的。
 * 于是再从源码里把 prometheus.NewXxx(Opts{Namespace, Subsystem, Name}) 扫一遍补齐，
 * 并标出哪些是「当前实例上还没出现过」的。
 *
 * 只收夜莺自己的指标（n9e_ 前缀），Go runtime 和 process 那些不收——
 * 那是所有 Go 程序都有的，不是夜莺的自监控信息。
 */

/**
 * 表格单元格里的自由文本要过一遍：这些文字来自源码注释，写的时候没考虑过 MDX。
 * `<` 会被当成 JSX 标签起始（`<[Log] Dir>` 直接让整个页面编译失败），
 * `{` 会被当成表达式。管道符会拆表格。
 */
const cell = (s) =>
  String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/\{/g, '&#123;');

import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.N9E_BASE || 'http://127.0.0.1:17000';
const N9E = process.env.N9E_SRC || '/Users/ning/gopath/src/github.com/ccfos/nightingale';
const zh = process.argv.includes('--locale') && process.argv[process.argv.indexOf('--locale') + 1] === 'zh';

const res = await fetch(`${BASE}/metrics`);
if (!res.ok) { console.error(`取不到 ${BASE}/metrics（${res.status}）——实例没起？`); process.exit(1); }
const text = await res.text();

const metrics = [];
let help = null;
for (const line of text.split('\n')) {
  let m = /^# HELP (\S+) (.*)$/.exec(line);
  if (m) { help = { name: m[1], help: m[2] }; continue; }
  m = /^# TYPE (\S+) (\S+)$/.exec(line);
  if (m && help && help.name === m[1]) { metrics.push({ ...help, type: m[2] }); help = null; }
}

const live = new Map(
  metrics.filter((m) => m.name.startsWith('n9e_')).map((m) => [m.name, m]),
);

/** 从源码里补上那些还没被触发、因此不在 /metrics 里的指标 */
function fromSource() {
  const found = new Map();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!['node_modules', '.git', 'front', 'integrations'].includes(e.name)) walk(f);
      } else if (e.name.endsWith('.go') && !e.name.endsWith('_test.go')) {
        const src = fs.readFileSync(f, 'utf8');
        if (!src.includes('prometheus.New')) continue;
        // namespace / subsystem 是文件级常量，先取出来
        const ns = /namespace\s*=\s*"([^"]+)"/.exec(src)?.[1];
        const sub = /subsystem\s*=\s*"([^"]+)"/.exec(src)?.[1];
        if (ns !== 'n9e') continue;
        const re = /prometheus\.New(Counter|Gauge|Histogram|Summary)(?:Vec)?\(prometheus\.\w+Opts\{([\s\S]*?)\}/g;
        let m;
        while ((m = re.exec(src))) {
          const body = m[2];
          const name = /Name:\s*"([^"]+)"/.exec(body)?.[1];
          if (!name) continue;
          const s2 = /Subsystem:\s*(?:"([^"]+)"|subsystem)/.exec(body);
          const subsystem = s2?.[1] ?? sub;
          const full = ['n9e', subsystem, name].filter(Boolean).join('_');
          found.set(full, {
            name: full,
            type: m[1].toLowerCase(),
            help: (/Help:\s*"([^"]*)"/.exec(body)?.[1] || '').trim(),
          });
        }
      }
    }
  };
  try { walk(N9E); } catch { /* 源码不在就只用 live 那份 */ }
  return found;
}

const all = new Map(live);
let onlyInSource = 0;
for (const [name, m] of fromSource()) {
  if (!all.has(name)) { all.set(name, { ...m, notLive: true }); onlyInSource++; }
}
const ours = [...all.values()].sort((a, b) => a.name.localeCompare(b.name));

// 按第二段前缀分组：n9e_alert_xxx -> alert
const groups = {};
for (const m of ours) {
  const g = m.name.split('_')[1] || 'other';
  (groups[g] ||= []).push(m);
}

console.log('<!-- 由 scripts/docs-env/gen-metrics-reference.mjs 从跑着的实例读出来，不要手改 -->\n');
console.log(zh
  ? `夜莺自己的指标共 **${ours.length} 条**，都在每个进程的 \`/metrics\` 上（\`[HTTP] ExposeMetrics\` 默认开）。\n\n下面不含 Go runtime 和 process 那批——那是所有 Go 程序都有的，不是夜莺的自监控信息。\n\n带 † 的 ${onlyInSource} 条是从源码里补的：带标签的指标在**第一次被触发之前不会出现在 \`/metrics\` 里**，所以一个刚起来的实例上查不到它们。这不是缺陷，配告警规则时按名字写就行。\n`
    : `Nightingale exposes **${ours.length} metrics of its own** on every process's \`/metrics\` endpoint (\`[HTTP] ExposeMetrics\` is on by default).\n\nGo runtime and process metrics are left out below — every Go program has those, and they say nothing about Nightingale.\n\nThe ${onlyInSource} marked † come from the source rather than from a live scrape: a labelled metric **does not appear on \`/metrics\` until something first observes it**, so a freshly started instance will not show them. That is expected — write rules against the name regardless.\n`);

for (const [g, items] of Object.entries(groups).sort()) {
  console.log(`### \`n9e_${g}_*\`\n`);
  console.log(zh ? `| 指标 | 类型 | 含义 |` : `| Metric | Type | Meaning |`);
  console.log('|---|---|---|');
  for (const m of items) {
    console.log(`| \`${m.name}\`${m.notLive ? ' †' : ''} | ${m.type} | ${cell(m.help)} |`);
  }
  console.log('');
}
