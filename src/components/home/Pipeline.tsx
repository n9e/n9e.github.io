import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { useCopy } from '@site/src/content';
import styles from './home.module.css';

export default function Pipeline(): React.ReactElement {
  const { pipeline } = useCopy();
  const { withBaseUrl } = useBaseUrlUtils();

  return (
    <section className="n9e-section" id="how">
      <div className="n9e-container">
        <header>
          <p className="n9e-eyebrow">{pipeline.eyebrow}</p>
          <h2 className="n9e-h2">{pipeline.title}</h2>
          <p className="n9e-lead">{pipeline.lead}</p>

          {/* 数据流转链：结构标记用产品里真实存在的对象名，而不是 01/02/03 */}
          <div className={styles.chain}>
            {pipeline.steps.map((step, i) => (
              <React.Fragment key={step.artifact}>
                {i > 0 && <span className={styles.chainSep} aria-hidden="true" />}
                <span className={styles.chainItem} data-stage={step.stage}>
                  {step.artifact}
                </span>
              </React.Fragment>
            ))}
          </div>
          <p className={styles.chainNote}>
            <b>event</b> — {pipeline.chainCaption}
          </p>
        </header>

        <div className={styles.steps}>
          {pipeline.steps.map((step) => (
            <article key={step.artifact} className={styles.step}>
              <span className={styles.railNode} data-stage={step.stage} aria-hidden="true" />
              <span className={styles.railLine} data-stage={step.stage} aria-hidden="true" />

              <p className={styles.artifact}>{step.artifact}</p>

              <div className={styles.stepMain}>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                  <ul className={styles.stepPoints}>
                    {step.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                {step.shot && (
                  <figure className={styles.miniFrame}>
                    <img
                      src={withBaseUrl(step.shot)}
                      alt={step.shotAlt ?? ''}
                      width={step.shotSize?.[0]}
                      height={step.shotSize?.[1]}
                      loading="lazy"
                    />
                  </figure>
                )}

                {step.code && (
                  <div className={styles.codeCard}>
                    <div className={styles.codeBar}>{step.code.filename}</div>
                    <pre>
                      <code>{step.code.content}</code>
                    </pre>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
