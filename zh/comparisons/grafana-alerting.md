1. [产品对比](https://n9e.github.io/zh/zh/comparisons.md)
2. Grafana Alerting

# 夜莺 vs Grafana Alerting

Grafana 是可视化的事实标准，夜莺不打算取代它。要比的是告警这一层：Grafana 把告警做成可视化平台里的一个模块，夜莺把告警做成整个产品。很多团队的最终答案是两个都用：图在 Grafana 看，告警在夜莺发。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/zh/docs/get-started/quick-start.md)

## 30 秒结论

* **继续用 Grafana Alerting，如果**

  告警量不大、规则跟着面板走、联系点用 Slack 或 PagerDuty 就够，团队本来就在 Grafana 里，少一个系统就少一份维护。

* **换夜莺，如果**

  规则数量已经超出按面板管理的范围，需要事件 Pipeline、订阅、自愈，值班的人要电话短信，或者权限要按业务组划分，而不是按文件夹。

* **两个都用，如果**

  仪表盘资产多。Grafana 的数据源可以一键导入夜莺，仪表盘原样留着，夜莺的仪表盘还能按 URL 嵌入 Grafana 面板。

它的路子

告警是可视化平台里的一个模块。

夜莺的路子

告警就是整个产品，图在哪看都行。

## 它擅长什么

Grafana 是可视化的事实标准，仪表盘生态无可替代。如果告警量不大、团队也已经在用 Grafana，它自带的告警足够顺手，少一个系统就少一份维护。

## 什么时候换夜莺

夜莺把力气全花在告警侧：事件 Pipeline、订阅与协同、告警自愈。两者并不冲突——很多用户用 Grafana 看图、用夜莺告警。

## 换的信号

* 告警量已经超出按面板配规则能管的范围
* 需要事件 Pipeline、订阅或告警自愈
* 值班的人要电话短信，不只是 contact point

Grafana · MySQL 总览

按 URL 嵌进夜莺仪表盘的 Grafana 面板

S1MySQL 副本延迟 > 30s

`ident=mysql-prod``busigroup=DBA`

已送达 · 电话 + 钉钉

图在 Grafana 看，告警在夜莺发

* 你

  分析这个仪表盘

* 夜莺 AI

  40 个面板里有 3 个查询的指标已经不存在，2 个面板最近一小时趋势异常：connections 和 slow\_queries。

## 逐项对照

| 能力对比                    | 夜莺 v9                                                                      | Grafana Alerting                                                                                |
| --------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 数据源                      | 内置<!-- -->: 10+ 类型，指标、日志、SQL                                      | 内置<!-- -->: 任何支持告警的 Grafana 数据源                                                     |
| 规则表达式                  | 内置<!-- -->: Prometheus 类把阈值写进 PromQL；日志与 SQL 类有独立触发条件    | 内置<!-- -->: 查询 + Reduce + Threshold 表达式链                                                |
| 规则归属与权限              | 内置<!-- -->: 业务组，同时是权限边界                                         | 部分支持或需扩展<!-- -->: 文件夹 + 组织角色；细粒度 RBAC 是企业版                               |
| 无数据 / 执行错误           | 部分支持或需扩展<!-- -->: 日志与 SQL 类有无数据开关；Prometheus 类要单写规则 | 内置<!-- -->: NoData / Error 状态可配，支持 Keep last state                                     |
| 通知路由                    | 部分支持或需扩展<!-- -->: 平铺的通知规则，各自匹配各自发                     | 内置<!-- -->: 通知策略树，group\_by、continue                                                   |
| 通知媒介                    | 内置<!-- -->: 20 种内置，含电话、短信                                        | 部分支持或需扩展<!-- -->: 联系点：Slack、Teams、PagerDuty、钉钉、企业微信等；电话短信要靠第三方 |
| 值班                        | 部分支持或需扩展<!-- -->: 通知规则 + 订阅规则超时抄送                        | 不支持<!-- -->: OnCall 开源版已于 2026 年 3 月归档，值班在 Cloud 版                             |
| 静默                        | 内置<!-- -->: 固定与周期屏蔽，可只屏蔽通知                                   | 内置<!-- -->: Silence 与 Mute timing                                                            |
| 跨规则抑制                  | 部分支持或需扩展<!-- -->: 用事件 Pipeline 改写                               | 不支持<!-- -->: Grafana 托管告警不支持 inhibit                                                  |
| 事件 Pipeline / 订阅 / 自愈 | 内置<!-- -->: 内置                                                           | 不支持<!-- -->: 无                                                                              |
| 仪表盘                      | 部分支持或需扩展<!-- -->: 内置仪表盘，可嵌 Grafana 面板                      | 内置<!-- -->: 事实标准                                                                          |
| AI                          | 内置<!-- -->: 内置助手与 74 个 MCP 工具                                      | 部分支持或需扩展<!-- -->: Assistant 仅 Cloud 版；开源版靠 LLM 插件和独立的 MCP server           |
| 规则版本与 provisioning     | 部分支持或需扩展<!-- -->: 导出 JSON 进版本库                                 | 内置<!-- -->: 版本历史，文件 / API / Terraform provisioning                                     |
| 许可证                      | 内置<!-- -->: Apache-2.0                                                     | 部分支持或需扩展<!-- -->: AGPL-3.0                                                              |

