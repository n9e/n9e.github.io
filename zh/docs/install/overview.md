# 安装与部署

夜莺的几种跑法——Compose、Docker 镜像、二进制、Helm、n9e-edge——各自适合什么场景。

最后校对于 2026-10-10

| 方式           | 适用场景                                                  |
| -------------- | --------------------------------------------------------- |
| Docker Compose | 评估与中小生产环境——依赖组件一并拉起                      |
| Docker 镜像    | 已有 MySQL 和时序库                                       |
| 二进制         | Linux amd64 / arm64 的 tar.gz，随 GitHub Release 附校验值 |
| Helm           | Kubernetes                                                |
| `n9e-edge`     | 与中心网络链路不稳的边缘机房                              |

各方式的具体命令见[下载页](https://n9e.github.io/zh/zh/download.md)。

## [Docker Compose](https://n9e.github.io/zh/zh/docs/install/docker-compose.md)

[一条命令把夜莺连同数据库、时序库一起拉起；编排里有什么、怎么改。](https://n9e.github.io/zh/zh/docs/install/docker-compose.md)

## [二进制包](https://n9e.github.io/zh/zh/docs/install/binary.md)

[下载 GitHub Release 的 Linux amd64 / arm64 包，校验解压，接上已有的 MySQL 和 Redis，用 systemd 托管 n9e。](https://n9e.github.io/zh/zh/docs/install/binary.md)

## [Helm / Kubernetes](https://n9e.github.io/zh/zh/docs/install/helm.md)

[社区维护的 Helm chart 在 Kubernetes 里拉起夜莺连同 MySQL、Redis、Prometheus 和 Categraf；values 可改为指向集群外数据库。](https://n9e.github.io/zh/zh/docs/install/helm.md)

## [MySQL / PostgreSQL / SQLite 与 Redis](https://n9e.github.io/zh/zh/docs/install/databases.md)

[元数据库可选 MySQL、PostgreSQL 或 SQLite（仅测试），表结构由进程首次启动时自动建好；Redis 存放心跳等运行时状态。](https://n9e.github.io/zh/zh/docs/install/databases.md)

## [内置时序库：开箱与小规模](https://n9e.github.io/zh/zh/docs/install/embedded-tsdb.md)

[零额外组件先跑起来：内置时序库的保留期、容量，以及单 Center 的限制。](https://n9e.github.io/zh/zh/docs/install/embedded-tsdb.md)

## [外置时序库与双写迁移](https://n9e.github.io/zh/zh/docs/install/external-tsdb.md)

[借助 Pushgw 双写，从内置时序库无缝切换到 Prometheus 或 VictoriaMetrics。](https://n9e.github.io/zh/zh/docs/install/external-tsdb.md)

## [配置文件布局](https://n9e.github.io/zh/zh/docs/install/configuration.md)

[配置是一个目录：config.toml 供 n9e、alert、pushgw 读取，etc/edge 供 n9e-edge 读取；环境变量只填空缺，不覆盖已有配置。](https://n9e.github.io/zh/zh/docs/install/configuration.md)

## [高可用](https://n9e.github.io/zh/zh/docs/install/high-availability.md)

[在负载均衡后面跑多个 Center 和 Alert 实例，以及哪些部分仍然必须单实例。](https://n9e.github.io/zh/zh/docs/install/high-availability.md)

## [离线部署](https://n9e.github.io/zh/zh/docs/install/offline.md)

[在没有外网的机器上安装：需要提前准备的包、镜像和集成模板。](https://n9e.github.io/zh/zh/docs/install/offline.md)

## [边缘机房](https://n9e.github.io/zh/zh/docs/install/edge.md)

[给与中心链路不稳的机房用的本地告警引擎，以及那个会让它悄无声息失效的参数。](https://n9e.github.io/zh/zh/docs/install/edge.md)

## [升级](https://n9e.github.io/zh/zh/docs/install/upgrade.md)

[小版本升级与 v8 → v9 跨版本升级：先备份、读数据库变更说明、再滚动替换二进制。](https://n9e.github.io/zh/zh/docs/install/upgrade.md)

## [回滚](https://n9e.github.io/zh/zh/docs/install/rollback.md)

[升级失败后回到上一版本，包括已经执行过的表结构变更该怎么处理。](https://n9e.github.io/zh/zh/docs/install/rollback.md)

## [卸载与数据保留](https://n9e.github.io/zh/zh/docs/install/uninstall.md)

[干净地卸载夜莺，以及卸载前该保留或导出什么。](https://n9e.github.io/zh/zh/docs/install/uninstall.md)
