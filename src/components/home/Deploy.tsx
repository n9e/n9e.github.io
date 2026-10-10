import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useCopy } from '@site/src/content';
import styles from './home.module.css';

export default function Deploy(): React.ReactElement {
  const { deploy } = useCopy();

  return (
    <section className="n9e-section" id="deploy">
      <div className="n9e-container">
        <header>
          <p className="n9e-eyebrow">{deploy.eyebrow}</p>
          <h2 className="n9e-h2">{deploy.title}</h2>
        </header>

        <div className={clsx(styles.cardGrid, styles.cardGridPair)}>
          {deploy.cards.map((card) => (
            <article key={card.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardBody}>{card.body}</p>
              {card.code && <code className={styles.cardCode}>{card.code}</code>}
              <Link className={styles.cardLink} to={card.link.href}>
                {card.link.label} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
