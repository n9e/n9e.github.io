import React from 'react';
import type { ChatLine } from '@site/src/content/types';
import styles from './visuals.module.css';

/**
 * 夜莺 AI 的聊天窗口，用 HTML 画而不是截图：
 * 跟着中英文和明暗主题走，不用维护四套图；而且能把「确认卡」这种关键机制原样画出来。
 */
export default function Chat({ title, lines }: { title: string; lines: ChatLine[] }): React.ReactElement {
  return (
    <div className={styles.chat}>
      <div className={styles.chatBar} aria-hidden="true">
        <span className={styles.chatMark} />
        <span>{title}</span>
      </div>
      <div className={styles.chatBody}>
        {lines.map((line, i) => {
          switch (line.kind) {
            case 'context':
              return (
                <p key={i} className={styles.cContext}>
                  {line.text}
                </p>
              );
            case 'user':
              return (
                <p key={i} className={styles.cUser}>
                  {line.text}
                </p>
              );
            case 'tool':
              return (
                <p key={i} className={styles.cTool}>
                  <span className={styles.cToolDot} />
                  {line.text}
                  {line.dim && <span className={styles.cDim}>{line.dim}</span>}
                </p>
              );
            case 'out':
              return (
                <p key={i} className={styles.cOut}>
                  {line.ok && <span className={styles.cOk}>✓</span>}
                  {line.text}
                </p>
              );
            case 'confirm':
              return (
                <div key={i} className={styles.cConfirm}>
                  <p className={styles.cConfirmTitle}>{line.title}</p>
                  <ul className={styles.cChanges}>
                    {line.changes.map((c) => (
                      <li key={c.field}>
                        <span>{c.field}</span>
                        <s>{c.from}</s>
                        <b>{c.to}</b>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.cConfirmNote}>{line.note}</p>
                  <div className={styles.cActions} aria-hidden="true">
                    <span className={styles.cBtnPrimary}>{line.confirmLabel}</span>
                    <span className={styles.cBtn}>{line.cancelLabel}</span>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
