DOWNLOAD

# 五分钟装起来，<br /><!-- -->或者按生产的要求部署。

这里的每个包都来自打了标签的正式发布，发布在 GitHub 上。先说你要做什么，页面只给这条路上用得到的命令。

**v9.2.0**发布于<!-- --> <!-- -->2026-10-11[发布说明<!-- --> →](https://github.com/ccfos/nightingale/releases/tag/v9.2.0)

## 你要做什么

先试试推荐Docker Compose 一并拉起 n9e、数据库和采集器。上生产二进制、Docker 镜像或 Helm，接你自己的数据库和 Redis。边缘机房到中心的链路不稳时，在本地跑 n9e-edge 做告警引擎。离线环境机器不能上网时，提前要准备哪些包。

### 先试试

五个容器：n9e、MySQL、Redis、VictoriaMetrics，以及采集本机的 Categraf。

`git clone https://github.com/ccfos/nightingale.gitcd nightingale/docker/compose-bridgedocker compose up -d`复制

### 起来之后

1. docker compose ps 能看到五个容器在运行
2. 打开 http\://localhost:17000，用 root / root.2020 登录
3. 自带的 Categraf 已经把本机上报上来，机器列表里能看到它

[Docker Compose 部署文档<!-- --> →](https://n9e.github.io/zh/docs/install/docker-compose.md)

### 同一目录下的其他组合

* `compose-postgres`把 MySQL 换成 PostgreSQL 12
* `compose-host-network`存储换成 Prometheus，host 网络，仅 Linux
* `compose-host-network-metric-log`再加 Kafka、Elasticsearch、Logstash 跑日志，仅 Linux

## 采集器 Categraf

**v0.5.18**发布于<!-- --> <!-- -->2026-08-31[发布说明<!-- --> →](https://github.com/flashcatcloud/categraf/releases/tag/v0.5.18)

一台主机一个 agent，覆盖操作系统、中间件、数据库和 Kubernetes，用 Prometheus Remote Write 写入。哪里的数据要让夜莺看到，就装在哪里。

| 平台                          | 大小  | SHA256              |                                                                                                                 |
| ----------------------------- | ----- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Linux<!-- --> <!-- -->amd64   | 55 MB | `d8e1a69d4262a4c9…` | [下载](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-linux-amd64.tar.gz) |
| Linux<!-- --> <!-- -->arm64   | 49 MB | `5d98d263348ec5b0…` | [下载](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-linux-arm64.tar.gz) |
| Windows<!-- --> <!-- -->amd64 | 56 MB | `a45e3625340b9a7d…` | [下载](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-windows-amd64.zip)  |
| Windows<!-- --> <!-- -->arm64 | 49 MB | `ea2850040a10adbd…` | [下载](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-windows-arm64.zip)  |

只采指标的精简版，以及带 NVIDIA DCGM 插件的构建，在发布页上。<!-- --> [Categraf 全部构建<!-- --> →](https://github.com/flashcatcloud/categraf/releases/latest)

把 config.toml 里的地址指向夜莺，一分钟内这台机器就出现在机器列表里。

[Categraf 介绍<!-- --> →](https://n9e.github.io/zh/categraf.md)[Categraf 文档<!-- --> →](https://n9e.github.io/zh/docs/data/categraf.md)

## 升级与回滚

小版本之间直接换二进制。v8 升 v9 先备份数据库，读发布说明里的表结构变更；迁移在首次启动时执行。

[升级文档<!-- --> →](https://n9e.github.io/zh/docs/install/upgrade.md)[回滚<!-- --> →](https://n9e.github.io/zh/docs/install/rollback.md)[v8 升 v9<!-- --> →](https://n9e.github.io/zh/docs/migration/v8-to-v9.md)

## 卡住了？

社区在 Slack 和 GitHub Issues 上答疑。

[Slack #n9e<!-- --> →](https://join.slack.com/t/n9e/shared_invite/zt-480klxytf-P9qm3C1M87kDmRPp_H30Kw)[GitHub Issues<!-- --> →](https://github.com/ccfos/nightingale/issues)

[GitHub 上的全部版本<!-- --> →](https://github.com/ccfos/nightingale/releases)
