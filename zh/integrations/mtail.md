# 用 mtail 把日志变成夜莺指标

Categraf 内置了 mtail：用正则和表达式从日志里提取 counter、gauge、histogram，不用把日志先送进日志系统。

最后校对于 2026-10-28

mtail 插件把日志变成指标：输入是日志文件，输出是按 mtail 语法定义的 counter、gauge 和 histogram，本质是 Go 正则提取加表达式计算。适合从 Nginx 访问日志统计状态码分布、从应用日志数错误次数这类场景，不需要先把日志送进 Elasticsearch 或 Loki。

每个 `[[instances]]` 指向一组 `progs`（mtail 程序文件或目录）和要跟踪的日志路径；不同实例要用不同的 progs，或者用 `labels` 区分，否则指标会互相干扰。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **Categraf 采集配置**：`input.mtail`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.mtail/mtail.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.mtail started` 就说明插件已加载。

   ```
   [[instances]]

   # progs = "/path/to/prog1" # prog dir1

   # logs = ["/path/to/a.log", "path/to/b.log"]

   # override_timezone = "Asia/Shanghai"

   # emit_metric_timestamp = "true" #string type



   # [[instances]]

   # progs = "/path/to/prog2" # prog dir2

   # logs = ["/path/to/logdir/"]

   # override_timezone = "Asia/Shanghai"

   # emit_metric_timestamp = "true" # string type
   ```

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Mtail 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Mtail）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Mtail%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
