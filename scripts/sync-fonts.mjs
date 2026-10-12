#!/usr/bin/env node
/**
 * 把 @fontsource 的字体文件复制到 static/fonts，并生成 src/css/fonts.css。
 *
 *   node scripts/sync-fonts.mjs
 *
 * 之前直接把 @fontsource 的 CSS 塞进 customCss，文件名由 webpack 加哈希，
 * 没法在 <head> 里 preload；字体在首帧之后才到，文字从回退字体切到 Archivo 时
 * 整段重排，这是线上 CLS 的主要来源之一（Lighthouse 标为 "Web font loaded"）。
 *
 * 这里做两件事：
 * 1. 文件名固定，docusaurus.config.ts 的 headTags 能 preload 首屏用到的几个字重；
 * 2. 给每个字重配一个度量匹配的回退字体（Arial / Menlo，用 size-adjust 和
 *    ascent/descent-override 对齐），字体没到时文字占的位置和到了之后几乎一样。
 *    覆盖值用 scripts/font-metrics.py 算，改字体或字重时重算。
 *
 * 只收 latin 和 latin-ext 子集：站点的中文走系统字体，Archivo 只管西文。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'static', 'fonts');
const OUT_CSS = path.join(ROOT, 'src', 'css', 'fonts.css');

const FAMILIES = [
  { pkg: 'archivo', family: 'Archivo', weights: [400, 500, 600, 700, 800], subsets: ['latin', 'latin-ext'] },
  { pkg: 'jetbrains-mono', family: 'JetBrains Mono', weights: [400, 500, 700], subsets: ['latin'] },
];

/** 回退字体的度量覆盖（scripts/font-metrics.py 的输出换算）。Archivo 400/500 对 Arial，600+ 对 Arial Bold。 */
const FALLBACKS = `
/* 度量匹配的回退字体：Archivo 没到时用 Arial 占位，字宽和行高按 Archivo 的度量调过，切换时几乎不重排 */
@font-face { font-family: 'Archivo Fallback'; font-weight: 400; src: local('Arial'), local('Liberation Sans'); size-adjust: 115.77%; ascent-override: 75.84%; descent-override: 18.14%; line-gap-override: 0%; }
@font-face { font-family: 'Archivo Fallback'; font-weight: 500; src: local('Arial'), local('Liberation Sans'); size-adjust: 117.58%; ascent-override: 74.67%; descent-override: 17.86%; line-gap-override: 0%; }
@font-face { font-family: 'Archivo Fallback'; font-weight: 600; src: local('Arial Bold'), local('Arial-BoldMT'), local('Liberation Sans Bold'); size-adjust: 110.34%; ascent-override: 79.57%; descent-override: 19.03%; line-gap-override: 0%; }
@font-face { font-family: 'Archivo Fallback'; font-weight: 700; src: local('Arial Bold'), local('Arial-BoldMT'), local('Liberation Sans Bold'); size-adjust: 113.27%; ascent-override: 77.51%; descent-override: 18.54%; line-gap-override: 0%; }
@font-face { font-family: 'Archivo Fallback'; font-weight: 800; src: local('Arial Bold'), local('Arial-BoldMT'), local('Liberation Sans Bold'); size-adjust: 117.65%; ascent-override: 74.63%; descent-override: 17.85%; line-gap-override: 0%; }
/* JetBrains Mono 对 Menlo（macOS）；Consolas / DejaVu 只是兜底，度量按 Menlo 算 */
@font-face { font-family: 'JetBrains Mono Fallback'; src: local('Menlo'), local('Consolas'), local('DejaVu Sans Mono'); size-adjust: 99.66%; ascent-override: 102.35%; descent-override: 30.10%; line-gap-override: 0%; }
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
let css = '/* 由 scripts/sync-fonts.mjs 生成，不要手改。文件在 static/fonts，首屏字重在 docusaurus.config.ts 里 preload。 */\n';
let copied = 0;
for (const { pkg, family, weights, subsets } of FAMILIES) {
  const dir = path.join(ROOT, 'node_modules', '@fontsource', pkg);
  for (const weight of weights) {
    const source = fs.readFileSync(path.join(dir, `${weight}.css`), 'utf8');
    for (const block of source.match(/\/\* [^*]+ \*\/\s*@font-face \{[^}]+\}/g) ?? []) {
      const subset = block.match(new RegExp(`/\\* ${pkg}-([a-z-]+)-${weight}-normal \\*/`))?.[1];
      if (!subset || !subsets.includes(subset)) continue;
      const file = block.match(/url\(\.\/files\/([^)]+\.woff2)\)/)?.[1];
      const range = block.match(/unicode-range: ([^;]+);/)?.[1];
      if (!file || !range) throw new Error(`解析失败：${pkg} ${weight} ${subset}`);
      fs.copyFileSync(path.join(dir, 'files', file), path.join(OUT_DIR, file));
      copied++;
      css += `@font-face { font-family: '${family}'; font-style: normal; font-display: swap; font-weight: ${weight}; src: url(/fonts/${file}) format('woff2'); unicode-range: ${range}; }\n`;
    }
  }
}
css += FALLBACKS;
fs.writeFileSync(OUT_CSS, css);
console.log(`复制 ${copied} 个字体文件到 static/fonts，生成 src/css/fonts.css`);
