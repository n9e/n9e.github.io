#!/usr/bin/env node
/**
 * 抓每个有独立页的集成的正文素材：内置告警规则、指标说明、仪表盘名单、采集配置、英文翻译表。
 *
 *   node scripts/integration-pages/fetch.mjs            # treeSha 没变就什么都不做
 *   node scripts/integration-pages/fetch.mjs --force
 *
 * 写到 src/data/integration-pages/<Ident>.json（已套用上游 i18n/en_US.json，中英文都带着）和
 * index.json（哪些页、各自多少东西）。页面本身由 generate.mjs 从这些 JSON 生成。
 * 和 fetch-integrations.mjs 一样：数据入库，拉取失败保留旧文件并以非零码退出。
 * 依赖 fetch-integrations.mjs 先跑过——用它记下的 treeSha 定位同一份文件树。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PAGES, slugOf } from './catalog.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATALOG = join(ROOT, 'src', 'data', 'integrations.json');
const OUT_DIR = join(ROOT, 'src', 'data', 'integration-pages');
const INDEX = join(OUT_DIR, 'index.json');
const REPO = 'ccfos/nightingale';
const RAW = `https://raw.githubusercontent.com/${REPO}/main/integrations`;
const force = process.argv.includes('--force');

const headers = {
  accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function gh2(repo, path) {
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${repo}${path} 返回 ${res.status}`);
  return res.json();
}
const gh = (path) => gh2(REPO, path);

async function raw(path, as = 'text') {
  const res = await fetch(`${RAW}/${path.split('/').map(encodeURIComponent).join('/')}`);
  if (!res.ok) throw new Error(`${path} 返回 ${res.status}`);
  return as === 'json' ? res.json() : res.text();
}

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const hasCjk = (s) => /[一-鿿]/.test(s || '');

/** 规则文件名里带的采集方式：linux_by_categraf.json → categraf */
function sourceOf(file) {
  const m = file.toLowerCase().match(/by[_-]([a-z0-9]+)/);
  if (m) return m[1];
  if (/categraf/i.test(file)) return 'categraf';
  if (/exporter/i.test(file)) return 'exporter';
  if (/telegraf/i.test(file)) return 'telegraf';
  return 'default';
}

function pickAlert(rule, file, tr) {
  const queries = rule.rule_config?.queries?.length
    ? rule.rule_config.queries.map((q) => ({ promql: q.prom_ql, severity: q.severity }))
    : rule.prom_ql
      ? [{ promql: rule.prom_ql, severity: rule.severity }]
      : [];
  const action = rule.annotations?.action ?? '';
  return {
    source: sourceOf(file),
    name: rule.name,
    name_en: tr(rule.name),
    note: rule.note ?? '',
    note_en: tr(rule.note ?? ''),
    severity: rule.severity || queries[0]?.severity || 0,
    for: rule.prom_for_duration ?? 0,
    queries,
    action,
    action_en: tr(action),
  };
}

function pickMetric(m) {
  const t = Object.fromEntries((m.translation ?? []).map((x) => [x.lang, x]));
  const zh = m.lang === 'zh_CN' ? m : t.zh_CN;
  const en = m.lang === 'en_US' ? m : t.en_US;
  return {
    expression: m.expression,
    type: m.metric_type ?? '',
    unit: m.unit ?? '',
    name: zh?.name ?? m.name,
    name_en: en?.name ?? (hasCjk(m.name) ? '' : m.name),
    note: zh?.note ?? m.note ?? '',
    note_en: en?.note ?? '',
  };
}

/** Categraf 仓库里有 README 的插件名（inputs/<plugin>/README.md），用来决定页面上要不要链插件文档 */
async function categrafPlugins() {
  const tree = await gh2('flashcatcloud/categraf', '/git/trees/main?recursive=1');
  const names = new Set();
  for (const e of tree.tree) {
    const m = e.path.match(/^inputs\/([^/]+)\/README\.md$/);
    if (m) names.add(m[1]);
  }
  return names;
}

