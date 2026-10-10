---
title: "从 Prometheus + Alertmanager 迁移"
sidebar_label: "从 Prometheus + Alertmanager 迁移"
description: "Prometheus 继续负责存储和抓取；把规则、路由、静默、接收器搬成夜莺的对象。"
---

看完这页，你能把一份 `alertmanager.yml` 和一份 `rules.yml` 拆开，逐项落到夜莺的对象上，
知道哪几项**对不上**，并按一个随时能退回去的顺序切过来。

Alertmanager 是夜莺唯一真正要替掉的组件。其余东西一个都不用动。

## 什么留着，什么被替掉

| 你现在跑的 | 迁移后 |
|---|---|
| Prometheus 抓取（`scrape_configs`） | **不动**，一行不改 |
| Prometheus 存储、`remote_write`、Thanos / Mimir | **不动**，夜莺注册成数据源在原地查 |
| exporter、Grafana 面板 | **不动** |
| `rule_files` 里的**记录规则** | **不动**，继续由 Prometheus 算 |
| `rule_files` 里的**告警规则** | 搬进夜莺，Prometheus 侧停止判定 |
| `alertmanager.yml`（路由、静默、接收器、抑制） | 拆成夜莺的通知规则 / 屏蔽规则 / 通知媒介 / 消息模板 |
| Alertmanager 进程本身 | 最后下线 |

判定从 Prometheus 挪到了夜莺：告警引擎按周期向 Prometheus 发 instant query，
把返回的每条序列当成一个异常点。只要 Prometheus 还能被查，判定就照常。

**夜莺不能接收 Alertmanager 的 webhook。** 后端没有任何形如 `/api/v1/alerts` 的入站告警接口，
只有指标写入口（`prometheus/v1/write`、`opentsdb/put` 等）。
所以不能把 Alertmanager 挂在夜莺前面当转发器过渡，规则只能重建。

## 对象映射

### 规则与表达式

| Prometheus | 夜莺 |
|---|---|
| `groups[].rules[].alert` | 规则名称 |
| `expr` | 规则里唯一的那条查询（阈值同样写在 PromQL 里，`... > 0.5`） |
| `for` | 持续时长 `prom_for_duration`，单位秒；解析失败或缺省回落 60 秒 |
| group 的 `interval` | 执行频率，写成 `@every Ns`；缺省 60 秒 |
| `labels.severity` | 级别 S1 / S2 / S3，按关键字映射；认不出来的一律 S2，且这个标签不再进附加标签 |
| `labels` 里其余项 | 附加标签 `key=value`，**键和值里的空格会被直接删掉** |
| `annotations` | 注释，原样带过来 |
| 同一文件里的 `record:` 条目 | **静默跳过**，见[记录规则](../query/recording-rules.md) |
| `keep_firing_for`、group 的 `limit` | **不转换** |

整份 `rules.yml` 可以直接粘进「规则管理 → 导入 → 导入 Prometheus 告警规则」，
边界情况见[导入、导出与复用](../alerting/import-export.md)。注意导入时
「重复通知频率」被固定写成 60 分钟、「留观时长」写成 0——这两个值不来自 YAML，导完要复核。

### 路由与接收器

| Alertmanager | 夜莺 | 说明 |
|---|---|---|
| `receivers[]` 里的一个接收器 | 一条**通知规则**里的一份通知配置 | 媒介 + 参数 + 收件人 |
| 接收器的类型（webhook / 邮件 / 钉钉…） | **通知媒介** | 「怎么发」，见[钉钉 / 飞书 / 企业微信](../notifications/dingtalk-feishu-wecom.md) |
| `templates` 里的 Go 模板 | **消息模板** | 见[模板与变量](../notifications/templates.md) |
| `route.matchers` | 通知配置上的「适用标签」「适用属性」 | 全部 AND |
| `route` 的树形结构、`continue` | **没有对应物** | 见下一节 |
| `group_by` / `group_wait` / `group_interval` | **没有对应物** | 夜莺一次通知只装一个事件，不按标签聚合成一条消息 |
| `repeat_interval` | 告警规则上的「重复通知频率」，单位**分钟**；为 0 表示不重复发 | 另有 Alertmanager 没有的「最大通知次数」封顶 |
| `send_resolved` | 「恢复时通知」开关 | |
| `resolve_timeout`（近似） | 「留观时长」，单位**秒**：异常消失后再观察这么久无异常才判恢复 | |
| Alertmanager 集群（gossip 去重） | 多个告警引擎实例按规则分片 | 不需要 gossip |

