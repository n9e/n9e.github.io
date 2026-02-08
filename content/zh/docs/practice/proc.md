---
title: "进程监控"
description: "本文介绍了进程监控的实践经验，包括总体进程数量统计和单一进程指标采集。对 Categraf 的 processes 插件和 procstat 插件做了详细说明，并提供了相关仪表盘的链接。"
date: 2025-06-03T09:15:37+08:00
lastmod: 2025-06-03T09:15:37+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5100
toc: true
---

> 对于监控系统，基础功能的强弱确实非常关键，但是如何在不同的场景落地实践，则更为关键。在《监控实践》章节，搜罗各类监控实践经验，会以不同的组件分门别类，您如果对某个组件有好的实践经验，欢迎提 PR，把您的文章链接附到对应的组件目录下。

进程监控分两部分，一部分是操作系统内整体进程数量统计，另一部分是单一进程指标采集。

## 总体进程数量

以 Categraf 为例，Categraf 提供了 `processes` 插件用于统计机器上的进程数量，比如总进程数量多少、Running 状态的进程数量多少、Sleeping 状态的进程数量多少等。针对 `processes` 插件采集的数据，我们整理过专门的仪表盘：

> https://github.com/ccfos/nightingale/blob/main/integrations/Linux/dashboards/categraf-processes.json

这类指标有什么用？通常是非预期的启动了大量进程的场景。比如笔者之前遇到：crontab 写挫了，脚本 hang 住了，而且没有在 cron 脚本里检测之前的进程是否退出，导致每次 crontab 执行时都启动了一个新的进程，最终导致机器上有大量的同名进程在运行，最终酿成事故。这个时候就可以通过 `processes` 插件采集的指标来发现问题。

## 单一进程指标

单一进程指标，指的是进程占用的 CPU、内存、句柄等指标。有多种方式可以采集。

- 在进程里埋点。比如 Java 程序可以使用 micrometer 或者 Spring Boot Actuator 等方式来采集指标，Go 程序可以使用 Prometheus 的 Go 语言客户端库来采集指标。
- 在进程外采集。比如使用 Process Exporter、Categraf 的 procstat 插件等采集进程指标。

通常来讲，在进程里埋点是更推荐的做法。不但可以采集进程的 CPU、内存 等常规指标，也可以采集更多运行时指标，比如 Java 程序可以采集 JVM 的一些指标，Go 程序可以采集一些 goroutine、gc 的指标。所有优秀的开源软件，都会暴露自身的监控指标。作为业务研发人员，水平参差不齐，可能有些人不清楚埋点的重要性，此时也可使用进程外采集的方式来做补充。

> Spring Boot Actuator 是可以通过配置调整来直接暴露 Prometheus 格式的 metrics 数据的，所以不需要额外的插件来采集，直接使用 Categraf 的 `prometheus` 插件即可。或者直接在 Prometheus 或 vmagent 里配置抓取规则也可以。

以 Categraf 的 `procstat` 插件为例，其文档参考 [这里](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/procstat/)。重点要关注的指标是：

- procstat_lookup_count 进程数量，如果为 0，表示对应的进程挂了
- procstat_rlimit_num_fds_soft 进程的软限制句柄数，如果是 1024，通常表示系统参数没有调优好
- procstat_cpu_usage_total 进程 CPU 使用率
- procstat_mem_usage_total 进程内存使用率
- procstat_num_fds_total 进程打开的文件句柄数
- procstat_read_bytes_total 进程读取的总字节数
- procstat_write_bytes_total 进程写入的总字节数

单一进程的仪表盘可以参考：

> https://github.com/ccfos/nightingale/blob/main/integrations/Procstat/dashboards/categraf-procstat.json

## FAQ

### procstat 插件监控多个进程怎么做？

配置样例如下：

```toml
[[instances]]
search_exec_substring = "mysqld"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]

[[instances]]
search_exec_substring = "n9e-plus"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]
```

### procstat 配置中的 gather_more_metrics 里边的 jvm 参数是什么作用？

如果 gather_more_metrics 包含 jvm 则会认为要采集的目标进程是个 Java 进程，会调用系统的 jstat 命令采集 JVM 的一些基础指标。jstat 是安装 JDK 时自带安装的一个工具，在 JDK 的 bin 目录下。这里经常会有一个坑，就是用户在 gather_more_metrics 配置了 jvm，机器上也有 jstat，使用如下命令测试采集的时候也可以采集到数据：

```bash
./categraf --test --inputs procstat
```

但是重启 Categraf 正式采集之后，却又采集不到了。通常的原因是：Categraf 使用 systemd 托管的，而 systemd 并不知道 JDK 的环境变量，所以找不到 jstat 命令导致的。解决方法是配置 Categraf 的 service 文件，添加 JDK 的环境变量。比如：

```
Environment="PATH=/usr/lib/jvm/java-11-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```