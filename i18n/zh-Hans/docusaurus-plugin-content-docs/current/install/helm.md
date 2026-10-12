---
title: "Helm / Kubernetes"
sidebar_label: "Helm / Kubernetes"
description: "社区维护的 Helm chart 在 Kubernetes 里拉起夜莺连同 MySQL、Redis、Prometheus 和 Categraf；values 可改为指向集群外数据库。"
last_reviewed: 2026-10-10
---

社区维护着一个 Helm chart，能在 Kubernetes 里把夜莺连同 MySQL、Redis、Prometheus、
Categraf 一起拉起来。装之前有两件事要先想清楚。

## 先想清楚要不要装进 K8s

监控系统是 P0：**Kubernetes 集群出问题的时候，你恰恰需要监控还活着**。
把夜莺部署在它要监控的那个集群里，就形成了循环依赖——集群一挂，用来排查集群的工具跟着挂。

要么装在独立的、专门跑基础设施的集群里，要么就用[二进制包](./binary.md)装在集群外的机器上。
这不是 chart 有问题，是拓扑选择问题。

## chart 的版本状况

chart 在 [flashcatcloud/n9e-helm](https://github.com/flashcatcloud/n9e-helm)，和夜莺主仓库分开维护。
从 chart `0.4.0` 起，master 分支已经跟到 v9：

- `Chart.yaml` 里 chart 版本 `0.4.0`，`appVersion: 9.1.1`；
- `values.yaml` 里镜像默认 `flashcatcloud/nightingale:9.1.1`；
- 渲染出来的 `config.toml` 是 v9 的：带 `[EmbeddedTSDB]` 段但**默认关闭**——chart 自带 Prometheus 当时序库，
  而内置时序库只适合单副本的 `n9e`；同时打开了 `[HTTP.TokenAuth]`（`/mcp`、`/a2a` 要用），
  匿名访问 PromQL 查询和告警详情默认关闭，和上游默认一致。

**打包发布还没跟上**：Helm 仓库 `https://flashcatcloud.github.io/n9e-helm` 里最新的仍是 v8 的
`v8.0.0-beta12`，`helm repo add` 之后装到的是 v8。要装 v9，用 clone 下来的 master 目录装（见下一节）。

从旧版 chart 升级上来的，换成新 chart 后 `helm upgrade` 即可，表结构由 `n9e` 启动时的 AutoMigrate 补齐。
升级前的注意事项见[升级](./upgrade.md)。

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
