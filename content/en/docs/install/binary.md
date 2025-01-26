---
title: "Binary install"
description: "Deploy nightingale via binary"
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

## Download

Download the latest release from [GitHub](https://github.com/ccfos/nightingale/releases), then you will get a tarball which name is like `n9e-{version}-linux-amd64.tar.gz`

## Install using sqlite and miniredis

This approach doesn't rely on MySQL and Redis. You can simply start it using the n9e binary. However, this method isn't suitable for production environments and is only intended for testing purposes. 

```bash
#!/bin/bash
mkdir /opt/n9e && tar zxvf n9e-{version}-linux-amd64.tar.gz -C /opt/n9e

cd /opt/n9e

# check configurations in /opt/n9e/etc/config.toml and start n9e
nohup ./n9e &> n9e.log &
```

## Check Process

```bash
# check process is runing or not
ss -tlnp|grep 17000
```

## Login

Open web browser and go to [http://localhost:17000](http://localhost:17000). The default username is `root` and default password is `root.2020`.

> Please replace localhost with your server's IP address.

## Install using MySQL and Redis

In production environments, we recommend using MySQL and Redis to store data. Modify the `/opt/n9e/etc/config.toml` configuration file to configure the connection information for MySQL and Redis.

DB section:

```toml
[DB]
DBType = "mysql"
DSN="YourUsername:YourPassword@tcp(127.0.0.1:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
```

Redis section:

```toml
[Redis]
Address = "127.0.0.1:6379"
Password = "YourRedisPassword"
RedisType = "standalone"
```

Start the n9e binary, and Nightingale will automatically create the database tables. Of course, your DB connection account needs to have the permission to create database tables.

```bash
nohup ./n9e &> n9e.log &
```

Open web browser and go to [http://localhost:17000](http://localhost:17000). The default username is `root` and default password is `root.2020`.

> Please replace localhost with your server's IP address.

We recommend using `systemd` to manage the n9e process in production environments and set it to start automatically at boot time.
