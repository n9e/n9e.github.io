# 用夜莺监控 HAProxy

读取 HAProxy 的 CSV stats 页面或 Runtime API，拿到每个 frontend、backend 和 server 的会话、队列、错误和健康状态。

最后校对于 2026-10-13

HAProxy 插件读取 stats 页面的 CSV 输出（`/stats;csv`）或 Runtime API 的 Unix socket，按 frontend、backend、server 三个层级采集当前与最大会话数、队列长度、请求速率、各类状态码、连接与响应错误、重试与重分发，以及每个后端 server 的健康检查结果。已在真实后端流量上验证。

规则覆盖后端 server 被判定为 DOWN、backend 没有可用 server、队列堆积、5xx 升高和 HAProxy 本身不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 10 个面板
* **8 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.haproxy`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.haproxy/haproxy.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.haproxy started` 就说明插件已加载。

   ```
   [[instances]]

   # URI on which to scrape HAProxy.

   # e.g. 

   # uri = "http://localhost:5000/baz?stats;csv"

   # uri = "http://user:pass@haproxy.example.com/haproxy?stats;csv"

   # uri = "unix:/run/haproxy/admin.sock"

   uri = ""



   # Flag that enables SSL certificate verification for the scrape URI

   ssl_verify = false



   # Comma-separated list of exported server metrics. See http://cbonte.github.io/haproxy-dconv/configuration-1.5.html#9.1

   server_metric_fields = ""



   # Comma-separated list of exported server states to exclude. See https://cbonte.github.io/haproxy-dconv/1.8/management.html#9.1, field 17 status

   server_exclude_states = ""



   # Timeout for trying to get stats from HAProxy.

   timeout = "5s"



   # Flag that enables using HTTP proxy settings from environment variables ($http_proxy, $https_proxy, $no_proxy)

   proxy_from_env = false
   ```

2. 在夜莺「集成中心」里找到 HAProxy，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘              | 面板数 |
| ------------------- | ------ |
| HAProxy By Categraf | 10     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 8 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### HAProxy 实例不可达[​](#haproxy-实例不可达 "HAProxy 实例不可达的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
haproxy_up == 0
```

处置步骤:

1. 登录主机执行 systemctl status haproxy 确认进程是否存活；
2. 进程存活则用 curl -s http\://\<host>:\<port>/stats;csv 手工验证 stats 接口，排查是否被 ACL 或防火墙挡住；
3. 进程不在则先执行 haproxy -c -f /etc/haproxy/haproxy.cfg 校验配置再启动，并看 /var/log/haproxy.log 定位退出原因；
4. 确认上层 VIP（keepalived 等）已完成切换，否则手工把流量切到备节点。

### HAProxy backend 整体不可用[​](#haproxy-backend-整体不可用 "HAProxy backend 整体不可用的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
haproxy_backend_up == 0
```

处置步骤:

1. 从告警标签取 backend 名，执行 echo 'show stat' | socat stdio /var/run/haproxy.sock 查看该 backend 下每台 server 的状态与下线原因；
2. 逐台在 HAProxy 主机上 curl 后端地址，确认是后端集体故障还是 HAProxy 到后端的网络问题；
3. 后端正常则检查 backend 的 check 配置（探测路径、超时、rise/fall）是否过于激进；
4. 短期内无法恢复时，把流量切到备用 backend 或降级页面。

### HAProxy 后端服务器不可用[​](#haproxy-后端服务器不可用 "HAProxy 后端服务器不可用的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
haproxy_server_up == 0
```

处置步骤:

1. 从告警标签取 backend 与 server，登录该后端主机确认应用进程与端口存活；
2. 在 HAProxy 主机上 curl 该后端地址，区分是应用故障还是网络不通；
3. 应用故障则按应用自身的恢复流程处理，恢复后确认 HAProxy 已自动把它重新加回（haproxy\_server\_up 回到 1）；
4. 用 echo 'show stat' | socat stdio /var/run/haproxy.sock 确认同 backend 还剩几台可用，余量不足时立即扩容。

### HAProxy backend 5xx 比例过高[​](#haproxy-backend-5xx-比例过高 "HAProxy backend 5xx 比例过高的直接链接")

S1 紧急 · 持续 3 分钟 · 触发条件:

```
sum by (backend) (rate(haproxy_backend_http_responses_total{code="5xx"}[5m])) / sum by (backend) (rate(haproxy_backend_http_responses_total[5m])) > 0.05
```

处置步骤:

1. 从告警标签取 backend 名，先确认是所有 server 都在报错还是集中在某一台（对比 haproxy\_server\_http\_responses\_total{code="5xx"}）；
2. 集中在单台则把该 server 从 backend 摘除止血；
3. 全量报错则登录后端应用查日志定位根因（依赖超时、连接池耗尽、发布引入的 bug）；
4. 若与近期发布时间吻合，优先回滚而不是继续排查。

### HAProxy backend 请求排队[​](#haproxy-backend-请求排队 "HAProxy backend 请求排队的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
haproxy_backend_current_queue > 0
```

处置步骤:

1. 从告警标签取 backend 名，对照 haproxy\_backend\_http\_response\_time\_average\_seconds 判断是后端变慢还是并发上涨；
2. 后端变慢则去后端应用侧排查（慢查询、GC、依赖超时）；
3. 并发上涨则检查 backend 与 server 上的 maxconn 是否设置过小，适当调大并 reload；
4. 后端容量确实不足时，扩容 server 数量。

### HAProxy frontend 会话数逼近上限[​](#haproxy-frontend-会话数逼近上限 "HAProxy frontend 会话数逼近上限的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
haproxy_frontend_limit_sessions > 0 and haproxy_frontend_current_sessions / haproxy_frontend_limit_sessions > 0.8
```

处置步骤:

1. 从告警标签取 frontend 名，确认是业务量自然增长还是遭遇异常流量（慢连接、爬虫）；
2. 正常增长则调大 frontend 的 maxconn 与 global maxconn，同步确认系统 ulimit -n 与内存足够后 reload；
3. 异常流量则在 frontend 上加 stick-table 限流或直接封禁来源 IP；
4. 检查是否有大量连接处于长时间空闲，可用 timeout client 收敛。

### HAProxy backend 响应时间过高[​](#haproxy-backend-响应时间过高 "HAProxy backend 响应时间过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
haproxy_backend_http_response_time_average_seconds > 1
```

处置步骤:

1. 从告警标签取 backend 名，对比 haproxy\_backend\_http\_connect\_time\_average\_seconds 与 http\_queue\_time\_average\_seconds，区分是建连慢、排队久还是后端处理慢；
2. 排队久按请求排队处理（调 maxconn 或扩容）；
3. 后端处理慢则去应用侧排查慢查询、GC、下游依赖超时；
4. 定位期间可临时调大 timeout server 避免大量请求被截断，但不要当成长期方案。

### HAProxy backend 出现连接错误[​](#haproxy-backend-出现连接错误 "HAProxy backend 出现连接错误的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
increase(haproxy_backend_connection_errors_total[5m]) > 0
```

处置步骤:

1. 从告警标签取 backend 名，用 echo 'show stat' | socat stdio /var/run/haproxy.sock 看是哪台 server 的连接错误在涨；
2. 在 HAProxy 主机上 telnet 或 curl 该后端地址，确认是端口不通、连接被拒还是建连超时；
3. 后端进程正常则排查中间网络、安全组，以及后端的 backlog/somaxconn 是否被打满；
4. 检查 backend 的 timeout connect 是否设置过短导致误判。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[HAProxy 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/HAProxy）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/HAProxy%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `haproxy` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/haproxy)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
