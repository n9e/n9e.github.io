---
title: "发布说明"
sidebar_label: "发布说明"
description: "除 GitHub 变更记录之外，每个版本带升级影响说明的整理版。"
last_reviewed: 2026-10-15
---

这页不复述变更列表——完整的逐条改动一直在 GitHub 上，而且比这里更新得快。
这页只回答一件事：**升到某个版本，我需要动什么。**

整理到 **[v9.2.0（2026-10-11）](https://github.com/ccfos/nightingale/releases/tag/v9.2.0)**。
后续版本的完整改动请看 [GitHub Releases](https://github.com/ccfos/nightingale/releases)。

## 权威变更记录在哪

| 你想看的 | 去哪 |
|---|---|
| 每个版本的完整改动 | [GitHub Releases](https://github.com/ccfos/nightingale/releases) |
| 两个版本之间的所有提交 | 每篇发布说明底部的 **Full Changelog** 链接 |
| 数据库表结构的逐版本变更 | 仓库里的 [`docker/migratesql/migrate.sql`](https://github.com/ccfos/nightingale/blob/main/docker/migratesql/migrate.sql)，按 `/* vX.Y.Z */` 注释分段 |
| 某个改动为什么这么做 | 发布说明里的 PR 编号，点进去看讨论 |

## 产品里怎么知道有新版本

夜莺启动后会去 GitHub 查一次最新的 tag，和自己的版本比。**开源版**的页面顶栏
会显示当前版本号；有更新时版本号上带一个红点，鼠标悬上去提示
「有新的版本可更新 vX.Y.Z」，点进去就是 GitHub Releases。

「系统配置 → 关于产品」页分别列出**前端版本**和**后端版本**。
两个版本号应该一致；不一致通常意味着升级时只换了一半，或者浏览器缓存了旧的前端资源
（强刷一次浏览器）。

## v9 各版本的升级影响

**只列需要你动手的东西。** 功能改进不在这里，在 GitHub 的发布说明里。

| 版本 | 日期 | 升级前必须处理 |
|---|---|---|
| **v9.2.0** | 2026-10-11 | 同步替换二进制和 `integrations` 目录；需要新增语言的指标说明时再替换 `etc/metrics.yaml`。确认数据库可执行本版表结构变更；沿用旧配置不会自动启用内置时序库。见下方检查清单 |
| **v9.1.1** | 2026-08-18 | 无。纯修复版本，直接换二进制重启 |
| **v9.1.0** | 2026-08-06 | ① **判定记录默认开启**，告警引擎写本地 `./evallog`，保留 8 天、上限 20 GB——磁盘要留量，或在 `[Alert.EvalLog]` 里关掉；② **内置时序库不会被自动打开**，`[EmbeddedTSDB]` 只存在于新版 `etc/config.toml`，沿用旧配置就等于没开；③ `notification_record` 的两个索引在启动后在线创建，大表上要跑一阵 |
| **v9.0.0** | 2026-07-25 | ① **Redis 必须 ≥ 5.0**（AI 助手依赖 Redis Streams），Cluster 用户建议 7.0+；② 用 telegraf 的，写入地址要追加 `ignore_host=false`，否则那些机器不再进设备列表；③ 跑了 `n9e-edge` / `n9e-pushgw` 的要同批升级 |

各版本的主要功能（一句话版，细节看 GitHub）：

- **v9.0.0**：Nightingale AI（助手、技能市场、大模型配置）；告警规则「试运行」；
  屏蔽规则新增「只屏蔽通知」；内置 `/mcp` 端点；导航、布局和表格全面重做；
  告警规则 / 屏蔽 / 订阅 / 通知规则表单重构。
- **v9.1.0**：内置时序库；从 Grafana 一键导入数据源；逐轮判定记录；
  通知媒介可测试、消息模板可预览；工作流支持模拟事件试跑；内置告警规则模板大幅扩充。
- **v9.1.1**：列表页把当前页码记进 URL；日志查看器改用虚拟列表；一批修复。
- **v9.2.0**：新增 Jira、Discord、JSM Alert、Slack、Mattermost 原生通知渠道；
  仪表盘支持混合数据源查询、限时匿名分享和 Grafana 导入转换报告；账号可禁用后恢复；
  AI 助手可通过 ibex 分派脚本任务；补充多语言内容，并修复多实例登录循环等问题。

### v9.2.0 升级检查清单 {#v920-upgrade-checklist}

1. **先备份元数据库和配置，确认数据库变更权限。** 本版新增 `source_token.note`、
   `source_token.token` 上的 `idx_source_token_token` 索引，以及 `users.disabled`。
   有相应 DDL 权限时由夜莺启动时自动迁移；没有权限时，先由 DBA 按
   [v9.2.0 发布说明中的 MySQL / PostgreSQL SQL](https://github.com/ccfos/nightingale/releases/tag/v9.2.0)
   补齐本版尚未执行的变更。预期结果：启动迁移没有权限或表结构错误。
2. **同步更新文件。** 替换二进制和 `integrations` 目录；需要新增语言的指标说明时，同时替换
   `etc/metrics.yaml`。保留现有连接配置后重启；使用 `n9e-edge` / `n9e-pushgw` 的一起升级。
   预期结果：相关进程正常启动，新集成模板可见。
3. **按部署方式选择指标存储。** 如果希望启用内置时序库，需要把
   [v9.2.0 配置](https://github.com/ccfos/nightingale/blob/v9.2.0/etc/config.toml)
   中的 `[EmbeddedTSDB]` 段合入旧配置；只替换二进制不会开启它。它只适合小规模单 Center，
   多 Center 部署继续使用外部时序库。预期结果：现有数据源查询、仪表盘和告警规则仍能取得数据。

从 v8 升级时，还需按 [v8 升级 v9](../migration/v8-to-v9.md)处理 Redis、telegraf 写入参数等兼容事项，
并完成其中的验证和回退准备。

## 读发布说明时重点看三段

GitHub 上每篇发布说明结构是固定的，升级前至少读这三段：

1. **Upgrade note ⚠️ / Notes** —— 唯一会写「你必须先做什么」的地方，
   比如 Redis 版本要求、必须手工补的配置段。**跳过这段是升级出事的头号原因。**
2. **Schema changes** —— 说明表结构怎么变。确认数据库账号具有对应的建表、改表和建索引权限，
   夜莺启动时会自动迁移；没有权限时，把所需版本的变更交给 DBA，不要重复执行整个累计迁移文件。
3. **What's Changed** 里带 `fix:` 前缀的条目 —— 确认你正在忍受的那个 bug 是不是被修了。

## 版本号怎么读

`vMAJOR.MINOR.PATCH`，另有 `-beta.N` 的预发布 tag。

- **PATCH**（v9.1.0 → v9.1.1）：只修 bug，通常换二进制重启就行；
- **MINOR**（v9.0.0 → v9.1.0）：加功能，可能带默认行为变化——v9.1.0 就是例子，
  一定要读 Upgrade note；
- **MAJOR**（v8 → v9）：有环境依赖变化和界面重排，按[迁移页](../migration/v8-to-v9.md)走。

## 下一步

- 升级怎么做：[v8 升级 v9](../migration/v8-to-v9.md)
- 哪些东西被弃用了：[弃用与生命周期](./deprecations.md)
