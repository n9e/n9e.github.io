# 用夜莺监控 Java 应用（JVM）

JVM 内存、GC、线程和类加载，用 JMX Exporter 或 OpenTelemetry Java Agent 暴露，模板按这两种指标名各备一套仪表盘。

最后校对于 2026-10-13

监控 Java 应用通常就是监控 JVM：堆与非堆内存、各代 GC 的次数与耗时、线程数与死锁、类加载、文件描述符。两种常见的暴露方式指标名不同，模板也分开：

* `JMX` 和 `JMX - Kubernetes`：应用加载 Prometheus JMX Exporter 的 Java Agent，指标是 `jvm_memory_*`、`jvm_gc_collection_seconds_*` 这类。
* `JVM by OpenTelemetry`：应用加载 OpenTelemetry Java Agent，经 OTel Collector 转成 Prometheus 指标。

两套不能混用。Spring Boot 项目还可以走 Actuator，见 [Spring Boot 集成](https://n9e.github.io/zh/integrations/springboot.md)。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **3 张仪表盘**，共 74 个面板

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

以 JMX Exporter 为例：启动参数里加 `-javaagent:jmx_prometheus_javaagent.jar=9404:config.yaml`，确认 `http://<host>:9404/metrics` 有输出，然后用 Categraf 的 `prometheus` 插件抓取：

```
# conf/input.prometheus/java-jmx.toml

[[instances]]

urls = ["http://127.0.0.1:9404/metrics"]

url_label_key = "instance"

url_label_value = "{{.Host}}"

labels = { job = "order-service" }
```

`job` 标签填应用名，仪表盘按它区分服务。已有 Prometheus 在抓的话，直接[接成数据源](https://n9e.github.io/zh/docs/data/prometheus.md)。

1. 在夜莺「集成中心」里找到 Java，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                | 面板数 |
| --------------------- | ------ |
| JMX                   | 26     |
| JMX - Kubernetes      | 26     |
| JVM by OpenTelementry | 22     |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Java 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Java）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Java%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [实践：监控 Java 应用](https://n9e.github.io/zh/docs/practice/java.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
