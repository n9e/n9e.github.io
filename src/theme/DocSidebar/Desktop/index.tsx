import React, { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { useLocation } from '@docusaurus/router';
import { useThemeConfig } from '@docusaurus/theme-common';
import Logo from '@theme/Logo';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import SearchBar from '@theme/SearchBar';
import themeStyles from '@docusaurus/theme-classic/lib/theme/DocSidebar/Desktop/styles.module.css';
import styles from './styles.module.css';

/**
 * 在官方版基础上改了两处，其余结构与官方保持一致，升级时对照官方组件同步即可：
 *   1. 侧边栏顶部加了搜索框（原本在导航栏右上角）；
 *   2. 进入页面时把当前页那一行滚到侧栏可视区中间。分组全展开后侧栏有几十行，
 *      落在下半段的页面默认看不见自己在目录里的位置。只滚侧栏自己的滚动容器，
 *      不用 scrollIntoView——那会连页面一起滚。
 */
function DocSidebarDesktop({ path, sidebar, onCollapse, isHidden }: any): ReactNode {
  const {
    navbar: { hideOnScroll },
    docs: {
      sidebar: { hideable },
    },
  } = useThemeConfig();
  const rootRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const menu = rootRef.current?.querySelector<HTMLElement>('nav.menu');
    const active = menu?.querySelector<HTMLElement>('.menu__link[aria-current="page"]');
    if (!menu || !active) return;
    const m = menu.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    const inView = a.top >= m.top && a.bottom <= m.bottom;
    if (inView) return;
    menu.scrollTop += a.top - m.top - m.height / 2 + a.height / 2;
  }, [pathname]);

  return (
    <div
      ref={rootRef}
      className={clsx(
        themeStyles.sidebar,
        hideOnScroll && themeStyles.sidebarWithHideableNavbar,
        isHidden && themeStyles.sidebarHidden,
      )}
    >
      {hideOnScroll && <Logo tabIndex={-1} className={themeStyles.sidebarLogo} />}
      <div className={styles.searchWrap}>
        <SearchBar />
      </div>
      <Content path={path} sidebar={sidebar} />
      {hideable && <CollapseButton onClick={onCollapse} />}
    </div>
  );
}

export default React.memo(DocSidebarDesktop);
