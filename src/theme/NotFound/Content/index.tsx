import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import type { Props } from '@theme/NotFound/Content';
import styles from './notFound.module.css';

/**
 * 覆盖官方 NotFound/Content（升级时对照 theme-classic/lib/theme/NotFound/Content 同步）。
 *
 * 官方 404 只有两句话，第二句还是「请联系给你链接的人」。从旧站或搜索引擎带着老链接进来的人，
 * 看到这页就走了——GitHub Pages 没有服务端日志，这是我们唯一能留住他们的地方。
 * 所以这里给一个搜索框（直达 /search?q=）和四个主要入口。
 *
 * 老文档链接本身不会走到这一步：scripts/legacy-doc-urls.mjs 的映射在客户端模块里先于渲染跳转。
 * 这页接的是映射之外的断链。
 */
export default function NotFoundContent({ className }: Props): ReactNode {
  const searchPath = useBaseUrl('/search');
  const links = [
    { to: '/docs', label: translate({ id: 'theme.n9e.notFound.docs', message: 'Documentation' }) },
    { to: '/docs/get-started/quick-start', label: translate({ id: 'theme.n9e.notFound.quickStart', message: 'Quick start' }) },
    { to: '/download', label: translate({ id: 'theme.n9e.notFound.download', message: 'Download' }) },
    { to: '/integrations', label: translate({ id: 'theme.n9e.notFound.integrations', message: 'Integrations' }) },
  ];

  return (
    <main className={clsx('container margin-vert--xl', styles.main, className)}>
      <div className={styles.inner}>
        <Heading as="h1" className="hero__title">
          <Translate id="theme.NotFound.title" description="The title of the 404 page">
            Page Not Found
          </Translate>
        </Heading>
        <p className={styles.lead}>
          <Translate id="theme.n9e.notFound.lead" description="Explanation on the 404 page">
            The page may have moved when the site was rebuilt. Search the docs, or start from one of these pages.
          </Translate>
        </p>

        <form className={styles.search} action={searchPath} method="get" role="search">
          <label className={styles.searchLabel} htmlFor="not-found-search">
            <Translate id="theme.n9e.notFound.searchLabel" description="Label of the 404 search box">
              Search the docs
            </Translate>
          </label>
          <div className={styles.searchRow}>
            <input
              id="not-found-search"
              className={styles.searchInput}
              type="search"
              name="q"
              placeholder={translate({
                id: 'theme.n9e.notFound.searchPlaceholder',
                message: 'e.g. alert rule, Categraf, MCP',
                description: 'Placeholder of the 404 search box',
              })}
            />
            <button className={clsx('button button--primary', styles.searchButton)} type="submit">
              <Translate id="theme.n9e.notFound.searchButton" description="Submit button of the 404 search box">
                Search
              </Translate>
            </button>
          </div>
        </form>

        <ul className={styles.links}>
          {links.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>{item.label}</Link>
            </li>
          ))}
          <li>
            <Link href="https://github.com/ccfos/nightingale">GitHub</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
