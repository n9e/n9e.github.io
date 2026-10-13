# 用夜莺监控 cAdvisor

抓 kubelet 内置或独立部署的 cAdvisor，拿到每个容器的 CPU、内存、文件系统和网络指标，kubelet 模式下还能附加 Pod 的 label 和 annotation。

最后校对于 2026-10-13

cAdvisor 插件采集 cAdvisor 暴露的 `container_*` 指标：容器级的 CPU 使用与限流、内存工作集与 OOM、文件系统读写、网络收发与丢包。两种接法：`type = "kubelet"` 抓 kubelet 的 `/metrics/cadvisor`（10250 端口，需要鉴权），并且可以把 Pod 的 label 和 annotation 附加到指标上；`type = "cadvisor"` 直接抓独立部署的 cAdvisor（默认 8080）。

模板里的仪表盘按容器维度展示资源使用，指标说明逐条解释 `container_*` 指标的含义。规则覆盖容器 CPU 被限流、内存逼近 limit、OOM 和网络丢包。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 5 个面板
* **6 条告警规则**，每条附处置步骤
* **45 条指标说明**
* **Categraf 采集配置**：`input.cadvisor`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.cadvisor/cadvisor.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.cadvisor started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # url = "https://1.2.3.4:10250"

   # type = "kubelet"

   ## url = "http://1.2.3.4:8080/metrics"

   ## type = "cadvisor"



   # url_label_key = "instance"

   # url_label_value = "{{.Host}}"

   # bearer_token_string = "eyJlonglongxxxx.eyJlonglongyyyy.oQsXlonglongZZZ"

   ## bearer_token_file = "/path/to/token/file"



   # ignore_label_keys = ["id","name", "container_label*"]

   ## choose_label_keys = ["id"]



   # timeout = "3s"



   # use_tls = true

   ## tls_min_version = "1.2"

   ## tls_ca = "/etc/categraf/ca.pem"

   ## tls_cert = "/etc/categraf/cert.pem"

   ## tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   ## insecure_skip_verify = true
   ```

2. 在夜莺「集成中心」里找到 cAdvisor，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘   | 面板数 |
| -------- | ------ |
| cAdvisor | 5      |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 6 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### 容器内存使用率接近上限[​](#容器内存使用率接近上限 "容器内存使用率接近上限的直接链接")

S1 紧急 · 持续 5 分钟 · 触发条件:

```
container_memory_working_set_bytes{name!=""} / (container_spec_memory_limit_bytes{name!=""} > 0) * 100 > 90
```

处置步骤:

1. 从告警标签取 name，执行 docker stats \<name> 或 kubectl top pod 确认实时占用；
2. 进入容器用应用自带的内存分析手段定位（Java 用 jmap -histo:live，Go 看 pprof heap），区分是正常增长还是泄漏；
3. 确认是 limit 配小了则调大 limit 并重新部署，注意同步调整应用自身的堆上限（如 -Xmx 要留出堆外空间）；
4. 确认是泄漏的先按内存增长速度评估还能撑多久，必要时先加自动重启兜底再排查代码。

### 容器发生 OOM[​](#容器发生-oom "容器发生 OOM的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
increase(container_oom_events_total{name!=""}[10m]) > 0
```

处置步骤:

1. 从告警标签取 name，执行 docker inspect \<name> 看输出中 State.OOMKilled 字段，或 kubectl describe pod 确认 OOMKilled 状态；
2. 执行 dmesg -T | grep -i 'killed process' 找到被杀进程与当时的内存用量；
3. 对比该用量与 limit，limit 明显偏小的直接调大；
4. 用量异常的按内存泄漏排查，Java 应用注意 -Xmx 必须小于容器 limit 并给堆外留出空间，否则一定会被 OOM。

