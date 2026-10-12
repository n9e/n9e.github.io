import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './stackLayers.module.css';

/**
 * 「在可观测体系中的位置」页的六层架构图。
 *
 *   <StackLayers />
 *
 * 写成内联 SVG 而不是 .svg 文件：颜色全走 --n9e-* 变量，跟着站点明暗切换；
 * 文字按当前语言取，中英文页共用一个组件。原来的字符画在中文下框线对不齐，这也是换掉它的原因。
 */

type Layer = { n: string; name: string; body: string };

const COPY: Record<string, {
  title: string;
  owner: string;
  layers: Layer[];
  links: [string, string];
}> = {
  en: {
    title: 'Six observability layers; Nightingale owns layers 3 to 5',
    owner: 'Nightingale',
    layers: [
      { n: '1', name: 'Collect', body: 'Categraf / Telegraf / exporters / Datadog Agent' },
      { n: '2', name: 'Store', body: 'Prometheus / VictoriaMetrics / ElasticSearch / ClickHouse / MySQL …' },
      { n: '3', name: 'Evaluate', body: 'rules query the source on a schedule' },
      { n: '4', name: 'Reduce', body: 'mutes, subscriptions and pipelines act' },
      { n: '5', name: 'Route', body: 'notification rules pick people and media' },
      { n: '6', name: 'Deliver', body: 'Slack / Discord / Mattermost / Telegram / email / SMS / webhook / PagerDuty' },
    ],
    links: ['remote write, OpenTSDB, Datadog, Falcon', 'queried in place — no data moves'],
  },
  'zh-Hans': {
    title: '可观测六层，夜莺负责第 3 到第 5 层',
    owner: '夜莺',
    layers: [
      { n: '1', name: '采集', body: 'Categraf / Telegraf / 各类 exporter / Datadog Agent' },
      { n: '2', name: '存储', body: 'Prometheus / VictoriaMetrics / ElasticSearch / ClickHouse / MySQL …' },
      { n: '3', name: '判定', body: '告警规则按周期查询数据源，判断是否越界' },
      { n: '4', name: '降噪', body: '屏蔽、订阅、事件 Pipeline 依次处理事件' },
      { n: '5', name: '路由', body: '通知规则按级别和标签决定发给谁、走哪个媒介' },
      { n: '6', name: '送达', body: '钉钉 / 飞书 / 企业微信 / 邮件 / 电话 / 短信 / Webhook / PagerDuty' },
    ],
    links: ['remote write、OpenTSDB、Datadog、Falcon 协议', '夜莺在原地查询它们，数据不搬家'],
  },
};

const W = 720;
const CARD_H = 48;
const GAP = 44; // 两层之间连线的长度
const ROW = 42; // 夜莺框内每层的行高
const PAD = 12; // 夜莺框上下内边距
const BADGE_X = 28;
const NAME_X = 52;
const BODY_X = 150;

function Row({ y, layer, inside }: { y: number; layer: Layer; inside?: boolean }) {
  return (
    <g>
      <circle cx={BADGE_X} cy={y} r={11} className={inside ? styles.badgeOn : styles.badge} />
      <text x={BADGE_X} y={y} className={inside ? styles.numOn : styles.num}>{layer.n}</text>
      <text x={NAME_X} y={y} className={styles.name}>{layer.name}</text>
      <text x={BODY_X} y={y} className={styles.body}>{layer.body}</text>
    </g>
  );
}

function Link({ y1, y2, label }: { y1: number; y2: number; label?: string }) {
  return (
    <g>
      <line x1={BADGE_X} y1={y1} x2={BADGE_X} y2={y2 - 7} className={styles.link} />
      <path d={`M${BADGE_X - 5} ${y2 - 9} L${BADGE_X} ${y2 - 1} L${BADGE_X + 5} ${y2 - 9} Z`} className={styles.arrow} />
      {label && <text x={NAME_X} y={(y1 + y2) / 2} className={styles.label}>{label}</text>}
    </g>
  );
}

export default function StackLayers() {
  const { i18n } = useDocusaurusContext();
  const c = COPY[i18n.currentLocale] ?? COPY.en;
  const [l1, l2, l3, l4, l5, l6] = c.layers;

  const y1 = 1;
  const y2 = y1 + CARD_H + GAP;
  const yg = y2 + CARD_H + GAP;
  const gh = PAD * 2 + ROW * 3;
  const y6 = yg + gh + GAP;
  const H = y6 + CARD_H + 1;
  const rowY = (i: number) => yg + PAD + ROW * i + ROW / 2;

  return (
    <div className={styles.wrap}>
      {/* 无障碍名用 aria-label 而不是 <title>：有些抓取器把页内所有 <title> 都拼进页面标题 */}
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={c.title}>

        <rect x={1} y={y1} width={W - 2} height={CARD_H} rx={8} className={styles.card} />
        <Row y={y1 + CARD_H / 2} layer={l1} />
        <Link y1={y1 + CARD_H} y2={y2} label={c.links[0]} />

        <rect x={1} y={y2} width={W - 2} height={CARD_H} rx={8} className={styles.card} />
        <Row y={y2 + CARD_H / 2} layer={l2} />
        <Link y1={y2 + CARD_H} y2={yg} label={c.links[1]} />

        <rect x={1} y={yg} width={W - 2} height={gh} rx={10} className={styles.group} />
        <line x1={BADGE_X} y1={rowY(0)} x2={BADGE_X} y2={rowY(2)} className={styles.spine} />
        <Row y={rowY(0)} layer={l3} inside />
        <Row y={rowY(1)} layer={l4} inside />
        <Row y={rowY(2)} layer={l5} inside />
        <rect x={W - 132} y={rowY(1) - 14} width={114} height={28} rx={14} className={styles.pill} />
        <text x={W - 75} y={rowY(1)} className={styles.pillText}>{c.owner}</text>

        <Link y1={yg + gh} y2={y6} />
        <rect x={1} y={y6} width={W - 2} height={CARD_H} rx={8} className={styles.card} />
        <Row y={y6 + CARD_H / 2} layer={l6} />
      </svg>
    </div>
  );
}