### 静默与抑制

| Alertmanager | 夜莺 | 差别 |
|---|---|---|
| Silence（UI / API / `amtool`） | **屏蔽规则** | 屏蔽规则**必须属于一个业务组**，只对该组的事件生效；Alertmanager 的静默是全局的 |
| Silence 的 matcher（`=` `!=` `=~` `!~`） | 六个操作符：`==` `!=` `=~` `!~` `in` `not in` | 夜莺多两个集合操作符，但缺失标签的语义不同，见后文 |
| 静默的起止时间 | 「固定时间」屏蔽 | 另有「周期时间」屏蔽（每周几、每天几点到几点），Alertmanager 那边要靠 route 上的 `mute_time_intervals` 才能表达 |
| （无对应） | 「屏蔽方式」可选「只屏蔽通知」，事件照常留档 | Alertmanager 的静默只有这一种语义 |
| `inhibit_rules`（跨规则抑制） | **没有对应物** | 见下 |

规则表单里那个叫「级别抑制」的开关**不是** `inhibit_rules`：它只在**同一条规则的同一轮判定内**
生效——指标名和标签完全相同的曲线同时命中多档阈值时，高级别把低级别压掉。
跨规则的「机房挂了就别报机器挂了」，夜莺没有声明式写法；最接近的做法是给下游规则挂一个
带丢弃处理器的[事件 Pipeline](../events/pipelines.md)，按上游写进来的标签丢事件。
这是一次改写，不是一次配置，迁移前先认下这笔账。

## 把路由树拍平

Alertmanager 的路由是一棵树，从根往下逐层匹配，默认命中即停（`continue: false`）。
夜莺是平铺的：**一条告警规则上挂几条通知规则，每条规则里又有几份通知配置，
每份配置各自做「时段 ∧ 级别 ∧ 标签 ∧ 属性」四条件 AND 判定，命中的全部各发一次**，
没有先后，也没有「命中就不再往下走」。

拍平的做法：**对树上每一条从根到叶的路径，把沿途所有 matcher AND 起来，做成一份通知配置。**

```yaml
# alertmanager.yml
route:
  receiver: default-chat
  routes:
    - matchers: [ 'env="prod"' ]
      receiver: prod-chat
      routes:
        - matchers: [ 'severity="critical"' ]
          receiver: prod-oncall-phone
          continue: true
```

拍平成三条通知规则：

| 通知规则 | 适用级别 | 适用标签 | 媒介 |
|---|---|---|---|
| `prod-oncall-phone` | S1 | `env == prod` | 电话 |
| `prod-chat` | S1 S2 S3 | `env == prod` | 群机器人 |
| `default-chat` | S1 S2 S3 | `env != prod` | 群机器人 |

四点要注意：

- 上例里 `continue: true`，所以 critical 同时进电话和群——平铺模型天然就是这个行为，不用配。
  反过来，**默认的 `continue: false` 才需要你动手模拟**：把兄弟分支写成互斥条件
  （用 `!=` / `not in` / `!~` 排除更具体的分支），否则一个事件会命中两条、发两遍。
- 上表最后一行的 `env != prod` **只在事件一定带 `env` 标签时才靠谱**。原因见下一节。
- 根路由的兜底接收器还有一种更稳的写法：做一条过滤条件全空的
  [订阅规则](../events/subscriptions.md)——它的语义就是「所有事件我都要」，天然兜底，
  而且不依赖任何标签存在。
- 通知规则**不是全局生效的**。Alertmanager 里所有告警都流进同一棵树；夜莺里事件只发给
  这条告警规则上明确挂了的通知规则。批量挂载用「规则管理 → 更多 → 更新告警规则」。
  **规则建完不挂通知规则，事件只会躺在事件列表里。**

## 四个会咬人的不对称

