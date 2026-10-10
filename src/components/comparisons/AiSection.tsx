import React, { useState } from 'react';
import clsx from 'clsx';
import type { AiSection as AiSectionCopy } from '@site/src/content/types';
import Chat from './Chat';
import styles from './visuals.module.css';

/**
 * AI 专区：左边三条能力做手风琴，右边聊天窗口随展开项切换。
 * 三段对话的内容全部取自 docs/ai/workflows.md 里的提问和技能说明。
 */
export default function AiSection({ ai }: { ai: AiSectionCopy }): React.ReactElement {
  const [active, setActive] = useState(0);
  const tab = ai.tabs[active];

  return (
    <section className={styles.ai} aria-labelledby="ai-title">
      <div className={clsx('n9e-container', styles.aiGrid)}>
        <div>
          <h2 id="ai-title" className={styles.aiTitle}>
            {ai.title}
          </h2>
          <p className={styles.aiLead}>{ai.lead}</p>

          <div className={styles.acc}>
            {ai.tabs.map((t, i) => {
              const open = i === active;
              return (
                <div key={t.id} className={clsx(styles.accItem, open && styles.accOpen)}>
                  <h3 className={styles.accHead}>
                    <button
                      type="button"
                      className={styles.accBtn}
                      aria-expanded={open}
                      aria-controls={`ai-panel-${t.id}`}
                      onClick={() => setActive(i)}
                    >
                      <span className={styles.accNo}>{String(i + 1).padStart(2, '0')}</span>
                      {t.title}
                    </button>
                  </h3>
                  <div id={`ai-panel-${t.id}`} className={styles.accBody} hidden={!open}>
                    <p>{t.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.aiChatCol}>
          <Chat title={tab.chatTitle} lines={tab.chat} />
        </div>
      </div>

      <div className="n9e-container">
        <ul className={styles.facts}>
          {ai.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className={styles.rivals}>
          <span className={styles.rivalsLabel}>{ai.rivalsLabel}</span>
          {ai.rivals.map((r) => (
            <span key={r.name} className={styles.rival}>
              <b>{r.name}</b>
              {r.stance}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
