# 五分钟拉起夜莺

docker compose up -d 一条命令拉起夜莺及依赖，以 root 登录 17000 端口，然后接数据源、写规则、配通知。

compose 编排会把夜莺连同它依赖的数据库、时序库一起拉起，不需要提前准备任何东西。

```
git clone https://github.com/ccfos/nightingale.git

cd nightingale/docker/compose-bridge

docker compose up -d
```

浏览器打开 **`http://localhost:17000`**，默认账号 `root` / `root.2020`。

## 起来之后先做三件事[​](#起来之后先做三件事 "起来之后先做三件事的直接链接")

1. **接一个数据源** —— Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse、Loki 等都支持。 夜莺在原地查询它们，数据不用搬迁。
2. **写第一条告警规则**，挂在某个业务组下，定好 S1 / S2 / S3 级别。
3. **配一个通知媒介**，让事件真的能送到人。

还没有采集？[Categraf](https://n9e.github.io/zh/zh/categraf.md) 一个 agent 覆盖操作系统、中间件、数据库、网络设备与 Kubernetes。

下一步：[安装部署](https://n9e.github.io/zh/zh/docs/install/overview.md)，面向生产环境。
