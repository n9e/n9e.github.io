import React, { useState, type ReactNode } from 'react';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import BackToTopButton from '@theme/BackToTopButton';
import DocRootLayoutSidebar from '@theme/DocRoot/Layout/Sidebar';
import DocRootLayoutMain from '@theme/DocRoot/Layout/Main';
import type { Props } from '@theme/DocRoot/Layout';
import themeStyles from '@docusaurus/theme-classic/lib/theme/DocRoot/Layout/styles.module.css';
import DocsTabs from '@site/src/components/docs/DocsTabs';
import DocsFooter from '@site/src/components/docs/DocsFooter';
import tabs from '@site/src/data/docs-tabs.json';

/**
 * 覆盖官方 DocRoot/Layout（升级时对照 theme-classic/lib/theme/DocRoot/Layout 同步）。
 * 两处改动：侧栏 + 正文那一行上面插入页签条（tabs 布局才有）；正文容器末尾加文档小页脚。
 *
 * 必须放在 docsWrapper 里面而不是外面：侧栏和右侧目录的吸顶位置都按
 * --ifm-navbar-height 算，页签条加进来后这个值要多出一条的高度——
 * 这个覆盖写在 custom.css 的 .n9e-docs-root 上，只在这个容器内生效，
 * 导航栏本身的高度不受影响。
 */
export default function DocRootLayout({ children }: Props): ReactNode {
  const sidebar = useDocsSidebar();
  const [hiddenSidebarContainer, setHiddenSidebarContainer] = useState(false);
  return (
    <div className={`${themeStyles.docsWrapper} n9e-docs-root ${tabs.length ? 'n9e-docs-root--tabs' : 'n9e-docs-root--single'}`}>
      <BackToTopButton />
      <DocsTabs />
      <div className={themeStyles.docRoot}>
        {sidebar && (
          <DocRootLayoutSidebar
            sidebar={sidebar.items}
            hiddenSidebarContainer={hiddenSidebarContainer}
            setHiddenSidebarContainer={setHiddenSidebarContainer}
          />
        )}
        <DocRootLayoutMain hiddenSidebarContainer={hiddenSidebarContainer}>
          {children}
          {/* 小页脚放在正文容器内，和文章、分页同宽对齐；全站大页脚在文档路由下不渲染 */}
          <DocsFooter />
        </DocRootLayoutMain>
      </div>
    </div>
  );
}
