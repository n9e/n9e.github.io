import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useCopy } from '@site/src/content';
import type { CapabilityCell, CapabilityLevel } from '@site/src/content/types';
import { DEMO_URL } from '@site/src/data/site';
import ChapterVisual, { AskPair } from './ChapterVisual';
import styles from '@site/src/pages/comparisons/comparisons.module.css';

/**
 * 单个对手的完整对比页（/comparisons/<slug>）。
 * 顺序：面包屑 + H1 + 一段立场 → 30 秒结论 → 两种路子 + 擅长什么 / 何时换 + 配图与问答 →
 * 两列对照表 → 对象映射摘要（链到迁移文档） → 本页 FAQ → 其他对比 → CTA。
 * 立场、配图、问答来自 hub 的 Verdict（同一份文案，不复制）；其余字段来自 ComparisonDetail。
 * 样式沿用 hub 的模块，这里只补了几个类（见 comparisons.module.css 末尾）。
 */

function Level({ level, label }: { level: CapabilityLevel; label: string }): React.ReactElement {
  return (
    <>
      <svg className={clsx(styles.level, styles[`level_${level}`])} viewBox="0 0 12 12" aria-hidden="true">
        {level === 'full' && <circle cx="6" cy="6" r="5" />}
        {level === 'partial' && (
          <>
            <circle className={styles.levelRing} cx="6" cy="6" r="4.4" />
            <path d="M6 1.6a4.4 4.4 0 0 1 0 8.8Z" />
          </>
        )}
        {level === 'none' && <circle className={styles.levelRing} cx="6" cy="6" r="4.4" />}
      </svg>
      {label && <span className="sr-only">{label}: </span>}
    </>
  );
}

function Cell({ cell, spot, label }: { cell: CapabilityCell; spot?: boolean; label: string }): React.ReactElement {
  return (
    <td className={clsx(spot && styles.spot, styles[`cell_${cell.level}`])}>
      <Level level={cell.level} label={label} />
      <span>{cell.text}</span>
    </td>
  );
}