1. **空的匹配条件，两边含义相反。** Alertmanager 里不写 matcher 表示不限制；
   夜莺通知配置里的「适用级别」三个复选框**一个都不勾等于谁都不匹配**，这份配置直接失效。
   照着路由树机械翻译最容易踩这个。「适用标签」「适用时段」倒是留空即不限制，只有级别是反的。
2. **事件没有这个标签，一律判为不匹配——`!=` 和 `!~` 也一样。**
   夜莺的标签过滤先查 key 存不存在，不存在直接返回不匹配（`alert/common/key.go` 的 `MatchTags`）。
   Alertmanager 把缺失的标签当空串，所以 `env!="prod"` 对不带 `env` 的告警是**命中**的。
   凡是用 `!=` / `!~` / `not in` 写排除条件的静默和路由，搬过来之前先确认目标标签一定存在——
   最省事的办法是在告警规则的附加标签里把这个维度补齐，见[标签与级别](../alerting/labels-severity.md)。
3. **屏蔽规则有业务组边界。** 一条静默在 Alertmanager 里能盖住全站；夜莺的屏蔽规则
   只作用于它所属的那个业务组。变更窗口跨多个业务组时，要建多条。
4. **恢复语义。** Prometheus 类型的规则阈值写在 PromQL 里，序列消失和跌破阈值
   在夜莺看来是同一件事，都算恢复；exporter 挂掉会让告警「自动恢复」。
   这和 Alertmanager 的行为一致，但切换前值得跟值班同学讲一遍。
   细节见[判定与恢复](../alerting/evaluation.md)。

## 迁移顺序

每一步都能单独验证，出问题就停在那一步。

1. **注册数据源。** 集成中心 → 数据源 → 添加 → Prometheus，URL 填 Prometheus 的查询地址。
   *验证*：保存后连通性检查通过。字段逐个解释见 [Prometheus](../data/prometheus.md)。
2. **建通知媒介和消息模板。** 把 `receivers[]` 里每个接收器的地址、Token、密钥搬过来。
   *验证*：保存前点「测试」，真的收到一条消息。
3. **建通知规则，把路由树拍平。** 按上一节的表格逐条建。
   *验证*：每份通知配置点「发送测试」，先用「使用模拟事件」确认地址通，
   再用「选择历史事件」确认过滤条件放行了该放行的。见[测试通知](../notifications/test.md)。
4. **导入告警规则，先不启用。** 选好业务组 → 导入 → 导入 Prometheus 告警规则，
   粘贴 `rules.yml`，「是否启用」保持关闭。
   *验证*：导入结果表每行的结果列为空即成功。
5. **挂通知规则，挑一组先开。** 批量给这批规则挂上通知规则，只启用一个业务组做金丝雀。
   *验证*：对其中一条规则点[试运行](../alerting/test-fire.md)，看查询→阈值→事件→通知各段是否都通。
6. **搬静默。** 把 Alertmanager 里**还没过期**的静默重建成屏蔽规则，已过期的不用管。
   *验证*：屏蔽规则表单上的「测试」按钮会拿现有事件跑一遍匹配，看它到底会吞掉什么。
7. **并行跑一段。** 两边都判定、都发通知，对比触发结果。做法见
   [并行运行与回退方案](./coexistence.md)。
8. **下线。** 确认无差异后，从 Prometheus 的 `rule_files` 里摘掉告警规则并 reload
   （记录规则留着），最后停 Alertmanager。

## 回退

第 8 步之前，回退动作都一样：**把夜莺这批规则批量禁用**。夜莺侧的配置全部留着不用删——
禁用的规则不判定、不产生事件，Prometheus 那边压根没动过。

第 8 步之后要回退，就是把摘掉的 `rule_files` 加回去、reload Prometheus、重启 Alertmanager。
因为整个迁移过程中抓取和存储从未改动，历史数据不存在缺口。

## 下一步

- 两边同时跑、怎么对比：[并行运行与回退方案](./coexistence.md)
- 事件在夜莺里被处理的完整顺序：[降噪与路由模型](../concepts/noise-routing.md)
- 规则该归哪个业务组：[业务组与数据源范围](../alerting/scope.md)
