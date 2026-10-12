COLLECTOR

# Categraf

Nightingale evaluates alerts on data you already have. Categraf is one way to put it there: a single agent covering operating systems, middleware, databases, network gear and Kubernetes, writing over Prometheus Remote Write. MIT licensed, built by the team behind Nightingale.

100+Collection plugins

MITLicensed

1Agent per host

## Install and run

### Download a release build

Archives are per platform and already contain the conf directory, so the agent runs straight out of the tarball. Linux ships for amd64 and arm64, Windows as a zip. Two variants sit beside the default build: -with-cgo-plugin adds the NVIDIA DCGM collector, and categraf-slim drops everything but metrics collection.

`tar xzf categraf-v<version>-linux-amd64.tar.gzcd categraf-v<version>-linux-amd64`

The version is part of the filename, so there is no fixed “latest” URL — pick the build from the releases page.

[Releases on GitHub](https://github.com/flashcatcloud/categraf/releases)

<!-- -->

[ →](https://github.com/flashcatcloud/categraf/releases)

### Docker

The image carries the binary at /usr/bin/categraf and the sample config at /etc/categraf/conf. Set N9E\_HOST and the entrypoint rewrites the server address inside config.toml for you; mount your own conf directory when you need more than that.

`docker pull flashcatcloud/categraf:latestdocker run -d --name categraf -e N9E_HOST=192.168.1.10:17000 flashcatcloud/categraf:latest`

### Build from source

Go 1.25 or newer. Package the binary together with conf so the agent keeps its sample configuration alongside it.

`go buildtar zcvf categraf.tar.gz categraf conf`

On macOS use gnu-tar (gtar) — the bundled bsdtar produces an archive Categraf refuses to load.

### See what it collects before writing anywhere

Test mode prints metrics straight to stdout, so you can confirm a plugin works before pointing the agent at a server.

`./categraf --test./categraf --test --inputs system:mem`

### Run it

Configuration lives in the conf directory — config.toml for the agent itself, one input.\<plugin> directory per collector. Restrict the run to specific plugins with --inputs.

`./categraf./categraf --configs /path/to/conf-directory./categraf --inputs system:mem`

Connecting it to Nightingale, tagging hosts, and what to check when no data arrives are covered step by step in the docs.

[Categraf docs](https://n9e.github.io/docs/data/categraf.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/categraf.md)

### Kubernetes

A DaemonSet collects node and cAdvisor metrics, a Deployment covers cluster-level targets such as apiserver and CoreDNS, and a sidecar covers one service. The manifests ship in the repository.

`kubectl apply -n monitoring -f k8s/daemonset.yamlkubectl apply -n monitoring -f k8s/deployment.yamlkubectl apply -n monitoring -f k8s/sidecar.yaml`

## What it collects

Every plugin is a directory under inputs/ with its own sample config. A selection of what ships today:

Operating system

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

Databases

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

Middleware

* kafka
* rabbitmq
* nats
* nsq
* activemq
* zookeeper
* consul
* ldap

Web and app servers

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

Containers and Kubernetes

* docker
* cadvisor
* kubernetes
* kubelet
* kube\_state\_metrics
* kube\_proxy

Network gear and hardware

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

Cloud

* aliyun
* cloudwatch
* googlecloud
* appdynamics

Probes

* ping
* http\_response
* net\_response
* dns\_query
* x509\_cert
* whois

Generic

* exec
* prometheus
* node\_exporter
* mtail
* tpl

### Where the data goes

Categraf pushes over the Prometheus Remote Write protocol, so it writes into Nightingale, Prometheus, VictoriaMetrics or anything else that speaks it. Push means the agent opens the connection — which matters when network policy will not let a central server reach into every subnet.

[Register it as a data source](https://n9e.github.io/integrations.md)

<!-- -->

[ →](https://n9e.github.io/integrations.md)

### Not the only option

Nightingale does not require Categraf. Telegraf, the Datadog Agent and standard Prometheus exporters write in the same way, and a Prometheus that already scrapes your targets can stay exactly as it is.

[Categraf source and releases](https://github.com/flashcatcloud/categraf)

<!-- -->

[ →](https://github.com/flashcatcloud/categraf)
