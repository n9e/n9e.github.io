# 用夜莺监控 DNS 解析质量

用本机或指定的 DNS 服务器查询一组域名，上报解析耗时、返回码和记录数，第一时间发现解析慢或解析失败。

最后校对于 2026-10-28

dns\_query 插件向指定的 DNS 服务器（可以是本机配置的，也可以是外部的公共 DNS）查询 `domains` 里的域名，支持 A、AAAA、CNAME、MX、TXT 等记录类型，上报查询耗时、rcode、返回的记录数和结果值。

通常不需要每台机器都开，挑一两台做探测点，把业务域名和关键第三方域名配进去，并用标签区分探测点和 DNS 服务器。规则覆盖解析失败、解析耗时过长和返回码异常。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **4 条告警规则**，每条附处置步骤
* **5 条指标说明**
* **Categraf 采集配置**：`input.dns_query`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.dns_query/dns_query.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.dns_query started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   # # 

   auto_detect_local_dns_server  = false



   ## servers to query

   # servers = ["8.8.8.8"]

   servers = []



   ## Network is the network protocol name.

   # network = "udp"



   ## Domains or subdomains to query.

   # domains = ["."]



   ## Query record type.

   ## Possible values: A, AAAA, CNAME, MX, NS, PTR, TXT, SOA, SPF, SRV.

   # record_type = "A"



   ## Dns server port.

   # port = 53



   ## Query timeout in seconds.

   # timeout = 2
   ```

2. 在夜莺「集成中心」里找到 DNS Query，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 4 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### DNS 响应状态码异常[​](#dns-响应状态码异常 "DNS 响应状态码异常的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
dns_query_rcode_value != 0
```

处置步骤:

1. 在采集机上手工 dig @\<DNS服务器> <域名> 复现，看 status 与耗时；
2. 换用公共 DNS（如 dig @223.5.5.5）对比，区分是 DNS 服务器问题还是域名本身问题；
3. 自建 DNS 的检查服务进程、上游转发配置与网络连通性；
4. 确认探测配置里的域名、记录类型、超时设置是否合理，避免配置导致误报。

### DNS查询响应时间大于5秒[​](#dns查询响应时间大于5秒 "DNS查询响应时间大于5秒的直接��链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
dns_query_time_ms > 5000
```

处置步骤:

1. 在采集机上手工 dig @\<DNS服务器> <域名> 复现，看 status 与耗时；
2. 换用公共 DNS（如 dig @223.5.5.5）对比，区分是 DNS 服务器问题还是域名本身问题；
3. 自建 DNS 的检查服务进程、上游转发配置与网络连通性；
4. 确认探测配置里的域名、记录类型、超时设置是否合理，避免配置导致误报。

### DNS 查询超时[​](#dns-查询超时 "DNS 查询超时的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
dns_query_result_value == 1
```

处置步骤:

1. 在采集机上手工 dig @\<DNS服务器> <域名> 复现，看 status 与耗时；
2. 换用公共 DNS（如 dig @223.5.5.5）对比，区分是 DNS 服务器问题还是域名本身问题；
3. 自建 DNS 的检查服务进程、上游转发配置与网络连通性；
4. 确认探测配置里的域名、记录类型、超时设置是否合理，避免配置导致误报。

### DNS 查询异常[​](#dns-查询异常 "DNS 查询异常的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
dns_query_result_value == 2
```

处置步骤:

1. 在采集机上手工 dig @\<DNS服务器> <域名> 复现，看 status 与耗时；
2. 换用公共 DNS（如 dig @223.5.5.5）对比，区分是 DNS 服务器问题还是域名本身问题；
3. 自建 DNS 的检查服务进程、上游转发配置与网络连通性；
4. 确认探测配置里的域名、记录类型、超时设置是否合理，避免配置导致误报。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 5 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                             | 含义                                                                                                                                                                                                                                                                                                                    | 单位 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `dns_query_rcode_value`          | DNS 响应中的状态码 — 0 (NOERROR)：查询成功，没有错误 1 (FORMERR)：格式错误，DNS 服务器无法理解查询请求 2 (SERVFAIL)：服务器失败，DNS 服务器遇到内部错误 3 (NXDOMAIN)：域名不存在 4 (NOTIMP)：查询类型不被支持 5 (REFUSED)：查询被拒绝，通常是策略原因 在监控中，RCODE 为 0 表示查询成功，其他值通常表示存在问题需要关注 |      |
| `dns_query_result_value`         | 自定义的查询结果 — 0表示成功，1表示超时，2表示出错.                                                                                                                                                                                                                                                                     |      |
| `dns_query_status_change`        | DNS解析状态变更 — 当expect\_query\_ips配置了对应的域名后， categraf会对比响应的IP列表与配置的IP列表, 此时会产生这个指标,0 表示响应的IP与期望的IP一致， 1表示响应的IP与期望的IP出现差异.                                                                                                                                 |      |
| `dns_query_status_change_detail` | DNS解析变更详情 — 0 表示响应的IP与期望的IP一致， 1表示响应的IP与期望的IP出现差异。 {ips="响应的IP列表", diff="响应IP列表-期望IP列表"}                                                                                                                                                                                   |      |
| `dns_query_time_ms`              | 查询的响应时间                                                                                                                                                                                                                                                                                                          | ms   |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[DNS Query 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Dns\_Query）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Dns_Query%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `dns_query` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/dns_query)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
