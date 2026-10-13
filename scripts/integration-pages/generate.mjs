#!/usr/bin/env node
/**
 * 从 src/data/integration-pages/*.json 和 intros.mjs 生成每个集成的独立页（中英各一份）：
 *
 *   integrations/<slug>.md                                                   英文
 *   i18n/zh-Hans/docusaurus-plugin-content-docs-integrations/current/<slug>.md  中文
 *
 *   node scripts/integration-pages/generate.mjs
 *
 * 页面结构固定：介绍 → 模板里有什么 → 怎么接入（采集配置原文）→ 内置仪表盘 → 内置告警规则
 * （触发条件 + 处置步骤）→ 指标说明 → 相关链接。介绍、接入说明是站点自己写的（intros.mjs），
 * 其余全部来自上游 ccfos/nightingale 的 integrations/ 目录，英文走上游的 i18n/en_US.json。
 *
 * 生成文件整个重写，不要手改；改文案改 intros.mjs，改结构改这里。
 * 文件用 `format: md`（CommonMark）而不是 MDX：上游文本里有 `{`、`<id>` 这类字符，MDX 会报错。
 */
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { INTROS } from './intros.mjs';
import { PAGES } from './catalog.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'src', 'data', 'integration-pages');
const OUT = {
  en: join(ROOT, 'integrations'),
  zh: join(ROOT, 'i18n', 'zh-Hans', 'docusaurus-plugin-content-docs-integrations', 'current'),
};
const UPSTREAM = 'https://github.com/ccfos/nightingale/tree/main/integrations';
const CATEGRAF_INPUTS = 'https://github.com/flashcatcloud/categraf/tree/main/inputs';

