import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';
import { SLACK_INVITE, DEMO_URL } from './src/data/site';
import { starCount } from './src/lib/format';
import repo from './src/data/stats.json';

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
    var ss = window.sessionStorage;
    if (!q.has('onlyContent') && !(inFrame && ss.getItem('n9e-embed') === '1')) return;
    var theme = q.get('theme');
    if (theme !== 'dark' && theme !== 'light') theme = inFrame ? ss.getItem('n9e-embed-theme') : null;
    if (inFrame) {
      ss.setItem('n9e-embed', '1');
      if (theme) ss.setItem('n9e-embed-theme', theme);
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

const config: Config = {
  // 站点标题会进每一页的 <title> 后缀和 og:title，英文站不能带中文；英文 tagline 与首页 hero 标题一致
  title: isEn ? 'Nightingale' : '夜莺 Nightingale',
  tagline: isEn ? 'Open-Source Alerting for Your Existing Stack' : '开源告警专家',
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
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    },
  ],

  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap',
  ],

  clientModules: [require.resolve('./src/clientModules/baiduAnalytics.ts')],

  presets: [
    [
      'classic',
      {
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
          // docs-icons.css 由 scripts/scaffold-docs.mjs 生成（侧栏分组图标），不要手改
          customCss: ['./src/css/custom.css', './src/css/docs-icons.css'],
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  // 中文分词搜索（jieba 分词、大陆可用、不依赖 Algolia）。
  // 它的 SearchBar 会调 useActiveVersion，所以必须和 docs 插件同开同关——
  // 单独打开这一段而 docs: false 会直接构建失败。
  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        language: ['en', 'zh'],
        hashed: true,
        indexBlog: false,
        indexPages: true,
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
        src: 'img/logo-mark.png',
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
            { label: '产品对比', to: '/comparisons' },
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
