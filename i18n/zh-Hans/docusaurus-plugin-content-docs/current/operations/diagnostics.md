---
title: "日志与诊断包"
sidebar_label: "日志与诊断包"
description: "排查夜莺自身问题有四个信息源：进程日志、判定记录、/metrics 和 pprof；提 Issue 时把这四样一起打包。"
last_reviewed: 2026-10-10
---

排查夜莺自身的问题有四个信息源：进程日志、判定记录、`/metrics` 和 pprof。
这页说清楚每个在哪、怎么开、以及提 Issue 时把哪些一起打包发出去。

## 日志：先决定输出到哪

```toml
[Log]
Dir = "logs"
Level = "INFO"     # DEBUG INFO WARNING ERROR
Output = "stdout"  # stdout stderr file
```

**默认是 `stdout`**，容器和 systemd 部署下这通常正是你要的，日志由外层的 journald
或者容器运行时接管。

改成 `file` 时有个坑：**必须同时给出一种轮转方式**，
`KeepHours`（按时间轮转）和 `RotateNum`（按个数轮转）不能都是 0，
否则进程启动就失败，报 `KeepHours and Rotatenum both are 0`。

```toml
[Log]
Dir = "logs"
Output = "file"
# 二选一
KeepHours = 24
# RotateNum = 3
# RotateSize = 256   # 单位 MB，配合 RotateNum 用
```

调级别到 `DEBUG` 能看到每次判定的细节，但量非常大，**排查完记得改回来**。

`[HTTP] PrintAccessLog` 默认 `false`。要看 HTTP 访问日志才打开它，同样是排查完就关。

## 按 trace id 把一次请求的日志串起来

每个 HTTP 请求都会拿到一个 trace id（来自请求头 `X-Trace-Id`，没有就自动生成），
这个请求链路上打的日志都带 `trace_id=<id>` 前缀。

夜莺自带一个查看器：浏览器打开

```
http://n9e:17000/api/n9e/trace-logs/<trace-id>
```

它会在 `[Log] Dir` 下按关键字 `trace_id=<id>` 搜索所有 `*.log*` 文件（含轮转过的），
集群里还会挨个问同引擎集群的其他实例，直到找到那条 trace 落在哪个实例上。

前提是 **`[Log] Output` 必须是 `file`**——输出到 stdout 时磁盘上没有文件可搜。
单次搜索有 10 秒预算、最多 5000 行，超出会明确标记为「被截断」，
不会拿一个不完整的结果冒充「没找到」。

## 判定记录：规则为什么不触发

这是排查「表达式在查询页面有数据，规则就是不告警」的主要证据。
每个判定周期落一条记录，内容包括这次查了什么、返回了多少条序列、
每条序列的采样点、哪些越了阈值、以及每个事件后来的去向（被屏蔽了、被流水线丢了、
还在 pending、还是真发出去了）。

记录写在**告警引擎本地磁盘**上，默认在 `<[Log] Dir>/evallog` 下，
按 `{规则ID}_{数据源ID}/{日期}/{小时}.jsonl` 组织，过了当前小时会自动 gzip。

界面入口在**告警通知 → 规则管理**，规则行的操作列里。

配置项都在 `etc/config.toml` 的 `[Alert.EvalLog]` 段（默认全是注释掉的）：

| 配置项 | 默认值 | 含义 |
|---|---|---|
| `Disable` | `false` | 默认开启 |
| `Dir` | `<[Log] Dir>/evallog` | 落盘目录 |
| `RetentionHours` | 192 | 保留 8 天 |
| `MaxDiskGB` | 20 | 总磁盘上限 |
| `PerRuleDailyMB` | 1024 | 单条规则每天的写入预算，超了当天降级为摘要 |
| `MaxSeriesPerQuery` | 100 | 单次查询最多记多少条序列 |
| `MaxPointsPerSeries` | 60 | 每条序列最多记多少个点 |
| `QueueSize` | 512 | 写入队列长度 |

队列满或者磁盘写不动时记录会被丢弃，计数在 `n9e_alert_eval_log_drop_total`。
这个数在涨，说明记录不完整，别把「记录里没有」当成「没发生过」。

## 运行时诊断

**pprof**（`[HTTP] PProf`，`etc/config.toml` 里默认 `true`，`etc/edge/edge.toml` 里默认 `false`）：

```bash
# 30 秒 CPU profile
curl --noproxy '*' -o cpu.pprof 'http://n9e:17000/api/debug/pprof/profile?seconds=30'
# 堆内存
curl --noproxy '*' -o heap.pprof 'http://n9e:17000/api/debug/pprof/heap'
# 协程栈（文本，直接能看）
curl --noproxy '*' 'http://n9e:17000/api/debug/pprof/goroutine?debug=2' > goroutine.txt

go tool pprof -http=:8080 cpu.pprof
```

pprof 端点**不需要认证**，生产上应该平时关掉、要抓的时候临时打开。

**`/dumper/sync`** 回答的是「我在界面上改了配置，为什么没生效」：
它列出每一类配置最近两次同步的时间、耗时、条数和结果。

```bash
curl --noproxy '*' http://127.0.0.1:17000/dumper/sync
```

**只接受本机请求**，必须在跑着夜莺的那台机器上执行。
某一类一直显示 `not changed` 而你确实改过，说明改动没落库或者你连的不是这个实例。

## 提 Issue 前收集什么

把下面这些一起发出去，能省掉一轮来回：

1. **版本**。后端 `./n9e --version` 或者 `curl --noproxy '*' http://n9e:17000/api/n9e/version`；
   前端版本在**系统配置 → 关于产品**页上，两个都要。
2. **部署形态**。几个 `n9e` 实例、有没有 edge、元数据库是 MySQL 还是
   PostgreSQL 还是 SQLite、时序库是内置的还是外部的。
3. **配置文件**。`etc/config.toml`，**先把 DSN 里的口令、通知媒介的 token、
   大模型的 API key 删掉**。
4. **启动时的那几行**。进程启动会打印 `runner.cwd`、`runner.hostname`、
   `runner.fd_limits`、`runner.vm_limits`，文件描述符和内存上限的问题看这里。
5. **复现时间窗口的日志**。级别调到 `DEBUG` 重现一次更好。
6. **`/metrics` 快照**：`curl --noproxy '*' http://n9e:17000/metrics > metrics.txt`。
7. **如果是规则不触发**：那条规则的判定记录截图或导出，加上规则本身的配置。

Issue 提到 [ccfos/nightingale](https://github.com/ccfos/nightingale/issues)。

## 相关

- [内置指标与健康检查](./health.md)
- [查看判定执行记录](../alerting/execution-records.md)
- [规则不触发](../troubleshooting/alert-not-firing.md)
