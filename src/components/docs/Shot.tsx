import React from 'react';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

/**
 * 一张产品界面截图，跟着站点主题切明暗。
 *
 *   <Shot src="/img/docs/data/form-mysql" alt="MySQL 数据源表单" />
 *
 * src 不带扩展名，组件自己拼 `.png` 和 `.dark.png`。
 * 中文页引用的是带 `.zh` 的那一份（`/img/docs/data/form-mysql.zh`），
 * 两个语言各引各的，因为界面文案不同。
 *
 * 走 useBaseUrl 是因为中文站的 baseUrl 是 /zh/，写死绝对路径会 404。
 * 注册在 src/theme/MDXComponents.tsx 里，所以 .md 正文里直接用，不用 import。
 */
export default function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <ThemedImage
      className="n9e-shot"
      alt={alt}
      sources={{
        light: useBaseUrl(`${src}.png`),
        dark: useBaseUrl(`${src}.dark.png`),
      }}
    />
  );
}
