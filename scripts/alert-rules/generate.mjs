#!/usr/bin/env node
/**
 * 告警规则库：从 src/data/integration-pages/*.json 里挑出 catalog.mjs 列的服务，生成
 *
 *   alert-rules/index.md、alert-rules/<slug>.md                                    英文
 *   i18n/zh-Hans/docusaurus-plugin-content-docs-alert-rules/current/…              中文
 *   static/alert-rules/<slug>.yml                                                  标准 Prometheus 规则文件
 *   alert-rules/<slug>/<告警名小写>.md                                            单条告警页（只给 alerts.mjs 里写了内容的标准告警名）
 *
 * 有单条告警页的服务，服务页放在 <slug>/index.md（地址仍是 /alert-rules/<slug>），
 * 这些规则在服务页上只留简短条目并链到单页，PromQL 和处置步骤只出现在单页上，避免两页抢同一个告警名。
 *
 *   node scripts/alert-rules/generate.mjs
 *
 * 规则正文（PromQL、处置步骤）同时出现在集成页会让两页抢同一批搜索词，所以集成页对已收录的
 * 集成只列规则名并链到这里（见本文件的 coverage()，由 scripts/integration-pages/generate.mjs 调用）。
 * 生成文件整个重写，不要手改；改文案改 catalog.mjs，改结构改这里。
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SERVICES, UPSTREAMS, integrationSlug } from './catalog.mjs';
import { ALERTS } from './alerts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'src', 'data', 'integration-pages');
const OUT = {
  en: join(ROOT, 'alert-rules'),
  zh: join(ROOT, 'i18n', 'zh-Hans', 'docusaurus-plugin-content-docs-alert-rules', 'current'),
  yml: join(ROOT, 'static', 'alert-rules'),
};
const SITE = 'https://n9e.github.io';
const UPSTREAM = 'https://github.com/ccfos/nightingale/tree/main/integrations';
const SOURCE_ORDER = ['default', 'exporter', 'native', 'categraf', 'telegraf'];
const PROM_SEVERITY = { 1: 'critical', 2: 'warning', 3: 'info' };
const ALERTS_SOURCE = 'https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs';

const T = {
  en: {
    title: (s, n) => `${s.name} alert rules for Prometheus: ${n} rules with runbooks`,
    description: (s, n) =>
      `${n} ready-to-use ${s.name} alert rules in PromQL, each with severity, duration and runbook steps. Metrics from ${s.exporter}. Download as a Prometheus rules file or import into Nightingale.`,
    glance: 'At a glance',
    gRules: (n) => `**${n} rules**, each with a PromQL condition, a severity, a \`for\` duration and runbook steps`,
    gMetrics: (e) => `**Metrics from**: ${e}`,
    gYaml: (slug) => `**Download**: [\`${slug}.yml\`](pathname:///alert-rules/${slug}.yml), a standard Prometheus rules file (\`groups:\` format), checked with \`promtool check rules\``,
    gTune: 'Thresholds are starting points. Adjust them to your environment before enabling the rules.',
    listHead: 'Rule list',
    listCols: ['Rule', 'Severity', 'For'],
    group: {
      default: (s) => (s.slug === 'prometheus' ? 'Prometheus self-monitoring' : s.slug === 'kubernetes' ? 'kube-state-metrics, cAdvisor and control plane' : 'General'),
      exporter: (s) => (s.slug === 'linux' ? 'node_exporter' : 'Prometheus exporter'),
      native: () => 'Native metrics',
      categraf: () => 'Categraf',
      telegraf: () => 'Telegraf',
    },
    alsoFor: (names, k, n) => `${k === n ? 'All' : `${k} of the ${n}`} rules in this group also apply unchanged to instances collected by ${names.join(' and ')}, which produces the same metric names.`,
    groupLead: { categraf: 'For hosts and instances collected by Categraf; metric names follow Categraf plugins.', telegraf: 'For hosts collected by Telegraf with Prometheus-style output.' },
    severity: { 1: 'Critical', 2: 'Warning', 3: 'Info' },
    forDuration: (s) => (!s ? '—' : s >= 60 && s % 60 === 0 ? `${s / 60}m` : `${s}s`),
    trigger: 'Trigger',
    runbook: 'Runbook',
    useHead: 'How to use these rules',
    usePrometheus: (slug) =>
      `**With Prometheus or vmalert**: download [\`${slug}.yml\`](pathname:///alert-rules/${slug}.yml), add it to \`rule_files\` (or \`-rule\` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a \`severity\` label (critical / warning / info), and \`runbook_url\` points back to this page, or to the rule's own page where it has one.`,
    useNightingale: (links) =>
      `**With Nightingale**: the same rules ship in the ${links} integration template. Open the integration center, [import the rules into a business group](/docs/data/integrations/import), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.`,
    licenseHead: 'Sources and license',
    licenseUpstream: (u) => `Many rule expressions are adapted from [${u.name}](${u.url}) (${u.license}).`,
    licenseOwn: (idents) =>
      `The runbook steps and the remaining rules come from Nightingale's integration templates (${idents.map((i) => `[${i}](${UPSTREAM}/${i})`).join(', ')}, Apache-2.0). Corrections are welcome as pull requests there.`,
    related: 'Related',
    relHub: '[All alert rules](/alert-rules)',
    // ---------- 单条告警页 ----------
    seePage: (name, url) => `PromQL, common causes and runbook: [${name}](${url})`,
    alertTitle: (n) => `${n} alert: what it means and how to fix it`,
    alertDescription: (n) => `What the ${n} Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.`,
    aSeverity: 'Severity',
    aFor: 'Fires after',
    aService: (s) => `Part of the [${s.name} alert rules](/alert-rules/${s.slug}) (\`${s.slug}.yml\`)`,
    aMeaning: 'What it means',
    aRule: 'The rule',
    aMessage: 'Alert message',
    aVariants: (n) => `The template splits this alert into ${n} rules with different thresholds, windows and severities. Load all of them together.`,
    aCauses: 'Common causes',
    aRunbook: 'How to fix it',
    aNotes: 'Notes',
    colon: ': ',
    paren: (x) => ` (${x})`,
    aSelectors: (sel) => `The expression selects ${sel}. If your scrape job or namespace is named differently, change these matchers or the rule never matches.`,
    aMetrics: 'Metrics it uses',
    aMetricFrom: { 'kube-state-metrics': 'kube-state-metrics', kubelet: 'kubelet', apiserver: 'kube-apiserver', cadvisor: 'cAdvisor (kubelet)', operator: 'Prometheus Operator', prometheus: "Prometheus's own metrics", node: 'node_exporter', recording: 'recording rule from kubernetes-mixin', other: '' },
    aRelated: 'Related alerts',
    aYaml: 'Prometheus rule YAML',
    aYamlLead: (s) => `Add this to a rules file loaded through \`rule_files\`, or download every ${s.name} rule at once as [\`${s.slug}.yml\`](pathname:///alert-rules/${s.slug}.yml).`,
    aNightingale: (ident) => `**With Nightingale**: this rule ships in the [${ident} integration](/integrations/${integrationSlug(ident)}) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.`,
    aLicense: (u) => `The rule expression is adapted from [${u.name}](${u.url}) (${u.license}). The runbook steps come from [Nightingale's integration templates](${UPSTREAM}) (Apache-2.0); the explanation and causes are written for this page.`,
    hubByName: 'Runbooks by alert name',
    hubByNameLead: 'These standard alert names, used by kubernetes-mixin and kube-prometheus, each have their own page with the meaning, common causes, the rule and the runbook.',
    relIntegration: (n, slug) => `[Monitor ${n} with Nightingale](/integrations/${slug}): collector config, dashboards and metric reference`,
    relWrite: '[Write a metric rule in Nightingale](/docs/alerting/metric-rules)',
    // ---------- 目录页 ----------
    hubTitle: 'Prometheus alert rules with runbooks',
    hubDescription: (n, k) =>
      `${n} Prometheus alert rules for ${k} services, including Kubernetes, Linux, MySQL and Redis. Every rule has a PromQL condition, a severity, a duration and runbook steps. Free to download as Prometheus rules files.`,
    hubIntro: (n) =>
      `An alert rule is only half the job: when it fires at 3 a.m., someone needs to know what to check first. This library collects ${n} PromQL alert rules from Nightingale's integration templates, and every one of them comes with runbook steps written for the person on call. The rules use standard exporter metric names (node_exporter, kube-state-metrics, mysqld_exporter and so on), so they work with plain Prometheus as well as with Nightingale.`,
    hubCols: ['Service', 'Rules', 'Metrics from', 'Download'],
    hubFormatHead: 'Rule format',
    hubFormat: [
      'Each service page lists every rule with its PromQL condition, severity, `for` duration and runbook steps, grouped by the collector that produces the metrics. Standard alert names with their own page appear there as a short entry with a link.',
      'Each `.yml` file is a standard Prometheus rules file and passes `promtool check rules`. Severity is a `severity` label (critical / warning / info), the summary is in `annotations.summary`, and `annotations.runbook_url` links to the rule page.',
      'Thresholds are starting points, not recommendations for every environment. Review them before you enable a rule.',
    ],
    hubWhyHead: 'Why the runbooks matter',
    hubWhy:
      'A rule without a runbook moves the investigation to whoever is on call. The steps here say what to look at first (the log before the last restart, the exit code, the slow query list, the replication thread state) and what usually fixes it, so the alert carries its own first response.',
    hubLicenseHead: 'Sources and license',
    hubLicense: (ups) =>
      `Rule expressions are partly adapted from community collections: ${ups.map((u) => `[${u.name}](${u.url}) (${u.license})`).join(', ')}. Runbook steps and the remaining rules come from [Nightingale's integration templates](${UPSTREAM}) (Apache-2.0).`,
    hubRelated: ['[Integrations](/integrations): collector config and dashboards for each service', '[Alert rules in Nightingale](/docs/alerting/overview)', '[Rule design practices](/docs/alerting/best-practices)'],
  },
  zh: {
    title: (s, n) => `${s.name} 告警规则：${n} 条 PromQL 规则与处置步骤`,
    description: (s, n) =>
      `${n} 条开箱可用的 ${s.name} 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 ${s.exporter}。可下载为 Prometheus 规则文件，或导入夜莺。`,
    glance: '概览',
    gRules: (n) => `**${n} 条规则**，每条都有 PromQL 触发条件、级别、持续时间（\`for\`）和处置步骤`,
    gMetrics: (e) => `**指标来源**：${e}`,
    gYaml: (slug) => `**下载**：[\`${slug}.yml\`](pathname:///alert-rules/${slug}.yml)，标准 Prometheus 规则文件（\`groups:\` 格式），已用 \`promtool check rules\` 校验`,
    gTune: '阈值只是起点，启用前请按自己的环境调整。',
    listHead: '规则一览',
    listCols: ['规则', '级别', '持续'],
    group: {
      default: (s) => (s.slug === 'prometheus' ? 'Prometheus 自监控' : s.slug === 'kubernetes' ? 'kube-state-metrics、cAdvisor 与控制面' : '通用规则'),
      exporter: (s) => (s.slug === 'linux' ? 'node_exporter' : 'Prometheus exporter'),
      native: () => '原生指标',
      categraf: () => 'Categraf',
      telegraf: () => 'Telegraf',
    },
    alsoFor: (names, k, n) => `${k === n ? '本组全部' : `本组 ${n} 条中有 ${k} 条`}规则对用 ${names.join('、')} 采集的实例同样适用，指标名完全一致。`,
    groupLead: { categraf: '适用于用 Categraf 采集的主机和实例，指标名遵循 Categraf 插件。', telegraf: '适用于用 Telegraf 采集、以 Prometheus 格式输出的主机。' },
    severity: { 1: '紧急', 2: '警告', 3: '提醒' },
    forDuration: (s) => (!s ? '—' : s >= 60 && s % 60 === 0 ? `${s / 60} 分钟` : `${s} 秒`),
    trigger: '触发条件',
    runbook: '处置步骤',
    useHead: '怎么使用这些规则',
    usePrometheus: (slug) =>
      `**用 Prometheus 或 vmalert**：下载 [\`${slug}.yml\`](pathname:///alert-rules/${slug}.yml)，加到 \`rule_files\`（vmalert 用 \`-rule\` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 \`severity\` 标签里（critical / warning / info），\`runbook_url\` 指回本页；有单独页面的规则指向它自己的页面。`,
    useNightingale: (links) =>
      `**用夜莺**：同样的规则内置在 ${links} 集成模板里。在集成中心把规则[导入到业务组](/docs/data/integrations/import)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。`,
    licenseHead: '来源与许可',
    licenseUpstream: (u) => `不少规则表达式改编自 [${u.name}](${u.url})（${u.license}）。`,
    licenseOwn: (idents) =>
      `处置步骤和其余规则来自夜莺的集成模板（${idents.map((i) => `[${i}](${UPSTREAM}/${i})`).join('、')}，Apache-2.0），欢迎在那里提 PR 修正。`,
    related: '相关链接',
    relHub: '[全部告警规则](/alert-rules)',
    seePage: (name, url) => `PromQL、常见原因与处置步骤：[${name}](${url})`,
    alertTitle: (n) => `${n} 告警：含义、常见原因与处置`,
    alertDescription: (n) => `Prometheus 告警 ${n} 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。`,
    aSeverity: '级别',
    aFor: '持续',
    aService: (s) => `属于 [${s.name} 告警规则](/alert-rules/${s.slug})（\`${s.slug}.yml\`）`,
    aMeaning: '含义',
    aRule: '规则',
    aMessage: '告警信息',
    aVariants: (n) => `模板把这个告警按阈值、时间窗口和级别拆成了 ${n} 条规则，请一起加载。`,
    aCauses: '常见原因',
    aRunbook: '处置步骤',
    aNotes: '补充说明',
    colon: '：',
    paren: (x) => `（${x}）`,
    aSelectors: (sel) => `表达式里限定了 ${sel}。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。`,
    aMetrics: '用到的指标',
    aMetricFrom: { 'kube-state-metrics': 'kube-state-metrics', kubelet: 'kubelet', apiserver: 'kube-apiserver', cadvisor: 'cAdvisor（kubelet）', operator: 'Prometheus Operator', prometheus: 'Prometheus 自身指标', node: 'node_exporter', recording: 'kubernetes-mixin 的 recording rule', other: '' },
    aRelated: '相关告警',
    aYaml: 'Prometheus 规则 YAML',
    aYamlLead: (s) => `加到通过 \`rule_files\` 加载的规则文件里即可；也可以一次下载全部 ${s.name} 规则：[\`${s.slug}.yml\`](pathname:///alert-rules/${s.slug}.yml)。`,
    aNightingale: (ident) => `**用夜莺**：这条规则内置在 [${ident} 集成](/integrations/${integrationSlug(ident)})模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。`,
    aLicense: (u) => `规则表达式改编自 [${u.name}](${u.url})（${u.license}）。处置步骤来自[夜莺的集成模板](${UPSTREAM})（Apache-2.0），含义和常见原因为本页撰写。`,
    hubByName: '按告警名查处置手册',
    hubByNameLead: '下面这些是 kubernetes-mixin 和 kube-prometheus 使用的标准告警名，每个都有单独一页，写明含义、常见原因、规则和处置步骤。',
    relIntegration: (n, slug) => `[用夜莺监控 ${n}](/integrations/${slug})：采集配置、仪表盘与指标说明`,
    relWrite: '[在夜莺里写指标告警规则](/docs/alerting/metric-rules)',
    hubTitle: 'Prometheus 告警规则库：附处置步骤',
    hubDescription: (n, k) =>
      `${k} 个服务的 ${n} 条 Prometheus 告警规则，涵盖 Kubernetes、Linux、MySQL、Redis 等。每条都有 PromQL 触发条件、级别、持续时间和处置步骤，可免费下载为 Prometheus 规则文件。`,
    hubIntro: (n) =>
      `告警规则只做了一半的事：凌晨三点响起来的时候，值班的人还得知道先查什么。这个规则库收录了夜莺集成模板里的 ${n} 条 PromQL 告警规则，每一条都附有写给值班人的处置步骤。规则使用标准 exporter 的指标名（node_exporter、kube-state-metrics、mysqld_exporter 等），所以既能用在夜莺里，也能直接给 Prometheus 使用。`,
    hubCols: ['服务', '规则数', '指标来源', '下载'],
    hubFormatHead: '规则格式',
    hubFormat: [
      '每个服务一页，列出全部规则的 PromQL 触发条件、级别、持续时间和处置步骤，按产生指标的采集器分组。有单独页面的标准告警名，在服务页上只留简短条目和链接。',
      '每个 `.yml` 文件都是标准 Prometheus 规则文件，并通过了 `promtool check rules`。级别写在 `severity` 标签（critical / warning / info），摘要在 `annotations.summary`，`annotations.runbook_url` 指向对应的规则页。',
      '阈值只是起点，不是对所有环境都合适的推荐值。启用前请逐条确认。',
    ],
    hubWhyHead: '为什么要附处置步骤',
    hubWhy:
      '没有处置步骤的规则，等于把排查工作整个丢给值班的人。这里的步骤写明了先看什么（上次重启前的日志、退出码、慢查询列表、复制线程状态）以及通常怎么修，让告警自带第一步响应。',
    hubLicenseHead: '来源与许可',
    hubLicense: (ups) =>
      `部分规则表达式改编自社区规则集：${ups.map((u) => `[${u.name}](${u.url})（${u.license}）`).join('、')}。处置步骤与其余规则来自[夜莺的集成模板](${UPSTREAM})（Apache-2.0）。`,
    hubRelated: ['[集成](/integrations)：每个服务的采集配置与仪表盘', '[夜莺的告警规则](/docs/alerting/overview)', '[规则设计实践](/docs/alerting/best-practices)'],
  },
};

const yamlStr = (s) => JSON.stringify(s);
const esc = (s) => String(s ?? '').replace(/[<{}]/g, '\\$&');
const cell = (s) => esc(s).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();
const pick = (lang, zh, en) => (lang === 'en' ? en || zh : zh || en);
function fence(body, lang = '') {
  const longest = Math.max(2, ...[...body.matchAll(/`{3,}/g)].map((m) => m[0].length));
  const f = '`'.repeat(longest + 1);
  return `${f}${lang}\n${body.replace(/\s+$/, '')}\n${f}`;
}
function steps(action) {
  return esc(action)
    .split(/\n+/)
    .map((l) => l.replace(/^\s*\d+[).、]\s*/, '').trim())
    .filter(Boolean)
    .map((l) => `1. ${l}`)
    .join('\n');
}
const promqlOf = (a) => a.queries.map((q) => (q.promql ?? '').trim()).filter(Boolean);