* 内置
* 部分支持或需扩展
* 不支持

基于各项目 2026 年 8 月开源版本的公开能力，只作选型参考。我们尽量把对方的长处写清楚——选型建议不老实，社区口碑也就没了。

## 对象怎么对应

Grafana 的统一告警拆成夜莺的对象后各自落在哪里。仪表盘、面板、变量一行不动。

| Grafana                  | 夜莺                                                        |
| ------------------------ | ----------------------------------------------------------- |
| 数据源                   | 一键导入（集成中心 → 数据源 → 从 Grafana 导入），密钥要补填 |
| Grafana-managed 告警规则 | 重写：Reduce + Threshold 合成 PromQL                        |
| Data source-managed 规则 | 就是 Prometheus ruler 规则，走 Alertmanager 那条路          |
| 通知策略树               | 拍平成通知规则                                              |
| Contact point            | 通知媒介 + 通知规则                                         |
| Silence / Mute timing    | 固定时间屏蔽 / 周期时间屏蔽或通知配置的适用时段             |
| NoData / Error 状态      | 日志与 SQL 类的无数据开关；Prometheus 类单写 up == 0        |
| runbook\_url             | 规则上的预案链接                                            |

切换时在 Grafana 里把规则暂停而不是删除，要回退一秒就能回来。

[从 Grafana Alerting 迁移<!-- --> →](https://n9e.github.io/zh/zh/docs/migration/from-grafana-alerting.md)[并存与回滚方案<!-- --> →](https://n9e.github.io/zh/zh/docs/migration/coexistence.md)

## 关于这组对比的常见问题

能继续用 Grafana 看图吗？

能，这是最常见的搭配。夜莺读的是同一个 Prometheus 或 Loki，Grafana 面板不受影响；夜莺的仪表盘也能按 URL 嵌入 Grafana 面板。

Grafana 的告警规则能自动导入吗？

规则不能，数据源能。「从 Grafana 导入」会把数据源拉成预览表，勾选后导入，密钥要补填；告警规则因为表达式链和 PromQL 的模型不同，要按迁移文档重写。

Grafana 的 No data 状态在夜莺里怎么处理？

夜莺没有这个状态机。Prometheus 类规则里序列消失等于恢复，想在数据没了时告警，单写一条 up == 0；日志类和 SQL 类规则有「无数据」开关，带自己的级别和自动恢复超时。

夜莺有电话和短信通知吗？

有，内置媒介里包含电话和短信，属于开源版。Grafana 开源版的联系点没有电话短信，Grafana OnCall 开源版已于 2026 年 3 月归档，值班类能力在 Grafana Cloud。

通知策略里的 group\_by 怎么办？

夜莺一次通知只装一个事件，不做标签聚合。如果值班流程依赖「一条消息里看到一组告警」，这是切换前要认下的差异；降噪改靠规则合并、屏蔽规则和订阅规则。

## 其他对比

* [夜莺 vs Prometheus + Alertmanager](https://n9e.github.io/zh/zh/comparisons/prometheus-alertmanager.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/zh/comparisons/prometheus-alertmanager.md)
* [夜莺 vs Zabbix](https://n9e.github.io/zh/zh/comparisons/zabbix.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/zh/comparisons/zabbix.md)
* [产品对比](https://n9e.github.io/zh/zh/comparisons.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/zh/comparisons.md)

## 拿不准？两套一起跑。

夜莺读的是你现有的存储，装上不影响现在正在跑的告警。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/zh/docs/get-started/quick-start.md)
