---
title: "二进制部署"
description: "使用二进制方式部署夜莺监控项目"
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2020-11-12T13:26:54+01:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 630
toc: true
---

## 下载

从 [GitHub](https://github.com/ccfos/nightingale/releases) 下载最新版本，然后你会得到一个类似 `n9e-{version}-linux-amd64.tar.gz` 的压缩包。

## 安装（使用 sqlite 和 miniredis）

这种方式不需要依赖 mysql 和 redis，使用 n9e 二进制直接启动即可。不过，这种方式不适合生产环境，仅用于测试。

```bash
#!/bin/bash
mkdir /opt/n9e && tar zxvf n9e-{version}-linux-amd64.tar.gz -C /opt/n9e

cd /opt/n9e

# check configurations in /opt/n9e/etc/config.toml and start n9e
nohup ./n9e &> n9e.log &
```

## 检查进程

```bash
# check process is runing or not
ss -tlnp|grep 17000
```

## 登录

打开浏览器访问 [http://localhost:17000](http://localhost:17000)。默认用户名是 `root`，默认密码是 `root.2020`。

> 请把 localhost 替换成你的服务器 IP 地址。

## 安装（使用 MySQL 和 Redis）

生成环境中，我们建议使用 MySQL 和 Redis 来存储数据。修改 `/opt/n9e/etc/config.toml` 配置文件，配置 MySQL 和 Redis 的连接信息。

DB 部分：

```toml
[DB]
DBType = "mysql"
DSN="YourUsername:YourPassword@tcp(127.0.0.1:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
```

Redis 部分：

```toml
[Redis]
Address = "127.0.0.1:6379"
Password = "YourRedisPassword"
RedisType = "standalone"
```

启动 n9e 二进制即可，夜莺会自动创建数据库表。当然，这需要你的 DB 连接账号具备创建数据库表的权限。

```bash
nohup ./n9e &> n9e.log &
```

打开浏览器访问 [http://localhost:17000](http://localhost:17000)。默认用户名是 `root`，默认密码是 `root.2020`。

> 请把 localhost 替换成你的服务器 IP 地址。

生产环境，我们建议使用 `systemd` 来管理 n9e 进程，并设置 n9e 进程开机自启动。