async function describe(ident, files, categraf) {
  const under = (dir) => files.filter((f) => f.path.startsWith(`${ident}/${dir}/`) && f.type === 'blob');
  let i18n = {};
  if (files.some((f) => f.path === `${ident}/i18n/en_US.json`)) i18n = await raw(`${ident}/i18n/en_US.json`, 'json');
  // 翻译表是 zh → en 的平面映射；本来就是英文的句子原样返回
  const tr = (s) => (s ? i18n[s] ?? (hasCjk(s) ? '' : s) : '');

  const alerts = [];
  for (const f of under('alerts').filter((f) => f.path.endsWith('.json'))) {
    const file = f.path.split('/').pop();
    for (const rule of asArray(await raw(f.path, 'json'))) alerts.push(pickAlert(rule, file, tr));
  }

  const metrics = [];
  for (const f of under('metrics').filter((f) => f.path.endsWith('.json'))) {
    for (const m of asArray(await raw(f.path, 'json'))) metrics.push(pickMetric(m));
  }

  const dashboards = [];
  for (const f of under('dashboards').filter((f) => f.path.endsWith('.json'))) {
    const d = await raw(f.path, 'json');
    const configs = typeof d.configs === 'string' ? JSON.parse(d.configs) : d.configs ?? {};
    dashboards.push({
      file: f.path.split('/').pop(),
      name: d.name,
      name_en: tr(d.name),
      panels: Array.isArray(configs.panels) ? configs.panels.length : 0,
    });
  }

  const collect = [];
  for (const f of under('collect').filter((f) => /\.(toml|ya?ml|conf|json)$/i.test(f.path) && f.size < 20000)) {
    const [, , plugin, ...rest] = f.path.split('/');
    collect.push({ plugin, file: rest.join('/'), readme: categraf.has(plugin), content: await raw(f.path) });
  }

  return {
    ident,
    alerts,
    metrics,
    dashboards,
    collect,
    readme: {
      zh: files.some((f) => f.path === `${ident}/markdown/README.md`),
      en: files.some((f) => f.path === `${ident}/markdown/README.en_US.md`),
    },
  };
}

try {
  const catalog = JSON.parse(await readFile(CATALOG, 'utf8'));
  const byIdent = new Map(catalog.items.map((i) => [i.ident, i]));
  const missing = PAGES.filter((id) => !byIdent.has(id));
  if (missing.length) throw new Error(`catalog.mjs 里的 ${missing.join(', ')} 不在 integrations.json 中`);

  let current = null;
  try {
    current = JSON.parse(await readFile(INDEX, 'utf8'));
  } catch {
    /* 第一次 */
  }
  if (!force && current?.treeSha === catalog.treeSha && PAGES.every((id) => current.pages.some((p) => p.ident === id))) {
    console.log(`集成页素材已是 ${catalog.treeSha.slice(0, 7)}，跳过`);
    process.exit(0);
  }

  const tree = (await gh(`/git/trees/${catalog.treeSha}?recursive=1`));
  if (tree.truncated) throw new Error('integrations/ 文件树被 GitHub 截断');

  const categraf = await categrafPlugins();
  await mkdir(OUT_DIR, { recursive: true });
  const pages = [];
  for (const ident of PAGES) {
    const files = tree.tree.filter((e) => e.path.startsWith(`${ident}/`));
    const data = await describe(ident, files, categraf);
    await writeFile(join(OUT_DIR, `${ident}.json`), `${JSON.stringify(data, null, 2)}\n`);
    const item = byIdent.get(ident);
    pages.push({
      ident,
      slug: slugOf(ident),
      name: item.name,
      category: item.category,
      alerts: data.alerts.length,
      metrics: data.metrics.length,
      dashboards: data.dashboards.length,
      collect: data.collect.length,
    });
    console.log(`${ident}: ${data.alerts.length} 规则 / ${data.metrics.length} 指标 / ${data.dashboards.length} 仪表盘 / ${data.collect.length} 采集配置`);
  }
  await writeFile(
    INDEX,
    `${JSON.stringify({ fetchedAt: catalog.fetchedAt, treeSha: catalog.treeSha, sourceUrl: catalog.sourceUrl, pages }, null, 2)}\n`,
  );
  console.log(`已写入 ${pages.length} 个集成页的素材`);
} catch (err) {
  console.error(`拉取失败：${err.message}`);
  process.exit(1);
}
