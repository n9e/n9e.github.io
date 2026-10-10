/**
 * 查文档里写错的产品界面名称。
 *
 *   node scripts/docs-env/check-ui-names.mjs
 *
 * 两类检查：
 *
 * 1. 黑名单：产品里根本不存在的叫法。这类错误最难自己发现——名字听起来很合理，
 *    读者却在界面上找不到。比如「指标浏览器」：/metric/explorer 侧栏那一行叫「指标」，
 *    落地的页签叫「即时查询」，没有任何地方叫「指标浏览器」。
 *
 * 2. 导航路径：正文里 `**A → B**` 形式的每一段，都必须是真实的菜单项或页签。
 *    名字取自 n9e/fe 的 src/components/SideMenu/locale/{zh_CN,en_US}.ts —— 那是渲染
 *    侧栏用的同一份数据，改了菜单文案这里会跟着变，不用手工同步。
 *
 * 按钮名、表单字段名不在检查范围内：它们散在各个页面的 locale 里，凑不出一份可靠清单，
 * 硬查会全是误报。菜单和页签能覆盖「我该去哪个页面」这个最容易写错的部分。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FE = process.env.N9E_FE_SRC || '/Users/ning/gopath/src/github.com/n9e/fe';
const DOCS = { en: path.join(ROOT, 'docs'), zh: path.join(ROOT, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current') };

/** 产品里不存在的叫法 → 该用什么 */
const WRONG = {
  zh: {
    指标浏览器: '即时查询（/metric/explorer 的页签名）',
    日志浏览器: '日志检索（/log/explorer 的页面标题）',
  },
  en: {
    'metric explorer': 'Metrics explorer',
    'Metric explorer': 'Metrics explorer',
  },
};
/** 黑名单里允许出现的例外：这些页面在讲「旧名字改成了什么」 */
const EXEMPT = [/migration\/v8-to-v9/, /help\/deprecations/];

/** 侧栏 locale 里的 menu 段：{ 键 → 文案 } */
function menuMap(locale) {
  const file = path.join(FE, 'src/components/SideMenu/locale', locale === 'zh' ? 'zh_CN.ts' : 'en_US.ts');
  const src = fs.readFileSync(file, 'utf8');
  const block = src.match(/menu:\s*\{([\s\S]*?)\n {2}\}/);
  const out = {};
  for (const m of block[1].matchAll(/^\s*([\w_]+):\s*'(.*?)'/gm)) out[m[1]] = m[2];
  return out;
}

/** 侧栏的六个一级分组，见 fe 的 src/components/SideMenu/menu.tsx */
const GROUP_KEYS = ['infrastructure', 'explorer', 'alerts_notifications', 'integrations', 'organization', 'system'];

/** 菜单里没有、但确实存在于界面上的东西：页签、二级侧栏、公共控件 */
const EXTRA = {
  zh: ['业务组', '活跃告警', '历史告警', '日志检索', '自愈脚本', '历史任务', '执行记录',
       'Nightingale AI', 'LLM 配置', 'Skill 管理', '新增', '导入', '编辑', '更多操作',
       '个人中心', 'Token 管理', '头像菜单', '批量操作', '查看详情', '通知记录'],
  en: ['Business groups', 'Active events', 'Historical events', 'Log explorer', 'Add', 'Import',
       'Edit', 'More', 'Profile', 'Tokens', 'Notification records', 'Nightingale AI'],
};

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.mdx?$/.test(e.name)) yield p;
  }
}

let problems = 0;
for (const [locale, dir] of Object.entries(DOCS)) {
  const labels = menuMap(locale);
  const known = new Set([...Object.values(labels), ...EXTRA[locale]]);
  const groups = new Set(GROUP_KEYS.map((k) => labels[k]).filter(Boolean));

  for (const file of walk(dir)) {
    const rel = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [bad, good] of Object.entries(WRONG[locale])) {
        if (line.includes(bad) && !EXEMPT.some((re) => re.test(rel))) {
          console.log(`  ${rel}:${i + 1}  「${bad}」→ ${good}`);
          problems++;
        }
      }
      // **A → B → …**：只在第一段是侧栏一级分组时才当作菜单路径，校验第二段。
      // 正文里还有大量页面内的路径（**基础配置 → 附加标签**、**更多操作 → 绑定标签**），
      // 那些指的是表单区块和按钮，散在各页面 locale 里凑不出清单，查了全是误报。
      for (const m of line.matchAll(/\*\*([^*\n]*?(?:→|->)[^*\n]*?)\*\*/g)) {
        const segs = m[1].split(/→|->/).map((s) => s.trim());
        if (!groups.has(segs[0])) continue;
        const second = segs[1];
        if (!second || known.has(second)) continue;
        if (/[，。、,.:：「」（）()]/.test(second) || second.split(/\s+/).length > 3) continue;
        console.log(`  ${rel}:${i + 1}  「${segs[0]} → ${second}」里的第二段不是这个分组下的菜单项`);
        problems++;
      }
    });
  }
}

console.log(problems ? `\n共 ${problems} 处，对照 scripts/docs-env/oss-menu.md 修` : '界面名称检查通过 ✓');
process.exit(problems ? 1 : 0);
