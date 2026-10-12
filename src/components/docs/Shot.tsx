import React from 'react';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import sizes from '@site/src/data/doc-shots.json';

/**
 * 一张产品界面截图，跟着站点主题切明暗。
 *
 *   <Shot src="/img/docs/data/form-mysql" alt="MySQL 数据源表单" />
 *
 * src 不带扩展名，组件自己拼 `.webp` 和 `.dark.webp`。
 * 中文页引用的是带 `.zh` 的那一份（`/img/docs/data/form-mysql.zh`），
 * 两个语言各引各的，因为界面文案不同。
 *
 * 图是 scripts/docs-env/shoot-docs.mjs 截的 PNG，再由 webp-docs.mjs 转成无损 WebP 并把尺寸
 * 写进 src/data/doc-shots.json；这里据此给 <img> 加 width/height，图片加载前就占好位，
 * 正文不会在图片到达时往下跳（CLS）。清单里没有的图只是少了尺寸，不会报错。
 *
 * 走 useBaseUrl 是因为中文站的 baseUrl 是 /zh/，写死绝对路径会 404。
 * 注册在 src/theme/MDXComponents.tsx 里，所以 .md 正文里直接用，不用 import。
 */
export default function Shot({ src, alt }: { src: string; alt: string }) {
  const size = (sizes as Record<string, number[]>)[src];
  return (
    <ThemedImage
      className="n9e-shot"
      alt={alt}
      width={size?.[0]}
      height={size?.[1]}
      loading="lazy"
      sources={{
        light: useBaseUrl(`${src}.webp`),
        dark: useBaseUrl(`${src}.dark.webp`),
      }}
    />
  );
}
