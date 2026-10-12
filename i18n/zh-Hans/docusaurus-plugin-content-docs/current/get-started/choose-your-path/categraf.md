---
title: "还没采集，从 Categraf 开始"
sidebar_label: "还没采集，从 Categraf 开始"
description: "在一台机器上装 Categraf，通过 Remote Write 指向夜莺，一分钟内在对象列表里看到它上线。"
last_reviewed: 2026-10-10
---

这条路的终点：一台机器出现在夜莺的设备列表里，CPU、内存、磁盘都有数，
并且它的指标被内置时序库存了下来。大约 10 分钟。

适合手上还没有 Prometheus、想先看到东西的人。

## 开始之前

- 夜莺已经起来了，你知道它的地址（下面写成 `http://n9e:17000`）；
- 一台 Linux 或 macOS 机器，能访问上面那个地址。

## 1. 装 Categraf

从 [Categraf releases](https://github.com/flashcatcloud/categraf/releases) 下载对应平台的包，解压：

```bash
tar xzf categraf-vX.Y.Z-linux-amd64.tar.gz
cd categraf-vX.Y.Z-linux-amd64
```

目录里有 `categraf` 二进制和一个 `conf/` 目录，`conf/` 下每个 `input.xxx` 就是一个采集插件。
默认打开的是操作系统那几个（cpu、mem、disk、net…），够用。

## 2. 指向夜莺

改 `conf/config.toml` 两个地方：

```toml
[[writers]]
# 指标写到这里；夜莺按 Pushgw.Writers 的配置决定自己存还是转发
url = "http://n9e:17000/prometheus/v1/write"

[heartbeat]
enable = true
# 心跳走这里；设备列表靠它才知道这台机器活着
url = "http://n9e:17000/v1/n9e/heartbeat"
```

要给这台机器打标签（后面写规则、做路由都用得上），在 `[global.labels]` 下加：

```toml
[global.labels]
env = "prod"
region = "shanghai"
```

主机名默认取系统 hostname。想自己指定就改 `hostname = "your-name"`。

## 3. 起来

```bash
./categraf --configs ./conf
```

`--configs` **要用绝对路径**，或者确认好当前目录——categraf 启动时会 chdir 到自己二进制
所在的目录，相对路径是相对二进制算的，不是相对你敲命令的那个目录。

## 4. 确认它上线了

**基础设施 → 设备列表**，一分钟内应该能看到这台机器，状态是在线，并带上 CPU、内存利用率。

<Shot src="/img/docs/data/targets-list.zh" alt="设备列表，机器已经上报" />

看不到就按顺序查：

1. categraf 日志里有没有 `post to ... got error`——那是写入地址不通；
2. 这台机器能不能访问到夜莺（防火墙、安全组）；
3. 两边时间差是不是超过了几分钟。

细的排查见 [Categraf 对象为什么显示离线？](../../troubleshooting/categraf-offline.md)。

## 5. 顺手导一套仪表盘和规则

**集成中心 → 模板中心 → Linux**，里面有配套的仪表盘和告警规则，选中导入到某个业务组即可，
不用自己从零画图、从零写规则。

## 下一步

- 让告警送到人：[通知](../../notifications/overview.mdx)
- 采集别的东西（MySQL、Redis、Nginx…）：模板中心里有 80 多个组件包
- 生产环境的采集器怎么部署：[Categraf](../../data/categraf/install.md)
