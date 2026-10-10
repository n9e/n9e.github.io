import React, { type ReactElement } from 'react';
import Link from '@docusaurus/Link';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { useCopy } from '@site/src/content';
import styles from './planned.module.css';

/**
 * 占位页的正文。由 src/theme/DocItem/Content 在 front matter 有 planned: true 时渲染。
 *
 * 一个占位页必须回答四件事，否则就是调研 §15.3 说的"点不动的空壳"：
 *   没写（状态）→ 将会写什么（范围）→ 有问题去哪问（社区）→ 怎么帮忙（编辑链接）。
 * 范围那一句来自 front matter 的 description，和分组索引卡片、<meta description> 是同一句，
 * 所以这一页在搜索引擎、卡片、正文三处说的是同一件事。
 */
export default function Planned(): ReactElement {
  const { frontMatter, metadata } = useDoc();
  const copy = useCopy().docsPlanned;
  const scope = frontMatter.description;

  return (
    <aside className={styles.planned} aria-label={copy.badge}>
      <p className={styles.status}>
        <span className={styles.badge}>{copy.badge}</span>
      </p>

      {scope && (
        <p className={styles.scope}>
          <span className={styles.scopeLead}>{copy.scopeLead}</span> {scope}
        </p>
      )}

      <div className={styles.grid}>
        <section>
          <h2 className={styles.h}>{copy.askTitle}</h2>
          <ul className={styles.list}>
            {copy.ask.map((item) => (
              <li key={item.href}>
                <Link to={item.href}>{item.label} ↗</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.contribute}>
          <h2 className={styles.h}>{copy.contributeTitle}</h2>
          <p className={styles.body}>{copy.contributeBody}</p>
          {metadata.editUrl && (
            <Link className="n9e-btn n9e-btn--ghost" to={metadata.editUrl}>
              {copy.contributeLabel}
            </Link>
          )}
        </section>
      </div>
    </aside>
  );
}
