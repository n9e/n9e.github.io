import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';
import { SLACK_INVITE, DEMO_URL } from './src/data/site';
import { starCount } from './src/lib/format';
import repo from './src/data/stats.json';
import { redirectsForLocale } from './scripts/legacy-doc-urls.mjs';
import robotsTxtPlugin from './scripts/robots-txt-plugin.mjs';
import llmsTxtLinks from './scripts/llms-txt-links.mjs';
import { readFileSync } from 'node:fs';

const FONT_FACE_CSS = readFileSync(new URL('./src/css/fonts.css', import.meta.url), 'utf8').replace(/^\/\*.*\*\/\n/, '');

// 域名待定（方案 §6 待拍板项 2）。改这里即可，页面内不硬编码站点地址。
const SITE_URL = 'https://n9e.github.io';
const BASE_URL = '/';

// 产品前端用 iframe 抽屉嵌入文档：地址后面带 `/?onlyContent&theme=dark|light`。
// 1) trailingSlash 为 false，除了两个语言根路径，没有合法页面以 / 结尾；前端拼出的 `/xxx/` 在静态托管上
//    是 404，这里换成不带斜杠的地址重新加载。
// 2) 带 onlyContent 时给 <html> 打上 data-n9e-embed，CSS 据此只留正文；theme 翻译成 Docusaurus 自带的
//    docusaurus-theme 参数——它只影响本次渲染，不写 localStorage，不会改掉用户直接访问官网时的主题偏好。
// 3) iframe 里点链接跳到别的文档时 URL 上已经没有参数了，用 sessionStorage 记住「这个标签页里是嵌入态」。
const EMBED_INLINE_SCRIPT = `(function () {
  try {
    var l = window.location, p = l.pathname;
    if (p.length > 1 && p.charAt(p.length - 1) === '/' && p !== '${BASE_URL}zh/') {
      l.replace(p.replace(/\\/+$/, '') + l.search + l.hash);
      return;
    }
    var q = new URLSearchParams(l.search);
    var inFrame = window.self !== window.top;
    // 隐私设置可能禁止 iframe 访问存储。显式 URL 参数仍须生效，不能因存储失败退出。
    var ss;
    try { ss = window.sessionStorage; } catch (e) {}
    function read(key) { try { return ss && ss.getItem(key); } catch (e) { return null; } }
    function remember(key, value) { try { if (ss) ss.setItem(key, value); } catch (e) {} }
    if (!q.has('onlyContent') && !(inFrame && read('n9e-embed') === '1')) return;
    var theme = q.get('theme');
    if (theme !== 'dark' && theme !== 'light') theme = inFrame ? read('n9e-embed-theme') : null;
    if (inFrame) {
      remember('n9e-embed', '1');
      if (theme) remember('n9e-embed-theme', theme);
    }
    document.documentElement.setAttribute('data-n9e-embed', '');
    // 前端抽屉会带 #oauth2 这类锚点打开。站点全局是 scroll-behavior: smooth，加载期间的平滑滚动会被
    // 打断，停在锚点下方几百像素；等资源加载完，用 instant 再对准一次
    if (l.hash) {
      var anchor = decodeURIComponent(l.hash.slice(1));
      window.addEventListener('load', function () {
        setTimeout(function () {
          var el = document.getElementById(anchor);
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }, 0);
      });
    }
    if (theme && !q.has('docusaurus-theme')) {
      q.set('docusaurus-theme', theme);
      history.replaceState(history.state, '', p + '?' + q.toString() + l.hash);
    }
  } catch (e) {}
})();`;

// 不走 i18n JSON 的配置项（如 og 图）只能按构建时的 locale 分流
const isEn = process.env.DOCUSAURUS_CURRENT_LOCALE === 'en';
const LOCALE_BASE_URL = isEn ? BASE_URL : '/zh/';
// 历史文档地址的别名表；带斜杠的历史别名已在里面，createRedirects 不再重复生成。
const legacyRedirects = redirectsForLocale(isEn ? 'en' : 'zh-Hans');
const legacyFroms = new Set(legacyRedirects.map((r) => r.from));

