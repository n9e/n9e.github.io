/**
 * 「哪一页要哪张图」的总清单。改这里，不要改 shoot-docs.mjs。
 *
 *   section : 落盘目录，和 docs/ 下的一级目录同名
 *   name    : 文件名（不含扩展名和语言后缀）。英文出 <name>.png，中文出 <name>.zh.png
 *   path    : 前端路由
 *   docs    : 这张图给哪些文档页用，方便回查「有没有图没人引用」
 *   waitFor : 等这段文字出现再截，避免截到骨架屏
 *   before  : 截图前要做的操作（展开表单、切 tab 等）
 *
 * 只给「照着做」的页面配图。概念页、排障页、参考手册以文字和表格为主，不配图。
 */

const clickText = (text) => async (page) => {
  await page.getByText(text, { exact: false }).first().click().catch(() => {});
  await page.waitForTimeout(1200);
};

/**
 * 数据源表单上「关联告警引擎」会误报一条红字。
 * 原因在 fe 的 src/pages/datasource/components/items/Cluster.tsx：
 * useEffect 里 setClusters 之后**同步**调用 form.validateFields，
 * 这次校验用的还是渲染前那份空的 clusters 列表，于是必然失败；
 * 之后没有任何东西再触发校验，红字就一直挂着。
 * 后端 /api/n9e/server-clusters 返回的是 ["default"]，值本身没问题。
 *
 * 截图里不该带着这条误报，所以先切到另一个值再切回来，逼它重新校验一次。
 */
/** 设备列表默认选中第一个业务组，而演示主机不在那个组里，先切到「全部机器」 */
const allHosts = async (page) => {
  await page.getByText(/^All hosts$|^全部机器$/).first().click().catch(() => {});
  await page.waitForTimeout(1500);
};

const clearClusterWarning = async (page) => {
  const pick = async (text) => {
    await page.locator('.ant-form-item', { hasText: /Associated alerting engine|关联告警引擎/ })
      .locator('.ant-select-selector').first().click().catch(() => {});
    await page.waitForTimeout(500);
    await page.locator('.ant-select-item-option', { hasText: text }).first().click().catch(() => {});
    await page.waitForTimeout(500);
  };
  await pick('no_assigned_engine');
  await pick('default');
};

/**
 * 保存数据源之后的「下一步引导」弹窗（fe 的 NextStepModal）。
 *
 * 这个弹窗只在保存成功那一刻弹出来，没有独立路由，所以只能真的填表保存一次。
 * 为了可重复执行，先按名字删掉上一轮留下的那条——同名数据源第二次保存会被后端拒掉，
 * 拒掉就没有弹窗，截出来是一张空表单。
 *
 * URL 指向内置时序库自己的 Prometheus 端点（见 data/embedded-tsdb）：
 * 只有真的查得到数据，弹窗里的「数据体检」才会走到「数据正常」那一支，
 * 底部的组件模板匹配也才会出现——那两块是这张图要说明的东西。
 */
const DEMO_DS_NAME = 'prod-prometheus';

const saveDemoDatasource = async (page) => {
  await page.evaluate(async (name) => {
    const headers = { Authorization: 'Bearer ' + localStorage.getItem('access_token'), 'Content-Type': 'application/json' };
    const list = await (await fetch('/api/n9e/datasource/brief', { headers })).json();
    for (const ds of list.dat || []) {
      if (ds.name === name) await fetch('/api/n9e/datasource', { method: 'DELETE', headers, body: JSON.stringify([ds.id]) });
    }
  }, DEMO_DS_NAME);

  // 表单第一个输入框是名称、第二个是 URL；按 label 找在英文界面下会撞上别的字段
  const inputs = page.locator('.ant-form input[type="text"], .ant-form input:not([type])');
  await inputs.nth(0).fill(DEMO_DS_NAME);
  await inputs.nth(1).fill('http://127.0.0.1:17000/prometheus');
  await page.getByRole('button', { name: /测试连通性并保存|Save & test/ }).first().click();
  // 体检是弹窗打开后再发的一次查询，等它落定再截，否则截到 loading
  await page.getByText(/数据正常|Data is flowing/).first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
};

