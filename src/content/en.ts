import type { SiteCopy } from './types';
import stats from '../data/stats.json';
import { SLACK_INVITE } from '../data/site';

/**
 * English copy. Phase 1 runs the curated-subset strategy (plan §4.4):
 * the homepage and framework pages ship in real English, docs follow.
 */
export const en: SiteCopy = {
  hero: {
    // 标题里已经有 Open-Source，eyebrow 不再重复，换成三条互补的事实。
    // 词组内用不断行空格，窄屏时整条一起换行，不会劈成 "NO VENDOR / LOCK-IN"
    kicker: 'APACHE-2.0 · SELF-HOSTED · NO VENDOR LOCK-IN',
    demoLabel: 'Try live demo',
    demoNote: 'No sign-up',
    ctaPrimaryNote: 'Self-hosted',
    // \n 是两栏布局下的断行点：在 Alerting 后断，比自动均衡断出 "…Alerting for / Your…" 读起来顺
    title: 'Open-Source Alerting\nfor Your Existing Stack',
    lead: 'Keep your metrics and logs where they are. Write and run alert rules across Prometheus, VictoriaMetrics, Elasticsearch, ClickHouse, and more — from one place. Send alerts to Slack, PagerDuty, or whatever your team already uses.',
    highlights: 'Built-in AI assistant · MCP server',
    ctaPrimary: { label: 'Install in 5 minutes', href: '/docs/get-started/quick-start' },
    ctaSecondary: { label: 'GitHub', href: 'https://github.com/ccfos/nightingale' },
    installCaption: 'Run the whole stack locally',
    installLines: [
      'git clone https://github.com/ccfos/nightingale.git',
      'cd nightingale/docker/compose-bridge',
      'docker compose up -d',
    ],
    copy: 'Copy',
    copied: 'Copied',
    shotAlt: 'Nightingale monitoring dashboard',
    alert: {
      severity: 'S1',
      rule: 'CPU usage above 90%',
      labels: ['__name__=cpu_usage_idle', 'ident=n9e-demo-01', 'busigroup=DevOps'],
      firedAtLabel: 'Fired',
      firedAt: '02:14:07',
      durationLabel: 'Firing for',
      duration: '14m',
    },
    notify: {
      label: 'Delivered',
      // 英文站用海外团队最常见的三个去处；中文站保留钉钉 / 飞书
      channels: [
        { name: 'Slack', logo: 'img/logos/slack.png' },
        { name: 'PagerDuty', logo: 'img/logos/pagerduty.png' },
        { name: 'Telegram', logo: 'img/logos/telegram.png' },
      ],
    },
  },

  stats: {
    starsLabel: 'GitHub stars',
    items: [
      { value: '10+', label: 'Data source types' },
      { value: '20', label: 'Notification channels' },
      { value: '86', label: 'Built-in integrations' },
      { value: '74', label: 'MCP tools' },
    ],
  },

  pipeline: {
    eyebrow: 'HOW IT WORKS',
    title: 'From any data source to someone getting paged',
    lead: 'Nightingale does not take over your storage. It does one layer well. Here is how data moves through it — each stage is a real object in the product.',
    chainCaption: 'data becomes an alert here',
    steps: [
      {
        artifact: 'datasource',
        stage: 'config',
        title: 'Connect what you already run',
        body: 'No migration. Register Prometheus, VictoriaMetrics, ElasticSearch, ClickHouse or Loki as a data source and Nightingale evaluates alerts on top of it. Nothing collecting yet? Categraf covers operating systems, middleware and databases in a single agent and writes straight in over Prometheus Remote Write.',
        points: [
          '10+ data source types — metrics, logs and databases alike',
          '86 built-in integrations bundle collector config, dashboards and rules',
        ],
        shot: 'img/step-connect.png',
        shotAlt: 'Nightingale integration templates',
      },
      {
        artifact: 'rule',
        stage: 'config',
        title: 'Write the rule once',
        body: 'Metrics, logs and SQL-queried stores share one rule model, so there is nothing new to learn per data source. Rules are configured in the UI, scoped by business group, and graded S1 / S2 / S3. A library of common rules ships with the install, so you never start from an empty page.',
        points: ['One rule can span several data sources', 'Edit rules in the UI or through the API — no YAML reload cycle'],
        shot: 'img/step-alert-en.png',
        shotAlt: 'Nightingale alert rule management',
      },
      {
        artifact: 'event',
        stage: 'event',
        title: 'Cut the noise, then route',
        body: 'Storms collapse into an aggregated view by business group and severity. Mute rules, subscriptions and event pipelines filter what is left, and the survivors reach people through 20 notification channels. Wire up ibex when an alert should fix itself.',
        points: [
          'DingTalk, Feishu, WeCom, phone, SMS, Slack and 15 more',
          'Event pipelines group similar alerts, rewrite labels and route conditionally',
        ],
        shot: 'img/step-automate-en.png',
        shotAlt: 'Nightingale aggregated alert events',
      },
      {
        artifact: 'agent',
        stage: 'ai',
        title: 'Hand it to an agent',
        body: 'Since v9 the n9e process is itself an MCP server. Claude Code, Cursor and anything else that speaks MCP connect to /mcp and manage alerting in plain language. There is no extra process to deploy.',
        points: [
          'Nightingale AI assistant and Skills included',
          'Permissions follow the token — identical RBAC to that user in the UI',
        ],
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
    title: '74 tools, nothing extra to deploy',
    lead: 'The MCP endpoint lives inside the n9e process, so it is not one more component to operate. Every tool call is dispatched onto Nightingale’s own HTTP API carrying your token — a client can never reach anything its token’s owner cannot.',
    figures: [
      { value: '42', label: 'read tools' },
      { value: '32', label: 'write tools' },
      { value: '13', label: 'toolsets' },
    ],
    toolsetsLabel: 'Toolsets',
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
    note: 'The write tools are not registered until you turn them on in config. Authenticate with a personal token or OAuth 2.1: Nightingale can act as the authorization server itself, so hosted clients like Claude and ChatGPT connect with zero pre-registration, or as a resource server in front of your existing Keycloak, Entra ID or Okta.',
    terminal: {
      title: 'claude — nightingale via MCP',
      lines: [
        { kind: 'user', text: 'which S1 alerts from last night are still firing?' },
        { kind: 'tool', text: 'nightingale · get_alert_events', dim: 'severity=1 status=firing' },
        { kind: 'out', text: '3 still firing. Longest: mysql-prod replica lag > 30s, 2h14m' },
        { kind: 'user', text: 'what did memory on mysql-prod look like this past hour?' },
        { kind: 'tool', text: 'nightingale · query_metrics', dim: 'ident=mysql-prod range=1h' },
        { kind: 'out', text: 'Peak 87.4%, now 62.1%. No memory rule fired.' },
        { kind: 'user', text: 'mute the replica lag alert until 9am, reason "change window"' },
        { kind: 'tool', text: 'nightingale · create_mute_rule', dim: 'scope=mysql-prod until=09:00' },
        { kind: 'out', text: 'Mute rule #1024 created, expires tomorrow 09:00', ok: true },
      ],
    },
  },

  integrations: {
    eyebrow: 'INTEGRATIONS',
    title: 'It grows on the stack you have',
    lead: 'Nightingale never asks you to replace what works. Data sources, collectors and notification channels all plug into what is already running.',
    groups: [
      {
        label: 'DATA SOURCES',
        title: 'Data sources',
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
        title: 'Notification channels',
        // 英文站读者以海外团队为主：海外常用的渠道排前面，钉钉 / 飞书 / 企微放到最后
        items: [
          { name: 'Slack', logo: 'img/logos/slack.png' },
          { name: 'PagerDuty', logo: 'img/logos/pagerduty.png' },
          { name: 'Email', icon: 'email' },
          { name: 'Telegram', logo: 'img/logos/telegram.png' },
          { name: 'Discord', logo: 'img/logos/discord.png' },
          { name: 'Jira', logo: 'img/logos/jira.png' },
          { name: 'Mattermost', logo: 'img/logos/mattermost.png' },
          { name: 'Phone / SMS', icon: 'phone' },
          { name: 'FlashDuty', logo: 'img/logos/flashduty.png' },
          { name: 'DingTalk', logo: 'img/logos/dingtalk.png' },
          { name: 'Feishu', logo: 'img/logos/feishu.png' },
          { name: 'WeCom', logo: 'img/logos/wecom.png' },
        ],
      },
    ],
    more: { label: 'See every integration', href: '/integrations' },
  },

  deploy: {
    eyebrow: 'DEPLOY',
    title: 'Run it where you need it',
    cards: [
      {
        title: 'Self-hosted',
        body: 'Apache-2.0, fully featured. One compose command brings it up; binaries and Helm are there too.',
        code: 'docker compose up -d',
        link: { label: 'Download and install', href: '/download' },
      },
      {
        title: 'Edge data centers',
        body: 'Deploy n9e-edge as a local alerting engine where the link to the center is unreliable. Alerts keep firing and keep being delivered through a network partition.',
        code: 'n9e-edge --configs etc/edge',
        link: { label: 'About the edge architecture', href: '/docs/operations/edge-partition' },
      },
    ],
  },

  compare: {
    eyebrow: 'COMPARISONS',
    title: 'Against what you run today',
    lead: 'Each tool has its ground. Keep Prometheus or VictoriaMetrics for storage — Nightingale argues only for owning the alerting layer.',
    cards: [
      {
        title: 'vs Prometheus + Alertmanager',
        body: 'Same data, but rules get a UI, permissions get a model, and channels come built in.',
      },
      { title: 'vs Zabbix', body: 'No second collection stack. It reads the time-series and log stores you already fill.' },
      {
        title: 'vs Grafana Alerting',
        body: 'Grafana is the visualization standard. Nightingale spends everything on the alerting engine.',
      },
    ],
    more: { label: 'Read the full comparison', href: '/comparisons' },
  },

  trust: {
    eyebrow: 'WHO USES NIGHTINGALE',
    title: 'Thousands of companies run it in production',
    lead: 'Automotive, electronics, gaming, cloud, logistics, retail.',
    // 逐个 logo 横向滚动。全部为纯英文/国际版标识，逐张光栅化确认无汉字
    logos: [
      // 按海外知名度排序：第一梯队是海外消费者直接认识的品牌
      { file: 'lenovo.svg', name: 'Lenovo' },
      { file: 'dji.svg', name: 'DJI' },
      { file: 'shein.svg', name: 'SHEIN' },
      { file: 'hoyoverse.svg', name: 'HoYoverse' },
      { file: 'lotus.svg', name: 'Lotus' },
      { file: 'anker.svg', name: 'Anker Innovations' },
      { file: 'hisense.svg', name: 'Hisense' },
      // 第二梯队：海外有大量销售或门店
      { file: 'tcl.png', name: 'TCL' },
      { file: 'hikvision.svg', name: 'Hikvision' },
      { file: 'insta360.svg', name: 'Insta360' },
      { file: 'smart.svg', name: 'smart' },
      { file: 'yoshinoya.svg', name: 'Yoshinoya' },
      { file: 'nio.svg', name: 'NIO' },
      { file: 'chery.svg', name: 'Chery' },
      // 第三梯队：在特定市场或行业知名
      { file: 'dahua.svg', name: 'Dahua' },
      { file: 'transsion.svg', name: 'Transsion' },
      { file: 'ponyai.png', name: 'Pony.ai' },
      { file: 'tuya.png', name: 'Tuya' },
      { file: 'dhgate.svg', name: 'DHgate' },
      { file: 'leapmotor.svg', name: 'Leapmotor' },
      { file: 'liauto.svg', name: 'Li Auto' },
      // 第四梯队：游戏玩家 / 行业圈内知名，以及主要在国内的品牌
      { invert: true, file: 'hypergryph.svg', name: 'HyperGryph' },
      { file: 'lilith.png', name: 'Lilith Games' },
      { invert: true, file: 'sunborn.png', name: 'Sunborn' },
      { file: 'bespin.svg', name: 'Bespin Global' },
      { file: 'classin.svg', name: 'ClassIn' },
      { file: 'momenta.png', name: 'Momenta' },
      { file: 'inspur.svg', name: 'Inspur' },
      { invert: true, file: 'voyah.svg', name: 'VOYAH' },
      { file: 'arcfox.svg', name: 'ARCFOX' },
      { file: 'transfar.png', name: 'Transfar' },
    ],
    // 治理区块只在中文站展示，见 types.ts 里 governance 的说明
  },

  finalCta: {
    title: 'Give alerting to a specialist',
    lead: 'Bring up Nightingale in five minutes, point it at your data, and watch the first alert land.',
    primary: { label: 'Install in 5 minutes', href: '/docs/get-started/quick-start' },
    secondary: { label: 'GitHub', href: 'https://github.com/ccfos/nightingale' },
    communityLabel: 'Community',
    community: [
      { label: 'Slack #n9e', href: SLACK_INVITE },
      { label: 'GitHub Issues', href: 'https://github.com/ccfos/nightingale/issues' },
    ],
  },

  comparisonsPage: {
    pageTitle: 'Comparisons',
    label: 'Nightingale vs',
    title: 'Keep your storage.\nChange who owns alerting.',
    lead: 'Prometheus, Zabbix and Grafana each have their ground. Nightingale argues for one thing only: the alerting layer should belong to a tool built for it.',
    demoLabel: 'Try live demo',
    install: { label: 'Install in 5 minutes', href: '/docs/get-started/quick-start' },
    matrixTitle: 'At a glance',
    tableCaption: 'Capability comparison',
    products: ['Nightingale v9', 'Prometheus + Alertmanager', 'Zabbix', 'Grafana Alerting'],
    rows: [
      {
        label: 'Alerting across data sources',
        cells: [
          { level: 'full', text: 'Metrics and logs, 10+ types' },
          { level: 'none', text: 'Prometheus data only' },
          { level: 'none', text: 'Its own collection stack' },
          { level: 'partial', text: 'Per data source plugin' },
        ],
      },
      {
        label: 'Notification channels',
        cells: [
          { level: 'full', text: '20 built in, phone and SMS' },
          { level: 'partial', text: 'Webhooks, build your own' },
          { level: 'partial', text: 'Media types plus scripts' },
          { level: 'partial', text: 'Some built in' },
        ],
      },
      {
        label: 'Mute, subscribe, event pipeline',
        cells: [
          { level: 'full', text: 'Native' },
          { level: 'partial', text: 'Basic silences' },
          { level: 'partial', text: 'Maintenance windows' },
          { level: 'partial', text: 'Basic silences' },
        ],
      },
      {
        label: 'Rules and permissions in the UI',
        cells: [
          { level: 'full', text: 'Business-group RBAC' },
          { level: 'none', text: 'YAML and reload' },
          { level: 'full', text: 'Yes' },
          { level: 'full', text: 'Yes' },
        ],
      },
      {
        label: 'Built-in AI and MCP server',
        cells: [
          { level: 'full', text: '74 tools, in-process' },
          { level: 'none', text: 'None' },
          { level: 'none', text: 'None' },
          { level: 'partial', text: 'Assistant is Cloud-only' },
        ],
      },
    ],
    levels: { full: 'Built in', partial: 'Partial or via add-on', none: 'Not available' },
    matrixNote:
      'Based on the publicly documented capabilities of each project’s open-source edition as of August 2026. We try to state what the other tools are good at — advice you cannot trust is worth nothing to a community.',
    proof: [
      { value: '10+', label: 'Data source types' },
      { value: '20', label: 'Notification channels' },
      { value: '74', label: 'MCP tools' },
    ],
    theirWayLabel: 'Their way',
    ourWayLabel: 'The Nightingale way',
    theirsLabel: 'Where it shines',
    oursLabel: 'When Nightingale fits better',
    signalsLabel: 'Signs it is time to switch',
    guideLabel: 'Migration guide',
    askYou: 'You',
    askAi: 'Nightingale AI',
    verdicts: [
      {
        id: 'prometheus',
        title: 'Prometheus + Alertmanager',
        theirWay: 'Rules live in YAML and ship through GitOps.',
        ourWay: 'Rules live in the UI, scoped by business group.',
        theirs:
          'Prometheus remains one of the best time-series foundations available, and Alertmanager’s grouping and silencing model is genuinely clean. At moderate scale, with a GitOps-comfortable team and a rule count you can hold in your head, the pair is enough and adds no components.',
        ours: 'Nightingale earns its place when rules must be maintained by teams who are not SREs, when permissions need to follow business groups, when someone has to be phoned at 3am, or when the data is not all in Prometheus.',
        signals: [
          'Rules must be maintained by teams who are not SREs',
          'Someone has to be phoned at 3am, not just webhooked',
          'The data is no longer all in Prometheus',
        ],
        guide: { label: 'From Prometheus + Alertmanager', href: '/docs/migration/from-alertmanager' },
        visualCaption: 'One rule, two ways to write it',
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
          rightTitle: 'Nightingale · alert rule',
          fields: [
            { label: 'Name', value: 'MySQL replica lag' },
            { label: 'Condition', value: 'mysql_slave_lag_seconds > 30, for 5m' },
            { label: 'Business group', value: 'DBA' },
            { label: 'Notify', value: 'Phone, SMS, DingTalk' },
            { label: 'Who can edit', value: 'DBA group' },
          ],
        },
        ask: {
          q: 'Create in one sentence: page the DBA group by phone when mysql-prod replica lag stays above 30s for 5 minutes',
          a: 'PromQL and threshold drafted. I will not guess the business group; pick one from the list and I will create the rule.',
        },
      },
      {
        id: 'zabbix',
        title: 'Zabbix',
        theirWay: 'Collect everything with its own agents, then alert on that.',
        ourWay: 'Alert on the stores you already fill; collect only where nothing does.',
        theirs:
          'Two decades of work show in traditional IT monitoring: network gear, SNMP, agent-based collection and auto-discovery are its home ground, and the hiring pool knows it well.',
        ours: 'If your telemetry already lives in Prometheus, VictoriaMetrics or ElasticSearch, Nightingale reads it directly instead of asking you to pour it into a second collection stack.',
        signals: [
          'Telemetry already lives in Prometheus, VictoriaMetrics or ElasticSearch',
          'Kubernetes and cloud services outnumber network gear',
          'You maintain two collection stacks to get one alert',
        ],
        guide: { label: 'From Zabbix', href: '/docs/migration/from-zabbix' },
        visualCaption: 'Categraf fills only the gaps',
        visual: {
          kind: 'wiring',
          sourcesLabel: 'Storage you already run',
          sources: [
            { name: 'Prometheus', logo: 'img/logos/prometheus.png' },
            { name: 'VictoriaMetrics', logo: 'img/logos/victoriametrics.png' },
            { name: 'ElasticSearch', logo: 'img/logos/elasticsearch.png' },
            { name: 'ClickHouse', logo: 'img/logos/ck.png' },
          ],
          hub: 'Nightingale',
          hubNote: 'Reads in place, moves nothing',
          channelsLabel: '20 notification channels',
          channels: [
            { name: 'Phone / SMS', icon: 'phone' },
            { name: 'Email', icon: 'email' },
            { name: 'DingTalk', logo: 'img/logos/dingtalk.png' },
            { name: 'Slack', logo: 'img/logos/slack.png' },
          ],
          channelsMore: '+16',
        },
        ask: {
          q: 'Why did this host go offline?',
          a: 'The agent stopped reporting 3 minutes ago, but the host answers ping and its neighbours are healthy. That points to the Categraf process exiting, not the host going down.',
        },
      },
      {
        id: 'grafana',
        title: 'Grafana Alerting',
        theirWay: 'Alerting as a module inside the visualization platform.',
        ourWay: 'Alerting as the whole product; chart wherever you like.',
        theirs:
          'Grafana is the visualization standard and its dashboard ecosystem has no real substitute. If alert volume is modest and Grafana is already in place, its built-in alerting is one system fewer to run.',
        ours: 'Nightingale puts everything into the alerting side: event pipelines, subscriptions, self-healing. The two are not exclusive — plenty of users chart in Grafana and alert in Nightingale.',
        signals: [
          'Alert volume has outgrown a panel-level rule model',
          'You need event pipelines, subscriptions or self-healing',
          'On-call people need phone and SMS, not only contact points',
        ],
        guide: { label: 'From Grafana Alerting', href: '/docs/migration/from-grafana-alerting' },
        visualCaption: 'Chart in Grafana, alert in Nightingale',
        visual: {
          kind: 'embed',
          panelTitle: 'Grafana · MySQL overview',
          panelNote: 'A Grafana panel embedded by URL in a Nightingale dashboard',
          event: {
            severity: 'S1',
            rule: 'MySQL replica lag > 30s',
            labels: ['ident=mysql-prod', 'busigroup=DBA'],
            status: 'Delivered · phone and DingTalk',
          },
        },
        ask: {
          q: 'Analyze this dashboard',
          a: 'Of 40 panels, 3 query metrics that no longer exist, and 2 show an abnormal trend in the last hour: connections and slow_queries.',
        },
      },
    ],
    ai: {
      title: 'AI is part of the process, not an add-on',
      lead: 'It reads your alerts, rules and metrics, so answers come from your data rather than the model’s memory. Before it changes anything that already exists, it shows you the diff.',
      tabs: [
        {
          id: 'investigate',
          title: 'Investigate',
          body: 'It pulls the event, the rule, runs the rule’s query over the window, checks neighbouring hosts and muting rules, and hands back an evidence chain. The call is still yours.',
          chatTitle: 'Nightingale AI · event #48213',
          chat: [
            { kind: 'context', text: 'Event #48213 · MySQL replica lag > 30s · mysql-prod' },
            { kind: 'user', text: 'Analyze the root cause of this alert event' },
            { kind: 'tool', text: 'Read the event and its rule', dim: 'get_alert_event · get_alert_rule' },
            { kind: 'tool', text: 'Run the rule’s query over the firing window', dim: 'query_range · 14:00–14:20' },
            { kind: 'tool', text: 'Check other alerts on the host and muting rules', dim: 'ops-troubleshooting' },
            {
              kind: 'out',
              ok: true,
              text: 'Lag has stayed above 30s since 14:02. On the same host disk_io_util reached 96% at 14:01, and two disk alerts fired in the same window. No muting rule was in play. Three pieces of evidence are listed; whether it is the root cause is your call.',
            },
          ],
        },
        {
          id: 'noise',
          title: 'Cut the noise',
          body: 'Which rules are the noisiest and which have never fired, in one question. For the ones that recur on a schedule, ask whether they are candidates for self-healing.',
          chatTitle: 'Nightingale AI · new chat',
          chat: [
            { kind: 'user', text: 'Review my alert rules: which have fired most often in the last 7 days, and which have never fired?' },
            { kind: 'tool', text: 'Aggregate 7 days of events', dim: 'query-alert-events' },
            { kind: 'tool', text: 'Cross-check against the rule list', dim: 'list_alert_rules' },
            {
              kind: 'out',
              ok: true,
              text: 'Noisiest three: cpu_idle < 10% (412 times), pod_restart (198), disk_free < 15% (131). Nine rules have never fired; four of them query a datasource that now returns nothing.',
            },
            { kind: 'user', text: 'Which of these are candidates for self-healing?' },
            { kind: 'out', text: 'pod_restart recurs every week on the same three pods. That is mechanical enough for an ibex script.' },
          ],
        },
        {
          id: 'change',
          title: 'Change configuration',
          body: 'Changes to existing objects take two turns: the tool returns a confirmation card first and writes only after you confirm. A proposal expires in 30 minutes, applies once, and is refused if someone edited the object meanwhile. There are no delete tools.',
          chatTitle: 'Nightingale AI · new chat',
          chat: [
            { kind: 'user', text: 'Change the duration on the MySQL replica lag rule to 5 minutes' },
            { kind: 'tool', text: 'Compute the change, do not write yet', dim: 'update_alert_rule · proposal' },
            {
              kind: 'confirm',
              title: 'Will update alert rule #1024',
              changes: [{ field: 'for', from: '1m', to: '5m' }],
              note: 'Valid for 30 minutes, applies once. Refused if the rule changes underneath.',
              confirmLabel: 'Confirm',
              cancelLabel: 'Cancel',
            },
            { kind: 'user', text: 'Confirm' },
            { kind: 'out', ok: true, text: 'Applied from the stored proposal. The model was not consulted again.' },
          ],
        },
      ],
      facts: [
        '74 MCP tools',
        '13 toolsets',
        'No delete tools',
        'Permissions follow the user',
        'OpenAI-compatible, Anthropic or self-hosted models',
        'Claude Code and Cursor connect directly',
      ],
      rivalsLabel: 'The others at this layer',
      rivals: [
        { name: 'Prometheus + Alertmanager', stance: 'no built-in AI' },
        { name: 'Zabbix', stance: 'no built-in AI' },
        { name: 'Grafana', stance: 'Assistant is Cloud-only; OSS gets a separate MCP server and an LLM plugin' },
      ],
    },

    coexist: {
      title: 'Nothing has to be switched off',
      lead: 'Nightingale reads the storage you already run, so the switch is a parallel run, not a cut-over.',
      steps: [
        {
          title: 'Point it at your storage',
          body: 'Register Prometheus, VictoriaMetrics or ElasticSearch as a data source. Nothing in the collection path changes.',
        },
        {
          title: 'Move the rules across',
          body: 'The migration guides map every entry of an alertmanager.yml or a Grafana alert rule onto a Nightingale object, and say plainly which ones have no equivalent.',
        },
        {
          title: 'Run both, cut over by channel',
          body: 'Compare what fires each day, switch one notification channel at a time, and back out of any stage in about a minute.',
        },
      ],
      link: { label: 'Coexistence and rollback plan', href: '/docs/migration/coexistence' },
    },
    faq: {
      title: 'Questions people ask before switching',
      items: [
        {
          q: 'Can I keep Grafana?',
          a: 'Yes, and it is the most common setup: chart in Grafana, alert in Nightingale. A Nightingale dashboard can also embed a Grafana dashboard by URL.',
        },
        {
          q: 'Do I have to replace Prometheus?',
          a: 'No. Nightingale does not store time series. Prometheus keeps scraping and storing; Nightingale takes over rules, noise reduction and routing on top of it.',
        },
        {
          q: 'Can Alertmanager rules be migrated?',
          a: 'Rules, routes, silences and receivers each map onto a Nightingale object. The migration guide takes an alertmanager.yml apart entry by entry and lists the few that have no equivalent.',
        },
        {
          q: 'Can Nightingale read Zabbix data?',
          a: 'No. Moving from Zabbix is a rebuild: hosts become targets, templates become integrations, triggers become rules, and Categraf takes over collection. Zabbix never has to stop while you do it.',
        },
        {
          q: 'When should I not switch?',
          a: 'At moderate scale, with a GitOps-comfortable team and a rule count you can hold in your head, Prometheus + Alertmanager is enough. For network gear and SNMP-first estates, Zabbix is still home ground.',
        },
      ],
    },
    closing: {
      title: 'Not sure? Run both.',
      lead: 'Nightingale reads the storage you already have. Installing it changes nothing about the alerting you run today.',
    },
  },

  integrationsPage: {
    title: 'Plugs into what you already run',
    lead: 'Data sources, collectors, notification channels and templates — Nightingale connects to what exists rather than replacing it. The full list is below, and every entry links to how to wire it up.',
    counts: { templates: 'Built-in templates', sources: 'Data source types', channels: 'Notification channels', channelsValue: '20' },
    search: {
      placeholder: 'Search integrations: nginx, k8s, aws, cert…',
      hint: 'to search',
      clear: 'Clear',
      emptyTitle: 'No matching integration',
      emptyBody: 'The template list comes straight from the open-source repo. Ask for what is missing, or write one yourself — a template is just a directory.',
      emptyIssue: { label: 'Request it in an issue', href: 'https://github.com/ccfos/nightingale/issues/new/choose' },
      emptyContribute: { label: 'Contribute one', href: '/docs/reference/integration-schema' },
    },
    jump: { templates: 'Templates', sources: 'Data sources', channels: 'Notifications', collectors: 'Collectors' },
    templates: {
      label: 'BUILT-IN TEMPLATES',
      title: 'Built-in templates',
      lead: 'Each template bundles Categraf collector config, dashboards and a set of alert rules, importable in one click from the integration center. The numbers on each card are counted from the repo at build time — they say what the template actually ships, not what we hope it does.',
      all: 'All',
      categories: {
        host: 'Hosts & hardware',
        database: 'Databases & storage',
        mq: 'Message queues',
        web: 'Web & middleware',
        'cloud-native': 'Containers & cloud native',
        cloud: 'Cloud providers & CDN',
        network: 'Network & probes',
        devops: 'DevOps & others',
        other: 'Others',
      },
      badges: {
        dashboards: ['{n} dashboard', '{n} dashboards'],
        alerts: ['{n} rule set', '{n} rule sets'],
        collect: 'collector config',
        metrics: 'metric docs',
      },
      readmeOnly: { zh: 'Chinese only', en: 'English only' },
      showAll: 'Show all {n} templates',
      showLess: 'Show less',
      sourceLink: { label: 'Browse every template on GitHub', href: 'https://github.com/ccfos/nightingale/tree/main/integrations' },
    },
    sources: {
      label: 'DATA SOURCES',
      title: 'Data sources',
      lead: 'Nightingale ships no storage of its own; it queries what you already run. Metrics stores speak PromQL, log stores use their own query syntax, and SQL stores take plain SQL — alert rules and dashboards work on all three.',
      kinds: { metrics: 'Metrics', logs: 'Logs', sql: 'SQL' },
      items: [
        { name: 'Prometheus', logo: 'img/logos/prometheus.png', kind: 'metrics', href: '/docs/data/prometheus' },
        { name: 'VictoriaMetrics', logo: 'img/logos/victoriametrics.png', kind: 'metrics', href: '/docs/data/victoriametrics' },
        { name: 'Embedded TSDB', logo: 'img/logo-mark.png', kind: 'metrics', href: '/docs/data/embedded-tsdb' },
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
      title: 'Notification channels',
      lead: 'DingTalk, WeCom, Feishu, email and phone/SMS work out of the box. Slack, Telegram, Discord, PagerDuty and Jira come with built-in message templates — create the media type and send. Anything else goes through a webhook with a custom body.',
      link: { label: 'Notification docs', href: '/docs/notifications/overview' },
    },
    collectors: {
      label: 'COLLECTORS',
      title: 'How data gets in',
      lead: 'Nightingale does not collect data itself. The templates above are written for Categraf, but any collector that speaks Prometheus Remote Write can feed it.',
      recommendedTag: 'Recommended',
      items: [
        {
          name: 'Categraf',
          body: 'One agent for operating systems, middleware, databases and cloud providers. Every built-in template ships its collector config for Categraf.',
          link: { label: 'Categraf docs', href: '/docs/data/categraf' },
          recommended: true,
        },
        {
          name: 'Telegraf / Datadog Agent',
          body: 'Keep what is already running; point its output at the Nightingale Remote Write endpoint.',
          link: { label: 'Collector setup', href: '/docs/data/integrations/collector-config' },
        },
        {
          name: 'Exporters',
          body: 'node_exporter, mysqld_exporter and the rest of the Prometheus ecosystem, scraped by Categraf or Prometheus and written in.',
          link: { label: 'Collector config', href: '/docs/data/integrations/collector-config' },
        },
        {
          name: 'Remote Write directly',
          body: 'Your own programs or the OpenTelemetry Collector push straight to /prometheus/v1/write.',
          link: { label: 'Verify data arrives', href: '/docs/data/integrations/verify' },
        },
      ],
    },
    notFound: {
      title: 'Not seeing what you need?',
      body: 'The template list comes straight from the open-source repo, where a template is one directory: icon, collector config, dashboards, alert rules. Ask for what is missing in an issue, or write one to the spec and send a PR.',
      links: [
        { label: 'Request in an issue', href: 'https://github.com/ccfos/nightingale/issues/new/choose' },
        { label: 'Template spec', href: '/docs/reference/integration-schema' },
      ],
    },
  },

  downloadPage: {
    pageTitle: 'Download',
    title: 'Up in five minutes,\nor deployed the way production needs.',
    lead: 'Every package here is built from a tagged release and published on GitHub. Say what you are trying to do and the page shows only the commands for that path.',
    releasedLabel: 'released',
    notesLabel: 'Release notes',
    chooserTitle: 'What do you want to do?',
    recommendedLabel: 'Recommended',
    paths: [
      { id: 'try', title: 'Try it', body: 'Docker Compose brings up n9e, its database and a collector together.' },
      {
        id: 'production',
        title: 'Deploy to production',
        body: 'Binaries, a Docker image or the Helm chart, against your own database and Redis.',
      },
      { id: 'edge', title: 'Edge data centers', body: 'Run n9e-edge locally where the link to the center is unreliable.' },
      { id: 'offline', title: 'Offline hosts', body: 'What to fetch in advance for machines without internet access.' },
    ],
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    downloadLabel: 'Download',
    sha256Label: 'SHA256',
    tryPath: {
      intro: 'Five containers: n9e, MySQL, Redis, VictoriaMetrics, and Categraf collecting the host it runs on.',
      lines: ['git clone https://github.com/ccfos/nightingale.git', 'cd nightingale/docker/compose-bridge', 'docker compose up -d'],
      afterTitle: 'Once it is up',
      after: [
        'docker compose ps shows five containers running',
        'Open http://localhost:17000 and sign in as root / root.2020',
        'The host it runs on is already listed under Targets, reported by the bundled Categraf',
      ],
      variantsTitle: 'Other bundles in the same directory',
      variants: [
        { dir: 'compose-postgres', body: 'PostgreSQL 12 instead of MySQL' },
        { dir: 'compose-host-network', body: 'Prometheus as the store, host networking, Linux only' },
        { dir: 'compose-host-network-metric-log', body: 'Adds Kafka, Elasticsearch and Logstash for logs, Linux only' },
      ],
      link: { label: 'Docker Compose guide', href: '/docs/install/docker-compose' },
    },
    production: {
      prereq: 'Needs a metadata database, MySQL 8 or PostgreSQL 12 and newer, plus Redis. SQLite is for testing only.',
      platforms: [
        { id: 'linux-amd64', label: 'Linux amd64' },
        { id: 'linux-arm64', label: 'Linux arm64' },
        { id: 'docker', label: 'Docker' },
        { id: 'kubernetes', label: 'Kubernetes' },
      ],
      linux: {
        intro: 'One archive with n9e, n9e-edge, the integration templates and a Categraf build. It has no top-level directory, so extract into a directory you create.',
        lines: [
          'curl -LO {url}',
          'curl -LO {checksums}',
          'sha256sum -c checksums.txt --ignore-missing',
          'mkdir -p /opt/n9e && tar zxf {name} -C /opt/n9e',
          'cd /opt/n9e && ./n9e',
        ],
        expected: 'The log says http server listening on: 0.0.0.0:17000. The defaults run on SQLite and an embedded store; point etc/config.toml at your database and Redis before going further.',
        link: { label: 'Binary install guide: systemd, config, database', href: '/docs/install/binary' },
      },
      docker: {
        intro: 'The image runs the n9e process alone. Mount a config directory whose config.toml points at your database and Redis.',
        lines: [
          'docker pull flashcatcloud/nightingale:{version}',
          'docker run -d --name nightingale -p 17000:17000 -p 20090:20090 -v /opt/n9e/etc:/app/etc flashcatcloud/nightingale:{version}',
        ],
        note: 'Port 17000 is the web UI and API, 20090 is the ibex RPC port for self-healing. The config layout is the same as the binary package.',
        link: { label: 'Configuration layout', href: '/docs/install/configuration' },
      },
      kubernetes: {
        intro: 'A community-maintained chart with MySQL, Redis, Prometheus and Categraf. The Helm repository only has v8 packages so far; to get v9, clone and install from the checkout.',
        lines: ['git clone https://github.com/flashcatcloud/n9e-helm.git', 'helm install nightingale ./n9e-helm -n n9e --create-namespace'],
        expected: 'kubectl get pod -n n9e shows the nginx, database, redis, prometheus, n9e and categraf pods Running.',
        note: 'Set database.external and redis.external in values to use databases outside the cluster.',
        link: { label: 'Helm guide', href: '/docs/install/helm' },
      },
    },
    edge: {
      intro: 'n9e-edge ships inside the same Linux archive as n9e. It evaluates rules locally and keeps delivering through a network partition.',
      lines: ['n9e-edge --configs etc/edge'],
      warning: 'Pass etc/edge, not etc. The default loads the central config and misroutes silently. Edge also needs its own Redis.',
      link: { label: 'Edge data centers guide', href: '/docs/install/edge' },
    },
    offline: {
      intro: 'Fetch these on a connected machine and carry them over. The Linux archive already contains the integration templates, the built-in dashboards and a Categraf build.',
      items: [
        'The Linux archive for your architecture, from the production path above',
        'The container images, if you deploy with Docker or Helm',
      ],
      lines: [
        'docker pull flashcatcloud/nightingale:{version}',
        'docker pull flashcatcloud/categraf:latest',
        'docker save flashcatcloud/nightingale:{version} flashcatcloud/categraf:latest -o n9e-images.tar',
      ],
      link: { label: 'Offline deployment guide', href: '/docs/install/offline' },
    },
    categraf: {
      title: 'Categraf, the collector',
      intro: 'One agent per host for operating systems, middleware, databases and Kubernetes, writing over Prometheus Remote Write. Install it wherever Nightingale should see data.',
      osLabels: { linux: 'Linux', windows: 'Windows' },
      columns: ['Platform', 'Size', 'SHA256', ''],
      moreNote: 'A slim build with metrics collection only, and one with the NVIDIA DCGM plugin, are on the release page.',
      moreLink: { label: 'All Categraf builds', href: 'https://github.com/flashcatcloud/categraf/releases/latest' },
      after: 'Point config.toml at your Nightingale address and the host appears under Targets within a minute.',
      links: [
        { label: 'About Categraf', href: '/categraf' },
        { label: 'Categraf docs', href: '/docs/data/categraf' },
      ],
    },
    upgrade: {
      title: 'Upgrading and rolling back',
      body: 'Minor versions roll the binary. Across v8 to v9, back up the database first and read the schema changes in the release notes; the migration runs on first start.',
      links: [
        { label: 'Upgrade guide', href: '/docs/install/upgrade' },
        { label: 'Rollback', href: '/docs/install/rollback' },
        { label: 'v8 to v9', href: '/docs/migration/v8-to-v9' },
      ],
    },
    help: {
      title: 'Stuck?',
      body: 'The community answers on Slack and GitHub Issues.',
      links: [
        { label: 'Slack #n9e', href: SLACK_INVITE },
        { label: 'GitHub Issues', href: 'https://github.com/ccfos/nightingale/issues' },
      ],
      archive: { label: 'All releases on GitHub', href: 'https://github.com/ccfos/nightingale/releases' },
    },
  },

  categrafPage: {
    title: 'Categraf',
    lead: 'Nightingale evaluates alerts on data you already have. Categraf is one way to put it there: a single agent covering operating systems, middleware, databases, network gear and Kubernetes, writing over Prometheus Remote Write. MIT licensed, built by the team behind Nightingale.',
    facts: [
      { value: '100+', label: 'Collection plugins' },
      { value: 'MIT', label: 'Licensed' },
      { value: '1', label: 'Agent per host' },
    ],
    runTitle: 'Install and run',
    methods: [
      {
        title: 'Download a release build',
        note: 'Archives are per platform and already contain the conf directory, so the agent runs straight out of the tarball. Linux ships for amd64 and arm64, Windows as a zip. Two variants sit beside the default build: -with-cgo-plugin adds the NVIDIA DCGM collector, and categraf-slim drops everything but metrics collection.',
        lines: [
          'tar xzf categraf-v<version>-linux-amd64.tar.gz',
          'cd categraf-v<version>-linux-amd64',
        ],
        after: 'The version is part of the filename, so there is no fixed “latest” URL — pick the build from the releases page.',
        link: { label: 'Releases on GitHub', href: 'https://github.com/flashcatcloud/categraf/releases' },
      },
      {
        title: 'Docker',
        note: 'The image carries the binary at /usr/bin/categraf and the sample config at /etc/categraf/conf. Set N9E_HOST and the entrypoint rewrites the server address inside config.toml for you; mount your own conf directory when you need more than that.',
        lines: [
          'docker pull flashcatcloud/categraf:latest',
          'docker run -d --name categraf -e N9E_HOST=192.168.1.10:17000 flashcatcloud/categraf:latest',
        ],
      },
      {
        title: 'Build from source',
        note: 'Go 1.25 or newer. Package the binary together with conf so the agent keeps its sample configuration alongside it.',
        lines: ['go build', 'tar zcvf categraf.tar.gz categraf conf'],
        after: 'On macOS use gnu-tar (gtar) — the bundled bsdtar produces an archive Categraf refuses to load.',
      },
      {
        title: 'See what it collects before writing anywhere',
        note: 'Test mode prints metrics straight to stdout, so you can confirm a plugin works before pointing the agent at a server.',
        lines: ['./categraf --test', './categraf --test --inputs system:mem'],
      },
      {
        title: 'Run it',
        note: 'Configuration lives in the conf directory — config.toml for the agent itself, one input.<plugin> directory per collector. Restrict the run to specific plugins with --inputs.',
        lines: [
          './categraf',
          './categraf --configs /path/to/conf-directory',
          './categraf --inputs system:mem',
        ],
        after: 'Connecting it to Nightingale, tagging hosts, and what to check when no data arrives are covered step by step in the docs.',
        link: { label: 'Categraf docs', href: '/docs/data/categraf' },
      },
      {
        title: 'Kubernetes',
        note: 'A DaemonSet collects node and cAdvisor metrics, a Deployment covers cluster-level targets such as apiserver and CoreDNS, and a sidecar covers one service. The manifests ship in the repository.',
        lines: [
          'kubectl apply -n monitoring -f k8s/daemonset.yaml',
          'kubectl apply -n monitoring -f k8s/deployment.yaml',
          'kubectl apply -n monitoring -f k8s/sidecar.yaml',
        ],
      },
    ],
    pluginsTitle: 'What it collects',
    pluginsBody:
      'Every plugin is a directory under inputs/ with its own sample config. A selection of what ships today:',
    pluginGroups: [
      {
        label: 'Operating system',
        items: ['cpu', 'mem', 'disk', 'diskio', 'net', 'netstat', 'processes', 'procstat', 'system', 'kernel', 'systemd', 'ntp'],
      },
      {
        label: 'Databases',
        items: ['mysql', 'postgresql', 'oracle', 'sqlserver', 'mongodb', 'redis', 'clickhouse', 'elasticsearch', 'greenplum', 'cassandra'],
      },
      {
        label: 'Middleware',
        items: ['kafka', 'rabbitmq', 'nats', 'nsq', 'activemq', 'zookeeper', 'consul', 'ldap'],
      },
      {
        label: 'Web and app servers',
        items: ['nginx', 'apache', 'tomcat', 'jboss', 'weblogic', 'phpfpm', 'haproxy', 'tengine', 'jenkins', 'logstash'],
      },
      {
        label: 'Containers and Kubernetes',
        items: ['docker', 'cadvisor', 'kubernetes', 'kubelet', 'kube_state_metrics', 'kube_proxy'],
      },
      {
        label: 'Network gear and hardware',
        items: ['snmp', 'snmp_trap', 'switch_legacy', 'ipmi', 'redfish', 'smart', 'modbus', 'gnmi', 'vsphere'],
      },
      { label: 'GPU', items: ['nvidia_smi', 'dcgm', 'amd_rocm_smi', 'hy_smi'] },
      { label: 'Cloud', items: ['aliyun', 'cloudwatch', 'googlecloud', 'appdynamics'] },
      {
        label: 'Probes',
        items: ['ping', 'http_response', 'net_response', 'dns_query', 'x509_cert', 'whois'],
      },
      { label: 'Generic', items: ['exec', 'prometheus', 'node_exporter', 'mtail', 'tpl'] },
    ],
    notes: [
      {
        title: 'Where the data goes',
        body: 'Categraf pushes over the Prometheus Remote Write protocol, so it writes into Nightingale, Prometheus, VictoriaMetrics or anything else that speaks it. Push means the agent opens the connection — which matters when network policy will not let a central server reach into every subnet.',
        link: { label: 'Register it as a data source', href: '/integrations' },
      },
      {
        title: 'Not the only option',
        body: 'Nightingale does not require Categraf. Telegraf, the Datadog Agent and standard Prometheus exporters write in the same way, and a Prometheus that already scrapes your targets can stay exactly as it is.',
        link: { label: 'Categraf source and releases', href: 'https://github.com/flashcatcloud/categraf' },
      },
    ],
  },
  docsHome: {
    eyebrow: 'NIGHTINGALE DOCS',
    title: 'Nightingale docs',
    lead: 'Point Nightingale at the Prometheus, log stores and databases you already run, then set up rules, noise reduction, routing and delivery. Every step is written down here.',
    searchLabel: 'Search the docs',
    // Real questions rather than "Search docs…" (research §16.5): the reader
    // learns what grain of problem these docs answer within five seconds.
    searchHints: [
      "Why isn't my alert rule firing?",
      "Prometheus data source won't connect",
      'Which variables can a Slack template use?',
      'Does n9e-edge keep alerting during a partition?',
      'MCP write tools are missing',
      'Upgrading from v8 to v9',
    ],
    ctaPrimary: { label: 'Bring it up in 5 minutes', href: '/docs/get-started/quick-start' },
    demoLabel: 'Live demo',
    bands: [
      {
        eyebrow: 'CONNECT',
        stage: 'config',
        label: 'Get your data in, and get a rule evaluating it',
        tasks: [
          {
            ask: 'I already have monitoring data',
            goal: 'Register Prometheus, ES or ClickHouse — queried in place',
            href: '/docs/data/overview',
          },
          {
            ask: 'Nothing is collecting yet',
            goal: 'Categraf: one agent, 100+ plugins',
            href: '/docs/get-started/choose-your-path/categraf',
          },
          {
            ask: 'I need to write my first alert rule',
            goal: 'Rules, severities, business groups, test fire',
            href: '/docs/alerting/overview',
          },
        ],
      },
      {
        eyebrow: 'DELIVER',
        stage: 'event',
        label: 'Cut the noise, then get what is left to a person',
        tasks: [
          {
            ask: 'There are far too many alerts',
            goal: 'Mute rules, subscriptions and event pipelines',
            href: '/docs/events/overview',
          },
          {
            ask: 'Alerts have to reach whoever is on call',
            goal: '20 channels, and the rules that pick between them',
            href: '/docs/notifications/overview',
          },
          {
            ask: 'Which variables can a message template use?',
            goal: 'Template variables, write protocols, built-in metrics',
            href: '/docs/reference/notification-variables',
          },
        ],
      },
      {
        eyebrow: 'OPERATE',
        stage: 'ai',
        label: 'Keep it running, and let an AI client drive it',
        tasks: [
          {
            ask: "I'm deploying to production",
            goal: 'Compose, binaries, Helm and upgrades',
            href: '/docs/install/overview',
          },
          {
            ask: 'The link to my data center is unreliable',
            goal: 'Run n9e-edge so alerts fire and deliver through a partition',
            href: '/docs/install/edge',
          },
          {
            ask: 'I want an AI client to drive Nightingale',
            goal: 'MCP setup, authentication, and the write-tool switch',
            href: '/docs/ai/overview',
          },
        ],
      },
    ],
    referenceEyebrow: 'REFERENCE',
    referenceTitle: 'Configuration, API and template variables',
    references: [
      { label: 'Configuration', href: '/docs/reference/configuration' },
      { label: 'HTTP API', href: '/docs/reference/http-api' },
      { label: 'MCP tools', href: '/docs/reference/mcp-tools' },
      { label: 'Template variables', href: '/docs/reference/notification-variables' },
      { label: 'Write protocols', href: '/docs/reference/write-protocols' },
      { label: 'Built-in metrics', href: '/docs/reference/built-in-metrics' },
    ],
    helpEyebrow: 'RELEASES AND HELP',
    help: [
      { label: 'Release notes', href: 'https://github.com/ccfos/nightingale/releases' },
      { label: 'Comparisons', href: '/comparisons' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Open an issue', href: 'https://github.com/ccfos/nightingale/issues' },
      { label: 'Slack', href: SLACK_INVITE },
    ],
  },
  docsPlanned: {
    badge: 'Not written yet',
    scopeLead: 'This page will cover:',
    askTitle: 'Questions in the meantime',
    ask: [
      { label: 'Slack community', href: SLACK_INVITE },
      { label: 'GitHub Issues', href: 'https://github.com/ccfos/nightingale/issues' },
    ],
    contributeTitle: 'Help write this page',
    contributeBody: "The scope is settled; only the text is missing. If you have done this in production, what you write will be more reliable than what we can derive from the source tree.",
    contributeLabel: 'Edit this page on GitHub',
  },
};
