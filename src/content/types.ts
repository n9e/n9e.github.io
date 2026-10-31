/** 站点文案的结构定义。zh.ts / en.ts 都按这个形状实现。 */

export interface LinkItem {
  label: string;
  /** 站内路径（/download）或外链（https://…）都可以，组件统一用 Docusaurus Link 渲染 */
  href: string;
}

export interface AlertCard {
  severity: string;
  rule: string;
  labels: string[];
  firedAtLabel: string;
  firedAt: string;
  durationLabel: string;
  duration: string;
}

export interface NotifyChannel {
  name: string;
  logo: string;
}

export interface Hero {
  kicker: string;
  /** 填了 kicker 就渲染成链接（如 '#ai' 跳到首页 AI 区块）；不填就是纯文字 */
  kickerHref?: string;
  /** Live Demo 按钮文案。地址来自 src/data/site.ts 的 DEMO_URL，留空则整个按钮不渲染 */
  demoLabel: string;
  /** 按钮下的一行微文案，用来消解点击顾虑（"要不要注册？会不会弄坏？"） */
  demoNote: string;
  ctaPrimaryNote: string;
  /** 可用 \n 指定宽屏下的断行点 */
  title: string;
  /** <title> 与 og:title，和 H1 分开写：品牌 + 别名（夜莺监控 / n9e）+ 品类词。
   *  "Nightingale" 单独一个词歧义太大（人名、公司名都叫这个），搜索引擎和 AI 靠这里认出项目 */
  metaTitle: string;
  /** 只给 og:title / twitter:title 用：在 X、Slack 等处贴链接时卡片上显示的标题。
   *  和 metaTitle 分开，是为了不动搜索结果里的 <title>，卡片上可以更直接地讲卖点 */
  shareTitle: string;
  /** <meta name=description> 与 og:description，控制在 160 字符内；lead 是给人看的，可以更长 */
  metaDescription: string;
  lead: string;
  /** 副标题下单独一行的能力点，按 " · " 拆成一个个小标签，如 "Built-in AI agent · MCP & A2A"；不填则不渲染 */
  highlights?: string;
  ctaPrimary: LinkItem;
  ctaSecondary: LinkItem;
  installCaption: string;
  installLines: string[];
  copy: string;
  copied: string;
  shotAlt: string;
  alert: AlertCard;
  notify: { label: string; channels: NotifyChannel[] };
}

export interface StatItem {
  value: string;
  label: string;
}

export interface Stats {
  starsLabel: string;
  items: StatItem[];
}

/** 数据在管线里所处的阶段，决定脊柱在这一段的颜色 */
export type Stage = 'config' | 'event' | 'ai';

export interface CodeCard {
  filename: string;
  language: string;
  content: string;
}

export interface PipelineStep {
  /** 该阶段对应的产品对象名，用作结构标记（替代 01/02/03） */
  artifact: string;
  stage: Stage;
  title: string;
  body: string;
  points: string[];
  shot?: string;
  shotAlt?: string;
  /** 图片原始像素尺寸，写进 <img width/height>，页面不会在图加载时跳动 */
  shotSize?: [number, number];
  code?: CodeCard;
}

export interface Pipeline {
  eyebrow: string;
  title: string;
  lead: string;
  chainCaption: string;
  steps: PipelineStep[];
}

export type TermKind = 'user' | 'tool' | 'out';

export interface TermLine {
  kind: TermKind;
  text: string;
  dim?: string;
  ok?: boolean;
}

/** AI 区块的一层：AI 出现在哪里（夜莺里 / 告警流程里 / 外部调用） */
export interface AiTier {
  label: string;
  title: string;
  body: string;
}

export interface HomeAi {
  eyebrow: string;
  title: string;
  lead: string;
  tiers: AiTier[];
  /** 区块底部一行补充，如可接入的模型 */
  note: string;
  terminal: { title: string; lines: TermLine[] };
}

/** 通用媒介不是产品，没有品牌 logo，用内联字形代替 */
export type IntegrationIcon = 'phone' | 'email';

export interface IntegrationItem {
  name: string;
  logo?: string;
  icon?: IntegrationIcon;
}

export interface IntegrationGroup {
  label: string;
  title: string;
  items: IntegrationItem[];
}

