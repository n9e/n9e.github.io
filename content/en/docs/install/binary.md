---
title: "Binary Deployment"
description: "Deploying Nightingale Monitoring using binary files"
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2025-07-26T13:46:02.501+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 210
toc: true
---

If you have not read the section on [Pre-Installation Instructions](/docs/install/pre-intro/), please do so before reading this section.

## Download

Download the latest version from [GitHub](https://github.com/ccfos/nightingale/releases), and you will get a compressed package similar to `n9e-${version}-linux-amd64.tar.gz`. This is the release package for the X86 CPU architecture. If you need the ARM architecture, download the arm64 package. There is no Windows version of the release package because Nightingale is a server-side project that typically runs on Linux systems.

If you want to run Nightingale on Windows and Mac, it's also OK, but you need to compile it yourself. The compilation is relatively simple, and you can refer to the logic in the `Makefile` in the project code repository.

Unzip the downloaded package to the `/opt/n9e` directory.

```bash
mkdir /opt/n9e && tar zxvf n9e-${version}-linux-amd64.tar.gz -C /opt/n9e
```

## Single Node Test Installation

In this mode, it is only for testing purposes, and it does not depend on MySQL or Redis (it actually uses SQLite and an in-memory Redis: miniredis). The startup is straightforward; you can start it directly after unzipping.

### Start the Process

```bash
cd /opt/n9e && nohup ./n9e &> n9e.log &
```

Since this is just a test mode, we directly use `nohup` to start it. In a production environment, you would typically use `systemd` to manage the `n9e` process.

### Check the Process

```bash
# Check if the process is running
ss -tlnp | grep 17000
```

### Login

Open your browser and visit [http://localhost:17000](http://localhost:17000). The default username is `root`, and the default password is `root.2020`.

> Please replace `localhost` with your server's IP address.

## Single Node Production Installation

In a production environment, we recommend using MySQL and Redis to store data.

### Modify Configuration

You need to configure the connection information for MySQL and Redis in the `/opt/n9e/etc/config.toml` file.

MySQL key configuration example:

```toml
[DB]
DBType = "mysql"
DSN = "YourUsername:YourPassword@tcp(127.0.0.1:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
```

Redis key configuration example:

```toml
[Redis]
Address = "127.0.0.1:6379"
Password = "YourRedisPassword"
RedisType = "standalone"
```

### Start the Process

Start the `n9e` binary, and Nightingale will automatically create the database tables. This requires your database connection account to have permissions to create and modify tables.

```bash
nohup ./n9e &> n9e.log &

# Check if the process started successfully
ps -ef | grep n9e
ss -tlnp | grep 17000
```

`nohup` allows for quick startup verification; if there are any issues, check the n9e.log file.

## Using systemd for Management

In a production environment, it is recommended to use `systemd` to manage the `n9e` process. Create a systemd service file at `/etc/systemd/system/n9e.service` with the following content:

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

After saving the file, run the following commands to enable and start the service:

```bash
sudo systemctl enable n9e
sudo systemctl start n9e
```

### Login

Open your browser and visit [http://localhost:17000](http://localhost:17000). The default username is `root`, and the default password is `root.2020`.

> Please replace `localhost` with your server's IP address.

## Cluster Mode

The logic of the cluster mode has already been explained in *[Nightingale Architecture Design](/docs/prologue/architecture/)*, so it will not be repeated here. From the deployment perspective, you just need to set up multiple machines, deploy one n9e process on each machine, and configure the connection information for MySQL and Redis properly. Multiple n9e processes share the same set of MySQL and Redis, so the configuration files of these n9e processes are exactly the same.

## Edge Mode

For instructions on the edge mode, please be sure to read this first: [Nightingale Monitoring - Detailed Explanation of Edge Alert Engine Architecture](/docs/prologue/architecture/#edge-mode)!!!

The edge mode uses the `n9e-edge` binary, which can be found in the `n9e-${version}-linux-amd64.tar.gz` compressed package. `n9e-edge` needs to communicate with the `n9e` of the central server to synchronize alert rules, so the configuration file of `n9e-edge` must include the connection information of the central `n9e`.

## Edge Cluster

Multiple instances of `n9e-edge` in edge computer rooms can also be deployed to form a cluster. The configuration files of multiple `n9e-edge` instances within the same cluster must be consistent. Instances with the same EngineName in the configuration file will be regarded as multiple instances of the same engine cluster, and the name should be different from that of the central `n9e`. The default EngineName of the central `n9e` is `default`, while the default EngineName of the edge `n9e-edge` is `edge`.

If you have multiple edge computer rooms, the EngineName of `n9e-edge` in each edge computer room needs to be different, such as `edge1`, `edge2`, etc. Only after such differentiation can different data sources be assigned to different alert engines.

### Start `n9e-edge`

Note that when starting the n9e-edge process, you need to specify the configuration directory instead of the configuration file. For example:

```bash
nohup ./n9e-edge --configs etc/edge &> edge.log &
```

The `etc/edge` mentioned above is the configuration directory. It would be incorrect to write it as `--configs etc/edge/edge.toml`.
