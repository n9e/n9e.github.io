import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import PageMeta from '@site/src/components/common/PageMeta';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useCopy } from '@site/src/content';
import type { CapabilityLevel } from '@site/src/content/types';
import { DEMO_URL } from '@site/src/data/site';
import repo from '@site/src/data/stats.json';
import { thousands } from '@site/src/lib/format';
import AiSection from '@site/src/components/comparisons/AiSection';
import styles from './comparisons.module.css';

/**
 * 对比 hub（/comparisons）：一页决策书的目录。
 * 结构照业界对比页的共性来：立场标题 → 一眼看完的表 → 数字 → 逐个对手的判词摘要 →
 * 拆掉"换的顾虑"（并存）→ FAQ → 结尾 CTA。
 * 每个对手的完整对比在 /comparisons/<slug>（DetailPage），这里的章节只留立场、换的信号
 * 和两个链接；#prometheus / #zabbix / #grafana 三个锚点保留，老链接照常落地。
 * 页面上唯一的视觉重音是对比表里的夜莺列，其余全部细线、不套盒子。
 */

/** 状态图形：实心 / 半实心 / 空心。三种都画成圆，读表时只看"填了多少"。 */
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

/** 页内目录高亮：哪一章占了视口上半部分，就点亮哪一条 */
function useActiveChapter(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

export default function Comparisons(): React.ReactElement {
  const { comparisonsPage: page, stats } = useCopy();
  const hasDemo = DEMO_URL.length > 0;
  // 用 useMemo 固定数组引用，否则每次渲染都会重建 IntersectionObserver
  const chapterIds = useMemo(() => page.verdicts.map((v) => v.id), [page.verdicts]);
  const active = useActiveChapter(chapterIds);
  const levelKeys: CapabilityLevel[] = ['full', 'partial', 'none'];
  const detailHref = (verdictId: string) => `/comparisons/${page.details.find((d) => d.verdictId === verdictId)?.slug ?? ''}`;

  return (
    <Layout description={page.meta.description}>
      <PageMeta meta={page.meta} />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className="n9e-container">
            <p className={styles.heroLabel}>
              <span>{page.label}</span>
              {/* 首屏就给出三个完整对比页的链接：爬虫和读者都不用先滚到章节 */}
              {page.verdicts.map((v) => (
                <Link key={v.id} to={detailHref(v.id)}>
                  {v.title}
                </Link>
              ))}
            </p>
            {/* 标题里的 \n 是作者指定的换行点：中文在逗号后断、英文在句号后断，比让浏览器随机折行好看 */}
            <h1 className={styles.heroTitle}>
              {page.title.split('\n').map((line, i) => (
                <React.Fragment key={line}>
                  {/* <br> 后补一个空格：渲染时它在行首被折叠，不可见；但取纯文本（搜索引擎、llms.txt）
                      时两行不会粘成 "storage.Change" */}
                  {i > 0 && <br />}
                  {i > 0 && ' '}
                  {line}
                </React.Fragment>
              ))}
            </h1>
            <p className={styles.heroLead}>{page.lead}</p>
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

        <section className={styles.matrix} aria-labelledby="matrix-title">
          <div className="n9e-container">
            <h2 id="matrix-title" className={styles.sectionTitle}>
              {page.matrixTitle}
            </h2>
            <div className={styles.matrixScroll}>
              <table className={styles.table}>
                <caption className="sr-only">{page.tableCaption}</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">{page.tableCaption}</span>
                    </th>
                    {page.products.map((product, i) => (
                      <th key={product} scope="col" className={clsx(i === 0 && styles.spot)}>
                        {product}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {row.cells.map((cell, i) => (
                        <td key={i} className={clsx(i === 0 && styles.spot, styles[`cell_${cell.level}`])}>
                          <Level level={cell.level} label={page.levels[cell.level]} />
                          <span>{cell.text}</span>
                        </td>
                      ))}
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

        <section className={styles.proof}>
          <div className="n9e-container">
            <ul className={styles.proofRow}>
              <li>
                <b>{thousands(repo.stars)}</b>
                {stats.starsLabel}
              </li>
              {page.proof.map((item) => (
                <li key={item.label}>
                  <b>{item.value}</b>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <AiSection ai={page.ai} />

        <section className={styles.chapters}>
          <div className={clsx('n9e-container', styles.chaptersGrid)}>
            <nav className={styles.chapterNav} aria-label={page.tableCaption}>
              <ol>
                {page.verdicts.map((v, i) => (
                  <li key={v.id}>
                    <a href={`#${v.id}`} className={clsx(active === v.id && styles.navActive)}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      {v.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className={styles.chapterList}>
              {page.verdicts.map((v, i) => (
                <article key={v.id} id={v.id} className={styles.chapter}>
                  <p className={styles.chapterNo}>{String(i + 1).padStart(2, '0')}</p>
                  <h2 className={styles.chapterTitle}>{v.title}</h2>

                  <div className={styles.ways}>
                    <div className={styles.way}>
                      <span className={styles.wayLabel}>{page.theirWayLabel}</span>
                      <p>{v.theirWay}</p>
                    </div>
                    <div className={clsx(styles.way, styles.wayOurs)}>
                      <span className={styles.wayLabel}>{page.ourWayLabel}</span>
                      <p>{v.ourWay}</p>
                    </div>
                  </div>

                  <div className={styles.chapterBody}>
                    <div>
                      <h3 className={styles.subLabel}>{page.signalsLabel}</h3>
                      <ul className={styles.signals}>
                        {v.signals.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.chapterLinks}>
                      <Link className="n9e-btn n9e-btn--primary" to={detailHref(v.id)}>
                        {page.readMoreLabel} →
                      </Link>
                      <p className={styles.guide}>
                        <span>{page.guideLabel}</span>
                        <Link to={v.guide.href}>{v.guide.label} →</Link>
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={clsx(styles.coexist, 'n9e-section--sunk')} aria-labelledby="coexist-title">
          <div className="n9e-container">
            <h2 id="coexist-title" className={styles.bigTitle}>
              {page.coexist.title}
            </h2>
            <p className={styles.lead}>{page.coexist.lead}</p>
            <ol className={styles.steps}>
              {page.coexist.steps.map((step, i) => (
                <li key={step.title}>
                  <span className={styles.stepNo}>{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <p className={styles.coexistLink}>
              <Link to={page.coexist.link.href}>{page.coexist.link.label} →</Link>
            </p>
          </div>
        </section>

        {/* FAQ 的问答对同时以 FAQPage 结构化数据输出：Google 早已不再给普通站点展示 FAQ 富摘要，
            这里图的是 AI 搜索按问答对抽取、引用时拿到的是整段答案而不是半句。内容与下面可见的
            details 完全同源，不另写一份。 */}
        <Head>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: page.faq.items.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            })}
          </script>
        </Head>
        <section className={styles.faq} aria-labelledby="faq-title">
          <div className={clsx('n9e-container', styles.faqInner)}>
            <h2 id="faq-title" className={styles.sectionTitle}>
              {page.faq.title}
            </h2>
            <div className={styles.faqList}>
              {page.faq.items.map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
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
