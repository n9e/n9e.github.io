1. [产品对比](https://n9e.github.io/zh/zh/comparisons.md)
2. Zabbix

# 夜莺 vs Zabbix

Zabbix 以主机和监控项为中心，自己采、自己存、自己告警；夜莺以查询为中心，在你已有的 Prometheus、VictoriaMetrics、ES 上判定，没人采的地方才用 Categraf 补。这不是同一类产品的优劣之争，而是两种架构各自适合不同的基础设施。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/zh/docs/get-started/quick-start.md)

## 30 秒结论

* **继续用 Zabbix，如果**

  监控对象以网络设备、SNMP、IPMI 为主，依赖自动发现和 LLD，团队有多年 Zabbix 经验。这些场景里 Zabbix 二十多年的积累，没有哪个开源替代品能完整覆盖。

* **换夜莺，如果**

  指标已经在 Prometheus 或 VictoriaMetrics 里，日志在 ES 或 Loki 里，Kubernetes 和云上服务比机房设备多，或者你正为了一条告警同时维护着 Zabbix Agent 和 exporter 两套采集。

* **两套并行，如果**

  想分批迁。Categraf 和 Zabbix Agent 可以装在同一台机器上，夜莺先只发到一个专用群，每天对一次两边的触发结果，Zabbix 全程不停。

它的路子

用自己的 agent 把数据采全，再在上面告警。

夜莺的路子

直接在你已有的存储上告警，没人采的地方才用 Categraf 补。

## 它擅长什么

Zabbix 二十多年的积累在传统 IT 一体化监控上非常成熟：网络设备、SNMP、agent 采集与自动发现是它的主场，企业里有大量现成经验和人力储备。

## 什么时候换夜莺

如果监控数据已经在 Prometheus、VictoriaMetrics、ES 这类云原生栈里，夜莺接得更直接，不需要把数据再倒进另一套采集体系。

## 换的信号

* 监控数据已经在 Prometheus、VictoriaMetrics 或 ES 里
* Kubernetes 和云上服务比网络设备多
* 为了一条告警，维护着两套采集体系

你已有的存储

![](/zh/img/logos/prometheus.png)Prometheus![](/zh/img/logos/victoriametrics.png)VictoriaMetrics![](/zh/img/logos/elasticsearch.png)ElasticSearch![](/zh/img/logos/ck.png)ClickHouse

![](/zh/img/logo-mark.webp)**夜莺**就地读取，不搬数据

20 种通知媒介

电话 / 短信邮件![](/zh/img/logos/dingtalk.png)钉钉![](/zh/img/logos/feishu.png)飞书+16

没人采的地方，才用 Categraf 补

* 你

  这台主机为什么离线了？

* 夜莺 AI

  agent 3 分钟没有上报，但主机能 ping 通，同网段其他主机正常。更像是 Categraf 进程退出了，不是主机宕机。

## 逐项对照

| 能力对比        | 夜莺 v9                                                                                        | Zabbix                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 采集模型        | 部分支持或需扩展<!-- -->: Categraf 或已有 exporter，按 Remote Write 推送                       | 内置<!-- -->: Zabbix Agent / Agent2、SNMP、IPMI、JMX，自动发现与 LLD          |
| 数据存储        | 内置<!-- -->: 不自存，直接读 Prometheus、VictoriaMetrics、ES、ClickHouse；小规模可用内置时序库 | 内置<!-- -->: 自带 Server + MySQL / PostgreSQL / TimescaleDB                  |
| 告警对象        | 内置<!-- -->: 一条规则覆盖查询返回的所有序列                                                   | 部分支持或需扩展<!-- -->: 触发器逐主机生成，一个模板挂 1000 台就是 1000 组    |
| 规则语法        | 内置<!-- -->: PromQL / SQL / LogQL，随数据源                                                   | 内置<!-- -->: 触发器表达式与函数库                                            |
| 严重级别        | 部分支持或需扩展<!-- -->: S1 / S2 / S3 三档                                                    | 内置<!-- -->: 六档                                                            |
| 触发器依赖      | 部分支持或需扩展<!-- -->: 没有声明式依赖，用事件 Pipeline 改写                                 | 内置<!-- -->: 触发器依赖、事件关联                                            |
| 维护期 / 屏蔽   | 内置<!-- -->: 固定与周期屏蔽，可只屏蔽通知保留事件                                             | 内置<!-- -->: 维护期                                                          |
| 通知媒介        | 内置<!-- -->: 20 种内置，电话、短信、钉钉、飞书、企业微信开箱即用                              | 部分支持或需扩展<!-- -->: 邮件、脚本和 webhook 媒介类型，国内 IM 多靠社区模板 |
| 升级阶梯        | 部分支持或需扩展<!-- -->: 订阅规则按持续时长超时抄送                                           | 内置<!-- -->: 多步骤 Escalation                                               |
| 权限            | 内置<!-- -->: 用户、团队、业务组 RBAC，业务组就是权限边界                                      | 内置<!-- -->: 用户组、角色、主机组权限                                        |
| Kubernetes      | 内置<!-- -->: 读 Prometheus 数据即可，Categraf 带 K8s 插件                                     | 部分支持或需扩展<!-- -->: 官方 Helm 与模板，需要部署它的 agent                |
| 网络设备 / SNMP | 部分支持或需扩展<!-- -->: Categraf 有 SNMP 插件，没有自动发现                                  | 内置<!-- -->: 主场：SNMP、自动发现、网络设备模板                              |
| 日志告警        | 内置<!-- -->: ES、OpenSearch、Loki、VictoriaLogs、ClickHouse                                   | 部分支持或需扩展<!-- -->: 日志监控项加正则，不是查询日志库                    |
| AI / MCP        | 内置<!-- -->: 内置助手与 74 个 MCP 工具                                                        | 不支持<!-- -->: 无                                                            |
| 许可证          | 内置<!-- -->: Apache-2.0                                                                       | 部分支持或需扩展<!-- -->: AGPL-3.0（7.0 起）                                  |

