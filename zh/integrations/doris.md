# 用夜莺监控 Doris

FE 和 BE 都自带 Prometheus 格式的 /metrics，用 Categraf 的 prometheus 插件抓取即可，模板覆盖查询、导入、Compaction 和节点状态。

最后校对于 2026-10-28

Doris 的 FE（默认 8030）和 BE（默认 8040）进程都通过 `/metrics` 暴露 Prometheus 协议的监控数据，不需要专门插件。给每类节点打上 `group` 和 `job` 标签，仪表盘按这两个标签区分 FE/BE 和集群。

模板覆盖查询 QPS 与延迟、导入任务、Compaction 积压、Tablet 状态、BE 磁盘与内存、节点存活。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 91 个面板
* **21 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.prometheus`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](https://n9e.github.io/zh/docs/data/prometheus.md)，模板同样能用。

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.prometheus/collect_doris_examples.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.prometheus started` 就说明插件已加载。

   ```
   # doris_fe

   [[instances]]

   # 配置 fe metrics 服务地址

   urls = [

        "http://127.0.0.1:8030/metrics"

   ]



   url_label_key = "instance"

   url_label_value = "{{.Host}}"

   # 指定 fe 服务 group 和 job 标签，这里是仪表盘变量调用，可根据实际需求修改。

   labels = { group = "fe",job = "doris_cluster01"}



   # doris_be

   [[instances]]

   # 配置 be metrics 服务地址

   urls = [

        "http://127.0.0.1:8040/metrics"

   ]

   url_label_key = "instance"

   url_label_value = "{{.Host}}"

   # 指定 be 服务 group 和 job 标签，这里是仪表盘变量调用，可根据实际需求修改。

   labels = { group = "be",job = "doris_cluster01"}
   ```

