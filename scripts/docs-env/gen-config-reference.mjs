/**
 * 从 nightingale 的 etc/config.toml 和 etc/edge/edge.toml 生成配置项参考表。
 *
 *   node scripts/docs-env/gen-config-reference.mjs > /tmp/config-ref.md
 *   node scripts/docs-env/gen-config-reference.mjs --locale zh
 *
 * 配置项这类东西不该人肉抄——版本一变就漂。这个脚本把注释和默认值直接读出来，
 * 版本升级后重跑一遍即可。
 *
 * 注意：配置文件里的注释既有说明也有「被注释掉的配置项样例」，两者要分开。
 * 以 `# Key = value` 形状出现的是样例（默认不启用），其余是说明文字。
 */
import fs from 'node:fs';


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

const SRC = process.env.N9E_SRC || '/Users/ning/gopath/src/github.com/ccfos/nightingale';
const zh = process.argv.includes('--locale') && process.argv[process.argv.indexOf('--locale') + 1] === 'zh';

const T = zh
  ? { key: '配置项', def: '默认值', note: '说明', commented: '（默认注释掉）', section: '段' }
  : { key: 'Key', def: 'Default', note: 'Notes', commented: '(commented out by default)', section: 'Section' };

function parse(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const out = [];
  let section = '';
  let notes = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { notes = []; continue; }

    const sec = /^\[\[?([A-Za-z0-9._]+)\]\]?$/.exec(line);
    if (sec) { section = sec[1]; notes = []; continue; }

    if (line.startsWith('#')) {
      // 配置文件里成对注释的行（`# # rotate by time`）要把两层 # 都剥掉
      const body = line.replace(/^#+\s?/, '').replace(/^#+\s?/, '');
      // 被注释掉的配置项样例，形如 `# MCPToolsets = ["alerts"]`
      const sample = /^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(body);
      if (sample) {
        out.push({ section, key: sample[1], def: sample[2], notes: notes.join(' '), commented: true });
        notes = [];
      } else {
        notes.push(body);
      }
      continue;
    }

    const kv = /^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+?)(?:\s*#.*)?$/.exec(line);
    if (kv) {
      out.push({ section, key: kv[1], def: kv[2], notes: notes.join(' '), commented: false });
      notes = [];
    }
  }
  return out;
}

function render(file, title) {
  const rows = parse(file);
  const bySection = {};
  for (const r of rows) (bySection[r.section] ||= []).push(r);

  console.log(`## ${title}\n`);
  for (const [sec, items] of Object.entries(bySection)) {
    console.log(`### \`[${sec}]\`\n`);
    console.log(`| ${T.key} | ${T.def} | ${T.note} |`);
    console.log('|---|---|---|');
    for (const i of items) {
      const note = cell(i.notes);
      const suffix = i.commented ? ` ${T.commented}` : '';
      console.log(`| \`${i.key}\` | \`${i.def}\`${suffix} | ${note} |`);
    }
    console.log('');
  }
}

console.log(`<!-- 由 scripts/docs-env/gen-config-reference.mjs 生成，不要手改；`);
console.log(`     夜莺版本变了就重跑一次 -->\n`);
render(`${SRC}/etc/config.toml`, zh ? 'config.toml（Center / Alert / Pushgw）' : 'config.toml (Center / Alert / Pushgw)');
render(`${SRC}/etc/edge/edge.toml`, zh ? 'edge.toml（n9e-edge）' : 'edge.toml (n9e-edge)');
