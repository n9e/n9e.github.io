# 用夜莺监控 PHP-FPM

开启 pm.status\_path 后，插件通过 HTTP 或 Unix socket 读取 PHP-FPM 的进程池状态：活跃与空闲进程、请求队列、慢请求和达到上限的次数。

最后校对于 2026-10-31

PHP-FPM 插件由 Telegraf 的 phpfpm 改造而来，读取进程池的状态页：接受的连接数、监听队列长度与最大值、空闲与活跃进程、总进程数、达到 `max_children` 的次数、慢请求数。这些是判断 PHP 应用是否被打满的直接依据。

需要在 `php-fpm.conf` 或池配置里开启 `pm.status_path = /status`。通过 HTTP 访问时支持超时、Basic Auth、自定义 header 和 TLS；走 Unix socket 时 Categraf 要和 socket 在同一台机器且有读权限。规则覆盖进程池打满、监听队列积压、慢请求升高和 FPM 不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.phpfpm`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.phpfpm/phpfpm.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.phpfpm started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   ## An array of Nginx stub_status URI to gather stats.

   urls = [

   ## HTTP: the URL must start with http:// or https://, ie:

   #    "http://localhost/status",

   #    "https://www.baidu.com/phpfpm-status",

   ## fcgi: the URL must start with fcgi:// or cgi://, and port must be present, ie:

   #    "fcgi://127.0.0.1:9001",

   #    "cgi://192.168.0.1:9000/status",

   ## Unix socket: path to fpm socket, ie:

   #    "/run/php/php7.2-fpm.sock",

   ##    or using a custom fpm status path:

   #    "/var/run/php5-fpm.sock:/fpm-custom-status-path",

   ##    glob patterns are also supported:

   #    "/var/run/php*.sock"

   ]



   ## append some labels for series

   # labels = { region="cloud", product="n9e" }



   ## interval = global.interval * interval_times

   # interval_times = 1



   ## Set response_timeout (default 5 seconds),HTTP urls only

   response_timeout = "5s"



   ## Whether to follow redirects from the server (defaults to false),HTTP urls only

   # follow_redirects = false



   ## Optional HTTP Basic Auth Credentials,HTTP urls only

   #username = "admin"

   #password = "admin"



   ## Optional headers,HTTP urls only

   # headers = ["X-From", "categraf", "X-Xyz", "abc"]



   ## Optional TLS Config,only http

   # use_tls = false

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

2. 在夜莺「集成中心」里找到 PHP，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### PHP-FPM 触达 max\_children 上限[​](#php-fpm-触达-max_children-上限 "PHP-FPM 触达 max_children 上限的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
increase(phpfpm_max_children_reached[10m]) > 0
```

处置步骤:

1. 从告警标签取 pool，执行 grep -i 'server reached pm.max\_children' /var/log/php-fpm.log 确认发生频次；
2. 用 ps --no-headers -o rss -C php-fpm | awk '{s+=$1} END {print s/NR/1024" MB"}' 算出单进程平均内存，再用 可用内存/单进程内存 反推安全的 max\_children 值；
3. 按算出的值调大 pm.max\_children 并 systemctl reload php-fpm，不要盲目调大导致 OOM；
4. 若单进程内存或耗时异常，去 slowlog 里定位慢脚本，从根因上减少并发占用。

### PHP-FPM 等待队列积压[​](#php-fpm-等待队列积压 "PHP-FPM 等待队列积压的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
phpfpm_listen_queue / (phpfpm_listen_queue_len > 0) * 100 > 30
```

处置步骤:

1. 从告警标签取 pool，执行 curl -s <http://127.0.0.1/status?full> 查看各进程的状态与当前请求 URI；
2. 大量进程停在同一 URI 说明该接口变慢，去 slowlog 与应用日志定位（数据库慢查询、外部接口超时是常见原因）；
3. 短期可调大 pm.max\_children 增加并发处理能力，同时确认内存够用；
4. 队列长度本身过小的（listen.backlog 默认 511），可按并发量调大并同步调大内核 net.core.somaxconn。

### PHP-FPM 空闲进程耗尽[​](#php-fpm-空闲进程耗尽 "PHP-FPM 空闲进程耗尽的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
phpfpm_idle_processes == 0
```

处置步骤:

1. 执行 curl -s <http://127.0.0.1/status?full> 观察各 worker 的 request duration，找出被长请求占住的进程；
2. 确认是并发上来了还是被慢脚本占住：并发上来则扩容或调大 pm.max\_children，慢脚本则先修脚本；
3. 使用 pm=dynamic 的检查 pm.start\_servers 与 pm.min\_spare\_servers 是否过小，导致高峰期来不及拉起新进程；
4. 长期高负载建议改用 pm=static 并按内存算准进程数，避免频繁 fork 抖动。

### PHP-FPM 慢请求增多[​](#php-fpm-慢请求增多 "PHP-FPM 慢请求增多的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(phpfpm_slow_requests[10m]) > 5
```

处置步骤:

1. 执行 tail -100 /var/log/php-fpm/www-slow\.log 查看慢请求的完整调用栈，栈顶函数就是卡住的位置；
2. 卡在 PDO/mysqli 的去数据库看慢查询日志并补索引；卡在 curl/file\_get\_contents 的给外部调用加超时；
3. 卡在 session\_start 的通常是文件 session 锁竞争，改用 Redis session 并及时 session\_write\_close；
4. 若 request\_slowlog\_timeout 设置过低导致噪音，调整该参数而不是忽略告警。

### PHP-FPM 近期发生过重启[​](#php-fpm-近期发生过重启 "PHP-FPM 近期发生过重启的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
phpfpm_start_since < 300
```

处置步骤:

1. 先确认是否是计划内发布或 reload；
2. 非计划则执行 journalctl -u php-fpm --since '-30min' 与 tail -200 /var/log/php-fpm.log 定位退出原因；
3. 执行 dmesg -T | grep -i 'killed process' 确认是否被 OOM 杀掉，是则按单进程实际内存下调 pm.max\_children；
4. 反复重启的检查是否有扩展导致 segfault，用 php -m 逐个排除第三方扩展。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[PHP 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/PHP）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/PHP%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `phpfpm` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/phpfpm)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