/** 一条规则在集成模板里的身份：集成 + 英文名 + 原始表达式。集成页据此判断哪些规则已收进规则库 */
export const ruleId = (ident, a) => `${ident}\u0000${a.name_en}\u0000${promqlOf(a).join('\n')}`;

/**
 * 按 catalog 取出一个服务的规则。只收有 PromQL 的；表达式相同、处置步骤也相同的只留一条
 * （标准 exporter 优先，并记下另一种采集器同样适用）。处置步骤不同就不合并，免得丢内容。
 * covered 记下所有在本页有完整内容的规则（含被合并的），供集成页使用。
 */
async function collect(service, cache) {
  const rules = [];
  const covered = new Set();
  const candidates = [];
  for (const [ident, keep] of service.from) {
    if (!cache.has(ident)) cache.set(ident, JSON.parse(await readFile(join(DATA, `${ident}.json`), 'utf8')));
    for (const a of cache.get(ident).alerts) {
      if (keep(a) && promqlOf(a).length > 0) candidates.push({ ...a, ident });
    }
  }
  candidates.sort((a, b) => SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source));
  const byExpr = new Map();
  for (const a of candidates) {
    const expr = promqlOf(a).join('\n').replace(/\s+/g, '');
    const prev = byExpr.get(expr);
    covered.add(ruleId(a.ident, a));
    if (prev && (prev.action_en ?? '') === (a.action_en ?? '') && (prev.action ?? '') === (a.action ?? '')) {
      if (prev.source !== a.source) prev.alsoFor = [...new Set([...(prev.alsoFor ?? []), a.source])];
      continue;
    }
    if (!prev) byExpr.set(expr, a);
    rules.push(a);
  }
  return { rules, covered };
}

