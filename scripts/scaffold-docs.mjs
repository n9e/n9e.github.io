/**
 * 由 scripts/docs-tree.mjs 生成：
 *   1. sidebars.ts                                     —— 整个重写。树里每个 section 是一个
 *                                                        独立侧栏（上手 / 使用 / 运行 / 查阅），
 *                                                        页面上表现为文档区顶部的一排页签
 *   2. i18n/en/docusaurus-plugin-content-docs/current.json —— 分组/外链的英文标签
 *   3. src/data/docs-tabs.json                         —— 页签：key、双语标签、首页地址、图标
 *   4. src/css/docs-icons.css                          —— 分组标题前的图标（CSS mask）
 *   5. 占位页 docs/<id>.md 与 i18n/zh-Hans/.../current/<id>.md —— 只补缺，不覆盖
 *
 * 占位页只有 front matter，没有正文；页面上的提示由
 * src/theme/DocItem/Content（读 front matter 的 planned 字段）渲染。
 * 正文写好后把 planned / sidebar_class_name 两行删掉即可，文件本身不用换。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tree, SIDEBAR_LAYOUT } from './docs-tree.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EN_DIR = path.join(root, 'docs');
const ZH_DIR = path.join(root, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current');
const EN_JSON = path.join(root, 'i18n/en/docusaurus-plugin-content-docs/current.json');

const yamlStr = (s) => JSON.stringify(s); // 双引号标量在 YAML 里合法，顺带处理冒号和引号

// ---------- 1. sidebars.ts ----------

const DOCS_BASE = '/docs';

const firstDocId = (items) => {
  for (const it of items) {
    if (it.type === 'doc') return it.id;
    if (it.type === 'category') {
      const id = firstDocId(it.items);
      if (id) return id;
    }
  }
  return null;
};

/** 分组的落地地址：有总览页去总览页，否则去生成的索引页 */
const categorySlug = (node) => '/' + path.posix.dirname(firstDocId(node.items));
const categoryHref = (node) => {
  if (node.index) return `${DOCS_BASE}/${node.index}`;
  if (node.zh.blurb) return `${DOCS_BASE}${categorySlug(node)}`; // generated-index
  return `${DOCS_BASE}/${firstDocId(node.items)}`; // 纯分组：去第一篇
};

// xmlns 不能省：作为 CSS 里的 data URI 使用时，没有命名空间的 SVG 不会渲染（内联到 HTML 里倒是无所谓）
const svgOf = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const imports = new Set();

