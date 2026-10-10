import React, { useEffect, useState, type ReactElement } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useCopy } from '@site/src/content';
import { DEMO_URL } from '@site/src/data/site';
import repo from '@site/src/data/stats.json';
import styles from './docsHome.module.css';

/**
 * 文档首页（/docs）。
 *
 * 依据调研文档 §6.1 与 §16.5：一屏完成分流，不做营销长页。
 * 首页要回答的五件事——这是哪套文档、搜索在哪、新用户从哪开始、
 * 不同意图从哪进、参考与求助在哪——按这个顺序自上而下排。
 *
 * 分流卡片用第一人称，是因为人到文档站时脑子里是一句话
 * （"告警怎么发不出去"），不是一个功能名（"通知规则"）。
 * 让读者认自己那句话，比让他猜产品把这件事叫什么快。
 */

function Magnifier(): ReactElement {
  return (
    <svg
      className={styles.magnifier}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  );
}

/**
 * 占位符轮播。
 *
 * 首帧固定第 0 条：服务端渲染出来的就是它，注水前后一致，不会闪一下换字。
 * 用户一碰输入框就永久停下——正在打字时字还在自己动是纯粹的干扰。
 * 系统开了"减少动态效果"则根本不转（这里要显式判断：全局那条
 * prefers-reduced-motion 规则压的是 CSS 动画时长，管不到 setInterval）。
 */
function useRotatingHint(count: number, stopped: boolean): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (stopped || count < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setInterval(() => setIndex((n) => (n + 1) % count), 3600);
    return () => window.clearInterval(timer);
  }, [count, stopped]);

  return index;
}

export default function DocsHome(): ReactElement {
  const { docsHome: page } = useCopy();
  const history = useHistory();

  // 插件的搜索结果页。baseUrl 在中文构建里是 /zh/，useBaseUrl 会带上，
  // 且 Docusaurus 的 history 不设 basename——所以同一个值既能给 form action
  // 用作无 JS 兜底，也能直接 push（插件自己的 generateSearchPageLink 就这么拼）。
  const searchPath = useBaseUrl('/search');

  const [query, setQuery] = useState('');
  const [touched, setTouched] = useState(false);
  const hint = useRotatingHint(page.searchHints.length, touched);

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const q = query.trim();
    history.push(q ? `${searchPath}?q=${encodeURIComponent(q)}` : searchPath);
  }

  return (
    <div className={clsx('n9e-docs-home', styles.page)}>
      {/* 首屏用 div 而不是 header：主题里有一条
          `.docItemContainer article > header + * { margin-top: 0 }`，
          它本来是给文档正文标题用的，但只要这里是 <header>，
          下面第一组卡片的上边距就会被清零（选择器优先级比模块类高一档）。
          换个标签比加 !important 干净，语义上也没损失——h1 还在里面。 */}
      <div className={styles.hero}>
        <p className={styles.kicker}>
          {page.eyebrow}
          <span className={styles.version}>{repo.latestRelease}</span>
        </p>
        <h1 className={styles.title}>{page.title}</h1>
        <p className={styles.lead}>{page.lead}</p>

        <form className={styles.search} action={searchPath} method="get" onSubmit={submit} role="search">
          <Magnifier />
          <input
            className={styles.input}
            type="search"
            name="q"
            value={query}
            autoComplete="off"
            aria-label={page.searchLabel}
            onFocus={() => setTouched(true)}
            onChange={(e) => {
              setTouched(true);
              setQuery(e.target.value);
            }}
          />
          {/* 真实提问轮播。它替代了 placeholder 属性（属性值没法做过渡），
              所以必须 aria-hidden + 不吃点击，无障碍标签走 input 的 aria-label。 */}
          {query === '' && (
            <span className={styles.hint} aria-hidden="true">
              <span key={hint} className={styles.hintText}>
                {page.searchHints[hint]}
              </span>
            </span>
          )}
        </form>

        <div className={styles.ctaRow}>
          <Link className="n9e-btn n9e-btn--primary" to={page.ctaPrimary.href}>
            {page.ctaPrimary.label}
          </Link>
          {DEMO_URL && (
            <Link className="n9e-btn n9e-btn--ghost" to={DEMO_URL}>
              {page.demoLabel}
            </Link>
          )}
        </div>
      </div>

      {/* 三组不是"三个一行好看"，而是产品自己的三段：接进来判定 → 降噪送出去 → 长期跑住。
          左侧那条脊柱和首页 Pipeline 是同一条：config 段品牌紫、event 段告警级别渐变、
          ai 段电光蓝紫——读者在首页学过一次的颜色，到这里还认得。 */}
      <div className={styles.bands}>
        {page.bands.map((band) => (
          <section key={band.eyebrow} className={styles.band} data-stage={band.stage}>
            <div className={styles.rail}>
              <span className={styles.railNode} aria-hidden="true" />
              <span className={styles.railLine} aria-hidden="true" />
              <h2 className={clsx('n9e-docs-home-head', styles.bandHead)}>
                <span className={styles.bandEyebrow}>{band.eyebrow}</span>
                <span className={styles.bandLabel}>{band.label}</span>
              </h2>
            </div>
            <div className={styles.cards}>
              {band.tasks.map((task) => (
                <Link key={task.ask} to={task.href} className={styles.card}>
                  <span className={styles.ask}>{task.ask}</span>
                  <span className={styles.goal}>{task.goal}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={styles.foot}>
        <section className={styles.strip}>
          <p className={styles.stripEyebrow}>{page.referenceEyebrow}</p>
          <h2 className={clsx('n9e-docs-home-head', styles.stripTitle)}>{page.referenceTitle}</h2>
          <div className={styles.chips}>
            {page.references.map((item) => (
              <Link key={item.label} className={styles.chip} to={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.strip}>
          <p className={styles.stripEyebrow}>{page.helpEyebrow}</p>
          <nav className={styles.helpLinks}>
            {page.help.map((item) => (
              <Link key={item.label} to={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </div>
  );
}
