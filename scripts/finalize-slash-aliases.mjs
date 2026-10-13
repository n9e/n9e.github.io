/**
 * 收尾带斜杠别名页（docusaurus.config.ts 里 createRedirects 生成的 /docs/x/ → /docs/x）。
 *
 * 官方插件写出的跳转页有两处不合适：canonical 是站内相对路径（/docs/x），搜索引擎不认；
 * 跳转用 location.href，会留一条历史记录，用户按「返回」又被弹回来。
 * 这里把 canonical 换成目标页自己的绝对 canonical，跳转改成 replace，并加一个标记，
 * 和 finalize-legacy-doc-urls.mjs 处理过的历史别名区分开。
 * 在它之后跑：历史别名已带自己的标记，这里跳过。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');
const marker = '<!-- n9e-trailing-slash-alias -->';
let count = 0;

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name === 'index.html') yield full;
  }
}

for await (const file of walk(root)) {
  const html = await fs.readFile(file, 'utf8');
  if (html.startsWith('<!--')) continue; // 已由别的收尾脚本处理
  const to = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/)?.[1];
  if (!to || !to.startsWith('/')) continue;
  const targetFile = path.join(root, to.endsWith('/') ? `${to}index.html` : `${to}.html`);
  const destination = await fs.readFile(targetFile, 'utf8');
  const canonical = destination.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  if (!canonical) throw new Error(`Missing target canonical: ${to}`);
  const fixed = html
    .replace(/(<link rel="canonical" href=")[^"]+("\s*\/>)/, (_, start, end) => start + canonical + end)
    .replace(/window\.location\.href = ([^;]+);/, 'window.location.replace($1);');
  await fs.writeFile(file, `${marker}\n${fixed}`);
  count++;
}
console.log(`Completed ${count} trailing-slash aliases.`);
