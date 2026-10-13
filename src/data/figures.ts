import catalog from './integrations.json';
import mcp from './mcp.json';

/**
 * 全站反复出现的几个数字，只在这里定一次。
 *
 * 首页数字条、流程图要点、MCP 区块、对比页证明栏、介绍页都引用它——之前同一个数字
 * 散在六七处，发一次版就要人肉找齐，漏一处就会出现「首页 86、介绍页 87」这种互相打架。
 *
 * - integrations：构建时从上游仓库抓的集成目录（src/data/integrations.json），不手填。
 *   integrationsWith*：目录里带告警规则 / 仪表盘 / 指标说明的条数，同一份数据算出来。
 *   口径统一按官网目录（上游有 4 个评审决定不展示的模板，见 scripts/integration-categories.mjs
 *   的 HIDDEN），文档里「内置 N 个组件」也用这个数，不再另写发布包的数字。
 * - mcp*：由 scripts/docs-env/gen-mcp-reference.mjs 统计写入 src/data/mcp.json，
 *   口径与文档「MCP 工具参考」那页完全一致。工具表来自 nightingale go.mod 锁定的
 *   n9e-mcp-server 工具集库，n9e 进程内置暴露，不需要也不建议再单独部署一个 MCP server。
 * - datasourceTypes / notificationChannels：产品能力口径，随版本手工核对后改这里。
 *
 * 全部给成字符串，正文里直接拼模板串。
 */
export const figures = {
  datasourceTypes: '10+',
  notificationChannels: '20',
  integrations: String(catalog.items.length),
  integrationsWithAlerts: String(catalog.items.filter((i) => i.alerts > 0).length),
  integrationsWithDashboards: String(catalog.items.filter((i) => i.dashboards > 0).length),
  integrationsWithMetrics: String(catalog.items.filter((i) => i.metrics > 0).length),
  mcpTools: String(mcp.tools),
  mcpReadTools: String(mcp.readTools),
  mcpWriteTools: String(mcp.writeTools),
  mcpToolsets: String(mcp.toolsets),
} as const;
