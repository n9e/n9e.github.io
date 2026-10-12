# 安装与注册

安装 agent、填夜莺的写入地址、确认主机出现在对象列表里。

最后校对于 2026-10-10

这页办完你会得到：目标机器上跑着 Categraf，**基础设施 → 设备列表** 里能看到这台机器， 点开有 CPU、内存、操作系统这些元信息。大约 5 分钟。

[Categraf](https://github.com/flashcatcloud/categraf) 是夜莺推荐的采集器：一个二进制、 90 多个输入插件，按 Prometheus Remote Write 协议把指标推给夜莺。夜莺自己不采集任何东西。

## 开始之前[​](#开始之前 "开始之前的直接链接")

* 目标机器**能访问夜莺的地址**（默认 `http://<夜莺IP>:17000`）；
* 有 root 权限；
* 夜莺已经起来了，还没起看[快速开始](https://n9e.github.io/zh/zh/docs/get-started/quick-start.md)。

## 路线一：从设备列表一键安装[​](#路线一从设备列表一键安装 "路线一：从设备列表�一键安装的直接链接")

**基础设施 → 设备列表**，右上角 **一键安装 Categraf**。

**1. 确认服务端地址。** 弹窗第一项是「夜莺服务端地址」，默认取服务端自己识别到的地址。 **被监控机器要能访问到它**——反向代理后面这个地址常常推错（少了端口、协议成了 http）， 不对就直接改。

**2. 复制命令，去目标机器上以 root 执行。** 命令长这样：

```
curl -sSfL 'http://10.0.0.10:17000/api/n9e/agents/categraf/install.sh' \

  | sudo bash -s -- --server 'http://10.0.0.10:17000' --download-base 'http://10.0.0.10:17000'
```

服务端开了 Basic Auth 的话，弹窗里会多出用户名密码两格， 填完命令会自动带上 `-u` 和 `--auth`——不填的话装完是上报不了数据的。

不放心直接 pipe 给 bash，展开「高级选项」有分步版本：先下载、`less` 看一眼、再执行。

弹窗还会告诉你安装包从哪来：「安装包由服务端直接分发，被监控机器无需公网」 说明夜莺自带了安装包；「服务端未内置安装包」则说明目标机器需要能访问公网。

**3. 等它上报。** 弹窗第二步每 5 秒检测一次，看到「已检测到 N 台新机器上报」就成了。 关掉弹窗，设备列表会自动刷新。

Windows 机器不走这条路，手动装。

## 路线二：手动装[​](#路线二手动装 "路线二：手动装的直接链接")

从 [GitHub Releases](https://github.com/flashcatcloud/categraf/releases) 下对应架构的包：

```
mkdir -p /opt/categraf && cd /opt/categraf

# 例：categraf-v0.5.17-linux-amd64.tar.gz

tar xzf categraf-<版本>-linux-amd64.tar.gz --strip-components=1
```

解开是一个二进制 `categraf` 加一个 `conf/` 目录，`conf/` 里有 `config.toml`、`logs.toml` 和一堆 `input.<插件>/` 子目录。

## 两个必配项：writers 和 heartbeat[​](#两个必配项writers-和-heartbeat "两个必配项：writers 和 heartbeat的直接链接")

改 `conf/config.toml`，只有两处必须动。**包里自带的示例地址是 指向的是打包时残留的某台开发机，对你一定是无效的，必须改掉。**

```
[[writers]]

# 指标往这里推。边缘模式下改成 n9e-edge 的地址

url = "http://10.0.0.10:17000/prometheus/v1/write"

basic_auth_user = ""

basic_auth_pass = ""

timeout = 5000

dial_timeout = 2500

max_idle_conns_per_host = 100



[heartbeat]

enable = true

# 心跳发到这里，机器靠它出现在设备列表

url = "http://10.0.0.10:17000/v1/n9e/heartbeat"

interval = 10
```

两者分工不同，缺一个会缺一块：

| 配置           | 关掉之后                                                                             |
| -------------- | ------------------------------------------------------------------------------------ |
| 只关 heartbeat | 设备列表里还能看到这台机器（靠指标认出来），但 CPU、内存、系统这些元信息全是 unknown |
| 只关 writers   | 元信息齐全，但没有指标，机器上挂的标签也附不到指标上                                 |
| 都关           | 设备列表里没有这台机器                                                               |

夜莺的 agent 接口（写入和心跳）**默认不开认证**，`basic_auth_user` / `basic_auth_pass` 留空即可；服务端在 `[HTTP.APIForAgent]` 里打开了 BasicAuth，这两处才要填。

顺手可以配的还有两项：

```
[global]

# 采集周期，秒

interval = 15

# 机器名，留空取 os.Hostname()。支持 $hostname / $ip / $sn 和环境变量

hostname = ""



[global.labels]

# 挂在这台机器所有指标上的标签

# region = "bj"

# env = "prod"
```

`hostname` 就是这台机器在夜莺里的**唯一标识**（设备列表里的「标识」列）。 两台机器用同一个 hostname，夜莺只会有一条记录，两边的元信息互相覆盖，**而且不会有任何告警**—— 所以务必保证全局唯一。

## 装成系统服务[​](#装成系统服务 "装成系统服务的直接链接")

Categraf 自带服务管理，不用自己写 unit 文件：

```
cd /opt/categraf

./categraf --install     # 生成并注册 systemd 服务，名字就叫 categraf

./categraf --start

./categraf --status
```

生成的服务 `WorkingDirectory` 是二进制所在目录，启动参数是 `-configs <目录>/conf`， `Restart=on-failure`。卸载用 `--remove`。

日志默认打到 stdout，服务模式下就是 journal：

```
journalctl -u categraf -n 50
```

想落到文件，改 `conf/config.toml` 的 `[log] file_name`，填一个路径即可（自动轮转）。

**一个必须知道的坑**：Categraf 启动时会先把工作目录切到自己二进制所在的目录。 所以 `--configs` 用相对路径时，相对的是**二进制所在目录**，不是你当前 shell 的目录。 在别处调用它，一律用绝对路径：

```
/opt/categraf/categraf --configs /opt/categraf/conf --test --inputs cpu
```

## 确认主机出现在设备列表里[​](#确认主机出现在设备列表里 "确认主机出现在设备列表里的直接链接")

**基础设施 → 设备列表**，应该能看到一行，「标识」列是你的 hostname。

表格里这几列是心跳带上来的，能一眼看出心跳通没通：

| 列         | 说明                              |
| ---------- | --------------------------------- |
| 状态       | 心跳新鲜度                        |
| AGENT版本  | categraf 的版本号                 |
| 上报的标签 | `[global.labels]` 里配的那些      |
| 更新时间   | 最近一次心跳                      |
| 内存 / CPU | 元信息；显示 unknown 说明心跳没通 |
| 时间偏移   | 夜莺机器的时间减去这台机器的时间  |
| 来源 IP    | 心跳请求的来源地址                |

左侧概览里的「有心跳 / 无心跳 / 未上报」可以快速定位有问题的机器。

再确认指标也到了：**数据查询 → 指标**，数据源选 `embedded-tsdb`，查一条：

```
cpu_usage_active
```

有曲线，并且带着 `agent_hostname` 标签，就说明两条链路都通了。

## 下一步[​](#下一步 "下一步的直接链接")

* 开始采中间件和数据库：[输入插件](https://n9e.github.io/zh/zh/docs/data/categraf/plugins.md)
* 一次接完一个组件：[安装采集配置](https://n9e.github.io/zh/zh/docs/data/integrations/collector-config.md)
* 写入相关的细节：[Remote Write](https://n9e.github.io/zh/zh/docs/data/categraf/remote-write.md)
* 机器没出现或者没数据：[排障](https://n9e.github.io/zh/zh/docs/data/categraf/troubleshooting.md)
