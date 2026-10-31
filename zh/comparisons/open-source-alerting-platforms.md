# 开源告警平台怎么选

「告警平台」这个词指的是监控里最后一层：拿到数据之后，**谁来判定、怎么降噪、发给谁**。采集和存储不在这页的讨论范围，可视化也不在。这一层的开源选择不多，但差别很大。下面先把工具分成三类，再按六个问题逐个过。

## 先分清三类工具[​](#先分清三类工具 "先分清三类工具的直接链接")

| 类别       | 做什么                                       | 代表                                              |
| ---------- | -------------------------------------------- | ------------------------------------------------- |
| 告警引擎   | 自己跑查询、判定、降噪、分发                 | Prometheus + Alertmanager、Grafana Alerting、夜莺 |
| 告警聚合层 | 接收别的系统已经产生的告警，去重、关联、分发 | Keep、Alerta                                      |
| 值班分发   | 排班、升级、电话叫醒                         | 多为商业产品；Grafana OnCall 开源版已归档         |

选型第一步是确定你缺的是哪一层。数据还没有告警，要引擎；已经有三套系统各自在报，要聚合层；告警已经够准只是没人接电话，要值班分发。

## 告警规则写在文件里还是页面上？[​](#告警规则写在文件里还是页面上 "告警规则写在文件里还是页面上？的直接链接")

Alertmanager 的世界里规则是 Prometheus 的 YAML，靠 reload 和 GitOps 管理，没有页面编辑，也没有权限模型。Grafana Alerting 和夜莺都在页面上配，也都能导出导入。区别在于归属：Grafana 按文件夹和组织角色，细粒度 RBAC 在企业版；夜莺按业务组，业务组同时是权限边界，谁能看、谁能改、屏蔽作用在哪，都由它决定。如果只有 SRE 维护规则，文件加 GitOps 最省；如果业务团队要自己配，页面和权限边界是硬需求。

## 想给 Alertmanager 找个图形界面？[​](#想给-alertmanager-找个图形界面 "想给 Alertmanager 找个图形界面？的直接链接")

搜「Alertmanager UI」的人通常想要两种东西之一，答案不一样。