export default function DetailPage({ slug }: { slug: string }): React.ReactElement {
  const { comparisonsPage: page } = useCopy();
  const { siteConfig, i18n } = useDocusaurusContext();
  const detail = page.details.find((d) => d.slug === slug);
  const verdict = detail && page.verdicts.find((v) => v.id === detail.verdictId);
  if (!detail || !verdict) throw new Error(`Unknown comparison: ${slug}`);
  const labels = page.detailLabels;
  const hasDemo = DEMO_URL.length > 0;
  const levelKeys: CapabilityLevel[] = ['full', 'partial', 'none'];
  const others = page.details.filter((d) => d.slug !== slug);

  const base = siteConfig.url.replace(/\/+$/, '') + siteConfig.baseUrl;
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: labels.hub, item: `${base}comparisons` },
      { '@type': 'ListItem', position: 2, name: detail.heading, item: `${base}comparisons/${slug}` },
    ],
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: detail.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <Layout title={detail.metaTitle} description={detail.metaDescription}>
      <Head>
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faq)}</script>
      </Head>
      <main className={styles.page} lang={i18n.currentLocale === 'en' ? 'en' : undefined}>
        <header className={styles.hero}>
          <div className="n9e-container">
            <ol className={styles.crumbs}>
              <li>
                <Link to="/comparisons">{labels.hub}</Link>
              </li>
              <li aria-current="page">{verdict.title}</li>
            </ol>
            <h1 className={styles.heroTitle}>{detail.heading}</h1>
            <p className={styles.detailLead}>{detail.lead}</p>
            <div className={styles.heroActions}>
              {hasDemo && (
                <Link className="n9e-btn n9e-btn--primary n9e-btn--lg" to={DEMO_URL}>
                  {page.demoLabel}
                </Link>
              )}
              <Link className={clsx('n9e-btn', 'n9e-btn--lg', hasDemo ? 'n9e-btn--ghost' : 'n9e-btn--primary')} to={page.install.href}>
                {page.install.label}
              </Link>
            </div>
          </div>
        </header>

        <section className={styles.tldr} aria-labelledby="tldr-title">
          <div className="n9e-container">
            <h2 id="tldr-title" className={styles.sectionTitle}>
              {labels.tldrTitle}
            </h2>
            <ul className={styles.tldrGrid}>
              {detail.tldr.map((item) => (
                <li key={item.label}>
                  <b>{item.label}</b>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.detailStance}>
          <div className="n9e-container">
            <div className={styles.ways}>
              <div className={styles.way}>
                <span className={styles.wayLabel}>{page.theirWayLabel}</span>
                <p>{verdict.theirWay}</p>
              </div>
              <div className={clsx(styles.way, styles.wayOurs)}>
                <span className={styles.wayLabel}>{page.ourWayLabel}</span>
                <p>{verdict.ourWay}</p>
              </div>
            </div>
            <div className={styles.chapterBody}>
              <div>
                <h2 className={styles.subLabel}>{page.theirsLabel}</h2>
                <p className={styles.prose}>{verdict.theirs}</p>
                <h2 className={styles.subLabel}>{page.oursLabel}</h2>
                <p className={styles.prose}>{verdict.ours}</p>
                <h2 className={styles.subLabel}>{page.signalsLabel}</h2>
                <ul className={styles.signals}>
                  {verdict.signals.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.chapterAside}>
                <ChapterVisual visual={verdict.visual} caption={verdict.visualCaption} />
                <AskPair ask={verdict.ask} you={page.askYou} ai={page.askAi} />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.matrix} aria-labelledby="table-title">
          <div className="n9e-container">
            <h2 id="table-title" className={styles.sectionTitle}>
              {labels.tableTitle}
            </h2>
            <div className={styles.matrixScroll}>
              <table className={clsx(styles.table, styles.twoCol)}>
                <caption className="sr-only">{page.tableCaption}</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">{page.tableCaption}</span>
                    </th>
                    <th scope="col" className={styles.spot}>
                      {labels.usColumn}
                    </th>
                    <th scope="col">{detail.themColumn}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <Cell cell={row.us} spot label={page.levels[row.us.level]} />
                      <Cell cell={row.them} label={page.levels[row.them.level]} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className={styles.legend}>
              {levelKeys.map((key) => (
                <li key={key} className={styles[`cell_${key}`]}>
                  <Level level={key} label="" />
                  {page.levels[key]}
                </li>
              ))}
            </ul>
            <p className={styles.matrixNote}>{page.matrixNote}</p>
          </div>
        </section>

        <section className={styles.mapping} aria-labelledby="mapping-title">
          <div className="n9e-container">
            <h2 id="mapping-title" className={styles.sectionTitle}>
              {labels.migrationTitle}
            </h2>
            <p className={styles.lead}>{detail.migration.lead}</p>
            <table className={styles.mappingTable}>
              <thead>
                <tr>
                  <th scope="col">{detail.migration.fromLabel}</th>
                  <th scope="col">{detail.migration.toLabel}</th>
                </tr>
              </thead>
              <tbody>
                {detail.migration.rows.map((row) => (
                  <tr key={row.from}>
                    <th scope="row">{row.from}</th>
                    <td>{row.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.mappingNote}>{detail.migration.note}</p>
            <p className={styles.mappingLinks}>
              <Link to={verdict.guide.href}>{verdict.guide.label} →</Link>
              <Link to={page.coexist.link.href}>{page.coexist.link.label} →</Link>
            </p>
          </div>
        </section>

        <section className={styles.faq} aria-labelledby="faq-title">
          <div className={clsx('n9e-container', styles.faqInner)}>
            <h2 id="faq-title" className={styles.sectionTitle}>
              {labels.faqTitle}
            </h2>
            <div className={styles.faqList}>
              {detail.faq.map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.others} aria-labelledby="others-title">
          <div className="n9e-container">
            <h2 id="others-title" className={styles.subLabel} style={{ marginTop: 0 }}>
              {labels.othersTitle}
            </h2>
            <ul className={styles.othersList}>
              {others.map((d) => (
                <li key={d.slug}>
                  <Link to={`/comparisons/${d.slug}`}>{d.heading} →</Link>
                </li>
              ))}
              <li>
                <Link to="/comparisons">{labels.hub} →</Link>
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.closing}>
          <div className="n9e-container">
            <h2 className={styles.bigTitle}>{page.closing.title}</h2>
            <p className={styles.lead}>{page.closing.lead}</p>
            <div className={styles.heroActions}>
              {hasDemo && (
                <Link className="n9e-btn n9e-btn--primary n9e-btn--lg" to={DEMO_URL}>
                  {page.demoLabel}
                </Link>
              )}
              <Link className={clsx('n9e-btn', 'n9e-btn--lg', hasDemo ? 'n9e-btn--ghost' : 'n9e-btn--primary')} to={page.install.href}>
                {page.install.label}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