function emit(node, indent, level) {
  const pad = ' '.repeat(indent);
  if (node.type === 'doc') return `${pad}'${node.id}',`;
  if (node.type === 'section') {
    // 只在 single 布局出现（tabs 布局里分段变成了页签）。html 条目不走 current.json
    // 翻译，只能在构建时按 locale 分流——和 docusaurus.config.ts 里公告条的做法一样。
    return `${pad}{ type: 'html', value: isEn ? ${JSON.stringify(node.en)} : ${JSON.stringify(node.zh)}, defaultStyle: false, className: 'n9e-sb-section' },`;
  }
  if (node.type === 'link') {
    let href;
    if (typeof node.href === 'object') {
      imports.add(node.href.expr);
      href = node.href.expr;
    } else {
      href = `'${node.href}'`;
    }
    const key = node.en.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${pad}{ type: 'link', key: '${key}', label: '${node.zh.label}', href: ${href} },`;
  }
  // category
  const slug = categorySlug(node);
  let link = null;
  if (node.index) link = `{ type: 'doc', id: '${node.index}' }`;
  else if (node.zh.blurb)
    link = `{\n${pad}    type: 'generated-index',\n${pad}    title: '${node.zh.label}',\n${pad}    description: ${yamlStr(node.zh.blurb)},\n${pad}    slug: '${slug}',\n${pad}  }`;
  const items = node.items.map((it) => emit(it, indent + 4, level + 1)).join('\n');
  // 一级分组：tabs 布局下常开不可折叠（分组标题就是侧栏骨架，参考 Flashduty）；
  // single 布局下可折叠、默认折叠（open: true 的除外）。二级分组两种布局都可折叠。
  const top = level === 0;
  const topProps =
    SIDEBAR_LAYOUT === 'tabs'
      ? [`${pad}  collapsible: false,`]
      : [`${pad}  collapsed: ${node.open ? 'false' : 'true'},`];
  return [
    `${pad}{`,
    `${pad}  type: 'category',`,
    `${pad}  key: '${node.key}',`,
    `${pad}  label: '${node.zh.label}',`,
    ...(top ? [...topProps, `${pad}  className: 'n9e-group n9e-group--${node.key}',`] : [`${pad}  collapsed: true,`]),
    ...(link ? [`${pad}  link: ${link},`] : []),
    `${pad}  items: [`,
    items,
    `${pad}  ],`,
    `${pad}},`,
  ].join('\n');
}

// 把扁平的树按 section 切成多份侧栏；section 之前的条目（文档首页）不进任何侧栏
const sidebarsByKey = [];
let current = null;
for (const node of tree) {
  if (node.type === 'section') {
    current = { ...node, items: [] };
    sidebarsByKey.push(current);
  } else if (current) {
    current.items.push(node);
  }
}

// single 布局：整棵树进一份侧栏（含文档首页链接和分段标题）；tabs 布局：每个 section 一份
const sidebarSets =
  SIDEBAR_LAYOUT === 'tabs'
    ? sidebarsByKey.map((sb) => ({ key: sb.key, items: sb.items }))
    : [{ key: 'docs', items: tree }];

const sidebarBlocks = sidebarSets
  .map((sb) => `  ${sb.key}: [\n${sb.items.map((n) => emit(n, 4, 0)).join('\n')}\n  ],`)
  .join('\n');
const importLine = imports.size
  ? `import { ${[...imports].join(', ')} } from './src/data/site';\n`
  : '';
const layoutNote =
  SIDEBAR_LAYOUT === 'tabs'
    ? '// 当前布局 tabs：四份侧栏对应文档区顶部的四个页签（上手 / 使用 / 运行 / 查阅），每篇文档只属于一份。'
    : '// 当前布局 single：一份侧栏，分段标题 + 默认折叠的分组。切换布局改 docs-tree.mjs 的 SIDEBAR_LAYOUT。';

const sidebarsTs = `// 由 scripts/scaffold-docs.mjs 从 scripts/docs-tree.mjs 生成 —— 不要手改，改 docs-tree.mjs 后跑 npm run scaffold。
//
${layoutNote}
// 分组标签是中文（中文是文案的 source of truth），英文走
// i18n/en/docusaurus-plugin-content-docs/current.json，同样由生成器维护。
// 页面标签不在这里：取各篇 front matter 的 sidebar_label。
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
${importLine}
const isEn = process.env.DOCUSAURUS_CURRENT_LOCALE === 'en';

const sidebars: SidebarsConfig = {
${sidebarBlocks}
};

export default sidebars;
`;
fs.writeFileSync(path.join(root, 'sidebars.ts'), sidebarsTs);

// ---------- 1b. 页签数据 + 分组图标 CSS ----------

const tabs = (SIDEBAR_LAYOUT === 'tabs' ? sidebarsByKey : []).map((sb) => {
  const first = sb.items[0];
  const href = first.type === 'category' ? categoryHref(first) : `${DOCS_BASE}/${first.id}`;
  return { key: sb.key, en: sb.en, zh: sb.zh, href, icon: svgOf(sb.icon) };
});
fs.mkdirSync(path.join(root, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/data/docs-tabs.json'), JSON.stringify(tabs, null, 2) + '\n');

const iconRules = sidebarsByKey
  .flatMap((sb) => sb.items)
  .filter((n) => n.type === 'category' && n.icon)
  .map((n) => {
    const svg = svgOf(n.icon).replace(/currentColor/g, 'black');
    return `.n9e-group--${n.key} { --n9e-group-icon: url("data:image/svg+xml,${encodeURIComponent(svg)}"); }`;
  })
  .join('\n');
fs.writeFileSync(
  path.join(root, 'src/css/docs-icons.css'),
  `/* 由 scripts/scaffold-docs.mjs 生成 —— 侧栏一级分组标题前的图标。改图标去 docs-tree.mjs 的 ICONS。 */\n${iconRules}\n`,
);

// ---------- 2. 英文分组翻译 ----------

const existingJson = fs.existsSync(EN_JSON) ? JSON.parse(fs.readFileSync(EN_JSON, 'utf8')) : {};
const enJson = {};
if (existingJson['version.label']) enJson['version.label'] = existingJson['version.label'];

function collect(node, sidebar) {
  if (node.type === 'category') {
    enJson[`sidebar.${sidebar}.category.${node.key}`] = {
      message: node.en.label,
      description: `The label for category '${node.zh.label}' in sidebar '${sidebar}'`,
    };
    if (!node.index && node.zh.blurb) {
      enJson[`sidebar.${sidebar}.category.${node.key}.link.generated-index.title`] = {
        message: node.en.label,
        description: `The generated-index page title for category '${node.zh.label}' in sidebar '${sidebar}'`,
      };
      enJson[`sidebar.${sidebar}.category.${node.key}.link.generated-index.description`] = {
        message: node.en.blurb,
        description: `The generated-index page description for category '${node.zh.label}' in sidebar '${sidebar}'`,
      };
    }
    node.items.forEach((n) => collect(n, sidebar));
  } else if (node.type === 'link') {
    const key = node.en.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    enJson[`sidebar.${sidebar}.link.${key}`] = {
      message: node.en.label,
      description: `The label for link '${node.zh.label}' in sidebar '${sidebar}'`,
    };
  }
}
sidebarSets.forEach((sb) => sb.items.forEach((n) => collect(n, sb.key)));
fs.mkdirSync(path.dirname(EN_JSON), { recursive: true });
fs.writeFileSync(EN_JSON, JSON.stringify(enJson, null, 2) + '\n');

// ---------- 3. 占位页 ----------

const exists = (dir, id) => ['.md', '.mdx'].some((ext) => fs.existsSync(path.join(dir, id + ext)));

const stub = (loc, node) => {
  const t = node[loc];
  const note =
    loc === 'en'
      ? '# Not written yet. Delete the two lines below once it is — the file itself stays.\n# planned: shows the placeholder notice and marks the page noindex\n# sidebar_class_name: dims it in the sidebar'
      : '# 尚未撰写。正文写好后删掉下面两行即可，文件不用换。\n# planned：渲染占位提示并把页面标记为 noindex；sidebar_class_name：目录里显示为未写';
  const lines = [
    '---',
    `title: ${yamlStr(t.title)}`,
    `sidebar_label: ${yamlStr(t.label)}`,
    `description: ${yamlStr(t.scope)}`,
    note,
    'planned: true',
    'sidebar_class_name: planned',
  ];
  lines.push('---', '');
  return lines.join('\n');
};

const report = { created: [], missingExisting: [], skipped: 0 };

function scaffold(node) {
  if (node.type === 'category') return node.items.forEach(scaffold);
  if (node.type !== 'doc') return;
  for (const [loc, dir] of [['en', EN_DIR], ['zh', ZH_DIR]]) {
    if (exists(dir, node.id)) {
      report.skipped++;
      continue;
    }
    if (node.existing) {
      report.missingExisting.push(`${loc}: ${node.id}`);
      continue;
    }
    const file = path.join(dir, node.id + '.md');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, stub(loc, node));
    report.created.push(`${loc}: ${node.id}`);
  }
}
tree.forEach(scaffold);

console.log(`sidebars.ts 已重写（布局 ${SIDEBAR_LAYOUT}，${sidebarSets.length} 份侧栏）；页签 ${tabs.length} 个；英文分组翻译 ${Object.keys(enJson).length} 条`);
console.log(`占位页：新建 ${report.created.length}，已有跳过 ${report.skipped}`);
if (report.missingExisting.length) {
  console.log('\n⚠ 标记为 existing 但文件不存在（需要手动补齐/搬运）：');
  report.missingExisting.forEach((m) => console.log('   ' + m));
  process.exitCode = 1;
}
