import React from 'react';
import Link from '@docusaurus/Link';
import { useCopy } from '@site/src/content';
import styles from './home.module.css';

export default function Compare(): React.ReactElement {
  const { compare } = useCopy();

  return (
    <section className="n9e-section n9e-section--sunk" id="comparisons">
      <div className="n9e-container">
        <header>
          <p className="n9e-eyebrow">{compare.eyebrow}</p>
          <h2 className="n9e-h2">{compare.title}</h2>
          <p className="n9e-lead">{compare.lead}</p>
        </header>

        <div className={styles.cardGrid}>
          {compare.cards.map((card) => (
            <Link key={card.title} className={styles.compareCard} to={card.href}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </Link>
          ))}
        </div>

        <div className={styles.centerAction}>
          <Link className="n9e-btn n9e-btn--ghost" to={compare.more.href}>
            {compare.more.label} →
          </Link>
        </div>
      </div>
    </section>
  );
}
