---
title: "SNMP"
description: "夜莺（ Nightingale ）通过 SNMP 监控网络设备"
lead: ""
date: 2020-10-06T08:48:57+00:00
lastmod: 2020-10-06T08:48:57+00:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 810
toc: true
---

监控网络设备，主要是通过 SNMP 协议，Categraf、Telegraf、Datadog-Agent、snmp_exporter 都提供了这个能力。

## switch_legacy

Categraf 提供了一个网络设备的采集插件：switch_legacy，在 `conf/input.switch_legacy` 下可以看到配置文件，最核心就是配置交换机的 IP 以及认证信息，switch_legacy 当前只支持 v2 协议，所以认证信息就是 community 字段。其他配置都一目了然，这里就不赘述了。

这个插件是把之前 Open-Falcon 社区的 [swcollector](https://github.com/gaochao1/swcollector) 直接拿过来了，感谢 `冯骐` 大佬持续在维护这个开源项目。

## snmp

Categraf 从 v0.2.13 版本开始把 Telegraf 的 snmp 插件集成了进来，推荐大家采用这个插件来监控网络设备。这个插件的核心逻辑是：要采集什么指标，直接配置对应的 oid 即可，而且可以把一些 oid 采集到的数据当做时序数据的标签，非常非常灵活。

当然，弊端也有，因为 SNMP 体系里有大量的私有 oid，比如不同的设备获取 CPU、内存利用率的 oid 都不一样，这就需要为不同的型号的设备采用不同的配置，维护起来比较麻烦，需要大量的积累。这里我倡议大家把不同的设备型号的采集配置积累到 [这里](https://github.com/flashcatcloud/categraf/tree/main/inputs/snmp)，每个型号一个文件夹，长期积累下来，那将是利人利己的好事。不知道如何提PR的可以联系我们。

另外，也不用太悲观，针对网络设备而言，大部分监控数据的采集都是通用 oid 就可以搞定的，举个例子：

```toml
interval = 60

[[instances]]
agents = ["udp://172.30.15.189:161"]

interval_times = 1
timeout = "5s"
version = 2
community = "public"
# agent_host_tag 设置为 ident，这个交换机就会当做监控对象出现在夜莺的监控对象列表里
# 看大家的需要，我个人建议把 agent_host_tag 设置为 switch_ip
agent_host_tag = "ident"
retries = 1

[[instances.field]]
oid = "RFC1213-MIB::sysUpTime.0"
name = "uptime"

[[instances.field]]
oid = "RFC1213-MIB::sysName.0"
name = "source"
is_tag = true

[[instances.table]]
oid = "IF-MIB::ifTable"
name = "interface"
inherit_tags = ["source"]

[[instances.table.field]]
oid = "IF-MIB::ifDescr"
name = "ifDescr"
is_tag = true

```

上面的样例是 v2 版本的配置，如果是 v3 版本，校验方式举例：

```toml
version = 3
sec_name = "managev3user"
auth_protocol = "SHA"
auth_password = "example.Demo.c0m"
```

另外，snmp 的采集，建议大家部署单独的 Categraf 来做，因为不同监控对象采集频率可能不同，比如边缘交换机，我们 5min 采集一次就够了，核心交换机可以配置的频繁一些，比如 60s 或者 120s，如何调整采集频率呢？需要借助 interval 和 interval_times 等配置实现，具体可以参考《[讲解Categraf采集器](https://mp.weixin.qq.com/s/T69kkBzToHVh31D87xsrIg)》中的视频教程。
