# Datadog Agent 对接

把 Datadog Agent 的 v1 series 指标写到夜莺；明确 v2 API、认证与其他 Datadog 数据类型的兼容边界。

这页帮助已有 Datadog Agent 的机器把**兼容的指标数据**写到夜莺，保留已有采集配置。

兼容范围

夜莺 v9 的 Pushgw 注册了 `/datadog/api/v1/series`。这不是完整的 Datadog 后端，也没有 v2 series 接收路由。 本文配置以 **Datadog Agent 7.70.0** 的配置项为依据；其他版本先核对是否仍支持切换到 v1。

## 配置[​](#configure "配置的直接链接")

修改 Linux 上的 `/etc/datadog-agent/datadog.yaml`，将上报地址换成夜莺地址：

```
api_key: "replace-with-agent-key"

dd_url: "http://127.0.0.1:17000/datadog"

use_v2_api:

  series: false
```

替换示例地址和 key。`dd_url` 到 `/datadog` 为止，不要把它填成完整的 `/api/v1/series` 地址，Agent 会追加 API 路径。

只改 `dd_url` 不够：[Agent 7.70.0 默认启用 v2 series](https://github.com/DataDog/datadog-agent/blob/7.70.0/pkg/config/setup/config.go)。 `use_v2_api.series: false` 是让它使用夜莺兼容的 v1 JSON series。

服务端需开启 `[HTTP.APIForAgent].Enable`。如果配置了 `[HTTP.APIForAgent.BasicAuth]`，夜莺会将请求中的 `api_key` 与该表中配置的**密码值**匹配，不能用页面登录 Token 替代。

未开启服务端认证时，夜莺不校验该值，但 Agent 本身仍需要有效的非空配置。

## 重启并验证[​](#verify "重启并验证的直接链接")

```
sudo systemctl restart datadog-agent

sudo datadog-agent status

sudo journalctl -u datadog-agent -n 100 --no-pager
```

**预期结果**：Agent 启动正常，指标写入 `/datadog/api/v1/series` 没有 401 或路由错误。 再在夜莺即时查询中选择实际接收指标的时序库，确认采集指标出现且时间戳持续更新。

夜莺会把 Datadog 指标名里的 `.`、`-` 转为 `_`，例如 `system.cpu.user` 对应 `system_cpu_user`。 排查时检查 Agent 和夜莺两边日志，不能只看 Agent 服务在运行。

兼容辅助端点的成功响应，不代表日志、APM、事件或全部 service check 已被保存；本页只承诺 v1 series 指标链路。 若 Agent 版本已不支持这种配置，改用 [Categraf](https://n9e.github.io/zh/zh/docs/data/categraf/install.md) 或已验证的 Prometheus 采集链路。

## 下一步[​](#next "下一步的直接链接")

* [数据写入协议](https://n9e.github.io/zh/zh/docs/reference/write-protocols.md)
* [数据源连上了但查不到数据](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)

实现依据：[Pushgw 路由](https://github.com/ccfos/nightingale/blob/01a8e22eb21d81f5cbe5c34e5a1511ff63e39983/pushgw/router/router.go)、[series 解析与认证](https://github.com/ccfos/nightingale/blob/01a8e22eb21d81f5cbe5c34e5a1511ff63e39983/pushgw/router/router_datadog.go)。
