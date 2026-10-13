* [](https://n9e.github.io/zh/index.md)
* 架构与概念

# 架构与概念

产品背后的心智模型：有哪几个进程、一个数据源怎么变成一条告警、事件在送到人之前经过了哪几道筛。

## [系统架构](https://n9e.github.io/zh/docs/concepts/architecture.md)

[夜莺的核心是一个 n9e 进程：测试零依赖，生产加 MySQL 和 Redis，多实例共享同一套库即为集群，多机房用 n9e-edge。](https://n9e.github.io/zh/docs/concepts/architecture.md)

## [进程与角色](https://n9e.github.io/zh/docs/concepts/components.md)

[绝大多数部署只需要 n9e 一个进程；n9e-alert、n9e-pushgw 是可拆出的角色，n9e-edge 给多机房用，Categraf 在采集侧。](https://n9e.github.io/zh/docs/concepts/components.md)

## [存储](https://n9e.github.io/zh/docs/concepts/storage.md)

[夜莺自带一个时序库让你零依赖起步；这页讲它的边界，以及什么时候必须换成 Prometheus 或 VictoriaMetrics。](https://n9e.github.io/zh/docs/concepts/storage.md)

## [业务组](https://n9e.github.io/zh/docs/concepts/business-groups.md)

[业务组是权限边界：规则、对象、仪表盘都归属某个业务组，成员关系决定谁能看、谁能改。](https://n9e.github.io/zh/docs/concepts/business-groups.md)

## [核心对象模型](https://n9e.github.io/zh/docs/concepts/data-model.md)

[整个产品挂在三个对象上：规则查询数据源，越界的规则产生事件。](https://n9e.github.io/zh/docs/concepts/data-model.md)

## [生命周期与级别](https://n9e.github.io/zh/docs/concepts/alert-lifecycle.md)

[告警事件由规则 + 标签集唯一标识，经历触发、持续、恢复三个阶段；S1 / S2 / S3 不改变机制，只告诉收到的人有多急。](https://n9e.github.io/zh/docs/concepts/alert-lifecycle.md)

## [标签与注解](https://n9e.github.io/zh/docs/concepts/labels-annotations.md)

[标签决定一个事件「是谁」，注解决定通知里能看到什么，两者不能混用。](https://n9e.github.io/zh/docs/concepts/labels-annotations.md)

## [判定与恢复](https://n9e.github.io/zh/docs/concepts/evaluation.md)

[规则不是查到就报：评估周期、持续时长、恢复条件三个参数加一套状态机，决定事件何时首次触发、何时恢复、会不会抖动。](https://n9e.github.io/zh/docs/concepts/evaluation.md)

## [降噪与路由模型](https://n9e.github.io/zh/docs/concepts/noise-routing.md)

[屏蔽规则、订阅、事件 Pipeline、通知规则不是并列的备选，而是按固定先后作用于事件；搞错顺序就会出现配了屏蔽仍收到告警。](https://n9e.github.io/zh/docs/concepts/noise-routing.md)

## [认证与权限模型](https://n9e.github.io/zh/docs/concepts/auth-rbac.md)

[权限只有两层：角色决定能进哪些页面、调哪些接口，业务组成员关系决定能动哪些数据；界面、HTTP API 和 MCP 共用这一套。](https://n9e.github.io/zh/docs/concepts/auth-rbac.md)

[上一页](https://n9e.github.io/zh/docs/get-started/production-checklist.md)

[上生产前的检查清单](https://n9e.github.io/zh/docs/get-started/production-checklist.md)

[下一页](https://n9e.github.io/zh/docs/concepts/architecture.md)

[系统架构](https://n9e.github.io/zh/docs/concepts/architecture.md)

© 2026 Nightingale Contributors · Apache-2.0

[English](https://n9e.github.io/zh/docs/concepts)[简体中文](https://n9e.github.io/zh/docs/concepts.md)
