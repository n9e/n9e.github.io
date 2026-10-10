---
title: "判定记录缺失或被丢弃"
sidebar_label: "判定记录缺失或被丢弃"
description: "判定记录缺失有四种情况：没记录、没评估、查询被拒、周期被跳过；过载和数据源超时是主因，被跳过的周期没有任何指标能反映。"
---

规则页上的判定记录是断的：有的周期有、有的周期没有，或者干脆整段空白。
判定记录是排查「有数据却不告警」的唯一现场，它一缺，排障就没了抓手。

**判定记录缺失不代表告警没评估。** 这两件事必须先分开，否则会往完全错误的方向查。

## 先分清是「没记录」还是「没评估」

| 现象 | 说明 |
|---|---|
| 记录在，但事件停在某个阶段 | 评估正常，去 [查询有结果但告警不触发](./alert-not-firing.md) |
| 接口返回 `"enabled": false` | 判定记录功能被关掉了，评估一切正常 |
| 记录零散缺失，`truncated` 为 true | 评估正常，是记录本身被降级或丢了 |
| 一条记录都没有，`instances` 为空 | **没有引擎在跑这条规则**，这才是评估的问题 |

最后一种走 [查询有结果但告警不触发](./alert-not-firing.md) 里的「规则根本没进入评估」。
剩下三种才是这一页要讲的。

## 记录是什么、存在哪

判定记录**不在数据库里**，是每个告警引擎写在自己本地磁盘上的 JSONL 文件，
按小时滚动、整点后 gzip：

```
<Dir>/<规则id>_<数据源id>/2026-09-03/21.jsonl.gz
```

`Dir` 默认是 `[Log] Dir` 下面的 `evallog`。这带来两个直接后果：

- **换了引擎实例、或者清了那台机器的磁盘，历史记录就没了**，没有副本；
- 中心查询时按哈希环找到负责这个数据源的引擎去取，**引擎不可达就取不到**，
  接口的 `note` 会提示你可以登到那台机器上直接访问它本地的记录接口。

配置项都在 `[Alert.EvalLog]` 下面，示例配置里整段是注释掉的（即默认开启）：

```toml
# [Alert.EvalLog]
# Disable = false
# Dir = "logs/evallog"
# RetentionHours = 192
# MaxSeriesPerQuery = 100
# MaxPointsPerSeries = 60
# MaxRecordBytes = 262144
# PerRuleDailyMB = 1024
# QueueSize = 512
# MaxDiskGB = 20
# MaxQueryBytes = 33554432
# MaxConcurrentQueries = 2
```

## 四种「缺失」，分别怎么确认

### 功能被关掉了

最省事的一种。接口直接返回 `{"list": [], "enabled": false}` ——
**不是错误，是明确告诉你没开**。把 `[Alert.EvalLog] Disable` 改回 `false` 并重启引擎。

### 写入队列满，或者磁盘写不动

看这个计数器：

```bash
curl -s http://127.0.0.1:17000/metrics | grep n9e_alert_eval_log_drop_total
```

它在涨就是记录真的被丢了。两个原因，日志里能分开：

```
evallog write path degraded (<原因>): dropping eval records for <规则>, 128 dropped since degradation began; check disk space/health of <目录>
evallog write path recovered, 128 records were dropped during degradation
```

写失败之后有 **30 秒的冷却期**，这期间的记录直接丢——所以一次磁盘抖动会打掉一整段，
而不是一两条。看到 degraded 就去查那个目录所在磁盘的空间和健康度。

队列长度是 `QueueSize`（默认 512 条）。这个队列同时也是内存上限：
磁盘卡住时它兜住的是内存里的记录，按默认上限每条约 200KB。

### 单条记录太大，被逐级降级

记录有一个 `MaxRecordBytes`（默认 256KB）的硬上限，超了会**逐级砍内容**，
而不是整条丢：

1. 先扔掉所有序列样本（`series`）；
2. 再把每条事件的标签和 detail 清空，只留 hash 和 stage；
3. 再把 `anomalies` 也扔掉，把查询语句和错误信息截到 512 字节；
4. 还超，才整条丢弃并给 `n9e_alert_eval_log_drop_total` +1。

