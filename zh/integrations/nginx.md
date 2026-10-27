# 用夜莺监控 Nginx

stub\_status 够看连接和请求总量，VTS 模块能到每个 server 和 upstream 的状态码与延迟；另带 upstream\_check 健康检查插件。

最后校对于 2026-10-27

Nginx 监控有三个层次。`stub_status` 模块自带，给出活跃连接、accepts、handled、requests 和读写等待数，够做存活与流量趋势。VTS 模块（`nginx-module-vts`）能按 server zone 和 upstream 细分请求数、状态码、响应时间和流量，是最推荐的方式，用 Categraf 的 `prometheus` 插件抓它的 `/status/format/prometheus`。第三个是 `nginx_upstream_check` 插件，读取 upstream\_check 模块的健康检查结果。

模板里三张仪表盘分别对应 stub\_status、upstream 健康检查和 VTS。规则覆盖 Nginx 不可达、活跃连接突增和 upstream 节点被判定为 down。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **3 张仪表盘**，共 24 个面板
* **3 条告警规则**，每条附处置步骤
* **7 条指标说明**
* **Categraf 采集配置**：`input.nginx`、`input.nginx_upstream_check`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.nginx/nginx.toml`

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   ## An array of Nginx stub_status URI to gather stats.

   urls = [

   #    "http://192.168.0.216:8000/nginx_status",

   #    "https://www.baidu.com/ngx_status"

   ]



   ## append some labels for series

   # labels = { region="cloud", product="n9e" }



   ## interval = global.interval * interval_times

   # interval_times = 1



   ## Set response_timeout (default 5 seconds)

   response_timeout = "5s"



   ## Whether to follow redirects from the server (defaults to false)

   # follow_redirects = false



   ## Optional HTTP Basic Auth Credentials

   #username = "admin"

   #password = "admin"



   ## Optional headers

   # headers = ["X-From", "categraf", "X-Xyz", "abc"]



   ## Optional TLS Config

   # use_tls = false

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

   `conf/input.nginx_upstream_check/nginx_upstream_check.toml`

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   targets = [

       # "http://127.0.0.1/status?format=json",

       # "http://10.2.3.56/status?format=json"

   ]



   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   ## Set http_proxy (categraf uses the system wide proxy settings if it's is not set)

   # http_proxy = "http://localhost:8888"



   ## Interface to use when dialing an address

   # interface = "eth0"



   ## HTTP Request Method

   # method = "GET"



   ## Set timeout (default 5 seconds)

   # timeout = "5s"



   ## Whether to follow redirects from the server (defaults to false)

   # follow_redirects = false



   ## Optional HTTP Basic Auth Credentials

   # username = "username"

   # password = "pa$$word"



   ## Optional headers

   # headers = ["X-From", "categraf", "X-Xyz", "abc"]



   ## Optional TLS Config

   # use_tls = false

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

2. 在夜莺「集成中心」里找到 Nginx，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘         | 面板数 |
| -------------- | ------ |
| Nginx Stub     | 6      |
| Nginx Upstream | 3      |
| Nginx VTS      | 15     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 3 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Nginx 实例不可达[​](#nginx-实例不可达 "Nginx 实例不可达的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
nginx_up == 0
```

处置步骤:

1. 登录主机执行 systemctl status nginx 或 ps -ef | grep nginx，确认 master 进程是否存活；
2. 进程存活则执行 curl -s <http://127.0.0.1/nginx_status> 手工验证 stub\_status 是否被 allow/deny 或防火墙挡住；
3. 进程不在则先执行 nginx -t 校验配置再 systemctl start nginx，并查看 error\_log 尾部定位退出原因；
4. 确认上游 VIP 或负载均衡已把该节点摘除，避免继续打流量。

### Nginx 出现连接丢弃[​](#nginx-出现连接丢弃 "Nginx 出现连接丢弃的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
increase(nginx_accepts[5m]) - increase(nginx_handled[5m]) > 0
```

处置步骤:

1. 查看 error\_log 是否有 worker\_connections are not enough 或 too many open files；
2. 按 worker\_processes × worker\_connections 估算连接上限，对照 nginx\_active 当前水位后调大 worker\_connections；
3. 同步调大 worker\_rlimit\_nofile 与 systemd 的 LimitNOFILE；
4. 执行 nginx -s reload 生效后确认 accepts 与 handled 的差值不再增长。

### Nginx upstream 后端节点不可用[​](#nginx-upstream-后端节点不可用 "Nginx upstream 后端节点不可用的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
nginx_upstream_check_status_code == 2
```

处置步骤:

1. 从告警标签取 upstream 与 name（后端地址），在 Nginx 所在主机执行 curl -sv http\://<后端地址>/ 确认是否真的不通；
2. 后端不通则登录该后端主机确认应用进程与端口存活；
3. 后端正常则检查 Nginx 到后端的网络与安全组，以及 check 指令配置的探测路径是否与后端健康检查接口一致；
4. 用 curl http\://\<nginx>/status?format=json 确认同一 upstream 还剩几个可用节点，只剩一个时立即扩容。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 7 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                        | 含义                                                                                                                                                                              | 单位 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `nginx_waiting`             | Nginx stub\_status 当前空闲连接数 — [文档](https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md)                                                            |      |
| `nginx_writing`             | Nginx stub\_status 正在回写 response 的连接数 — [文档](https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md)                                                |      |
| `nginx_active`              | Nginx stub\_status 正在处理的活动连接数 — [文档](https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md) Reading + Writing + Waiting 的总和                   |      |
| `nginx_reading`             | Nginx stub\_status 正在读取 request header 的连接数 — [文档](https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md)                                          |      |
| `irate(nginx_accepts[3m])`  | Nginx stub\_status 每秒 accept 的新连接数 — [文档](https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md)                                                    |      |
| `irate(nginx_handled[3m])`  | Nginx stub\_status 每秒 handle 的新连接数 — [文档](https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md)                                                    |      |
| `irate(nginx_requests[3m])` | Nginx stub\_status 每秒处理的请求数 — [文档](https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md) 如果有 keep-alive 连接的情况，一个连接上会处理多个请求。 |      |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Nginx 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Nginx）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Nginx%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `nginx` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/nginx)：完整配置项和指标列表。
* [Categraf `nginx_upstream_check` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/nginx_upstream_check)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
