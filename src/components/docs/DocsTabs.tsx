import React, { type ReactElement } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import tabs from '@site/src/data/docs-tabs.json';
import styles from './docsTabs.module.css';

const HOME_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>';

/**
 * 文档区顶部的页签：首页 · 上手 · 使用 · 运行 · 查阅（参考 Flashduty 的产品页签）。
 *
 * 每个页签对应 sidebars.ts 里的一份侧栏。四份侧栏里所有分组都常开、不折叠——
 * 一份侧栏放得下，是因为先被页签切成了四份；不切的话是 160 多行。
 * 当前页签由 useDocsSidebar() 的 name 决定；文档首页不属于任何侧栏，此时「首页」亮。
 *
 * 图标是内联 SVG 字符串（来自 scripts/docs-tree.mjs，经生成器写进 docs-tabs.json），
 * 我们自己的常量，直接注入没有注入风险。
 */
export default function DocsTabs(): ReactElement | null {
  const sidebar = useDocsSidebar();
  // single 布局下生成器输出空数组，页签条整体不渲染
  if (tabs.length === 0) return null;
  const { i18n } = useDocusaurusContext();
  const isEn = i18n.currentLocale === 'en';
  const active = sidebar?.name ?? 'home';

  return (
    <nav className={styles.tabs} aria-label="Docs sections">
      <div className={styles.inner}>
        <Link
          to="/docs"
          className={clsx(styles.tab, active === 'home' && styles.active)}
          aria-current={active === 'home' ? 'page' : undefined}
        >
          <span className={styles.icon} dangerouslySetInnerHTML={{ __html: HOME_ICON }} />
          <Translate id="theme.n9e.docsTabs.home" description="Docs tab: docs home">
            Home
          </Translate>
        </Link>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.href}
            className={clsx(styles.tab, active === tab.key && styles.active)}
            aria-current={active === tab.key ? 'page' : undefined}
          >
            <span className={styles.icon} dangerouslySetInnerHTML={{ __html: tab.icon }} />
            {isEn ? tab.en : tab.zh}
          </Link>
        ))}
      </div>
    </nav>
  );
}
