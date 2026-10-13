/**
 * 构建后处理：给每个有 .md 副本的页面在 <head> 里加两条发现链接。
 *
 *   <link rel="alternate" type="text/markdown" href="https://n9e.github.io/docs/x.md">
 *   <link rel="describedby" href="https://n9e.github.io/llms.txt">
 *
 * llms.txt 规范的 Proposal 一节推荐这两条，让 AI 爬虫从任意 HTML 页直达 Markdown 原文和
 * 覆盖它的 llms.txt。规范同时给出了 HTTP Link 头和 Accept: text/markdown 内容协商两条路，
 * GitHub Pages 都做不了，所以只剩页内 link 标签。
 *
 * 按文件存在判断，不按路由猜：search、404、跳转别名和通知页都没有 .md 副本，自然跳过。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');
const SITE = 'https://n9e.github.io';
let count = 0;

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

for await (const file of walk(root)) {
  const md = file.replace(/\.html$/, '.md');
  try {
    await fs.access(md);
  } catch {
    continue;
  }
  const html = await fs.readFile(file, 'utf8');
  if (html.startsWith('<!--') || html.includes('type="text/markdown"')) continue;
  const rel = `/${path.relative(root, md).split(path.sep).join('/')}`;
  const llms = rel.startsWith('/zh/') ? '/zh/llms.txt' : '/llms.txt';
  const tags = `<link rel="alternate" type="text/markdown" href="${SITE}${rel}"><link rel="describedby" href="${SITE}${llms}">`;
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) throw new Error(`No </head> in ${file}`);
  await fs.writeFile(file, html.slice(0, headEnd) + tags + html.slice(headEnd));
  count++;
}
console.log(`Linked ${count} Markdown alternates.`);
