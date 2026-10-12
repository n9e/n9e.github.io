# 内置时序库的单 Center 限制

内置时序库只活在一个 Center 进程里：这排除了什么，什么时候该迁走。

最后校对于 2026-10-10

内置时序库让你零依赖就能看图、能告警，代价是它绑死在一个进程上。 这页把「绑死」具体是什么、会排除掉哪些做法讲清楚，好让你知道什么时候必须迁走。

## 它是进程内的一个 Prometheus TSDB[​](#它是进程内的一个-prometheus-tsdb "它是进程内的一个 Prometheus TSDB的直接链接")

`[EmbeddedTSDB] Enable = true` 时，Center 在自己进程里打开一个 Prometheus 的 tsdb 存储引擎 和一个 promql 引擎，数据落在 `Dir` 指定的目录：

```
[EmbeddedTSDB]

Enable = true

Dir = "data/tsdb"

RetentionDuration = "15d"

MaxBytes = "10GiB"

OutOfOrderTimeWindow = "10m"
```

查询接口挂在 `/prometheus/api/v1/*` 上，和 Prometheus 的 HTTP API 兼容 （`query`、`query_range`、`series`、`labels`、`label/<name>/values`、`status/buildinfo`）。 启动时会自动注册一个名叫 `embedded-tsdb` 的 Prometheus 类型数据源指过来。

`RetentionDuration` 和 `MaxBytes` 是**两个独立的上限，哪个先到就先删最老的块**。 `MaxBytes` 留空或写 0 表示不限制磁盘——那样磁盘写满就是进程写不进去了。

## 限制一：只能有一个 Center 实例[​](#限制一只能有一个-center-实例 "限制一：只能有一个 Center 实例的直接链接")

数据在**这一个进程的本地磁盘**上。跑两个 Center 副本，就是两份各存了一半的数据， 而且两个副本会互相改写自动注册的那个数据源地址——查询命中哪一个副本是随机的， 结果就随机缺一半，**不报错**，只是图上少一截、规则少判一半。

Center 启动时发现同一个引擎集群里还有别的活跃实例，会打一条 warning 日志。 那条日志是唯一的提示，之后不会再报。

所以这条限制排除的是：

* 多实例高可用（见[高可用与故障域](https://n9e.github.io/zh/zh/docs/operations/high-availability.md)）；
* 在 Kubernetes 里把 Center 做成多副本 Deployment；
* 在负载均衡后面滚动重启时不丢查询——重启期间这份数据整体不可用。

## 限制二：默认只接受本机访问[​](#限制二默认只接受本机访问 "限制二：默认只接受本机访问的直接链接")

没配 `BasicAuthUser` / `BasicAuthPass`、也没配 `DatasourceUrl` 时， `/prometheus/api/v1/*` **只接受来自本机的请求**，其他来源一律 403：

```
embedded tsdb endpoints only accept requests from the n9e host by default;

set EmbeddedTSDB.BasicAuthUser/BasicAuthPass (or DatasourceUrl) to allow remote access
```

这是默认安全姿势：这组端点同时提供了「读全部指标」和「无认证写入」， 不该在零配置的情况下对整个网络开放。

要让 `n9e-edge`、Grafana 或者别的采集器直接读写它，就得显式表态：

```
[EmbeddedTSDB]

BasicAuthUser = "n9e"

BasicAuthPass = "<password>"

# 前面有 VIP 或域名时，让自动注册的数据源指向它

# DatasourceUrl = "http://n9e-vip:17000/prometheus"
```

配了之后自动注册的数据源地址会从 `127.0.0.1` 换成探测到的本机 IP。

## 限制三：没有在线备份，也没有副本[​](#限制三没有在线备份也没有副本 "限制三：没有在线备份，也没有副本的直接链接")

它不提供 Prometheus 的 snapshot 接口。想留一份就得停进程、拷 `data/tsdb` 目录—— 详见[备份与恢复](https://n9e.github.io/zh/zh/docs/operations/backup-restore.md)。删除数据的 `delete_series` / `clean_tombstones` 两个端点默认根本不注册，要用得先打开 `EnableAdminAPI = true`，并且先配好 BasicAuth。

## 什么时候该迁走[​](#什么时候该迁走 "什么时候该迁走的直接链接")

出现下面任何一条就该动了：

| 信号                                  | 怎么看                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| 要跑多个 Center 做高可用              | 这是硬性的，没有折中方案                                                          |
| 活跃序列数往 10 万以上走              | `curl --noproxy '*' http://n9e:17000/metrics \| grep prometheus_tsdb_head_series` |
| 磁盘块体积逼近 `MaxBytes`             | 同上，看 `prometheus_tsdb_storage_blocks_bytes`                                   |
| 要保留的历史比 `RetentionDuration` 长 | 直接看需求，不用看指标                                                            |
| 这份指标要给别的系统复用              | 直接看需求                                                                        |

`prometheus_tsdb_head_series` 是当前内存中活跃序列的真实条数，它是这几个判断里最可靠的一个。

## 怎么迁：双写过渡[​](#怎么迁双写过渡 "怎么迁：双写过渡的直接链接")

内置库和 `[[Pushgw.Writers]]` **可以同时生效**，这个重叠期就是迁移窗口，不用停机。

```
# 第一步：加上外部时序库，两边同时写

[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"
```

重启后到指标页确认新数据源里有数据。等外部库攒够了你需要的历史长度（一般就是原来的 `RetentionDuration`），再关掉内置库：

```
# 第二步：关掉内置库

[EmbeddedTSDB]

Enable = false
```

关掉之后 `embedded-tsdb` 这个数据源还留在数据源列表里，但已经查不到东西了。 **关之前先把仪表盘和告警规则里选的数据源改到新的那个**，否则它们会静默地查不到数据。

## 相关[​](#相关 "相关的直接链接")

* [内置时序库与外部存储](https://n9e.github.io/zh/zh/docs/concepts/storage.md)
* [外部时序库与双写迁移](https://n9e.github.io/zh/zh/docs/install/external-tsdb.md)
* [高可用与故障域](https://n9e.github.io/zh/zh/docs/operations/high-availability.md)
* [备份与恢复](https://n9e.github.io/zh/zh/docs/operations/backup-restore.md)
