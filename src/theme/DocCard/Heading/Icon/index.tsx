import React, { type ReactNode } from 'react';
import type { Props } from '@theme/DocCard/Heading/Icon';
import styles from './styles.module.css';

/**
 * 分组索引卡片标题前的图标。
 *
 * 官方默认是 📄️ / 🗃 / 🔗 三个 emoji——和站点其他地方一处 emoji 都没有的克制不搭。
 * 这里改成：未写的页面（sidebar_class_name: planned）显示与侧边栏一致的空心圆点，
 * 其余不显示任何图标。同一个记号在目录和卡片里意思相同，读者学一次就够。
 */
export default function DocCardHeadingIcon({ item }: Props): ReactNode {
  const planned = typeof item.className === 'string' && /\bplanned\b/.test(item.className);
  if (!planned) return null;
  return <span className={styles.planned} aria-hidden="true" />;
}
