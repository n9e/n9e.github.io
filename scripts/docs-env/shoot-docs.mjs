/**
 * 按清单给文档批量截产品界面图。中英各一套。
 *
 *   node scripts/docs-env/shoot-docs.mjs                 # 全截
 *   node scripts/docs-env/shoot-docs.mjs data alerting   # 只截这些 section
 *   node scripts/docs-env/shoot-docs.mjs --only ds-next-step   # 只截这一个画面
 *   node scripts/docs-env/shoot-docs.mjs --locale zh     # 只截中文
 *   node scripts/docs-env/shoot-docs.mjs --theme dark    # 只截暗色
 *   node scripts/docs-env/shoot-docs.mjs --list          # 只列清单和总张数，不截
 *
 * 每张图出四份：中英 × 明暗。文档站默认是暗色主题，配一张纯白的产品截图很跳，
 * 所以产品界面也要跟着切。命名：
 *   英文浅色 <name>.png      英文暗色 <name>.dark.png
 *   中文浅色 <name>.zh.png   中文暗色 <name>.zh.dark.png
 *
 * playwright 从 n9e/fe 的 node_modules 里借，不给文档站加这个重依赖。
 * 前提：夜莺后端在 :17000，开源前端 dev server 在 :8765（务必是 `npm run dev`，
 * 不是 dev:advanced —— 后者渲染的是商业版 UI）。
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SHOTS } from './shot-manifest.mjs';

const require = createRequire('/Users/ning/gopath/src/github.com/n9e/fe/');
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'static/img/docs');
const BASE = process.env.N9E_FE || 'http://localhost:8765';
const USER = process.env.N9E_USER || 'root';
const PASSWORD = process.env.N9E_PASSWORD || 'root.2020';

// 和团队既有约定一致（~/.claude/playwright-mcp-config.json）
const VIEWPORT = { width: 1600, height: 900 };

const LOCALES = { en: 'en_US', zh: 'zh_CN' };
const THEMES = ['light', 'dark'];

const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const localeArg = args.includes('--locale') ? args[args.indexOf('--locale') + 1] : null;
const themeArg = args.includes('--theme') ? args[args.indexOf('--theme') + 1] : null;
// 只补一张图时用 --only：环境里的演示数据未必和上次截图时一模一样，
// 整个 section 重截会顺手改掉那些本来没问题的图，git diff 里全是噪音
const onlyArg = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const sections = args.filter(
  (a, i) => !a.startsWith('--') && !['--locale', '--theme', '--only'].includes(args[i - 1]),
);

function selected() {
  return SHOTS.filter(
    (s) => (sections.length === 0 || sections.includes(s.section)) && (!onlyArg || s.name === onlyArg),
  );
}

if (listOnly) {
  const rows = selected();
  const locales = localeArg ? 1 : 2;
  const themes = themeArg ? 1 : 2;
  const mult = locales * themes;
  const bySection = {};
  for (const s of rows) bySection[s.section] = (bySection[s.section] || 0) + 1;
  for (const [sec, n] of Object.entries(bySection).sort()) {
    console.log(`  ${sec.padEnd(18)} ${String(n).padStart(3)} 个画面 × ${mult} = ${n * mult} 张`);
  }
  console.log(`  ${'合计'.padEnd(17)} ${String(rows.length).padStart(3)} 个画面 × ${mult}（${locales} 语言 × ${themes} 主题）= ${rows.length * mult} 张`);
  process.exit(0);
}

async function login(page, locale, theme) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  // 语言和"侧栏收起"都存在 localStorage，登录前写好，进去就是目标状态。
  // 收侧栏靠点按钮不可靠（每次导航都会重挂载），直接写 menuCollapsed=1
  // （src/components/SideMenu/index.tsx:131）。
  await page.evaluate(([l, dark]) => {
    localStorage.setItem('language', l);
    localStorage.setItem('menuCollapsed', '1');
    // 暗色的 localStorage 键叫 darkMode（fe 的 src/utils/darkMode.ts）。
    // 不过下面导航时还会带上 ?themeMode=dark —— 那个的优先级更高，也更不容易失效。
    localStorage.setItem('darkMode', dark);
  }, [LOCALES[locale], theme === 'dark' ? 'true' : 'false']);
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#username, input[id$="username"]', USER).catch(() => {});
  await page.fill('#password, input[id$="password"]', PASSWORD).catch(() => {});
  await page.getByRole('button').filter({ hasText: /登.*录|Login/ }).first().click();
  await page.waitForURL(/\/(landing|targets)/, { timeout: 20000 });
}

async function main() {
  // 用系统装的 Chrome，别去下 playwright 自带的 chromium（fe 那份没下过，
  // 而且团队的 playwright-mcp 也是 channel: 'chrome'，两边渲染一致）
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const rows = selected();
  const locales = localeArg ? [localeArg] : Object.keys(LOCALES);
  const themes = themeArg ? [themeArg] : THEMES;
  let n = 0;

  for (const locale of locales) {
   for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await login(page, locale, theme);

    for (const shot of rows) {
      const dir = path.join(OUT, shot.section);
      fs.mkdirSync(dir, { recursive: true });
      const suffix = `${locale === 'zh' ? '.zh' : ''}${theme === 'dark' ? '.dark' : ''}`;
      const file = path.join(dir, `${shot.name}${suffix}.png`);

      // themeMode 参数优先级高于 localStorage（darkMode.ts 的 getDarkMode），
      // 每次导航都带上，省得被页面内部的状态覆盖
      const sep = shot.path.includes('?') ? '&' : '?';
      const url = BASE + shot.path + (theme === 'dark' ? `${sep}themeMode=dark` : '');
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(shot.wait ?? 2500);
      if (shot.waitFor) await page.getByText(shot.waitFor).first().waitFor({ timeout: 15000 }).catch(() => {});
      if (shot.before) await shot.before(page);
      await page.waitForTimeout(500);

      await page.screenshot({ path: file, fullPage: !!shot.fullPage });
      n++;
      console.log(`  ${path.relative(ROOT, file)}`);
    }
    await ctx.close();
   }
  }

  await browser.close();
  console.log(`\n共 ${n} 张，落在 ${path.relative(ROOT, OUT)}/`);

  // 截完顺手压一遍：产品界面量化到 256 色肉眼看不出差别，体积省一半以上，
  // 而这些图是要进 git 的
  const { execFileSync } = await import('node:child_process');
  try {
    const out = execFileSync('python3', [path.join(ROOT, 'scripts/docs-env/squeeze-png.py'), OUT],
                             { encoding: 'utf8' });
    process.stdout.write(out);
  } catch (e) {
    console.warn('压缩这步失败了，图还在，可以事后手动跑 squeeze-png.py：', e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
