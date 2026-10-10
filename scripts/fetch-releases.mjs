#!/usr/bin/env node
/**
 * 构建前抓取下载页要用的发布信息：最新 v9、Categraf 最新版，
 * 以及每个安装包的直链、大小和 SHA256。
 *
 *   node scripts/fetch-releases.mjs
 *
 * 页面上的版本号、大小、校验值全部来自这份 JSON，不手改。
 * 和 fetch-stats.mjs 一样：拉取失败就保留仓库里已有的文件并以非零码退出，绝不写半份数据。
 */
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'releases.json');

const headers = {
  accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com/repos/${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${path} 返回 ${res.status}`);
  return res.json();
}

async function text(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} 返回 ${res.status}`);
  return res.text();
}

/** 从 checksums.txt 解析 "<sha256>  <文件名>" */
function parseChecksums(body) {
  const map = {};
  for (const line of body.split('\n')) {
    const m = line.trim().match(/^([0-9a-f]{64})\s+\*?(.+)$/i);
    if (m) map[m[2].trim()] = m[1].toLowerCase();
  }
  return map;
}

/** 文件名里的平台、架构和变体 */
function classify(name) {
  const m = name.match(/(linux|windows|darwin)-(amd64|arm64)/);
  let variant = 'default';
  if (name.startsWith('categraf-slim')) variant = 'slim';
  else if (name.includes('with-cgo-plugin')) variant = 'cgo';
  return { os: m ? m[1] : 'unknown', arch: m ? m[2] : 'unknown', variant };
}

async function releaseInfo(repo, release) {
  const checksumsAsset = release.assets.find((a) => a.name === 'checksums.txt');
  const sums = checksumsAsset ? parseChecksums(await text(checksumsAsset.browser_download_url)) : {};
  return {
    tag: release.tag_name,
    publishedAt: release.published_at.slice(0, 10),
    notesUrl: release.html_url,
    checksumsUrl: checksumsAsset ? checksumsAsset.browser_download_url : `https://github.com/${repo}/releases`,
    assets: release.assets
      .filter((a) => a.name !== 'checksums.txt')
      .map((a) => ({
        name: a.name,
        ...classify(a.name),
        size: a.size,
        url: a.browser_download_url,
        sha256: sums[a.name] ?? null,
      })),
  };
}

try {
  // 下载页只推 v9：v8 仍可从 GitHub Releases 拿，但官网不再给它入口
  const [n9eLatest, categrafLatest] = await Promise.all([
    gh('ccfos/nightingale/releases/latest'),
    gh('flashcatcloud/categraf/releases/latest'),
  ]);

  const data = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    nightingale: await releaseInfo('ccfos/nightingale', n9eLatest),
    categraf: await releaseInfo('flashcatcloud/categraf', categrafLatest),
  };
  await writeFile(OUT, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `已更新 ${data.nightingale.tag}（${data.nightingale.assets.length} 个包）/ Categraf ${data.categraf.tag}（${data.categraf.assets.length} 个包）`,
  );
} catch (err) {
  console.error(`拉取失败：${err.message}`);
  try {
    const current = JSON.parse(await readFile(OUT, 'utf8'));
    console.error(`保留现有数据（${current.fetchedAt} 采集）。构建可继续，但版本未刷新。`);
  } catch {
    console.error('仓库里也没有现成的 releases.json，下载页无法构建。');
  }
  process.exit(1);
}