### 容器 CPU 被严重限流[​](#容器-cpu-被严重限流 "容器 CPU 被严重限流的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(container_cpu_cfs_throttled_periods_total{name!=""}[5m]) / (rate(container_cpu_cfs_periods_total{name!=""}[5m]) > 0) * 100 > 25
```

处置步骤:

1. 从告警标签取 name，执行 cat /sys/fs/cgroup/cpu.stat（cgroup v2）确认 nr\_throttled 与 throttled\_usec 的增长；
2. 对比容器实际 CPU 使用率与 limit，使用率没到 limit 却被限流的，通常是瞬时突发被 100ms 周期切碎，适当调大 limit 或调小 CPU 周期内的并发；
3. 常见诱因是 JVM/Go 按宿主机核数创建线程池，需显式设置 GOMAXPROCS 或 -XX:ActiveProcessorCount 与 limit 对齐；
4. 确实需要更多算力的直接调大 CPU limit 并观察限流比例是否回落。

### 容器文件系统使用率过高[​](#容器文件系统使用率过高 "容器文件系统使用率过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
container_fs_usage_bytes{name!=""} / (container_fs_limit_bytes{name!=""} > 0) * 100 > 85
```

处置步骤:

1. 从告警标签取 name 与 device，执行 docker exec \<name> du -sh /\* 2>/dev/null | sort -rh | head 找出占用大头；
2. 绝大多数情况是应用日志没有轮转，配置 logrotate 或把日志改为输出到 stdout 由运行时统一轮转；
3. 容器可写层被写满的，把需要持久化的目录改挂 volume，不要写进可写层；
4. 应急可执行 docker system prune 清理无用镜像与停止的容器释放宿主机空间。

