# 告警规则

规则在页面上配、按业务组分权限、分 S1 / S2 / S3 三级，一条规则可同时作用于多个数据源。装完就带一批常用规则。

最后校对于 2026-10-10

## [创建第一条规则](https://n9e.github.io/zh/zh/docs/alerting/first-rule.md)

[从零写一条规则：选数据源、写查询、定级别、测试触发、看事件出现。](https://n9e.github.io/zh/zh/docs/alerting/first-rule.md)

## [指标规则](https://n9e.github.io/zh/zh/docs/alerting/metric-rules.md)

[指标规则把阈值写在 PromQL 里，一条规则可带 S1 / S2 / S3 多档级别，查询返回的标签会落到事件上供路由使用。](https://n9e.github.io/zh/zh/docs/alerting/metric-rules.md)

## [日志规则](https://n9e.github.io/zh/zh/docs/alerting/log-rules.md)

[对 ElasticSearch、OpenSearch、Loki、VictoriaLogs 的日志条数或匹配做告警——四种都能告警，但只有三种能在日志检索里预览。](https://n9e.github.io/zh/zh/docs/alerting/log-rules.md)

## [SQL 规则](https://n9e.github.io/zh/zh/docs/alerting/sql-rules.md)

[按计划对 MySQL、PostgreSQL、ClickHouse、Doris、TDengine、IoTDB 执行一条 SQL 的规则。](https://n9e.github.io/zh/zh/docs/alerting/sql-rules.md)

## [按业务组与数据源划定范围](https://n9e.github.io/zh/zh/docs/alerting/scope.md)

[每条规则有两个独立的范围：归属的业务组决定谁能改、事件算谁的；数据源列表决定查询打到哪些实例，一条规则可跨多个。](https://n9e.github.io/zh/zh/docs/alerting/scope.md)

## [标签、附加信息与级别](https://n9e.github.io/zh/zh/docs/alerting/labels-severity.md)

[给路由用的标签、在通知里读得顺的附加信息，以及有意识地选 S1 / S2 / S3。](https://n9e.github.io/zh/zh/docs/alerting/labels-severity.md)

## [判定周期与恢复](https://n9e.github.io/zh/zh/docs/alerting/evaluation.md)

[规则上的四个时间字段——执行频率、持续时长、留观时长、恢复判定——共同决定事件何时产生、何时恢复、何时重复通知。](https://n9e.github.io/zh/zh/docs/alerting/evaluation.md)

## [测试触发](https://n9e.github.io/zh/zh/docs/alerting/test-fire.md)

[手动触发一条规则，在上线前检查查询、标签和渲染出来的通知。](https://n9e.github.io/zh/zh/docs/alerting/test-fire.md)

## [查看判定执行记录](https://n9e.github.io/zh/zh/docs/alerting/execution-records.md)

[每次判定都有记录：看查询返回了什么、事件为什么触发或没触发。](https://n9e.github.io/zh/zh/docs/alerting/execution-records.md)

## [规则模板与内置规则](https://n9e.github.io/zh/zh/docs/alerting/templates.md)

[夜莺自带 MySQL、Redis、Kubernetes 等六十多个组件的规则模板，可导入任意业务组；自己的规则也能存为模板复用。](https://n9e.github.io/zh/zh/docs/alerting/templates.md)

## [导入、导出与复用](https://n9e.github.io/zh/zh/docs/alerting/import-export.md)

[以 JSON 在环境之间搬运规则，并纳入版本控制。](https://n9e.github.io/zh/zh/docs/alerting/import-export.md)

## [规则设计实践](https://n9e.github.io/zh/zh/docs/alerting/best-practices.md)

[规则设计的几条主张：只对需要人处理的事告警，趋势留给仪表盘，一条规则覆盖一类对象，定期回顾让规则集不腐烂。](https://n9e.github.io/zh/zh/docs/alerting/best-practices.md)

## [CPU 负载高，到底应不应该告警？](https://n9e.github.io/zh/zh/docs/faq/cpu-alerting.md)

[从业务影响和处理动作决定 CPU 告警条件、级别和通知方式，为每条需要处理的规则补上排查预案。](https://n9e.github.io/zh/zh/docs/faq/cpu-alerting.md)