function groupBySource(rules) {
  const groups = new Map();
  for (const r of rules) {
    if (!groups.has(r.source)) groups.set(r.source, []);
    groups.get(r.source).push(r);
  }
  return [...groups.entries()].sort((a, b) => SOURCE_ORDER.indexOf(a[0]) - SOURCE_ORDER.indexOf(b[0]));
}

function renderService(lang, s, rules, position, fetchedAt) {
  const t = T[lang];
  const n = rules.length;
  const idents = [...new Set(s.from.map(([i]) => i))];
  const out = [];
  out.push('---');
  out.push(`title: ${yamlStr(t.title(s, n))}`);
  out.push(`sidebar_label: ${yamlStr(s.name)}`);
  out.push(`sidebar_position: ${position}`);
  out.push(`description: ${yamlStr(t.description(s, n))}`);
  out.push(`last_reviewed: ${fetchedAt}`);
  out.push(`custom_edit_url: ${UPSTREAM}/${idents[0]}`);
  out.push('toc_max_heading_level: 2');
  out.push('mdx:', '  format: md');
  out.push('---', '');
  out.push(s.intro[lang], '');

  out.push(`## ${t.glance}`, '');
  out.push(`- ${t.gRules(n)}`, `- ${t.gMetrics(s.exporter)}`, `- ${t.gYaml(s.slug)}`, `- ${t.gTune}`, '');

  const groups = groupBySource(rules);
  out.push(`## ${t.listHead}`, '');
  out.push(`| ${t.listCols.join(' | ')} |`, '| --- | --- | --- |');
  for (const [, rs] of groups) {
    for (const r of rs) {
      const nm = cell(pick(lang, r.name, r.name_en));
      out.push(`| ${r.page ? `[${nm}](${r.page})` : nm} | ${t.severity[r.severity] ?? ''} | ${t.forDuration(r.for)} |`);
    }
  }
  out.push('');

  for (const [src, rs] of groups) {
    out.push(`## ${t.group[src](s)} (${rs.length})`.replace(' (', lang === 'en' ? ' (' : '（').replace(/\)$/, lang === 'en' ? ')' : '）'), '');
    if (t.groupLead[src]) out.push(t.groupLead[src], '');
    const also = [...new Set(rs.flatMap((r) => r.alsoFor ?? []))];
    if (also.length) out.push(t.alsoFor(also.map((a) => t.group[a](s)), rs.filter((r) => r.alsoFor).length, rs.length), '');
    for (const r of rs) {
      out.push(`### ${esc(pick(lang, r.name, r.name_en)).trim()}`, '');
      const note = esc(pick(lang, r.note, r.note_en)).trim();
      if (note) out.push(note, '');
      if (r.page) {
        out.push(`${t.severity[r.severity] ?? ''} · ${t.forDuration(r.for)} · ${t.seePage(baseName(r.name_en), r.page)}`, '');
        continue;
      }
      out.push(`${t.severity[r.severity] ?? ''} · ${t.forDuration(r.for)} · ${t.trigger}:`, '');
      out.push(fence(promqlOf(r).join('\n\n'), 'promql'), '');
      const act = pick(lang, r.action, r.action_en);
      if (act) out.push(`${t.runbook}:`, '', steps(act), '');
    }
  }

  out.push(`## ${t.useHead}`, '');
  out.push(`- ${t.usePrometheus(s.slug)}`);
  const links = idents.map((i) => `[${i}](/integrations/${integrationSlug(i)})`).join(lang === 'en' ? ' and ' : '、');
  out.push(`- ${t.useNightingale(links)}`, '');

  out.push(`## ${t.licenseHead}`, '');
  const up = s.upstream ? UPSTREAMS[s.upstream] : null;
  out.push([up ? t.licenseUpstream({ name: s.upstream, ...up }) : '', t.licenseOwn(idents)].filter(Boolean).join(' '), '');

  out.push(`## ${t.related}`, '');
  for (const i of idents) out.push(`- ${t.relIntegration(i, integrationSlug(i))}`);
  out.push(`- ${t.relWrite}`, `- ${t.relHub}`, '');
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function renderHub(lang, built, fetchedAt) {
  const t = T[lang];
  const total = built.reduce((a, b) => a + b.rules.length, 0);
  const out = [];
  out.push('---');
  out.push(`title: ${yamlStr(t.hubTitle)}`);
  out.push(`sidebar_label: ${yamlStr(lang === 'en' ? 'Overview' : '概览')}`);
  out.push('sidebar_position: 0');
  out.push('slug: /');
  out.push(`description: ${yamlStr(t.hubDescription(total, built.length))}`);
  out.push(`last_reviewed: ${fetchedAt}`);
  out.push('custom_edit_url: null');
  out.push('mdx:', '  format: md');
  out.push('---', '');
  out.push(t.hubIntro(total), '');
  out.push(`| ${t.hubCols.join(' | ')} |`, '| --- | ---: | --- | --- |');
  for (const { s, rules } of built) {
    out.push(`| [${s.name}](/alert-rules/${s.slug}) | ${rules.length} | ${cell(s.exporter)} | [\`${s.slug}.yml\`](pathname:///alert-rules/${s.slug}.yml) |`);
  }
  out.push('');
  const paged = built.filter((b) => b.groups?.length);
  if (paged.length) {
    out.push(`## ${t.hubByName}`, '', t.hubByNameLead, '');
    for (const { s, groups } of paged) {
      const links = groups.map((g) => `[${baseName(g[0].name_en)}](${g[0].page})`);
      out.push(`- **${s.name}**: ${links.join(', ')}`);
    }
    out.push('');
  }
  out.push(`## ${t.hubFormatHead}`, '', ...t.hubFormat.map((l) => `- ${l}`), '');
  out.push(`## ${t.hubWhyHead}`, '', t.hubWhy, '');
  const ups = [...new Set(built.map((b) => b.s.upstream).filter(Boolean))].map((k) => ({ name: k, ...UPSTREAMS[k] }));
  out.push(`## ${t.hubLicenseHead}`, '', t.hubLicense(ups), '');
  out.push(`## ${T[lang].related}`, '', ...t.hubRelated.map((l) => `- ${l}`), '');
  return out.join('\n');
}

