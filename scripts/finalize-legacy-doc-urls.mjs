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
// A removed page whose old links deserve a one-line notice rather than a bare 404.
// noindex, no redirect, no canonical: it must not compete with the suggested page.
const noticeMarker = '<!-- n9e-legacy-doc-notice -->';
const notice = (locale, to, docs) => {
  const zh = locale === 'zh-Hans';
  const t = zh
    ? { lang: 'zh-CN', title: '页面已下线', lead: '这个页面已经从夜莺文档里移除，没有对应的新页面。', suggest: '可以从产品简介继续', docs: '或者回到文档首页' }
    : { lang: 'en', title: 'Page removed', lead: 'This page was removed from the Nightingale documentation and has no replacement.', suggest: 'Continue with the introduction', docs: 'or go to the documentation home' };
  return `${noticeMarker}
<!DOCTYPE html>
<html lang="${t.lang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>${t.title} · Nightingale</title>
    <style>body{font:16px/1.6 system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1.5rem;color:#1f2933}a{color:#0b5fff}</style>
  </head>
  <body>
    <h1>${t.title}</h1>
    <p>${t.lead}</p>
    <p><a href="${escape(to)}">${t.suggest}</a>${zh ? '，' : ', '}<a href="${escape(docs)}">${t.docs}</a>${zh ? '。' : '.'}</p>
  </body>
</html>
`;
};

for (const { locale, prefix } of legacyLocales) {
  for (const item of entriesForLocale(locale)) {
    if (item.action === 'retire') continue;
    const from = `${prefix}${item.path}`;
    const to = targetForLocale(item, prefix);
    const alias = path.join(root, from, 'index.html');
    if (item.action === 'explain') {
      const html = notice(locale, to, `${prefix}/docs`);
      await fs.mkdir(path.dirname(alias), { recursive: true });
      await fs.writeFile(alias, html, { flag: 'wx' });
      await fs.writeFile(path.join(root, `${from}.html`), html, { flag: 'wx' });
      count++;
      continue;
    }
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
