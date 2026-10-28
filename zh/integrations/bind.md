# 用夜莺监控 BIND DNS

通过 BIND 的 statistics channel（XML v3）采集查询计数、响应码、缓存和内存上下文，规则盯 SERVFAIL 升高和服务不可达。

最后校对于 2026-10-28

BIND 插件从 Telegraf 移植，读取 named 的 statistics channel（默认 `http://localhost:8053/xml/v3`）：收到的各类查询、按 rcode 分类的响应、递归客户端数、socket 与网络计数、各 view 的缓存状态，以及内存上下文的使用。

在 `named.conf` 里配置 `statistics-channels` 并限制访问来源。规则覆盖 SERVFAIL 和 REFUSED 比例升高、递归客户端逼近上限、查询量突降和 named 不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.bind`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.bind/bind.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.bind started` 就说明插件已加载。

   ```
   [[instances]]

   urls = [

       # "http://localhost:8053/xml/v3",

   ]

   gather_memory_contexts = true

   gather_views = true

   timeout = "5s"

   # labels={app="bind"}
   ```

2. 在夜莺「集成中心」里找到 Bind，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### BIND 应答 SERVFAIL 占比过高[​](#bind-应答-servfail-占比过高 "BIND 应答 SERVFAIL 占比过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum without (type) (rate(bind_counter_SERVFAIL[5m])) / (sum without (type) (rate(bind_counter_Response[5m])) > 0) * 100 > 5
```

处置步骤:

1. 执行 rndc querylog 打开查询日志（排查完记得再执行一次关闭），从 named 日志里找出集中报错的域名；
2. 对该域名执行 dig +trace @127.0.0.1 <域名> 判断是上游权威不可达、DNSSEC 校验失败还是转发器故障；
3. DNSSEC 失败可先用 dig +cd 验证，确认后修 trust anchor 或临时对该域配 negative-trust-anchor；
4. 若是转发器问题，检查 forwarders 配置的上游可达性并切到备用 DNS。

### BIND 递归客户端数逼近上限[​](#bind-递归客户端数逼近上�限 "BIND 递归客户端数逼近上限的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
sum without (type) (bind_counter_RecursClients) > 900
```

处置步骤:

1. 执行 rndc status 查看 recursive clients 的实时占用与配置上限；
2. 用 dig +trace 抽查几个慢域名，判断是不是某个上游权威变慢导致递归请求堆积；
3. 确认后可在 options 里调大 recursive-clients（需同步评估内存）并 rndc reload；
4. 若是被恶意查询打满，配置 response-rate-limit 并在 ACL 里收紧 allow-recursion 的来源网段。

### BIND 达到递归客户端上限并丢弃查询[​](#bind-达到递归客户端上限并丢弃查询 "BIND 达到递归客户端上限并丢弃查询的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
sum without (type) (increase(bind_counter_RecLimitDropped[5m])) > 0
```

处置步骤:

1. 立即执行 rndc status 确认 recursive clients 占用；
2. 执行 rndc recursing 导出当前正在递归的查询列表，找出把配额吃满的域名或客户端；
3. 应急先调大 recursive-clients 并 rndc reload 恢复服务；
4. 事后针对定位到的域名检查上游权威健康度，或对异常来源 IP 用 allow-recursion / RRL 限制。

### BIND 递归查询超时率过高[​](#bind-递归查询超时率过高 "BIND 递归查询超时率过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum without (type) (rate(bind_counter_QueryTimeout[5m])) / ((sum without (type) (rate(bind_counter_Queryv4[5m])) + sum without (type) (rate(bind_counter_Queryv6[5m]))) > 0) * 100 > 10
```

处置步骤:

1. 执行 rndc dumpdb -all 后在 dump 文件里查看响应慢的上游服务器；
2. 从 BIND 主机对常见权威做 dig @<权威IP> 与 ping/mtr，区分是上游故障还是本机出口网络丢包；
3. 若是 IPv6 不通导致的超时，在 named 启动参数加 -4 或关闭 IPv6 出口查询；
4. 长期可增配 forwarders 并开启 forward first，减少直接递归到权威的比例。

### BIND 查询被丢弃[​](#bind-查询被丢弃 "BIND 查询被丢弃的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum without (type) (increase(bind_counter_QryDropped[5m])) > 0
```

处置步骤:

1. 查看 named 日志里 client 相关的 dropped 记录，确认被丢的来源 IP 与查询名；
2. 若来源是正常业务网段，检查 allow-query / allow-recursion ACL 是否漏配该网段；
3. 若来源分散且查询名随机，判断为随机子域攻击，启用 response-rate-limit 并考虑加 fetches-per-zone 限制；
4. 配置改完执行 named-checkconf 校验后再 rndc reload。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Bind 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Bind）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Bind%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `bind` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/bind)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