const ymlQuote = (s) => JSON.stringify(String(s ?? '').trim());
function renderYaml(s, rules) {
  const up = s.upstream ? UPSTREAMS[s.upstream] : null;
  const lines = [
    `# ${s.name} alert rules — ${SITE}/alert-rules/${s.slug}`,
    '# Generated from the Nightingale integration templates: https://github.com/ccfos/nightingale/tree/main/integrations',
    up ? `# Many expressions are adapted from ${s.upstream} (${up.url}, ${up.license}).` : null,
    '# Thresholds are starting points: review them before enabling.',
    'groups:',
  ].filter((l) => l !== null);
  for (const [src, rs] of groupBySource(rules)) {
    lines.push(`  - name: ${ymlQuote(`${s.slug}-${src}`)}`, '    rules:');
    for (const r of rs) {
      for (const q of r.queries) {
        const expr = (q.promql ?? '').trim();
        if (!expr) continue;
        lines.push(`      - alert: ${ymlQuote(r.name_en || r.name)}`);
        lines.push('        expr: |-');
        for (const l of expr.split('\n')) lines.push(l ? `          ${l}` : '');
        if (r.for) lines.push(`        for: ${r.for % 60 === 0 ? `${r.for / 60}m` : `${r.for}s`}`);
        lines.push('        labels:', `          severity: ${PROM_SEVERITY[q.severity ?? r.severity] ?? 'warning'}`);
        lines.push('        annotations:');
        if (r.note_en || r.note) lines.push(`          summary: ${ymlQuote(r.note_en || r.note)}`);
        lines.push(`          runbook_url: ${ymlQuote(`${SITE}${r.page ?? `/alert-rules/${s.slug}`}`)}`);
      }
    }
  }
  return `${lines.join('\n')}\n`;
}