2. 在夜莺「集成中心」里找到 Doris，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘         | 面板数 |
| -------------- | ------ |
| Doris Overview | 91     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 21 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Doris JVM内存使用率[​](#doris-jvm内存使用率 "Doris JVM内存使用率的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum by (ident) (jvm_heap_size_bytes{type="used"}) / sum by (ident) (jvm_heap_size_bytes{type="max"}) > 0.85
```

处置步骤:

1. 用 jstat -gcutil \<pid> 1000 观察 GC 频率与老年代占用；
2. FE 内存高常见于元数据过多（表/分区/tablet 数量爆炸），用 SHOW PROC '/statistic' 看规模；
3. 调大 FE 的 JAVA\_OPTS -Xmx 并重启（滚动重启避免影响）；
4. 根因侧收敛分区数、清理无用表，Doris 元数据全在内存里，规模控制是长期功课。

### Doris\_BE 1 分钟新增tcp包接收错误的次数[​](#doris_be-1-分�钟新增tcp包接收错误的次数 "Doris_BE 1 分钟新增tcp包接收错误的次数的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(doris_be_snmp_tcp_in_errs[1m]) > 0
```

处置步骤:

1. 在该 BE 节点用 netstat -s | grep -i error 看具体错误类型；
2. 用 ethtool -S <网卡> 确认是否有物理层错包；
3. 检查 BE 之间以及 FE 到 BE 的网络质量（mtr）；
4. 确认没有跑满带宽——Doris 查询分片传输是带宽密集的。

### Doris\_BE batch 的线程池队列积压[​](#doris_be-batch-的线程池队列积压 "Doris_BE batch 的线程池队列积压的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_be_add_batch_task_queue_size > 20
```

处置步骤:

1. 用 SHOW PROC '/backends' 确认各 BE 的负载是否均衡；
2. 降低导入任务并发或增大单批数据量，减少小批次导入；
3. 调大 be.conf 的 doris\_max\_pending\_batch\_size / 相关线程池参数后重启 BE；
4. 检查磁盘 IO 是否已打满，导入最终瓶颈通常在盘上。

### Doris\_BE CPU 使用率[​](#doris_be-cpu-使用率 "Doris_BE CPU 使用率的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
(sum(doris_be_cpu)by(instance)-sum(doris_be_cpu{mode=~"idle|iowait"})by(instance))/sum(doris_be_cpu)by(instance)*100 > 70
```

处置步骤:

1. 用 SHOW PROCESSLIST 找当前正在执行的大查询，必要时 KILL 止血；
2. 查 fe.audit.log 定位扫描行数最多的 SQL，补分区裁剪或物化视图；
3. 确认是否有 compaction 在占用大量 CPU（BE 日志里搜 compaction）；
4. 查询量确实增长的则扩容 BE 节点。

### Doris\_BE OlapScanner 线程池积压[​](#doris_be-olapscanner-线程池积压 "Doris_BE OlapScanner 线程池积压的直�接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_be_scanner_thread_pool_queue_size > 0
```

处置步骤:

1. 查 fe.audit.log 找扫描行数最大的 SQL，优先加分区裁剪、前缀索引或物化视图减少扫描量；
2. 用 SHOW PROC '/backends' 看各 BE 是否负载不均；
3. 调大 be.conf 的 doris\_scanner\_thread\_pool\_thread\_num 后重启，但前提是 CPU 有余量；
4. 磁盘 IO 打满的考虑换 SSD 或增加 BE。

### Doris\_BE 发送数据包的线程池出现积压[​](#doris_be-发送数据包的线程池出现积压 "Doris_BE 发送数据包的线程池出现积压的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_be_send_batch_thread_pool_queue_size > 0
```

处置步骤:

1. 检查 BE 之间的网络带宽与延迟（iperf3、mtr）；
2. 确认是否有大结果集查询在做大量 shuffle，用 EXPLAIN 看是否可以改为 colocate join 减少传输；
3. 调大 be.conf 的 send\_batch\_thread\_pool\_thread\_num；
4. 确认网卡未跑满，必要时升级到万兆。

### Doris\_FE 95百分位查询延迟[​](#doris_fe-95百分位查询延迟 "Doris_FE 95百分位查询延迟的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_query_latency_ms{quantile="0.95"} > 5000
```

处置步骤:

1. 在 FE 上用 SHOW PROCESSLIST 看当前慢查询，必要时 KILL \<id> 止血；
2. 查 fe.audit.log 按 QueryTime 排序找出 TOP 慢 SQL；
3. 用 EXPLAIN 看是否命中分区裁剪与索引，检查是否有大表 JOIN 未做 colocate；
4. 结合 BE 侧的 CPU 与扫描线程池队列判断瓶颈在 FE 规划还是 BE 执行。

### Doris\_FE 99百分位查询延迟[​](#doris_fe-99百分位查询延迟 "Doris_FE 99百分位查询延迟的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_query_latency_ms{quantile="0.99"} > 10000
```

处置步骤:

1. 在 FE 上用 SHOW PROCESSLIST 看当前慢查询，必要时 KILL \<id> 止血；
2. 查 fe.audit.log 按 QueryTime 排序找出 TOP 慢 SQL；
3. 用 EXPLAIN 看是否命中分区裁剪与索引，检查是否有大表 JOIN 未做 colocate；
4. 结合 BE 侧的 CPU 与扫描线程池队列判断瓶颈在 FE 规划还是 BE 执行。

### Doris\_FE 事务 publish 耗时95分位[​](#doris_fe-事务-publish-耗时95分位 "Doris_FE 事务 publish 耗时95分位的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_txn_publish_latency_ms{quantile="0.95"} > 5000
```

处置步骤:

1. 查 fe.log 里事务相关的耗时日志，确认是 publish 阶段还是执行阶段慢；
2. publish 慢通常是 BE 响应慢或 tablet 副本不健康——用 SHOW PROC '/statistic' 看不健康副本数；
3. 检查导入任务并发是否过高，适当降低并发或增大单批数据量；
4. 确认 BE 的磁盘 IO 与 compaction 压力。

### Doris\_FE 事务 publish 耗时99分位[​](#doris_fe-事务-publish-耗时99分位 "Doris_FE 事务 publish 耗时99分位的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_txn_publish_latency_ms{quantile="0.99"} > 10000
```

处置步骤:

1. 查 fe.log 里事务相关的耗时日志，确认是 publish 阶段还是执行阶段慢；
2. publish 慢通常是 BE 响应慢或 tablet 副本不健康——用 SHOW PROC '/statistic' 看不健康副本数；
3. 检查导入任务并发是否过高，适当降低并发或增大单批数据量；
4. 确认 BE 的磁盘 IO 与 compaction 压力。

### Doris\_FE 事务执行耗时95分位[​](#doris_fe-事务执行耗时95分位 "Doris_FE 事务执行耗时95分位的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_txn_exec_latency_ms{quantile="0.95"} > 5000
```

处置步骤:

1. 查 fe.log 里事务相关的耗时日志，确认是 publish 阶段还是执行阶段慢；
2. publish 慢通常是 BE 响应慢或 tablet 副本不健康——用 SHOW PROC '/statistic' 看不健康副本数；
3. 检查导入任务并发是否过高，适当降低并发或增大单批数据量；
4. 确认 BE 的磁盘 IO 与 compaction 压力。

### Doris\_FE 事务执行耗时99分位[​](#doris_fe-事务执行耗时99分位 "Doris_FE 事务执行耗时99分位的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_txn_exec_latency_ms{quantile="0.99"} > 10000
```

处置步骤:

1. 查 fe.log 里事务相关的耗时日志，确认是 publish 阶段还是执行阶段慢；
2. publish 慢通常是 BE 响应慢或 tablet 副本不健康——用 SHOW PROC '/statistic' 看不健康副本数；
3. 检查导入任务并发是否过高，适当降低并发或增大单批数据量；
4. 确认 BE 的磁盘 IO 与 compaction 压力。

### Doris\_FE 失败的事务数量[​](#doris_fe-失败的事务数量 "Doris_FE 失败的事务数量的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(doris_fe_txn_counter{type="failed"}[5m]) > 0
```

处置步骤:

1. 查 fe.log 搜索 transaction failed 找到失败原因；
2. 常见为 tablet 副本不足、BE 不可用、超时；用 SHOW PROC '/statistic' 看不健康副本；
3. 确认导入端是否有重试机制，没有的要补上；
4. 修复 BE 或副本问题后重跑失败的导入任务。

### Doris\_FE 异常事务的数量[​](#doris_fe-异常事务的数量 "Doris_FE 异常事务的数量的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum by (type) (doris_fe_txn_status{type=~"aborted|unknown"}) > 0
```

处置步骤:

1. 用 SHOW TRANSACTION WHERE STATUS='ABORTED' 查看具体事务与原因；
2. aborted 多为超时或副本不足，unknown 需要重点排查——它意味着 FE 无法确认最终状态；
3. 修复底层问题（BE 可用性、副本健康）后重新导入；
4. 对 unknown 事务，需与业务侧核对数据是否重复或缺失。

### Doris\_FE 日志写入延迟95分位[​](#doris_fe-日志写入延迟95分位 "Doris_FE 日志写入延迟95分位的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_editlog_write_latency_ms{quantile="0.95"} > 1000
```

处置步骤:

1. editlog 写入慢直接影响所有元数据操作，先用 iostat -x 1 确认 FE 元数据目录所在磁盘是否打满；
2. 确认 FE 元数据目录是否与数据盘混用，建议独占 SSD；
3. 检查 FE 之间的网络延迟——多副本 editlog 需要同步；
4. 排查是否有大量 DDL 或导入任务在短时间内集中提交。

### Doris\_FE 日志写入延迟99分位[​](#doris_fe-日志写入延迟99分位 "Doris_FE 日志写入延迟99分位的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_editlog_write_latency_ms{quantile="0.99"} > 2000
```

处置步骤:

1. editlog 写入慢直接影响所有元数据操作，先用 iostat -x 1 确认 FE 元数据目录所在磁盘是否打满；
2. 确认 FE 元数据目录是否与数据盘混用，建议独占 SSD；
3. 检查 FE 之间的网络延迟——多副本 editlog 需要同步；
4. 排查是否有大量 DDL 或导入任务在短时间内集中提交。

### Doris\_FE 每秒错误查询数[​](#doris_fe-每秒错误查询数 "Doris_FE 每秒错误查询数的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
doris_fe_query_err_rate > 1
```

处置步骤:

1. 查 fe.audit.log 过滤 State=ERR 的记录，看具体报错信息；
2. 区分是语法/权限类（用户侧问题）还是资源/超时类（服务端问题）；
3. 资源类的结合 BE CPU、内存、扫描队列判断瓶颈；
4. 若与近期变更（升级、表结构调整）时间吻合，优先回滚验证。

### Doris\_FE 清理元数据文件失败的次数[​](#doris_fe-清理元数据文件失败的次数 "Doris_FE 清理元数据文件失败的次数的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(doris_fe_image_clean[1m]) > 0
```

处置步骤:

1. 查 fe.log 搜 image clean 相关报错，确认是权限还是磁盘问题；
2. 用 df -h 与 ls -lh \<meta\_dir>/image 确认目录大小与磁盘余量；
3. 权限问题修正目录属主；磁盘满的先清理其他文件；
4. 长期需给 FE 元数据目录单独分配足够空间。

### Doris\_FE 清理元数据日志失败的次数[​](#doris_fe-清理元数据日志失败的次数 "Doris_FE 清理元数据日志失败的次数的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(doris_fe_edit_log_clean[1m]) > 0
```

处置步骤:

1. 查 fe.log 搜 edit log clean 相关报错；
2. 确认元数据目录磁盘余量与权限；
3. 检查是否有 FE 节点长期落后导致日志无法被裁剪——用 SHOW FRONTENDS 看各节点状态；
4. 落后节点无法恢复的，考虑移除后重新加入。

### Doris\_FE 生成元数据镜像文件失败的次数[​](#doris_fe-生成元数据镜像文件失败的次数 "Doris_FE 生成元数据镜像文件失败的次数的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(doris_fe_image_write[1m]) > 0
```

处置步骤:

1. 查 fe.log 搜 image write 相关报错，常见为磁盘空间不足或内存不足；
2. 用 df -h 确认元数据目录余量，用 jstat 确认 FE 堆是否吃紧；
3. 内存不足的调大 FE 的 -Xmx；磁盘不足的清理或扩容；
4. 修复后确认 \<meta\_dir>/image 下有新的 image 文件生成——这一步必须验证。

### Doris\_FE 被拒绝的事务数量[​](#doris_fe-被拒绝的事务数量 "Doris_FE 被拒绝的事务数量的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(doris_fe_txn_counter{type="reject"}[5m]) > 0
```

处置步骤:

1. 查 fe.log 搜 reject 相关日志确认拒绝原因；
2. 最常见是导入并发超过 FE 的事务数上限（max\_running\_txn\_num\_per\_db），用 SHOW PROC '/transactions' 看当前运行中的事务数；
3. 应急可调大 max\_running\_txn\_num\_per\_db，但更根本的是降低导入并发、增大单批数据量；
4. 确认导入端有重试机制，并重跑被拒绝的任务。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Doris 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Doris）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Doris%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `prometheus` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/prometheus)：完整配置项和指标列表。
* [把 Doris 接成数据源](https://n9e.github.io/zh/docs/data/clickhouse-doris-iotdb.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
