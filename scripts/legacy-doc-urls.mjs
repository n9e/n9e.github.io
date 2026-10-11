/** Old Hugo documentation routes before 54cbdc54, plus known older traffic entries.
 * Paths are locale-relative. Reasons and source files stay with the mapping so a
 * future domain move can reuse it without reconstructing the content decisions.
 */
export const legacyRevision = '54cbdc54^';
const entry = (id, action, reason, to, extra = {}) => ({
  path: id ? `/docs/${id}` : '/docs',
  action,
  reason,
  source: id ? `${id}.md` : '_index.md',
  ...(to ? { to: `/docs/${to}` } : {}),
  ...extra,
});

export const legacyDocUrls = [
  entry('', 'keep', 'The documentation home retains its URL.'),
  entry('prologue', 'redirect', 'Project introduction.', 'get-started/introduction', { source: 'prologue/_index.md' }),
  entry('prologue/introduction', 'redirect', 'Project introduction.', 'get-started/introduction'),
  entry('prologue/architecture', 'redirect', 'Architecture, including the edge-mode anchor.', 'concepts/architecture'),
  entry('prologue/prometheus', 'redirect', 'Relationship to existing monitoring components.', 'get-started/where-it-fits'),
  entry('prologue/pre-knowledge', 'restore', 'Prerequisites, PromQL and troubleshooting skills.'),
  entry('prologue/videos', 'restore', 'Preserve the video catalogue and its version context.'),
  entry('prologue/flashcat', 'retire', 'Commercial-edition copy was intentionally removed.'),
  entry('install', 'redirect', 'Installation overview.', 'install/overview', { source: 'install/_index.md' }),
  entry('install/pre-intro', 'redirect', 'Deployment choices and dependencies.', 'install/overview'),
  entry('install/compose', 'redirect', 'Docker Compose deployment.', 'install/docker-compose'),
  entry('install/binary', 'keep', 'The current binary guide retains its URL.'),
  entry('install/configuration', 'keep', 'Configuration layout retains its URL.'),
  entry('install/helm', 'keep', 'The Helm guide retains its URL.'),
  entry('install/upgrade', 'keep', 'The upgrade guide retains its URL.'),
  entry('agent', 'redirect', 'Data and collector overview.', 'data/overview', { source: 'agent/_index.md' }),
  entry('agent/intro', 'redirect', 'Existing storage and collector choices.', 'data/overview'),
  entry('agent/categraf', 'redirect', 'Writers, heartbeat and agent registration.', 'data/categraf/install'),
  entry('agent/telegraf', 'restore', 'Update Telegraf integration for Remote Write.'),
  entry('agent/datadog-agent', 'restore', 'Document the v1 series compatibility boundary.'),
  entry('usage', 'restore', 'Navigation across data, queries, alerts and notifications.', undefined, { source: 'usage/_index.md' }),
  entry('usage/datasource', 'redirect', 'Data-source registration.', 'data/overview'),
  entry('usage/dashboard', 'redirect', 'Dashboards.', 'query/dashboards'),
  entry('usage/ad-hoc', 'redirect', 'Metric explorer.', 'query/metric-explorer'),
  entry('usage/metric-alerting', 'redirect', 'Metric alert rules.', 'alerting/metric-rules', { source: { en: 'usage/metric-alerting.md', 'zh-Hans': 'usage/metric-alerting/index.md' } }),
  entry('usage/logs-alerting', 'redirect', 'Log alert rules.', 'alerting/log-rules'),
  entry('usage/notify-rules', 'redirect', 'Notification rules.', 'notifications/rules'),
  entry('usecase', 'restore', 'Navigation to the relocated feature guides.', undefined, { source: 'usecase/_index.md' }),
  entry('usecase/alerting', 'redirect', 'End-to-end event processing.', 'concepts/noise-routing'),
  entry('usecase/api', 'redirect', 'Management and data-ingestion API entry points.', 'reference/http-api'),
  entry('usecase/bizgroup', 'redirect', 'Business-group ownership.', 'concepts/business-groups'),
  entry('usecase/media', 'redirect', 'Media configuration and notification templates.', 'notifications/architecture'),
  entry('usecase/mute', 'redirect', 'Mute rules.', 'events/mute-rules'),
  entry('usecase/processor', 'redirect', 'Event pipelines.', 'events/pipelines'),
  entry('usecase/sso', 'redirect', 'SSO.', 'security/sso'),
  entry('usecase/subscribe', 'redirect', 'Subscriptions.', 'events/subscriptions'),
  entry('practice', 'restore', 'Monitoring-practice catalogue.', undefined, { source: 'practice/_index.md' }),
  entry('practice/linux', 'restore', 'Host metrics, storage and missing-host checks.'),
  entry('practice/mysql', 'restore', 'MySQL performance collection and business SQL are distinct.'),
  entry('practice/oracle', 'restore', 'Oracle collector configuration.'),
  entry('practice/redis', 'restore', 'Redis collection and exporter integration.'),
  entry('practice/proc', 'restore', 'Process counts and per-process metrics.'),
  entry('practice/port', 'restore', 'TCP/UDP and HTTP probing.'),
  entry('practice/exec', 'restore', 'Executable collector scripts.'),
  entry('practice/java', 'restore', 'Actuator, Micrometer, JMX and component exporters.'),
  entry('faq', 'restore', 'FAQ navigation.', undefined, { source: 'faq/_index.md' }),
  entry('faq/how-to-import-prometheus-rules', 'redirect', 'Native Prometheus rule import.', 'alerting/import-export', { source: 'faq/how-to-import-prometheus-rules/index.md' }),
  entry('faq/biz-team-subscribe-infra-alarms', 'redirect', 'Cross-group subscriptions.', 'events/subscriptions'),
  entry('faq/global-callback', 'redirect', 'The old article explicitly recommends global subscriptions.', 'events/subscriptions'),
  entry('faq/cpu-alerting', 'restore', 'Actionable CPU alerts and response runbooks.'),
  entry('install/server', 'redirect', 'Obsolete split-process deployment now points directly to the current installation overview.', 'install/overview', {
    revision: 'e8f2edce^', additional: true,
  }),
];

export const legacyLocales = [
  { locale: 'en', prefix: '', source: 'en' },
  { locale: 'zh-Hans', prefix: '/zh', source: 'zh' },
];

export function entriesForLocale(locale) {
  return legacyDocUrls.filter((item) => !item.locales || item.locales.includes(locale));
}

export function redirectsForLocale(locale) {
  return entriesForLocale(locale).flatMap((item) => {
    if (item.action === 'retire') return [];
    if (item.action === 'redirect') return [{ from: item.path, to: item.to }];
    // Existing canonical .html pages stay untouched; the alias is directory/index.html.
    return [{ from: `${item.path}/`, to: item.path }];
  });
}

/** Also covers client-side navigation, which never requests the static alias HTML. */
export function legacyTarget(pathname) {
  const prefix = pathname.startsWith('/zh/') ? '/zh' : '';
  const locale = prefix ? 'zh-Hans' : 'en';
  const relativePath = pathname.slice(prefix.length).replace(/\/+$/, '');
  const item = entriesForLocale(locale).find((candidate) => candidate.path === relativePath);
  if (!item || item.action === 'retire') return null;
  const target = `${prefix}${item.to ?? item.path}`;
  return target === pathname ? null : target;
}
