---
title: "从 Zabbix 迁移"
sidebar_label: "从 Zabbix 迁移"
description: "从 Zabbix 迁移是重建而非搬迁：主机对应对象、模板对应集成、触发器对应规则，部分概念没有对应物，全程 Zabbix 不停机。"
last_reviewed: 2026-10-10
---

import { figures } from '@site/src/data/figures';

看完这页，你能把 Zabbix 的对象逐个对到夜莺上，知道哪几样**根本没有对应物**，
并按一个 Zabbix 全程不停机的顺序把监控搬过来。

## 先认清一件事：这不是迁移，是重建

**夜莺没有 Zabbix 模板或触发器的导入器**，也读不了 Zabbix 的 XML / YAML 模板。
两边的数据模型差得太远，不存在机械转换。

好消息是重建的工作量比想象的小：Zabbix 里一个模板挂到 1000 台机器上会生成
1000 组触发器，在夜莺里那通常是**一条规则**——规则跑一次查询，返回多少条序列
就产生多少个事件，机器不用逐台枚举。

历史数据也不用搬。Zabbix 的 `history` / `trends` 留在 Zabbix 里，
迁移期间它继续跑、继续存；切完之后把它降级成只读的历史查询系统即可。

## 对象映射

### 采集与存储

| Zabbix | 夜莺 |
|---|---|
| Zabbix Server | 夜莺 + 一个时序库。夜莺自己**不存数据**（内置时序库是唯一例外） |
| Zabbix Agent | [Categraf](../data/categraf/install.md)，或者你已有的 exporter |
| Zabbix Proxy | 概念上最接近 `n9e-edge`，但语义不同：Proxy 是采集代理，edge 是**判定下沉**，见[边缘机房](../install/edge.md) |
| `history` / `trends` 表 | 外部时序库，或[内置时序库](../data/embedded-tsdb.md) |
| Item（监控项） | **没有对应物。** 采集什么由采集器的配置决定，夜莺侧不定义监控项 |
| Item key（`vfs.fs.size[/,pfree]`） | 指标名 + 标签（`disk_used_percent{path="/"}`） |
| Zabbix API | 夜莺的 HTTP API |

### 主机与分组

| Zabbix | 夜莺 |
|---|---|
| Host | 设备列表里的一条记录，唯一标识是 `ident`（Categraf 上报的 hostname） |
| Host group | **业务组**——但它同时是**权限边界**，不只是分组，见[业务组](../concepts/business-groups.md) |
| Host 上的宏 / inventory | 设备上的自定义标签、备注，以及采集器 `[global.labels]` 上报的标签 |
| Template（模板） | **模板中心里的组件**：夜莺内置 {figures.integrations} 个组件，其中 {figures.integrationsWithAlerts} 个带告警规则模板、{figures.integrationsWithDashboards} 个带仪表盘模板 |
| 模板继承 / 嵌套模板 | **没有对应物。** 组件导入是一次性拷贝，改了模板不会回流到已导入的副本 |
| LLD（低级别自动发现） | **没有对应物**，但通常也不需要：一条查询返回几条序列就是几个对象，新挂载点、新网卡自动出现在结果里 |

### 触发器与告警

| Zabbix | 夜莺 |
|---|---|
| Trigger | [告警规则](../alerting/first-rule.md)。一条规则覆盖查询能返回的**所有**对象 |
| Trigger expression | 规则里的查询（PromQL / SQL / LogQL，取决于数据源类型） |
| Recovery expression（OK event） | 日志类和 SQL 类规则的「恢复条件」下拉框，可以配非对称阈值；Prometheus 类规则阈值在表达式里，无独立恢复式，见[判定与恢复](../alerting/evaluation.md) |
| 6 档严重性 | **3 档**：S1 / S2 / S3。建议映射：Disaster、High → S1；Average、Warning → S2；Information、Not classified → S3 |
| Trigger dependencies（触发器依赖） | **没有对应物。** 最接近的是给下游规则挂一个带丢弃处理器的[事件 Pipeline](../events/pipelines.md)，按上游事件写进来的标签丢事件 |
| `nodata()` 函数 | 日志类和 SQL 类规则的「无数据」开关；Prometheus 类要单写一条规则（`target_up == 0`） |
| Trigger 的 hysteresis | 「恢复条件」里的非对称阈值，或「留观时长」 |

### 通知与维护

