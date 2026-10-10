import React, { type ReactNode } from 'react';
import SearchBar from '@theme-original/SearchBar';
import type SearchBarType from '@theme/SearchBar';
import type { WrapperProps } from '@docusaurus/types';
import { useLocation } from '@docusaurus/router';

type Props = WrapperProps<typeof SearchBarType>;

/**
 * 搜索框只在文档区显示。
 *
 * 首页、集成、对比、下载这些是营销页，内容一眼看得完，顶一个搜索框只是噪音；
 * 有东西可搜的是文档。
 *
 * 匹配整段路径而不是用 startsWith：地址在英文站是 /docs/xxx，
 * 中文站是 /zh/docs/xxx，前缀判断会漏掉中文站。
 * 整段匹配同时保证 /download、/categraf 这类不会被误命中。
 */
const DOCS_PATH = /(^|\/)docs(\/|$)/;

export default function SearchBarWrapper(props: Props): ReactNode {
  const { pathname } = useLocation();
  if (!DOCS_PATH.test(pathname)) return null;
  return <SearchBar {...props} />;
}
