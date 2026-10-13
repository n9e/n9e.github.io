# Redis 监控

配置 Categraf Redis 插件，或抓取已有 Redis Exporter，把运行指标写入时序库并查询验证。

最后校对于 2026-10-11

这页办完，你会把 Redis 的运行指标接入夜莺，已有 Redis Exporter 也可以继续使用。 配置以 **Categraf v0.5.17、夜莺 v9** 为例。

## 直接采集 Redis[​](#direct-collection "直接采集 Redis的直接链接")

插件连接 Redis 并执行 `INFO` 等命令读取运行状态。 完成 [Categraf 安装与注册](https://n9e.github.io/zh/docs/data/categraf/install.md)后，修改 `conf/input.redis/redis.toml`：

```
[[instances]]

address = "127.0.0.1:6379"

username = "monitor"

password = "replace-with-monitor-password"

pool_size = 2

labels = { instance = "redis-local:6379" }
```

替换凭据和实例标签。没有配置 ACL 用户的旧版 Redis，按实际认证方式留空 `username`。 使用监控账号，按启用的功能授权；不要假设只允许 `INFO` 就能运行全部可选采集。 可选慢日志和自定义命令会增加权限需求，按需要启用。 完整字段见 [Redis 配置](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.redis/redis.toml)。

## 复用 Redis Exporter[​](#exporter "复用 Redis Exporter的直接链接")

已有 Prometheus 或 vmagent 抓取 Exporter 时，直接把存储注册为[数据源](https://n9e.github.io/zh/docs/data/overview.md)，无需再重复采集。

也可以让 Categraf 抓取 Exporter，在 `conf/input.prometheus/prometheus.toml` 中增加实例：

```
[[instances]]

urls = ["http://127.0.0.1:9121/metrics"]

url_label_key = "instance"

url_label_value = "{{.Host}}"
```

这是 Exporter 的 HTTP 地址，不是 Redis 的 6379 端口。 从采集机器访问该地址应得到 Prometheus 文本格式的 Redis 指标。

## 验证[​](#verify "验证的直接链接")

按选择的路径测试：

```
./categraf --test --inputs redis

# 使用 Exporter 路径时测试这个插件：

./categraf --test --inputs prometheus
```

**预期结果**：输出 Redis 相关指标，没有认证错误或抓取失败。 重启现有采集服务，在夜莺即时查询里选择目的时序库，搜索 `redis_` 指标并确认实例标签和新样本。

原生插件与 Redis Exporter 的指标命名不完全一致，选择对应的仪表盘与规则，避免导入另一条链路的模板后看到空图。

## 下一步[​](#next "下一步的直接链接")

* [导入仪表盘与规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [Remote Write](https://n9e.github.io/zh/docs/data/categraf/remote-write.md)
