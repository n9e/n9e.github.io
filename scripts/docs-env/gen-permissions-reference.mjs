/**
 * 从源码生成权限矩阵：每个权限点、哪些内置角色持有它、它守着哪个接口。
 *
 *   node scripts/docs-env/gen-permissions-reference.mjs [--locale zh]
 *
 * 两个来源合起来才完整：
 *   - `pkg/ormx/database_init.go` 的 role_operations 种子 —— 谁有这个权限点
 *   - `center/router/router.go` 的 rt.perm("...") —— 这个权限点守着哪些接口
 * Admin 不在种子里，因为它在代码里直接跳过权限校验（models 里的 IsAdmin）。
 */
import fs from 'node:fs';
import path from 'node:path';


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

const initSrc = fs.readFileSync(path.join(N9E, 'pkg/ormx/database_init.go'), 'utf8');
const routerSrc = fs.readFileSync(path.join(N9E, 'center/router/router.go'), 'utf8');

// 角色 -> 权限点
const holders = {};
for (const m of initSrc.matchAll(/RoleName:\s*"(\w+)",\s*Operation:\s*"([^"]+)"/g)) {
  (holders[m[2]] ||= new Set()).add(m[1]);
}

// 权限点 -> 它守着的接口
const guards = {};
for (const line of routerSrc.split('\n')) {
  const m = /pages\.(GET|POST|PUT|DELETE)\("([^"]+)".*rt\.perm\("([^"]+)"\)/.exec(line);
  if (m) (guards[m[3]] ||= []).push(`${m[1]} ${m[2]}`);
}

const all = [...new Set([...Object.keys(holders), ...Object.keys(guards)])].sort();

console.log('<!-- 由 scripts/docs-env/gen-permissions-reference.mjs 生成，不要手改 -->\n');
if (zh) {
  console.log(`共 **${all.length} 个权限点**。\`Admin\` 角色不在这张表里——它在代码里直接跳过权限校验，`);
  console.log(`所有权限点都视为持有，并且不受业务组成员关系限制。\n`);
  console.log(`权限点只是第一层。能不能操作某条具体数据，还要看你所在的团队对那条数据所属的`);
  console.log(`业务组有没有读写权——两层是 AND 关系。\n`);
  console.log(`| 权限点 | Standard | Guest | 守着的接口 |`);
} else {
  console.log(`**${all.length} permission points.** The \`Admin\` role is not in this table — it skips the`);
  console.log(`permission check in code, so it holds every point and is not bounded by business-group`);
  console.log(`membership either.\n`);
  console.log(`A permission point is only the first layer. Whether you may act on a given object also`);
  console.log(`depends on whether one of your teams has write on the business group that owns it — the`);
  console.log(`two are combined with AND.\n`);
  console.log(`| Permission point | Standard | Guest | Guards |`);
}
console.log('|---|:---:|:---:|---|');
for (const p of all) {
  const h = holders[p] || new Set();
  const g = (guards[p] || []).map((x) => `\`${x}\``).join('<br/>') || (zh ? '（只用于菜单可见性）' : '(menu visibility only)');
  console.log(`| \`${p}\` | ${h.has('Standard') ? '✅' : ''} | ${h.has('Guest') ? '✅' : ''} | ${g} |`);
}