// ---------------- 单条告警页 ----------------

const alertSlug = (name) => name.toLowerCase();
/** 模板里同一个告警按级别和窗口拆成了几条（KubeAPIErrorBudgetBurn-S1-120s 等），单页按去掉后缀的名字合并 */
const baseName = (name) => (name ?? '').replace(/-S\d+(-\d+s)?$/, '');
const PROMQL_WORDS = new Set([
  'sum', 'min', 'max', 'avg', 'count', 'topk', 'bottomk', 'quantile', 'stddev', 'stdvar', 'group', 'by', 'without', 'on',
  'ignoring', 'group_left', 'group_right', 'and', 'or', 'unless', 'bool', 'offset', 'absent', 'absent_over_time',
  'rate', 'irate', 'increase', 'delta', 'idelta', 'deriv', 'changes', 'resets', 'predict_linear', 'histogram_quantile',
  'max_over_time', 'min_over_time', 'avg_over_time', 'sum_over_time', 'count_over_time', 'last_over_time',
  'quantile_over_time', 'label_replace', 'label_join', 'clamp_min', 'clamp_max', 'abs', 'time', 'vector', 'scalar',
]);

/** 从 PromQL 里取出指标名：去掉注释、字符串、{} 里的标签匹配和 by/on(...) 里的标签名，剩下的标识符排除函数和关键字 */
function metricsOf(exprs) {
  const names = new Set();
  for (let e of exprs) {
    e = e.replace(/#[^\n]*/g, '').replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\{[^}]*\}/g, ' ').replace(/\[[^\]]*\]/g, ' ');
    e = e.replace(/\b(by|without|on|ignoring|group_left|group_right)\s*\([^)]*\)/g, ' ');
    for (const m of e.matchAll(/[a-zA-Z_:][a-zA-Z0-9_:]*/g)) {
      const w = m[0];
      if (PROMQL_WORDS.has(w) || /^(e|inf|nan)$/i.test(w)) continue;
      names.add(w);
    }
  }
  return [...names];
}
function metricSource(m) {
  if (m.includes(':')) return 'recording';
  if (m === 'up') return 'prometheus';
  if (m.startsWith('kube_')) return 'kube-state-metrics';
  if (m.startsWith('kubelet_')) return 'kubelet';
  if (m.startsWith('apiserver_') || m.startsWith('aggregator_')) return 'apiserver';
  if (m.startsWith('container_')) return 'cadvisor';
  if (m.startsWith('prometheus_operator_')) return 'operator';
  if (m.startsWith('prometheus_')) return 'prometheus';
  if (m.startsWith('node_')) return 'node';
  return 'other';
}
/** 表达式里写死的 job / namespace 匹配条件，单页上提醒用户按自己的环境改 */
function fixedSelectors(exprs) {
  const sel = new Set();
  for (const e of exprs) for (const m of e.matchAll(/\b(job|namespace)\s*=\s*"([^"]+)"/g)) sel.add(`\`${m[1]}="${m[2]}"\``);
  return [...sel];
}

