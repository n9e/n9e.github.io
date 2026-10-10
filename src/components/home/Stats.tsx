import React from 'react';
import { useCopy } from '@site/src/content';
import { thousands } from '@site/src/lib/format';
import repo from '@site/src/data/stats.json';
import styles from './home.module.css';

export default function Stats(): React.ReactElement {
  const { stats } = useCopy();

  return (
    <section className={styles.stats}>
      <div className="n9e-container">
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{thousands(repo.stars)}</span>
            <span className={styles.statLabel}>{stats.starsLabel}</span>
          </div>
          {stats.items.map((item) => (
            <div key={item.label} className={styles.stat}>
              <span className={styles.statValue}>{item.value}</span>
              <span className={styles.statLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
