---
title: "夜莺架构设计"
description: "本文讲解夜莺监控（Nightingale）的架构设计。包括中心化集群的设计以及边缘机房下沉部署模式。"
date: 2025-05-30T22:31:56.348+08:00
lastmod: 2025-05-30T22:31:56.348+08:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 190
toc: true
---

夜莺的架构比较简单，如果只是测试功能，一个二进制就可以启动，如果要上到生产环境，则要依赖 MySQL 和 Redis。有些公司会有多个机房，有些边缘机房和中心机房的网络质量较差，夜莺也针对这种情况做了专门的设计。

## 架构图

不考虑边缘模式的话，夜莺只有一个主进程，即 `n9e` 进程，依赖 MySQL 和 Redis 存储一些管理数据，可以接入多种数据源，技术架构图示意如下：

<img src="/img/prologue/arch/01.png" alt="夜莺技术架构图"/>

初期支持的数据源：Prometheus、VictoriaMetrics、ElasticSearch，既支持看图也支持告警，后面夜莺侧重在做告警引擎，所以后面新支持的数据源就只支持告警。

根据监控数据是否流经夜莺，可以分成两个模式：

- **模式1**：监控数据不流经夜莺，用户自己搞定数据采集的问题，仅把时序库配置到夜莺里，使用夜莺看图和配置告警。上面的架构图就是典型的这种模式。
- **模式2**：数据流经夜莺，Categraf 通过 remote write 协议把数据推给夜莺，夜莺不直接存储数据，而是把数据转存到时序库，转存到哪些时序库？由夜莺配置文件 config.toml 中的 `Pushgw.Writers` 来决定，模式2下的架构图如下：

<img src="/img/prologue/arch/02.png" alt="夜莺数据流架构图"/>

上图中，夜莺接到监控数据之后转发给了 VictoriaMetrics，当然，也可以转发给 Prometheus，如果要转发给 Prometheus，记得 Prometheus 启动的时候要打开 remote receiver 的功能（`./prometheus --help | grep receiver` 可以看到具体是要加哪个控制参数），即开启 Prometheus 的 `/api/v1/write` 接口。

> 🟢 如果是新用户，建议直接使用 VictoriaMetrics，VictoriaMetrics 性能更好，且支持集群模式，而且，和 Prometheus 接口兼容。不过 VictoriaMetrics 的中文资料比 Prometheus 更少一些。

## 单节点测试模式

从夜莺的 [github releases](https://github.com/ccfos/nightingale/releases) 下载发布包，解压之后里边有个 `n9e` 二进制文件，直接 `./n9e` 就可以运行起来，默认端口是 17000，默认用户名是 `root`，密码是 `root.2020`。

`n9e` 进程只依赖二进制同级目录的 `etc` 和 `integrations` 目录，不依赖其他任何服务。

在这种单机模式下，方便做快速测试，不过不建议用于生产环境。此种模式下，夜莺会把配置类数据（比如用户信息、告警规则、仪表盘等）存储在本地的 SQLite 数据库文件中，所以 `n9e` 进程启动之后，同级目录下会生成一个 `n9e.db` 的 SQLite 数据库文件。

## 单节点生产模式

如果要上到生产环境，则需要依赖 MySQL 和 Redis。所以，需要在配置文件 `etc/config.toml` 中配置 MySQL 和 Redis 的连接信息。

MySQL 的关键配置样例：

```toml
[DB]
DBType = "mysql"
DSN = "root:YourPa55word@tcp(localhost:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
```

上面 `DSN`（连接字符串）的格式是 `用户名:密码@tcp(地址:端口)/数据库名?参数`，其中 `n9e_v6` 是夜莺的数据库名，从 V6 版本开始，就一直习惯使用这个名字了（即便现在是 V8+ 版本了），建表语句里也一直延用了这个名字。

Redis 的关键配置样例：

```toml
[Redis]
Address = "127.0.0.1:6379"
RedisType = "standalone"
```

上面只是给了最基础的配置样例，配置文件中还有很多其他配置项，具体可以参考配置文件中的注释，也可以参考这里的[配置文件说明](/zh/docs/install/configuration/)。

## 夜莺集群

集群模式很简单，只需要搞多台机器，每台机器都部署 `n9e` 进程（进程要想正常工作依赖 `etc` 和 `integrations` 目录），多个 `n9e` 的配置文件确保完全一致，共享同一套 MySQL 和 Redis，即可。

多个 `n9e` 进程会自动分派告警规则，比如有 2 个 `n9e` 进程，用户共配置了 100 条告警规则，夜莺会自动把这 100 条告警规则分配到 2 个 `n9e` 进程上，每个进程大概 50 条告警规则（一个规则只会在某一个 `n9e` 实例上运行，不会重复告警）。如果某个机器挂了，另一个机器上的 `n9e` 会接管它的告警规则，继续工作。

## 边缘机房下沉部署模式

上面讲到的几种模式，都是中心化模式，但实际生产环境里，可能会有多个机房，中心机房和边缘机房的网络质量可能不太好，如果让中心机房的 `n9e` 负责边缘机房的某个时序库的告警，会不稳定，有时甚至 `n9e` 直接连不通边缘机房的时序库，这时就需要夜莺的边缘机房下沉部署模式。

这个模式之前详细写过一篇文章，直接参考即可：[夜莺监控 - 边缘告警引擎架构详解](https://mp.weixin.qq.com/s/0zmABASg2jwYExo-zAyCTA)，文章中的一些截图稍微老了点，不过原理是一样的。
