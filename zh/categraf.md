COLLECTOR

# Categraf

夜莺在你已有的数据上做告警分析，Categraf 负责把数据送进来：一个 agent 覆盖操作系统、中间件、数据库、网络设备与 Kubernetes，按 Prometheus Remote Write 协议推送。MIT 协议开源，与夜莺出自同一个团队。

100+采集插件

MIT开源协议

1每台机器一个 agent

## 安装与运行

### 下载发布版

发布包按平台分开，且已经把 conf 目录打进去了，解压即可运行。Linux 提供 amd64 与 arm64，Windows 为 zip 包。默认构建之外还有两个变体：-with-cgo-plugin 额外带 NVIDIA DCGM 采集，categraf-slim 只保留指标采集。

`tar xzf categraf-v<版本号>-linux-amd64.tar.gzcd categraf-v<版本号>-linux-amd64`

版本号是文件名的一部分，因此没有固定的 latest 下载地址，需要到发布页挑对应构建。

[GitHub Releases](https://github.com/flashcatcloud/categraf/releases)

<!-- -->

[ →](https://github.com/flashcatcloud/categraf/releases)

### Docker

镜像里二进制在 /usr/bin/categraf，示例配置在 /etc/categraf/conf。设置 N9E\_HOST 后，entrypoint 会自动改写 config.toml 里的服务端地址；需要更多定制时再挂载自己的 conf 目录。

`docker pull flashcatcloud/categraf:latestdocker run -d --name categraf -e N9E_HOST=192.168.1.10:17000 flashcatcloud/categraf:latest`

### 从源码编译

需要 Go 1.25 及以上。打包时把二进制和 conf 一起打，agent 才有配套的示例配置。

`go buildtar zcvf categraf.tar.gz categraf conf`

macOS 上要用 gnu-tar（gtar）：系统自带的 bsdtar 打出来的包 Categraf 会加载失败。

### 先看采到什么，再决定写入哪里

test 模式把采集结果直接打到标准输出，可以在接服务端之前先确认插件是否正常。

`./categraf --test./categraf --test --inputs system:mem`

### 运行

配置都在 conf 目录：config.toml 管 agent 自身，每个采集器一个 input.<插件名> 目录。用 --inputs 可以只跑指定插件。

`./categraf./categraf --configs /path/to/conf-directory./categraf --inputs system:mem`

接入夜莺、给主机打标签、没数据时怎么查，文档里有逐步的说明。

[Categraf 使用文档](https://n9e.github.io/zh/docs/data/categraf.md)

<!-- -->

[ →](https://n9e.github.io/zh/docs/data/categraf.md)

### Kubernetes

DaemonSet 采节点与 cAdvisor 指标，Deployment 采 apiserver、CoreDNS 这类集群级目标，sidecar 采单个服务。三份编排文件仓库里都有。

`kubectl apply -n monitoring -f k8s/daemonset.yamlkubectl apply -n monitoring -f k8s/deployment.yamlkubectl apply -n monitoring -f k8s/sidecar.yaml`

## 能采什么

每个插件是 inputs/ 下的一个目录，各自带一份示例配置。以下为部分：

操作系统

* cpu
* mem
* disk
* diskio
* net
* netstat
* processes
* procstat
* system
* kernel
* systemd
* ntp

数据库

* mysql
* postgresql
* oracle
* sqlserver
* mongodb
* redis
* clickhouse
* elasticsearch
* greenplum
* cassandra

中间件

* kafka
* rabbitmq
* nats
* nsq
* activemq
* zookeeper
* consul
* ldap

Web 与应用服务器

* nginx
* apache
* tomcat
* jboss
* weblogic
* phpfpm
* haproxy
* tengine
* jenkins
* logstash

容器与 Kubernetes

* docker
* cadvisor
* kubernetes
* kubelet
* kube\_state\_metrics
* kube\_proxy

网络设备与硬件

* snmp
* snmp\_trap
* switch\_legacy
* ipmi
* redfish
* smart
* modbus
* gnmi
* vsphere

GPU

* nvidia\_smi
* dcgm
* amd\_rocm\_smi
* hy\_smi

云

* aliyun
* cloudwatch
* googlecloud
* appdynamics

拨测

* ping
* http\_response
* net\_response
* dns\_query
* x509\_cert
* whois

通用

* exec
* prometheus
* node\_exporter
* mtail
* tpl

### 数据推到哪里

Categraf 走 Prometheus Remote Write 协议推送，因此可以写入夜莺、Prometheus、VictoriaMetrics 等任何支持该协议的后端。PUSH 意味着由 agent 主动建立连接——在网络策略不允许中心端反向访问各网段时，这一点很关键。

[接成夜莺的数据源](https://n9e.github.io/zh/integrations.md)

<!-- -->

[ →](https://n9e.github.io/zh/integrations.md)

### 并非唯一选择

夜莺不绑定 Categraf。Telegraf、Datadog Agent 以及标准的 Prometheus exporter 都以同样方式写入；已经在抓取目标的 Prometheus 也可以原样保留。

[Categraf 源码与发布](https://github.com/flashcatcloud/categraf)

<!-- -->

[ →](https://github.com/flashcatcloud/categraf)
