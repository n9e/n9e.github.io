import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useCopy } from '@site/src/content';
import styles from './home.module.css';

export default function FinalCta(): React.ReactElement {
  const { finalCta } = useCopy();

  return (
    <section className={clsx('n9e-section', styles.finalCta)} id="community">
      <div className="n9e-container">
        <h2 className={styles.finalTitle}>{finalCta.title}</h2>
        <p className={styles.finalLead}>{finalCta.lead}</p>

        <div className={styles.finalActions}>
          <Link className="n9e-btn n9e-btn--primary n9e-btn--lg" to={finalCta.primary.href}>
            {finalCta.primary.label}
          </Link>
          <Link className="n9e-btn n9e-btn--ghost n9e-btn--lg" to={finalCta.secondary.href}>
            {finalCta.secondary.label} →
          </Link>
        </div>

        <p className={styles.community}>
          {finalCta.communityLabel}
          <span>·</span>
          {finalCta.community.map((item, i) => (
            <React.Fragment key={item.href}>
              {i > 0 && <span>·</span>}
              <Link to={item.href}>{item.label}</Link>
            </React.Fragment>
          ))}
          {/* 分隔符必须和文案一起判断，否则英文站会留下一个孤立的间隔点 */}
          {finalCta.wechat && (
            <>
              <span>·</span>
              {finalCta.wechat}
            </>
          )}
        </p>
      </div>
    </section>
  );
}
