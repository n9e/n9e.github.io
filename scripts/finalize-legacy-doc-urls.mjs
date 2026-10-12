/** Complete the official plugin's static aliases after both locale builds. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { legacyLocales, entriesForLocale, isExternalTarget, targetForLocale } from './legacy-doc-urls.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let count = 0;
const marker = '<!-- n9e-legacy-doc-redirect -->';
/** The target page's HTML file: `/docs/x` → docs/x.html, a locale home `/zh/` → zh/index.html. */
export const targetFile = (to) => (to.endsWith('/') ? `${to}index.html` : `${to}.html`);
// Same shape as the official plugin's page, for targets it cannot express (off-site URLs).
const offSiteAlias = (to, label) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${escape(to)}">
    <link rel="canonical" href="${escape(to)}" />
  </head>
  <script>
    window.location.replace(${JSON.stringify(to)} + window.location.search + window.location.hash);
  </script>
  <body><p><a href="${escape(to)}">${label}</a></p></body>
</html>
`;
for (const { locale, prefix } of legacyLocales) {
  for (const item of entriesForLocale(locale)) {
    if (item.action === 'retire') continue;
    const from = `${prefix}${item.path}`;
    const to = targetForLocale(item, prefix);
    const alias = path.join(root, from, 'index.html');
    const label = locale === 'en' ? 'This page has moved. Continue to the documentation.' : '此页面已迁移，点击继续阅读文档。';
    let html;
    if (isExternalTarget(to)) {
      await fs.mkdir(path.dirname(alias), { recursive: true });
      html = offSiteAlias(to, label);
    } else {
      const original = await fs.readFile(alias, 'utf8');
      if (!original.includes('http-equiv="refresh"')) throw new Error(`Missing official redirect page: ${from}`);
      // Use the target page's canonical, so changing siteConfig.url updates aliases too.
      const destination = await fs.readFile(path.join(root, targetFile(to)), 'utf8');
      const canonical = destination.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
      if (!canonical) throw new Error(`Missing target canonical: ${to}`);
      html = original
        .replace(/(<link rel="canonical" href=")[^"]+("\s*\/>)/, (_, start, end) => start + canonical + end)
        .replace(/window\.location\.href = ([^;]+);/, 'window.location.replace($1);')
        .replace(/(?:\s*<body>[\s\S]*<\/body>)?\s*<\/html>/, `\n  <body><p><a href="${escape(to)}">${label}</a></p></body>\n</html>`);
    }
    const markedHtml = html.startsWith(marker) ? html : `${marker}\n${html}`;
    await fs.writeFile(alias, markedHtml);
    if (item.action === 'redirect') {
      // GitHub Pages prefers an exact .html file for slashless URLs. Keep the
      // directory alias as well so old trailing-slash links also start with 200.
      const slashlessFile = path.join(root, `${from}.html`);
      try {
        await fs.writeFile(slashlessFile, markedHtml, { flag: 'wx' });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const previous = await fs.readFile(slashlessFile, 'utf8');
        if (!previous.startsWith(marker)) throw new Error(`Refusing to overwrite a current page: ${from}`);
        await fs.writeFile(slashlessFile, markedHtml);
      }
    }
    count++;
  }
}
console.log(`Completed ${count} legacy documentation aliases.`);
