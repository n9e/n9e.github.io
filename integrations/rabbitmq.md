# Monitor RabbitMQ with Nightingale

On 3.8+ scrape the built-in Prometheus plugin on port 15692; older versions go through the management API. Templates are split by version; rules watch queue backlog, unacked messages and node state.

Last reviewed 2026-10-27

RabbitMQ 3.8 and later ship the `rabbitmq_prometheus` plugin: run `rabbitmq-plugins enable rabbitmq_prometheus` and `/metrics` appears on port 15692, which the Categraf `prometheus` input scrapes. Versions below 3.8 enable `rabbitmq_management` instead and use the Categraf `rabbitmq` input against the management API on 15672.

The two paths produce different metric names, so the dashboards are split into 3.8+ and 3.8- editions; import the right one. The rules cover message backlog, too many unacked messages, queues without consumers, memory and disk alarms, and nodes going down. The throughput and backlog panels only show data once real exchanges, queues and traffic exist.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **4 dashboards**, 184 panels in total
* **6 alert rules**, each with runbook steps
* **Categraf collector config**: `input.rabbitmq`, `input.rabbitmq_exporter`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

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

2. Open the integration center in Nightingale, find RabbitMQ, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard     | Panels |
| ------------- | ------ |
| RabbitMQ 3.8+ | 49     |
| RabbitMQ 3.8  | 49     |
| RabbitMQ 3.8+ | 49     |
| RabbitMQ 3.8- | 37     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

6 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### \[RabbitMQ] File Descriptors Near Limit[​](#rabbitmq-file-descriptors-near-limit "Direct link to \[RabbitMQ] File Descriptors Near Limit")

The file descriptors are near to the limit

S2 Warning · for 10 min · Trigger:

```
sum (max_over_time(rabbitmq_process_open_fds[5m])) / sum (rabbitmq_process_max_fds) > 0.8
```

Runbook:

1. On the node, run rabbitmq-diagnostics status and read total\_used against total\_limit under file\_descriptors;
2. Run rabbitmqctl list\_connections to check whether the connection count is abnormal and whether clients fail to reuse connections;
3. Raise the limit by changing LimitNOFILE in systemd or the container ulimit, then restart the node (RabbitMQ reads it once at startup);
4. Also cap the client connection pools instead of relying only on a higher limit.

### \[RabbitMQ] High Connection Churn[​](#rabbitmq-high-connection-churn "Direct link to \[RabbitMQ] High Connection Churn")

There are a high connection churn

S2 Warning · for 10 min · Trigger:

```
( sum(rate(rabbitmq_connections_closed_total[5m]) )  + sum(rate(rabbitmq_connections_opened_total[5m]) ) )/sum (rabbitmq_connections) > 0.1 unless sum (rabbitmq_connections) < 100
```

Runbook:

1. Run rabbitmqctl list\_connections peer\_host user connected\_at to see which clients keep reconnecting;
2. Check whether the client opens a new connection for every message — the correct pattern is a reused long-lived connection with one channel per thread;
3. Check whether heartbeat timeouts or network jitter are causing the server to close connections;
4. Confirm no resource alarm (memory/disk watermark) is blocking connections and driving reconnects.

### \[RabbitMQ] Insufficient Established Erlang Distribution Links[​](#rabbitmq-insufficient-established-erlang-distribution-links "Direct link to \[RabbitMQ] Insufficient Established Erlang Distribution Links")

Insufficient established erlang distribution links

S2 Warning · for 10 min · Trigger:

```
count(erlang_vm_dist_node_state) < count(rabbitmq_build_info) * (count(rabbitmq_build_info) - 1)
```

Runbook:

1. Run rabbitmq-diagnostics cluster\_status on each node and compare the Running Nodes lists to find the unreachable node;
2. Check connectivity on ports 4369 (epmd) and 25672 (distribution) between nodes;
3. Confirm the Erlang cookie is identical across nodes (/var/lib/rabbitmq/.erlang.cookie);
4. If a partition already happened, follow the configured cluster\_partition\_handling strategy and, if needed, restart the minority nodes so they rejoin.

### \[RabbitMQ] Low Disk Watermark Predicted[​](#rabbitmq-low-disk-watermark-predicted "Direct link to \[RabbitMQ] Low Disk Watermark Predicted")

The predicted free disk space in 24 hours from now is low

S2 Warning · for 60 min · Trigger:

```
( predict_linear(rabbitmq_disk_space_available_bytes[24h], 60*60*24) < rabbitmq_disk_space_available_limit_bytes )and( count_over_time(rabbitmq_disk_space_available_limit_bytes[2h] offset 22h) > 0)
```

Runbook:

1. Run rabbitmq-diagnostics status and read the current disk\_free against disk\_free\_limit;
2. Run rabbitmqctl list\_queues name messages message\_bytes to find the most backed-up queues and determine whether consumers dropped out or are simply too slow;
3. Restoring consumption to drain the backlog is the most direct fix;
4. Also clean up other large files on that partition or expand the disk so the watermark never actually blocks publishers.

### \[RabbitMQ] TCP Sockets Near Limit[​](#rabbitmq-tcp-sockets-near-limit "Direct link to \[RabbitMQ] TCP Sockets Near Limit")

The TCP sockets are near to the limit

S2 Warning · for 10 min · Trigger:

```
sum (max_over_time(rabbitmq_process_open_tcp_sockets[5m]))/sum (rabbitmq_process_max_tcp_sockets)> 0.8
```

Runbook:

1. Run rabbitmq-diagnostics status and read sockets\_used against sockets\_total;
2. Run rabbitmqctl list\_connections grouped by source to find the client with an abnormal connection count;
3. For clients that open a new connection per operation, switch to a long-lived connection with multiple channels;
4. If more connections are genuinely needed, raise the node's file descriptor limit (the socket limit derives from it) and restart the node.

### \[RabbitMQ] Unroutable Messages[​](#rabbitmq-unroutable-messages "Direct link to \[RabbitMQ] Unroutable Messages")

There were unroutable message within the last 5 minutes in RabbitMQ cluster

S2 Warning · for 5 min · Trigger:

```
sum (increase(rabbitmq_channel_messages_unroutable_dropped_total[5m])) >= 1 or sum (increase(rabbitmq_channel_messages_unroutable_returned_total[5m])) >= 1
```

Runbook:

1. Run rabbitmqctl list\_exchanges and list\_bindings to confirm the target exchange is not missing a binding;
2. Verify the routing key used by the producer matches the binding rules (mind the wildcards for topic exchanges);
3. Configure an alternate-exchange so unroutable messages land in a fallback queue instead of being dropped;
4. Set the mandatory flag on the producer and handle Basic.Return so routing failures surface immediately.

## Related[​](#related "Direct link to Related")

* [RabbitMQ template source](https://github.com/ccfos/nightingale/tree/main/integrations/RabbitMQ): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `rabbitmq` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/rabbitmq): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
