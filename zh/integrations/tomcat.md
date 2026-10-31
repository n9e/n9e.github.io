# 用夜莺监控 Tomcat

读取 Manager 应用的 /manager/status/all 接口，采集 JVM 内存、各连接器的线程与请求、流量和错误，需要 manager-gui 角色。

最后校对于 2026-10-31

Tomcat 插件访问 Manager 应用的 `/manager/status/all` 接口，解析出 JVM 堆与各内存池的使用、每个连接器（HTTP、AJP）的线程池大小与忙碌数、请求数、处理时间、错误数、收发字节。

这个接口需要鉴权：在 `tomcat-users.xml` 里添加 manager-gui 角色的用户，并放开 `webapps/manager/META-INF/context.xml` 里的 RemoteAddrValve 限制（默认只允许本机访问），否则会收到 403。规则覆盖线程池耗尽、堆内存逼近上限、错误率升高和实例不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 12 个面板
* **6 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.tomcat`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.tomcat/tomcat.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.tomcat started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   # Gather metrics from the Tomcat server status page.

   [[instances]]

   ## URL of the Tomcat server status

   # url = "http://127.0.0.1:8080/manager/status/all?XML=true"

   url = ""



   ## HTTP Basic Auth Credentials

   # username = "tomcat"

   # password = "s3cret"



   ## Request timeout

   # timeout = "5s"



   # # interval = global.interval * interval_times

   # interval_times = 1



   # important! use global unique string to specify instance

   # labels = { instance="192.168.1.2:8080", url="-" }



   ## Optional TLS Config

   # use_tls = false

   # tls_min_version = "1.2"

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = true
   ```

2. 在夜莺「集成中心」里找到 Tomcat，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘            | 面板数 |
| ----------------- | ------ |
| Tomcat - categraf | 12     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 6 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Tomcat 实例不可达[​](#tomcat-实例不可达 "Tomcat 实例不可达的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
tomcat_up == 0
```

处置步骤:

1. 登录主机执行 ps -ef | grep catalina 与 ss -lntp | grep 8080 确认进程与端口；
2. 进程存活则执行 curl -u \<user>:\<pass> '<http://127.0.0.1:8080/manager/status?XML=true>' 验证，401/403 说明 manager 账号或 RemoteAddrValve 限制了采集端 IP；
3. 进程不在则查看 logs/catalina.out 尾部定位退出原因（端口占用、内存不足、应用启动异常）；
4. 确认上游负载均衡已摘除该节点后再重启，避免流量继续打进来。

### Tomcat 线程池接近打满[​](#tomcat-线程池接近打满 "Tomcat 线程池接近打满的直接链接")

S1 紧急 · 持续 3 分钟 · 触发条件:

```
tomcat_connector_current_threads_busy / (tomcat_connector_max_threads > 0) * 100 > 85
```

处置步骤:

1. 从告警标签取 name（Connector 名），用 jstack \<pid> 抓线程栈，统计 http-nio-\* 线程卡在哪个方法上；
2. 大量线程卡在数据库或外部 HTTP 调用，说明是下游拖慢，先修下游并给调用加超时；
3. 应急可调大 server.xml 中该 Connector 的 maxThreads，但要同步评估内存与下游承载能力；
4. 长期建议给外部依赖加熔断（如 Resilience4j），避免下游抖动直接打满 Tomcat 线程池。

### Tomcat 请求错误率过高[​](#tomcat-请求错误率过高 "Tomcat 请求错误率过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(tomcat_connector_error_count[5m]) / (rate(tomcat_connector_request_count[5m]) > 0) * 100 > 5
```

处置步骤:

1. 执行 grep -E ' (5\[0-9]{2}|4\[0-9]{2}) ' logs/localhost\_access\_log.\*.txt | awk '{print $7}' | sort | uniq -c | sort -rn | head 找出报错集中的 URL；
2. 5xx 去 logs/catalina.out 与应用日志里找对应时间点的异常栈；
3. 4xx 集中在个别接口通常是上游传参或鉴权变更，联系调用方确认；
4. 若错误由依赖超时引起，先给依赖调用加超时与降级，避免错误持续放大。

### Tomcat 平均请求处理耗时过长[​](#tomcat-平均请求处理耗时过长 "Tomcat 平均请求处理耗时过长的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(tomcat_connector_processing_time[5m]) / (rate(tomcat_connector_request_count[5m]) > 0) > 1000
```

处置步骤:

1. 在 access log 的 pattern 里确认已带 %D，执行 awk '{print $NF, $7}' localhost\_access\_log.\*.txt | sort -rn | head -20 找出最慢的 URL；
2. 连续 jstack \<pid> 抓 3 次线程栈做对比，定位长期停留的方法；
3. 卡在数据库的去查慢查询与连接池等待（连接池打满时线程会阻塞在 getConnection）；
4. 卡在 GC 的用 jstat -gcutil \<pid> 1s 确认 Full GC 频率，再按堆使用情况调整堆大小或排查内存泄漏。

### Tomcat JVM 堆内存使用率过高[​](#tomcat-jvm-堆内存使用率过高 "Tomcat JVM 堆内存使用率过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
(tomcat_jvm_memory_total - tomcat_jvm_memory_free) / (tomcat_jvm_memory_max > 0) * 100 > 85
```

处置步骤:

1. 执行 jstat -gcutil \<pid> 1s 10 观察 Full GC 频率与回收后老年代占用，回收后仍居高不下说明存在泄漏；
2. 执行 jmap -histo:live \<pid> | head -30 看对象排行，定位异常增长的类；
3. 怀疑泄漏时用 jmap -dump:live,format=b,file=/tmp/heap.hprof \<pid> 导出堆并用 MAT 分析引用链；
4. 确认只是容量不足则调大 -Xmx 并同步评估物理内存，注意留出堆外内存空间。

### Tomcat 老年代内存使用率过高[​](#tomcat-老年代内存使用率过高 "Tomcat 老年代内存使用率过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
tomcat_jvm_memorypool_used{name=~".*Old Gen|Tenured Gen"} / (tomcat_jvm_memorypool_max{name=~".*Old Gen|Tenured Gen"} > 0) * 100 > 90
```

处置步骤:

1. 执行 jstat -gcold \<pid> 1s 10 观察每次 Full GC 后老年代是否能降下来；
2. 降不下来则执行 jmap -histo:live \<pid> | head -30 找出占用最大的对象类型；
3. 常见泄漏点是静态集合、ThreadLocal 未清理、类加载器泄漏（反复热部署导致），可用 jcmd \<pid> GC.class\_stats 辅助确认；
4. 确认无泄漏后再考虑调大 -Xmx 或改用 G1 并调整 -XX:MaxGCPauseMillis。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Tomcat 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Tomcat）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Tomcat%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `tomcat` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/tomcat)：完整配置项和指标列表。
* [实践：监控 Java 应用](https://n9e.github.io/zh/docs/practice/java.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
