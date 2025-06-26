---
title: "二进制部署"
description: "使用二进制方式部署夜莺监控项目"
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2025-01-26T09:26:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 210
toc: true
---

如果您尚未阅读《[安装前置说明](/zh/docs/install/pre-intro/)》 章节，请先阅读，之后再阅读本章节。

## 下载

从 [GitHub](https://github.com/ccfos/nightingale/releases) 下载最新版本，然后你会得到一个类似 `n9e-${version}-linux-amd64.tar.gz` 的压缩包。这是 X86 CPU 架构的发布包，如果你需要 ARM 架构的就下载那个 arm64 的包，没有提供 Windows 版本的发布包，因为夜莺监控是一个服务端项目，通常运行在 Linux 系统上。

如果你想在 Windows 和 Mac 上运行夜莺也是 OK 的，只是需要你自行编译了，编译也比较简单，可以参考项目代码仓库下的 `Makefile` 文件内的逻辑。

将下载的压缩包解压缩到 `/opt/n9e` 目录下。

```bash
mkdir /opt/n9e && tar zxvf n9e-${version}-linux-amd64.tar.gz -C /opt/n9e
```

## 单节点测试安装

这种模式下，只是为了测试，既不用依赖 MySQL 也不用依赖 Redis（实际是使用的 SQLite 和内存型 Redis：miniredis），启动比较简单，直接解压后启动即可。

### 启动进程

```bash
cd /opt/n9e && nohup ./n9e &> n9e.log &
```

因为只是测试模式，就直接使用 nohup 启动了，生产环境肯定是需要使用 systemd 来托管 n9e 进程的。

### 检查进程

```bash
# check process is runing or not
ss -tlnp|grep 17000
```

### 登录

打开浏览器访问 [http://localhost:17000](http://localhost:17000)。默认用户名是 `root`，默认密码是 `root.2020`。

> 请把 localhost 替换成你的服务器 IP 地址。

## 单节点正式安装

生产环境中，我们建议使用 MySQL 和 Redis 来存储数据。

### 修改配置

修改 `/opt/n9e/etc/config.toml` 配置文件，配置 MySQL 和 Redis 的连接信息。

DB 部分：

```toml
[DB]
DBType = "mysql"
DSN = "YourUsername:YourPassword@tcp(127.0.0.1:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
```

Redis 部分：

```toml
[Redis]
Address = "127.0.0.1:6379"
Password = "YourRedisPassword"
RedisType = "standalone"
```

### 启动进程

启动 `n9e` 二进制即可，夜莺会自动创建数据库表。当然，这需要你的 DB 连接账号具备创建数据库表、改表的权限。

```bash
nohup ./n9e &> n9e.log &

## 检查进程是否启动成功
ps -ef | grep n9e

## 检查端口是否正常在监听
ss -tlnp | grep 17000
```

nohup 可以快速启动验证，有问题查看 n9e.log 日志文件。

### 使用 systemd 管理

生产环境建议使用 `systemd` 来管理 n9e 进程。下面是一个简单的 `systemd` 配置示例：

```ini
[Unit]
Description=Nightingale Monitoring Service
After=network.target
[Service]
Type=simple
ExecStart=/opt/n9e/n9e
WorkingDirectory=/opt/n9e
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=n9e
[Install]
WantedBy=multi-user.target
```

将上述内容保存为 `/etc/systemd/system/n9e.service`，然后执行以下命令：

```bash
## 设置夜莺进程开机自启动
sudo systemctl enable n9e

## 启动夜莺进程
sudo systemctl start n9e
```

### 登录

打开浏览器访问 [http://localhost:17000](http://localhost:17000)。默认用户名是 `root`，默认密码是 `root.2020`。

> 请把 localhost 替换成你的服务器 IP 地址。

## 集群模式

在《[夜莺架构设计](/zh/docs/prologue/architecture/)》中已经讲解过集群模式的逻辑，这里不再赘述。从部署角度，只需要搞多个机器，每个机器部署一个 n9e 进程，配置好 MySQL 和 Redis 的连接信息即可。多个 n9e 进程复用同一套 MySQL 和 Redis，所以这多个 n9e 进程的配置文件是完全一样的。

## 边缘模式

边缘模式要用到 `n9e-edge` 这个二进制，可以在 `n9e-${version}-linux-amd64.tar.gz` 压缩包里找到。`n9e-edge` 需要和中心端的 `n9e` 通信，同步告警规则，所以 `n9e-edge` 的配置文件中需要给出中心端 `n9e` 的连接信息。

边缘机房的 `n9e-edge` 也可以部署多个实例组成集群，同一个集群内多个 `n9e-edge` 的配置文件也要保持一致，配置文件中的 EngineName 相同的实例，会被看做一套引擎集群的多个实例，取一个和中心端 `n9e` 不一样的名字。中心端的 `n9e` 的 EngineName 默认叫 `default`，边缘端 `n9e-edge` 的 EngineName 默认叫 `edge`。

如果你有多个边缘机房，需要每个边缘机房的 `n9e-edge` 的 EngineName 都不一样，比如 `edge1`、`edge2` 等等。这样区分之后，才能做到不同的数据源指定不同的告警引擎。

更多边缘模式的说明请参考：[夜莺监控 - 边缘告警引擎架构详解](https://mp.weixin.qq.com/s/0zmABASg2jwYExo-zAyCTA)。
