1. [产品对比](https://n9e.github.io/zh/comparisons.md)
2. Prometheus + Alertmanager

# 夜莺 vs Prometheus + Alertmanager

Prometheus 不用换，exporter 不用换，Grafana 面板不用换。Alertmanager 是这组对比里唯一真正被替掉的组件：规则从 YAML 挪到页面上，路由树拍平成通知规则，静默变成带业务组边界的屏蔽规则。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/docs/get-started/quick-start.md)

## 30 秒结论

* **继续用 Prometheus + Alertmanager，如果**

  团队习惯 GitOps、规则数量能记在脑子里、告警通过 webhook 送进 PagerDuty 这类值班系统就够了。这套组合成熟、省组件，没有理由为换而换。

* **换夜莺，如果**

  规则要交给非 SRE 的业务团队在页面上维护，权限要按业务组划分，值班的人需要电话短信，或者数据已经不只在 Prometheus 里：日志在 ES、业务指标在 MySQL。

* **两套并行，如果**

  想先验证再决定。夜莺把 Prometheus 注册成数据源就能判定同一批规则，Alertmanager 继续发通知，按通知渠道逐个切换，任何一步都能在一分钟内回退。

它的路子

规则写在 YAML 里，靠 GitOps 管。

夜莺的路子

规则配在页面上，按业务组分权限。

## 它擅长什么

Prometheus 依然是最好的时序底座之一，Alertmanager 的分组与静默模型设计得很干净。规模不大、团队习惯 GitOps、告警规则数量可控时，这套组合完全够用，而且不用多引入组件。

## 什么时候换夜莺

当告警规则要交给非 SRE 的业务团队维护、需要按业务组分权限、需要电话短信这类媒介，或者数据不只在 Prometheus 里的时候，夜莺更省事——它就是把这几件事做厚的。

## 换的信号

* 告警规则要交给非 SRE 的业务团队维护
* 凌晨三点得有人接电话，webhook 叫不醒人
* 数据已经不全在 Prometheus 里了

rules.yml + alertmanager.yml

```
- alert: MysqlReplicaLag  expr: mysql_slave_lag_seconds > 30  for: 5m  labels: { team: dba }route:  receiver: dba-webhook  group_by: [alertname]
```

夜莺 · 告警规则

* 名称

  MySQL 副本延迟

* 条件

  mysql\_slave\_lag\_seconds > 30，持续 5m

* 业务组

  DBA

* 通知

  电话、短信、钉钉

* 谁能改

  DBA 组

同一条规则，两种写法

* 你

  一句话创建：mysql-prod 副本延迟超过 30 秒持续 5 分钟，电话通知 DBA 组

* 夜莺 AI

  PromQL 和阈值已生成。业务组我不猜，请从下拉里选一个，选好就创建。

## 逐项对照

| 能力对比    | 夜莺 v9                                                                          | Prometheus + Alertmanager                                                                                          |
| ----------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 数据源      | 内置<!-- -->: 指标、日志、SQL，10+ 类型                                          | 不支持<!-- -->: 只判定 Prometheus 自身的数据                                                                       |
| 规则在哪配  | 内置<!-- -->: 页面配置，按业务组归属，可整份导入 rules.yml                       | 不支持<!-- -->: YAML 文件 + reload，没有页面编辑                                                                   |
| 规则语法    | 内置<!-- -->: PromQL 不变，阈值写在表达式里                                      | 内置<!-- -->: PromQL                                                                                               |
| 通知聚合    | 不支持<!-- -->: 一次通知一个事件，不按标签合并成一条消息                         | 内置<!-- -->: group\_by / group\_wait / group\_interval                                                            |
| 跨规则抑制  | 部分支持或需扩展<!-- -->: 同一规则多档阈值内置抑制；跨规则要用事件 Pipeline 改写 | 内置<!-- -->: inhibit\_rules                                                                                       |
| 静默 / 屏蔽 | 内置<!-- -->: 固定时间与周期时间，可只屏蔽通知保留事件，带业务组边界             | 部分支持或需扩展<!-- -->: 一次性 Silence；周期静默靠路由上的 mute\_time\_intervals                                 |
| 通知媒介    | 内置<!-- -->: 20 种内置，含电话、短信、钉钉、飞书、企业微信                      | 部分支持或需扩展<!-- -->: 邮件、Slack、PagerDuty、Telegram、企业微信、webhook 等；电话、短信、钉钉、飞书要靠第三方 |
| 订阅与协同  | 内置<!-- -->: 订阅规则、超时抄送、事件 Pipeline 处理器                           | 不支持<!-- -->: 无                                                                                                 |
| 权限        | 内置<!-- -->: 用户、团队、业务组 RBAC                                            | 不支持<!-- -->: 没有认证和权限模型                                                                                 |
| 仪表盘      | 部分支持或需扩展<!-- -->: 内置仪表盘，可按 URL 嵌入 Grafana 面板                 | 不支持<!-- -->: 只有表达式浏览器，通常配 Grafana                                                                   |
| 告警自愈    | 内置<!-- -->: ibex 脚本执行                                                      | 不支持<!-- -->: 无                                                                                                 |
| AI / MCP    | 内置<!-- -->: 内置助手与 74 个 MCP 工具                                          | 不支持<!-- -->: 无                                                                                                 |
| 许可证      | 内置<!-- -->: Apache-2.0                                                         | 内置<!-- -->: Apache-2.0，CNCF 毕业项目                                                                            |