const config: Config = {
  // 站点标题会进每一页的 <title> 后缀和 og:title，英文站不能带中文；英文 tagline 与首页 hero 标题一致
  title: isEn ? 'Nightingale' : '夜莺 Nightingale',
  tagline: isEn ? 'Open-Source Alerting for Your Existing Stack' : '开源监控告警专家',
  favicon: 'img/favicon.png',

  url: SITE_URL,
  baseUrl: BASE_URL,
  organizationName: 'ccfos',
  projectName: 'nightingale',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',

  // 英文是默认语言，占据根路径；中文在 /zh。
  // locale 仍叫 zh-Hans（决定 i18n/zh-Hans/ 目录名和 hreflang），URL 段由 baseUrl 单独指定：
  // 不指定时 Docusaurus 会拿 locale 名当 URL 段，那就是之前的 /zh-Hans/。
  // 构建产物也跟着落到 build/zh/，部署脚本不用改。
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans'],
    localeConfigs: {
      en: { label: 'English', htmlLang: 'en' },
      'zh-Hans': { label: '简体中文', htmlLang: 'zh-CN', baseUrl: '/zh/' },
    },
  },

  headTags: [
    // 首屏用到的字重先行加载：正文 400、小标题 700、大标题 800，以及首页卡片和代码块用的等宽 400。
    // 字体在首帧前到位，就不会出现「先回退字体、再切 Archivo」的重排（CLS）。
    ...['archivo-latin-400', 'archivo-latin-700', 'archivo-latin-800', 'jetbrains-mono-latin-400'].map((f) => ({
      tagName: 'link',
      attributes: {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: `/fonts/${f}-normal.woff2`,
        crossorigin: 'anonymous',
      },
    })),
    // @font-face 内联在 <head>：由 scripts/sync-fonts.mjs 生成（static/fonts 里的固定文件名 +
    // 度量匹配的回退字体）。放在这里而不是 customCss，是为了绕开 webpack 对 url() 的改写，
    // 让 CSS 里的地址和上面 preload 的地址一致。
    { tagName: 'style', attributes: {}, innerHTML: FONT_FACE_CSS },
    // 必须在 <head> 里、早于 Docusaurus 自己放在 <body> 开头的主题脚本执行：
    // 这里改写的 docusaurus-theme 参数要被它读到，嵌入属性也要在首帧前就位。
    { tagName: 'script', attributes: {}, innerHTML: EMBED_INLINE_SCRIPT },
    // 百度统计（沿用 n9e.github.io 旧站的站点 ID）；站内路由切换的 PV 由 src/clientModules/baiduAnalytics.ts 补报
    {
      tagName: 'script',
      attributes: {},
      innerHTML:
        'var _hmt = _hmt || [];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?9d7cc507a7aae60b28b5e04bb995492a";hm.async=true;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();',
    },
  ],

  clientModules: [
    require.resolve('./src/clientModules/legacyDocRedirects.ts'),
    require.resolve('./src/clientModules/baiduAnalytics.ts'),
    require.resolve('./src/clientModules/ymlDownloads.ts'),
  ],

  presets: [
    [
      'classic',
      {
        // 首屏由 gtag 自动上报，站内路由切换由官方插件上报。
        // GA4 数据流中关闭「Page changes based on browser history events」，避免重复 PV。
        // 官方插件仅在 production 构建启用，npm start 不上报开发访问。
        gtag: {
          trackingID: 'G-W860H4Z5JM',
          anonymizeIP: true,
        },
        // 一级目录见 sidebars.ts。一期仅 v9 一套正文，不做多版本快照。
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          // 每页底部的"编辑此页"，占位页上的"帮我们写这一页"也指向它。
          // editLocalizedFiles：中文页指向 i18n/zh-Hans/ 下的那份，而不是英文源文件。
          editUrl: 'https://github.com/n9e/n9e.github.io/edit/main/',
          editLocalizedFiles: true,
          // 故意不开 showLastUpdateTime：它取的是 git 提交时间，一次批量改格式就会让
          // 全站显示"今天更新"（调研 §15.7 点名的"虚假新鲜感"）。要标就标"最后验证"，
          // 那得等有人真的验证过，是正文的事，不是配置的事。
        },
        blog: false,
        theme: {
          // 字体自托管（@fontsource，OFL 许可）：之前从 fonts.googleapis.com 加载，那个样式表挂在
          // <head> 里会阻塞渲染，大陆网络经常连不上，首屏就一直白着。每个字重一份 CSS，
          // 按 unicode-range 分片，浏览器只会下载页面用到的 latin 子集。
          // docs-icons.css 由 scripts/scaffold-docs.mjs 生成（侧栏分组图标），不要手改
          customCss: [
            // 字体的 @font-face 不走这里：webpack 会把 url(/fonts/x.woff2) 改成带哈希的 /assets/fonts/…，
            // 和 headTags 里 preload 的地址对不上，等于下载两遍。见上面 headTags 里的内联 <style>。
            './src/css/custom.css',
            './src/css/docs-icons.css',
          ],
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          // 每页 <lastmod> 取源文件最后一次提交的日期；CI 里 checkout 必须 fetch-depth: 0，
          // 浅克隆下所有页面都会写成构建当天，等于没有
          lastmod: 'date',
          // 搜索结果页随 ?q= 变化、空页无内容，不进 sitemap（页面本身也打了 noindex，见 src/theme/SearchPage）
          ignorePatterns: ['/search', '/zh/search'],
        },
      } satisfies Preset.Options,
    ],
  ],

  // 中文分词搜索（jieba 分词、大陆可用、不依赖 Algolia）。
  // 它的 SearchBar 会调 useActiveVersion，所以必须和 docs 插件同开同关——
  // 单独打开这一段而 docs: false 会直接构建失败。
  plugins: [
    robotsTxtPlugin,
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: legacyRedirects,
        // trailingSlash 为 false，只有 /docs/x.html 这一份文件；外链或手输 /docs/x/ 时
        // GitHub Pages 会去找 docs/x/index.html，没有就 404。给每个页面补一个带斜杠的
        // 跳转别名（scripts/finalize-slash-aliases.mjs 构建后再把它收拾成和历史别名一样的形态）。
        createRedirects: (existingPath) => {
          if (existingPath === '/' || existingPath.endsWith('/') || existingPath.endsWith('.html')) return [];
          const withSlash = `${existingPath}/`;
          return legacyFroms.has(withSlash) ? [] : [withSlash];
        },
      },
    ],
    // 集成独立页：/integrations/<slug>，第二个 docs 实例。正文由 scripts/integration-pages/generate.mjs
    // 从上游模板数据生成（中英各一份），不手改。目录页 /integrations 仍是 src/pages 里的那张，
    // 两者不冲突：没有 slug 为 / 的文档时，这个实例只占 /integrations/ 下面的路径。
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'integrations',
        path: 'integrations',
        routeBasePath: 'integrations',
        sidebarPath: './sidebars-integrations.ts',
        // 「编辑此页」指向上游模板目录（页面 front matter 的 custom_edit_url），这里不设 editUrl
        breadcrumbs: true,
      },
    ],
    // 告警规则库：/alert-rules/<slug>，第三个 docs 实例。正文由 scripts/alert-rules/generate.mjs
    // 从集成模板里的内置规则生成（中英各一份），不手改。规则文件在 static/alert-rules/*.yml。
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'alert-rules',
        path: 'alert-rules',
        routeBasePath: 'alert-rules',
        sidebarPath: './sidebars-alert-rules.ts',
        breadcrumbs: true,
      },
    ],
    // 给 AI 爬虫/助手的纯文本入口：每种语言各一份 llms.txt（目录 + 一句话摘要）、llms-full.txt（全文），
    // 以及每个页面同路径的 .md 原文（/docs/x → /docs/x.md）。从构建好的 HTML 转出来，中英文各跑一次。
    [
      '@signalwire/docusaurus-plugin-llms-txt',
      {
        siteTitle: isEn ? 'Nightingale (n9e)' : '夜莺监控 Nightingale (n9e)',
        siteDescription: isEn
          ? 'Open-source alerting engine for Prometheus, VictoriaMetrics, Elasticsearch, ClickHouse and more. Self-hosted, Apache-2.0, with a built-in AI agent and MCP server.'
          : '开源监控告警引擎：对接 Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse 等数据源，统一告警规则、降噪与分发；自托管，Apache-2.0，内置 AI 助手与 MCP Server。',
        // 分组深度：目录按 URL 前两段分（docs / get-started）。中文站多一层 /zh/ 前缀，所以多一级
        depth: isEn ? 2 : 3,
        content: {
          includeDocs: true,
          includePages: true,
          enableLlmsFullTxt: true,
          // 文档页只取正文；其它页面取整个 main。默认选择器里的 article 会先命中首页的告警卡片，
          // 转出来的首页只剩一张卡
          contentSelectors: ['.theme-doc-markdown', 'main'],
          // 绝对地址：这些文件是给站外的模型读的，相对路径离开站点就失效
          relativePaths: false,
          // 中文站会拼出 /zh/zh/（见 scripts/llms-txt-links.mjs），在 Markdown 树上收回来；顺手把图片也拼成绝对地址
          beforeDefaultRemarkPlugins: [[llmsTxtLinks, { baseUrl: LOCALE_BASE_URL, siteUrl: SITE_URL }]],
          excludeRoutes: ['**/search', '**/404.html'],
        },
      },
    ],
    [
      '@easyops-cn/docusaurus-search-local',
      {
        language: ['en', 'zh'],
        hashed: true,
        indexBlog: false,
        indexPages: true,
        // 三个 docs 实例都进索引：主文档、集成独立页、告警规则库
        docsRouteBasePath: ['docs', 'integrations', 'alert-rules'],
        docsDir: ['docs', 'integrations', 'alert-rules'],
        // 关掉输入框右侧那两个 ⌘/K 小方块。快捷键本身仍然可用，
        // 只是不再占视觉位置——提示改写进 placeholder（见 i18n/*/code.json）。
        searchBarShortcutHint: false,
        // 文档首页那三个分组标题是导航标签，不是正文。插件按标题切片建索引，
        // 不排除的话搜"降噪"会返回一条「DELIVER把噪声降下去…」指向 /docs——
        // 既没信息量，两个 span 之间又没有空格，结果里显示成粘在一起的一串。
        // 页面本身仍然进索引（标题、摘要、卡片文字都还在），只是不再按标题切片。
        ignoreCssSelectors: ['.n9e-docs-home-head'],
      },
    ],
  ],

  themeConfig: {
    // 社交分享卡片。产品截图当 OG 图在 1200×630 下糊成一片，改用专门的卡片。
    // 源文件在 scripts/og/，改完用浏览器按 1200×630 截图覆盖 static/img/ 下的同名文件。
    image: isEn ? 'img/og-en.png' : 'img/og.png',
    // 两张卡片都是 1200×630，尺寸写死给抓取器：Facebook / LinkedIn 第一次分享时不用先异步拉图再排版。
    // 换图请保持尺寸，或同步改这里。
    metadata: [
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
    ],
    // 默认深色。respectPrefersColorScheme 必须关掉：开着的话系统设为浅色的访客
    // 仍然会拿到浅色，defaultMode 形同虚设。访客自己切换的结果仍会被记住。
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: '夜莺',
      logo: {
        alt: 'Nightingale',
        src: 'img/logo-mark.webp',
        // 原图 452×473；给出尺寸，CSS 只定高度时宽度也能在图片到达前算出来，导航栏不跳
        width: 25,
        height: 26,
      },
      items: [
        // 指向 /docs 而不是第一篇正文：那里是任务分流页（调研 §6.1 / §16.5），
        // 让读者先认出自己要办的事，再进具体文章。
        { to: '/docs', label: '文档', position: 'left' },
        { to: '/integrations', label: '集成', position: 'left' },
        { to: '/comparisons', label: '对比', position: 'left' },
        { to: '/download', label: '下载', position: 'left' },
        {
          label: '社区',
          position: 'left',
          items: [
            { href: 'https://github.com/ccfos/nightingale/issues', label: '提交 Issue' },
            { href: SLACK_INVITE, label: 'Slack' },
          ],
        },
        // demo 站上线前 DEMO_URL 为空，这一项不进导航（设计文档 §6.1：导航栏常驻按钮）
        ...(DEMO_URL ? [{ href: DEMO_URL, label: '在线体验', position: 'right' as const }] : []),
        {
          href: 'https://github.com/ccfos/nightingale',
          // 可观测同类（SigNoz、OpenObserve、HyperDX、Keep）都在这里放 star 数；数字来自构建时抓取的 stats.json
          label: starCount(repo.stars),
          position: 'right',
          className: 'navbar-github',
          'aria-label': `GitHub, ${repo.stars} stars`,
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '产品',
          items: [
            { label: '文档', to: '/docs' },
            { label: '下载', to: '/download' },
            { label: '发布说明', href: 'https://github.com/ccfos/nightingale/releases' },
            // 两个语言都走站内的 Categraf 页；那一页再往文档的 Categraf 分区送。
            // 早先中文站直达仓库，是因为仓库 README 只有中文、站内没有中文页——
            // 现在中英两套页面和文档都齐了，没有理由再把人推去 GitHub。
            { label: 'Categraf 采集器', to: '/categraf' },
          ],
        },
        {
          title: '资源',
          items: [
            { label: '集成生态', to: '/integrations' },
            { label: '告警规则库', to: '/alert-rules' },
            { label: '产品对比', to: '/comparisons' },
            // 两个选型落地页（设计稿 §6.2：从页脚链入，长期接搜索流量）
            { label: 'Zabbix 替代方案', to: '/comparisons/zabbix-alternatives' },
            { label: '开源告警平台选型', to: '/comparisons/open-source-alerting-platforms' },
            { label: 'MCP Server', href: 'https://github.com/ccfos/nightingale#-mcp-server' },
          ],
        },
        {
          title: '社区',
          items: [
            { label: 'GitHub', href: 'https://github.com/ccfos/nightingale' },
            { label: 'Issues', href: 'https://github.com/ccfos/nightingale/issues' },
            { label: 'Slack', href: SLACK_INVITE },
          ],
        },
        {
          title: '关于',
          items: [
            { label: 'Apache-2.0 License', href: 'https://github.com/ccfos/nightingale/blob/main/LICENSE' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Nightingale Contributors · Apache-2.0`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'toml', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
