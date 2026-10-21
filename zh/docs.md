NIGHTINGALE DOCSv9.3.0

# 夜莺文档

把已经在跑的 Prometheus、日志库和数据库接进来，配好规则、降噪、路由和通知——每一步怎么做，这里都写着。

告警规则为什么没有触发

[5 分钟拉起夜莺](https://n9e.github.io/zh/docs/get-started/quick-start.md)[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)

## CONNECT把数据接进来，让规则跑起来

[我已经有监控数据接上 Prometheus、ES、ClickHouse，在原地查询→](https://n9e.github.io/zh/docs/data/overview.md)[我还没有开始采集Categraf：一个 agent，100+ 插件→](https://n9e.github.io/zh/docs/get-started/choose-your-path/categraf.md)[我要写第一条告警规则规则、级别、业务组与测试触发→](https://n9e.github.io/zh/docs/alerting/overview.md)

## DELIVER把噪声降下去，把告警送到人

[告警太吵了屏蔽规则、订阅与事件 Pipeline→](https://n9e.github.io/zh/docs/events/overview.md)[告警要送到值班人20 种通知媒介，以及挑媒介的规则→](https://n9e.github.io/zh/docs/notifications/overview.md)[消息模板里能用哪些变量模板变量、写入协议与内置指标→](https://n9e.github.io/zh/docs/reference/notification-variables.md)

## OPERATE长期跑住，并且交给 AI

[我要部署到生产Compose、二进制、Helm 与升级→](https://n9e.github.io/zh/docs/install/overview.md)[机房链路不稳用 n9e-edge 在本地判定，断网也照常通知→](https://n9e.github.io/zh/docs/install/edge.md)[我要让 AI 来操作夜莺MCP 接入、鉴权，以及写工具的开关→](https://n9e.github.io/zh/docs/ai/overview.md)

REFERENCE

## 查配置项、API 与模板变量

[配置项](https://n9e.github.io/zh/docs/reference/configuration.md)[HTTP API](https://n9e.github.io/zh/docs/reference/http-api.md)[MCP 工具](https://n9e.github.io/zh/docs/reference/mcp-tools.md)[模板变量](https://n9e.github.io/zh/docs/reference/notification-variables.md)[写入协议](https://n9e.github.io/zh/docs/reference/write-protocols.md)[内置指标](https://n9e.github.io/zh/docs/reference/built-in-metrics.md)

RELEASES AND HELP

[发布说明](https://github.com/ccfos/nightingale/releases)[产品对比](https://n9e.github.io/zh/comparisons.md)[集成生态](https://n9e.github.io/zh/integrations.md)[提交 Issue](https://github.com/ccfos/nightingale/issues)[Slack 社区](https://join.slack.com/t/n9e/shared_invite/zt-480klxytf-P9qm3C1M87kDmRPp_H30Kw)
