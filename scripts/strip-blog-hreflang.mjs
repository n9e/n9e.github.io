/**
 * 构建后处理：博客只有英文（docusaurus.config.ts 的 blog 配置），但 Docusaurus 会给每个页面
 * 输出所有语言的 hreflang。英文博客页上那条中文 alternate 指向 /zh/blog/...，
 * 中文站没有这些页面，搜索引擎会把它当成错误的语言对。这里把 build/blog 下指向
 * /zh/blog 的 alternate 删掉；en 与 x-default 保留。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const blog = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build', 'blog');
// 按地址匹配，不按 hreflang 值：中文站的 htmlLang 是 zh-CN，以后改了也不受影响
const ZH = /<link[^>]*rel="alternate"[^>]*href="[^"]*\/zh\/blog[^"]*"[^>]*>/g;
let pages = 0;

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

try {
  await fs.access(blog);
} catch {
  console.log('No build/blog, skipping hreflang cleanup.');
  process.exit(0);
}
for await (const file of walk(blog)) {
  const html = await fs.readFile(file, 'utf8');
  const next = html.replace(ZH, '');
  if (next !== html) {
    await fs.writeFile(file, next);
    pages++;
  }
}
// /blog 本身是 build/blog.html（trailingSlash: false），不在 build/blog 目录里
const index = `${blog}.html`;
try {
  const html = await fs.readFile(index, 'utf8');
  const next = html.replace(ZH, '');
  if (next !== html) { await fs.writeFile(index, next); pages++; }
} catch {}
console.log(`Removed /zh/blog hreflang from ${pages} blog pages.`);
