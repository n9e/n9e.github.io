import React from 'react';
import clsx from 'clsx';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { useCopy } from '@site/src/content';
import styles from './home.module.css';

export default function Trust(): React.ReactElement {
  const { trust } = useCopy();
  const { withBaseUrl } = useBaseUrlUtils();

  return (
    <section className="n9e-section" id="users">
      <div className="n9e-container">
        <header>
          <p className="n9e-eyebrow">{trust.eyebrow}</p>
          <h2 className="n9e-h2">{trust.title}</h2>
          <p className="n9e-lead">{trust.lead}</p>
        </header>

        {trust.logos && (
          <div className={styles.logoGrid}>
            <div className={styles.logoGridInner}>
              {trust.logos.map((logo) => (
                <div key={logo.name} className={styles.logoTile}>
                  <img
                    className={clsx(logo.invert && styles.logoInvert)}
                    src={withBaseUrl(`img/logos-en/${logo.file}`)}
                    alt={logo.name}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {trust.logoWall && (
          <figure className={clsx(styles.logoWall, trust.logoWallCrop && styles.logoWallCrop)}>
            <img src={withBaseUrl(trust.logoWall)} alt={trust.logoAlt ?? ''} loading="lazy" />
          </figure>
        )}
      </div>
    </section>
  );
}
