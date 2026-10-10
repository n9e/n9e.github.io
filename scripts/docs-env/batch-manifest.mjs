/**
 * 把某几个 section 里还是占位的页面整理成一份 JSON，交给写文档的人/agent。
 * 每页带中英标题、description（这就是提纲）和旧站对应的本地文件路径。
 *
 *   node scripts/docs-env/batch-manifest.mjs data query > /tmp/batch.json
 *   node scripts/docs-env/batch-manifest.mjs alerting events notifications
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const EN = path.join(ROOT, 'docs');
const ZH = path.join(ROOT, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current');
const LEGACY = '/Users/ning/gopath/src/github.com/flashcatcloud/fc-site/content/chinese/docs/content/flashcat-monitor/nightingale-v9/';
const OLD_SITE = 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v9/';

const sections = process.argv.slice(2);
if (!sections.length) { console.error('usage: batch-manifest.mjs <section>...'); process.exit(1); }

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : (/\.mdx?$/.test(e.name) ? [p] : []);
  });

const field = (s, k) => (new RegExp(`^${k}: "(.*)"$`, 'm').exec(s) || [])[1];

const out = {};
for (const sec of sections) {
  out[sec] = [];
  for (const f of walk(path.join(EN, sec)).sort()) {
    const en = fs.readFileSync(f, 'utf8');
    if (!/^planned: true$/m.test(en)) continue;
    const id = path.relative(EN, f).replace(/\.mdx?$/, '');
    const zhFile = path.join(ZH, path.relative(EN, f));
    const zh = fs.readFileSync(zhFile, 'utf8');
    const lg = field(en, 'legacy');
    let legacy = '';
    if (lg && lg.startsWith(OLD_SITE)) {
      const cand = LEGACY + lg.slice(OLD_SITE.length).replace(/\/$/, '') + '.md';
      legacy = fs.existsSync(cand) ? cand : `(旧站没有这个文件: ${lg})`;
    } else if (lg) {
      legacy = lg;
    }
    out[sec].push({ id, en: [field(en, 'title'), field(en, 'description')],
                    zh: [field(zh, 'title'), field(zh, 'description')], legacy });
  }
}

console.log(JSON.stringify(out, null, 1));
for (const [sec, rows] of Object.entries(out)) {
  const withLegacy = rows.filter((r) => r.legacy && !r.legacy.startsWith('(')).length;
  console.error(`  ${sec}: ${rows.length} 页，其中 ${withLegacy} 页有旧站正文可用`);
}
