# Prometheus

注册 Prometheus 或 Thanos 地址，设置认证与超时，用一条查询验证。

这页办完你会得到：一个已注册、连通性测过、能在即时查询里查出曲线的 Prometheus 数据源。 Thanos、Mimir、M3、VictoriaMetrics 都实现了 Prometheus 的查询 API，也都用这个类型接入 （VictoriaMetrics 还多一个开关，见 [VictoriaMetrics](https://n9e.github.io/zh/zh/docs/data/victoriametrics.md)）。

数据不会被搬走。数据源只是一条连接：夜莺按需去你的时序库上查，抓取配置一行不用改。

## 开始之前[​](#开始之前 "开始之前的直接链接")

* 你的 Prometheus 查询地址，比如 `http://10.0.0.11:9090`；
* **夜莺 Center 所在的机器**能访问这个地址（不是你浏览器能访问就行）；
* 开了认证的话，准备好用户名和原始密码；
* 你的账号是 Admin——新增数据源是管理员操作，普通用户看不到「新增」按钮。

## 1. 新增数据源[​](#1-新增数据源 "1. 新增数据源的直接链接")

**集成中心 → 数据源 → 新增**，在弹出的类型列表里选 **Prometheus**。

必填只有两个：

| 字段 | 填什么                                                        |
| ---- | ------------------------------------------------------------- |
| 名称 | 起个能认出来的名字。规则和查询里都按这个名字选数据源          |
| URL  | 查询地址，填到端口这一级即可，后面的 `/api/v1/...` 夜莺自己拼 |

表单里就列着各家的写法：

```
1. Prometheus                      http://localhost:9090/

2. Thanos                          http://localhost:19192/

3. VictoriaMetrics 集群版           http://{vmselect}:8481/select/0/prometheus/

4. VictoriaMetrics 单机版           http://{vmselect}:8428/

5. M3                              http://localhost:7201/

6. SLS                             https://{project}.{sls-endpoint}/prometheus/{project}/{metricstore}/

7. Mimir                           http://mimir:9009/prometheus
```

**超时(单位<!-- -->:ms<!-- -->)** 默认 10000。查询慢的大集群往上调，别调到分钟级——告警引擎按周期评估， 一条查询卡住会拖累整批规则。

![Prometheus 数据源表单](/zh/img/docs/data/form-prometheus.zh.png)![Prometheus 数据源表单](/zh/img/docs/data/form-prometheus.zh.dark.png)

## 2. 认证与 TLS[​](#2-认证与-tls "2. 认证与 TLS的直接链接")

* **用户名 / 密码**：Prometheus 开了 basic auth 就填这里。填**原始密码**， 不是 `web-config.yml` 里 `basic_auth_users` 那串 bcrypt 哈希；
* **跳过 SSL 验证**：自签证书打开它；
* **高级设置** 里是双向 TLS 的四个字段——CA 证书、服务器名称、客户端证书、客户端密钥， 证书内容直接粘贴，`-----BEGIN CERTIFICATE-----` 开头那一整段；
* **自定义HTTP标头**：网关要求带 token 之类的，在这里加 Header / Value。

## 3. 其他三个字段[​](#3-其他三个字段 "3. 其他三个字段的直接链接")

这三个都不是必填，但填错了会在别的地方咬人：

| 字段             | 什么时候要填                                                                                                                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remote Write URL | 用[记录规则](https://n9e.github.io/zh/zh/docs/query/recording-rules.md)时才需要。记录规则算出来的新序列要写回时序库，写到这个地址。Prometheus 是 `http://localhost:9090/api/v1/write`，VictoriaMetrics 单机版是 `http://localhost:8428/api/v1/write` |
| 时序库内网地址   | 只有边缘机房下沉部署告警引擎时才填。填了之后 `n9e-edge` 用这个地址访问时序库，不填就用上面的 URL                                                                                                                                                     |
| 时序库类型       | 可选 Prometheus / Thanos / VictoriaMetrics / M3 / SLS。它影响仪表盘变量的取值方式和「删除序列」走哪个接口，接 VictoriaMetrics 时务必选对                                                                                                             |

**关联告警引擎集群** 保持 `default` 即可，只有一套引擎时不用动。这个字段留空的话， 这个数据源上的告警规则不会被评估。

## 4. 验证[​](#4-验证 "4. 验证的直接链接")

点 **测试连通性并保存**。夜莺会用这个地址请求一次 `/api/v1/query?query=1%2B1`， 通了才入库；没通就原样把错误报出来，不保存。

地址确实不可达但你想先把配置存下来，用 **不测试连通性直接保存**。

保存成功后会弹出一个结果页，对 Prometheus 类型的数据源它会做一次数据体检：

* **发现 N 个指标 · 最近数据 X 前** —— 一切正常；
* **连接正常，但没有发现任何指标** —— 连上了，但这个库里还没数据，多半是采集器还没开始写；
* **历史有数据，近期没有新写入** —— 指标在，但最近没有新样本，去看采集器还活着没。

再自己确认一次：**数据查询 → 指标**，数据源选你刚建的那个，跑一条你确定有数据的查询：

```
up
```

有曲线出来，这条路就通了。查不到先别往下走，看 [数据源连上了但查不到数据](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)。

## 排障[​](#排障 "排障的直接链接")

**测试连通性报 404。** 地址填成了 `http://host:9090/api/v1/query` 这种带路径的写法， 去掉路径只留到端口。

**测试连通性报 401 / 403。** basic auth 的密码填成哈希了；或者 Prometheus 前面挂了网关， 需要在「自定义HTTP标头」里加认证头。

**夜莺往 Prometheus 转发数据时报 404。** 这是写入侧的问题，不是数据源。 Prometheus 默认不开 remote write 接收接口，启动参数要加 `--web.enable-remote-write-receiver`（老版本是 `--enable-feature=remote-write-receiver`）。

**保存成功但规则不评估。** 检查「关联告警引擎集群」是不是空的。

## 下一步[​](#下一步 "下一步的直接链接")

* 用它写第一条规则：[第一条告警规则](https://n9e.github.io/zh/zh/docs/alerting/first-rule.md)
* 即席查询：[即时查询](https://n9e.github.io/zh/zh/docs/query/metric-explorer.md)
* 换成 VictoriaMetrics：[VictoriaMetrics](https://n9e.github.io/zh/zh/docs/data/victoriametrics.md)
* 还没有任何采集：[安装 Categraf](https://n9e.github.io/zh/zh/docs/data/categraf/install.md)
