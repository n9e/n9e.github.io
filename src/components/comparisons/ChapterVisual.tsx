import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import type { Ask, ChapterVisual as Visual, IntegrationItem } from '@site/src/content/types';
import ChannelIcon from '@site/src/components/home/ChannelIcon';
import styles from './visuals.module.css';

/** 品牌 logo 或通用媒介徽标，和首页集成区同一套 */
function Chip({ item }: { item: IntegrationItem }): React.ReactElement {
  const { withBaseUrl } = useBaseUrlUtils();
  return (
    <span className={styles.chip}>
      {item.logo ? (
        <img src={withBaseUrl(item.logo)} alt="" loading="lazy" />
      ) : (
        item.icon && <ChannelIcon name={item.icon} className={styles.chipIcon} />
      )}
      {item.name}
    </span>
  );
}

function Arrow(): React.ReactElement {
  return (
    <svg className={styles.arrow} viewBox="0 0 40 12" aria-hidden="true">
      <path d="M0 6h34M30 1.5 35 6l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 每章一张界面图：规则的两种写法 / 接线图 / 嵌入 Grafana 的仪表盘 */
export default function ChapterVisual({ visual, caption }: { visual: Visual; caption: string }): React.ReactElement {
  const { withBaseUrl } = useBaseUrlUtils();

  return (
    <figure className={styles.frame}>
      <div className={styles.frameBody}>
        {visual.kind === 'split' && (
          <div className={styles.split}>
            <div className={styles.splitCode}>
              <p className={styles.paneTitle}>{visual.leftTitle}</p>
              <pre>
                {visual.code.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </pre>
            </div>
            <div className={styles.splitCard}>
              <p className={styles.paneTitle}>{visual.rightTitle}</p>
              <dl className={styles.fields}>
                {visual.fields.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {visual.kind === 'wiring' && (
          <div className={styles.wiring}>
            <div className={styles.wireCol}>
              <p className={styles.paneTitle}>{visual.sourcesLabel}</p>
              <div className={styles.chips}>
                {visual.sources.map((s) => (
                  <Chip key={s.name} item={s} />
                ))}
              </div>
            </div>
            <Arrow />
            <div className={styles.hub}>
              <img src={withBaseUrl('img/logo-mark.webp')} alt="" />
              <b>{visual.hub}</b>
              <span>{visual.hubNote}</span>
            </div>
            <Arrow />
            <div className={styles.wireCol}>
              <p className={styles.paneTitle}>{visual.channelsLabel}</p>
              <div className={styles.chips}>
                {visual.channels.map((c) => (
                  <Chip key={c.name} item={c} />
                ))}
                <span className={styles.chipMore}>{visual.channelsMore}</span>
              </div>
            </div>
          </div>
        )}

        {visual.kind === 'embed' && (
          <div className={styles.embed}>
            <div className={styles.panel}>
              <p className={styles.paneTitle}>{visual.panelTitle}</p>
              <svg className={styles.spark} viewBox="0 0 240 72" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M0 52 L20 48 L40 50 L60 44 L80 46 L100 40 L120 42 L140 30 L160 34 L180 14 L200 22 L220 10 L240 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M0 52 L20 48 L40 50 L60 44 L80 46 L100 40 L120 42 L140 30 L160 34 L180 14 L200 22 L220 10 L240 16 V72 H0 Z"
                  className={styles.sparkFill}
                />
                <line x1="150" y1="0" x2="150" y2="72" className={styles.sparkMark} />
              </svg>
              <p className={styles.panelNote}>{visual.panelNote}</p>
            </div>
            <div className={styles.eventCard}>
              <p className={styles.eventHead}>
                <span className={styles.sev}>{visual.event.severity}</span>
                {visual.event.rule}
              </p>
              <p className={styles.eventLabels}>
                {visual.event.labels.map((l) => (
                  <code key={l}>{l}</code>
                ))}
              </p>
              <p className={styles.eventStatus}>{visual.event.status}</p>
            </div>
          </div>
        )}
      </div>
      <figcaption className={styles.frameCaption}>{caption}</figcaption>
    </figure>
  );
}

/** 配图下面的一问一答 */
export function AskPair({ ask, you, ai }: { ask: Ask; you: string; ai: string }): React.ReactElement {
  return (
    <dl className={styles.ask}>
      <div>
        <dt>{you}</dt>
        <dd>{ask.q}</dd>
      </div>
      <div className={styles.askAi}>
        <dt>{ai}</dt>
        <dd>{ask.a}</dd>
      </div>
    </dl>
  );
}