/**
 * 门禁：单页的文字里，和其它规则共用的部分（同一段处置步骤被多条规则复用）不能超过 60%。
 * 手写的含义、原因、须知是本页独有的；没过门禁的告警不出单页，留在服务页上完整显示。
 */
function uniqueShare(entry, r, actionUse) {
  const own = [entry.en.meaning, ...entry.en.causes, ...(entry.en.notes ?? []), r.note_en ?? ''].join(' ').length;
  const runbook = (r.action_en ?? '').length;
  const shared = (actionUse.get(r.action_en ?? '') ?? 0) > 1 ? runbook : 0;
  return 1 - shared / (own + runbook);
}

function ruleYaml(r) {
  const lines = [];
  for (const q of r.queries) {
    const expr = (q.promql ?? '').trim();
    if (!expr) continue;
    lines.push(`- alert: ${r.name_en}`, '  expr: |-');
    for (const l of expr.split('\n')) lines.push(l ? `    ${l}` : '');
    if (r.for) lines.push(`  for: ${r.for % 60 === 0 ? `${r.for / 60}m` : `${r.for}s`}`);
    lines.push('  labels:', `    severity: ${PROM_SEVERITY[q.severity ?? r.severity] ?? 'warning'}`, '  annotations:');
    if (r.note_en || r.note) lines.push(`    summary: ${ymlQuote(r.note_en || r.note)}`);
    lines.push(`    runbook_url: ${ymlQuote(`${SITE}${r.page}`)}`);
  }
  return lines.join('\n');
}

