# 用夜莺监控 Docker

通过 Docker API 采集每个容器的 CPU、内存、块设备和网络 IO 以及守护进程状态，仪表盘按 docker\_\* 指标编写并经过真实验证。

最后校对于 2026-10-28

Docker 插件基于 Telegraf 的 docker 插件，连接 Docker 守护进程的 socket（`unix:///var/run/docker.sock`）或 TCP 端点，采集引擎层面的容器数量与状态、镜像数、存储驱动信息，以及每个容器的 CPU、内存、blkio 和网络 IO。可选采集 Swarm service 和扩展内存统计。

模板里的 `Docker Dashboard` 按这些 `docker_*` 指标编写并完成真实验证，所以必须启用本插件。cAdvisor 也是推荐的容器采集方式，但它输出的是 `container_*` 指标，要用 [cAdvisor 集成](https://n9e.github.io/zh/integrations/cadvisor.md)的仪表盘，两者不能混用。规则覆盖容器 OOM、异常退出、CPU 与内存超限和守护进程不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 16 个面板
* **6 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.docker`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.docker/docker.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.docker started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   ## Docker Endpoint

   ##   To use TCP, set endpoint = "tcp://[ip]:[port]"

   ##   To use environment variables (ie, docker-machine), set endpoint = "ENV"

   # endpoint = "unix:///var/run/docker.sock"

   endpoint = ""



   ## Set to true to collect Swarm metrics(desired_replicas, running_replicas)

   gather_services = false

   gather_extend_memstats = false



   container_id_label_enable = true

   container_id_label_short_style = false



   ## Containers to include and exclude. Globs accepted.

   ## Note that an empty array for both will include all containers

   container_name_include = []

   container_name_exclude = []



   ## Container states to include and exclude. Globs accepted.

   ## When empty only containers in the "running" state will be captured.

   ## example: container_state_include = ["created", "restarting", "running", "removing", "paused", "exited", "dead"]

   ## example: container_state_exclude = ["created", "restarting", "running", "removing", "paused", "exited", "dead"]

   # container_state_include = []

   # container_state_exclude = []



   ## Timeout for docker list, info, and stats commands

   timeout = "5s"



   ## Specifies for which classes a per-device metric should be issued

   ## Possible values are 'cpu' (cpu0, cpu1, ...), 'blkio' (8:0, 8:1, ...) and 'network' (eth0, eth1, ...)

   ## Please note that this setting has no effect if 'perdevice' is set to 'true'

   perdevice_include = []



   ## Specifies for which classes a total metric should be issued. Total is an aggregated of the 'perdevice' values.

   ## Possible values are 'cpu', 'blkio' and 'network'

   ## Total 'cpu' is reported directly by Docker daemon, and 'network' and 'blkio' totals are aggregated by this plugin.

   ## Please note that this setting has no effect if 'total' is set to 'false'

   total_include = ["cpu", "blkio", "network"]



   ## Which environment variables should we use as a tag

   ##tag_env = ["JAVA_HOME", "HEAP_SIZE"]



   ## docker labels to include and exclude as tags. Globs accepted.

   ## Note that an empty array for both will include all labels as tags

   docker_label_include = []

   docker_label_exclude = ["annotation*", "io.kubernetes*", "*description*", "*maintainer*", "*hash", "*author*", "*org_*", "*date*", "*url*", "*docker_compose*"]



   ## Optional TLS Config

   # use_tls = false

   # tls_ca = "/etc/telegraf/ca.pem"

   # tls_cert = "/etc/telegraf/cert.pem"

   # tls_key = "/etc/telegraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

2. 在夜莺「集成中心」里找到 Docker，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘           | 面板数 |
| ---------------- | ------ |
| Docker Dashboard | 16     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 6 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Docker daemon 不可达[​](#docker-daemon-不可达 "Docker daemon 不可达的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
docker_up == 0
```

处置步骤:

1. 登录主机执行 systemctl status docker 确认 daemon 是否存活；
2. 执行 docker ps 手工验证，若卡住不返回说明 daemon 夯死，用 journalctl -u docker -n 200 查看日志定位；
3. 确认 /var/run/docker.sock 权限与采集账号是否匹配；
4. 确认磁盘（尤其 /var/lib/docker 所在分区）未写满，磁盘满是 daemon 夯死的常见原因。

### Docker 容器健康检查失败[​](#docker-容器健康检查失败 "Docker 容器健康检查失败的直接链接")

S1 紧急 · 持续 3 分钟 · 触发条件:

```
docker_container_health_status == 2
```

处置步骤:

1. 从告警标签取 container\_name，执行 docker inspect <容器名>，看输出中 State.Health 字段里最近几次健康检查的输出；
2. 执行 docker logs --tail 200 <容器名> 定位应用报错；
3. 按健康检查命令手工复现（docker exec <容器名> <健康检查命令>）确认是应用故障还是检查命令本身写错；
4. 应用故障且短期修不好时，先把该实例从上游负载均衡摘除再排查。

### Docker 容器被 OOM Kill[​](#docker-容器被-oom-kill "Docker 容器被 OOM Kill的直接链接")

S1 紧急 · 触发条件:

```
docker_container_status_oomkilled == 1
```

处置步骤:

1. 从告警标签取 container\_name，执行 docker inspect <容器名> | grep -i memory 确认当前 limit；
2. 对照 docker\_container\_mem\_max\_usage 的历史峰值，判断是 limit 设太小还是应用内存泄漏；
3. limit 偏小则调大 --memory 后重建容器；
4. 疑似泄漏则在应用侧抓堆（Java 用 jmap、Go 用 pprof）定位，不要只靠调大 limit 掩盖问题。

### Docker 容器反复重启[​](#docker-容器反复重启 "Docker 容器反复重启的直接链接")

S1 紧急 · 触发条件:

```
increase(docker_container_status_restart_count[10m]) > 3
```

处置步骤:

1. 从告警标签取 container\_name，执行 docker logs --tail 200 <容器名> 看每次退出前的报错；
2. 执行 docker inspect <容器名>，看输出中 State.ExitCode 退出码（137 通常是 OOM 或被 kill，1/2 多为应用自身启动失败）；
3. 配置或依赖问题（连不上数据库、配置文件缺失）先修复依赖再拉起；
4. 为避免持续刷日志占满磁盘，定位期间可先 docker stop 该容器并从负载均衡摘除。

### Docker 容器内存使用率逼近上限[​](#docker-容器内存使用率逼近上限 "Docker 容器内存使用率逼近上限的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
docker_container_mem_usage_percent > 90
```

处置步骤:

1. 从告警标签取 container\_name，执行 docker stats --no-stream <容器名> 确认当前用量与 limit；
2. 对照历史曲线判断是持续爬升（疑似泄漏）还是业务高峰的正常波动；
3. 正常波动则调大 --memory 并预留 20% 余量后重建；
4. 持续爬升则在应用侧抓堆定位泄漏点，同时先把 limit 调高争取排查时间。

### Docker 容器 CPU 被限流[​](#docker-容器-cpu-被限流 "Docker 容器 CPU 被限流的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(docker_container_cpu_throttling_throttled_periods[5m]) / rate(docker_container_cpu_throttling_periods[5m]) > 0.25
```

处置步骤:

1. 从告警标签取 container\_name，执行 docker inspect <容器名> | grep -iE 'cpuquota|cpuperiod|nanocpus' 确认当前配额；
2. 对照 docker\_container\_cpu\_usage\_percent 判断是业务量上涨还是应用出现忙等/死循环；
3. 业务量上涨则调大 --cpus 后重建容器，或水平扩容多个实例分摊；
4. 用量异常则在应用侧抓 CPU profile 定位热点函数。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Docker 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Docker）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Docker%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `docker` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/docker)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
