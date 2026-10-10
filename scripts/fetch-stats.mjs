#!/usr/bin/env node
/**
 * 构建前刷新首页数字条（方案 §7.4：杜绝"12000+ Star"式过时数字）。
 *
 *   node scripts/fetch-stats.mjs
 *
 * CI 每日定时跑一次再构建即可。拉取失败时保留仓库里已有的数值并以非零码退出，
 * 由调用方决定是否放行——绝不写入半份数据。
 */

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'stats.json');
const REPO = 'ccfos/nightingale';

async function gh(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} 返回 ${res.status}`);
  return res.json();
}

try {
  const [repo, release] = await Promise.all([gh(''), gh('/releases/latest')]);

  const stats = {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    latestRelease: release.tag_name,
    fetchedAt: new Date().toISOString().slice(0, 10),
  };

  await writeFile(OUT, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`已更新 ${stats.stars} stars / ${stats.forks} forks / ${stats.latestRelease}`);
} catch (err) {
  const current = JSON.parse(await readFile(OUT, 'utf8'));
  console.error(`拉取失败：${err.message}`);
  console.error(`保留现有数值（${current.fetchedAt} 采集）。构建可继续，但数字未刷新。`);
  process.exit(1);
}
