---
title: "服务端组件部署"
description: "夜莺（Nightingale）服务端相关模块的安装"
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

首先我们来看下面的架构图，夜莺的服务端有两个模块：n9e-webapi 和 n9e-server，n9e-webapi 用于提供 API 给前端 JavaScript 使用，n9e-server 的职责是告警引擎和数据转发器。依赖的组件有 MySQL、Redis、时序库，时序库我们这里使用 Prometheus。

<img src="/images/install-standalone.png" width="600">

## 组件安装

mysql、redis、prometheus，这三个组件都是开源软件，请大家自行安装，其中 prometheus 在启动的时候要注意开启 `--enable-feature=remote-write-receiver` ，如果之前贵司已经有 Prometheus 了，也可以直接使用，无需再次部署。这里也提供一个小脚本来安装这3个组件，大家可以参考：

```bash
# install prometheus
mkdir -p /opt/prometheus
wget https://s3-gz01.didistatic.com/n9e-pub/prome/prometheus-2.28.0.linux-amd64.tar.gz -O prometheus-2.28.0.linux-amd64.tar.gz
tar xf prometheus-2.28.0.linux-amd64.tar.gz
cp -far prometheus-2.28.0.linux-amd64/*  /opt/prometheus/

# service 
cat <<EOF >/etc/systemd/system/prometheus.service
[Unit]
Description="prometheus"
Documentation=https://prometheus.io/
After=network.target

[Service]
Type=simple

ExecStart=/opt/prometheus/prometheus  --config.file=/opt/prometheus/prometheus.yml --storage.tsdb.path=/opt/prometheus/data --web.enable-lifecycle --enable-feature=remote-write-receiver --query.lookback-delta=2m 

Restart=on-failure
SuccessExitStatus=0
LimitNOFILE=65536
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=prometheus


[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable prometheus
systemctl restart prometheus
systemctl status prometheus

# install mysql
yum -y install mariadb*
systemctl enable mariadb
systemctl restart mariadb
mysql -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('1234');"

# install redis
yum install -y redis
systemctl enable redis
systemctl restart redis
```

上例中mysql的root密码设置为了1234，建议维持这个不变，后续就省去了修改配置文件的麻烦。

## 安装夜莺

```bash
mkdir -p /opt/n9e && cd /opt/n9e

# 去 https://github.com/didi/nightingale/releases 找最新版本的包，文档里的包地址可能已经不是最新的了
tarball=n9e-5.8.0.tar.gz
urlpath=https://github.com/didi/nightingale/releases/download/v5.8.0/${tarball}
wget $urlpath || exit 1

tar zxvf ${tarball}

mysql -uroot -p1234 < docker/initsql/a-n9e.sql

nohup ./n9e server &> server.log &
nohup ./n9e webapi &> webapi.log &

# check logs
# check port
```

如果启动成功，server 默认会监听在 19000 端口，webapi 会监听在 18000 端口，且日志没有报错。上面使用 nohup 简单演示，生产环境建议用 systemd 托管，相关 service 文件可以在 etc/service 目录下，供参考，[nohup和systemd的使用教程](https://edu.51cto.com/course/31049.html)

配置文件`etc/server.conf`和`etc/webapi.conf`中都含有 mysql 的连接地址配置，检查一下用户名和密码，prometheus 如果使用上面的脚本安装，默认会监听本机 9090 端口，server.conf 和 webapi.conf 中的 prometheus 相关地址都不用修改就是对的，如果使用贵司之前已有的 Prometheus，就要检查这俩配置文件中的时序库的配置了，把 `127.0.0.1:9090` 改成你的 Prometheus。

好了，浏览器访问 webapi 的端口（默认是18000）就可以体验相关功能了，默认用户是`root`，密码是`root.2020`。如果安装过程出现问题，可以参考公众号的视频教程。

夜莺服务端部署好了，默认情况下时序库中只有少量 Prometheus 自身的数据，大家可以简单测试。接下来要考虑监控数据采集的问题，如果是 Prometheus 重度用户，可以继续使用各类 Exporter 来采集，只要数据进了时序库了，夜莺就能够消费（判断告警、展示图表等）了。如果是新用户，我们建议使用 Categraf （[Gitlink](https://www.gitlink.org.cn/flashcat/categraf) | [Github](https://github.com/flashcatcloud/categraf) ）来采集，当然，也可以使用 Telegraf、Grafana-agent、Datadog-agent，这些监控采集器都可以和夜莺无缝集成。

## 部署集群

如果担心容量问题，或高可用问题，可以部署夜莺集群，除了夜莺的两个组件，还有依赖的 MySQL、Redis、时序库，都需要部署集群版。

### MySQL

MySQL 全局就部署一个主从集群就可以了，n9e-webapi、n9e-server都要连到 MySQL 的主库。建议使用公有云提供的 RDS 服务。

### Redis

夜莺 5.8.0（含）之前的版本，都只支持 standalone 的 Redis，为了高可用，建议使用公有云提供的 Redis 服务。从 5.9.0 开始，夜莺依赖的 Redis 支持 cluster 版本和 sentinel 版本。为了简单起见，全局就使用一套 Redis 即可。如果 n9e-webapi 和 n9e-server 根据地域做了拆分，物理距离较远，比如一个在国内，一个在美东，此时 Redis 就建议拆开，n9e-webapi 依赖一套 Redis，n9e-server 依赖另一套 Redis，如果 n9e-server 有多套，也可以为每套 n9e-server 部署单独的 Redis。

### 时序库

时序库的高可用，有不同的方案，我们建议使用 VictoriaMetrics 或 Thanos，VictoriaMetrics 如何部署集群版本，后面的章节会有介绍，当然大家也可以查看 VictoriaMetrics 的官方文档，Thanos 的话请大家自行查看 Thanos 的官方文档。

### n9e-webapi

高可用就是部署多个实例即可，各个n9e-webapi的实例的配置完全相同。前面架设 nginx 或 lvs，某个 n9e-webapi 挂掉了，会被 nginx、lvs 自动摘掉，用户无感

### n9e-server

首先，n9e-server 是随着时序库走的，贵司有几套时序库，就要部署几套 n9e-server，每套 n9e-server 要取个名字，在 server.conf 中有个 ClusterName 的配置来标识 n9e-server 集群的名字，每套 n9e-server 可以只有一个实例，可以有多个实例组成集群，一套 n9e-server 集群内的多个实例，其 ClusterName 要保持一致。不同的 n9e-server 集群，ClusterName 要不同。

如果有多套时序库，其连接信息都要配置到 n9e-webapi 的配置文件 webapi.conf 中，即配置多个 `[[Clusters]]` ，每个 Cluster 有个 Name 的配置，要和 server.conf 中的 ClusterName 保持一致。

