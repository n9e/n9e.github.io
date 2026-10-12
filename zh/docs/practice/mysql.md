# MySQL 监控

用 Categraf MySQL 插件采集数据库运行指标，区分性能监控、业务 SQL 查询和夜莺自身的元数据库。

最后校对于 2026-10-11

这页办完，你会采到 MySQL 的连接、运行状态等指标，并分清性能监控和业务 SQL 告警。 配置以 **Categraf v0.5.17、夜莺 v9** 为例。

## 先分清三种用途[​](#choose "先分清三种用途的直接链接")

* **MySQL 性能监控**：采集器连接 MySQL，读取运行状态，再把指标写到时序库。
* **业务 SQL 告警**：夜莺直接查询业务数据库，比如统计失败订单数，见 [SQL 数据源](https://n9e.github.io/zh/zh/docs/data/sql-databases.md)。
* **夜莺元数据库**：保存用户、规则等配置，见[数据库部署](https://n9e.github.io/zh/zh/docs/install/databases.md)；它不自动替代前两条链路。

## 配置采集[​](#configure "配置采集的直接链接")

先完成 [Categraf 安装与注册](https://n9e.github.io/zh/zh/docs/data/categraf/install.md)。准备能从采集机器连接 MySQL 的监控账号，再修改 `conf/input.mysql/mysql.toml`：

```
[[instances]]

address = "127.0.0.1:3306"

username = "monitor"

password = "replace-with-monitor-password"

parameters = "tls=false"

timeout_seconds = 3

gather_table_size = false

gather_slave_status = false

labels = { instance = "mysql-local:3306" }
```

替换地址、密码和唯一的实例标签。跨网络使用 TLS 时按实际证书调整，示例仅适合本地验证。 监控账号需要所启用查询的权限；复制状态、进程列表、表大小等附加采集的权限和开销不同，不要为省事直接使用 root。 需要复制状态时再启用对应选项，按 MySQL 版本确认 `SHOW SLAVE STATUS` 或 `SHOW REPLICA STATUS` 的支持。

多个目标配置多个 `[[instances]]`，每个目标使用不同的 `instance` 标签。 完整选项见 [v0.5.17 配置示例](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.mysql/mysql.toml)。

## 验证[​](#verify "验证的直接链接")

在 Categraf 安装目录执行：

```
./categraf --test --inputs mysql
```

**预期结果**：输出 `mysql_` 前缀的指标，没有认证或 SQL 权限错误。 确认后重启现有 Categraf 服务，在夜莺即时查询中选择存储这些样本的数据源，查找 `mysql_` 指标并核对实例标签。

在集成模板中选择 MySQL 对应的仪表盘和规则。指标不存在时先检查采集，不要直接启用缺失数据上的阈值告警。

## 业务指标[​](#business-metrics "业务指标的直接链接")

订单量、失败任务数等不属于 MySQL 运行状态。 可以使用插件的自定义 SQL 查询，或让夜莺通过 SQL 数据源直接判定；两者分别适合“还要保存趋势”与“直接查询并告警”的需求。 查询使用只读账号，限制扫描范围和执行时间，避免监控 SQL 影响业务。

## 下一步[​](#next "下一步的直接链接")

* [输入插件](https://n9e.github.io/zh/zh/docs/data/categraf/plugins.md)
* [SQL 告警规则](https://n9e.github.io/zh/zh/docs/alerting/sql-rules.md)
