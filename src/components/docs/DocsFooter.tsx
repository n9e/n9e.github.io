import React, { type ReactElement } from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { LocaleSwitcher, ThemeToggle } from '@site/src/components/site/FooterControls';
import styles from './docsFooter.module.css';

/**
 * 文档页的收尾：正文栏里的一行——版权 · 语言切换 · 明暗切换。
 * 放在正文栏里而不是通栏，侧栏才能一直到底，不被页脚切断。
 * 版权文案直接取站点配置里那一句，不另外维护一份。
 */
export default function DocsFooter(): ReactElement {
  const { footer } = useThemeConfig();
  return (
    <footer className={styles.footer}>
      {footer?.copyright && (
        // 和官方页脚一样：copyright 允许带 HTML，来源是我们自己的配置
        <p className={styles.copyright} dangerouslySetInnerHTML={{ __html: footer.copyright }} />
      )}
      <div className={styles.controls}>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </footer>
  );
}
