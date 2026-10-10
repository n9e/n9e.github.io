import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useColorMode, useThemeConfig } from '@docusaurus/theme-common';
import { useAlternatePageUtils } from '@docusaurus/theme-common/internal';
import ColorModeToggle from '@theme/ColorModeToggle';
import styles from './footerControls.module.css';

/**
 * 语言切换。原本在导航栏右上角，挪到页脚（参考 flashduty 官网的位置）。
 *
 * 地址必须用 useAlternatePageUtils 算，不能写死 "/" 和 "/zh/"：
 * 官方的 localeDropdown 会把当前路径映射到另一种语言的同一页
 * （/docs/ai → /zh/docs/ai），写死链接会让人从文档内页被踢回首页。
 *
 * pathname:// 前缀是为了强制整页跳转——两种语言是两份独立构建产物，
 * 走客户端路由跳不过去。autoAddBaseUrl 必须关：createUrl 返回的已经是带目标
 * 语言前缀的完整路径，Link 默认还会再套一次当前语言的 baseUrl。
 */
export function LocaleSwitcher(): ReactNode {
  const {
    i18n: { currentLocale, locales, localeConfigs },
  } = useDocusaurusContext();
  const alternate = useAlternatePageUtils();

  if (locales.length < 2) return null;

  return (
    <nav className={styles.locales} aria-label="Language">
      {locales.map((locale) => {
        const active = locale === currentLocale;
        return (
          <Link
            key={locale}
            className={clsx(styles.locale, active && styles.localeActive)}
            to={`pathname://${alternate.createUrl({ locale, fullyQualified: false })}`}
            autoAddBaseUrl={false}
            aria-current={active ? 'page' : undefined}
          >
            {localeConfigs[locale].label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * 明暗切换。复用官方 ColorModeToggle 而不是自己画按钮：图标在 React 注水之前就要
 * 显示正确，官方那套用 data-theme-choice 属性做到了这点，自己实现容易出现首屏图标闪错。
 * respectPrefersColorScheme 在站点配置里是 false，所以这里是浅色/深色两态切换。
 */
export function ThemeToggle(): ReactNode {
  const {
    colorMode: { disableSwitch, respectPrefersColorScheme },
  } = useThemeConfig();
  const { colorModeChoice, setColorMode } = useColorMode();

  if (disableSwitch) return null;

  return (
    <ColorModeToggle
      respectPrefersColorScheme={respectPrefersColorScheme}
      value={colorModeChoice}
      onChange={setColorMode}
    />
  );
}