| Zabbix | 夜莺 |
|---|---|
| Action + Operation | [通知规则](../notifications/rules.md) |
| Media type | [通知媒介](../notifications/dingtalk-feishu-wecom.md) |
| Message template | [消息模板](../notifications/templates.md) |
| Escalation（升级步骤） | 部分对应：订阅规则的「持续时长」可以做「超过 N 秒还没恢复就抄送给主管」，见[订阅规则](../events/subscriptions.md)。Zabbix 那种多步骤升级阶梯没有对应物 |
| User / User group | 用户 / 团队 |
| Maintenance（维护期） | [屏蔽规则](../events/mute-rules.md)。夜莺额外支持「周期时间」屏蔽和「只屏蔽通知」 |
| Graph / Screen / Dashboard | [仪表盘](../query/dashboards.md) |

## 两套模型的根本差别

三点，理解了这三点，剩下的映射都是查表：

1. **Zabbix 以主机和监控项为中心，夜莺以查询为中心。**
   Zabbix 里你先声明「这台机器采集这个监控项」，再对这个监控项写触发器；
   夜莺里你写一条查询，它返回什么就监控什么。所以夜莺侧**不存在「给这台机器加个监控项」这个动作**——
   要多采一个指标，改的是采集器的配置，不是夜莺的配置。
2. **规则是一对多的。** 一条 Zabbix 触发器对一台主机；一条夜莺规则对查询返回的所有序列。
   翻译触发器时先做归并：把「同一个指标、同一个阈值」的 N 个触发器合成一条规则，
   再用标签把例外拆出去（比如给特例机器打 `disk_threshold=high` 标签，单写一条规则）。
3. **业务组是权限边界。** Zabbix 的主机组主要用于组织和权限；夜莺的业务组同时决定
   谁能看到规则、谁能改规则、屏蔽规则作用在哪。**规划业务组比规划主机组要更认真一点。**

## 重建顺序

Zabbix 全程不停，每一步都能单独验证。

1. **装 Categraf。** 在一批机器上装采集器，写入地址指向夜莺。Zabbix Agent 不用卸。
   *验证*：「基础设施 → 设备列表」里出现这些机器，心跳时间在刷新。
   见 [Categraf 安装](../data/categraf/install.md)和[对象与心跳](../data/categraf/targets.md)。
2. **定存储。** 小规模直接用内置时序库；已有 Prometheus / VictoriaMetrics 就注册成数据源。
   *验证*：在「数据查询 → 指标」里查 `cpu_usage_active` 能出图。
3. **导内置模板。** 「集成中心 → 模板中心」找到对应组件，把仪表盘和告警规则模板
   导进业务组，告警规则**保持禁用**。这一步顶掉了 Zabbix 模板的大部分工作量。
   *验证*：仪表盘里有数据。见[导入仪表盘与规则](../data/integrations/import.md)。
4. **翻译剩下的触发器。** 内置模板覆盖不到的自定义触发器，按上一节的归并方法逐条重写。
   *验证*：每条规则用[试运行](../alerting/test-fire.md)确认查询和阈值都对。
5. **建通知。** 通知媒介 → 消息模板 → 通知规则，然后挂到规则上。
   *验证*：在通知规则上点「发送测试」，真的收到消息。
6. **搬维护期。** 把 Zabbix 里长期有效的维护期重建成屏蔽规则。
   *验证*：屏蔽规则表单上的「测试」会拿现有事件跑一遍匹配。
7. **并行跑。** 见下一节。
8. **下线。** 确认无差异后，先把 Zabbix 的 Action 停掉（只留判定不发通知），
   观察一周再停 Zabbix Agent。

## 并行期怎么比

两边都在判定、都在发通知，最省事的对法是**先让夜莺只发到一个专用的群或邮箱**，
然后每天比一次：

- **Zabbix 报了、夜莺没报**：多半是第 4 步漏了触发器，或者指标压根没被 Categraf 采到。
  先去即时查询确认指标存在，再查规则。
- **夜莺报了、Zabbix 没报**：先确认不是阈值抄错了；确认没抄错的话，
  多半是 Zabbix 那边有个你没注意到的触发器依赖或维护期在压着。
- **两边都报但级别不同**：6 档压到 3 档必然有信息损失，按上表核对一遍映射即可。

完整的并行与回退做法见[并行运行与回退方案](./coexistence.md)。
回退很简单：**把夜莺这批规则批量禁用**，Zabbix 那边一直没动过。

## 下一步

- 还在纠结换不换：[夜莺 vs Zabbix](/comparisons/zabbix)
- 两边同时跑、怎么切：[并行运行与回退方案](./coexistence.md)
- 规则该归哪个业务组：[业务组与数据源范围](../alerting/scope.md)
- 采集器怎么配插件：[Categraf 采集插件](../data/categraf/plugins.md)
