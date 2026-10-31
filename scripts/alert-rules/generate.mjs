#!/usr/bin/env node
/**
 * 告警规则库：从 src/data/integration-pages/*.json 里挑出 catalog.mjs 列的服务，生成
 *
 *   alert-rules/index.md、alert-rules/<slug>.md                                    英文
 *   i18n/zh-Hans/docusaurus-plugin-content-docs-alert-rules/current/…              中文
 *   static/alert-rules/<slug>.yml                                                  标准 Prometheus 规则文件
 *
 *   node scripts/alert-rules/generate.mjs
 *
 * 规则正文（PromQL、处置步骤）同时出现在集成页会让两页抢同一批搜索词，所以集成页对已收录的
 * 集成只列规则名并链到这里（见本文件的 coverage()，由 scripts/integration-pages/generate.mjs 调用）。
 * 生成文件整个重写，不要手改；改文案改 catalog.mjs，改结构改这里。
 */
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SERVICES, UPSTREAMS, integrationSlug } from './catalog.mjs';

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
      `**With Prometheus or vmalert**: download [\`${slug}.yml\`](pathname:///alert-rules/${slug}.yml), add it to \`rule_files\` (or \`-rule\` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a \`severity\` label (critical / warning / info), and \`runbook_url\` points back to this page.`,
    useNightingale: (links) =>
      `**With Nightingale**: the same rules ship in the ${links} integration template. Open the integration center, [import the rules into a business group](/docs/data/integrations/import), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.`,
    licenseHead: 'Sources and license',
    licenseUpstream: (u) => `Many rule expressions are adapted from [${u.name}](${u.url}) (${u.license}).`,
    licenseOwn: (idents) =>
      `The runbook steps and the remaining rules come from Nightingale's integration templates (${idents.map((i) => `[${i}](${UPSTREAM}/${i})`).join(', ')}, Apache-2.0). Corrections are welcome as pull requests there.`,
    related: 'Related',
    relHub: '[All alert rules](/alert-rules)',
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
      'Each page lists every rule with its PromQL condition, severity, `for` duration and runbook steps, grouped by the collector that produces the metrics.',
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
      `**用 Prometheus 或 vmalert**：下载 [\`${slug}.yml\`](pathname:///alert-rules/${slug}.yml)，加到 \`rule_files\`（vmalert 用 \`-rule\` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 \`severity\` 标签里（critical / warning / info），\`runbook_url\` 指回本页。`,
    useNightingale: (links) =>
      `**用夜莺**：同样的规则内置在 ${links} 集成模板里。在集成中心把规则[导入到业务组](/docs/data/integrations/import)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。`,
    licenseHead: '来源与许可',
    licenseUpstream: (u) => `不少规则表达式改编自 [${u.name}](${u.url})（${u.license}）。`,
    licenseOwn: (idents) =>
      `处置步骤和其余规则来自夜莺的集成模板（${idents.map((i) => `[${i}](${UPSTREAM}/${i})`).join('、')}，Apache-2.0），欢迎在那里提 PR 修正。`,
    related: '相关链接',
    relHub: '[全部告警规则](/alert-rules)',
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
      '每个服务一页，列出全部规则的 PromQL 触发条件、级别、持续时间和处置步骤，按产生指标的采集器分组。',
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
      out.push(`| ${cell(pick(lang, r.name, r.name_en))} | ${t.severity[r.severity] ?? ''} | ${t.forDuration(r.for)} |`);
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
        lines.push(`          runbook_url: ${ymlQuote(`${SITE}/alert-rules/${s.slug}`)}`);
      }
    }
  }
  return `${lines.join('\n')}\n`;
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
  for (const dir of Object.values(OUT)) await mkdir(dir, { recursive: true });
  const cache = new Map();
  const built = [];
  for (const s of SERVICES) built.push({ s, rules: (await collect(s, cache)).rules });

  const written = new Set(['index.md']);
  for (const lang of ['en', 'zh']) {
    await writeFile(join(OUT[lang], 'index.md'), renderHub(lang, built, fetchedAt));
    for (const [i, { s, rules }] of built.entries()) {
      await writeFile(join(OUT[lang], `${s.slug}.md`), renderService(lang, s, rules, i + 1, fetchedAt));
      written.add(`${s.slug}.md`);
    }
  }
  const ymls = new Set();
  for (const { s, rules } of built) {
    await writeFile(join(OUT.yml, `${s.slug}.yml`), renderYaml(s, rules));
    ymls.add(`${s.slug}.yml`);
  }
  // 从 catalog 里拿掉的服务，生成文件一并删除
  for (const lang of ['en', 'zh']) {
    for (const f of await readdir(OUT[lang])) if (f.endsWith('.md') && !written.has(f)) await unlink(join(OUT[lang], f));
  }
  for (const f of await readdir(OUT.yml)) if (f.endsWith('.yml') && !ymls.has(f)) await unlink(join(OUT.yml, f));
  const total = built.reduce((a, b) => a + b.rules.length, 0);
  console.log(`已生成告警规则库：${built.length} 个服务、${total} 条规则（中英各一份）`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
