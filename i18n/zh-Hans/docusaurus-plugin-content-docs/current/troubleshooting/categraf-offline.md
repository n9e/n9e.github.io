---
title: "Categraf 对象为什么显示离线？"
sidebar_label: "Categraf 对象为什么显示离线？"
description: "设备显示离线意味着心跳没在期限内到达 Redis：常见原因是时钟偏差、心跳地址错误或网络策略；「更新时间」不能用来判断存活。"
last_reviewed: 2026-10-10
---

设备列表里某台机器的状态格子变黄或变红，但你 SSH 上去 categraf 明明活着。
这页先讲清楚「离线」是怎么判出来的——判定规则不搞明白，后面查什么都是猜。

影响范围：只影响这台机器的存活判定和基于它的告警（`target_miss`、`offset` 这类规则），
指标写入是**另一条链路**，心跳断了指标可能还在进。反过来也成立。

## 「离线」是怎么判出来的

设备列表的状态格子只看一个东西：**这台机器最后一次心跳距现在多久**。

| 距上次心跳 | 状态格子 | 接口里的 `target_up` |
|---|---|---|
| < 60 秒 | 绿 | 2 |
| 60 ~ 180 秒 | 黄 | 1 |
| ≥ 180 秒，或 Redis 里根本没有这条记录 | 红 | 0 |

**这两个阈值是写死在代码里的，没有配置项。** 心跳间隔比 60 秒长的采集器，
在这里永远是黄的——这不是故障。

心跳时间存在 Redis 里，键名是 `n9e_meta_update_time_<ident>`，**TTL 24 小时**。
所以一台停了一天以上的机器会直接掉到「Redis 里没有」那一档。

## 先分清是没心跳，还是没元信息

这两件事各有一个 Redis 键、各有一套 TTL，症状看起来很像但原因完全不同：

- **状态格子红了** —— `n9e_meta_update_time_<ident>` 过期或没写进去，是心跳链路的问题；
- **CPU 核数、内存、操作系统这些列显示 unknown** —— `n9e_meta_<ident>`（TTL 7 天）
  没有，接口里表现为 `cpu_num = -1`。

一台机器可以「状态是绿的但元信息 unknown」，也可以反过来。
先看清楚是哪一种，再往下查。

## 心跳链路：从 agent 到 Redis

### agent 侧

在这台机器上看 categraf 日志，心跳失败一定会打出来：

```bash
journalctl -u categraf | grep -i heartbeat
```

- `E! failed to do heartbeat: ... connection refused` —— 网络不通，或者夜莺没在监听；
- `E! heartbeat status code: 401` —— 服务端开了 `[HTTP.APIForAgent.BasicAuth]`，
  agent 侧 `[heartbeat] basic_auth_user/pass` 要填；
- `E! heartbeat status code: 404` —— 路径写错（必须是 `/v1/n9e/heartbeat`），
  **或者服务端把 `[HTTP.APIForAgent] Enable` 关了**——关掉之后这个路由根本不注册，
  连同所有写入端点一起消失；
- 什么都没有 —— `[heartbeat] enable` 可能是 false。

**心跳请求里 `hostname` 是必填的**，缺了服务端直接拒，边缘节点上返回 400 `hostname is required`。

采集端的完整排查见 [Categraf 排障](../data/categraf/troubleshooting.md)。

### 服务端侧

心跳先在内存里攒着，**每秒钟批量刷一次 Redis**，时间戳是刷盘那一刻打的，不是请求到达那一刻。
所以偶尔看到一两秒的抖动是正常的。

Redis 写失败会在夜莺日志里留下：

```
update_ts: failed to write target ts in redis: <err>, keys: [n9e_meta_update_time_n9e-web-01], retry 1/3
failed to write target ts in redis after 3 retries, keys: [...]
```

看到这个就不用查 agent 了——心跳到了，是服务端写 Redis 的问题。重试 3 次、间隔 500ms、
整体 3 秒超时，都超了就这一批心跳丢掉。

## 别用「更新时间」判存活

设备表里的 `update_at` **不是心跳时间**。它只有两个时机会变：

1. 这台机器第一次注册进来；
2. agent 上报的**元信息发生了变化**（IP、标签、`engine_name`、agent 版本、操作系统）。

一台健康、一直在上报、什么都没改过的机器，`update_at` 可以是几个月前。
**用这个字段判存活是错的**，接口里的 `beat_time` 才是心跳时间。

## 重启夜莺之后所有机器都红

先看 `[Redis] RedisType`。**默认值是 `miniredis`——进程内的内存 Redis，不持久化。**
夜莺一重启，所有心跳记录归零，**每台机器都会红上 60 秒**，
期间 `target_miss` 类的规则可能真的报出来。

生产环境要把 `RedisType` 改成 `standalone` / `cluster` / `sentinel` 并指向真正的 Redis；
在这之前，重启后的这一波红色不用查。

## 机器压根没出现过

如果不是「变红」而是「从来没有过这台机器」，那是注册路径的问题，不是心跳超时：

- **只有心跳会创建设备记录。** 光写指标不会——除非显式打开 `Pushgw.GetHeartbeatFromMetric`
  （默认关，而且它不在示例配置里）。写入方只发指标不发心跳，指标进得来，设备列表里永远没有它。
- **写入方带的是 `host` 标签而不是 `ident` / `agent_hostname`**（Telegraf 是典型），
  机器名会被丢掉，要在写入地址后面加 `?ignore_host=false`。

## 收集这些再去提问

1. 设备列表里这台机器的 `ident`、状态格子的颜色、以及「更新时间」列的值；
2. `journalctl -u categraf | grep -i heartbeat | tail -50`；
3. 夜莺日志里同一时间段的 `update_ts:` 行；
4. 服务端 `[Redis] RedisType` 和 `[HTTP.APIForAgent] Enable` 的取值。

**脱敏**：主机名、IP、BasicAuth 的用户名密码全部替换，地址写成 `n9e:17000` 这种占位。

## 下一步

- 机器在但没指标：[数据源连上了，为什么查不到数据？](./no-data.md)
- 采集端的完整排查：[Categraf 排障](../data/categraf/troubleshooting.md)
- 设备列表这个页面本身：[设备列表](../data/categraf/targets.md)
- 失联告警怎么配：[告警规则的生效范围](../alerting/scope.md)
