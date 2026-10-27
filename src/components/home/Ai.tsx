import React from 'react';
import clsx from 'clsx';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import { useCopy } from '@site/src/content';
import styles from './home.module.css';

export default function Ai(): React.ReactElement {
  const { ai } = useCopy();
  // hero 的 kicker 链到 #ai；普通元素上的 id 不会被 Docusaurus 的断链检查认出来，要手动登记
  useBrokenLinks().collectAnchor('ai');

  return (
    <section className={clsx('n9e-section', styles.mcp)} id="ai">
      <div className={clsx('n9e-container', styles.mcpGrid)}>
        <div>
          <p className="n9e-eyebrow">{ai.eyebrow}</p>
          <h2 className="n9e-h2">{ai.title}</h2>
          <p className="n9e-lead">{ai.lead}</p>

          {/* 三层按 AI 离用户的距离排：在夜莺页面里用 → 在告警流程里自动跑 → 外部 Agent 调用 */}
          <ol className={styles.aiTiers}>
            {ai.tiers.map((tier) => (
              <li key={tier.label} className={styles.aiTier}>
                <span className={styles.aiTierLabel}>{tier.label}</span>
                <h3 className={styles.aiTierTitle}>{tier.title}</h3>
                <p className={styles.aiTierBody}>{tier.body}</p>
              </li>
            ))}
          </ol>

          <p className={styles.mcpNote}>{ai.note}</p>
        </div>

        <div className={styles.term}>
          <div className={styles.termBar} aria-hidden="true">
            <span className={styles.termDot} />
            <span className={styles.termDot} />
            <span className={styles.termDot} />
            <span className={styles.termTitle}>{ai.terminal.title}</span>
          </div>
          <div className={styles.termBody}>
            {ai.terminal.lines.map((line, i) => {
              if (line.kind === 'user') {
                return (
                  <p key={i} className={styles.tUser}>
                    {line.text}
                  </p>
                );
              }
              if (line.kind === 'tool') {
                return (
                  <p key={i} className={styles.tTool}>
                    {line.text} {line.dim && <span className={styles.tDim}>{line.dim}</span>}
                  </p>
                );
              }
              return (
                <p key={i} className={styles.tOut}>
                  {line.ok && <span className={styles.tOk}>✓ </span>}
                  {line.text}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