export interface IntegrationsSection {
  eyebrow: string;
  title: string;
  lead: string;
  groups: IntegrationGroup[];
  more: LinkItem;
}

export interface DeployCard {
  title: string;
  body: string;
  code?: string;
  link: LinkItem;
}

export interface DeploySection {
  eyebrow: string;
  title: string;
  cards: DeployCard[];
}

export interface CompareCard {
  title: string;
  body: string;
  /** 完整对比页，如 /comparisons/zabbix */
  href: string;
}

export interface CompareSection {
  eyebrow: string;
  title: string;
  lead: string;
  cards: CompareCard[];
  more: LinkItem;
}

export interface TrustSection {
  eyebrow: string;
  title: string;
  lead: string;
  /** 中文站：整墙一张图。README 那 64 家只有这一张合图，没有独立 logo 文件 */
  logoWall?: string;
  logoAlt?: string;
  /** 合图的原始像素尺寸，同 PipelineStep.shotSize */
  logoWallSize?: [number, number];
  /** 图太高时裁切并向下渐隐 */
  logoWallCrop?: boolean;
  /** 英文站：逐个 logo，横向滚动。有独立文件才能这么做。
   *  invert：官方只给了纯白填充版，放在白底上要反相成黑色 */
  logos?: { file: string; name: string; invert?: boolean }[];
}

export interface FinalCta {
  title: string;
  lead: string;
  primary: LinkItem;
  secondary: LinkItem;
  communityLabel: string;
  community: LinkItem[];
  /** 微信群：只有中文站有这个渠道，英文站不设 */
  wechat?: string;
}

/** 对比表里一格的状态：有 / 部分有 / 没有。用图形而不是文字勾叉，避免"自家全勾、对手全空"的偏向观感 */
export type CapabilityLevel = 'full' | 'partial' | 'none';

export interface CapabilityCell {
  level: CapabilityLevel;
  /** 两到四个词的短语，不写整句——表格是扫的，不是读的 */
  text: string;
}

export interface CapabilityRow {
  label: string;
  /** 与 ComparisonsPage.products 一一对应，第 0 项是夜莺 */
  cells: CapabilityCell[];
}

/** 对比页里的聊天界面一行。文案来自 docs/ai 的技能描述，不编造能力 */
export type ChatLine =
  | { kind: 'context'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'tool'; text: string; dim?: string }
  | { kind: 'out'; text: string; ok?: boolean }
  | {
      kind: 'confirm';
      title: string;
      changes: { field: string; from: string; to: string }[];
      note: string;
      confirmLabel: string;
      cancelLabel: string;
    };

export interface AiTab {
  id: string;
  title: string;
  body: string;
  /** 右侧聊天窗口的标题栏文字 */
  chatTitle: string;
  chat: ChatLine[];
}

export interface AiSection {
  title: string;
  lead: string;
  tabs: AiTab[];
  /** 事实行：每项一个短语 */
  facts: string[];
  rivalsLabel: string;
  rivals: { name: string; stance: string }[];
}

/** 每章右侧的界面配图，三种各讲一件事；全部用 HTML 画，跟着语言和主题走 */
export type ChapterVisual =
  | {
      kind: 'split';
      leftTitle: string;
      code: string[];
      rightTitle: string;
      fields: { label: string; value: string }[];
    }
  | {
      kind: 'wiring';
      sourcesLabel: string;
      sources: IntegrationItem[];
      hub: string;
      hubNote: string;
      channelsLabel: string;
      channels: IntegrationItem[];
      channelsMore: string;
    }
  | {
      kind: 'embed';
      panelTitle: string;
      panelNote: string;
      event: { severity: string; rule: string; labels: string[]; status: string };
    };

/** 配图下方的一问一答，问题取自文档里可直接粘贴的提问 */
export interface Ask {
  q: string;
  a: string;
}

