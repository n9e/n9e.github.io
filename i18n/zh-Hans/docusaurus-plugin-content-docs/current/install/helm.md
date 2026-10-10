---
title: "Helm / Kubernetes"
sidebar_label: "Helm / Kubernetes"
description: "社区维护的 Helm chart 在 Kubernetes 里拉起夜莺连同 MySQL、Redis、Prometheus 和 Categraf；values 可改为指向集群外数据库。"
---

社区维护着一个 Helm chart，能在 Kubernetes 里把夜莺连同 MySQL、Redis、Prometheus、
Categraf 一起拉起来。装之前有两件事要先想清楚。

## 先想清楚要不要装进 K8s

监控系统是 P0：**Kubernetes 集群出问题的时候，你恰恰需要监控还活着**。
把夜莺部署在它要监控的那个集群里，就形成了循环依赖——集群一挂，用来排查集群的工具跟着挂。

要么装在独立的、专门跑基础设施的集群里，要么就用[二进制包](./binary.md)装在集群外的机器上。
这不是 chart 有问题，是拓扑选择问题。

## chart 的版本状况

chart 在 [flashcatcloud/n9e-helm](https://github.com/flashcatcloud/n9e-helm)，
和夜莺主仓库是分开维护的，**版本明显落后于 v9**：

- `Chart.yaml` 里 `appVersion: 8.5.0`，chart 版本 `0.3.0`；
- `values.yaml` 里镜像默认 `flashcatcloud/nightingale:8.5.0`；
- 最新一个打好包的 release 是 2025 年的 `helm-chart-v8.0.0-beta12`；
- **没有 Helm 仓库可以 `helm repo add`**，只能 clone 仓库用本地目录装。

想跑 v9 就得自己把 `n9e.internal.image.tag` 改成 v9 的 tag。chart 渲染出来的 `config.toml`
是 v8 风格的（没有 `[EmbeddedTSDB]` 段，指标直接写集群里的 Prometheus），
这份配置在 v9 上仍然是合法的，表结构由 `n9e` 启动时的 AutoMigrate 补齐。
但这个组合没有经过官方验证，**上生产前请自己在测试集群里先跑一遍**。

## 装

需要 Kubernetes 1.20+ 和 Helm v3.2.0+。

```bash
git clone https://github.com/flashcatcloud/n9e-helm.git
helm install nightingale ./n9e-helm -n n9e --create-namespace
```

**预期结果**：`kubectl get pod -n n9e` 里 nginx、database、redis、prometheus、n9e、
categraf 的 Pod 陆续 Running；按你选的暴露方式访问，`root` / `root.2020` 能登录。

卸载：

```bash
helm uninstall nightingale -n n9e
```

内置的数据库和 Redis 是 StatefulSet，数据卷由 `volumeClaimTemplates` 生成，
**`helm uninstall` 不会删它们**。要连数据一起清掉，得手工删对应的 PVC。

## 内置组件还是外部组件

数据库、Redis、Prometheus、Categraf 四个都有 `type: internal | external` 开关。
`internal` 是 chart 自己起一份（MySQL 5.7 / Redis 6.2 / Prometheus 的 StatefulSet），
适合试用；生产上把它们指到集群外已有的实例：

```yaml
database:
  type: external
  external:
    host: "mysql.example.internal"
    port: "3306"
    name: "n9e_v6"
    username: "n9e"
    password: "<password>"

redis:
  type: external
  external:
    addr: "redis.example.internal:6379"
    mode: "standalone"     # standalone | cluster | sentinel

prometheus:
  type: external
  external:
    host: "victoriametrics.example.internal"
    port: "8428"
```

`prometheus.external` 填的是**远程写入的接收端**，任何兼容 Prometheus remote write
的时序库都行——VictoriaMetrics 也从这里配。另有一个 `n9e.victoriaMetrics.enabled`
开关，作用是**再加一个**写入目标，用于双写。

用外部数据库时，`persistence` 里对应的 PVC 就不需要了。

## 怎么暴露出去

`expose.type` 四选一：`ingress`（默认）、`clusterIP`、`nodePort`、`loadBalancer`。
`externalURL` 写成 `协议://域名[:端口]`，和你选的暴露方式对上——
它只用在安装完成的提示里，不参与路由，写错了不会报错但会误导下一个人。

```yaml
expose:
  type: ingress
  ingress:
    hosts:
      web: n9e.example.com
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: n9e-tls

externalURL: https://n9e.example.com
```

`certSource` 可选 `auto`（自签）、`secret`（用现成的 `tls.crt` / `tls.key`）、
`none`（证书在 ingress controller 上）。

## 下一步

- [数据库选型](./databases.md)
- [上生产前的检查清单](../get-started/production-checklist.md)
- [二进制包](./binary.md)——集群外部署的做法
