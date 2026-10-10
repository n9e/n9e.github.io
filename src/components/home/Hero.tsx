import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { useCopy } from '@site/src/content';
import { compact } from '@site/src/lib/format';
import repo from '@site/src/data/stats.json';
import { DEMO_URL } from '@site/src/data/site';
import HeroShader from './HeroShader';
import styles from './home.module.css';

export default function Hero(): React.ReactElement {
  const { hero } = useCopy();
  const { withBaseUrl } = useBaseUrlUtils();
  const [copied, setCopied] = useState(false);
  const hasDemo = DEMO_URL.length > 0;

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(hero.installLines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // 剪贴板不可用（非 HTTPS、权限被拒）时命令原样留在页面上，用户仍可手动选中
    }
  }

  return (
    <section className={styles.hero}>
      <HeroShader />
      <div className={clsx('n9e-container', styles.heroGrid)}>
        <div>
          <p className={styles.kicker}>{hero.kicker}</p>
          {/* 标题里的 \n 是指定的断行点：宽屏两栏时按它断成固定的两行，单栏时退回自然折行 */}
          <h1 className={styles.title}>
            {hero.title.split('\n').map((line, i) => (
              <React.Fragment key={line}>
                {i > 0 && ' '}
                <span className={styles.titleLine}>{line}</span>
              </React.Fragment>
            ))}
          </h1>
          <p className={styles.heroLead}>{hero.lead}</p>
          {hero.highlights && (
            <ul className={styles.heroHighlights}>
              {hero.highlights.split(' · ').map((item) => (
                <li key={item} className={styles.heroHighlight}>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {/* 三个入口各答一个问题：能不能先看看（demo）、怎么装（自托管）、这东西靠谱吗（star）。
              按钮下的微文案是用来消解点击顾虑的，不是装饰。
              DEMO_URL 为空时第一颗不渲染，主 CTA 自动落到"5 分钟安装"上。 */}
          <div className={styles.ctas}>
            {hasDemo && (
              <div className={styles.ctaCol}>
                <Link className="n9e-btn n9e-btn--primary n9e-btn--lg" to={DEMO_URL}>
                  {hero.demoLabel}
                </Link>
                <span className={styles.ctaNote}>{hero.demoNote}</span>
              </div>
            )}
            <div className={styles.ctaCol}>
              <Link
                className={clsx(
                  'n9e-btn n9e-btn--lg',
                  hasDemo ? 'n9e-btn--ghost' : 'n9e-btn--primary',
                )}
                to={hero.ctaPrimary.href}
              >
                {hero.ctaPrimary.label}
              </Link>
              <span className={styles.ctaNote}>{hero.ctaPrimaryNote}</span>
            </div>
            <div className={styles.ctaCol}>
              <Link className="n9e-btn n9e-btn--ghost n9e-btn--lg" to={hero.ctaSecondary.href}>
                {hero.ctaSecondary.label}
                <span className={styles.ghostCount}>★ {compact(repo.stars)}</span>
              </Link>
            </div>
          </div>

          <div className={styles.install}>
            <p className={styles.installCaption}>{hero.installCaption}</p>
            <div className={styles.installBox}>
              <code className={styles.installCode}>
                {hero.installLines.map((line) => (
                  <span key={line} className={styles.installLine}>
                    {line}
                  </span>
                ))}
              </code>
              <button type="button" className={styles.copyBtn} onClick={copyInstall}>
                {copied ? hero.copied : hero.copy}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.browser}>
            <div className={styles.browserBar} aria-hidden="true">
              <span className={styles.browserDot} />
              <span className={styles.browserDot} />
              <span className={styles.browserDot} />
              <span className={styles.browserUrl}>n9e.example.com/dashboards</span>
            </div>
            <img
              className={clsx(styles.shot, styles.shotLight)}
              src={withBaseUrl('img/hero-dashboard-light.png')}
              alt={hero.shotAlt}
            />
            <img
              className={clsx(styles.shot, styles.shotDark)}
              src={withBaseUrl('img/hero-dashboard-dark.png')}
              alt=""
              aria-hidden="true"
            />
          </div>

          {/* 一条真实形态的告警：级别色条、标签、触发时间、送达渠道 */}
          <article className={styles.alertCard}>
            <span className={styles.sevBar} aria-hidden="true" />
            <div className={styles.alertBody}>
              <div className={styles.alertHead}>
                <span className="n9e-sev n9e-sev--s1">{hero.alert.severity}</span>
                <span className={styles.alertRule}>{hero.alert.rule}</span>
              </div>
              <div className={styles.alertLabels}>
                {hero.alert.labels.map((label) => (
                  <span key={label} className={styles.alertLabel}>
                    {label}
                  </span>
                ))}
              </div>
              <div className={styles.alertMeta}>
                <span>
                  {hero.alert.firedAtLabel} <b>{hero.alert.firedAt}</b>
                </span>
                <span>
                  {hero.alert.durationLabel} <b>{hero.alert.duration}</b>
                </span>
              </div>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>{hero.notify.label}</span>
                {hero.notify.channels.map((channel) => (
                  <img
                    key={channel.name}
                    className={styles.notifyChip}
                    src={withBaseUrl(channel.logo)}
                    alt={channel.name}
                    width={20}
                    height={20}
                  />
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