* 内置
* 部分支持或需扩展
* 不支持

基于各项目 2026 年 8 月开源版本的公开能力，只作选型参考。我们尽量把对方的长处写清楚——选型建议不老实，社区口碑也就没了。

## 对象怎么对应

Zabbix 的每类对象在夜莺里叫什么，哪些根本没有对应物。完整映射表和「全程 Zabbix 不停机」的重建顺序见迁移文档。

| Zabbix              | 夜莺                                         |
| ------------------- | -------------------------------------------- |
| Zabbix Server       | 夜莺 + 一个时序库（夜莺不存数据）            |
| Zabbix Agent        | Categraf，或已有 exporter；两者可同机并存    |
| Host / Host group   | 设备（ident）/ 业务组，业务组同时是权限边界  |
| Template            | 模板中心的组件，内置 83 个，导入是一次性拷贝 |
| Item（监控项）      | 没有对应物，采什么由采集器配置决定           |
| Trigger             | 告警规则，一条覆盖查询返回的所有对象         |
| LLD 自动发现        | 没有对应物，查询返回几条序列就是几个对象     |
| Action + Media type | 通知规则 + 通知媒介 + 消息模板               |
| Maintenance         | 屏蔽规则                                     |

夜莺没有 Zabbix 模板或触发器的导入器，也读不了它的 XML / YAML。从 Zabbix 过来是重建而不是搬迁；好消息是工作量比想象的小：内置组件顶掉模板的大部分，一条规则顶掉一整组触发器。

[从 Zabbix 迁移<!-- --> →](https://n9e.github.io/zh/zh/docs/migration/from-zabbix.md)[并存与回滚方案<!-- --> →](https://n9e.github.io/zh/zh/docs/migration/coexistence.md)

## 关于这组对比的常见问题

夜莺能直接读 Zabbix 的数据吗？

不能。夜莺的数据源是 Prometheus、VictoriaMetrics、ES 这类查询后端，Zabbix 的 history / trends 表不在其中。历史数据留在 Zabbix 里当只读查询系统即可，不用搬。

Zabbix 的模板能导入夜莺吗？

不能机械转换。夜莺模板中心内置 83 个组件，覆盖操作系统、数据库、中间件、Kubernetes，大部分 Zabbix 标准模板能找到对应的组件；自定义触发器要按归并方法逐条重写。

夜莺能监控交换机和路由器吗？

能采，但不是主场。Categraf 有 SNMP 插件，可以按 OID 采集并在夜莺上告警，但没有 Zabbix 那样的网络设备自动发现和成熟模板库。网络设备为主的环境，建议 Zabbix 继续管设备，夜莺管云上和应用。

Zabbix 的六档严重性怎么对应？

压到三档：Disaster 和 High 对 S1，Average 和 Warning 对 S2，Information 和 Not classified 对 S3。这一步有信息损失，并行期要按这个映射核对两边的级别。

迁移期间 Zabbix 要停吗？

全程不停。顺序是装 Categraf、定存储、导内置模板、翻译剩余触发器、建通知、搬维护期、并行比对，最后先停 Action 再停 Agent。回退只需把夜莺这批规则批量禁用。

## 其他对比

* [夜莺 vs Prometheus + Alertmanager](https://n9e.github.io/zh/zh/comparisons/prometheus-alertmanager.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/zh/comparisons/prometheus-alertmanager.md)
* [夜莺 vs Grafana Alerting](https://n9e.github.io/zh/zh/comparisons/grafana-alerting.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/zh/comparisons/grafana-alerting.md)
* [产品对比](https://n9e.github.io/zh/zh/comparisons.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/zh/comparisons.md)

## 拿不准？两套一起跑。

夜莺读的是你现有的存储，装上不影响现在正在跑的告警。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/zh/docs/get-started/quick-start.md)