const T = {
  zh: {
    title: (name) => `用夜莺监控 ${name}`,
    inBox: '模板里有什么',
    dashboards: (n, panels) => `**${n} 张仪表盘**${panels ? `，共 ${panels} 个面板` : ''}`,
    alerts: (n) => `**${n} 条告警规则**，每条附处置步骤`,
    metrics: (n) => `**${n} 条指标说明**`,
    collect: (plugins) => `**Categraf 采集配置**：${plugins.map((p) => `\`input.${p}\``).join('、')}`,
    connect: '怎么接入',
    stepCollect: (plugin, file) =>
      `[安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 \`conf/input.${plugin}/${file}\`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 \`input: local.${plugin} started\` 就说明插件已加载。`,
    stepCollectMany: '[安装 Categraf](/docs/data/categraf/install)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。',
    stepImport: (name) =>
      `在夜莺「集成中心」里找到 ${name}，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。`,
    stepVerify: '导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。',
    dashHead: '内置仪表盘',
    dashCols: ['仪表盘', '面板数'],
    alertHead: '内置告警规则',
    alertLead: (n) => `共 ${n} 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。`,
    bySource: '规则按采集方式分组，用哪种采集器就导哪一组。',
    source: { categraf: 'Categraf 采集', exporter: 'Exporter 采集', telegraf: 'Telegraf 采集', native: '原生指标', default: '通用规则' },
    severity: { 1: 'S1 紧急', 2: 'S2 警告', 3: 'S3 提醒' },
    forDuration: (s) => `持续 ${s >= 60 && s % 60 === 0 ? `${s / 60} 分钟` : `${s} 秒`}`,
    trigger: '触发条件',
    action: '处置步骤',
    metricHead: '指标说明',
    metricLead: (n) => `共 ${n} 条，和仪表盘、告警规则里用到的指标一一对应。`,
    metricCols: ['指标', '含义', '单位'],
    related: '相关链接',
    relUpstream: (name) => `[${name} 模板源文件](${UPSTREAM}/`,
    relUpstreamTail: '）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。',
    relCategraf: (plugin) => `[Categraf \`${plugin}\` 插件文档](${CATEGRAF_INPUTS}/${plugin})：完整配置项和指标列表。`,
    relImport: '[导入仪表盘和告警规则](/docs/data/integrations/import)',
    relVerify: '[核对指标是否入库](/docs/data/integrations/verify)',
    relCatalog: '[全部集成目录](/integrations)',
    units: { percent: '%', bytesIEC: 'bytes', bytesSI: 'bytes', bytes: 'bytes', bytesSecIEC: 'bytes/s', bytesSecSI: 'bytes/s', bitsSecIEC: 'bit/s', bitsIEC: 'bit', milliseconds: 'ms', microseconds: 'μs', seconds: 's', sishort: '个', none: '', '': '', '-': '', cps: '次/秒', reqps: '请求/秒', mps: '条/秒', cpm: '次/分', times: '次', queries: '次查询', rows: '行', blocks: '块', connections: '个连接', parts: 'parts', files: '个文件' },
  },
  en: {
    title: (name) => `Monitor ${name} with Nightingale`,
    inBox: "What's in the template",
    dashboards: (n, panels) => `**${n} dashboard${n === 1 ? '' : 's'}**${panels ? `, ${panels} panels in total` : ''}`,
    alerts: (n) => `**${n} alert rule${n === 1 ? '' : 's'}**, each with runbook steps`,
    metrics: (n) => `**${n} metric description${n === 1 ? '' : 's'}**`,
    collect: (plugins) => `**Categraf collector config**: ${plugins.map((p) => `\`input.${p}\``).join(', ')}`,
    connect: 'How to connect',
    stepCollect: (plugin, file) =>
      `[Install Categraf](/docs/data/categraf/install), put the config below in \`conf/input.${plugin}/${file}\`, fill in your own address and credentials, and restart Categraf. The startup log prints \`input: local.${plugin} started\` once the plugin is loaded.`,
    stepCollectMany: '[Install Categraf](/docs/data/categraf/install) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.',
    stepImport: (name) =>
      `Open the integration center in Nightingale, find ${name}, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.`,
    stepVerify: 'Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.',
    dashHead: 'Bundled dashboards',
    dashCols: ['Dashboard', 'Panels'],
    alertHead: 'Bundled alert rules',
    alertLead: (n) => `${n} rule${n === 1 ? '' : 's'}. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.`,
    bySource: 'Rules are grouped by collector; import the group that matches how you collect.',
    source: { categraf: 'Collected by Categraf', exporter: 'Collected by an exporter', telegraf: 'Collected by Telegraf', native: 'Native metrics', default: 'General rules' },
    severity: { 1: 'S1 Critical', 2: 'S2 Warning', 3: 'S3 Info' },
    forDuration: (s) => `for ${s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s}s`}`,
    trigger: 'Trigger',
    action: 'Runbook',
    metricHead: 'Metric reference',
    metricLead: (n) => `${n} metric${n === 1 ? '' : 's'}, the ones the dashboards and rules above are built on.`,
    metricCols: ['Metric', 'Meaning', 'Unit'],
    related: 'Related',
    relUpstream: (name) => `[${name} template source](${UPSTREAM}/`,
    relUpstreamTail: '): the raw JSON for dashboards, rules and collector config. Pull requests welcome.',
    relCategraf: (plugin) => `[Categraf \`${plugin}\` plugin docs](${CATEGRAF_INPUTS}/${plugin}): every config option and the full metric list.`,
    relImport: '[Import dashboards and alert rules](/docs/data/integrations/import)',
    relVerify: '[Verify that metrics are stored](/docs/data/integrations/verify)',
    relCatalog: '[All integrations](/integrations)',
    units: { percent: '%', bytesIEC: 'bytes', bytesSI: 'bytes', bytes: 'bytes', bytesSecIEC: 'bytes/s', bytesSecSI: 'bytes/s', bitsSecIEC: 'bit/s', bitsIEC: 'bit', milliseconds: 'ms', microseconds: 'μs', seconds: 's', sishort: 'count', none: '', '': '', '-': '', cps: '/s', reqps: 'req/s', mps: 'msg/s', cpm: '/min', times: 'times', queries: 'queries', rows: 'rows', blocks: 'blocks', connections: 'connections', parts: 'parts', files: 'files' },
  },
};

