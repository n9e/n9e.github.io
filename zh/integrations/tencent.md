# 用夜莺监控腾讯云

用 tencentcloud-exporter 把云监控指标转成 Prometheus 格式后抓取，模板覆盖 CVM、CKafka、PostgreSQL、Redis、TDSQL-C 和负载均衡。

最后校对于 2026-10-27

腾讯云的指标来自云监控（Cloud Monitor）。腾讯云官方维护的 `tencentcloud-exporter` 按产品把这些指标转成 `qce_<product>_<metric>` 形式的 Prometheus 指标，用 Categraf 的 `prometheus` 插件抓取即可。

模板按产品各一张仪表盘：CVM 云服务器、CKafka、云数据库 PostgreSQL、Redis 内存版、TDSQL-C（MySQL）以及公网和内网负载均衡。页面下方的指标说明是腾讯云各产品的监控指标清单，含义、单位和统计维度都在。

## 模板里有什么[​](#模��板里有什么 "模板里有什么的直接链接")

* **7 张仪表盘**，共 137 个面板

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

部署 [tencentcloud-exporter](https://github.com/TencentCloud/tencentcloud-exporter)，在配置里填 API 密钥和要采集的产品与地域。确认 `http://<exporter>:9123/metrics` 有输出后，用 Categraf 的 `prometheus` 插件抓取：

```
# conf/input.prometheus/tencentcloud.toml

interval = 60



[[instances]]

urls = ["http://<exporter>:9123/metrics"]

labels = { job = "tencentcloud" }
```

1. 在夜莺「集成中心」里找到 Tencent Cloud，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘           | 面板数 |
| ---------------- | ------ |
| CVM              | 15     |
| Ckafka           | 10     |
| Postgres         | 51     |
| Redis-内存版     | 16     |
| TDSQL-C(Mysql)   | 11     |
| 负载均衡【公网】 | 17     |
| 负载均衡【内网】 | 17     |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Tencent Cloud 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Tencent）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Tencent%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
