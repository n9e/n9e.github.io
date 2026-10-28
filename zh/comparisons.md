夜莺 vs[Prometheus + Alertmanager](https://n9e.github.io/zh/comparisons/prometheus-alertmanager.md)[Zabbix](https://n9e.github.io/zh/comparisons/zabbix.md)[Grafana Alerting](https://n9e.github.io/zh/comparisons/grafana-alerting.md)

# 存储不用换，<br /><!-- -->换掉的是告警这一层。

Prometheus、Zabbix、Grafana 各有各的主场。夜莺只争一件事：告警这一层，该交给专门做告警的工具。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/docs/get-started/quick-start.md)

## 一眼看完

| 能力对比                    | 夜莺 v9                             | Prometheus + Alertmanager                         | Zabbix                                   | Grafana Alerting                                |
| --------------------------- | ----------------------------------- | ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| 多数据源统一告警            | 内置<!-- -->: 指标 + 日志，10+ 类型 | 不支持<!-- -->: 仅 Prometheus 自身数据            | 不支持<!-- -->: 限于自有采集体系         | 部分支持或需扩展<!-- -->: 按数据源插件支持      |
| 通知媒介                    | 内置<!-- -->: 20 种内置，含电话短信 | 部分支持或需扩展<!-- -->: 以 webhook 为主，需自建 | 部分支持或需扩展<!-- -->: 媒介加脚本扩展 | 部分支持或需扩展<!-- -->: 部分内置              |
| 屏蔽 / 订阅 / 事件 Pipeline | 内置<!-- -->: 原生内置              | 部分支持或需扩展<!-- -->: Silence 基础能力        | 部分支持或需扩展<!-- -->: 维护期机制     | 部分支持或需扩展<!-- -->: Silence 基础能力      |
| 页面配置规则与权限          | 内置<!-- -->: 业务组 RBAC           | 不支持<!-- -->: YAML + reload                     | 内置<!-- -->: 支持                       | 内置<!-- -->: 支持                              |
| 内置 AI / MCP Server        | 内置<!-- -->: 74 个工具，进程内置   | 不支持<!-- -->: 无                                | 不支持<!-- -->: 无                       | 部分支持或需扩展<!-- -->: Assistant 仅 Cloud 版 |

* 内置
* 部分支持或需扩展
* 不支持

基于各项目 2026 年 8 月开源版本的公开能力，只作选型参考。我们尽量把对方的长处写清楚——选型建议不老实，社区口碑也就没了。

* **13,400**GitHub Stars
* **10+**&#x6570;据源类型
* **20**通知媒介
* **74**MCP 工具

## AI 是进程里的一部分，不是附加包

它读的是你的告警、规则和指标，答案来自数据而不是模型的记忆。改任何已有对象之前，先把差异给你看。

### 01排查

从事件到规则、到规则查询、到邻居主机和屏蔽规则，一路拉完给出证据链。判断还是你的。

### 02降噪

哪些规则最吵、哪些一年没响过，一句话问出来。规律复发的那几条，顺手问它适不适合自愈。

### 03改配置

改已有对象分两步：先返回确认卡，你在下一轮确认才写入。提议 30 分钟过期、只能确认一次、对象被别人改过就拒绝。没有删除工具。

夜莺 AI · 事件 #48213

事件 #48213 · MySQL 副本延迟 > 30s · mysql-prod

分析这条告警的根因

读取事件和它的规则get\_alert\_event · get\_alert\_rule

在触发窗口内执行规则查询query\_range · 14:00–14:20

检查同主机其他告警和屏蔽规则ops-troubleshooting

✓延迟从 14:02 起持续超过 30s。同一主机 disk\_io\_util 在 14:01 升到 96%，同时段还有 2 条磁盘告警。没有屏蔽规则生效。三条证据已列出，是否为根因由你判断。

* 74 个 MCP 工具
* 13 个工具集
* 没有删除工具
* 权限随用户走
* OpenAI 兼容、Anthropic 或自托管模型
* Claude Code、Cursor 直连

对手在这一层**Prometheus + Alertmanager**没有内置 AI**Zabbix**没有内置 AI**Grafana**Assistant 仅 Cloud 版，开源版有独立的 MCP server 和 LLM 插件

