# 用夜莺做 Ping 探测

从 Categraf 所在机器 ping 一批目标，得到丢包率、往返延迟和抖动，是判断机器存活最简单的手段。

最后校对于 2026-10-13

ping 插件向 `targets` 里的地址发 ICMP 探测，上报丢包率、最小/平均/最大/标准差 RTT 和 TTL。只要目标没禁 ping，这就是最省事的存活探测；也可以在多个机房各部署一个 Categraf，互相 ping 来观察链路质量。

不同的目标可以拆成多个 `[[instances]]` 并附加 `region`、`product` 之类的标签，仪表盘和规则按标签筛。目标多时要调大 Categraf 进程的文件描述符上限。规则覆盖目标不可达和丢包率升高。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **2 张仪表盘**，共 6 个面板
* **1 条告警规则**，每条附处置步骤
* **6 条指标说明**
* **Categraf 采集配置**：`input.ping`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.ping/ping.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.ping started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # send ping packets to

   targets = [

   #     "www.baidu.com",

   #     "127.0.0.1",

   #     "10.4.5.6",

   #     "10.4.5.7"

   ]



   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   ## Number of ping packets to send per interval.  Corresponds to the "-c"

   ## option of the ping command.

   # count = 1



   ## Time to wait between sending ping packets in seconds.  Operates like the

   ## "-i" option of the ping command.

   # ping_interval = 1.0



   ## If set, the time to wait for a ping response in seconds.  Operates like

   ## the "-W" option of the ping command.

   # timeout = 3.0



   ## Interface or source address to send ping from.  Operates like the -I or -S

   ## option of the ping command.

   # interface = ""



   ## Use only IPv6 addresses when resolving a hostname.

   # ipv6 = false



   ## Number of data bytes to be sent. Corresponds to the "-s"

   ## option of the ping command.

   # size = 56



   # max concurrency coroutine

   # concurrency = 50
   ```

2. 在夜莺「集成中心」里找到 Ping，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                     | 面板数 |
| -------------------------- | ------ |
| PING detection by UlricQin | 1      |
| PING大盘2.0                | 5      |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 1 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### PING address detection failed[​](#ping-address-detection-failed "PING address detection failed的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
ping_result_code != 0
```

处置步骤:

1. 在采集机上手工 ping -c 5 <目标> 复现，再用 mtr -n <目标> 定位丢包在哪一跳；
2. 目标机存活则确认它是否禁 ICMP——很多安全策略会禁，此时该探测不适用，应改用端口探测；
3. 中间跳丢包联系网络侧排查；
4. 确认目标机是否宕机或网卡故障。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 6 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                       | 含义                                                                                                    | 单位 |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ---- |
| `ping_ttl`                 | Ping ttl 时间 — Time To Live，指的是报文在网络中能够“存活”的限制时间                                    | s    |
| `ping_percent_packet_loss` | Ping 丢包率                                                                                             | %    |
| `ping_average_response_ms` | Ping 平均耗时                                                                                           | ms   |
| `ping_result_code`         | Ping 探测结果状态码 — 值为 0 就是正常，非 0 值就是异常。如果 Ping 失败，Categraf 日志中理应会有异常日志 |      |
| `ping_maximum_response_ms` | Ping 最大耗时                                                                                           | ms   |
| `ping_minimum_response_ms` | Ping 最小耗时                                                                                           | ms   |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Ping 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Ping）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Ping%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `ping` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/ping)：完整配置项和指标列表。
* [实践：端口与连通性探测](https://n9e.github.io/zh/docs/practice/port.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
