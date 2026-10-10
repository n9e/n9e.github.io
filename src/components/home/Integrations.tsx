import React from 'react';
import Link from '@docusaurus/Link';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { useCopy } from '@site/src/content';
import ChannelIcon from './ChannelIcon';
import styles from './home.module.css';

export default function Integrations(): React.ReactElement {
  const { integrations } = useCopy();
  const { withBaseUrl } = useBaseUrlUtils();

  return (
    <section className="n9e-section" id="integrations">
      <div className="n9e-container">
        <header>
          <p className="n9e-eyebrow">{integrations.eyebrow}</p>
          <h2 className="n9e-h2">{integrations.title}</h2>
          <p className="n9e-lead">{integrations.lead}</p>
        </header>

        {integrations.groups.map((group) => (
          <div key={group.label} className={styles.intgGroup}>
            <p className={styles.intgLabel}>
              {group.label} · {group.title}
            </p>
            <ul className={styles.intgGrid}>
              {group.items.map((item) => (
                <li key={item.name} className={styles.intgItem}>
                  {item.logo ? (
                    <img src={withBaseUrl(item.logo)} alt="" loading="lazy" />
                  ) : (
                    item.icon && <ChannelIcon name={item.icon} className={styles.intgIcon} />
                  )}
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className={styles.intgMore}>
          <Link to={integrations.more.href}>{integrations.more.label} →</Link>
        </p>
      </div>
    </section>
  );
}
