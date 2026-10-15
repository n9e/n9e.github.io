import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { useCopy } from '@site/src/content';
import type { IntegrationCategoryId, Plural } from '@site/src/content/types';
import ChannelIcon from '@site/src/components/home/ChannelIcon';
import catalog from '@site/src/data/integrations.json';
import pages from '@site/src/data/integration-pages/index.json';
import homeStyles from '@site/src/components/home/home.module.css';
import pageStyles from './pages.module.css';
import styles from './integrations.module.css';

/**
 * 集成页：一个可搜索的目录。
 * 内置模板的卡片、每张卡上的数量、分类计数、hero 数字全部来自构建时抓取的
 * integrations.json（scripts/fetch-integrations.mjs），不手改；数据源、通知媒介、
 * 采集器三块是站点自己维护的清单，走 content。
 */

type Template = (typeof catalog.items)[number];
type CategoryFilter = IntegrationCategoryId | 'all';

const CATEGORY_ORDER: IntegrationCategoryId[] = [
  'host',
  'database',
  'mq',
  'web',
  'cloud-native',
  'cloud',
  'network',
  'devops',
  'other',
];

function plural([one, other]: Plural, n: number): string {
  return (n === 1 ? one : other).replace('{n}', String(n));
}

/** 有独立页（/integrations/<slug>）的集成，卡片进站内页；slug 由 scripts/integration-pages/fetch.mjs 写入 */
const PAGE_SLUG = new Map(pages.pages.map((p) => [p.ident, p.slug]));

/** 没有独立页的，卡片点开去 GitHub 上该模板的 README；当前语言没有就退到另一种，都没有就到目录 */
function readmeUrl(item: Template, locale: string): string {
  const base = `${catalog.sourceUrl.replace('/tree/', '/blob/')}/${item.ident}`;
  const preferEn = locale === 'en';
  if (preferEn && item.readme.en) return `${base}/markdown/README.en_US.md`;
  if (!preferEn && item.readme.zh) return `${base}/markdown/README.md`;
  if (item.readme.en) return `${base}/markdown/README.en_US.md`;
  if (item.readme.zh) return `${base}/markdown/README.md`;
  return `${catalog.sourceUrl}/${item.ident}`;
}

/**
 * 「全部」默认只露这 16 个最常用的（桌面四行）。按重要程度排：窄屏只留前 8 个、手机只留前 4 个，
 * 截到哪儿都是最该看到的那几个。写的是 ident 不是展示名（AliYun 展示为 Alibaba Cloud）。
 * 不用「带的仪表盘最多」来排——那样前排全是阿里云、华为云，不是用户最常接的东西。
 */
const FEATURED = [
  'Linux', 'Kubernetes', 'MySQL', 'Redis',
  'Windows', 'Docker', 'PostgreSQL', 'Nginx',
  'Elasticsearch', 'Kafka', 'MongoDB', 'Java',
  'RabbitMQ', 'SNMP', 'Ping', 'AliYun',
];

/** 上游改名或删了某个模板时，用「带的东西最多」的补位，概览不会缺一格 */
function featured(items: Template[]): Template[] {
  const picked = FEATURED.map((id) => items.find((i) => i.ident === id)).filter(Boolean) as Template[];
  const rest = items
    .filter((i) => !picked.includes(i))
    .sort((a, b) => b.dashboards + b.alerts - (a.dashboards + a.alerts) || a.name.localeCompare(b.name, 'en'));
  return [...picked, ...rest].slice(0, FEATURED.length);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_\-.]/g, '');
}

