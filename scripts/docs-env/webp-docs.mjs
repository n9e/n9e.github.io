#!/usr/bin/env node
/**
 * 把 static/img/docs 下的截图 PNG 转成 WebP，并记录尺寸。
 *
 *   node scripts/docs-env/webp-docs.mjs
 *
 * shoot-docs.mjs 出的是 PNG（playwright 只会出 PNG/JPEG）。界面截图是大片纯色加文字，
 * 无损 WebP 比 256 色 PNG 还小三到五成，而有损模式反而要到 q75 才追平 PNG，文字边缘还会发虚，
 * 所以这里用 -lossless。-z 9 一张要四秒，按 CPU 核数并行。
 * 转完删掉 PNG，<Shot> 组件只认 .webp；尺寸写进 src/data/doc-shots.json，
 * 组件据此给 <img> 加 width/height，图片加载前就占好位，正文不会跳。
 *
 * 需要系统装有 cwebp（brew install webp）。已经是 WebP 的图只重新统计尺寸。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const IMG = path.join(ROOT, 'static/img/docs');
const OUT = path.join(ROOT, 'src/data/doc-shots.json');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/** WebP 的三种容器各自的尺寸字段；不引第三方包 */
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`不是 WebP：${file}`);
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  if (chunk === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  throw new Error(`未知 WebP 块 ${chunk}：${file}`);
}

let converted = 0;
let before = 0;
let after = 0;
const queue = [...walk(IMG)].filter((f) => f.endsWith('.png'));
async function worker() {
  for (let file = queue.shift(); file; file = queue.shift()) {
    const webp = file.replace(/\.png$/, '.webp');
    before += fs.statSync(file).size;
    await run('cwebp', ['-quiet', '-lossless', '-z', '9', '-metadata', 'none', file, '-o', webp]);
    after += fs.statSync(webp).size;
    fs.unlinkSync(file);
    converted++;
  }
}
await Promise.all(Array.from({ length: os.cpus().length }, worker));

const sizes = {};
for (const file of [...walk(IMG)].filter((f) => f.endsWith('.webp')).sort()) {
  // 键是 <Shot src> 的写法：/img/docs/<section>/<name>[.zh]，取浅色图的尺寸，暗色图同一视口出的
  if (file.endsWith('.dark.webp')) continue;
  const key = '/' + path.relative(path.join(ROOT, 'static'), file).replace(/\.webp$/, '');
  sizes[key] = webpSize(file);
}
fs.writeFileSync(OUT, `${JSON.stringify(sizes, null, 2)}\n`);
const mb = (n) => (n / 1048576).toFixed(1);
console.log(`转换 ${converted} 张 PNG（${mb(before)} MB → ${mb(after)} MB），记录 ${Object.keys(sizes).length} 组尺寸到 ${path.relative(ROOT, OUT)}`);
