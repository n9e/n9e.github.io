---
title: "告警原理和流程说明"
description: "夜莺监控（Nightingale）最重要的功能就是告警引擎。本文介绍了夜莺的告警原理和数据流，把整个告警流程中涉及到的相关功能都介绍一下。"
date: 2025-06-23T11:00:09.623+08:00
lastmod: 2025-06-23T11:00:09.623+08:00
draft: false
images: []
menu:
  docs:
    parent: "usecase"
weight: 9900
toc: true
---

夜莺监控（Nightingale）的功能侧重点是告警引擎，为了做得灵活，整个告警流程涉及到的功能点比较多，本文从原理和数据流的角度，介绍一下相关知识，理解这些知识，对于您使用夜莺、排查告警问题，都会有帮助。

## 数据流原理概述

<img src="/img/usecase/alerting/01.png" alt="夜莺告警数据流原理概述" title="夜莺告警数据流原理概述">

1. 用户在 Web UI 配置告警规则，规则保存在 DB 中（通常是 MySQL）。
2. 告警引擎（`n9e` 进程内置一个告警引擎，边缘模式下 `n9e-edge` 进程里也内置告警引擎）从 DB 同步告警规则到内存中（通常 `n9e-edge` 无法直接读 DB，是调用的中心端 `n9e` 的接口获取的告警规则）。
3. 告警引擎会为每条告警规则创建一个 goroutine（协程，姑且可以理解为轻量级线程），按照用户在告警规则里配置的频率，周期性查询存储，对数据做异常判定，最终生成告警事件。
4. 产生告警事件后，要先持久化到 DB 中（通常是 MySQL），然后再走后面的通知规则。
5. 通知规则包含两部分，一个是若干事件处理器（比如 relabel、event update、event drop、ai summary 等），另一个是若干告警通知配置（比如 Critical 的告警事件关联电话、短信通知媒介，Warning 的告警事件只关联邮件媒介）。

## 告警规则

告警规则核心就是配置一个查询条件，比如 Prometheus 数据源就是配置 PromQL，ClickHouse 数据源就是配置 SQL，然后再配置一个阈值（Prometheus 场景下，阈值包含在 PromQL 中，不需要单独配置），达到阈值并满足持续时长，就告警。

告警引擎针对每条规则创建一个 goroutine（协程），周期性地查询数据源，判断是否满足告警条件。以 Prometheus 数据源举例，其原理是：

- 夜莺周期性调用数据源的 `/api/v1/query` 接口，把当前时间和 PromQL 作为查询条件传给这个接口。
- 数据源如果返回多条记录，大概率就要生成多条告警事件，接下来要看持续时长，如果持续时长为 0，立马生成告警事件，如果持续时长大于 0，就要把这条记录放到一个缓存中，等到持续时长满足条件后，再生成告警事件，在持续时长过程中，如果后面的执行周期查不到数据了，就会把这条记录从缓存中删除，也就不会生成告警事件了。

这里经常遇到的问题是，告警引擎在查询的时候没有查到数据，故而无法生成告警事件，但是后面排查的时候发现那个时间点却是有数据满足阈值的，百思不得其解，这种情况，可能的原因有两个：

- 因为监控数据的上报有延迟导致的，在这里夜莺只是一个 client，数据源是 server，数据源没有返回数据，就要去看 server 侧的问题，看 server 侧的数据为啥没有返回，通常是数据有各种因素延迟了。
- 查询超时了，日志文件里通常可以看到相关日志，可以在数据源配置页面调大查询超时时间，或者排查数据源为啥返回慢了，另外硬件方面也可能有问题，比如 client、server 两边是否有网卡丢包。超时的日志，可以检索关键字：`alert-${datasource-id}-${alert-rule-id}`

其中：

- `${datasource-id}` 是数据源的 ID，在数据源详情页面可以看到
- `${alert-rule-id}` 是告警规则的 ID，编辑告警规则时，在 URL 中可以看到

