/**
 * 从 n9e-mcp-server 模块源码生成 MCP 工具参考表。
 *
 *   node scripts/docs-env/gen-mcp-reference.mjs            # 英文
 *   node scripts/docs-env/gen-mcp-reference.mjs --locale zh
 *
 * 工具清单会随版本变，手抄一定会漂。这里直接读 go.mod 锁定的那个模块版本，
 * 按 AddReadTools / AddWriteTools 把每个工具分成读和写——
 * 「哪些是写工具」是安全边界，是这张表最要紧的一列。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';


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

const N9E = process.env.N9E_SRC || '/Users/ning/gopath/src/github.com/ccfos/nightingale';
const zh = process.argv.includes('--locale') && process.argv[process.argv.indexOf('--locale') + 1] === 'zh';

// go.mod 里锁的版本决定了工具清单，不要去猜
const goMod = fs.readFileSync(path.join(N9E, 'go.mod'), 'utf8');
const ver = /github\.com\/n9e\/n9e-mcp-server (v[^\s]+)/.exec(goMod)?.[1];
if (!ver) { console.error('go.mod 里找不到 n9e-mcp-server'); process.exit(1); }

const gopath = execFileSync('go', ['env', 'GOPATH'], { encoding: 'utf8' }).trim();
const MOD = path.join(gopath, 'pkg/mod/github.com/n9e', `n9e-mcp-server@${ver}`);
if (!fs.existsSync(MOD)) { console.error(`模块没下载：${MOD}`); process.exit(1); }

const API = path.join(MOD, 'pkg/api');

/** 解析一个 toolset 文件：名字、描述，以及读/写两组工具 */
function parseToolset(file) {
  const src = fs.readFileSync(file, 'utf8');
  const head = /NewToolset\(\s*"([^"]+)"\s*,\s*"([^"]*)"/.exec(src);
  if (!head) return null;

  // 工具声明形如  Name: "list_active_alerts",  Description: "...",
  const tools = [];
  const re = /Name:\s*"([^"]+)",\s*(?:\/\/[^\n]*\n\s*)?Description:\s*(`[^`]*`|"[^"]*")/g;
  let m;
  while ((m = re.exec(src))) {
    tools.push({ name: m[1], desc: m[2].slice(1, -1).replace(/\s+/g, ' ').trim(), at: m.index });
  }

  // 读写之分不在工具声明里，而在 AddReadTools(...) / AddWriteTools(...) 的参数表：
  //   ts.AddReadTools(listActiveAlertsTool(getClient), ...)
  //   ts.AddWriteTools(createAlertRuleTool(getClient), ...)
  // 每个构造函数 xxxTool() 里再声明 Name。所以要先把两组构造函数名收出来，
  // 再按「哪个构造函数返回了这个 Name」反查。
  const namesIn = (call) => {
    const i = src.indexOf(call);
    if (i < 0) return new Set();
    // 从左括号开始做括号匹配，取出整个参数表
    let depth = 0, j = src.indexOf('(', i);
    for (let k = j; k < src.length; k++) {
      if (src[k] === '(') depth++;
      else if (src[k] === ')' && --depth === 0) { j = k; break; }
    }
    const args = src.slice(src.indexOf('(', i) + 1, j);
    return new Set([...args.matchAll(/(\w+)\s*\(/g)].map((m) => m[1]));
  };
  const readFns = namesIn('AddReadTools');
  const writeFns = namesIn('AddWriteTools');

  // 每个 func xxxTool(...) { ... Name: "yyy" ... } 建立 构造函数 -> 工具名 的映射
  const owner = {};
  for (const m of src.matchAll(/func\s+(\w+)\s*\([^)]*\)\s*toolset\.ServerTool\s*\{/g)) {
    const start = m.index;
    const next = src.indexOf('\nfunc ', start + 1);
    const body = src.slice(start, next < 0 ? src.length : next);
    const nm = /Name:\s*"([^"]+)"/.exec(body);
    if (nm) owner[nm[1]] = m[1];
  }

  for (const t of tools) {
    const fn = owner[t.name];
    t.write = fn ? writeFns.has(fn) : false;
    t.unknown = !fn;
  }
  return { name: head[1], desc: head[2], tools };
}

const sets = fs.readdirSync(API)
  .filter((f) => f.endsWith('.go') && !f.endsWith('_test.go') && f !== 'tools.go')
  .map((f) => parseToolset(path.join(API, f)))
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

const total = sets.reduce((n, s) => n + s.tools.length, 0);
const writes = sets.reduce((n, s) => n + s.tools.filter((t) => t.write).length, 0);

// 同一份统计也写进 src/data/mcp.json：首页、对比页、介绍页上的「74 个工具 / 13 个工具集」
// 都从那里取（src/data/figures.ts），不再在文案里手抄数字。
const DATA = new URL('../../src/data/mcp.json', import.meta.url);
fs.writeFileSync(
  DATA,
  `${JSON.stringify({ version: ver, tools: total, readTools: total - writes, writeTools: writes, toolsets: sets.length }, null, 2)}\n`,
);
console.error(`已写入 ${path.relative(process.cwd(), DATA.pathname)}：${total} 个工具 / ${sets.length} 个工具集 / ${writes} 个写工具`);

console.log(`<!-- 由 scripts/docs-env/gen-mcp-reference.mjs 从 n9e-mcp-server ${ver} 生成，不要手改 -->\n`);
if (zh) {
  console.log(`共 **${total} 个工具**，分属 **${sets.length} 个工具集**，其中 ${writes} 个是写工具。\n`);
  console.log(`写工具默认**不注册**，要在 \`[HTTP.A2A]\` 里显式打开 \`MCPEnableWriteTools = true\`。\n`);
} else {
  console.log(`**${total} tools** across **${sets.length} toolsets**, ${writes} of them write tools.\n`);
  console.log(`Write tools are **not registered by default** — set \`MCPEnableWriteTools = true\` under \`[HTTP.A2A]\` to expose them.\n`);
}

for (const s of sets) {
  const w = s.tools.filter((t) => t.write).length;
  console.log(`### \`${s.name}\`\n`);
  console.log(`${cell(s.desc)}\n`);
  console.log(zh ? `| 工具 | 读/写 | 用途 |` : `| Tool | Access | What it does |`);
  console.log('|---|---|---|');
  for (const t of s.tools) {
    const acc = t.write ? (zh ? '**写**' : '**write**') : (zh ? '读' : 'read');
    console.log(`| \`${t.name}\` | ${acc} | ${cell(t.desc)} |`);
  }
  console.log('');
  if (w === 0) console.log(zh ? `这个工具集全是只读的。\n` : `This toolset is read-only.\n`);
}
