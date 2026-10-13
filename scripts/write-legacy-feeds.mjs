/**
 * 旧 Hugo 站的 RSS 路径：/index.xml、/docs/index.xml、/docs/<section>/index.xml、/blog/index.xml、
 * /contributors/index.xml（中英各一套）。搜索引擎和订阅器还在抓，现在全是 404。
 * 这里在每个路径写一份合法的 RSS 2.0：最新的夜莺 / Categraf 发布，加一条「文档已搬到新站」。
 * 内容来自 src/data/releases.json，不额外联网；「搬家」那条的日期固定为新站首次上线日，
 * 不随构建变化，订阅器不会把它当新文章反复推。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = path.join(root, 'build');
const releases = JSON.parse(await fs.readFile(path.join(root, 'src/data/releases.json'), 'utf8'));
const SITE = 'https://n9e.github.io';
const MOVED_ON = '2026-10-10'; // 新站首次部署（54cbdc54）
// 旧站 docs 下的分区（scripts/legacy-doc-inventory.json 里路径的第二段）
const SECTIONS = ['agent', 'faq', 'install', 'practice', 'prologue', 'usage', 'usecase'];
const escape = (v) => v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const rfc822 = (d) => new Date(`${d}T00:00:00Z`).toUTCString();

const locales = [
  {
    prefix: '', lang: 'en',
    title: 'Nightingale (n9e)',
    description: 'Open-source alerting engine: releases and documentation updates.',
    moved: { title: 'Documentation has moved to n9e.github.io', body: 'The Nightingale documentation now lives at n9e.github.io/docs. This feed only carries release announcements.' },
    release: (name, tag) => `${name} ${tag} released`,
  },
  {
    prefix: '/zh', lang: 'zh-CN',
    title: '夜莺监控 Nightingale (n9e)',
    description: '开源监控告警引擎：版本发布与文档更新。',
    moved: { title: '文档已迁移到 n9e.github.io', body: '夜莺文档现在位于 n9e.github.io/zh/docs。这个订阅源只推送版本发布。' },
    release: (name, tag) => `${name} ${tag} 发布`,
  },
];

function feed(l) {
  const home = `${SITE}${l.prefix}/`;
  const items = [
    { title: l.moved.title, link: `${home}docs`, date: MOVED_ON, body: l.moved.body },
    { title: l.release('Nightingale', releases.nightingale.tag), link: releases.nightingale.notesUrl, date: releases.nightingale.publishedAt, body: releases.nightingale.notesUrl },
    { title: l.release('Categraf', releases.categraf.tag), link: releases.categraf.notesUrl, date: releases.categraf.publishedAt, body: releases.categraf.notesUrl },
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  const xml = items.map((i) => `    <item>
      <title>${escape(i.title)}</title>
      <link>${escape(i.link)}</link>
      <guid isPermaLink="false">${escape(`${i.link}#${i.date}`)}</guid>
      <pubDate>${rfc822(i.date)}</pubDate>
      <description>${escape(i.body)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(l.title)}</title>
    <link>${home}</link>
    <description>${escape(l.description)}</description>
    <language>${l.lang}</language>
    <atom:link href="${home}index.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rfc822(items[0].date)}</lastBuildDate>
${xml}
  </channel>
</rss>
`;
}

let count = 0;
for (const l of locales) {
  const xml = feed(l);
  const dirs = ['', '/docs', ...SECTIONS.map((s) => `/docs/${s}`), '/blog', '/contributors'];
  for (const dir of dirs) {
    const file = path.join(build, `${l.prefix}${dir}`, 'index.xml');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, xml, { flag: 'wx' }); // 绝不覆盖已有文件
    count++;
  }
}
console.log(`Wrote ${count} legacy RSS feeds.`);