1. [01Prometheus + Alertmanager](#prometheus)
2. [02Zabbix](#zabbix)
3. [03Grafana Alerting](#grafana)

01

## Prometheus + Alertmanager

它的路子

规则写在 YAML 里，靠 GitOps 管。

夜莺的路子

规则配在页面上，按业务组分权限。

### 换的信号

* 告警规则要交给非 SRE 的业务团队维护
* 凌晨三点得有人接电话，webhook 叫不醒人
* 数据已经不全在 Prometheus 里了

[阅读完整对比](https://n9e.github.io/zh/comparisons/prometheus-alertmanager.md)

<!-- -->

[ →](https://n9e.github.io/zh/comparisons/prometheus-alertmanager.md)

迁移文档[从 Prometheus + Alertmanager 迁移<!-- --> →](https://n9e.github.io/zh/docs/migration/from-alertmanager.md)

02

## Zabbix

它的路子

用自己的 agent 把数据采全，再在上面告警。

夜莺的路子

直接在你已有的存储上告警，没人采的地方才用 Categraf 补。

### 换的信号

* 监控数据已经在 Prometheus、VictoriaMetrics 或 ES 里
* Kubernetes 和云上服务比网络设备多
* 为了一条告警，维护着两套采集体系

[阅读完整对比](https://n9e.github.io/zh/comparisons/zabbix.md)

<!-- -->

[ →](https://n9e.github.io/zh/comparisons/zabbix.md)

迁移文档[从 Zabbix 迁移<!-- --> →](https://n9e.github.io/zh/docs/migration/from-zabbix.md)

03

## Grafana Alerting

它的路子

告警是可视化平台里的一个模块。

夜莺的路子

告警就是整个产品，图在哪看都行。

### 换的信号

* 告警量已经超出按面板配规则能管的范围
* 需要事件 Pipeline、订阅或告警自愈
* 值班的人要电话短信，不只是 contact point

[阅读完整对比](https://n9e.github.io/zh/comparisons/grafana-alerting.md)

<!-- -->

[ →](https://n9e.github.io/zh/comparisons/grafana-alerting.md)

迁移文档[从 Grafana Alerting 迁移<!-- --> →](https://n9e.github.io/zh/docs/migration/from-grafana-alerting.md)

## 不用停掉现在的系统

夜莺读的是你已有的存储，所以切换是两套并行跑，不是一刀切。

1. 1

   ### 接上现有存储

   把 Prometheus、VictoriaMetrics 或 ES 注册成数据源。采集链路一行不改。

2. 2

   ### 把规则搬过来

   迁移文档把 alertmanager.yml 或 Grafana 告警规则的每一条对应到夜莺的对象上，没有等价物的也明说。

3. 3

   ### 两套并行，按通道切换

   每天对一次两边都触发了什么，通知渠道一个一个切，任何一步都能在一分钟内回退。

[并存与回滚方案<!-- --> →](https://n9e.github.io/zh/docs/migration/coexistence.md)

## 换之前大家常问的

能继续用 Grafana 吗？

能，而且这是最常见的搭配：Grafana 看图，夜莺告警。夜莺的仪表盘也能按 URL 直接嵌入 Grafana 面板。

要替换 Prometheus 吗？

不用。Prometheus 继续采集和存储，数据不用搬，夜莺在上面接管规则、降噪和分发。

Alertmanager 的规则能迁过来吗？

规则、路由、静默、接收器各有对应的夜莺对象。迁移文档把 alertmanager.yml 逐条拆开对应，少数没有等价物的会明确列出。

夜莺能直接读 Zabbix 的数据吗？

不能。从 Zabbix 迁移是一次重建：主机对应 target，模板对应集成，触发器对应规则，采集换成 Categraf。迁移期间 Zabbix 不用停。

什么情况下不该换？

规模不大、团队习惯 GitOps、规则数量能记在脑子里，Prometheus + Alertmanager 就够了。以网络设备和 SNMP 为主的传统 IT 监控，Zabbix 仍然是主场。

## 拿不准？两套一起跑。

夜莺读的是你现有的存储，装上不影响现在正在跑的告警。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/docs/get-started/quick-start.md)
