# 端口与 HTTP 探测

配置 Categraf TCP、UDP、HTTP 探测，验证结果码、响应内容及 TLS 证书到期指标。

最后校对于 2026-10-11

这页办完，你会从独立探测点检查服务端口和 HTTP 响应，而不只看进程是否存在。 示例配置以 **Categraf v0.5.17、夜莺 v9** 为例。

## TCP 和 UDP[​](#tcp-udp "TCP 和 UDP的直接链接")

编辑 `conf/input.net_response/net_response.toml`：

```
[[instances]]

targets = ["127.0.0.1:22"]

protocol = "tcp"

timeout = "2s"

labels = { probe = "ssh-local" }
```

替换目标地址。TCP 连接成功只能证明端口接受连接；要验证应用响应，还需配置协议适用的 `send`、`expect`。

UDP 没有 TCP 那样的连接确认，必须使用实际服务协议的发送与预期响应字符串。不要仅把 `protocol` 改成 `udp` 就认为探测完整。 字段说明见 [net\_response 配置](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.net_response/net_response.toml)。

## HTTP[​](#http "HTTP的直接链接")

编辑 `conf/input.http_response/http_response.toml`：

```
[[instances]]

targets = ["http://127.0.0.1:8080/health"]

method = "GET"

response_timeout = "5s"

expect_response_status_code = 200

expect_response_substring = "ok"

follow_redirects = false

labels = { probe = "application-health" }
```

将地址和预期响应改成应用实际的健康检查接口。 可检查 HTTP 状态码与响应正文；需要跟随重定向时显式设置，避免把登录跳转误当成健康响应。 HTTPS 目标还可以产生证书到期时间指标。

## 验证与告警[​](#verify "验证与告警的直接链接")

```
./categraf --test --inputs net_response:http_response
```

**预期结果**：输出对应目标的 `net_response_result_code` 或 `http_response_result_code`。 值为 0 表示该插件配置的检查成功，非 0 表示失败；两种插件的非零编码不同，不要共用解释表。

确认本地测试后重启采集服务，在时序库中核对标签、结果码与采样时间。 告警可从 `result_code != 0` 开始，增加持续时长并选择合适级别。

HTTPS 目标存在 `http_response_cert_expire_timestamp` 时，下面的表达式表示距离证书到期还剩多少秒：

```
http_response_cert_expire_timestamp - time()
```

设置到期阈值前，先确认该目标确实产生了这个指标。 探测点的 DNS、网络和权限也影响结果；探测失败不一定意味着服务进程退出。

## 下一步[​](#next "下一步的直接链接")

* [指标告警规则](https://n9e.github.io/zh/zh/docs/alerting/metric-rules.md)
* [导入仪表盘与规则](https://n9e.github.io/zh/zh/docs/data/integrations/import.md)

完整 HTTP 字段见 [v0.5.17 配置](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.http_response/http_response.toml)。
