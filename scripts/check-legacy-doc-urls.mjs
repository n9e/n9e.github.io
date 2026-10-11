import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { legacyDocUrls, legacyLocales, entriesForLocale } from './legacy-doc-urls.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const safePath = /^\/docs(?:\/[a-z0-9-]+)*$/;

export function validateRegistry(items, inventory) {
  for (const { locale } of legacyLocales) {
    const local = items.filter((item) => !item.locales || item.locales.includes(locale));
    const paths = new Set();
    for (const item of local) {
      assert(safePath.test(item.path), `Invalid source path: ${item.path}`);
      assert(!paths.has(item.path), `Duplicate legacy source: ${locale} ${item.path}`);
      paths.add(item.path);
      assert(['redirect', 'keep', 'restore', 'retire'].includes(item.action), `Invalid action: ${item.path}`);
      assert(item.reason && item.source, `Missing content decision or source: ${item.path}`);
      if (item.action === 'redirect') {
        assert(safePath.test(item.to), `Invalid target: ${item.path}`);
        assert.notEqual(item.path, item.to, `Self redirect: ${item.path}`);
        const next = local.find((candidate) => candidate.path === item.to);
        assert(!next || ['keep', 'restore'].includes(next.action), `Redirect chain or retired target: ${item.path}`);
      } else {
        assert(!item.to, `Unexpected target on ${item.action}: ${item.path}`);
      }
    }
    assert.deepEqual(
      local.filter((item) => !item.additional).map((item) => item.path).sort(),
      [...inventory.paths].sort(),
      `The ${locale} mapping must cover the frozen Hugo inventory exactly`,
    );
  }
}

async function checkBuild() {
  const inventory = JSON.parse(await fs.readFile(path.join(root, 'scripts/legacy-doc-inventory.json'), 'utf8'));
  validateRegistry(legacyDocUrls, inventory);
  const build = path.join(root, 'build');
  const reports = [];
  for (const { locale, prefix } of legacyLocales) {
    const sitemap = load(await fs.readFile(path.join(build, prefix, 'sitemap.xml'), 'utf8'), { xmlMode: true });
    const indexed = new Set(sitemap('loc').map((_, element) => new URL(sitemap(element).text()).pathname).get());
    for (const item of entriesForLocale(locale)) {
      const from = `${prefix}${item.path}`;
      const to = `${prefix}${item.to ?? item.path}`;
      if (item.action === 'retire') {
        for (const relative of [`${from}.html`, `${from}/index.html`]) {
          await assert.rejects(fs.access(path.join(build, relative)), { code: 'ENOENT' }, `Retired page was emitted: ${from}`);
        }
        assert(!indexed.has(from), `Retired page appears in sitemap: ${from}`);
        reports.push({ from, action: item.action, expectedStatus: 404 });
        continue;
      }
      const targetHtml = await fs.readFile(path.join(build, `${to}.html`), 'utf8');
      const target = load(targetHtml);
      assert(target('article h1').text().trim(), `Target has no documentation title: ${to}`);
      assert(!target('article').text().includes('Not written yet'), `Target is a placeholder: ${to}`);
      const canonical = target('link[rel="canonical"]').attr('href');
      assert.equal(new URL(canonical).pathname, to, `Non-final canonical: ${to}`);
      for (const file of [`${from}/index.html`, ...(item.action === 'redirect' ? [`${from}.html`] : [])]) {
        const html = await fs.readFile(path.join(build, file), 'utf8');
        const alias = load(html);
        assert.equal(alias('meta[http-equiv="refresh"]').attr('content'), `0; url=${to}`, `Wrong refresh: ${file}`);
        assert.equal(alias('link[rel="canonical"]').attr('href'), canonical, `Wrong alias canonical: ${file}`);
        assert(html.includes('window.location.replace('), `Alias adds a history entry: ${file}`);
        assert(html.includes('window.location.search + window.location.hash'), `Alias drops URL parameters: ${file}`);
        assert.equal(alias('body a').attr('href'), to, `Missing manual fallback: ${file}`);
        assert(!html.includes('hm.baidu.com') && !alias('script[src]').length, `Alias loads app or analytics: ${file}`);
      }
      if (item.action === 'redirect') assert(!indexed.has(from), `Redirect appears in sitemap: ${from}`);
      // Check relative site assets used by restored pages, including images.
      if (item.action === 'restore') {
        for (const element of target('article img[src], article source[srcset]').toArray()) {
          const value = target(element).attr('src') ?? target(element).attr('srcset')?.split(/[ ,]/)[0];
          if (value?.startsWith('/')) await fs.access(path.join(build, decodeURI(value.split(/[?#]/)[0])));
        }
      }
      reports.push({ from, action: item.action, to, canonical, expectedStatus: 200 });
    }
  }
  await fs.writeFile(path.join(build, 'legacy-doc-url-report.json'), JSON.stringify(reports, null, 2) + '\n');
  console.log(`Verified ${reports.length} historical documentation URLs, slash aliases, canonical URLs and sitemaps.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkBuild();
}
