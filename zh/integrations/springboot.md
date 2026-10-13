# 用夜莺监控 Spring Boot 应用

引入 Actuator 和 micrometer-registry-prometheus，应用自己暴露 /actuator/prometheus，模板带按应用名区分的 JVM 仪表盘。

最后校对于 2026-10-13

Spring Boot 应用不需要外挂 agent：引入 `spring-boot-starter-actuator` 和 `micrometer-registry-prometheus` 两个依赖，开放 prometheus 端点，应用就在 `/actuator/prometheus` 暴露 JVM、HTTP 请求、数据源连接池、线程池和自定义指标。Actuator 底层用的就是 Micrometer。

模板里两张 JVM 仪表盘按 Actuator 的指标名（`jvm_memory_used_bytes`、`http_server_requests_seconds` 等）编写，其中一张按 `application` 标签区分多个服务。规则覆盖堆内存逼近上限、GC 停顿过长、HTTP 5xx 升高和线程数异常。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **2 张仪表盘**，共 71 个面板
* **5 条告警规则**，每条附处置步骤

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

Spring Boot 3.x 在 `application.properties` 里加：

```
management.endpoints.web.exposure.include=health,info,prometheus

management.endpoint.prometheus.enabled=true

management.prometheus.metrics.export.enabled=true
```

2.x 把最后一行换成 `management.metrics.export.prometheus.enabled=true`。启动后确认 `http://localhost:8080/actuator/prometheus` 有输出，再用 Categraf 的 `prometheus` 插件抓取，`labels` 里给 `application` 标签填应用名。不要把 `exposure.include` 设成 `*`。

1. 在夜莺「集成中心」里找到 SpringBoot，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                               | 面板数 |
| ------------------------------------ | ------ |
| JVM (Actuator) with application name | 37     |
| JVM仪表盘                            | 34     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### springboot HEAP内存使用率大于85%[​](#springboot-heap内存使用率大于85 "springboot HEAP内存使用率大于85%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum by (instance) (jvm_memory_used_bytes{area="heap"}) * 100 / sum by (instance) (jvm_memory_max_bytes{area="heap"}) > 85
```

处置步骤:

1. 看 jvm\_gc\_pause\_seconds 确认 Full GC 是否变频繁、停顿多长；
2. 用 jmap -histo:live \<pid> 或 arthas 的 heapdump 抓堆，按对象数排序找出异常增长的类；
3. 区分是业务量增长（调大 -Xmx）还是内存泄漏（必须在代码里修复，扩堆只是拖延）；
4. 应急可重启实例释放，但要先抓好堆快照，否则现场就丢了。

### springboot HTTP请求延迟大于10s[​](#springboot-http请求延迟大于10s "springboot HTTP请求延迟大于10s的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
max by (instance, uri) (http_server_requests_seconds_max{status!~"5.."}) > 10
```

处置步骤:

1. 从告警标签取 uri 定位是哪个接口；
2. 用 arthas 的 trace 命令或 APM 链路追踪，看耗时集中在哪一段（数据库、下游 RPC、还是本地计算）；
3. 数据库慢的按慢查询路径排查补索引；下游慢的确认对方状态并加熔断降级；
4. 确认线程池是否已被慢请求占满导致排队放大，必要时隔离线程池。

### springboot HTTP错误数[​](#springboot-http错误数 "springboot HTTP错误数的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum by (instance, uri) (rate(http_server_requests_seconds_count{status=~"5.."}[5m])) > 0
```

处置步骤:

1. 从告警标签取 uri 定位接口，再到应用日志里按该路径搜异常栈；
2. 区分是全量失败还是部分失败——部分失败常见于某个下游实例异常或数据边界条件；
3. 若与近期发布时间吻合，优先回滚而不是继续排查；
4. 确认下游依赖（数据库、缓存、第三方接口）是否同时异常。

### springboot 非堆内存使用率大于85%[​](#springboot-非堆内存使用率大于85 "springboot 非堆内存使用率大于85%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum by (instance) (jvm_memory_max_bytes{area="nonheap"}) > 0 and sum by (instance) (jvm_memory_used_bytes{area="nonheap"}) * 100 / sum by (instance) (jvm_memory_max_bytes{area="nonheap"}) > 85
```

处置步骤:

1. 用 jcmd \<pid> VM.native\_memory summary（需开 NativeMemoryTracking）或 arthas 的 memory 命令看各区占用；
2. Metaspace 持续增长通常是类加载器泄漏——常见于反复热部署、动态代理、脚本引擎；
3. 应急调大 -XX:MaxMetaspaceSize 并重启；
4. 根因侧排查是否有自定义 ClassLoader 未释放，用 jmap -clstats 看类加载器数量是否异常。

### springboot 事件错误数[​](#springboot-事件错误数 "springboot 事件错误数的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum by (instance) (increase(logback_events_total{level="error"}[5m])) > 0
```

处置步骤:

1. 从告警标签取 instance 定位实例，到日志系统里按 level=ERROR 检索该时间窗的异常栈；
2. 按异常类型归类，区分是偶发（下游抖动、超时重试）还是稳定复现（代码 bug、配置错误）；
3. 稳定复现的定位代码修复；偶发的确认重试与降级逻辑是否生效；
4. 若 ERROR 量突增且与发布时间吻合，优先回滚。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[SpringBoot 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/SpringBoot）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/SpringBoot%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [实践：监控 Java 应用](https://n9e.github.io/zh/docs/practice/java.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