const yamlStr = (s) => JSON.stringify(s);
/** 上游正文里的 `<id>`、`{}` 这类字符在 Markdown 里会被当成 HTML 标签或表达式，转义成字面量 */
const esc = (s) => String(s ?? '').replace(/[<{}]/g, '\\$&');
/** 表格单元格：竖线和换行会破坏表格 */
const cell = (s) => esc(s).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();
/** 行内代码里不能出现反引号；表达式里基本没有，保险起见换成单引号 */
const code = (s) => `\`${String(s).replace(/`/g, "'")}\``;
/** 围栏代码块：正文里出现 ``` 就加长围栏 */
function fence(body, lang = '') {
  const longest = Math.max(2, ...[...body.matchAll(/`{3,}/g)].map((m) => m[0].length));
  const f = '`'.repeat(longest + 1);
  return `${f}${lang}\n${body.replace(/\s+$/, '')}\n${f}`;
}
/** 处置步骤上游写成 "1) …；\n2) …"，拆成有序列表 */
function steps(action) {
  return esc(action)
    .split(/\n+/)
    .map((l) => l.replace(/^\s*\d+[).、]\s*/, '').trim())
    .filter(Boolean)
    .map((l) => `1. ${l}`)
    .join('\n');
}

function pick(lang, zh, en) {
  if (lang === 'en') return en || zh;
  return zh || en;
}

function render(lang, item, data, intro, fetchedAt) {
  const t = T[lang];
  const copy = intro[lang];
  const name = item.name;
  const title = copy.title ?? t.title(name);
  const out = [];

  out.push('---');
  out.push(`title: ${yamlStr(title)}`);
  out.push(`sidebar_label: ${yamlStr(name)}`);
  out.push(`description: ${yamlStr(copy.summary)}`);
  out.push(`last_reviewed: ${fetchedAt}`);
  out.push(`custom_edit_url: ${UPSTREAM}/${item.ident}`);
  out.push('toc_max_heading_level: 2');
  out.push('mdx:', '  format: md');
  out.push('---');
  out.push('');
  out.push(copy.intro.trim());
  out.push('');

  // ---------- 模板里有什么 ----------
  const panels = data.dashboards.reduce((a, d) => a + d.panels, 0);
  const plugins = [...new Set(data.collect.map((c) => c.plugin))];
  const box = [];
  if (data.dashboards.length) box.push(`- ${t.dashboards(data.dashboards.length, panels)}`);
  if (data.alerts.length) box.push(`- ${t.alerts(data.alerts.length)}`);
  if (data.metrics.length) box.push(`- ${t.metrics(data.metrics.length)}`);
  if (plugins.length) box.push(`- ${t.collect(plugins)}`);
  if (box.length) {
    out.push(`## ${t.inBox}`, '', ...box, '');
  }

  // ---------- 怎么接入 ----------
  out.push(`## ${t.connect}`, '');
  if (copy.connect) out.push(copy.connect.trim(), '');
  const stepsOut = [];
  if (data.collect.length === 1) {
    const c = data.collect[0];
    stepsOut.push(`1. ${t.stepCollect(c.plugin, c.file)}`, '', indent(fence(c.content, 'toml')), '');
  } else if (data.collect.length > 1) {
    stepsOut.push(`1. ${t.stepCollectMany}`, '');
    for (const c of data.collect) {
      stepsOut.push(indent(`\`conf/input.${c.plugin}/${c.file}\``), '', indent(fence(c.content, 'toml')), '');
    }
  }
  if (data.dashboards.length || data.alerts.length) {
    stepsOut.push(`1. ${t.stepImport(name)}`);
    stepsOut.push(`1. ${t.stepVerify}`);
  }
  if (stepsOut.length) out.push(...stepsOut, '');

  // ---------- 仪表盘 ----------
  if (data.dashboards.length) {
    out.push(`## ${t.dashHead}`, '');
    out.push(`| ${t.dashCols[0]} | ${t.dashCols[1]} |`, '| --- | ---: |');
    for (const d of data.dashboards) out.push(`| ${cell(pick(lang, d.name, d.name_en))} | ${d.panels || ''} |`);
    out.push('');
  }

  // ---------- 告警规则 ----------
  if (data.alerts.length) {
    out.push(`## ${t.alertHead}`, '', t.alertLead(data.alerts.length), '');
    const order = ['categraf', 'exporter', 'telegraf', 'native', 'default'];
    const groups = new Map();
    for (const a of data.alerts) {
      if (!groups.has(a.source)) groups.set(a.source, []);
      groups.get(a.source).push(a);
    }
    const multi = groups.size > 1;
    if (multi) out.push(t.bySource, '');
    const ruleHeading = multi ? '####' : '###';
    for (const src of [...groups.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b))) {
      const rules = groups.get(src);
      if (multi) out.push(`### ${t.source[src] ?? src}（${rules.length}）`.replace('（', lang === 'en' ? ' (' : '（').replace('）', lang === 'en' ? ')' : '）'), '');
      for (const a of rules) {
        out.push(`${ruleHeading} ${esc(pick(lang, a.name, a.name_en)).trim()}`, '');
        const note = esc(pick(lang, a.note, a.note_en)).trim();
        if (note) out.push(note, '');
        const meta = [t.severity[a.severity], a.for ? t.forDuration(a.for) : ''].filter(Boolean).join(' · ');
        out.push(`${meta ? `${meta} · ` : ''}${t.trigger}:`, '');
        out.push(fence(a.queries.map((q) => q.promql).join('\n\n'), 'promql'), '');
        const act = pick(lang, a.action, a.action_en);
        if (act) out.push(`${t.action}:`, '', steps(act), '');
      }
    }
  }

  // ---------- 指标说明 ----------
  if (data.metrics.length) {
    out.push(`## ${t.metricHead}`, '', t.metricLead(data.metrics.length), '');
    out.push(`| ${t.metricCols.join(' | ')} |`, '| --- | --- | --- |');
    for (const m of data.metrics) {
      const meaning = [pick(lang, m.name, m.name_en), pick(lang, m.note, m.note_en)].filter(Boolean).join(' — ');
      const unit = t.units[m.unit] ?? m.unit;
      out.push(`| ${code(String(m.expression).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim())} | ${cell(meaning)} | ${cell(unit)} |`);
    }
    out.push('');
  }

  // ---------- 相关链接 ----------
  out.push(`## ${t.related}`, '');
  out.push(`- ${t.relUpstream(name)}${item.ident}${t.relUpstreamTail}`);
  for (const p of plugins) {
    if (data.collect.find((c) => c.plugin === p)?.readme) out.push(`- ${t.relCategraf(p)}`);
  }
  for (const r of intro.related ?? []) out.push(`- ${r[lang]}`);
  out.push(`- ${t.relImport}`);
  out.push(`- ${t.relVerify}`);
  out.push(`- ${t.relCatalog}`);
  out.push('');

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n')}`;
}

/** 列表项里的代码块要缩进 3 格才算在该项之内 */
function indent(s) {
  return s
    .split('\n')
    .map((l) => (l ? `   ${l}` : l))
    .join('\n');
}

const index = JSON.parse(await readFile(join(DATA, 'index.json'), 'utf8'));
const missingIntro = PAGES.filter((id) => !INTROS[id]);
if (missingIntro.length) {
  console.error(`intros.mjs 缺少：${missingIntro.join(', ')}`);
  process.exit(1);
}
for (const lang of ['en', 'zh']) await mkdir(OUT[lang], { recursive: true });

const written = new Set();
for (const item of index.pages) {
  const data = JSON.parse(await readFile(join(DATA, `${item.ident}.json`), 'utf8'));
  for (const lang of ['en', 'zh']) {
    const file = join(OUT[lang], `${item.slug}.md`);
    await writeFile(file, render(lang, item, data, INTROS[item.ident], index.fetchedAt));
  }
  written.add(`${item.slug}.md`);
}
// 从 catalog 里拿掉的页面，生成文件也一并删除
for (const lang of ['en', 'zh']) {
  for (const f of await readdir(OUT[lang])) {
    if (f.endsWith('.md') && !written.has(f)) await unlink(join(OUT[lang], f));
  }
}
console.log(`已生成 ${index.pages.length} × 2 个集成页`);
