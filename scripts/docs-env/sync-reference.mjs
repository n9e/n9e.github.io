/**
 * 把生成器的输出灌进参考手册页面里的标记块。
 *
 *   node scripts/docs-env/sync-reference.mjs
 *
 * 页面正文是手写的，表格是生成的。两者用注释标记隔开：
 *
 *   <!-- generated:gen-config-reference -->
 *   ...这一段由脚本重写，不要手改...
 *   <!-- /generated -->
 *
 * 版本升级后重跑这个脚本即可，正文不会被动到。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '../..');
const EN = path.join(ROOT, 'docs');
const ZH = path.join(ROOT, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : (/\.mdx?$/.test(e.name) ? [p] : []);
  });

const gen = (script, locale) =>
  execFileSync('node', [path.join(ROOT, 'scripts/docs-env', script + '.mjs'),
                        ...(locale === 'zh' ? ['--locale', 'zh'] : [])],
               { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    // 生成器自己会打一行 HTML 注释说明出处，页面里已经有标记了，去掉免得重复
    .replace(/^<!--[^>]*-->\n\n?/, '')
    .trim();

let touched = 0;
for (const [dir, locale] of [[EN, 'en'], [ZH, 'zh']]) {
  for (const file of walk(dir)) {
    const src = fs.readFileSync(file, 'utf8');
    // 中间可能是空的（第一次同步），所以两侧的换行都要可选
    const re = /(<!-- generated:([a-z-]+) -->)\n?[\s\S]*?\n?(<!-- \/generated -->)/g;
    if (!re.test(src)) continue;
    re.lastIndex = 0;
    const out = src.replace(re, (_m, open, script, close) => `${open}\n${gen(script, locale)}\n${close}`);
    if (out !== src) {
      fs.writeFileSync(file, out);
      console.log(`  ${path.relative(ROOT, file)}`);
      touched++;
    }
  }
}
console.log(touched ? `\n更新了 ${touched} 个文件` : '没有需要更新的标记块');
