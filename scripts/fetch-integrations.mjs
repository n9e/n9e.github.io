#!/usr/bin/env node
/**
 * 构建前抓取集成页要用的内置集成模板目录：ccfos/nightingale 仓库 integrations/
 * 下每个模板的图标、仪表盘 / 告警规则 / 采集配置 / 指标说明的数量、README 语言。
 *
 *   node scripts/fetch-integrations.mjs
 *
 * 页面上的模板卡片、分类计数、hero 数字全部来自这份 JSON，不手改。
 * 图标下载到 static/img/integrations/，按 blob sha 判断是否重下，所以日常构建只有两次 API 请求。
 * 和 fetch-releases.mjs 一样：拉取失败就保留仓库里已有的文件并以非零码退出，绝不写半份数据。
 */
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import { ALIASES, CATEGORY_OF, CATEGORY_ORDER, DISPLAY_NAME, HIDDEN } from './integration-categories.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'data', 'integrations.json');
const ICON_DIR = join(ROOT, 'static', 'img', 'integrations');
const REPO = 'ccfos/nightingale';
const BRANCH = 'main';
const DIR = 'integrations';

const headers = {
  accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${path} 返回 ${res.status}`);
  return res.json();
}

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} 返回 ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function readCurrent() {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    return null;
  }
}

/** 把 integrations/ 的递归文件树按模板目录归并成 { ident: [相对路径...] } */
function groupByTemplate(tree) {
  const byIdent = new Map();
  for (const entry of tree) {
    const [ident, ...rest] = entry.path.split('/');
    if (rest.length === 0) continue; // 顶层的 json 文件
    if (!byIdent.has(ident)) byIdent.set(ident, []);
    byIdent.get(ident).push({ path: rest.join('/'), type: entry.type, sha: entry.sha });
  }
  return byIdent;
}

function countIn(files, folder, ext) {
  return files.filter(
    (f) => f.path.startsWith(`${folder}/`) && f.path.split('/').length === 2 && (!ext || f.path.endsWith(ext)),
  ).length;
}

function describe(ident, files) {
  const icon = files.find((f) => f.type === 'blob' && f.path.startsWith('icon/'));
  const category = CATEGORY_OF[ident];
  if (!category) console.warn(`⚠ 模板 ${ident} 未在 scripts/integration-categories.mjs 归类，落到 other`);
  return {
    ident,
    name: DISPLAY_NAME[ident] ?? ident,
    category: category ?? 'other',
    aliases: ALIASES[ident] ?? [],
    icon: icon ? { path: icon.path, sha: icon.sha } : null,
    dashboards: countIn(files, 'dashboards', '.json'),
    alerts: countIn(files, 'alerts', '.json'),
    collect: countIn(files, 'collect'),
    metrics: countIn(files, 'metrics', '.json'),
    readme: {
      zh: files.some((f) => f.path === 'markdown/README.md'),
      en: files.some((f) => f.path === 'markdown/README.en_US.md'),
    },
  };
}

/** 图标落到 static 下，文件名用 ident，扩展名跟上游。sha 没变且文件在就不重下。 */
async function syncIcon(item, previous) {
  if (!item.icon) return null;
  const file = `${item.ident}${extname(item.icon.path).toLowerCase()}`;
  const target = join(ICON_DIR, file);
  const prev = previous?.icon;
  const unchanged = prev && prev.sha === item.icon.sha && prev.file === file;
  if (unchanged) {
    try {
      await readFile(target);
      return { file, sha: item.icon.sha };
    } catch {
      // 记录说有，磁盘上没有：重下
    }
  }
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${DIR}/${item.ident}/${item.icon.path}`;
  await writeFile(target, await download(url));
  return { file, sha: item.icon.sha };
}

try {
  const current = await readCurrent();
  const previousByIdent = new Map((current?.items ?? []).map((i) => [i.ident, i]));

  const root = await gh(`/git/trees/${BRANCH}`);
  const dirEntry = root.tree.find((e) => e.path === DIR && e.type === 'tree');
  if (!dirEntry) throw new Error(`仓库里没有 ${DIR}/ 目录`);

  const sub = await gh(`/git/trees/${dirEntry.sha}?recursive=1`);
  if (sub.truncated) throw new Error(`${DIR}/ 文件树被 GitHub 截断，统计会不准`);

  const grouped = groupByTemplate(sub.tree);
  const upstreamCount = grouped.size;
  const described = [...grouped]
    .filter(([ident]) => !HIDDEN.has(ident))
    .map(([ident, files]) => describe(ident, files));

  await mkdir(ICON_DIR, { recursive: true });
  const items = [];
  for (const item of described) {
    const icon = await syncIcon(item, previousByIdent.get(item.ident));
    items.push({ ...item, icon });
  }

  const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  items.sort(
    (a, b) => order.get(a.category) - order.get(b.category) || a.name.localeCompare(b.name, 'en'),
  );

  // 上游删掉的模板，本地图标也一并清掉，避免 static 里堆积
  const keep = new Set(items.map((i) => i.icon?.file).filter(Boolean));
  for (const file of await readdir(ICON_DIR)) {
    if (!keep.has(file)) await unlink(join(ICON_DIR, file));
  }

  const data = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    treeSha: dirEntry.sha,
    upstreamCount,
    sourceUrl: `https://github.com/${REPO}/tree/${BRANCH}/${DIR}`,
    items,
  };
  await writeFile(OUT, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`已更新 ${items.length} 个集成模板（上游 ${upstreamCount} 个，隐藏 ${upstreamCount - items.length} 个）`);
} catch (err) {
  console.error(`拉取失败：${err.message}`);
  const current = await readCurrent();
  if (current) {
    console.error(`保留现有数据（${current.fetchedAt} 采集，${current.items.length} 个模板）。构建可继续，但目录未刷新。`);
  } else {
    console.error('仓库里也没有现成的 integrations.json，集成页无法构建。');
  }
  process.exit(1);
}
