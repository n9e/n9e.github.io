# 用脚本给夜莺上报自定义指标（Exec）

现成插件覆盖不到的东西，写个脚本按 Prometheus、InfluxDB 行协议或 Open-Falcon 格式打印到 stdout，Categraf 负责采集和上报。

最后校对于 2026-10-28

exec 插件是 Categraf 的万能兜底：你写脚本，脚本把监控数据打印到标准输出，Categraf 定时执行并解析。脚本用什么语言无所谓，输出格式三选一：Prometheus 文本格式、InfluxDB 行协议（`measurement,label=v field=1`）或 Open-Falcon 的 JSON，由 `data_format` 指定。

适合业务自定义指标、遗留系统的状态检查、一次性的巡检脚本。注意脚本执行时间要短于采集周期，输出的值只能是数字。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **Categraf 采集配置**：`input.exec`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.exec/exec.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.exec started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # # commands, support glob

   commands = [

   #     "/opt/categraf/scripts/*.sh"

   ]



   # # timeout for each command to complete

   # timeout = 5



   # # interval = global.interval * interval_times

   # interval_times = 1



   # # choices: influx prometheus falcon

   # # influx stdout example: measurement,labelkey1=labelval1,labelkey2=labelval2 field1=1.2,field2=2.3

   # data_format = "influx"
   ```

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Exec 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Exec）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Exec%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `exec` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/exec)：完整配置项和指标列表。
* [实践：用脚本采集自定义指标](https://n9e.github.io/zh/docs/practice/exec.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
