* [](https://n9e.github.io/zh/zh/.md)
* 排障

# 排障

按现象而不是按组件组织：找到和你看到的现象一致的那一条。

## [数据源连上了，为什么查不到数据？](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)

[数据源测试通过但查询为空，按写入 → 存储 → 查询逐层确认：数据没写进来、时间范围不含最近点、标签不匹配、查的不是同一个库。](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)

## [Categraf 对象为什么显示离线？](https://n9e.github.io/zh/zh/docs/troubleshooting/categraf-offline.md)

[设备显示离线意味着心跳没在期限内到达 Redis：常见原因是时钟偏差、心跳地址错误或网络策略；「更新时间」不能用来判断存活。](https://n9e.github.io/zh/zh/docs/troubleshooting/categraf-offline.md)

## [查询有结果，为什么告警不触发？](https://n9e.github.io/zh/zh/docs/troubleshooting/alert-not-firing.md)

[查询有数据却不触发，答案九成在判定记录里：持续时长未满、datasource\_queries 选错、时间段或业务组不符、规则被禁用或被屏蔽。](https://n9e.github.io/zh/zh/docs/troubleshooting/alert-not-firing.md)

## [判定记录为什么缺失或被丢弃？](https://n9e.github.io/zh/zh/docs/troubleshooting/evaluation-missing.md)

[判定记录缺失有四种情况：没记录、没评估、查询被拒、周期被跳过；过载和数据源超时是主因，被跳过的周期没有任何指标能反映。](https://n9e.github.io/zh/zh/docs/troubleshooting/evaluation-missing.md)

## [告警为什么反复触发或从不恢复？](https://n9e.github.io/zh/zh/docs/troubleshooting/alert-flapping.md)

[告警反复触发或从不恢复，多半是阈值贴着数据抖动、数据断流被当成恢复、标签集在两次判定间变了，或没设恢复条件。](https://n9e.github.io/zh/zh/docs/troubleshooting/alert-flapping.md)

## [有告警事件，为什么收不到通知？](https://n9e.github.io/zh/zh/docs/troubleshooting/no-notification.md)

[有事件但没通知，先看通知记录：没有记录是被屏蔽规则或通知规则拦下，记录失败看媒介配置，记录成功但人没收到看对端。](https://n9e.github.io/zh/zh/docs/troubleshooting/no-notification.md)

## [通知模板为什么渲染失败？](https://n9e.github.io/zh/zh/docs/troubleshooting/template-errors.md)

[消息正文变成报错或某个字段莫名为空，都是模板渲染问题，而且通知记录仍显示成功；用真实事件预览模板能提前发现。](https://n9e.github.io/zh/zh/docs/troubleshooting/template-errors.md)

## [Pipeline 为什么路由到了错误的目的地？](https://n9e.github.io/zh/zh/docs/troubleshooting/wrong-routing.md)

[通知发错人，通常是目的地在链路里被决定的位置和预期不一样：处理器顺序、匹配之前的标签改写、两个挂载点的作用域差异。](https://n9e.github.io/zh/zh/docs/troubleshooting/wrong-routing.md)

## [工作流试跑成功，为什么生产执行失败？](https://n9e.github.io/zh/zh/docs/troubleshooting/workflow-prod-fails.md)

[试跑成功而线上失败，差别在事件和进程：真实事件可能缺标签，线上执行的是告警进程而非页面进程，权限和网络可达性都不同。](https://n9e.github.io/zh/zh/docs/troubleshooting/workflow-prod-fails.md)

## [内置时序库的数据为什么断续或缺失？](https://n9e.github.io/zh/zh/docs/troubleshooting/embedded-tsdb-data.md)

[内置时序库出现断档多半不报错：保留期到了、磁盘压力、进程重启都是常见原因；三个时间戳指标能先分清断在写入侧还是查询侧。](https://n9e.github.io/zh/zh/docs/troubleshooting/embedded-tsdb-data.md)

## [Edge 为什么与中心失联？](https://n9e.github.io/zh/zh/docs/troubleshooting/edge-disconnected.md)

[边缘断网期间判定和通知照常在本地进行，但事件不会回传中心——这是预期行为；从未连上过才是配置错误，两者的判断方法不同。](https://n9e.github.io/zh/zh/docs/troubleshooting/edge-disconnected.md)

## [MCP 认证为什么失败？](https://n9e.github.io/zh/zh/docs/troubleshooting/mcp-auth.md)

[MCP 认证失败先看状态码是哪一层拒绝的：网关、Token 还是 OAuth；常见原因是头名写错、Token 过期、回调地址不匹配。](https://n9e.github.io/zh/zh/docs/troubleshooting/mcp-auth.md)

## [MCP 工具为什么缺失或被拒绝？](https://n9e.github.io/zh/zh/docs/troubleshooting/mcp-tools-missing.md)

[「没有这个工具」有三种形状：写工具未开启、工具集被禁用、Token 用户缺少权限——tools/list 的返回先分出是哪一种。](https://n9e.github.io/zh/zh/docs/troubleshooting/mcp-tools-missing.md)

## [升级或数据库迁移为什么失败？](https://n9e.github.io/zh/zh/docs/troubleshooting/upgrade-fails.md)

[升级后出现 Unknown column、新功能页面空白或进程卡住，都说明表结构没有完整升上去，常见于数据库权限不足或迁移中断。](https://n9e.github.io/zh/zh/docs/troubleshooting/upgrade-fails.md)

## [夜莺为什么变慢或出现积压？](https://n9e.github.io/zh/zh/docs/troubleshooting/performance.md)

[告警延迟、队列增长、数据库 CPU 高各对应一个能定位的内置指标；先按现象选指标，再从指标找根因。](https://n9e.github.io/zh/zh/docs/troubleshooting/performance.md)

[上一页](https://n9e.github.io/zh/zh/docs/operations/disaster-recovery.md)

[灾备](https://n9e.github.io/zh/zh/docs/operations/disaster-recovery.md)

[下一页](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)

[数据源连上了，为什么查不到数据？](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)

© 2026 Nightingale Contributors · Apache-2.0

[English](https://n9e.github.io/zh/docs/troubleshooting)[简体中文](https://n9e.github.io/zh/zh/docs/troubleshooting.md)
