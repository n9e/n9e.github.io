---
title: "输入插件"
sidebar_label: "输入插件"
description: "Categraf 内置 90 多个输入插件；每个插件一个 conf/input.<名> 目录，放入配置即启用，可在前台单独跑一个来验证。"
---

Categraf 内置 90 多个输入插件，覆盖操作系统、数据库、中间件、网络探测、容器。
这页讲怎么打开一个插件、配置文件放哪、以及怎么在前台单独跑一个插件验证它。

## 配置文件在哪

全都在 `conf/` 下，一个插件一个目录：

```
/opt/categraf/
├── categraf
└── conf/
    ├── config.toml            # 全局配置：writers、heartbeat、global
    ├── logs.toml              # 日志采集，默认关闭
    ├── input.cpu/cpu.toml
    ├── input.mem/mem.toml
    ├── input.mysql/mysql.toml
    └── input.<插件名>/...
```

目录名必须是 `input.<插件名>`，插件名就是 Categraf 里的插件标识（`mysql`、`redis`、
`http_response`……）。目录里的 `.toml` / `.yaml` / `.yml` / `.json` 文件会被**全部读进来拼在一起**，
所以一个插件的配置拆成几个文件也可以。

`conf/` 下**直接放**的 `*.toml` 会被当成全局配置，`config.toml` 和 `logs.toml` 就是这么被加载的。

## 什么算「启用」

**目录在，插件就启用。** 不是靠某个 `enable = true` 开关，也不是靠文件在不在——
`conf/input.mem/` 这个目录哪怕是空的，`mem` 插件也会跑起来（用默认配置）。

反过来，不想采某个插件，**把整个 `input.<插件名>/` 目录删掉或改名**。

启动日志里能直接看到结果：

```
I! input: local.cpu started
I! input: local.mem started
E! input: local.nosuchplugin not supported
```

`not supported` 是目录名对不上任何一个编译进去的插件。包里自带的
`input.jolokia_agent_kafka/`、`input.jolokia_agent_misc/`、`input.amd_rocm_smi/`
就是这种情况——它们是示例配置，不是可用的插件名，删掉即可。

## 单实例插件和多实例插件

两种形态，看配置里有没有 `[[instances]]`：

**没有 `[[instances]]` 的**，比如 `cpu`、`mem`、`disk`、`system`——它们采本机，
没什么要连的，配置基本只有一个 `interval`：

```toml
# conf/input.cpu/cpu.toml
# interval = 15
# collect_per_cpu = false
```

**有 `[[instances]]` 的**，比如 `mysql`、`redis`、`http_response`——它们要连别的东西，
连几个就写几段。TOML 里双中括号表示数组：

```toml
# conf/input.mysql/mysql.toml
[[instances]]
address = "10.2.3.4:3306"
username = "categraf"
password = "xxxxxx"
extra_status_metrics = true
gather_slave_status = true
labels = { instance = "n9e-mysql-01" }

[[instances]]
address = "10.2.3.5:3306"
username = "categraf"
password = "xxxxxx"
labels = { instance = "n9e-mysql-02" }
```

`labels` 里那个 `instance` 很关键：它得**全局唯一**，内置的仪表盘和告警规则靠它区分实例。

**一个很容易踩的坑**：多实例插件如果必填项没填（比如 mysql 的 `address` 还注释着），
这个插件**一行日志都不会有**——不报错、也没有 `started`。加 `--debug` 才看得到：

```
W! no instances for input:mysql
```

包里自带的示例配置**默认都是全注释掉的**，就是这个状态。所以「我明明有 input.mysql 目录，
怎么没数据」的答案八成是：`[[instances]]` 里一个字段都没填。

## 每个插件都认的几个键

不管哪个插件，下面这些键都能用：

| 键 | 位置 | 说明 |
|---|---|---|
| `interval` | 插件级 | 这个插件的采集周期，秒。不写用 `[global] interval`（默认 15） |
| `interval_times` | 实例级 | 实际周期 = 全局 interval × 这个倍数 |
| `labels` | 都可以 | 附加标签。值写成 `"-"` 表示**删掉**这个标签 |
| `metrics_pass` | 都可以 | 白名单，支持通配符，只保留匹配上的指标 |
| `metrics_drop` | 都可以 | 黑名单，丢掉匹配上的指标 |
| `metrics_name_prefix` | 都可以 | 给指标名加前缀 |
| `processor_enum` | 都可以 | 枚举值映射，把字符串状态转成数字 |
| `relabel_configs` | 都可以 | Prometheus 风格的 relabel |

标签的合并顺序是：实例 `labels` → `[global.labels]`（只补没有的键）→ `agent_hostname`
（只在没被占用且 `omit_hostname = false` 时加）。

用 `metrics_drop` 减量是最划算的优化，比如 Prometheus 抓取插件里把 Go 运行时指标丢掉：

```toml
[[instances]]
urls = ["http://localhost:9100/metrics"]
ignore_metrics = ["go_*", "process_*"]
```

## 在前台单独跑一个插件

改完配置别直接重启，先试采一次：

```bash
/opt/categraf/categraf --configs /opt/categraf/conf --test --inputs mysql
```

- `--configs` **用绝对路径**。Categraf 启动时会把工作目录切到二进制所在目录，
  相对路径解析出来的位置多半不是你想的那个；
- `--inputs` 只跑列出来的插件，多个用**冒号**分隔：`--inputs cpu:mem:mysql`；
- `--test` 把采到的指标打到标准输出，**不往 writers 发**。

输出格式是「秒级时间戳 + 时分秒 + 指标名 + 排序过的标签 + 值」：

```
1788432166 18:42:46 cpu_usage_active agent_hostname=n9e-web-01 cpu=cpu-total env=prod 90.40
1788432151 18:42:31 mem_used_percent agent_hostname=n9e-web-01 env=prod 79.85
```

两点要注意：

1. **进程不会自己退出**，看到输出就 Ctrl-C。像 cpu 这种要算差值的插件，
   第一个周期没有输出，得等到第二个周期；
2. **`--test` 不会关掉心跳。** 它照样按 `[heartbeat]` 往夜莺发心跳，
   也就是说随手跑一次 `--test` 会在设备列表里创建/刷新一台机器。
   不想有这个副作用，先把 `[heartbeat] enable` 关掉，或者用一份单独的 conf 目录。

`--debug` 和 `--test` 打的是同样的内容，区别是 **`--debug` 照发不误**——
调线上问题用 `--debug`，验证配置用 `--test`。

改完配置让它生效，可以不重启：

```bash
systemctl reload categraf      # 等价于给进程发 SIGHUP
```

## 从中心下发配置

不想一台台改文件的话，Categraf 支持从一个 HTTP 服务拉配置：

```toml
[global]
providers = ["http"]

[http_provider]
remote_url = "http://config-server/categraf"
timeout = 5
reload_interval = 120
```

它会周期性地 `GET <remote_url>?agent=categraf&host=<hostname>`，
按返回的内容重建插件。`providers` 只认 `local` 和 `http` 两个值，写别的会直接 panic。

注意这是 Categraf 自己的能力，不是夜莺提供的服务——你得自己实现那个配置服务。
夜莺侧下发采集配置的做法见[安装采集配置](../integrations/collector-config.md)。

## 下一步

- 一次接完一个组件（配置 + 仪表盘 + 规则）：[安装采集配置](../integrations/collector-config.md)
- 指标往哪写、怎么写：[Remote Write](./remote-write.md)
- 插件报错、没数据：[排障](./troubleshooting.md)