* **更好地查看正在触发的告警。** Alertmanager 自带 Web 界面（9093 端口），能列出告警、创建静默。[karma](https://github.com/prymitive/karma) 提供分组展示和跨多个 Alertmanager 的看板；Grafana 可以把 Alertmanager 加为数据源来浏览告警、管理静默。这些工具都叠在 Alertmanager 之上，不改变它本身。
* **不碰 YAML 就能改规则和路由。** 上面这些工具都做不到：Prometheus 规则和 `alertmanager.yml` 仍然是文件。想在页面上管理规则、路由和屏蔽，并按团队划分权限，就得换掉告警这一层。Grafana Alerting 在 Grafana 内部做到这一点；夜莺是独立的告警引擎，直接查询 Prometheus，[从 Prometheus + Alertmanager 迁移](https://n9e.github.io/zh/docs/migration/from-alertmanager.md)说明了 `alertmanager.yml` 如何对应到夜莺。夜莺不接收 Alertmanager 发来的告警，所以它是替换这一层，而不是叠在上面。

## 数据在一个地方还是好几个地方？[​](#数据在一个地方还是好几个地方 "数据在一个地方还是好几个地方？的直接链接")

Alertmanager 只处理 Prometheus 判定出来的告警（Loki 的告警走它自己的 ruler）。Grafana Alerting 能跨它支持告警的任何数据源。夜莺把 Prometheus、VictoriaMetrics、Elasticsearch、Loki、ClickHouse、MySQL 等 <!-- -->10+<!-- --> 种数据源注册进来，指标、日志、SQL 都能写规则。Keep 和 Alerta 不查数据，它们只接收告警。

## 降噪靠什么：分组、抑制、屏蔽、订阅[​](#降噪靠什么分组抑制屏蔽订阅 "降噪靠什么：分组、抑制、屏蔽、订阅的直接链接")

这是三个引擎差别最大的地方。

* **Alertmanager**：按标签分组成一条消息（`group_by`）、跨规则抑制（`inhibit_rules`）、一次性静默、路由上的周期静音。模型很干净，但都在配置文件里。
* **Grafana Alerting**：内嵌了一个 Alertmanager，分组和静默一致，但 Grafana 托管告警不支持抑制规则。
* **夜莺**：不做标签分组，一次通知一个事件；降噪靠规则层面的合并（一条规则覆盖查询返回的所有序列）、固定和周期屏蔽（可以只屏蔽通知保留事件）、订阅规则（按条件抄送、超时升级）和事件 Pipeline（处理器改写、丢弃、回调）。跨规则抑制没有声明式写法，要用 Pipeline 改写。
* **Keep / Alerta**：去重和关联是它们的主业，但前提是告警已经由别的系统产生。

如果值班流程强依赖「一条消息里看到一组告警」，Alertmanager 系更合适；如果需要按业务条件把事件分发给不同的人、并在分发前改写它，夜莺更合适。

## 值班的人怎么被叫醒？[​](#值班的人怎么被叫醒 "值班的人怎么被叫醒？的直接链接")

开源告警引擎里只有夜莺内置电话和短信媒介，另有钉钉、飞书、企业微信、Slack、Telegram 等共 <!-- -->20<!-- --> 种。Alertmanager 的接收器以邮件、Slack、PagerDuty、webhook 为主；Grafana 的联系点覆盖主流 IM，也没有电话短信。三者都没有排班表：值班排班在开源世界基本只能靠商业产品，Grafana OnCall 开源版已于 2026 年 3 月归档。

## 谁能改规则，权限边界在哪？[​](#谁能改规则权限边界在哪 "谁能改规则，权限边界在哪？的直接链接")

Alertmanager 和 Prometheus 没有认证和权限，靠部署层面隔离。Grafana 开源版有组织角色和文件夹权限。夜莺有用户、团队、业务组三层，规则、屏蔽、订阅、设备都归属业务组，数据源可以按业务组授权。多个业务团队共用一套告警平台时，这一条往往是决定性的。

## AI 能帮上什么忙？[​](#ai-能帮上什么忙 "AI 能帮上什么忙？的直接链接")

Alertmanager 没有内置 AI。Grafana 的 Assistant 只在 Cloud 版，开源版靠 LLM 插件和独立的 MCP server。夜莺进程内置 AI 助手和 <!-- -->74<!-- --> 个 MCP 工具，分 <!-- -->13<!-- --> 个工具集，读工具默认开、写工具默认关、没有删除工具；Claude Code、Cursor 这类客户端直接连 `/mcp` 端点，权限跟着用户的 token 走。Keep 把 AI 用在告警关联上。

## 一张表看完[​](#一张表看完 "一张表看完的直接链接")

| 维度           | Prometheus + Alertmanager | Grafana Alerting     | 夜莺                         | Keep                     | Alerta     |
| -------------- | ------------------------- | -------------------- | ---------------------------- | ------------------------ | ---------- |
| 类别           | 引擎                      | 引擎                 | 引擎                         | 聚合层                   | 聚合层     |
| 规则在哪配     | YAML 文件                 | 页面 + provisioning  | 页面 + 导入导出              | 不判定                   | 不判定     |
| 数据源         | Prometheus                | 支持告警的任意数据源 | 10+<!-- --> 种，指标日志 SQL | 接收告警                 | 接收告警   |
| 分组成一条消息 | 有                        | 有                   | 无                           | 关联                     | 关联       |
| 跨规则抑制     | 有                        | 无                   | Pipeline 改写                | 关联规则                 | 关联规则   |
| 电话短信       | 第三方                    | 第三方               | 内置                         | 第三方                   | 第三方     |
| 权限模型       | 无                        | 角色 + 文件夹        | 业务组 RBAC                  | 有                       | 有         |
| 内置 AI        | 无                        | 仅 Cloud             | 助手 + MCP                   | 告警关联                 | 无         |
| 许可证         | Apache-2.0                | AGPL-3.0             | Apache-2.0                   | 核心开源，另有企业版目录 | Apache-2.0 |

## 按团队画像推荐[​](#按团队画像推荐 "按团队画像推荐的直接链接")

* **小团队，数据全在 Prometheus，习惯 GitOps**：Prometheus + Alertmanager。组件最少，模型最干净。
* **Grafana 重度用户，告警量中等，联系点够用**：Grafana Alerting。少一个系统。
* **多种数据源、业务团队自己配规则、要电话短信和国内 IM、想用 AI 排查**：夜莺。完整对比见[夜莺 vs Prometheus + Alertmanager](https://n9e.github.io/zh/comparisons/prometheus-alertmanager.md)和[夜莺 vs Grafana Alerting](https://n9e.github.io/zh/comparisons/grafana-alerting.md)。
* **已经有三套监控各自在报警，想统一收口**：Keep 或 Alerta 这类聚合层。注意夜莺不是聚合层。
* **从 Zabbix 过来**：先看[Zabbix 替代方案](https://n9e.github.io/zh/comparisons/zabbix-alternatives.md)，再看[夜莺 vs Zabbix](https://n9e.github.io/zh/comparisons/zabbix.md)。

## 常见问题[​](#常见问题 "常见问题的直接链接")

**告警平台和监控系统是一回事吗？**

不是。监控系统通常包含采集、存储、可视化和告警四层；这页说的告警平台只是最后一层：判定、降噪、分发。Prometheus 是存储加判定，Grafana 是可视化加告警模块，夜莺是专做告警这一层的引擎。

**夜莺能接收 Alertmanager 或 Zabbix 发来的告警吗？**

不能。夜莺是告警引擎，自己跑查询判定，没有入站告警接口。要汇聚多个系统已经产生的告警，看 Keep 或 Alerta 这类聚合层。

**Alertmanager 有图形界面吗？**

Alertmanager 自带一个 Web 界面，可以查看告警、创建静默；karma 或 Grafana 能在它之上提供更丰富的告警看板。但它们都不能编辑告警规则和路由，这些仍然写在 YAML 文件里。想在页面上管理规则、路由和屏蔽并带权限控制，就得换掉告警这一层本身，比如换成 Grafana Alerting 或夜莺。

**开源版有电话和短信通知吗？**

夜莺有，电话和短信是开源版内置媒介。Alertmanager 和 Grafana 开源版都没有电话短信，要接 PagerDuty 这类第三方；Grafana OnCall 开源版已于 2026 年 3 月归档。

***

本页基于各项目 2026 年 10 月的公开文档和开源版本，只作选型参考。夜莺的数字来自构建时数据。发现过时或不准确的描述，请在 [GitHub](https://github.com/n9e/n9e.github.io/issues) 提 issue。

本页目录

* [先分清三类工具](#先分清三类工具)
* [告警规则写在文件里还是页面上？](#告警规则写在文件里还是页面上)
* [想给 Alertmanager 找个图形界面？](#想给-alertmanager-找个图形界面)
* [数据在一个地方还是好几个地方？](#数据在一个地方还是好几个地方)
* [降噪靠什么：分组、抑制、屏蔽、订阅](#降噪靠什么分组抑制屏蔽订阅)
* [值班的人怎么被叫醒？](#值班的人怎么被叫醒)
* [谁能改规则，权限边界在哪？](#谁能改规则权限边界在哪)
* [AI 能帮上什么忙？](#ai-能帮上什么忙)
* [一张表看完](#一张表看完)
* [按团队画像推荐](#按团队画像推荐)
* [常见问题](#常见问题)
