# 用夜莺监控 NSQ

读取 nsqd 的 /stats 接口，拿到每个 topic 和 channel 的积压、在途消息、超时和客户端数，规则盯积压增长和消费者掉线。

最后校对于 2026-10-28

NSQ 插件从 Telegraf 移植，访问 nsqd 的 `/stats` HTTP 接口，采集 topic 级别的消息总数与积压、channel 级别的 depth、in-flight、deferred、requeue 和 timeout 计数，以及每个客户端连接的 ready 与 in-flight 状态。

规则覆盖 channel 积压持续增长、消息超时和 requeue 升高、channel 没有消费者、nsqd 不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.nsq`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.nsq/nsq.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.nsq started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   # [[instances]]

   ## The Nsq API URI used to collect statistical information.

   # targets = ["http://localhost:4151"]

    

   # headers={Authorization="", X-Forwarded-For="", Host=""}

    

   # timeout="5s"



   # # basic auth

   # username=""

   # password=""



   ## append some labels for series

   # labels = { product="nsq" }



   ## interval = global.interval * interval_times

   # interval_times = 1
   ```

2. 在夜莺「集成中心」里找到 NSQ，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### NSQ Channel 消息积压[​](#nsq-channel-消息积压 "NSQ Channel 消息积压的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
nsq_channel_depth > 10000
```

处置步骤:

1. 从告警标签取 topic 与 channel，执行 curl -s http\://\<nsqd>:4151/stats?format=json 查看该 channel 的 client\_count 与 in\_flight\_count；
2. client\_count 正常但 in\_flight 长期打满，说明单条消息处理慢，去消费端应用日志与链路追踪里定位慢在哪一步；
3. 处理逻辑本身慢则扩容消费者实例数，或调大消费端的 max\_in\_flight；
4. 若积压由一次性流量洪峰造成，评估后可用 curl -X POST 'http\://\<nsqd>:4151/channel/empty?topic=..\&channel=..' 清空，注意会丢消息，须先确认业务可接受。

### NSQ Channel 消息溢出到磁盘[​](#nsq-channel-消息溢出到磁盘 "NSQ Channel 消息溢出到磁盘的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
nsq_channel_backend_depth > 0
```

处置步骤:

1. 执行 curl -s http\://\<nsqd>:4151/stats?format=json 对比 depth 与 backend\_depth，确认落盘规模；
2. 落盘的根因一般还是消费慢，优先按积压问题扩容消费者或优化消费逻辑；
3. 检查 nsqd 数据目录（--data-path）所在磁盘剩余空间，用 df -h 确认不会被写满；
4. 若是可预期的短时洪峰，可调大 --mem-queue-size 换取内存缓冲，但要同步评估 nsqd 进程内存上限。

### NSQ Channel 无消费者但有积压[​](#nsq-channel-无消费者但有积压 "NSQ Channel 无消费者但有积压的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
nsq_channel_client_count == 0 and nsq_channel_depth > 0
```

处置步骤:

1. 从告警标签取 topic 与 channel，确认对应的消费端服务是否已全部下线或崩溃；
2. 消费端在跑则检查它到 nsqlookupd/nsqd 的连接（netstat -anp | grep 4150）与消费端日志里的连接报错；
3. 若是发布后消费者版本换了 channel 名，导致老 channel 变成孤儿，确认无用后执行 curl -X POST 'http\://\<nsqd>:4151/channel/delete?topic=..\&channel=..' 删除；
4. 消费端确实需要恢复的，拉起后观察 depth 是否开始下降。

### NSQ 消息处理超时激增[​](#nsq-消息处理超时激增 "NSQ 消息处理超时激增的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(nsq_channel_timeout_count[5m]) > 1
```

处置步骤:

1. 从告警标签取 topic 与 channel，去消费端应用日志里找处理耗时超过 msg-timeout 的记录；
2. 若处理确实需要更久，在消费端对长任务周期性调用 Touch() 续期，或调大 nsqd 的 --msg-timeout；
3. 若是下游依赖（数据库、第三方接口）变慢拖垮处理，先修下游并在消费端加超时与熔断；
4. 确认业务逻辑幂等，否则重投递会造成重复写入。

### NSQ 消息重新入队激增[​](#nsq-消息重新入队激增 "NSQ 消息重新入队激增的直接链接")

S3 提醒 · 持续 5 分钟 · 触发条件:

```
rate(nsq_channel_requeue_count[5m]) > 10
```

处置步骤:

1. 从消费端日志统计失败原因，区分是业务校验失败（不应重试）还是依赖抖动（应重试）；
2. 业务校验失败的应改为 FIN 掉并落死信存储，而不是无限 REQ；
3. 依赖抖动的检查重试退避是否设置合理，避免固定间隔重试形成风暴；
4. 结合 nsq\_channel\_timeout\_count 一起看，若两者同时高说明消费端整体已经过载，需要先扩容。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[NSQ 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/NSQ）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/NSQ%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `nsq` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/nsq)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
