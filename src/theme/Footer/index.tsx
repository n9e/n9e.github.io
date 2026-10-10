import React, { type ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import Footer from '@theme-original/Footer';

/** 与 src/theme/SearchBar 同一条判断：带不带语言前缀都算文档路由 */
const DOCS_PATH = /(^|\/)docs(\/|$)/;

/**
 * 文档页不渲染四栏大页脚。
 * 那四栏是给第一次来官网的人看的，文档内页的读者已经在侧栏里，四栏和侧栏重复；
 * 而且页脚一来就把吸顶的侧栏从中间切断。文档页的收尾是正文栏里的一行小页脚
 * （src/components/docs/DocsFooter.tsx），侧栏可以一直到底。
 */
export default function FooterWrapper(): ReactNode {
  const { pathname } = useLocation();
  if (DOCS_PATH.test(pathname)) return null;
  return <Footer />;
}
