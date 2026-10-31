import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import PageMeta from '@site/src/components/common/PageMeta';
import { useCopy } from '@site/src/content';
import styles from './pages.module.css';

export default function CategrafPage(): React.ReactElement {
  const { categrafPage: page } = useCopy();

  return (
    <Layout description={page.meta.description}>
      <PageMeta meta={page.meta} />
      <main>
        <header className={styles.pageHeader}>
          <div className="n9e-container">
            <p className="n9e-eyebrow">COLLECTOR</p>
            <h1 className={styles.pageTitle}>{page.title}</h1>
            <p className={styles.pageLead}>{page.lead}</p>
            <div className={styles.countRow}>
              {page.facts.map((fact) => (
                <div key={fact.label}>
                  <span className={styles.countValue}>{fact.value}</span>
                  <span className={styles.countLabel}>{fact.label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className={styles.pageBody}>
          <div className="n9e-container">
            <h2 className="n9e-h2">{page.runTitle}</h2>
            <div className={styles.methods}>
              {page.methods.map((method) => (
                <article key={method.title} className={styles.method}>
                  <h3 className={styles.methodTitle}>{method.title}</h3>
                  <p className={styles.methodNote}>{method.note}</p>
                  {method.lines && (
                    <code className={styles.cmd}>
                      {method.lines.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </code>
                  )}

                  {method.after && <p className={styles.methodAfter}>{method.after}</p>}

                  {method.link && (
                    <Link className={styles.methodLink} to={method.link.href}>
                      {method.link.label} →
                    </Link>
                  )}
                </article>
              ))}
            </div>

            <h2 className="n9e-h2">{page.pluginsTitle}</h2>
            <p className={styles.pageLead}>{page.pluginsBody}</p>
            <div className={styles.pluginGroups}>
              {page.pluginGroups.map((group) => (
                <div key={group.label} className={styles.pluginGroup}>
                  <p className={styles.pluginLabel}>{group.label}</p>
                  <ul className={styles.pluginList}>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className={styles.noteGrid}>
              {page.notes.map((note) => (
                <article key={note.title} className={styles.noteCard}>
                  <h3>{note.title}</h3>
                  <p>{note.body}</p>
                  <Link to={note.link.href}>{note.link.label} →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
