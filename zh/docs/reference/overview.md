# 参考手册

查阅型内容——配置项、HTTP API、MCP 工具、通知模板变量、写入协议与内置指标。尽量从源码生成。

## [配置项](https://n9e.github.io/zh/zh/docs/reference/configuration.md)

[config.toml 与 etc/edge/edge.toml 的每一个键：默认值、由哪个进程读取。](https://n9e.github.io/zh/zh/docs/reference/configuration.md)

## [环境变量](https://n9e.github.io/zh/zh/docs/reference/environment-variables.md)

[夜莺读的环境变量，以及为什么配置项本身不能用环境变量覆盖。](https://n9e.github.io/zh/zh/docs/reference/environment-variables.md)

## [命令行](https://n9e.github.io/zh/zh/docs/reference/cli.md)

[夜莺的命令行很薄：n9e、n9e-edge 等进程只有三个参数，配置全在 etc/ 的 toml 文件里，没有管理规则的子命令。](https://n9e.github.io/zh/zh/docs/reference/cli.md)

## [HTTP API](https://n9e.github.io/zh/zh/docs/reference/http-api.md)

[页面本身跑在上面的那套 API：认证、按对象分的端点、以及为什么没有 OpenAPI 文档。](https://n9e.github.io/zh/zh/docs/reference/http-api.md)

## [MCP 工具](https://n9e.github.io/zh/zh/docs/reference/mcp-tools.md)

[13 个工具集共 74 个工具的参数，以及读写之分。](https://n9e.github.io/zh/zh/docs/reference/mcp-tools.md)

## [权限矩阵](https://n9e.github.io/zh/zh/docs/reference/permissions.md)

[每个权限点、哪些内置角色持有它、它守着哪个菜单或 API。](https://n9e.github.io/zh/zh/docs/reference/permissions.md)

## [通知模板变量](https://n9e.github.io/zh/zh/docs/reference/notification-variables.md)

[消息模板里可用的事件字段与辅助函数。](https://n9e.github.io/zh/zh/docs/reference/notification-variables.md)

## [数据写入协议](https://n9e.github.io/zh/zh/docs/reference/write-protocols.md)

[Prometheus Remote Write、OpenTSDB、Datadog、Falcon：端点、报文、标签处理。](https://n9e.github.io/zh/zh/docs/reference/write-protocols.md)

## [集成模板结构](https://n9e.github.io/zh/zh/docs/reference/integration-schema.md)

[集成模板的文件结构，照着就能自己写一个并贡献回来。](https://n9e.github.io/zh/zh/docs/reference/integration-schema.md)

## [内置指标](https://n9e.github.io/zh/zh/docs/reference/built-in-metrics.md)

[每个夜莺进程在 /metrics 上暴露的自身指标。](https://n9e.github.io/zh/zh/docs/reference/built-in-metrics.md)

## [端口与网络流向](https://n9e.github.io/zh/zh/docs/reference/ports.md)

[所有监听端口与所有出向连接，一张表就能写出防火墙规则。](https://n9e.github.io/zh/zh/docs/reference/ports.md)

## [限制与默认值](https://n9e.github.io/zh/zh/docs/reference/limits.md)

[硬限制、软限制与默认大小：队列长度、超时、保留期。](https://n9e.github.io/zh/zh/docs/reference/limits.md)

## [兼容性矩阵](https://n9e.github.io/zh/zh/docs/reference/compatibility.md)

[各依赖组件的版本情况，以及为什么这里没有一张官方的「支持版本」表。](https://n9e.github.io/zh/zh/docs/reference/compatibility.md)