告警问题排查时，首先要看是否产生了告警事件，如果产生了告警事件，说明告警规则没问题，接下来再排查后面通知相关的问题，如果告警事件都没有产生，那就是告警规则和数据源的问题，首先要确认告警规则的配置再谈其他。

## 事件持久化

告警事件产生后需要写入 DB（通常是 MySQL），于是你才能在告警事件列表中看到这个事件。有时会写失败，写失败的话在日志里通常会有体现，排查 WARNING 和 ERROR 日志即可。

## 告警规则关联通知规则

告警事件产生之后，应该走后续的哪个通知规则？即告警规则和通知规则如何建立关联关系？有两个办法建立关联关系：

- 告警规则里直接配置通知规则。即这个告警规则产生的所有告警事件，都要走这些通知规则。
- 告警规则里不配通知规则，而是配置订阅规则，即：在订阅规则里按照各种条件筛选告警事件，筛选到的告警事件，走订阅规则里配置的通知规则。

上面两种方式都可以，前者更直观，如果没有特殊需求，推荐使用前者。但是对于一些全局的事件处理，比如我想把夜莺监控中产生的所有告警事件都走一个 Callback 处理器，此时可以使用订阅规则，订阅所有的告警事件，统一关联一个全局通知规则，在这个全局通知规则里配置 Callback 处理器。

## 通知规则配置

下图是通知规则的编辑页面，我在图中标注了各个区块的作用：

<img src="/img/usecase/alerting/02.png" alt="夜莺通知规则配置" title="夜莺通知规则配置">

大部分表单项的标题位置，都有一个小问号图标，鼠标悬停在上面会有提示信息，大家可以参考提示信息来配置。

> 💡 这个页面里包含一些通知测试的按钮，点击之后，可以选择已生成的告警事件做通知规则的测试，便于您快速验证通知规则是否符合预期。另外要注意，告警事件持久化发生在通知规则之前，所以通知规则里的各个事件处理器，不会对 DB 中的告警事件产生修改。

### 事件处理器

> 💡 事件 Pipeline 并没有一个单独的菜单入口，作为通知规则的一部分，是在通知规则的编辑页面里，点击「事件处理」区块的小齿轮图标可以展开事件处理器的配置侧拉板。

事件处理器是一个高级机制，允许您对告警事件做各种处理，比如：

- 对告警事件做 relabel，拆分一些标签，修改一些标签等
- 更新告警事件，夜莺把告警事件传给第三方（比如 CMDB ）接口，第三方可以对告警事件做修改，然后把修改之后的内容返回，继续走后续事件处理逻辑，方便与外部系统做打通
- 丢弃告警事件，一些告警事件不需要通知，可以在这里做复杂的判断，符合条件的丢弃掉
- 生成 AI 摘要，把告警事件传给 DeepSeek 等，让 AI 帮忙生成摘要和解法，把 AI 生成的内容放到事件中，后续通过通知媒介发出来

这里有两个概念要注意：

- 事件处理的 Pipeline，就是点击`通知规则-事件处理`右侧那个按钮展开的侧拉板，里边就是 Pipeline 的列表
- 每个 Pipeline 可以包含多个 Processor（处理器），如果想提高复用性，也可以简单来搞，每个 Pipeline 只包含一个 Processor。

每个处理器，页面上都有一个文档说明链接，点击之后可以查看详细的文档说明。也可以参考下面两个链接的资料：

- [事件处理器说明](/zh/docs/usecase/processor/)
- [自定义通知媒介](/zh/docs/usecase/media/)
- [开源夜莺监控实现发版时告警静默](https://mp.weixin.qq.com/s/Of90imqi0T_fV1QGxAkR0Q)

### 通知配置

这部分在前面已经讲解过，这里不再赘述，请参考：

- [通知规则设计初衷和使用说明](/zh/docs/usage/notify-rules/)