### 容器频繁重启[​](#容器频繁重启 "容器频繁重启的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
changes(container_start_time_seconds{name!=""}[1h]) > 3
```

处置步骤:

1. 从告警标签取 name，执行 docker logs --tail 200 \<name> 或 kubectl logs --previous 看上一次退出前的日志；
2. 执行 docker inspect \<name> 看输出中 State.ExitCode 与 State.OOMKilled，区分是 OOM、应用主动退出还是健康检查失败；
3. OOMKilled 的按内存告警处理；退出码非 0 的按应用日志定位启动失败原因（配置缺失、依赖未就绪）；
4. 健康检查导致的确认探针的初始延迟是否小于应用真实启动时间，需要时调大 start period。

### 容器网络接收丢包[​](#容器网络接收丢包 "容器网络接收丢包的直接链接")

S3 提醒 · 持续 5 分钟 · 触发条件:

```
rate(container_network_receive_packets_dropped_total{name!=""}[5m]) > 1
```

处置步骤:

1. 从告警标签取 name，执行 docker exec \<name> cat /proc/net/dev 与 ss -s 确认丢包与队列情况；
2. 接收队列溢出的调大内核 net.core.netdev\_max\_backlog 与应用的 accept 队列（somaxconn）；
3. 检查宿主机网卡是否也有丢包（ethtool -S <网卡> | grep -i drop），是宿主机层面的问题就不要在容器上折腾；
4. 流量确实超过容器网络能力的，评估是否需要改用 host 网络或提升带宽配额。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 45 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                                                                                                                                                                                                   | 含义                                                                                                                                                                                                                                                                                     | 单位    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `irate(container_cpu_system_seconds_total{image!="", image!~".*pause.*"}[3m]) * 100`                                                                                                                                   | 容器 CPU 利用率（system）                                                                                                                                                                                                                                                                | %       |
| `irate(container_cpu_user_seconds_total{image!="", image!~".*pause.*"}[3m]) * 100`                                                                                                                                     | 容器 CPU 利用率（user）                                                                                                                                                                                                                                                                  | %       |
| `sum( irate(container_cpu_usage_seconds_total{image!="", image!~".*pause.*"}[3m]) ) by (pod,namespace,container,image) / sum( container_spec_cpu_quota/container_spec_cpu_period ) by (pod,namespace,container,image)` | 容器 CPU 利用率（整体，值不会大于 100） — 只有设置了 limit 的容器才能计算此利用率                                                                                                                                                                                                        | %       |
| `irate(container_cpu_usage_seconds_total{image!="", image!~".*pause.*"}[3m]) * 100`                                                                                                                                    | 容器 CPU 利用率（整体，值可能大于 100） — 如果是 200% 表示占用了 2 个核                                                                                                                                                                                                                  | %       |
| `irate(container_cpu_cfs_periods_total{}[3m])`                                                                                                                                                                         | 容器 CPU 每秒有多少 period                                                                                                                                                                                                                                                               |         |
| `irate(container_cpu_cfs_throttled_periods_total{}[3m])`                                                                                                                                                               | 容器 CPU 每秒被 throttle 的 period 量 — 如果容器限制了 CPU，而 app 所需算法过多， 会被抑制使用，container\_cpu\_cfs\_throttled\_periods\_total 统计总共有多少个 period 被抑制了，如果近期发生抑制是需要关注的，一些延迟敏感的 app 受影响尤为明显。出现被抑制的情况，大概率是需要升配了。 |         |
| `irate(container_cpu_cfs_throttled_periods_total{}[3m]) / irate(container_cpu_cfs_periods_total{}[3m]) * 100`                                                                                                          | 容器 CPU 被 throttle 的比例 — 这个值大于 0 就要注意                                                                                                                                                                                                                                      | %       |
| `container_fs_usage_bytes / container_fs_limit_bytes * 100`                                                                                                                                                            | 容器 filesystem 使用率                                                                                                                                                                                                                                                                   | %       |
| `container_fs_usage_bytes`                                                                                                                                                                                             | 容器 filesystem 使用量                                                                                                                                                                                                                                                                   | bytes   |
| `container_fs_io_current`                                                                                                                                                                                              | 容器 filesystem 当前 IO 次数                                                                                                                                                                                                                                                             |         |
| `container_fs_limit_bytes`                                                                                                                                                                                             | 容器 filesystem 总量                                                                                                                                                                                                                                                                     | bytes   |
| `container_fs_inodes_free`                                                                                                                                                                                             | 容器 inode free 量                                                                                                                                                                                                                                                                       | 个      |
| `container_fs_inodes_total`                                                                                                                                                                                            | 容器 inode total 量                                                                                                                                                                                                                                                                      | 个      |
| `100 - container_fs_inodes_free / container_fs_inodes_total * 100`                                                                                                                                                     | 容器 inode 使用率                                                                                                                                                                                                                                                                        | %       |
| `sum(irate(container_fs_writes_bytes_total[3m])) by (namespace, pod)`                                                                                                                                                  | 容器 IO 每秒写入 byte 量                                                                                                                                                                                                                                                                 | bytes/s |
| `sum(irate(container_fs_reads_bytes_total[3m])) by (namespace, pod)`                                                                                                                                                   | 容器 IO 每秒读取 byte 量                                                                                                                                                                                                                                                                 | bytes/s |
| `container_memory_cache{image!="", image!~".*pause.*"}`                                                                                                                                                                | 容器 memory cache 量                                                                                                                                                                                                                                                                     | bytes   |
| `100 * container_memory_usage_bytes/container_spec_memory_limit_bytes and container_spec_memory_limit_bytes != 0`                                                                                                      | 容器 memory 使用率（Usage） — 如果有大量文件 IO，有大量 container\_memory\_cache，container\_memory\_usage\_bytes 和 container\_memory\_working\_set\_bytes 的大小会有差异                                                                                                               | %       |
| `100 * container_memory_working_set_bytes/container_spec_memory_limit_bytes and container_spec_memory_limit_bytes != 0`                                                                                                | 容器 memory 使用率（Working Set） — 如果有大量文件 IO，有大量 container\_memory\_cache，container\_memory\_usage\_bytes 和 container\_memory\_working\_set\_bytes 的大小会有差异                                                                                                         | %       |
| `container_memory_mapped_file{image!="", image!~".*pause.*"}`                                                                                                                                                          | 容器 memory 使用量（mapped\_file）                                                                                                                                                                                                                                                       | bytes   |
| `container_memory_rss{image!="", image!~".*pause.*"}`                                                                                                                                                                  | 容器 memory 使用量（RSS）                                                                                                                                                                                                                                                                | bytes   |
| `container_memory_swap{image!="", image!~".*pause.*"}`                                                                                                                                                                 | 容器 memory 使用量（Swap）                                                                                                                                                                                                                                                               | bytes   |
| `container_memory_usage_bytes{image!="", image!~".*pause.*"}`                                                                                                                                                          | 容器 memory 使用量（Usage） — 如果有大量文件 IO，有大量 container\_memory\_cache，container\_memory\_usage\_bytes 和 container\_memory\_working\_set\_bytes 的大小会有差异                                                                                                               | bytes   |
| `container_memory_working_set_bytes{image!="", image!~".*pause.*"}`                                                                                                                                                    | 容器 memory 使用量（Working Set） — 如果有大量文件 IO，有大量 container\_memory\_cache，container\_memory\_usage\_bytes 和 container\_memory\_working\_set\_bytes 的大小会有差异                                                                                                         | bytes   |
| `rate(container_memory_failures_total{}[3m])`                                                                                                                                                                          | 容器 memory 分配失败次数（每秒）                                                                                                                                                                                                                                                         |         |
| `container_spec_memory_limit_bytes{image!="", image!~".*pause.*"}`                                                                                                                                                     | 容器 memory 限制量                                                                                                                                                                                                                                                                       | bytes   |
| `sum(irate(container_network_transmit_bytes_total[3m])) by (namespace, pod) * 8`                                                                                                                                       | 容器 net 每秒发送 bit 量                                                                                                                                                                                                                                                                 | bit/s   |
| `sum(irate(container_network_transmit_bytes_total[3m])) by (namespace, pod)`                                                                                                                                           | 容器 net 每秒发送 byte 量                                                                                                                                                                                                                                                                | bytes/s |
| `irate(container_network_transmit_packets_total[3m])`                                                                                                                                                                  | 容器 net 每秒发送数据包数量                                                                                                                                                                                                                                                              | 个      |
| `irate(container_network_transmit_packets_dropped_total[3m])`                                                                                                                                                          | 容器 net 每秒发送时 drop 包数量                                                                                                                                                                                                                                                          | 个      |
| `irate(container_network_transmit_errors_total[3m])`                                                                                                                                                                   | 容器 net 每秒发送错包数                                                                                                                                                                                                                                                                  | 个      |
| `sum(irate(container_network_receive_bytes_total[3m])) by (namespace, pod) * 8`                                                                                                                                        | 容器 net 每秒接收 bit 量                                                                                                                                                                                                                                                                 | bit/s   |
| `sum(irate(container_network_receive_bytes_total[3m])) by (namespace, pod)`                                                                                                                                            | 容器 net 每秒接收 byte 量                                                                                                                                                                                                                                                                | bytes/s |
| `irate(container_network_receive_packets_total[3m])`                                                                                                                                                                   | 容器 net 每秒接收数据包数量                                                                                                                                                                                                                                                              | 个      |
| `irate(container_network_receive_packets_dropped_total[3m])`                                                                                                                                                           | 容器 net 每秒接收时 drop 包数量                                                                                                                                                                                                                                                          | 个      |
| `irate(container_network_receive_errors_total[3m])`                                                                                                                                                                    | 容器 net 每秒接收错包数                                                                                                                                                                                                                                                                  | 个      |
| `container_threads_max{image!="", image!~".*pause.*"}`                                                                                                                                                                 | 容器允许运行的最大线程数                                                                                                                                                                                                                                                                 |         |
| `container_ulimits_soft{image!="", image!~".*pause.*"}`                                                                                                                                                                | 容器内 1 号进程 soft ulimit 值 — 容器内1号进程的软 ulimit 值。如果为-1，则无限制。                                                                                                                                                                                                       |         |
| `container_start_time_seconds{image!="", image!~".*pause.*"}`                                                                                                                                                          | 容器已经运行的时间                                                                                                                                                                                                                                                                       | s       |
| `container_sockets{image!="", image!~".*pause.*"}`                                                                                                                                                                     | 容器当前打开套接字数量                                                                                                                                                                                                                                                                   |         |
| `container_file_descriptors{image!="", image!~".*pause.*"}`                                                                                                                                                            | 容器当前打开文件句柄数量                                                                                                                                                                                                                                                                 |         |
| `container_threads{image!="", image!~".*pause.*"}`                                                                                                                                                                     | 容器当前运行的线程数                                                                                                                                                                                                                                                                     |         |
| `container_processes{image!="", image!~".*pause.*"}`                                                                                                                                                                   | 容器当前运行的进程数                                                                                                                                                                                                                                                                     |         |
| `container_accelerator_memory_total_bytes`                                                                                                                                                                             | 容器总 GPU 加速卡可用内存量                                                                                                                                                                                                                                                              | bytes   |
| `container_accelerator_memory_used_bytes`                                                                                                                                                                              | 容器正在使用的 GPU 加速卡内存量                                                                                                                                                                                                                                                          | bytes   |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[cAdvisor 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/cAdvisor）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/cAdvisor%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `cadvisor` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/cadvisor)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
