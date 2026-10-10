/**
 * 构建后处理：删掉 build/ 下 HTML 里的 NUL 字节（\x00）。
 *
 * React 18.3 的 renderToPipeableStream 在多字节字符（中文尤其）附近会往输出里
 * 混进一两个 \x00（facebook/react#31134，官方标为 not planned；Docusaurus 的
 * renderToHtml.js 里也留了指向这个 issue 的注释）。实测本站 372 个页面里 157 个中招，
 * 例如导语被渲染成「夜莺是开源告警\x00\x00引擎」。
 *
 * 浏览器解析时会把 NUL 丢掉，肉眼看不出；但爬虫、llms.txt 抓取器和任何文本提取工具
 * 看到的就是正文里的垃圾字节，grep 更是直接把文件当二进制。NUL 前后的字符都是完好的，
 * 它本身不携带信息，整段删掉就是正确结果。
 *
 * 升到 React 19 也能根治，但那是依赖大版本升级，要回归全部自定义主题组件；
 * 这里先用后处理兜住。换了 React 之后跑一次本脚本，输出为 0 个文件即可把它从
 * postbuild 里摘掉。
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'build');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield p;
  }
}

let scanned = 0;
let fixed = 0;
let bytes = 0;
for (const file of walk(root)) {
  scanned += 1;
  const buf = fs.readFileSync(file);
  if (!buf.includes(0)) continue;
  const clean = Buffer.from(buf.filter((b) => b !== 0));
  fs.writeFileSync(file, clean);
  fixed += 1;
  bytes += buf.length - clean.length;
}

console.log(`[strip-nul] 扫描 ${scanned} 个 HTML，清理 ${fixed} 个文件，共 ${bytes} 个 NUL 字节`);