* 内置
* 部分支持或需扩展
* 不支持

基于各项目 2026 年 8 月开源版本的公开能力，只作选型参考。我们尽量把对方的长处写清楚——选型建议不老实，社区口碑也就没了。

## 对象怎么对应

一份 rules.yml 加一份 alertmanager.yml，拆开后每一项落到哪里。完整的逐条对应、拍平路由树的方法和四个不对称之处，见迁移文档。

| Prometheus / Alertmanager                 | 夜莺                                               |
| ----------------------------------------- | -------------------------------------------------- |
| rules.yml 里的告警规则                    | 告警规则，整份粘进「导入 Prometheus 告警规则」     |
| 记录规则                                  | 不动，继续由 Prometheus 计算                       |
| receivers\[]                              | 通知媒介 + 通知规则里的通知配置                    |
| route 路由树                              | 拍平：每条从根到叶的路径 AND 成一份通知配置        |
| group\_by / group\_wait / group\_interval | 没有对应物，一次通知只装一个事件                   |
| inhibit\_rules                            | 没有声明式对应物，用事件 Pipeline 的丢弃处理器改写 |
| Silence                                   | 屏蔽规则，必须属于一个业务组                       |
| Alertmanager 集群                         | 多个告警引擎实例按规则分片，不需要 gossip          |

两个最容易踩的坑：夜莺通知配置的「适用级别」一个都不勾等于谁都不匹配；事件缺少某个标签时，!= 和 !\~ 也判为不匹配，而 Alertmanager 把缺失标签当空串。

[从 Prometheus + Alertmanager 迁移<!-- --> →](https://n9e.github.io/zh/docs/migration/from-alertmanager.md)[并存与回滚方案<!-- --> →](https://n9e.github.io/zh/docs/migration/coexistence.md)

## 关于这组对比的常见问题

要替换 Prometheus 吗？

不用。Prometheus 继续抓取和存储，夜莺把它注册成数据源，按周期发 instant query 做判定，数据不用搬。Thanos、Mimir、VictoriaMetrics 同样直接接。

alertmanager.yml 能自动转换吗？

告警规则能：rules.yml 整份粘进「规则管理 → 导入 → 导入 Prometheus 告警规则」。路由、接收器和静默要按迁移文档逐条重建，因为夜莺是平铺的通知规则，不是路由树。

夜莺能接收 Alertmanager 发出的 webhook 吗？

不能。夜莺没有入站告警接口，只有指标写入口，所以不能把 Alertmanager 挂在前面当转发器过渡，规则只能在夜莺里重建。

Alertmanager 的告警分组在夜莺里怎么办？

夜莺一次通知只装一个事件，不按标签把多条告警合并成一条消息。降噪靠规则层面的合并（一条规则覆盖查询返回的所有序列）、屏蔽规则和订阅规则。如果值班流程强依赖分组消息，这是切换前要先认下的差异。

切换要停 Alertmanager 吗？

最后一步才停。前面所有步骤里 Prometheus 和 Alertmanager 都正常运行：夜莺的规则先禁用导入，挑一个业务组做金丝雀，并行比对，最后从 rule\_files 里摘掉告警规则，再停 Alertmanager。

## 其他对比

* [夜莺 vs Zabbix](https://n9e.github.io/zh/comparisons/zabbix.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/comparisons/zabbix.md)
* [夜莺 vs Grafana Alerting](https://n9e.github.io/zh/comparisons/grafana-alerting.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/comparisons/grafana-alerting.md)
* [产品对比](https://n9e.github.io/zh/comparisons.md)
  <!-- -->
  [ →](https://n9e.github.io/zh/comparisons.md)

## 拿不准？两套一起跑。

夜莺读的是你现有的存储，装上不影响现在正在跑的告警。

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)[5 分钟安装](https://n9e.github.io/zh/docs/get-started/quick-start.md)
