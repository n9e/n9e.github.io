import React from 'react';
import clsx from 'clsx';
import { useCopy } from '@site/src/content';
import styles from './home.module.css';

export default function Mcp(): React.ReactElement {
  const { mcp } = useCopy();

  return (
    <section className={clsx('n9e-section', styles.mcp)} id="mcp">
      <div className={clsx('n9e-container', styles.mcpGrid)}>
        <div>
          <p className="n9e-eyebrow">{mcp.eyebrow}</p>
          <h2 className="n9e-h2">{mcp.title}</h2>
          <p className="n9e-lead">{mcp.lead}</p>

          <div className={styles.figures}>
            {mcp.figures.map((figure) => (
              <div key={figure.label}>
                <span className={styles.figValue}>{figure.value}</span>
                <span className={styles.figLabel}>{figure.label}</span>
              </div>
            ))}
          </div>

          <p className={styles.toolsetsLabel}>{mcp.toolsetsLabel}</p>
          <div className={styles.toolsets}>
            {mcp.toolsets.map((toolset) => (
              <span key={toolset} className={styles.toolset}>
                {toolset}
              </span>
            ))}
          </div>

          <p className={styles.mcpNote}>{mcp.note}</p>
        </div>

        <div className={styles.term}>
          <div className={styles.termBar} aria-hidden="true">
            <span className={styles.termDot} />
            <span className={styles.termDot} />
            <span className={styles.termDot} />
            <span className={styles.termTitle}>{mcp.terminal.title}</span>
          </div>
          <div className={styles.termBody}>
            {mcp.terminal.lines.map((line, i) => {
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
