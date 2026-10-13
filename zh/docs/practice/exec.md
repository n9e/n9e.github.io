# 自定义采集脚本

通过 Categraf exec 插件执行脚本，输出 Prometheus 指标，验证权限、超时和正式服务中的采集结果。

最后校对于 2026-10-11

这页办完，你会让一个脚本输出自定义指标，经 Categraf 写入夜莺的时序库。 示例使用 **Categraf v0.5.17、夜莺 v9**；脚本可以是 Shell、Python，或任何可执行程序。

## 编写脚本[​](#script "编写脚本的直接链接")

创建 `/opt/categraf/scripts/collect_demo.sh`：

```
#!/bin/sh

printf 'custom_check_success{check="demo"} 1\n'
```

```
chmod +x /opt/categraf/scripts/collect_demo.sh

/opt/categraf/scripts/collect_demo.sh
```

**预期结果**：stdout 只有一行 Prometheus 文本指标。 诊断日志写入 stderr，不要把自然语言混到指标输出中；程序以非零状态退出时，应先处理执行失败。

## 配置 exec 插件[​](#configure "配置 exec 插件的直接链接")

在 `conf/input.exec/exec.toml` 中配置：

```
[[instances]]

commands = ["/opt/categraf/scripts/collect_demo.sh"]

timeout = 5

data_format = "prometheus"
```

`data_format` 必须与输出一致。插件也支持 `influx` 和 `falcon`，但这些格式不能混用。 命令路径可以使用通配符；上线前确认匹配到的是预期脚本。 完整格式说明见 [exec 插件](https://github.com/flashcatcloud/categraf/blob/v0.5.17/inputs/exec/README.md)。

## 验证[​](#verify "验证的直接链接")

```
./categraf --test --inputs exec
```

**预期结果**：出现 `custom_check_success`，标签 `check="demo"`、值为 1，没有解析或超时错误。 重启现有服务后，在夜莺选择实际的目的时序库查询这个指标，确认样本持续出现。

前台能跑而正式服务失败时，检查服务账号的文件权限、工作目录、PATH 和环境变量。 脚本使用绝对路径和明确的超时，避免依赖交互式 Shell 环境。

## 设计有用的指标[​](#metric-design "设计有用的指标的直接链接")

示例固定返回 1 只用于验证链路。正式检查应返回实际结果，例如任务积压数或最近一次成功时间。 失败状态也要输出明确数值；脚本完全没有输出与输出 0 需要用不同的告警逻辑处理。

不要把每次执行的随机 ID、时间戳或完整错误文本放进标签，避免不断创建新时序。 累计计数使用 Counter 语义，当前值使用 Gauge 语义，查询方式见[前置知识](https://n9e.github.io/zh/docs/prologue/pre-knowledge.md)。

## 下一步[​](#next "下一步的直接链接")

* [创建第一条告警](https://n9e.github.io/zh/docs/alerting/first-rule.md)
* [数据源连上了，为什么查不到数据？](https://n9e.github.io/zh/docs/troubleshooting/no-data.md)
