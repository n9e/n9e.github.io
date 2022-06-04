---
title: "Ibex"
description: "夜莺 Nightingale 的告警自愈模块的安装"
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2020-11-12T13:26:54+01:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 650
toc: true
---

*Ibex 是告警自愈功能依赖的模块，提供一个批量执行命令的通道，可以做到在告警的时候自动去目标机器执行脚本，如果大家没有此需求，无需阅读本节内容。*


## 概述

所谓的告警自愈，典型手段是在告警触发时自动回调某个 webhook 地址，在这个 webhook 里写告警自愈的逻辑，夜莺默认支持这种方式。另外，夜莺还可以更进一步，配合 ibex 这个模块，在告警触发的时候，自动去告警的机器执行某个脚本，这种机制可以大幅简化构建运维自愈链路的工作量，毕竟，不是所有的运维人员都擅长写 http server，但所有的运维人员，都擅长写脚本。这种方式是典型的物理机时代的产物，希望各位朋友用不到这个工具（说明贵司的IT技术已经走得非常靠前了）。

## 架构

ibex 包括 server 和 agentd 两个模块，agentd 周期性调用 server 的 rpc 接口，询问有哪些任务要执行，如果有分配给自己的任务，就从 server 拿到任务脚本信息，在本地 fork 一个进程运行，然后将结果上报给服务端。为了简化部署，server 和 agentd 融合成了一个二进制，就是 ibex，通过传入不同的参数来启动不同的角色。ibex 架构图如下：

<img src="/images/install-ibex.png" width="400">

## 项目地址

- Repo：[https://github.com/flashcatcloud/ibex](https://github.com/flashcatcloud/ibex) 
- Linux-amd64 有编译好的二进制，[在这里](https://github.com/flashcatcloud/ibex/releases)

## 安装启动

下载安装包之后，解压缩，在 etc 下可以找到服务端和客户端的配置文件，在 sql 目录下可以找到初始化 sql 脚本。

### 初始化 sql

```bash
mysql < sql/ibex.sql
```

### 启动 server

server 的配置文件是 `etc/server.conf`，注意修改里边的 mysql 连接地址，配置正确的 mysql 用户名和密码。然后就可以直接启动了：

```bash
nohup ./ibex server &> server.log &
```

ibex 没有 web 页面，只提供 api 接口，鉴权方式是 http basic auth，basic auth 的用户名和密码默认都是 ibex，在 `etc/server.conf` 中可以找到，如果ibex 部署在互联网，一定要修改默认用户名和密码，当然，因为 Nightingale 要调用 ibex，所以 Nightingale 的 server.conf 和 webapi.conf 中也配置了 ibex 的 basic auth 账号信息，要改就要一起改啦。

### 启动agentd

客户端的配置非常非常简单，agentd.conf 内容如下：

```toml
# debug, release
RunMode = "release"

# task meta storage dir
MetaDir = "./meta"

[Heartbeat]
# unit: ms
Interval = 1000
# rpc servers
Servers = ["10.2.3.4:20090"]
# $ip or $hostname or specified string
Host = "telegraf01"
```

重点关注 Heartbeat 这个部分，Interval 是心跳频率，默认是 1000 毫秒，如果机器量比较小，比如小于 1000 台，维持 1000 毫秒没问题，如果机器量比较大，可以适当调大这个频率，比如 2000 或者 3000，可以减轻服务端的压力。Servers 是个数组，配置的是 ibex-server 的地址，ibex-server 可以启动多个，多个地址都配置到这里即可，Host 这个字段，是本机的唯一标识，有三种配置方式，如果配置为 `$ip`，系统会自动探测本机的 IP，如果是 `$hostname`，系统会自动探测本机的 hostname，如果是其他字符串，那就直接把该字符串作为本机的唯一标识。每个机器上都要部署 ibex-agentd，不同的机器要保证 Host 字段获取的内容不能重复。

要想做到告警的机器自动执行脚本，需要保证告警消息中的 ident 表示机器标识，且和 ibex-agentd 中的 Host 配置对应上。

下面是启动 ibex-agentd 的命令：

```bash
nohup ./ibex agentd &> agentd.log &
```

另外，细心的读者应该会发现 ibex 的压缩包里的 etc 目录下有个 service 目录，里边准备好了两个 service 样例文件，便于大家使用 systemd 来管理 ibex 进程，生产环境，建议使用 systemd 来管理。[nohup和systemd的知识](https://edu.51cto.com/course/31049.html)
