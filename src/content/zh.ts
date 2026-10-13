import type { SiteCopy } from './types';
import stats from '../data/stats.json';
import { figures } from '../data/figures';
import { SLACK_INVITE } from '../data/site';

/**
 * 站点文案（中文为 source of truth，方案 §4.2）。
 * 英文见 ./en.ts —— 一期为精选子集策略，区块结构与中文保持一致。
 */
export const zh: SiteCopy = {
  hero: {
    kicker: 'THE OPEN-SOURCE ALERTING EXPERT',
    demoLabel: '在线体验',
    demoNote: '无需注册',
    ctaPrimaryNote: '自托管部署',
    // 「夜莺监控」是中文搜索的品牌主词：H1 里保留「监控」二字，<title> 和首段写全称
    title: '开源监控告警专家',
    metaTitle: '夜莺监控 Nightingale (n9e)：开源监控告警引擎',
    metaDescription:
      '夜莺监控（Nightingale，n9e）是开源监控告警引擎：对接 Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse 等数据源，统一告警规则、降噪与分发，内置 AI 助手与 MCP Server。自托管，Apache-2.0。',
    lead: '夜莺监控（Nightingale，n9e）是一款开源告警引擎：接入你已有的 Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse 等 10+ 数据源，统一告警规则、降噪与分发。内置 AI 助手与 MCP Server，不用多部署一个进程。',
    ctaPrimary: { label: '5 分钟安装', href: '/docs/get-started/quick-start' },
    ctaSecondary: { label: 'GitHub', href: 'https://github.com/ccfos/nightingale' },
    installCaption: '本机跑一套完整环境',
    installLines: [
      'git clone https://github.com/ccfos/nightingale.git',
      'cd nightingale/docker/compose-bridge',
      'docker compose up -d',
    ],
    copy: '复制',
    copied: '已复制',
    shotAlt: '夜莺监控仪表盘',
    // 卡片里的字段与写法取自产品真实界面
    alert: {
      severity: 'S1',
      rule: 'CPU 使用率持续高于 90%',
      labels: ['__name__=cpu_usage_idle', 'ident=n9e-demo-01', 'busigroup=DevOps'],
      firedAtLabel: '触发于',
      firedAt: '02:14:07',
      durationLabel: '已持续',
      duration: '14m',
    },
    notify: {
      label: '已送达',
      channels: [
        { name: '钉钉', logo: 'img/logos/dingtalk.png' },
        { name: '飞书', logo: 'img/logos/feishu.png' },
        { name: 'Slack', logo: 'img/logos/slack.png' },
      ],
    },
  },

  stats: {
    starsLabel: 'GitHub Stars',
    items: [
      { value: figures.datasourceTypes, label: '数据源类型' },
      { value: figures.notificationChannels, label: '通知媒介' },
      { value: figures.integrations, label: '内置集成模板' },
      { value: figures.mcpTools, label: 'MCP 工具' },
    ],
  },

  pipeline: {
    eyebrow: 'HOW IT WORKS',
    title: '从任意数据源，到有人收到通知',
    lead: '夜莺不接管你的存储，只做好告警这一层。下面是数据在夜莺里流转的四个阶段，每个阶段对应产品里一个真实的对象。',
    chainCaption: '数据在这里变成告警',
    steps: [
      {
        artifact: 'datasource',
        stage: 'config',
        title: '接入已有数据源',
        body: '数据不搬迁。把 Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse、Loki 接成数据源，夜莺在其上做告警分析。还没有采集？Categraf 一个 agent 覆盖操作系统、中间件与数据库，按 Prometheus Remote Write 协议直接写入。',
        points: [`${figures.datasourceTypes} 数据源类型，指标、日志、数据库统一接入`, `${figures.integrations} 个内置集成模板：采集配置、仪表盘、告警规则成套导入`],
        shot: 'img/step-connect.webp',
        shotSize: [1600, 784],
        shotAlt: '夜莺集成中心的组件模板列表',
      },
      {
        artifact: 'rule',
        stage: 'config',
        title: '统一告警规则',
        body: '指标、日志、SQL 类数据库用同一套规则体系，不必为每种数据源重学一遍配法。规则在页面上配、按业务组分权限，分 S1 / S2 / S3 三级。装完就带一批常用规则，不用从空白开始。',
        points: ['一条规则可同时作用于多个数据源', '页面或 API 配置规则，不用改 YAML 再 reload'],
        shot: 'img/step-alert.webp',
        shotSize: [1600, 680],
        shotAlt: '夜莺告警规则管理页面',
      },
      {
        artifact: 'event',
        stage: 'event',
        title: '降噪，然后分发',
        body: '告警风暴先在聚合视图里按业务组和级别收敛，再经屏蔽规则、订阅规则、事件 Pipeline 逐层过滤，最后按人按组送到 20 种通知媒介。需要自动处置就接 ibex 跑自愈脚本。',
        points: [
          '钉钉、飞书、企业微信、电话、短信、Slack 等 20 种内置媒介',
          '事件 Pipeline：聚合相似告警、改写标签、按条件路由',
        ],
        shot: 'img/step-automate.webp',
        shotSize: [1600, 654],
        shotAlt: '夜莺告警事件聚合视图',
      },
      {
        artifact: 'agent',
        stage: 'ai',
        title: '交给 AI 处理',
        body: 'v9 起，n9e 进程自身就是一个 MCP Server。Claude Code、Cursor 这类客户端直连 /mcp，用自然语言查告警、看指标、加屏蔽，不用再部署一个进程。',
        points: ['内置 Nightingale AI 助手与 Skills 市场', '权限跟着 token 走，RBAC 与该用户在页面上完全一致'],
        code: {
          filename: '~/.claude.json',
          language: 'json',
          content: `{
  "mcpServers": {
    "nightingale": {
      "type": "http",
      "url": "http://127.0.0.1:17000/mcp",
      "headers": { "X-User-Token": "<your-token>" }
    }
  }
}`,
        },
      },
    ],
  },

  mcp: {
    eyebrow: 'BUILT-IN MCP SERVER',
    title: `${figures.mcpTools} 个工具，零额外部署`,
    lead: 'MCP 端点内置在 n9e 进程里，不是又一个要运维的组件。每次工具调用都带着你的 token 落到夜莺自己的 HTTP API 上，所以客户端拿不到 token 主人看不到的东西。',
    figures: [
      { value: figures.mcpReadTools, label: '读工具' },
      { value: figures.mcpWriteTools, label: '写工具' },
      { value: figures.mcpToolsets, label: '工具集' },
    ],
    toolsetsLabel: '工具集',
    toolsets: [
      'alerts',
      'targets',
      'datasource',
      'mutes',
      'busi_groups',
      'notify_rules',
      'alert_subscribes',
      'event_pipelines',
      'users',
      'metrics',
      'logs',
      'dashboards',
      'roles',
    ],
    note: '写工具默认不注册，要在配置里显式打开。鉴权支持个人 Token 与 OAuth 2.1——夜莺可以自己做授权服务器（Claude、ChatGPT 这类托管客户端零预注册接入），也能作为资源服务器对接企业既有的 Keycloak、Entra ID、Okta。',
    terminal: {
      title: 'claude — nightingale via MCP',
      lines: [
        { kind: 'user', text: '昨晚有哪些 S1 告警还没恢复？' },
        { kind: 'tool', text: 'nightingale · get_alert_events', dim: 'severity=1 status=firing' },
        { kind: 'out', text: '3 条进行中，最久的是 mysql-prod 主从延迟 > 30s，已持续 2h14m' },
        { kind: 'user', text: 'mysql-prod 最近一小时的内存用量呢？' },
        { kind: 'tool', text: 'nightingale · query_metrics', dim: 'ident=mysql-prod range=1h' },
        { kind: 'out', text: '峰值 87.4%，当前 62.1%，没有触发内存类规则' },
        { kind: 'user', text: '把主从延迟这条屏蔽到明早 9 点，理由写"变更窗口"' },
        { kind: 'tool', text: 'nightingale · create_mute_rule', dim: 'scope=mysql-prod until=09:00' },
        { kind: 'out', text: '屏蔽规则 #1024 已创建，明日 09:00 自动失效', ok: true },
      ],
    },
  },

  integrations: {
    eyebrow: 'INTEGRATIONS',
    title: '长在你现有的技术栈上',
    lead: '夜莺不要求你换一套体系。数据源、采集器、通知媒介都对接现成的。',
    groups: [
      {
        label: 'DATA SOURCES',
        title: '数据源',
        items: [
          { name: 'Prometheus', logo: 'img/logos/prometheus.png' },
          { name: 'VictoriaMetrics', logo: 'img/logos/victoriametrics.png' },
          { name: 'ElasticSearch', logo: 'img/logos/elasticsearch.png' },
          { name: 'ClickHouse', logo: 'img/logos/ck.png' },
          { name: 'Loki', logo: 'img/logos/loki.png' },
          { name: 'VictoriaLogs', logo: 'img/logos/victorialogs.png' },
          { name: 'MySQL', logo: 'img/logos/mysql.png' },
          { name: 'PostgreSQL', logo: 'img/logos/pgsql.png' },
          { name: 'TDengine', logo: 'img/logos/tdengine.png' },
          { name: 'OpenSearch', logo: 'img/logos/opensearch.png' },
          { name: 'Doris', logo: 'img/logos/doris.png' },
          { name: 'IoTDB', logo: 'img/logos/iotdb.png' },
        ],
      },
      {
        label: 'NOTIFICATIONS',
        title: '通知媒介',
        items: [
          { name: '钉钉', logo: 'img/logos/dingtalk.png' },
          { name: '飞书', logo: 'img/logos/feishu.png' },
          { name: '企业微信', logo: 'img/logos/wecom.png' },
          { name: '电话 / 短信', icon: 'phone' },
          { name: '邮件', icon: 'email' },
          { name: 'Slack', logo: 'img/logos/slack.png' },
          { name: 'Telegram', logo: 'img/logos/telegram.png' },
          { name: 'Discord', logo: 'img/logos/discord.png' },
          { name: 'Mattermost', logo: 'img/logos/mattermost.png' },
          { name: 'PagerDuty', logo: 'img/logos/pagerduty.png' },
          { name: 'FlashDuty', logo: 'img/logos/flashduty.png' },
          { name: 'Jira', logo: 'img/logos/jira.png' },
        ],
      },
    ],
    more: { label: '查看全部集成', href: '/integrations' },
  },

  deploy: {
    eyebrow: 'DEPLOY',
    title: '按你的环境部署',
    cards: [
      {
        title: '自建',
        body: 'Apache-2.0 全功能开源。一条 compose 命令拉起，也支持二进制与 Helm。',
        code: 'docker compose up -d',
        link: { label: '下载与安装', href: '/download' },
      },
      {
        title: '边缘机房',
        body: '与中心网络不稳的机房部署 n9e-edge 作本地告警引擎：断网期间告警照常产生、照常通知。',
        code: 'n9e-edge --configs etc/edge',
        link: { label: '了解边缘架构', href: '/docs/operations/edge-partition' },
      },
    ],
  },

  compare: {
    eyebrow: 'COMPARISONS',
    title: '和你在用的比一比',
    lead: '各有所长。夜莺建议你继续用 Prometheus 或 VictoriaMetrics 存数据，把告警这层交给专家。',
    cards: [
      {
        title: 'vs Prometheus + Alertmanager',
        body: '同样的数据，规则在页面上配、有权限体系，通知媒介不用自己搭。',
        href: '/comparisons/prometheus-alertmanager',
      },
      { title: 'vs Zabbix', body: '不重做采集体系，接住你已有的时序库与日志库，云原生栈更顺手。', href: '/comparisons/zabbix' },
      { title: 'vs Grafana Alerting', body: 'Grafana 长于可视化，夜莺把力气全花在告警引擎与事件分发上。', href: '/comparisons/grafana-alerting' },
    ],
    more: { label: '看完整对比', href: '/comparisons' },
  },

  trust: {
    eyebrow: 'WHO USES NIGHTINGALE',
    title: '数千家企业的生产环境里跑着夜莺',
    lead: '互联网、金融、车企、制造、医疗——以下为部分授权展示的用户。',
    logoWall: 'img/user-logos.webp',
    logoWallSize: [1800, 1019],
    logoAlt: '夜莺用户企业 logo 墙',
    logoWallCrop: true,
  },

  finalCta: {
    title: '把告警这件事，交给专家',
    lead: '五分钟拉起一套夜莺，接上你的数据源，收到第一条告警。',
    primary: { label: '5 分钟安装', href: '/docs/get-started/quick-start' },
    secondary: { label: 'GitHub', href: 'https://github.com/ccfos/nightingale' },
    communityLabel: '社区',
    community: [
      { label: 'Slack #n9e', href: SLACK_INVITE },
      { label: 'GitHub Issues', href: 'https://github.com/ccfos/nightingale/issues' },
    ],
    wechat: '微信群加 picobyte，备注"夜莺互助群"',
  },

  /* ---------------- 子页面 ---------------- */

  comparisonsPage: {
    pageTitle: '产品对比',
    label: '夜莺 vs',
    title: '存储不用换，\n换掉的是告警这一层。',
    lead: 'Prometheus、Zabbix、Grafana 各有各的主场。夜莺只争一件事：告警这一层，该交给专门做告警的工具。',
    demoLabel: '在线体验',
    install: { label: '5 分钟安装', href: '/docs/get-started/quick-start' },
    matrixTitle: '一眼看完',
    tableCaption: '能力对比',
    products: ['夜莺 v9', 'Prometheus + Alertmanager', 'Zabbix', 'Grafana Alerting'],
    rows: [
      {
        label: '多数据源统一告警',
        cells: [
          { level: 'full', text: '指标 + 日志，10+ 类型' },
          { level: 'none', text: '仅 Prometheus 自身数据' },
          { level: 'none', text: '限于自有采集体系' },
          { level: 'partial', text: '按数据源插件支持' },
        ],
      },
      {
        label: '通知媒介',
        cells: [
          { level: 'full', text: '20 种内置，含电话短信' },
          { level: 'partial', text: '以 webhook 为主，需自建' },
          { level: 'partial', text: '媒介加脚本扩展' },
          { level: 'partial', text: '部分内置' },
        ],
      },
      {
        label: '屏蔽 / 订阅 / 事件 Pipeline',
        cells: [
          { level: 'full', text: '原生内置' },
          { level: 'partial', text: 'Silence 基础能力' },
          { level: 'partial', text: '维护期机制' },
          { level: 'partial', text: 'Silence 基础能力' },
        ],
      },
      {
        label: '页面配置规则与权限',
        cells: [
          { level: 'full', text: '业务组 RBAC' },
          { level: 'none', text: 'YAML + reload' },
          { level: 'full', text: '支持' },
          { level: 'full', text: '支持' },
        ],
      },
      {
        label: '内置 AI / MCP Server',
        cells: [
          { level: 'full', text: `${figures.mcpTools} 个工具，进程内置` },
          { level: 'none', text: '无' },
          { level: 'none', text: '无' },
          { level: 'partial', text: 'Assistant 仅 Cloud 版' },
        ],
      },
    ],
    levels: { full: '内置', partial: '部分支持或需扩展', none: '不支持' },
    matrixNote:
      '基于各项目 2026 年 8 月开源版本的公开能力，只作选型参考。我们尽量把对方的长处写清楚——选型建议不老实，社区口碑也就没了。',
    proof: [
      { value: figures.datasourceTypes, label: '数据源类型' },
      { value: figures.notificationChannels, label: '通知媒介' },
      { value: figures.mcpTools, label: 'MCP 工具' },
    ],
    theirWayLabel: '它的路子',
    ourWayLabel: '夜莺的路子',
    theirsLabel: '它擅长什么',
    oursLabel: '什么时候换夜莺',
    signalsLabel: '换的信号',
    guideLabel: '迁移文档',
    askYou: '你',
    askAi: '夜莺 AI',
    verdicts: [
      {
        id: 'prometheus',
        title: 'Prometheus + Alertmanager',
        theirWay: '规则写在 YAML 里，靠 GitOps 管。',
        ourWay: '规则配在页面上，按业务组分权限。',
        theirs:
          'Prometheus 依然是最好的时序底座之一，Alertmanager 的分组与静默模型设计得很干净。规模不大、团队习惯 GitOps、告警规则数量可控时，这套组合完全够用，而且不用多引入组件。',
        ours: '当告警规则要交给非 SRE 的业务团队维护、需要按业务组分权限、需要电话短信这类媒介，或者数据不只在 Prometheus 里的时候，夜莺更省事——它就是把这几件事做厚的。',
        signals: [
          '告警规则要交给非 SRE 的业务团队维护',
          '凌晨三点得有人接电话，webhook 叫不醒人',
          '数据已经不全在 Prometheus 里了',
        ],
        guide: { label: '从 Prometheus + Alertmanager 迁移', href: '/docs/migration/from-alertmanager' },
        visualCaption: '同一条规则，两种写法',
        visual: {
          kind: 'split',
          leftTitle: 'rules.yml + alertmanager.yml',
          code: [
            '- alert: MysqlReplicaLag',
            '  expr: mysql_slave_lag_seconds > 30',
            '  for: 5m',
            '  labels: { team: dba }',
            'route:',
            '  receiver: dba-webhook',
            '  group_by: [alertname]',
          ],
          rightTitle: '夜莺 · 告警规则',
          fields: [
            { label: '名称', value: 'MySQL 副本延迟' },
            { label: '条件', value: 'mysql_slave_lag_seconds > 30，持续 5m' },
            { label: '业务组', value: 'DBA' },
            { label: '通知', value: '电话、短信、钉钉' },
            { label: '谁能改', value: 'DBA 组' },
          ],
        },
        ask: {
          q: '一句话创建：mysql-prod 副本延迟超过 30 秒持续 5 分钟，电话通知 DBA 组',
          a: 'PromQL 和阈值已生成。业务组我不猜，请从下拉里选一个，选好就创建。',
        },
      },
      {
        id: 'zabbix',
        title: 'Zabbix',
        theirWay: '用自己的 agent 把数据采全，再在上面告警。',
        ourWay: '直接在你已有的存储上告警，没人采的地方才用 Categraf 补。',
        theirs:
          'Zabbix 二十多年的积累在传统 IT 一体化监控上非常成熟：网络设备、SNMP、agent 采集与自动发现是它的主场，企业里有大量现成经验和人力储备。',
        ours: '如果监控数据已经在 Prometheus、VictoriaMetrics、ES 这类云原生栈里，夜莺接得更直接，不需要把数据再倒进另一套采集体系。',
        signals: [
          '监控数据已经在 Prometheus、VictoriaMetrics 或 ES 里',
          'Kubernetes 和云上服务比网络设备多',
          '为了一条告警，维护着两套采集体系',
        ],
        guide: { label: '从 Zabbix 迁移', href: '/docs/migration/from-zabbix' },
        visualCaption: '没人采的地方，才用 Categraf 补',
        visual: {
          kind: 'wiring',
          sourcesLabel: '你已有的存储',
          sources: [
            { name: 'Prometheus', logo: 'img/logos/prometheus.png' },
            { name: 'VictoriaMetrics', logo: 'img/logos/victoriametrics.png' },
            { name: 'ElasticSearch', logo: 'img/logos/elasticsearch.png' },
            { name: 'ClickHouse', logo: 'img/logos/ck.png' },
          ],
          hub: '夜莺',
          hubNote: '就地读取，不搬数据',
          channelsLabel: '20 种通知媒介',
          channels: [
            { name: '电话 / 短信', icon: 'phone' },
            { name: '邮件', icon: 'email' },
            { name: '钉钉', logo: 'img/logos/dingtalk.png' },
            { name: '飞书', logo: 'img/logos/feishu.png' },
          ],
          channelsMore: '+16',
        },
        ask: {
          q: '这台主机为什么离线了？',
          a: 'agent 3 分钟没有上报，但主机能 ping 通，同网段其他主机正常。更像是 Categraf 进程退出了，不是主机宕机。',
        },
      },
      {
        id: 'grafana',
        title: 'Grafana Alerting',
        theirWay: '告警是可视化平台里的一个模块。',
        ourWay: '告警就是整个产品，图在哪看都行。',
        theirs:
          'Grafana 是可视化的事实标准，仪表盘生态无可替代。如果告警量不大、团队也已经在用 Grafana，它自带的告警足够顺手，少一个系统就少一份维护。',
        ours: '夜莺把力气全花在告警侧：事件 Pipeline、订阅与协同、告警自愈。两者并不冲突——很多用户用 Grafana 看图、用夜莺告警。',
        signals: [
          '告警量已经超出按面板配规则能管的范围',
          '需要事件 Pipeline、订阅或告警自愈',
          '值班的人要电话短信，不只是 contact point',
        ],
        guide: { label: '从 Grafana Alerting 迁移', href: '/docs/migration/from-grafana-alerting' },
        visualCaption: '图在 Grafana 看，告警在夜莺发',
        visual: {
          kind: 'embed',
          panelTitle: 'Grafana · MySQL 总览',
          panelNote: '按 URL 嵌进夜莺仪表盘的 Grafana 面板',
          event: {
            severity: 'S1',
            rule: 'MySQL 副本延迟 > 30s',
            labels: ['ident=mysql-prod', 'busigroup=DBA'],
            status: '已送达 · 电话 + 钉钉',
          },
        },
        ask: {
          q: '分析这个仪表盘',
          a: '40 个面板里有 3 个查询的指标已经不存在，2 个面板最近一小时趋势异常：connections 和 slow_queries。',
        },
      },
    ],
    readMoreLabel: '阅读完整对比',
    detailLabels: {
      hub: '产品对比',
      tldrTitle: '30 秒结论',
      tableTitle: '逐项对照',
      usColumn: '夜莺 v9',
      migrationTitle: '对象怎么对应',
      faqTitle: '关于这组对比的常见问题',
      othersTitle: '其他对比',
      guidesTitle: '迁移文档',
    },
    details: [
      {
        slug: 'prometheus-alertmanager',
        verdictId: 'prometheus',
        metaTitle: '夜莺监控 vs Prometheus + Alertmanager：告警层对比与迁移',
        metaDescription:
          '夜莺监控（Nightingale，n9e）与 Prometheus + Alertmanager 的告警能力对比：规则在哪配、降噪怎么做、通知媒介、权限、AI，以及 alertmanager.yml 如何对应到夜莺的对象。Prometheus 继续存数据，只换告警这一层。',
        heading: '夜莺 vs Prometheus + Alertmanager',
        lead: 'Prometheus 不用换，exporter 不用换，Grafana 面板不用换。Alertmanager 是这组对比里唯一真正被替掉的组件：规则从 YAML 挪到页面上，路由树拍平成通知规则，静默变成带业务组边界的屏蔽规则。',
        tldr: [
          {
            label: '继续用 Prometheus + Alertmanager，如果',
            text: '团队习惯 GitOps、规则数量能记在脑子里、告警通过 webhook 送进 PagerDuty 这类值班系统就够了。这套组合成熟、省组件，没有理由为换而换。',
          },
          {
            label: '换夜莺，如果',
            text: '规则要交给非 SRE 的业务团队在页面上维护，权限要按业务组划分，值班的人需要电话短信，或者数据已经不只在 Prometheus 里：日志在 ES、业务指标在 MySQL。',
          },
          {
            label: '两套并行，如果',
            text: '想先验证再决定。夜莺把 Prometheus 注册成数据源就能判定同一批规则，Alertmanager 继续发通知，按通知渠道逐个切换，任何一步都能在一分钟内回退。',
          },
        ],
        themColumn: 'Prometheus + Alertmanager',
        rows: [
          { label: '数据源', us: { level: 'full', text: '指标、日志、SQL，10+ 类型' }, them: { level: 'none', text: '只判定 Prometheus 自身的数据' } },
          { label: '规则在哪配', us: { level: 'full', text: '页面配置，按业务组归属，可整份导入 rules.yml' }, them: { level: 'none', text: 'YAML 文件 + reload，没有页面编辑' } },
          { label: '规则语法', us: { level: 'full', text: 'PromQL 不变，阈值写在表达式里' }, them: { level: 'full', text: 'PromQL' } },
          { label: '通知聚合', us: { level: 'none', text: '一次通知一个事件，不按标签合并成一条消息' }, them: { level: 'full', text: 'group_by / group_wait / group_interval' } },
          { label: '跨规则抑制', us: { level: 'partial', text: '同一规则多档阈值内置抑制；跨规则要用事件 Pipeline 改写' }, them: { level: 'full', text: 'inhibit_rules' } },
          { label: '静默 / 屏蔽', us: { level: 'full', text: '固定时间与周期时间，可只屏蔽通知保留事件，带业务组边界' }, them: { level: 'partial', text: '一次性 Silence；周期静默靠路由上的 mute_time_intervals' } },
          { label: '通知媒介', us: { level: 'full', text: '20 种内置，含电话、短信、钉钉、飞书、企业微信' }, them: { level: 'partial', text: '邮件、Slack、PagerDuty、Telegram、企业微信、webhook 等；电话、短信、钉钉、飞书要靠第三方' } },
          { label: '订阅与协同', us: { level: 'full', text: '订阅规则、超时抄送、事件 Pipeline 处理器' }, them: { level: 'none', text: '无' } },
          { label: '权限', us: { level: 'full', text: '用户、团队、业务组 RBAC' }, them: { level: 'none', text: '没有认证和权限模型' } },
          { label: '仪表盘', us: { level: 'partial', text: '内置仪表盘，可按 URL 嵌入 Grafana 面板' }, them: { level: 'none', text: '只有表达式浏览器，通常配 Grafana' } },
          { label: '告警自愈', us: { level: 'full', text: 'ibex 脚本执行' }, them: { level: 'none', text: '无' } },
          { label: 'AI / MCP', us: { level: 'full', text: `内置助手与 ${figures.mcpTools} 个 MCP 工具` }, them: { level: 'none', text: '无' } },
          { label: '许可证', us: { level: 'full', text: 'Apache-2.0' }, them: { level: 'full', text: 'Apache-2.0，CNCF 毕业项目' } },
        ],
        migration: {
          lead: '一份 rules.yml 加一份 alertmanager.yml，拆开后每一项落到哪里。完整的逐条对应、拍平路由树的方法和四个不对称之处，见迁移文档。',
          fromLabel: 'Prometheus / Alertmanager',
          toLabel: '夜莺',
          rows: [
            { from: 'rules.yml 里的告警规则', to: '告警规则，整份粘进「导入 Prometheus 告警规则」' },
            { from: '记录规则', to: '不动，继续由 Prometheus 计算' },
            { from: 'receivers[]', to: '通知媒介 + 通知规则里的通知配置' },
            { from: 'route 路由树', to: '拍平：每条从根到叶的路径 AND 成一份通知配置' },
            { from: 'group_by / group_wait / group_interval', to: '没有对应物，一次通知只装一个事件' },
            { from: 'inhibit_rules', to: '没有声明式对应物，用事件 Pipeline 的丢弃处理器改写' },
            { from: 'Silence', to: '屏蔽规则，必须属于一个业务组' },
            { from: 'Alertmanager 集群', to: '多个告警引擎实例按规则分片，不需要 gossip' },
          ],
          note: '两个最容易踩的坑：夜莺通知配置的「适用级别」一个都不勾等于谁都不匹配；事件缺少某个标签时，!= 和 !~ 也判为不匹配，而 Alertmanager 把缺失标签当空串。',
        },
        faq: [
          {
            q: '要替换 Prometheus 吗？',
            a: '不用。Prometheus 继续抓取和存储，夜莺把它注册成数据源，按周期发 instant query 做判定，数据不用搬。Thanos、Mimir、VictoriaMetrics 同样直接接。',
          },
          {
            q: 'alertmanager.yml 能自动转换吗？',
            a: '告警规则能：rules.yml 整份粘进「规则管理 → 导入 → 导入 Prometheus 告警规则」。路由、接收器和静默要按迁移文档逐条重建，因为夜莺是平铺的通知规则，不是路由树。',
          },
          {
            q: '夜莺能接收 Alertmanager 发出的 webhook 吗？',
            a: '不能。夜莺没有入站告警接口，只有指标写入口，所以不能把 Alertmanager 挂在前面当转发器过渡，规则只能在夜莺里重建。',
          },
          {
            q: 'Alertmanager 的告警分组在夜莺里怎么办？',
            a: '夜莺一次通知只装一个事件，不按标签把多条告警合并成一条消息。降噪靠规则层面的合并（一条规则覆盖查询返回的所有序列）、屏蔽规则和订阅规则。如果值班流程强依赖分组消息，这是切换前要先认下的差异。',
          },
          {
            q: '切换要停 Alertmanager 吗？',
            a: '最后一步才停。前面所有步骤里 Prometheus 和 Alertmanager 都正常运行：夜莺的规则先禁用导入，挑一个业务组做金丝雀，并行比对，最后从 rule_files 里摘掉告警规则，再停 Alertmanager。',
          },
        ],
      },
      {
        slug: 'zabbix',
        verdictId: 'zabbix',
        metaTitle: '夜莺监控 vs Zabbix：架构、告警与迁移成本对比',
        metaDescription:
          '夜莺监控（Nightingale，n9e）与 Zabbix 的对比：采集模型、数据存储、触发器与告警规则、通知媒介、权限、Kubernetes 与网络设备支持，以及从 Zabbix 迁移时哪些对象有对应物、哪些没有。',
        heading: '夜莺 vs Zabbix',
        lead: 'Zabbix 以主机和监控项为中心，自己采、自己存、自己告警；夜莺以查询为中心，在你已有的 Prometheus、VictoriaMetrics、ES 上判定，没人采的地方才用 Categraf 补。这不是同一类产品的优劣之争，而是两种架构各自适合不同的基础设施。',
        tldr: [
          {
            label: '继续用 Zabbix，如果',
            text: '监控对象以网络设备、SNMP、IPMI 为主，依赖自动发现和 LLD，团队有多年 Zabbix 经验。这些场景里 Zabbix 二十多年的积累，没有哪个开源替代品能完整覆盖。',
          },
          {
            label: '换夜莺，如果',
            text: '指标已经在 Prometheus 或 VictoriaMetrics 里，日志在 ES 或 Loki 里，Kubernetes 和云上服务比机房设备多，或者你正为了一条告警同时维护着 Zabbix Agent 和 exporter 两套采集。',
          },
          {
            label: '两套并行，如果',
            text: '想分批迁。Categraf 和 Zabbix Agent 可以装在同一台机器上，夜莺先只发到一个专用群，每天对一次两边的触发结果，Zabbix 全程不停。',
          },
        ],
        themColumn: 'Zabbix',
        rows: [
          { label: '采集模型', us: { level: 'partial', text: 'Categraf 或已有 exporter，按 Remote Write 推送' }, them: { level: 'full', text: 'Zabbix Agent / Agent2、SNMP、IPMI、JMX，自动发现与 LLD' } },
          { label: '数据存储', us: { level: 'full', text: '不自存，直接读 Prometheus、VictoriaMetrics、ES、ClickHouse；小规模可用内置时序库' }, them: { level: 'full', text: '自带 Server + MySQL / PostgreSQL / TimescaleDB' } },
          { label: '告警对象', us: { level: 'full', text: '一条规则覆盖查询返回的所有序列' }, them: { level: 'partial', text: '触发器逐主机生成，一个模板挂 1000 台就是 1000 组' } },
          { label: '规则语法', us: { level: 'full', text: 'PromQL / SQL / LogQL，随数据源' }, them: { level: 'full', text: '触发器表达式与函数库' } },
          { label: '严重级别', us: { level: 'partial', text: 'S1 / S2 / S3 三档' }, them: { level: 'full', text: '六档' } },
          { label: '触发器依赖', us: { level: 'partial', text: '没有声明式依赖，用事件 Pipeline 改写' }, them: { level: 'full', text: '触发器依赖、事件关联' } },
          { label: '维护期 / 屏蔽', us: { level: 'full', text: '固定与周期屏蔽，可只屏蔽通知保留事件' }, them: { level: 'full', text: '维护期' } },
          { label: '通知媒介', us: { level: 'full', text: '20 种内置，电话、短信、钉钉、飞书、企业微信开箱即用' }, them: { level: 'partial', text: '邮件、脚本和 webhook 媒介类型，国内 IM 多靠社区模板' } },
          { label: '升级阶梯', us: { level: 'partial', text: '订阅规则按持续时长超时抄送' }, them: { level: 'full', text: '多步骤 Escalation' } },
          { label: '权限', us: { level: 'full', text: '用户、团队、业务组 RBAC，业务组就是权限边界' }, them: { level: 'full', text: '用户组、角色、主机组权限' } },
          { label: 'Kubernetes', us: { level: 'full', text: '读 Prometheus 数据即可，Categraf 带 K8s 插件' }, them: { level: 'partial', text: '官方 Helm 与模板，需要部署它的 agent' } },
          { label: '网络设备 / SNMP', us: { level: 'partial', text: 'Categraf 有 SNMP 插件，没有自动发现' }, them: { level: 'full', text: '主场：SNMP、自动发现、网络设备模板' } },
          { label: '日志告警', us: { level: 'full', text: 'ES、OpenSearch、Loki、VictoriaLogs、ClickHouse' }, them: { level: 'partial', text: '日志监控项加正则，不是查询日志库' } },
          { label: 'AI / MCP', us: { level: 'full', text: `内置助手与 ${figures.mcpTools} 个 MCP 工具` }, them: { level: 'none', text: '无' } },
          { label: '许可证', us: { level: 'full', text: 'Apache-2.0' }, them: { level: 'partial', text: 'AGPL-3.0（7.0 起）' } },
        ],
        migration: {
          lead: 'Zabbix 的每类对象在夜莺里叫什么，哪些根本没有对应物。完整映射表和「全程 Zabbix 不停机」的重建顺序见迁移文档。',
          fromLabel: 'Zabbix',
          toLabel: '夜莺',
          rows: [
            { from: 'Zabbix Server', to: '夜莺 + 时序库（内置时序库默认开启，规模大了换外部时序库）' },
            { from: 'Zabbix Agent', to: 'Categraf，或已有 exporter；两者可同机并存' },
            { from: 'Host / Host group', to: '设备（ident）/ 业务组，业务组同时是权限边界' },
            { from: 'Template', to: `模板中心的组件，内置 ${figures.integrations} 个，导入是一次性拷贝` },
            { from: 'Item（监控项）', to: '没有对应物，采什么由采集器配置决定' },
            { from: 'Trigger', to: '告警规则，一条覆盖查询返回的所有对象' },
            { from: 'LLD 自动发现', to: '没有对应物，查询返回几条序列就是几个对象' },
            { from: 'Action + Media type', to: '通知规则 + 通知媒介 + 消息模板' },
            { from: 'Maintenance', to: '屏蔽规则' },
          ],
          note: '夜莺没有 Zabbix 模板或触发器的导入器，也读不了它的 XML / YAML。从 Zabbix 过来是重建而不是搬迁；好消息是工作量比想象的小：内置组件顶掉模板的大部分，一条规则顶掉一整组触发器。',
        },
        faq: [
          {
            q: '夜莺能直接读 Zabbix 的数据吗？',
            a: '不能。夜莺的数据源是 Prometheus、VictoriaMetrics、ES 这类查询后端，Zabbix 的 history / trends 表不在其中。历史数据留在 Zabbix 里当只读查询系统即可，不用搬。',
          },
          {
            q: 'Zabbix 的模板能导入夜莺吗？',
            a: `不能机械转换。夜莺模板中心内置 ${figures.integrations} 个组件，覆盖操作系统、数据库、中间件、Kubernetes，大部分 Zabbix 标准模板能找到对应的组件；自定义触发器要按归并方法逐条重写。`,
          },
          {
            q: '夜莺能监控交换机和路由器吗？',
            a: '能采，但不是主场。Categraf 有 SNMP 插件，可以按 OID 采集并在夜莺上告警，但没有 Zabbix 那样的网络设备自动发现和成熟模板库。网络设备为主的环境，建议 Zabbix 继续管设备，夜莺管云上和应用。',
          },
          {
            q: 'Zabbix 的六档严重性怎么对应？',
            a: '压到三档：Disaster 和 High 对 S1，Average 和 Warning 对 S2，Information 和 Not classified 对 S3。这一步有信息损失，并行期要按这个映射核对两边的级别。',
          },
          {
            q: '迁移期间 Zabbix 要停吗？',
            a: '全程不停。顺序是装 Categraf、定存储、导内置模板、翻译剩余触发器、建通知、搬维护期、并行比对，最后先停 Action 再停 Agent。回退只需把夜莺这批规则批量禁用。',
          },
        ],
      },
      {
        slug: 'grafana-alerting',
        verdictId: 'grafana',
        metaTitle: '夜莺监控 vs Grafana Alerting：告警能力对比与迁移',
        metaDescription:
          '夜莺监控（Nightingale，n9e）与 Grafana Alerting 的对比：规则模型、表达式链与 PromQL、通知策略与联系点、静默、无数据状态、电话短信、AI，以及仪表盘留在 Grafana、告警交给夜莺的搭配方式。',
        heading: '夜莺 vs Grafana Alerting',
        lead: 'Grafana 是可视化的事实标准，夜莺不打算取代它。要比的是告警这一层：Grafana 把告警做成可视化平台里的一个模块，夜莺把告警做成整个产品。很多团队的最终答案是两个都用：图在 Grafana 看，告警在夜莺发。',
        tldr: [
          {
            label: '继续用 Grafana Alerting，如果',
            text: '告警量不大、规则跟着面板走、联系点用 Slack 或 PagerDuty 就够，团队本来就在 Grafana 里，少一个系统就少一份维护。',
          },
          {
            label: '换夜莺，如果',
            text: '规则数量已经超出按面板管理的范围，需要事件 Pipeline、订阅、自愈，值班的人要电话短信，或者权限要按业务组划分，而不是按文件夹。',
          },
          {
            label: '两个都用，如果',
            text: '仪表盘资产多。Grafana 的数据源可以一键导入夜莺，仪表盘原样留着，夜莺的仪表盘还能按 URL 嵌入 Grafana 面板。',
          },
        ],
        themColumn: 'Grafana Alerting',
        rows: [
          { label: '数据源', us: { level: 'full', text: '10+ 类型，指标、日志、SQL' }, them: { level: 'full', text: '任何支持告警的 Grafana 数据源' } },
          { label: '规则表达式', us: { level: 'full', text: 'Prometheus 类把阈值写进 PromQL；日志与 SQL 类有独立触发条件' }, them: { level: 'full', text: '查询 + Reduce + Threshold 表达式链' } },
          { label: '规则归属与权限', us: { level: 'full', text: '业务组，同时是权限边界' }, them: { level: 'partial', text: '文件夹 + 组织角色；细粒度 RBAC 是企业版' } },
          { label: '无数据 / 执行错误', us: { level: 'partial', text: '日志与 SQL 类有无数据开关；Prometheus 类要单写规则' }, them: { level: 'full', text: 'NoData / Error 状态可配，支持 Keep last state' } },
          { label: '通知路由', us: { level: 'partial', text: '平铺的通知规则，各自匹配各自发' }, them: { level: 'full', text: '通知策略树，group_by、continue' } },
          { label: '通知媒介', us: { level: 'full', text: '20 种内置，含电话、短信' }, them: { level: 'partial', text: '联系点：Slack、Teams、PagerDuty、钉钉、企业微信等；电话短信要靠第三方' } },
          { label: '值班', us: { level: 'partial', text: '通知规则 + 订阅规则超时抄送' }, them: { level: 'none', text: 'OnCall 开源版已于 2026 年 3 月归档，值班在 Cloud 版' } },
          { label: '静默', us: { level: 'full', text: '固定与周期屏蔽，可只屏蔽通知' }, them: { level: 'full', text: 'Silence 与 Mute timing' } },
          { label: '跨规则抑制', us: { level: 'partial', text: '用事件 Pipeline 改写' }, them: { level: 'none', text: 'Grafana 托管告警不支持 inhibit' } },
          { label: '事件 Pipeline / 订阅 / 自愈', us: { level: 'full', text: '内置' }, them: { level: 'none', text: '无' } },
          { label: '仪表盘', us: { level: 'partial', text: '内置仪表盘，可嵌 Grafana 面板' }, them: { level: 'full', text: '事实标准' } },
          { label: 'AI', us: { level: 'full', text: `内置助手与 ${figures.mcpTools} 个 MCP 工具` }, them: { level: 'partial', text: 'Assistant 仅 Cloud 版；开源版靠 LLM 插件和独立的 MCP server' } },
          { label: '规则版本与 provisioning', us: { level: 'partial', text: '导出 JSON 进版本库' }, them: { level: 'full', text: '版本历史，文件 / API / Terraform provisioning' } },
          { label: '许可证', us: { level: 'full', text: 'Apache-2.0' }, them: { level: 'partial', text: 'AGPL-3.0' } },
        ],
        migration: {
          lead: 'Grafana 的统一告警拆成夜莺的对象后各自落在哪里。仪表盘、面板、变量一行不动。',
          fromLabel: 'Grafana',
          toLabel: '夜莺',
          rows: [
            { from: '数据源', to: '一键导入（集成中心 → 数据源 → 从 Grafana 导入），密钥要补填' },
            { from: 'Grafana-managed 告警规则', to: '重写：Reduce + Threshold 合成 PromQL' },
            { from: 'Data source-managed 规则', to: '就是 Prometheus ruler 规则，走 Alertmanager 那条路' },
            { from: '通知策略树', to: '拍平成通知规则' },
            { from: 'Contact point', to: '通知媒介 + 通知规则' },
            { from: 'Silence / Mute timing', to: '固定时间屏蔽 / 周期时间屏蔽或通知配置的适用时段' },
            { from: 'NoData / Error 状态', to: '日志与 SQL 类的无数据开关；Prometheus 类单写 up == 0' },
            { from: 'runbook_url', to: '规则上的预案链接' },
          ],
          note: '切换时在 Grafana 里把规则暂停而不是删除，要回退一秒就能回来。',
        },
        faq: [
          {
            q: '能继续用 Grafana 看图吗？',
            a: '能，这是最常见的搭配。夜莺读的是同一个 Prometheus 或 Loki，Grafana 面板不受影响；夜莺的仪表盘也能按 URL 嵌入 Grafana 面板。',
          },
          {
            q: 'Grafana 的告警规则能自动导入吗？',
            a: '规则不能，数据源能。「从 Grafana 导入」会把数据源拉成预览表，勾选后导入，密钥要补填；告警规则因为表达式链和 PromQL 的模型不同，要按迁移文档重写。',
          },
          {
            q: 'Grafana 的 No data 状态在夜莺里怎么处理？',
            a: '夜莺没有这个状态机。Prometheus 类规则里序列消失等于恢复，想在数据没了时告警，单写一条 up == 0；日志类和 SQL 类规则有「无数据」开关，带自己的级别和自动恢复超时。',
          },
          {
            q: '夜莺有电话和短信通知吗？',
            a: '有，内置媒介里包含电话和短信，属于开源版。Grafana 开源版的联系点没有电话短信，Grafana OnCall 开源版已于 2026 年 3 月归档，值班类能力在 Grafana Cloud。',
          },
          {
            q: '通知策略里的 group_by 怎么办？',
            a: '夜莺一次通知只装一个事件，不做标签聚合。如果值班流程依赖「一条消息里看到一组告警」，这是切换前要认下的差异；降噪改靠规则合并、屏蔽规则和订阅规则。',
          },
        ],
      },
    ],
    ai: {
      title: 'AI 是进程里的一部分，不是附加包',
      lead: '它读的是你的告警、规则和指标，答案来自数据而不是模型的记忆。改任何已有对象之前，先把差异给你看。',
      tabs: [
        {
          id: 'investigate',
          title: '排查',
          body: '从事件到规则、到规则查询、到邻居主机和屏蔽规则，一路拉完给出证据链。判断还是你的。',
          chatTitle: '夜莺 AI · 事件 #48213',
          chat: [
            { kind: 'context', text: '事件 #48213 · MySQL 副本延迟 > 30s · mysql-prod' },
            { kind: 'user', text: '分析这条告警的根因' },
            { kind: 'tool', text: '读取事件和它的规则', dim: 'get_alert_event · get_alert_rule' },
            { kind: 'tool', text: '在触发窗口内执行规则查询', dim: 'query_range · 14:00–14:20' },
            { kind: 'tool', text: '检查同主机其他告警和屏蔽规则', dim: 'ops-troubleshooting' },
            {
              kind: 'out',
              ok: true,
              text: '延迟从 14:02 起持续超过 30s。同一主机 disk_io_util 在 14:01 升到 96%，同时段还有 2 条磁盘告警。没有屏蔽规则生效。三条证据已列出，是否为根因由你判断。',
            },
          ],
        },
        {
          id: 'noise',
          title: '降噪',
          body: '哪些规则最吵、哪些一年没响过，一句话问出来。规律复发的那几条，顺手问它适不适合自愈。',
          chatTitle: '夜莺 AI · 新对话',
          chat: [
            { kind: 'user', text: '检查我的告警规则：过去 7 天哪些触发最多，哪些从来没触发过？' },
            { kind: 'tool', text: '聚合 7 天的事件', dim: 'query-alert-events' },
            { kind: 'tool', text: '对照规则列表', dim: 'list_alert_rules' },
            {
              kind: 'out',
              ok: true,
              text: '最吵的三条：cpu_idle < 10%（412 次）、pod_restart（198 次）、disk_free < 15%（131 次）。有 9 条从未触发，其中 4 条的数据源已经返回空。',
            },
            { kind: 'user', text: '这里面哪些适合做自愈？' },
            { kind: 'out', text: 'pod_restart 每周在同样三个 pod 上规律复发，机械到可以接一个 ibex 脚本。' },
          ],
        },
        {
          id: 'change',
          title: '改配置',
          body: '改已有对象分两步：先返回确认卡，你在下一轮确认才写入。提议 30 分钟过期、只能确认一次、对象被别人改过就拒绝。没有删除工具。',
          chatTitle: '夜莺 AI · 新对话',
          chat: [
            { kind: 'user', text: '把 MySQL 副本延迟这条规则的持续时间改成 5 分钟' },
            { kind: 'tool', text: '计算改动，暂不写入', dim: 'update_alert_rule · 提议' },
            {
              kind: 'confirm',
              title: '将修改告警规则 #1024',
              changes: [{ field: 'for', from: '1m', to: '5m' }],
              note: '30 分钟内有效，只能确认一次。规则被他人改动则拒绝。',
              confirmLabel: '确认',
              cancelLabel: '取消',
            },
            { kind: 'user', text: '确认' },
            { kind: 'out', ok: true, text: '已按暂存的提议应用。这一步模型没有再参与。' },
          ],
        },
      ],
      facts: [
        `${figures.mcpTools} 个 MCP 工具`,
        `${figures.mcpToolsets} 个工具集`,
        '没有删除工具',
        '权限随用户走',
        'OpenAI 兼容、Anthropic 或自托管模型',
        'Claude Code、Cursor 直连',
      ],
      rivalsLabel: '对手在这一层',
      rivals: [
        { name: 'Prometheus + Alertmanager', stance: '没有内置 AI' },
        { name: 'Zabbix', stance: '没有内置 AI' },
        { name: 'Grafana', stance: 'Assistant 仅 Cloud 版，开源版有独立的 MCP server 和 LLM 插件' },
      ],
    },

    coexist: {
      title: '不用停掉现在的系统',
      lead: '夜莺读的是你已有的存储，所以切换是两套并行跑，不是一刀切。',
      steps: [
        {
          title: '接上现有存储',
          body: '把 Prometheus、VictoriaMetrics 或 ES 注册成数据源。采集链路一行不改。',
        },
        {
          title: '把规则搬过来',
          body: '迁移文档把 alertmanager.yml 或 Grafana 告警规则的每一条对应到夜莺的对象上，没有等价物的也明说。',
        },
        {
          title: '两套并行，按通道切换',
          body: '每天对一次两边都触发了什么，通知渠道一个一个切，任何一步都能在一分钟内回退。',
        },
      ],
      link: { label: '并存与回滚方案', href: '/docs/migration/coexistence' },
    },
    faq: {
      title: '换之前大家常问的',
      items: [
        {
          q: '能继续用 Grafana 吗？',
          a: '能，而且这是最常见的搭配：Grafana 看图，夜莺告警。夜莺的仪表盘也能按 URL 直接嵌入 Grafana 面板。',
        },
        {
          q: '要替换 Prometheus 吗？',
          a: '不用。Prometheus 继续采集和存储，数据不用搬，夜莺在上面接管规则、降噪和分发。',
        },
        {
          q: 'Alertmanager 的规则能迁过来吗？',
          a: '规则、路由、静默、接收器各有对应的夜莺对象。迁移文档把 alertmanager.yml 逐条拆开对应，少数没有等价物的会明确列出。',
        },
        {
          q: '夜莺能直接读 Zabbix 的数据吗？',
          a: '不能。从 Zabbix 迁移是一次重建：主机对应 target，模板对应集成，触发器对应规则，采集换成 Categraf。迁移期间 Zabbix 不用停。',
        },
        {
          q: '什么情况下不该换？',
          a: '规模不大、团队习惯 GitOps、规则数量能记在脑子里，Prometheus + Alertmanager 就够了。以网络设备和 SNMP 为主的传统 IT 监控，Zabbix 仍然是主场。',
        },
      ],
    },
    closing: {
      title: '拿不准？两套一起跑。',
      lead: '夜莺读的是你现有的存储，装上不影响现在正在跑的告警。',
    },
  },

  integrationsPage: {
    title: '接上你已有的一切',
    lead: '数据源、采集器、通知媒介、内置模板——夜莺对接现成的东西，不要求你换体系。下面是全部清单，每一项都可以点进去看怎么接。',
    counts: { templates: '内置集成模板', sources: '数据源类型', channels: '通知媒介', channelsValue: figures.notificationChannels },
    search: {
      placeholder: '搜索集成：nginx、k8s、阿里云、证书……',
      hint: '聚焦搜索',
      clear: '清除',
      emptyTitle: '没有匹配的集成',
      emptyBody: '模板清单来自开源仓库，缺什么可以直接提，或者按规范自己写一个——每个模板就是一个目录。',
      emptyIssue: { label: '提 Issue 申请', href: 'https://github.com/ccfos/nightingale/issues/new/choose' },
      emptyContribute: { label: '按规范贡献一个', href: '/docs/reference/integration-schema' },
    },
    jump: { templates: '内置模板', sources: '数据源', channels: '通知媒介', collectors: '采集器' },
    templates: {
      label: 'BUILT-IN TEMPLATES',
      title: '内置集成模板',
      lead: '每个模板打包了 Categraf 采集配置、仪表盘和一组告警规则，在集成中心一键导入即可使用。卡片上的数字是这个模板实际带了多少东西，构建时从仓库统计，不是手写的。',
      all: '全部',
      categories: {
        host: '主机与硬件',
        database: '数据库与存储',
        mq: '消息队列',
        web: 'Web 与中间件',
        'cloud-native': '容器与云原生',
        cloud: '云厂商与 CDN',
        network: '网络与探测',
        devops: 'DevOps 与其他',
        other: '其他',
      },
      badges: {
        dashboards: ['{n} 仪表盘', '{n} 仪表盘'],
        alerts: ['{n} 组规则', '{n} 组规则'],
        collect: '采集配置',
        metrics: '指标说明',
      },
      readmeOnly: { zh: '仅中文', en: '仅英文' },
      showAll: '展开全部 {n} 个模板',
      showLess: '收起',
      sourceLink: { label: '在 GitHub 查看全部模板', href: 'https://github.com/ccfos/nightingale/tree/main/integrations' },
    },
    sources: {
      label: 'DATA SOURCES',
      title: '数据源',
      lead: '夜莺不要求你搬数据，接上你已经在用的。指标类走 PromQL，日志类走各自的查询语法，SQL 类直接写 SQL——三类都能配告警规则和仪表盘。',
      kinds: { metrics: '指标', logs: '日志', sql: 'SQL' },
      items: [
        { name: 'Prometheus', logo: 'img/logos/prometheus.png', kind: 'metrics', href: '/docs/data/prometheus' },
        { name: 'VictoriaMetrics', logo: 'img/logos/victoriametrics.png', kind: 'metrics', href: '/docs/data/victoriametrics' },
        { name: '内置 TSDB', logo: 'img/logo-mark.webp', kind: 'metrics', href: '/docs/data/embedded-tsdb' },
        { name: 'ElasticSearch', logo: 'img/logos/elasticsearch.png', kind: 'logs', href: '/docs/data/elasticsearch' },
        { name: 'OpenSearch', logo: 'img/logos/opensearch.png', kind: 'logs', href: '/docs/data/elasticsearch' },
        { name: 'Loki', logo: 'img/logos/loki.png', kind: 'logs', href: '/docs/data/loki-victorialogs' },
        { name: 'VictoriaLogs', logo: 'img/logos/victorialogs.png', kind: 'logs', href: '/docs/data/loki-victorialogs' },
        { name: 'ClickHouse', logo: 'img/logos/ck.png', kind: 'sql', href: '/docs/data/clickhouse-doris-iotdb' },
        { name: 'MySQL', logo: 'img/logos/mysql.png', kind: 'sql', href: '/docs/data/sql-databases' },
        { name: 'PostgreSQL', logo: 'img/logos/pgsql.png', kind: 'sql', href: '/docs/data/sql-databases' },
        { name: 'TDengine', logo: 'img/logos/tdengine.png', kind: 'sql', href: '/docs/data/sql-databases' },
        { name: 'Doris', logo: 'img/logos/doris.png', kind: 'sql', href: '/docs/data/clickhouse-doris-iotdb' },
        { name: 'IoTDB', logo: 'img/logos/iotdb.png', kind: 'sql', href: '/docs/data/clickhouse-doris-iotdb' },
      ],
    },
    channels: {
      label: 'NOTIFICATIONS',
      title: '通知媒介',
      lead: '钉钉、企业微信、飞书、邮件、电话短信开箱即用；Slack、Telegram、Discord、PagerDuty、Jira 这些有内置消息模板，建一个媒介就能发；剩下的走 Webhook 自定义 body。',
      link: { label: '通知媒介文档', href: '/docs/notifications/overview' },
    },
    collectors: {
      label: 'COLLECTORS',
      title: '数据怎么进来',
      lead: '夜莺自身不做数据采集。上面的模板默认按 Categraf 写，但只要能写 Prometheus Remote Write 的采集器都能接。',
      recommendedTag: '推荐',
      items: [
        {
          name: 'Categraf',
          body: '一个 agent 覆盖操作系统、中间件、数据库与云厂商，内置模板的采集配置都是给它写的。',
          link: { label: 'Categraf 文档', href: '/docs/data/categraf' },
          recommended: true,
        },
        {
          name: 'Telegraf / Datadog Agent',
          body: '已经在跑的不用换，把输出指到夜莺的 Remote Write 地址即可。',
          link: { label: '采集器接入', href: '/docs/data/integrations/collector-config' },
        },
        {
          name: '各类 Exporter',
          body: 'node_exporter、mysqld_exporter 这些 Prometheus 生态的 exporter 由 Categraf 或 Prometheus 抓取后写入。',
          link: { label: '采集配置说明', href: '/docs/data/integrations/collector-config' },
        },
        {
          name: 'Remote Write 直写',
          body: '自研程序或 OpenTelemetry Collector 直接向 /prometheus/v1/write 推送。',
          link: { label: '验证数据到达', href: '/docs/data/integrations/verify' },
        },
      ],
    },
    notFound: {
      title: '没找到你要的？',
      body: '模板清单来自开源仓库，每个模板就是一个目录：图标、采集配置、仪表盘、告警规则。缺什么可以提 Issue，也可以按规范自己写一个提 PR。',
      links: [
        { label: '提 Issue 申请', href: 'https://github.com/ccfos/nightingale/issues/new/choose' },
        { label: '模板规范', href: '/docs/reference/integration-schema' },
      ],
    },
  },

  downloadPage: {
    pageTitle: '下载与安装',
    title: '五分钟装起来，\n或者按生产的要求部署。',
    lead: '这里的每个包都来自打了标签的正式发布，发布在 GitHub 上。先说你要做什么，页面只给这条路上用得到的命令。',
    releasedLabel: '发布于',
    notesLabel: '发布说明',
    chooserTitle: '你要做什么',
    recommendedLabel: '推荐',
    paths: [
      { id: 'try', title: '先试试', body: 'Docker Compose 一并拉起 n9e、数据库和采集器。' },
      { id: 'production', title: '上生产', body: '二进制、Docker 镜像或 Helm，接你自己的数据库和 Redis。' },
      { id: 'edge', title: '边缘机房', body: '到中心的链路不稳时，在本地跑 n9e-edge 做告警引擎。' },
      { id: 'offline', title: '离线环境', body: '机器不能上网时，提前要准备哪些包。' },
    ],
    copyLabel: '复制',
    copiedLabel: '已复制',
    downloadLabel: '下载',
    sha256Label: 'SHA256',
    tryPath: {
      intro: '五个容器：n9e、MySQL、Redis、VictoriaMetrics，以及采集本机的 Categraf。',
      lines: ['git clone https://github.com/ccfos/nightingale.git', 'cd nightingale/docker/compose-bridge', 'docker compose up -d'],
      afterTitle: '起来之后',
      after: [
        'docker compose ps 能看到五个容器在运行',
        '打开 http://localhost:17000，用 root / root.2020 登录',
        '自带的 Categraf 已经把本机上报上来，机器列表里能看到它',
      ],
      variantsTitle: '同一目录下的其他组合',
      variants: [
        { dir: 'compose-postgres', body: '把 MySQL 换成 PostgreSQL 12' },
        { dir: 'compose-host-network', body: '存储换成 Prometheus，host 网络，仅 Linux' },
        { dir: 'compose-host-network-metric-log', body: '再加 Kafka、Elasticsearch、Logstash 跑日志，仅 Linux' },
      ],
      link: { label: 'Docker Compose 部署文档', href: '/docs/install/docker-compose' },
    },
    production: {
      prereq: '需要一个元数据库，MySQL 8 或 PostgreSQL 12 及以上，外加 Redis。SQLite 只用于测试。',
      platforms: [
        { id: 'linux-amd64', label: 'Linux amd64' },
        { id: 'linux-arm64', label: 'Linux arm64' },
        { id: 'docker', label: 'Docker' },
        { id: 'kubernetes', label: 'Kubernetes' },
      ],
      linux: {
        intro: '一个包里有 n9e、n9e-edge、集成模板和一份 Categraf。包没有顶层目录，先建好目录再解压进去。',
        lines: [
          'curl -LO {url}',
          'curl -LO {checksums}',
          'sha256sum -c checksums.txt --ignore-missing',
          'mkdir -p /opt/n9e && tar zxf {name} -C /opt/n9e',
          'cd /opt/n9e && ./n9e',
        ],
        expected: '日志出现 http server listening on: 0.0.0.0:17000。默认跑在 SQLite 和内置存储上，往下走之前先把 etc/config.toml 指向你的数据库和 Redis。',
        link: { label: '二进制安装文档：systemd、配置、数据库', href: '/docs/install/binary' },
      },
      docker: {
        intro: '镜像只跑 n9e 进程。挂一个配置目录进去，里面的 config.toml 指向你的数据库和 Redis。',
        lines: [
          'docker pull flashcatcloud/nightingale:{version}',
          'docker run -d --name nightingale -p 17000:17000 -p 20090:20090 -v /opt/n9e/etc:/app/etc flashcatcloud/nightingale:{version}',
        ],
        note: '17000 是页面和 API，20090 是自愈用的 ibex RPC 端口。配置目录结构和二进制包一样。',
        link: { label: '配置目录说明', href: '/docs/install/configuration' },
      },
      kubernetes: {
        intro: '社区维护的 chart，带 MySQL、Redis、Prometheus 和 Categraf。Helm 仓库里目前只有 v8 的包，装 v9 请 clone 下来本地安装。',
        lines: ['git clone https://github.com/flashcatcloud/n9e-helm.git', 'helm install nightingale ./n9e-helm -n n9e --create-namespace'],
        expected: 'kubectl get pod -n n9e 能看到 nginx、数据库、redis、prometheus、n9e、categraf 都是 Running。',
        note: '要接集群外的数据库，在 values 里设 database.external 和 redis.external。',
        link: { label: 'Helm 部署文档', href: '/docs/install/helm' },
      },
    },
    edge: {
      intro: 'n9e-edge 就在 n9e 的 Linux 包里。它在本地评估规则，网络分区时告警照样发出去。',
      lines: ['n9e-edge --configs etc/edge'],
      warning: '参数要传 etc/edge，不是 etc。默认值会加载中心的配置，路由错了也不报错。edge 还需要自己单独的 Redis。',
      link: { label: '边缘机房部署文档', href: '/docs/install/edge' },
    },
    offline: {
      intro: '在能上网的机器上把这些取好再拷过去。Linux 包里已经带了集成模板、内置仪表盘和一份 Categraf。',
      items: ['对应架构的 Linux 包，从上面「上生产」那条路径下载', '容器镜像，如果你用 Docker 或 Helm 部署'],
      lines: [
        'docker pull flashcatcloud/nightingale:{version}',
        'docker pull flashcatcloud/categraf:latest',
        'docker save flashcatcloud/nightingale:{version} flashcatcloud/categraf:latest -o n9e-images.tar',
      ],
      link: { label: '离线部署文档', href: '/docs/install/offline' },
    },
    categraf: {
      title: '采集器 Categraf',
      intro: '一台主机一个 agent，覆盖操作系统、中间件、数据库和 Kubernetes，用 Prometheus Remote Write 写入。哪里的数据要让夜莺看到，就装在哪里。',
      osLabels: { linux: 'Linux', windows: 'Windows' },
      columns: ['平台', '大小', 'SHA256', ''],
      moreNote: '只采指标的精简版，以及带 NVIDIA DCGM 插件的构建，在发布页上。',
      moreLink: { label: 'Categraf 全部构建', href: 'https://github.com/flashcatcloud/categraf/releases/latest' },
      after: '把 config.toml 里的地址指向夜莺，一分钟内这台机器就出现在机器列表里。',
      links: [
        { label: 'Categraf 介绍', href: '/categraf' },
        { label: 'Categraf 文档', href: '/docs/data/categraf' },
      ],
    },
    upgrade: {
      title: '升级与回滚',
      body: '小版本之间直接换二进制。v8 升 v9 先备份数据库，读发布说明里的表结构变更；迁移在首次启动时执行。',
      links: [
        { label: '升级文档', href: '/docs/install/upgrade' },
        { label: '回滚', href: '/docs/install/rollback' },
        { label: 'v8 升 v9', href: '/docs/migration/v8-to-v9' },
      ],
    },
    help: {
      title: '卡住了？',
      body: '社区在 Slack 和 GitHub Issues 上答疑。',
      links: [
        { label: 'Slack #n9e', href: SLACK_INVITE },
        { label: 'GitHub Issues', href: 'https://github.com/ccfos/nightingale/issues' },
      ],
      archive: { label: 'GitHub 上的全部版本', href: 'https://github.com/ccfos/nightingale/releases' },
    },
  },

  categrafPage: {
    title: 'Categraf',
    lead: '夜莺在你已有的数据上做告警分析，Categraf 负责把数据送进来：一个 agent 覆盖操作系统、中间件、数据库、网络设备与 Kubernetes，按 Prometheus Remote Write 协议推送。MIT 协议开源，与夜莺出自同一个团队。',
    facts: [
      { value: '100+', label: '采集插件' },
      { value: 'MIT', label: '开源协议' },
      { value: '1', label: '每台机器一个 agent' },
    ],
    runTitle: '安装与运行',
    methods: [
      {
        title: '下载发布版',
        note: '发布包按平台分开，且已经把 conf 目录打进去了，解压即可运行。Linux 提供 amd64 与 arm64，Windows 为 zip 包。默认构建之外还有两个变体：-with-cgo-plugin 额外带 NVIDIA DCGM 采集，categraf-slim 只保留指标采集。',
        lines: [
          'tar xzf categraf-v<版本号>-linux-amd64.tar.gz',
          'cd categraf-v<版本号>-linux-amd64',
        ],
        after: '版本号是文件名的一部分，因此没有固定的 latest 下载地址，需要到发布页挑对应构建。',
        link: { label: 'GitHub Releases', href: 'https://github.com/flashcatcloud/categraf/releases' },
      },
      {
        title: 'Docker',
        note: '镜像里二进制在 /usr/bin/categraf，示例配置在 /etc/categraf/conf。设置 N9E_HOST 后，entrypoint 会自动改写 config.toml 里的服务端地址；需要更多定制时再挂载自己的 conf 目录。',
        lines: [
          'docker pull flashcatcloud/categraf:latest',
          'docker run -d --name categraf -e N9E_HOST=192.168.1.10:17000 flashcatcloud/categraf:latest',
        ],
      },
      {
        title: '从源码编译',
        note: '需要 Go 1.25 及以上。打包时把二进制和 conf 一起打，agent 才有配套的示例配置。',
        lines: ['go build', 'tar zcvf categraf.tar.gz categraf conf'],
        after: 'macOS 上要用 gnu-tar（gtar）：系统自带的 bsdtar 打出来的包 Categraf 会加载失败。',
      },
      {
        title: '先看采到什么，再决定写入哪里',
        note: 'test 模式把采集结果直接打到标准输出，可以在接服务端之前先确认插件是否正常。',
        lines: ['./categraf --test', './categraf --test --inputs system:mem'],
      },
      {
        title: '运行',
        note: '配置都在 conf 目录：config.toml 管 agent 自身，每个采集器一个 input.<插件名> 目录。用 --inputs 可以只跑指定插件。',
        lines: [
          './categraf',
          './categraf --configs /path/to/conf-directory',
          './categraf --inputs system:mem',
        ],
        after: '接入夜莺、给主机打标签、没数据时怎么查，文档里有逐步的说明。',
        link: { label: 'Categraf 使用文档', href: '/docs/data/categraf' },
      },
      {
        title: 'Kubernetes',
        note: 'DaemonSet 采节点与 cAdvisor 指标，Deployment 采 apiserver、CoreDNS 这类集群级目标，sidecar 采单个服务。三份编排文件仓库里都有。',
        lines: [
          'kubectl apply -n monitoring -f k8s/daemonset.yaml',
          'kubectl apply -n monitoring -f k8s/deployment.yaml',
          'kubectl apply -n monitoring -f k8s/sidecar.yaml',
        ],
      },
    ],
    pluginsTitle: '能采什么',
    pluginsBody: '每个插件是 inputs/ 下的一个目录，各自带一份示例配置。以下为部分：',
    pluginGroups: [
      {
        label: '操作系统',
        items: ['cpu', 'mem', 'disk', 'diskio', 'net', 'netstat', 'processes', 'procstat', 'system', 'kernel', 'systemd', 'ntp'],
      },
      {
        label: '数据库',
        items: ['mysql', 'postgresql', 'oracle', 'sqlserver', 'mongodb', 'redis', 'clickhouse', 'elasticsearch', 'greenplum', 'cassandra'],
      },
      {
        label: '中间件',
        items: ['kafka', 'rabbitmq', 'nats', 'nsq', 'activemq', 'zookeeper', 'consul', 'ldap'],
      },
      {
        label: 'Web 与应用服务器',
        items: ['nginx', 'apache', 'tomcat', 'jboss', 'weblogic', 'phpfpm', 'haproxy', 'tengine', 'jenkins', 'logstash'],
      },
      {
        label: '容器与 Kubernetes',
        items: ['docker', 'cadvisor', 'kubernetes', 'kubelet', 'kube_state_metrics', 'kube_proxy'],
      },
      {
        label: '网络设备与硬件',
        items: ['snmp', 'snmp_trap', 'switch_legacy', 'ipmi', 'redfish', 'smart', 'modbus', 'gnmi', 'vsphere'],
      },
      { label: 'GPU', items: ['nvidia_smi', 'dcgm', 'amd_rocm_smi', 'hy_smi'] },
      { label: '云', items: ['aliyun', 'cloudwatch', 'googlecloud', 'appdynamics'] },
      {
        label: '拨测',
        items: ['ping', 'http_response', 'net_response', 'dns_query', 'x509_cert', 'whois'],
      },
      { label: '通用', items: ['exec', 'prometheus', 'node_exporter', 'mtail', 'tpl'] },
    ],
    notes: [
      {
        title: '数据推到哪里',
        body: 'Categraf 走 Prometheus Remote Write 协议推送，因此可以写入夜莺、Prometheus、VictoriaMetrics 等任何支持该协议的后端。PUSH 意味着由 agent 主动建立连接——在网络策略不允许中心端反向访问各网段时，这一点很关键。',
        link: { label: '接成夜莺的数据源', href: '/integrations' },
      },
      {
        title: '并非唯一选择',
        body: '夜莺不绑定 Categraf。Telegraf、Datadog Agent 以及标准的 Prometheus exporter 都以同样方式写入；已经在抓取目标的 Prometheus 也可以原样保留。',
        link: { label: 'Categraf 源码与发布', href: 'https://github.com/flashcatcloud/categraf' },
      },
    ],
  },
  docsHome: {
    eyebrow: 'NIGHTINGALE DOCS',
    title: '夜莺文档',
    lead: '把已经在跑的 Prometheus、日志库和数据库接进来，配好规则、降噪、路由和通知——每一步怎么做，这里都写着。',
    searchLabel: '搜索文档',
    // 占位符用真实提问而不是"搜索文档…"（调研 §16.5）：
    // 头五秒就让人知道这套文档回答的是什么粒度的问题。
    searchHints: [
      '告警规则为什么没有触发',
      'Prometheus 数据源连接失败',
      '钉钉模板里能用哪些变量',
      'n9e-edge 断网之后还会告警吗',
      'MCP 的写工具没有出现',
      'v8 升级 v9 要注意什么',
    ],
    ctaPrimary: { label: '5 分钟拉起夜莺', href: '/docs/get-started/quick-start' },
    demoLabel: '在线体验',
    bands: [
      {
        eyebrow: 'CONNECT',
        stage: 'config',
        label: '把数据接进来，让规则跑起来',
        tasks: [
          {
            ask: '我已经有监控数据',
            goal: '接上 Prometheus、ES、ClickHouse，在原地查询',
            href: '/docs/data/overview',
          },
          {
            ask: '我还没有开始采集',
            goal: 'Categraf：一个 agent，100+ 插件',
            href: '/docs/get-started/choose-your-path/categraf',
          },
          {
            ask: '我要写第一条告警规则',
            goal: '规则、级别、业务组与测试触发',
            href: '/docs/alerting/overview',
          },
        ],
      },
      {
        eyebrow: 'DELIVER',
        stage: 'event',
        label: '把噪声降下去，把告警送到人',
        tasks: [
          {
            ask: '告警太吵了',
            goal: '屏蔽规则、订阅与事件 Pipeline',
            href: '/docs/events/overview',
          },
          {
            ask: '告警要送到值班人',
            goal: '20 种通知媒介，以及挑媒介的规则',
            href: '/docs/notifications/overview',
          },
          {
            ask: '消息模板里能用哪些变量',
            goal: '模板变量、写入协议与内置指标',
            href: '/docs/reference/notification-variables',
          },
        ],
      },
      {
        eyebrow: 'OPERATE',
        stage: 'ai',
        label: '长期跑住，并且交给 AI',
        tasks: [
          {
            ask: '我要部署到生产',
            goal: 'Compose、二进制、Helm 与升级',
            href: '/docs/install/overview',
          },
          {
            ask: '机房链路不稳',
            goal: '用 n9e-edge 在本地判定，断网也照常通知',
            href: '/docs/install/edge',
          },
          {
            ask: '我要让 AI 来操作夜莺',
            goal: 'MCP 接入、鉴权，以及写工具的开关',
            href: '/docs/ai/overview',
          },
        ],
      },
    ],
    referenceEyebrow: 'REFERENCE',
    referenceTitle: '查配置项、API 与模板变量',
    references: [
      { label: '配置项', href: '/docs/reference/configuration' },
      { label: 'HTTP API', href: '/docs/reference/http-api' },
      { label: 'MCP 工具', href: '/docs/reference/mcp-tools' },
      { label: '模板变量', href: '/docs/reference/notification-variables' },
      { label: '写入协议', href: '/docs/reference/write-protocols' },
      { label: '内置指标', href: '/docs/reference/built-in-metrics' },
    ],
    helpEyebrow: 'RELEASES AND HELP',
    help: [
      { label: '发布说明', href: 'https://github.com/ccfos/nightingale/releases' },
      { label: '产品对比', href: '/comparisons' },
      { label: '集成生态', href: '/integrations' },
      { label: '提交 Issue', href: 'https://github.com/ccfos/nightingale/issues' },
      { label: 'Slack 社区', href: SLACK_INVITE },
    ],
  },
  docsPlanned: {
    badge: '尚未撰写',
    scopeLead: '这一页将会讲：',
    askTitle: '有问题可以先问',
    ask: [
      { label: 'Slack 社区', href: SLACK_INVITE },
      { label: 'GitHub Issues', href: 'https://github.com/ccfos/nightingale/issues' },
    ],
    contributeTitle: '帮我们把这一页写出来',
    contributeBody: '这一页的范围已经定了，缺的只是正文。如果你在生产环境里做过这件事，你写的会比我们从源码推导的更可靠。',
    contributeLabel: '在 GitHub 上编辑这一页',
  },
};
