import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { zh } from './zh';
import { en } from './en';
import type { SiteCopy } from './types';

export type { SiteCopy };

/** 按当前 locale 取文案。中文是 source of truth，未覆盖的语言回落中文。 */
export function useCopy(): SiteCopy {
  const { i18n } = useDocusaurusContext();
  return i18n.currentLocale === 'en' ? en : zh;
}