任何一级生效，记录里的 `truncated` 都会变成 true。
**所以「记录在但里面没有序列数据」不是 bug，是这条规则一次查回来的序列太多了。**
想留住现场就调大 `MaxRecordBytes`，或者调小 `MaxSeriesPerQuery`（默认 100）
和 `MaxPointsPerSeries`（默认 60）让单条记录本来就小。

还有一层是按规则按天的字节预算 `PerRuleDailyMB`（默认 1024）：
超了之后这条规则**当天剩下的时间都只写摘要**，序列会安静地消失。

### 保留期或磁盘预算把它清了

清理任务每 10 分钟跑一次，做两件事：先按 `RetentionHours`（默认 192 小时，即 8 天）
删过期的日期目录和小时文件，再按 `MaxDiskGB`（默认 20）从最老的小时桶开始删到预算以内。

日志里对应：

```
evallog clean: disk budget exceeded, pruned to 21474836480 bytes
evallog clean: still 25769803776 bytes after pruning all closed hour files, budget 21474836480; lower PerRuleDailyMB / MaxSeriesPerQuery or raise MaxDiskGB
```

第二行是硬提示：**当前正在写的小时文件本身就超预算了**，删旧的已经救不回来，
只能按它说的调参数。

## 查询侧：不是没记录，是查询被拒了

查询侧有独立的并发闸，两条独立的错误，措辞不一样，能直接定位是哪一层：

- 引擎侧：`evallog is busy: too many concurrent eval-record queries on this engine instance, please retry`
- 中心侧：`too many concurrent eval-record queries on this center instance, please retry`

**这两条都不会返回空列表**——设计上宁可给一个可重试的错误，也不返回空，
因为空列表会被读成「当时确实没评估」。对应的计数器是
`n9e_alert_eval_log_query_reject_total`，它跟写入侧的 drop 完全是两回事。

还有一种是结果太大被截断，接口的 `note` 会明说：

```
result truncated by the per-query byte budget ([Alert.EvalLog] MaxQueryBytes = 33554432): ...
```

把时间范围缩小，或者调大 `MaxQueryBytes`（代价是这台引擎的堆内存，
大约是 `MaxConcurrentQueries × MaxQueryBytes × 3.7`，而且必须低于中心侧 48MB 的单节点响应上限）。

## 评估周期被跳过：没有任何指标能告诉你

上一轮还没跑完，下一轮到点了，调度器会**直接跳过这一轮**。
这条路径**既没有日志也没有指标**，只能从旁证看出来：

```bash
curl -s http://127.0.0.1:17000/metrics | grep -E 'n9e_alert_rule_eval_total|n9e_alert_rule_eval_duration_ms'
```

`n9e_alert_rule_eval_total` 增长得比「规则数 ÷ 执行频率」应有的速度慢，
同时某几条规则的 `n9e_alert_rule_eval_duration_ms` 明显偏高，就是在跳周期。
处理办法在 [性能与积压现象](./performance.md)。

顺带一提，查询报错和查询为空在引擎里是**两种完全不同的行为**：
查询报错时这一轮的判定和恢复处理**整个不做**，正在告警的事件既不刷新也不恢复；
查询正常返回空则会走恢复逻辑。判定记录里 `n9e_alert_eval_query_series_count` 为负数
就是错误态：`-1` 查询报错、`-2` 数据源或客户端拿不到、`-3` 查询模板渲染失败。

## 收集这些再去提问

1. 规则 ID、数据源 ID，以及判定记录接口返回里的 `enabled` / `truncated` / `note`；
2. `curl -s http://127.0.0.1:17000/metrics | grep -E 'n9e_alert_eval_log_'`；
3. 引擎日志里 `evallog ` 开头的所有行；
4. 存放目录所在磁盘的 `df -h` 和 `du -sh <Dir>`。

**脱敏**：日志里会带规则名和目录路径，路径里如果有机房或业务名要替换掉。

## 下一步

- 记录在但事件没出来：[查询有结果但告警不触发](./alert-not-firing.md)
- 引擎慢、队列涨：[性能与积压现象](./performance.md)
- 判定记录页面怎么读：[判定执行记录](../alerting/execution-records.md)
- 判定与恢复的模型：[判定、恢复与状态变化](../concepts/evaluation.md)
