* [](https://n9e.github.io/zh/index.md)
* 运维

# 运维

让夜莺自己保持健康：拓扑、容量、备份、升级，以及及时知道坏的是它自己。

## [生产拓扑](https://n9e.github.io/zh/docs/operations/topology.md)

[单团队、单公司、多机房带边缘告警的参考布局。](https://n9e.github.io/zh/docs/operations/topology.md)

## [容量规划](https://n9e.github.io/zh/docs/operations/capacity.md)

[夜莺的资源消耗由规则数、序列数、事件量和数据库负载决定；量出四个数就知道该往哪个方向扩，这里不提供规格表。](https://n9e.github.io/zh/docs/operations/capacity.md)

## [高可用与故障域](https://n9e.github.io/zh/docs/operations/high-availability.md)

[多实例部署能扛住哪些故障、扛不住哪些，以及怎么演练。](https://n9e.github.io/zh/docs/operations/high-availability.md)

## [内置时序库的单 Center 限制](https://n9e.github.io/zh/docs/operations/embedded-tsdb-limits.md)

[内置时序库只活在一个 Center 进程里：这排除了什么，什么时候该迁走。](https://n9e.github.io/zh/docs/operations/embedded-tsdb-limits.md)

## [Pushgw 队列、写入器与双写](https://n9e.github.io/zh/docs/operations/pushgw.md)

[写入路径：队列大小、背压、多写入器、同时转发到两个后端。](https://n9e.github.io/zh/docs/operations/pushgw.md)

## [备份与恢复](https://n9e.github.io/zh/docs/operations/backup-restore.md)

[夜莺真正不可再生的只有元数据库和 etc/ 目录，两者必须定期备份并演练恢复；内置时序库可选，指标丢了可以重新采集。](https://n9e.github.io/zh/docs/operations/backup-restore.md)

## [升级与数据库迁移](https://n9e.github.io/zh/docs/operations/upgrade.md)

[schema 迁移在启动时怎么跑，以及多实例部署该按什么顺序升级。](https://n9e.github.io/zh/docs/operations/upgrade.md)

## [回滚与恢复](https://n9e.github.io/zh/docs/operations/rollback.md)

[撤销一次升级或一次配置改动，以及元数据库损坏之后怎么恢复。](https://n9e.github.io/zh/docs/operations/rollback.md)

## [监控夜莺自身](https://n9e.github.io/zh/docs/operations/self-monitoring.md)

[当告警系统本身挂了的时候，能叫醒你的那几条规则。](https://n9e.github.io/zh/docs/operations/self-monitoring.md)

## [内置指标与健康检查](https://n9e.github.io/zh/docs/operations/health.md)

[每个进程暴露的 /metrics 与健康检查端点，以及值得画出来的那几个。](https://n9e.github.io/zh/docs/operations/health.md)

## [日志与诊断包](https://n9e.github.io/zh/docs/operations/diagnostics.md)

[排查夜莺自身问题有四个信息源：进程日志、判定记录、/metrics 和 pprof；提 Issue 时把这四样一起打包。](https://n9e.github.io/zh/docs/operations/diagnostics.md)

## [边缘断网行为](https://n9e.github.io/zh/docs/operations/edge-partition.md)

[n9e-edge 失联时会怎样：判定继续、通知走本地、之后什么会同步回来。](https://n9e.github.io/zh/docs/operations/edge-partition.md)

## [灾备](https://n9e.github.io/zh/docs/operations/disaster-recovery.md)

[在全新环境里从备份重建，以及各个组件该按什么顺序拉起来。](https://n9e.github.io/zh/docs/operations/disaster-recovery.md)

[上一页](https://n9e.github.io/zh/docs/security/checklist.md)

[安全检查清单](https://n9e.github.io/zh/docs/security/checklist.md)

[下一页](https://n9e.github.io/zh/docs/operations/topology.md)

[生产拓扑](https://n9e.github.io/zh/docs/operations/topology.md)

© 2026 Nightingale Contributors · Apache-2.0

[English](https://n9e.github.io/zh/docs/operations)[简体中文](https://n9e.github.io/zh/docs/operations.md)
