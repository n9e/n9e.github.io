/**
 * 把某个页面的表单字段、tab、按钮抽成一小段 JSON，用来核对文档里写的字段名。
 *
 *   node scripts/docs-env/inspect-ui.mjs /datasources/add/prometheus
 *   node scripts/docs-env/inspect-ui.mjs /alert-rules/add/1 --locale zh
 *
 * 比在浏览器里看 accessibility snapshot 省得多，输出只有几十行。
 */
import { createRequire } from 'node:module';
const require = createRequire('/Users/ning/gopath/src/github.com/n9e/fe/');
const { chromium } = require('playwright');

const BASE = process.env.N9E_FE || 'http://localhost:8765';
const path = process.argv[2];
const locale = process.argv.includes('--locale') ? process.argv[process.argv.indexOf('--locale') + 1] : 'en';
if (!path) { console.error('usage: inspect-ui.mjs <route> [--locale en|zh]'); process.exit(1); }

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
const page = await ctx.newPage();

await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
const collapsed = process.env.KEEP_MENU ? '0' : '1';
await page.evaluate(([l, c]) => {
  localStorage.setItem('language', l);
  localStorage.setItem('menuCollapsed', c);
}, [locale === 'zh' ? 'zh_CN' : 'en_US', collapsed]);
await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
await page.fill('input[id$="username"]', process.env.N9E_USER || 'root');
await page.fill('input[id$="password"]', process.env.N9E_PASSWORD || 'root.2020');
await page.click('button.ant-btn-primary');
await page.waitForURL(/\/(landing|targets)/, { timeout: 20000 });

await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

const out = await page.evaluate(() => {
  const txt = (el) => el.textContent.trim().replace(/\s+/g, ' ');
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  return {
    heading: document.querySelector('.ant-page-header-heading-title, h1, [class*="title"]')?.textContent?.trim()?.slice(0, 80),
    tabs: uniq([...document.querySelectorAll('.ant-tabs-tab')].map(txt)),
    // 表单字段：label + 占位符，占位符里常有示例值，写文档要用
    fields: [...document.querySelectorAll('.ant-form-item')].map((it) => ({
      label: it.querySelector('.ant-form-item-label label')?.textContent?.trim(),
      placeholder: it.querySelector('input,textarea')?.placeholder || undefined,
      value: it.querySelector('input')?.value || undefined,
      required: !!it.querySelector('.ant-form-item-required'),
    })).filter((f) => f.label),
    columns: uniq([...document.querySelectorAll('th')].map(txt)),
    buttons: uniq([...document.querySelectorAll('button')].map(txt)).filter((b) => b.length < 40),
    hints: uniq([...document.querySelectorAll('.ant-alert-message, .ant-form-item-extra')].map(txt)).slice(0, 8),
    // 侧栏菜单文案：写"在哪个菜单下"时照抄这里，不要凭印象翻译
    menu: uniq([...document.querySelectorAll('aside a, aside [class*="menu"] > div')].map(txt)).slice(0, 40),
  };
});

console.log(JSON.stringify(out, null, 1));
await browser.close();
