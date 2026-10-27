# 用夜莺监控 Apache

读取 mod\_status 的 server-status?auto 输出，采集请求速率、busy/idle worker、CPU 和流量，规则盯 worker 耗尽和服务不可达。

最后校对于 2026-10-27

Apache httpd 开启 `mod_status` 后，`/server-status?auto` 以机器可读格式输出运行状态。插件抓这个页面，得到总访问量与流量、每秒请求数、busy 与 idle worker、CPU 负载、运行时长，以及各个 worker 的状态分布。

规则覆盖 idle worker 耗尽、请求排队、httpd 不可达和重启。记得限制 server-status 的访问来源。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.apache`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.apache/apache.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.apache started` 就说明插件已加载。

   ```
   [[instances]]



   # https://statuslist.app/apache/apache-status-page-simple-setup-guide/

   # scrape_uri = "http://localhost/server-status/?auto"

   # host_override = ""

   # insecure = false

   # custom_headers = {}

   # log_level = "info"
   ```

2. 在夜莺「集成中心」里找到 Apache，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Apache 实例不可达[​](#apache-实例不可达 "Apache 实例不可达的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
apache_up == 0
```

处置步骤:

1. 登录主机执行 systemctl status httpd（或 apache2）确认 master 进程是否存活；
2. 进程存活则执行 curl -s '<http://127.0.0.1/server-status?auto>' 手工验证状态页是否被 Require 指令或防火墙挡住；
3. 进程不在则先执行 httpd -t 校验配置再启动，并查看 error\_log 尾部定位退出原因（常见为端口占用、证书过期、模块加载失败）；
4. 确认上游负载均衡已把该节点摘除，避免继续打流量。

### Apache 空闲工作进程耗尽[​](#apache-空闲工作进程耗尽 "Apache 空闲工作进程耗尽的直接链接")

S1 紧急 · 持续 3 分钟 · 触发条件:

```
apache_workers{state="idle"} == 0
```

处置步骤:

1. 执行 curl -s '<http://127.0.0.1/server-status?auto>' 查看 Scoreboard，确认 worker 卡在哪个状态（W=正在发送响应说明后端慢，R=读请求说明客户端慢）；
2. 卡在 W 时先查后端（PHP-FPM/数据库/上游接口）是否变慢，用 tail -f access\_log 看响应时间列定位慢 URL；
3. 应急可调大 MaxRequestWorkers 与 ServerLimit 并 graceful 重载，注意同步评估内存（每 worker 内存 × 并发数不能超过物理内存）；
4. 若是被慢客户端拖住，启用 mod\_reqtimeout 并调小 KeepAliveTimeout。

### Apache 工作进程使用率过高[​](#apache-工作进程使用率过高 "Apache 工作进程使用率过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum without (state) (apache_workers{state="busy"}) / sum without (state) (apache_scoreboard) * 100 > 85
```

处置步骤:

1. 执行 curl -s '<http://127.0.0.1/server-status?auto>' 对比 BusyWorkers 与 Scoreboard 中 open\_slot 的余量；
2. 用 tail -n 10000 access\_log | awk 统计 TOP URL 与耗时，判断是正常流量增长还是某个接口变慢把 worker 占住；
3. 流量增长则扩容实例或调大 MaxRequestWorkers（同时按内存重新核算 ServerLimit）；
4. 接口变慢则优先修后端，并对该 URL 配置 mod\_reqtimeout 或限流，避免单接口拖垮整个进程池。

### Apache 平均请求处理耗时过长[​](#apache-平均请求处理耗时过长 "Apache 平均请求处理耗时过长的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(apache_duration_ms_total[5m]) / (rate(apache_accesses_total[5m]) > 0) > 1000
```

处置步骤:

1. 在 access\_log 的 LogFormat 里确认已带 %D（微秒耗时），执行 awk '{print $NF, $7}' access\_log | sort -rn | head -20 找出最慢的 URL；
2. 若慢 URL 集中在动态请求，转去查后端（PHP-FPM 的 slowlog、应用日志、数据库慢查询）；
3. 若慢在静态资源，检查磁盘 IO 与是否误关了 sendfile/缓存；
4. 排查期间可对该 URL 临时加 mod\_ratelimit 或降级，避免 worker 被持续占满。

### Apache 近期发生过重启[​](#apache-近期发生过重启 "Apache 近期发生过重启的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
apache_uptime_seconds_total < 300
```

处置步骤:

1. 先确认是否是计划内发布：查看变更记录与 shell 历史；
2. 非计划则执行 journalctl -u httpd --since '-30min' 与 tail -200 error\_log，定位是 segfault、OOM 还是配置错误；
3. 被 OOM 杀掉的执行 dmesg -T | grep -i 'killed process' 确认，并按每 worker 实际内存下调 MaxRequestWorkers；
4. 反复崩溃时保留 core dump（CoreDumpDirectory）并逐个禁用第三方模块二分定位。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Apache 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Apache）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Apache%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `apache` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/apache)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