export default function IntegrationsPage(): React.ReactElement {
  const { integrationsPage: page, integrations: home } = useCopy();
  const { i18n } = useDocusaurusContext();
  const { withBaseUrl } = useBaseUrlUtils();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // 按 / 聚焦搜索框；文档搜索占了 ⌘K，这里不抢
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const q = normalize(query.trim());
  const matches = (name: string, extra: string[] = []): boolean =>
    !q || [name, ...extra].some((s) => normalize(s).includes(q));

  const byQuery = useMemo(
    () =>
      catalog.items.filter((item) =>
        matches(item.name, [item.ident, ...item.aliases, page.templates.categories[item.category as IntegrationCategoryId]]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, page],
  );

  const countByCategory = useMemo(() => {
    const counts = new Map<IntegrationCategoryId, number>();
    for (const item of byQuery) {
      const c = item.category as IntegrationCategoryId;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return counts;
  }, [byQuery]);

  const visibleTemplates = category === 'all' ? byQuery : byQuery.filter((i) => i.category === category);
  const categories = CATEGORY_ORDER.filter((c) => catalog.items.some((i) => i.category === c));
  // 没搜索、没选分类、没点展开时是概览：只露最常用的四行
  const overview = category === 'all' && !q && !expanded;
  const shownTemplates = overview ? featured(byQuery) : visibleTemplates;
  const shownTemplateIds = new Set(shownTemplates.map((item) => item.ident));
  // 完整目录始终在 HTML 中，分类和搜索只控制显隐。概览把精选卡片排在前面，
  // 保留手机 / 窄屏按前 4 / 8 张展示的规则；展开与筛选仍沿用目录原顺序。
  const orderedTemplates = overview
    ? [...shownTemplates, ...catalog.items.filter((item) => !shownTemplateIds.has(item.ident))]
    : catalog.items;

  function collapse() {
    setExpanded(false);
    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderCard(item: Template, hidden: boolean): React.ReactElement {
    const onlyLang = item.readme.zh && !item.readme.en ? 'zh' : item.readme.en && !item.readme.zh ? 'en' : null;
    const bundle = [
      item.dashboards > 0 && plural(page.templates.badges.dashboards, item.dashboards),
      item.alerts > 0 && plural(page.templates.badges.alerts, item.alerts),
      item.collect > 0 && page.templates.badges.collect,
      item.metrics > 0 && page.templates.badges.metrics,
    ].filter(Boolean) as string[];
    return (
      <li key={item.ident} hidden={hidden}>
        <Link
          className={styles.card}
          to={PAGE_SLUG.has(item.ident) ? `/integrations/${PAGE_SLUG.get(item.ident)}` : readmeUrl(item, i18n.currentLocale)}
        >
          <span className={styles.cardIcon}>
            {item.icon ? (
              <img src={withBaseUrl(`img/integrations/${item.icon.file}`)} alt={`${item.name} logo`} loading="lazy" />
            ) : (
              <span className={styles.cardIconFallback}>{item.name.slice(0, 1)}</span>
            )}
          </span>
          <span className={styles.cardBody}>
            <span className={styles.cardName}>{item.name}</span>
            <span className={styles.cardMeta}>
              {bundle.map((b, i) => (
                <span key={b} className={styles.metaItem}>
                  {i > 0 && <span className={styles.dot}>·</span>}
                  {b}
                </span>
              ))}
            </span>
          </span>
          {onlyLang && <span className={styles.cardLang}>{page.templates.readmeOnly[onlyLang]}</span>}
        </Link>
      </li>
    );
  }

  const visibleSources = page.sources.items.filter((s) => matches(s.name, [page.sources.kinds[s.kind]]));
  const channelItems = home.groups.find((g) => g.label === 'NOTIFICATIONS')?.items ?? [];
  const visibleChannels = channelItems.filter((c) => matches(c.name));

  const counts = [
    { value: String(catalog.items.length), label: page.counts.templates },
    { value: String(page.sources.items.length), label: page.counts.sources },
    { value: page.counts.channelsValue, label: page.counts.channels },
  ];

  return (
    <Layout title={page.title} description={page.lead}>
      <main>
        <header className={pageStyles.pageHeader}>
          <div className="n9e-container">
            <p className="n9e-eyebrow">INTEGRATIONS</p>
            <h1 className={pageStyles.pageTitle}>{page.title}</h1>
            <p className={pageStyles.pageLead}>{page.lead}</p>
            <div className={pageStyles.countRow}>
              {counts.map((count) => (
                <div key={count.label}>
                  <span className={pageStyles.countValue}>{count.value}</span>
                  <span className={pageStyles.countLabel}>{count.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.searchRow}>
              <label className={styles.search}>
                <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.searchIcon}>
                  <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12.8 12.8 17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={page.search.placeholder}
                  aria-label={page.search.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query ? (
                  <button type="button" className={styles.searchClear} onClick={() => setQuery('')}>
                    {page.search.clear}
                  </button>
                ) : (
                  <span className={styles.searchHint}>
                    <kbd>/</kbd> {page.search.hint}
                  </span>
                )}
              </label>
              <nav className={styles.jump} aria-label="Sections">
                <a href="#sources">{page.jump.sources}</a>
                <a href="#channels">{page.jump.channels}</a>
                <a href="#templates">{page.jump.templates}</a>
                <a href="#collectors">{page.jump.collectors}</a>
              </nav>
            </div>
          </div>
        </header>

        {/* ---------- 数据源 ---------- */}
        {visibleSources.length > 0 && (
          <section id="sources" className={styles.section}>
            <div className="n9e-container">
              <p className={homeStyles.intgLabel}>{page.sources.label}</p>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{page.sources.title}</h2>
                <p className={styles.sectionLead}>{page.sources.lead}</p>
              </div>
              {(['metrics', 'logs', 'sql'] as const)
                .map((kind) => ({ kind, items: visibleSources.filter((s) => s.kind === kind) }))
                .filter((g) => g.items.length > 0)
                .map((g) => (
                  <div key={g.kind} className={styles.sourceRow}>
                    <span className={clsx(styles.kind, styles[`kind_${g.kind}`])}>{page.sources.kinds[g.kind]}</span>
                    <ul className={styles.sourceGrid}>
                      {g.items.map((s) => (
                        <li key={s.name}>
                          <Link className={styles.source} to={s.href}>
                            <img src={withBaseUrl(s.logo)} alt={`${s.name} logo`} loading="lazy" />
                            <span className={styles.sourceName}>{s.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ---------- 通知媒介：沿用首页 tile 样式 ---------- */}
        {visibleChannels.length > 0 && (
          <section id="channels" className={clsx(styles.section, styles.sectionSunk)}>
            <div className="n9e-container">
              <p className={homeStyles.intgLabel}>{page.channels.label}</p>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{page.channels.title}</h2>
                <p className={styles.sectionLead}>{page.channels.lead}</p>
              </div>
              <ul className={clsx(homeStyles.intgGrid, styles.tiles)}>
                {visibleChannels.map((item) => (
                  <li key={item.name} className={homeStyles.intgItem}>
                    {item.logo ? (
                      <img src={withBaseUrl(item.logo)} alt={`${item.name} logo`} loading="lazy" />
                    ) : (
                      item.icon && <ChannelIcon name={item.icon} className={homeStyles.intgIcon} />
                    )}
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.sourceLink}>
                <Link to={page.channels.link.href}>{page.channels.link.label} →</Link>
              </p>
            </div>
          </section>
        )}

        {/* ---------- 内置模板目录 ---------- */}
        <section id="templates" className={styles.section}>
          <div className="n9e-container">
            <p className={homeStyles.intgLabel}>{page.templates.label}</p>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{page.templates.title}</h2>
              <p className={styles.sectionLead}>{page.templates.lead}</p>
            </div>

            <div className={styles.chips} role="tablist" aria-label={page.templates.title}>
              <button
                type="button"
                role="tab"
                aria-selected={category === 'all'}
                className={clsx(styles.chip, category === 'all' && styles.chipActive)}
                onClick={() => setCategory('all')}
              >
                {page.templates.all}
                <span className={styles.chipCount}>{byQuery.length}</span>
              </button>
              {categories.map((c) => {
                const n = countByCategory.get(c) ?? 0;
                return (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={category === c}
                    className={clsx(styles.chip, category === c && styles.chipActive, n === 0 && styles.chipEmpty)}
                    onClick={() => setCategory(c)}
                  >
                    {page.templates.categories[c]}
                    <span className={styles.chipCount}>{n}</span>
                  </button>
                );
              })}
            </div>

            <ul className={clsx(styles.cards, overview && styles.cardsFeatured)} hidden={shownTemplates.length === 0}>
              {orderedTemplates.map((item) => renderCard(item, !shownTemplateIds.has(item.ident)))}
            </ul>
            {overview && (
              <button type="button" className={styles.expand} onClick={() => setExpanded(true)}>
                {page.templates.showAll.replace('{n}', String(byQuery.length))} ↓
              </button>
            )}
            {expanded && category === 'all' && !q && (
              <button type="button" className={styles.expand} onClick={collapse}>
                {page.templates.showLess} ↑
              </button>
            )}
            {shownTemplates.length === 0 && (
              <div className={styles.empty}>
                <h3>{page.search.emptyTitle}</h3>
                <p>{page.search.emptyBody}</p>
                <div className={styles.emptyLinks}>
                  <Link to={page.search.emptyIssue.href}>{page.search.emptyIssue.label} →</Link>
                  <Link to={page.search.emptyContribute.href}>{page.search.emptyContribute.label} →</Link>
                </div>
              </div>
            )}

            <p className={styles.sourceLink}>
              <Link to={page.templates.sourceLink.href}>{page.templates.sourceLink.label} →</Link>
              <span className={styles.fetched}>{catalog.fetchedAt}</span>
            </p>
          </div>
        </section>

        {/* ---------- 采集器 ---------- */}
        <section id="collectors" className={clsx(styles.section, styles.sectionSunk)}>
          <div className="n9e-container">
            <p className={homeStyles.intgLabel}>{page.collectors.label}</p>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{page.collectors.title}</h2>
              <p className={styles.sectionLead}>{page.collectors.lead}</p>
            </div>
            <div className={styles.collectorGrid}>
              {page.collectors.items.map((c) => (
                <article key={c.name} className={clsx(styles.collector, c.recommended && styles.collectorRecommended)}>
                  <h3>
                    {c.name}
                    {c.recommended && <span className={styles.recommended}>{page.collectors.recommendedTag}</span>}
                  </h3>
                  <p>{c.body}</p>
                  <Link to={c.link.href}>{c.link.label} →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 兜底 ---------- */}
        <section className={styles.section}>
          <div className="n9e-container">
            <div className={styles.notFound}>
              <div>
                <h2>{page.notFound.title}</h2>
                <p>{page.notFound.body}</p>
              </div>
              <div className={styles.notFoundLinks}>
                {page.notFound.links.map((l, i) => (
                  <Link key={l.href} to={l.href} className={clsx(styles.notFoundLink, i === 0 && styles.notFoundPrimary)}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