export interface Verdict {
  /** 章节锚点，也用于页内目录 */
  id: string;
  title: string;
  /** 一句话说清对方的路子 */
  theirWay: string;
  /** 一句话说清夜莺的路子 */
  ourWay: string;
  /** 对方擅长什么——写清楚，不藏 */
  theirs: string;
  /** 什么情况下换夜莺更省事 */
  ours: string;
  /** 三条"换的信号"，读者对号入座用 */
  signals: string[];
  /** 对应的迁移文档 */
  guide: LinkItem;
  /** 配图标题，一句话说这张图讲什么 */
  visualCaption: string;
  visual: ChapterVisual;
  ask: Ask;
}

export interface CoexistStep {
  title: string;
  body: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** 完整对比页里的一行：只有夜莺和这一个对手两列 */
export interface DetailRow {
  label: string;
  us: CapabilityCell;
  them: CapabilityCell;
}

/**
 * 单个对手的完整对比页（/comparisons/<slug>）。hub 上的 Verdict 是它的摘要，
 * 两者靠 verdictId 对上；页面把 Verdict 的立场、配图和问答，与这里的
 * 结论、对照表、迁移摘要、FAQ 拼成一页。每页至少一半内容在这里，
 * 否则搜索引擎会把它当成 hub 的薄复制。
 */
export interface ComparisonDetail {
  /** URL 段 */
  slug: string;
  verdictId: string;
  /** <title>，站点名由 Layout 追加 */
  metaTitle: string;
  metaDescription: string;
  /** H1 */
  heading: string;
  lead: string;
  /** 30 秒结论：谁该选谁 */
  tldr: { label: string; text: string }[];
  /** 对手列的列头；夜莺列头用 detailLabels.usColumn */
  themColumn: string;
  rows: DetailRow[];
  migration: {
    lead: string;
    fromLabel: string;
    toLabel: string;
    rows: { from: string; to: string }[];
    note: string;
  };
  faq: FaqItem[];
}

/** 完整对比页共用的小标题与按钮文案 */
export interface ComparisonDetailLabels {
  /** 面包屑里 hub 的名字 */
  hub: string;
  tldrTitle: string;
  tableTitle: string;
  usColumn: string;
  migrationTitle: string;
  faqTitle: string;
  othersTitle: string;
  guidesTitle: string;
}

export interface ComparisonsPage {
  /** 搜索结果里的整句 <title> 与描述（不再拼站点名后缀）。大标题是口号，不含用户的搜索词，所以分开写 */
  meta: PageMeta;
  /** 一句立场。可以用 \n 指定换行点，组件会渲染成 <br> */
  title: string;
  /** 大标题上方的一行小字，后面跟三个对手名（链到各自章节） */
  label: string;
  lead: string;
  /** Live Demo 按钮文案。地址来自 src/data/site.ts 的 DEMO_URL，留空则按钮不渲染 */
  demoLabel: string;
  install: LinkItem;
  matrixTitle: string;
  tableCaption: string;
  /** 第 0 项是夜莺，整列高亮 */
  products: string[];
  rows: CapabilityRow[];
  /** 图例与读屏文案 */
  levels: Record<CapabilityLevel, string>;
  /** 数据口径与免责声明，放表格下方一行小字 */
  matrixNote: string;
  /** 证明层：只放数字，star 数由构建时抓取的 stats.json 提供 */
  proof: StatItem[];
  theirWayLabel: string;
  ourWayLabel: string;
  theirsLabel: string;
  oursLabel: string;
  signalsLabel: string;
  guideLabel: string;
  /** 问答里"你 / 夜莺 AI"两个说话人的标签 */
  askYou: string;
  askAi: string;
  verdicts: Verdict[];
  /** 章节末尾「阅读完整对比」 */
  readMoreLabel: string;
  detailLabels: ComparisonDetailLabels;
  details: ComparisonDetail[];
  ai: AiSection;
  coexist: {
    title: string;
    lead: string;
    steps: CoexistStep[];
    link: LinkItem;
  };
  faq: {
    title: string;
    items: FaqItem[];
  };
  closing: {
    title: string;
    lead: string;
  };
}

/** 内置集成模板的分类 id，与 scripts/integration-categories.mjs 的 CATEGORY_ORDER 一致 */
export type IntegrationCategoryId =
  | 'host'
  | 'database'
  | 'mq'
  | 'web'
  | 'cloud-native'
  | 'cloud'
  | 'network'
  | 'devops'
  | 'other';

/** 数据源按查询语言分三类，卡片上用 badge 标出来 */
export type DataSourceKind = 'metrics' | 'logs' | 'sql';

export interface DataSourceCard {
  name: string;
  logo: string;
  kind: DataSourceKind;
  href: string;
}

export interface CollectorCard {
  name: string;
  body: string;
  link: LinkItem;
  recommended?: boolean;
}

/** 单复数两种写法，{n} 换成数字；中文两个写一样 */
export type Plural = [one: string, other: string];

export interface IntegrationsPage {
  /** 搜索结果里的整句 <title> 与描述（不再拼站点名后缀）。大标题是口号，不含用户的搜索词，所以分开写 */
  meta: PageMeta;
  title: string;
  lead: string;
  /** hero 数字条的标签；模板数和数据源数由数据算出，通知媒介数按产品口径写死 */
  counts: { templates: string; sources: string; channels: string; channelsValue: string };
  search: {
    placeholder: string;
    hint: string;
    clear: string;
    emptyTitle: string;
    emptyBody: string;
    emptyIssue: LinkItem;
    emptyContribute: LinkItem;
  };
  jump: { templates: string; sources: string; channels: string; collectors: string };
  templates: {
    label: string;
    title: string;
    lead: string;
    all: string;
    categories: Record<IntegrationCategoryId, string>;
    badges: { dashboards: Plural; alerts: Plural; collect: string; metrics: string };
    /** README 只有一种语言时卡片角标的写法 */
    readmeOnly: { zh: string; en: string };
    /** 「全部」默认只露最常用的四行，底下这个按钮展开成完整列表；{n} 是模板总数 */
    showAll: string;
    showLess: string;
    sourceLink: LinkItem;
  };
  sources: {
    label: string;
    title: string;
    lead: string;
    kinds: Record<DataSourceKind, string>;
    items: DataSourceCard[];
  };
  channels: {
    label: string;
    title: string;
    lead: string;
    link: LinkItem;
  };
  collectors: {
    label: string;
    title: string;
    lead: string;
    recommendedTag: string;
    items: CollectorCard[];
  };
  notFound: {
    title: string;
    body: string;
    links: LinkItem[];
  };
}

export interface DownloadMethod {
  title: string;
  note: string;
  lines?: string[];
  after?: string;
  link?: LinkItem;
}

export type InstallPathId = 'try' | 'production' | 'edge' | 'offline';
export type PlatformId = 'linux-amd64' | 'linux-arm64' | 'docker' | 'kubernetes';

/**
 * 下载页。版本号、直链、大小、校验值一律来自构建时抓取的 src/data/releases.json，
 * 文案里的命令用 {tag} {version} {url} {name} {checksums} 占位，组件渲染时替换。
 */
export interface DownloadPage {
  /** 搜索结果里的整句 <title> 与描述（不再拼站点名后缀）。大标题是口号，不含用户的搜索词，所以分开写 */
  meta: PageMeta;
  /** 大标题，可用 \n 指定换行点 */
  title: string;
  lead: string;
  releasedLabel: string;
  notesLabel: string;
  chooserTitle: string;
  recommendedLabel: string;
  /** 第一层分流：先选"要干什么"，第 0 项是推荐路径 */
  paths: { id: InstallPathId; title: string; body: string }[];
  copyLabel: string;
  copiedLabel: string;
  downloadLabel: string;
  sha256Label: string;
  tryPath: {
    intro: string;
    lines: string[];
    afterTitle: string;
    after: string[];
    variantsTitle: string;
    variants: { dir: string; body: string }[];
    link: LinkItem;
  };
  production: {
    prereq: string;
    platforms: { id: PlatformId; label: string }[];
    linux: { intro: string; lines: string[]; expected: string; link: LinkItem };
    docker: { intro: string; lines: string[]; note: string; link: LinkItem };
    kubernetes: { intro: string; lines: string[]; expected: string; note: string; link: LinkItem };
  };
  edge: { intro: string; lines: string[]; warning: string; link: LinkItem };
  offline: { intro: string; items: string[]; lines: string[]; link: LinkItem };
  categraf: {
    title: string;
    intro: string;
    osLabels: Record<string, string>;
    columns: string[];
    /** 精简版、带 DCGM 插件等少数人要的构建不上表，一句话指向发布页 */
    moreNote: string;
    moreLink: LinkItem;
    after: string;
    links: LinkItem[];
  };
  upgrade: { title: string; body: string; links: LinkItem[] };
  help: { title: string; body: string; links: LinkItem[]; archive: LinkItem };
}

/**
 * Categraf 独立页。
 * 建这一页是因为 categraf 仓库 README 只有中文，英文站不该把读者丢过去。
 * 中文站的入口仍然直达 GitHub —— 那边的中文内容对中文读者本来就合适。
 */
export interface CategrafPage {
  /** 搜索结果里的整句 <title> 与描述（不再拼站点名后缀）。大标题是口号，不含用户的搜索词，所以分开写 */
  meta: PageMeta;
  title: string;
  lead: string;
  facts: StatItem[];
  runTitle: string;
  /** 安装与运行，复用下载页的版式 */
  methods: DownloadMethod[];
  pluginsTitle: string;
  pluginsBody: string;
  pluginGroups: { label: string; items: string[] }[];
  notes: { title: string; body: string; link: LinkItem }[];
}

/**
 * 文档首页（/docs）。
 *
 * 结构来自调研文档 §6.1 / §16.5：一屏完成分流，不做营销长页。
 * 卡片的第一人称写法是刻意的——读者到文档站时脑子里是一句话
 * （“告警怎么发不出去”），不是一个功能名（“通知规则”）。
 */

/** 分流卡片：ask 是读者心里那句话，goal 是它通向哪里。 */
export interface DocsTask {
  ask: string;
  goal: string;
  href: string;
}

/**
 * 一组分流卡片。分组不是"三个一行好看"，而是产品自己的三段：
 * 接进来判定 → 减噪送出去 → 长期运行。eyebrow 用拉丁大写，与首页各区块同一套。
 */
export interface DocsBand {
  eyebrow: string;
  label: string;
  /** 对应首页管线的阶段，决定左侧脊柱这一段的颜色（与首页 Pipeline 同一套语义） */
  stage: Stage;
  tasks: DocsTask[];
}

export interface DocsHomePage {
  eyebrow: string;
  title: string;
  lead: string;
  /** 搜索框的无障碍标签；占位符由 searchHints 轮播 */
  searchLabel: string;
  /**
   * 占位符轮播用的真实提问（§16.5：用真实查询示例，而不是"搜索文档…"）。
   * 第一条会在服务端渲染出来，注水前后不会闪。
   */
  searchHints: string[];
  ctaPrimary: LinkItem;
  /** Live demo 按钮文案；地址来自 src/data/site.ts 的 DEMO_URL，留空则不渲染 */
  demoLabel: string;
  bands: DocsBand[];
  referenceEyebrow: string;
  referenceTitle: string;
  references: LinkItem[];
  helpEyebrow: string;
  help: LinkItem[];
}

/**
 * 占位页提示（尚未撰写的文档页）。
 * 文案的原则：说清"没写"、说清"将会写什么"、说清"有问题去哪问"、说清"怎么帮忙写"。
 * 四件事缺一件，占位页就退化成调研 §15.3 说的那种"点不动的空壳"。
 */
export interface DocsPlanned {
  /** 状态标签，如「尚未撰写」 */
  badge: string;
  /** "本页将会讲："——后面接 front matter 的 description */
  scopeLead: string;
  askTitle: string;
  ask: LinkItem[];
  contributeTitle: string;
  contributeBody: string;
  contributeLabel: string;
}

export interface SiteCopy {
  hero: Hero;
  stats: Stats;
  pipeline: Pipeline;
  ai: HomeAi;
  integrations: IntegrationsSection;
  deploy: DeploySection;
  compare: CompareSection;
  trust: TrustSection;
  finalCta: FinalCta;
  comparisonsPage: ComparisonsPage;
  integrationsPage: IntegrationsPage;
  downloadPage: DownloadPage;
  categrafPage: CategrafPage;
  docsHome: DocsHomePage;
  docsPlanned: DocsPlanned;
}

/** 独立页面的 <title> 与 meta description */
export interface PageMeta {
  title: string;
  description: string;
}