/**
 * 上一步的弹窗里点组件卡片，进模板导入弹窗。
 * 顺手选上业务组：不选的话「导入」是灰的，截出来像个没做完的界面，
 * 而选业务组本来就是这一步要做的事。
 */
const openTemplateImport = async (page) => {
  await saveDemoDatasource(page);
  await page.locator('.ant-modal').getByText('Linux', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(2000);
  const importModal = page.locator('.ant-modal').last();
  await importModal.locator('.ant-select-selector').first().click().catch(() => {});
  await page.waitForTimeout(600);
  await page.locator('.ant-select-item-option').first().click().catch(() => {});
  await page.waitForTimeout(800);
};

export const SHOTS = [

  // ---- 上手 ----------------------------------------------------------
  { section: 'get-started', name: 'landing-onboarding', path: '/landing',
    docs: ['get-started/quick-start'] },
  { section: 'get-started', name: 'targets-list', path: '/targets', before: allHosts,
    docs: ['get-started/choose-your-path/categraf'] },
  { section: 'get-started', name: 'ds-next-step', path: '/datasources/add/prometheus',
    before: saveDemoDatasource,
    docs: ['get-started/choose-your-path/existing-metrics'] },
  { section: 'get-started', name: 'ds-template-import', path: '/datasources/add/prometheus',
    before: openTemplateImport,
    docs: ['get-started/choose-your-path/existing-metrics'] },

  // ---- 接入数据 ------------------------------------------------------
  { section: 'data', name: 'datasource-list', path: '/datasources',
    docs: ['data/prometheus', 'data/overview'] },
  // 类型选择是 /datasources 上的一个弹窗，没有独立路由——
  // 直接访问 /datasources/add 会渲染 404
  { section: 'data', name: 'datasource-types', path: '/datasources',
    docs: ['data/overview'],
    before: async (page) => {
      await page.getByRole('button', { name: /新 ?增|Add/ }).first().click().catch(() => {});
      await page.waitForTimeout(1500);
    } },
  { section: 'data', before: clearClusterWarning, name: 'form-prometheus', path: '/datasources/add/prometheus',
    docs: ['data/prometheus', 'data/victoriametrics', 'get-started/choose-your-path/existing-metrics'] },
  { section: 'data', before: clearClusterWarning, name: 'form-elasticsearch', path: '/datasources/add/elasticsearch',
    docs: ['data/elasticsearch'] },
  { section: 'data', before: clearClusterWarning, name: 'form-loki', path: '/datasources/add/loki',
    docs: ['data/loki-victorialogs'] },
  { section: 'data', before: clearClusterWarning, name: 'form-victorialogs', path: '/datasources/add/victorialogs',
    docs: ['data/loki-victorialogs'] },
  { section: 'data', before: clearClusterWarning, name: 'form-clickhouse', path: '/datasources/add/ck',
    docs: ['data/clickhouse-doris-iotdb'] },
  { section: 'data', before: clearClusterWarning, name: 'form-mysql', path: '/datasources/add/mysql',
    docs: ['data/sql-databases'] },
  { section: 'data', name: 'targets-list', path: '/targets', before: allHosts,
    docs: ['data/categraf/targets', 'data/categraf/install'] },
  { section: 'data', name: 'components', path: '/components',
    docs: ['data/integrations/import', 'data/integrations/collector-config'] },

  // ---- 查询与可视化 --------------------------------------------------
  { section: 'query', name: 'metric-explorer', path: '/metric/explorer',
    docs: ['query/metric-explorer'] },
  { section: 'query', name: 'log-explorer', path: '/log/explorer',
    docs: ['query/log-explorer'] },
  { section: 'query', name: 'dashboard-list', path: '/dashboards',
    docs: ['query/dashboards'] },
  { section: 'query', name: 'object-explorer', path: '/object/explorer',
    docs: ['query/object-view'] },
  { section: 'query', name: 'metrics-built-in', path: '/metrics-built-in',
    docs: ['query/built-in-views'] },
  { section: 'query', name: 'recording-rules', path: '/recording-rules',
    docs: ['query/recording-rules'] },
  { section: 'query', name: 'embedded-products', path: '/embedded-products',
    docs: ['query/embedding'] },

  // ---- 告警规则 ------------------------------------------------------
  // 业务组 2 = Trading System，演示数据都在这个组下
  { section: 'alerting', name: 'rule-list', path: '/alert-rules',
    docs: ['alerting/first-rule', 'alerting/overview'] },
  { section: 'alerting', name: 'rule-form', path: '/alert-rules/add/2',
    docs: ['alerting/first-rule', 'alerting/metric-rules'] },
  { section: 'alerting', name: 'rule-edit', path: '/alert-rules/edit/4',
    docs: ['alerting/metric-rules', 'alerting/evaluation', 'alerting/labels-severity'] },

  // ---- 事件与降噪 ----------------------------------------------------
  { section: 'events', name: 'active-events', path: '/alert-cur-events',
    docs: ['events/active-historical', 'events/overview'] },
  { section: 'events', name: 'historical-events', path: '/alert-his-events',
    docs: ['events/active-historical'] },
  { section: 'events', name: 'mute-rules', path: '/alert-mutes',
    docs: ['events/mute-rules'] },
  { section: 'events', name: 'subscriptions', path: '/alert-subscribes',
    docs: ['events/subscriptions'] },
  { section: 'events', name: 'pipelines', path: '/event-pipelines',
    docs: ['events/pipelines'] },
  { section: 'events', name: 'pipeline-executions', path: '/event-pipelines-executions',
    docs: ['events/execution-records'] },
  { section: 'events', name: 'mute-form', path: '/alert-mutes/add',
    docs: ['events/mute-rules'] },
  { section: 'events', name: 'subscribe-form', path: '/alert-subscribes/add',
    docs: ['events/subscriptions'] },

  // ---- 通知 ----------------------------------------------------------
  { section: 'notifications', name: 'notify-rules', path: '/notification-rules',
    docs: ['notifications/rules', 'notifications/overview'] },
  { section: 'notifications', name: 'media-types', path: '/notification-channels',
    docs: ['notifications/architecture', 'notifications/email-phone-sms'] },
  { section: 'notifications', name: 'message-templates', path: '/notification-templates',
    docs: ['notifications/templates'] },
  { section: 'notifications', name: 'notify-rule-detail', path: '/notification-rules/detail/1',
    docs: ['notifications/rules', 'notifications/architecture'] },
  { section: 'notifications', name: 'media-type-add', path: '/notification-channels/add',
    docs: ['notifications/architecture', 'notifications/chat'] },

  // ---- AI 与 MCP -----------------------------------------------------
  { section: 'ai', name: 'assistant', path: '/nightingale-ai',
    docs: ['ai/nightingale-ai'] },
  { section: 'ai', name: 'llm-configs', path: '/nightingale-ai/llm-configs',
    docs: ['ai/llm-provider'] },
  { section: 'ai', name: 'skills', path: '/nightingale-ai/skills',
    docs: ['ai/skills'] },

  // ---- 权限与安全 ----------------------------------------------------
  { section: 'security', name: 'users', path: '/users', docs: ['security/users-teams'] },
  { section: 'security', name: 'teams', path: '/user-groups', docs: ['security/users-teams'] },
  { section: 'security', name: 'roles', path: '/roles', docs: ['security/roles'] },
  { section: 'security', name: 'sso', path: '/system/sso-settings', docs: ['security/sso'] },
  { section: 'security', name: 'variables', path: '/system/variable-settings',
    docs: ['security/variables'] },

  // ---- 运行 ----------------------------------------------------------
  { section: 'operations', name: 'alerting-engines', path: '/system/alerting-engines',
    docs: ['operations/health', 'operations/high-availability'] },
  { section: 'operations', name: 'about', path: '/system/version',
    docs: ['operations/upgrade', 'install/upgrade'] },
];
