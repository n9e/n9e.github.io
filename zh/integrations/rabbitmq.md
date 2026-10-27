# 用夜莺监控 RabbitMQ

3.8 以上直接抓内置 Prometheus 插件的 15692 端口，旧版本走管理 API；模板按版本分开，规则盯队列积压、未确认消息和节点状态。

最后校对于 2026-10-27

RabbitMQ 3.8 起内置 `rabbitmq_prometheus` 插件，`rabbitmq-plugins enable rabbitmq_prometheus` 后在 15692 端口暴露 `/metrics`，推荐用 Categraf 的 `prometheus` 插件抓取。低于 3.8 的版本启用 `rabbitmq_management`，用 Categraf 的 `rabbitmq` 插件访问 15672 的管理 API。

两条链路的指标名不同，模板里的仪表盘也按 3.8+ 和 3.8- 分开，别导错。规则覆盖队列消息堆积、未确认消息过多、消费者为零、内存与磁盘告警阈值触发、节点宕机。模板要看到吞吐和积压面板，需要真实的 exchange、queue 和收发流量。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **4 张仪表盘**，共 184 个面板
* **6 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.rabbitmq`、`input.rabbitmq_exporter`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.rabbitmq/rabbitmq.toml`

   ```
   # As of 3.8.0, RabbitMQ ships with built-in Prometheus & Grafana support.

   # Support for Prometheus metric collector ships in the rabbitmq_prometheus plugin.

   # The plugin exposes all RabbitMQ metrics on a dedicated TCP port, in Prometheus text format.

   #

   # enable prometheus plugin:

   # `rabbitmq-plugins enable rabbitmq_prometheus`

   # `curl http://localhost:15692/metrics`

   # 

   # then use categraf prometheus plugin scrape http://localhost:15692/metrics instead of this rabbitmq plugin



   # # collect interval

   # interval = 15



   [[instances]]

   # # Management Plugin url

   # url = "http://localhost:15672"

   # username = "guest"

   # password = "guest"



   ## Optional TLS Config

   # use_tls = false

   # tls_min_version = "1.2"

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = true



   ## Optional request timeouts

   ##

   ## ResponseHeaderTimeout, if non-zero, specifies the amount of time to wait

   ## for a server's response headers after fully writing the request.

   # header_timeout = "3s"

   ##

   ## client_timeout specifies a time limit for requests made by this client.

   ## Includes connection time, any redirects, and reading the response body.

   # client_timeout = "4s"



   ## A list of nodes to gather as the rabbitmq_node measurement. If not

   ## specified, metrics for all nodes are gathered.

   # nodes = ["rabbit@node1", "rabbit@node2"]



   ## A list of exchanges to gather as the rabbitmq_exchange measurement. If not

   ## specified, metrics for all exchanges are gathered.

   # exchanges = ["categraf"]



   ## Metrics to include and exclude. Globs accepted.

   ## Note that an empty array for both will include all metrics

   ## Currently the following metrics are supported: "exchange", "federation", "node", "overview", "queue"

   # metric_include = []

   # metric_exclude = []



   ## Queues to include and exclude. Globs accepted.

   ## Note that an empty array for both will include all queues

   # queue_name_include = []

   # queue_name_exclude = []



   ## Federation upstreams to include and exclude specified as an array of glob

   ## pattern strings.  Federation links can also be limited by the queue and

   ## exchange filters.

   # federation_upstream_include = []

   # federation_upstream_exclude = []



   # # interval = global.interval * interval_times

   # interval_times = 1



   # important! use global unique string to specify instance

   # labels = { instance="rabbitmq-001" }
   ```

   `conf/input.rabbitmq_exporter/rabbitmq_exporter.toml`

   ```
   # rabbitmq_exporter 插件，在 categraf 内部集成了 kbudde/rabbitmq_exporter 的采集逻辑，

   # 走 RabbitMQ Management API（默认 15672 端口），指标名与 kbudde 版 exporter 保持兼容，

   # 适合原来就在用独立 rabbitmq_exporter 进程、希望看板和告警规则不改的场景。

   #

   # 前置条件：RabbitMQ 开启 management 插件

   #   rabbitmq-plugins enable rabbitmq_management

   #

   # rabbit_url 是必填项，保持注释状态时该插件不会启用，填上地址才开始采集。



   # # 采集间隔，不配置则沿用 categraf 全局 interval

   # interval = 15



   [[instances]]

     ## RabbitMQ Management API 地址，必填

     # rabbit_url = "http://127.0.0.1:15672"



     ## Management API 的账号密码，不填默认 guest/guest

     # rabbit_user = "guest"

     # rabbit_pass = "guest"



     ## 连接模式：direct 直连节点，loadbalancer 走负载均衡（前面挂了 LB 时用）

     # rabbit_connection = "direct"



     ## 启用哪些 exporter，默认 exchange、node、overview、queue

     ## 可选：exchange、node、overview、queue、connections、federation、shovel、memory、aliveness

     ## connections、memory、shovel 基数较高，生产环境按需开启

     # enabled_exporters = ["exchange", "node", "overview", "queue"]



     ## 请求超时时间，单位秒，默认 30

     # timeout = 30



     ## 正则过滤，控制采集哪些 exchange / queue / vhost

     # skip_exchanges = "^$"

     # include_exchanges = ".*"

     # skip_queues = "^$"

     # include_queues = ".*"

     # skip_vhost = "^$"

     # include_vhost = ".*"



     ## 队列数超过这个值就跳过队列采集，0 表示不限制，队列特别多时用来兜底

     # max_queues = 0



     ## 排除上游的指标字段，例如 ["messages_ready", "mem_used"]

     # exclude_metrics = []



     ## 请求能力声明，除非确认 RabbitMQ 只接受 JSON，否则保持默认

     # rabbit_capabilities = "no_sort,bert"



     ## aliveness exporter 探测哪个 vhost

     # aliveness_vhost = "/"



     ## Management API 是 https 时按需配置

     # use_tls = false

     # tls_min_version = "1.2"

     # tls_ca = "/etc/categraf/ca.pem"

     # tls_cert = "/etc/categraf/cert.pem"

     # tls_key = "/etc/categraf/key.pem"

     ## 跳过证书链和域名校验

     # insecure_skip_verify = false



     ## 采集间隔 = 全局 interval * interval_times

     # interval_times = 1



     ## 附加标签，多实例时建议用 instance 区分

     # labels = { instance = "rabbitmq-001" }
   ```

2. 在夜莺「集成中心」里找到 RabbitMQ，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘               | 面板数 |
| -------------------- | ------ |
| RabbitMQ 3.8+ 中文版 | 49     |
| RabbitMQ 3.8         | 49     |
| RabbitMQ 3.8+        | 49     |
| RabbitMQ 3.8-        | 37     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 6 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### \[RabbitMQ] File Descriptors Near Limit[​](#rabbitmq-file-descriptors-near-limit "\[RabbitMQ] File Descriptors Near Limit的直接链接")

The file descriptors are near to the limit

S2 警告 · 持续 10 分钟 · 触发条件:

```
sum (max_over_time(rabbitmq_process_open_fds[5m])) / sum (rabbitmq_process_max_fds) > 0.8
```

处置步骤:

1. 在节点上执行 rabbitmq-diagnostics status 看 file\_descriptors 的 total\_used 与 total\_limit；
2. 用 rabbitmqctl list\_connections 确认连接数是否异常，排查客户端是否未复用连接；
3. 提高上限：改 systemd 的 LimitNOFILE 或容器的 ulimit 后重启节点（RabbitMQ 启动时读取一次）；
4. 同时收敛客户端连接池，避免只靠调高上限。

### \[RabbitMQ] High Connection Churn[​](#rabbitmq-high-connection-churn "\[RabbitMQ] High Connection Churn的直接链接")

There are a high connection churn

S2 警告 · 持续 10 分钟 · 触发条件:

```
( sum(rate(rabbitmq_connections_closed_total[5m]) )  + sum(rate(rabbitmq_connections_opened_total[5m]) ) )/sum (rabbitmq_connections) > 0.1 unless sum (rabbitmq_connections) < 100
```

处置步骤:

1. 用 rabbitmqctl list\_connections peer\_host user connected\_at 观察哪些客户端在反复重连；
2. 检查客户端是否每次发消息都新建连接——正确做法是长连接复用、每线程一个 channel；
3. 排查是否因心跳超时（heartbeat）或网络抖动导致服务端主动断连；
4. 确认没有触发资源告警（内存/磁盘 watermark）导致连接被阻塞后重连。

### \[RabbitMQ] Insufficient Established Erlang Distribution Links[​](#rabbitmq-insufficient-established-erlang-distribution-links "\[RabbitMQ] Insufficient Established Erlang Distribution Links的直接链接")

Insufficient established erlang distribution links

S2 警告 · 持续 10 分钟 · 触发条件:

```
count(erlang_vm_dist_node_state) < count(rabbitmq_build_info) * (count(rabbitmq_build_info) - 1)
```

处置步骤:

1. 在各节点执行 rabbitmq-diagnostics cluster\_status，对比 Running Nodes 找出失联的节点；
2. 检查节点间 4369（epmd）与 25672（distribution）端口的连通性；
3. 确认各节点 Erlang cookie 一致（/var/lib/rabbitmq/.erlang.cookie）；
4. 若已发生分区，按配置的 cluster\_partition\_handling 策略处理，必要时重启少数派节点让其重新加入。

### \[RabbitMQ] Low Disk Watermark Predicted[​](#rabbitmq-low-disk-watermark-predicted "\[RabbitMQ] Low Disk Watermark Predicted的直接链接")

The predicted free disk space in 24 hours from now is low

S2 警告 · 持续 60 分钟 · 触发条件:

```
( predict_linear(rabbitmq_disk_space_available_bytes[24h], 60*60*24) < rabbitmq_disk_space_available_limit_bytes )and( count_over_time(rabbitmq_disk_space_available_limit_bytes[2h] offset 22h) > 0)
```

处置步骤:

1. 用 rabbitmq-diagnostics status 看 disk\_free 与 disk\_free\_limit 的当前值；
2. 用 rabbitmqctl list\_queues name messages message\_bytes 找出堆积最多的队列，确认是消费者掉线还是消费太慢；
3. 先恢复消费把积压清掉，这是最直接的止血手段；
4. 同时清理该分区上的其他大文件或扩容磁盘，避免真正触发 watermark 阻塞生产。

### \[RabbitMQ] TCP Sockets Near Limit[​](#rabbitmq-tcp-sockets-near-limit "\[RabbitMQ] TCP Sockets Near Limit的直接链接")

The TCP sockets are near to the limit

S2 警告 · 持续 10 分钟 · 触发条件:

```
sum (max_over_time(rabbitmq_process_open_tcp_sockets[5m]))/sum (rabbitmq_process_max_tcp_sockets)> 0.8
```

处置步骤:

1. 用 rabbitmq-diagnostics status 看 sockets\_used 与 sockets\_total；
2. 用 rabbitmqctl list\_connections 按来源统计，定位连接数异常的客户端；
3. 客户端每次操作都新建连接的，改为长连接 + 多 channel 复用；
4. 确需更多连接时，调大节点的文件句柄上限（socket 上限由它推导）后重启节点。

### \[RabbitMQ] Unroutable Messages[​](#rabbitmq-unroutable-messages "\[RabbitMQ] Unroutable Messages的直接链接")

There were unroutable message within the last 5 minutes in RabbitMQ cluster

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum (increase(rabbitmq_channel_messages_unroutable_dropped_total[5m])) >= 1 or sum (increase(rabbitmq_channel_messages_unroutable_returned_total[5m])) >= 1
```

处置步骤:

1. 用 rabbitmqctl list\_exchanges 与 list\_bindings 确认目标 exchange 的绑定关系是否缺失；
2. 核对生产端使用的 routing key 与绑定规则是否匹配（topic 类型注意通配符）；
3. 给 exchange 配置 alternate-exchange，把无法路由的消息兜到备用队列而不是丢弃；
4. 生产端开启 mandatory 标志并处理 Basic.Return，及时发现路由失败。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[RabbitMQ 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/RabbitMQ）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/RabbitMQ%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `rabbitmq` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/rabbitmq)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
