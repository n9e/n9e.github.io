import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { LocaleSwitcher, ThemeToggle } from '@site/src/components/site/FooterControls';
import styles from './styles.module.css';

type Props = {
  style: 'light' | 'dark';
  links: ReactNode;
  logo: ReactNode;
  copyright: ReactNode;
};

/**
 * 营销页的四栏页脚（首页 / 集成 / 对比 / 下载 / Categraf）。
 * 文档页不用它——见 src/theme/Footer/index.tsx 和 src/components/docs/DocsFooter.tsx。
 * 语言与明暗切换住在这里的居中一行；两个组件和文档小页脚共用。
 */
export default function FooterLayout({ style, links, logo, copyright }: Props): ReactNode {
  return (
    <footer
      className={clsx(ThemeClassNames.layout.footer.container, 'footer', {
        'footer--dark': style === 'dark',
      })}
    >
      <div className="container container-fluid">
        {links}
        <div className="footer__bottom text--center">
          <div className={styles.themeRow}>
            <ThemeToggle />
          </div>
          <div className={styles.localeRow}>
            <LocaleSwitcher />
          </div>
          {logo && <div className="margin-bottom--sm">{logo}</div>}
          {copyright}
        </div>
      </div>
    </footer>
  );
}