function renderAlert(lang, s, group, position, fetchedAt, findRule) {
  const t = T[lang];
  const r = group[0];
  const name = baseName(r.name_en);
  const entry = ALERTS[name];
  const c = entry[lang];
  const exprs = group.flatMap(promqlOf);
  const out = [];
  out.push('---');
  out.push(`title: ${yamlStr(t.alertTitle(name))}`);
  out.push(`sidebar_label: ${yamlStr(name)}`);
  out.push(`sidebar_position: ${position}`);
  out.push(`description: ${yamlStr(t.alertDescription(name))}`);
  out.push(`last_reviewed: ${fetchedAt}`);
  // 页面上大部分文字是本仓库 alerts.mjs 里手写的，编辑入口指向那里
  out.push(`custom_edit_url: ${ALERTS_SOURCE}`);
  out.push('toc_max_heading_level: 2');
  out.push('mdx:', '  format: md');
  out.push('---', '');
  out.push(c.meaning, '');
  if (group.length === 1) {
    out.push(`- **${t.aSeverity}**${t.colon}${t.severity[r.severity] ?? ''}${t.paren(`\`${PROM_SEVERITY[r.severity] ?? 'warning'}\``)}`);
    out.push(`- **${t.aFor}**${t.colon}${t.forDuration(r.for)}`);
  }
  out.push(`- ${t.aService(s)}`, '');

  out.push(`## ${t.aRule}`, '');
  if (group.length === 1) out.push(fence(exprs.join('\n\n'), 'promql'), '');
  else {
    out.push(t.aVariants(group.length), '');
    for (const g of group) {
      out.push(`### ${g.name_en}`, '', `${t.severity[g.severity] ?? ''}${t.paren(`\`${PROM_SEVERITY[g.severity] ?? 'warning'}\``)} · ${t.aFor}${t.colon}${t.forDuration(g.for)}`, '');
      out.push(fence(promqlOf(g).join('\n\n'), 'promql'), '');
    }
  }
  // 代码段里不转义（反斜杠会原样显示）；含反引号的放不进代码段，退回普通转义文本
  const note = pick(lang, r.note, r.note_en).trim();
  if (note) out.push(`${t.aMessage}${t.colon}${note.includes('`') ? esc(note) : `\`${note}\``}`, '');

  out.push(`## ${t.aCauses}`, '', ...c.causes.map((x) => `- ${x}`), '');
  const act = pick(lang, r.action, r.action_en);
  if (act) out.push(`## ${t.aRunbook}`, '', steps(act), '');

  const notes = [...(c.notes ?? [])];
  const sel = fixedSelectors(exprs);
  if (sel.length) notes.push(t.aSelectors(sel.join(lang === 'en' ? ', ' : '、')));
  if (notes.length) out.push(`## ${t.aNotes}`, '', ...notes.map((x) => `- ${x}`), '');

  const metrics = metricsOf(exprs);
  if (metrics.length) {
    out.push(`## ${t.aMetrics}`, '');
    for (const m of metrics) {
      const from = t.aMetricFrom[metricSource(m)];
      out.push(`- \`${m}\`${from ? t.paren(from) : ''}`);
    }
    out.push('');
  }

  const rel = entry.related
    .map((n) => {
      const hit = findRule(n);
      if (!hit) return null;
      const url = hit.r.page ?? `/alert-rules/${hit.s.slug}#${hit.r.name_en.toLowerCase()}`;
      const desc = esc(pick(lang, hit.r.note, hit.r.note_en).replace(/\{\{[^}]*\}\}/g, '…')).trim();
      return `- [${n}](${url})${desc ? `${t.colon}${desc}` : ''}`;
    })
    .filter(Boolean);
  if (rel.length) out.push(`## ${t.aRelated}`, '', ...rel, '');

  out.push(`## ${t.aYaml}`, '', t.aYamlLead(s), '');
  out.push(fence(group.map(ruleYaml).join('\n'), 'yaml'), '');
  out.push(t.aNightingale(r.ident), '');

  out.push(`## ${t.licenseHead}`, '');
  const up = s.upstream ? UPSTREAMS[s.upstream] : null;
  out.push(up ? t.aLicense({ name: s.upstream, ...up }) : t.licenseOwn([r.ident]), '');
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** 给有手写内容、且过了门禁的告警标上 r.page（同名的几个变体共用一页）。返回 { pages, held, groups } */
function assignPages(built, cache) {
  const actionUse = new Map();
  for (const d of cache.values()) for (const a of d.alerts) actionUse.set(a.action_en ?? '', (actionUse.get(a.action_en ?? '') ?? 0) + 1);
  const report = { pages: 0, held: [] };
  const seen = new Set();
  for (const b of built) {
    b.groups = [];
    const byName = new Map();
    for (const r of b.rules) {
      const name = baseName(r.name_en);
      const entry = ALERTS[name];
      if (!entry || entry.service !== b.s.slug) continue;
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(r);
    }
    for (const [name, group] of byName) {
      const share = uniqueShare(ALERTS[name], group[0], actionUse);
      seen.add(name);
      if (share < 0.4) {
        report.held.push(`${name}（独有内容 ${Math.round(share * 100)}%）`);
        continue;
      }
      for (const r of group) r.page = `/alert-rules/${b.s.slug}/${alertSlug(name)}`;
      b.groups.push(group);
      report.pages++;
    }
  }
  for (const name of Object.keys(ALERTS)) if (!seen.has(name)) report.held.push(`${name}（不在规则库里）`);
  return report;
}

/** 给集成页用：ident → { pages: 收录了它规则的规则库页面, covered: 已收录的规则 } */
export async function coverage() {
  const cache = new Map();
  const map = {};
  for (const s of SERVICES) {
    const { covered } = await collect(s, cache);
    for (const [ident] of s.from) {
      const ids = [...covered].filter((id) => id.startsWith(`${ident}\u0000`));
      if (!ids.length) continue;
      map[ident] ??= { pages: [], covered: new Set() };
      map[ident].pages.push({ slug: s.slug, name: s.name });
      for (const id of ids) map[ident].covered.add(id);
    }
  }
  return map;
}

async function main() {
  const index = JSON.parse(await readFile(join(DATA, 'index.json'), 'utf8'));
  const fetchedAt = index.fetchedAt;
  // 整个目录都是生成物：先清空再写，拿掉的服务和告警不会留下旧文件
  for (const dir of Object.values(OUT)) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
  const cache = new Map();
  const built = [];
  for (const s of SERVICES) built.push({ s, rules: (await collect(s, cache)).rules });
  const report = assignPages(built, cache);
  const findRule = (name) => {
    for (const { s, rules } of built) {
      const r = rules.find((x) => x.name_en === name) ?? rules.find((x) => baseName(x.name_en) === name);
      if (r) return { s, r };
    }
    return null;
  };

  for (const lang of ['en', 'zh']) {
    await writeFile(join(OUT[lang], 'index.md'), renderHub(lang, built, fetchedAt));
    for (const [i, { s, rules }] of built.entries()) {
      const paged = built[i].groups;
      if (!paged.length) {
        await writeFile(join(OUT[lang], `${s.slug}.md`), renderService(lang, s, rules, i + 1, fetchedAt));
        continue;
      }
      // 有单页的服务做成侧边栏分类：<slug>/index.md 是分类首页，地址不变
      const dir = join(OUT[lang], s.slug);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'index.md'), renderService(lang, s, rules, i + 1, fetchedAt));
      if (lang === 'en') await writeFile(join(dir, '_category_.json'), `${JSON.stringify({ label: s.name, position: i + 1, collapsed: true }, null, 2)}\n`);
      for (const [j, group] of paged.entries()) {
        await writeFile(join(dir, `${alertSlug(baseName(group[0].name_en))}.md`), renderAlert(lang, s, group, j + 1, fetchedAt, findRule));
      }
    }
  }
  for (const { s, rules } of built) await writeFile(join(OUT.yml, `${s.slug}.yml`), renderYaml(s, rules));
  const total = built.reduce((a, b) => a + b.rules.length, 0);
  console.log(`已生成告警规则库：${built.length} 个服务、${total} 条规则、${report.pages} 个单条告警页（中英各一份）`);
  if (report.held.length) console.log(`未出单页：${report.held.join('、')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
