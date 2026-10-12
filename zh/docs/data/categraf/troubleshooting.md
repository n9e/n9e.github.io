# 排障

Categraf 的问题按现象分三类：主机不出现、主机在但没指标、某个插件没数据；答案几乎都在日志里，包括不以 E! 标记的错误。

Categraf 侧的问题基本都能在日志里看出来，前提是知道去哪看、以及**哪些错误不是 `E!` 级别**。 这页按现象分三类：主机不出现、主机在但没指标、某个插件没数据。

## 先看日志[​](#先看日志 "先看日志的直接链接")

默认 `[log] file_name = "stdout"`，装成系统服务之后就是 journal：

```
journalctl -u categraf -n 100 --no-pager

journalctl -u categraf -f          # 跟踪
```

想落到文件，改 `conf/config.toml`：

```
[log]

file_name = "/var/log/categraf/categraf.log"

max_size = 100     # MB

max_age = 1        # 天

max_backups = 1
```

日志级别写在每行开头：`I!` 信息、`W!` 警告、`E!` 错误、`F!` 致命。

**这里有个坑：写入失败的日志是 `W!`，不是 `E!`。** 只 grep `E!` 会把「数据一直发不出去」 这个最常见的问题完整漏掉。查写入问题请 grep `W!` 或者直接看 `push data`：

```
journalctl -u categraf | grep -E 'W!|E!|F!'
```

另外，**配置文件本身加载失败的那条日志走的是 stderr，不受 `[log]` 控制**—— 如果你把日志重定向到文件，然后进程起不来、文件里又什么都没有，去看 stderr（journal 里有）：

```
F! failed to init config: ...
```

## 主机不出现在设备列表里[​](#主机不出现在设备列表里 "主机不出现在设备列表里的直接链接")

按顺序排查：

**1. 进程活着吗。**

```
systemctl status categraf
```

**2. 心跳开着吗。** `conf/config.toml` 里：

```
[heartbeat]

enable = true

url = "http://10.0.0.10:17000/v1/n9e/heartbeat"
```

**包里自带的示例地址是 指向的是打包时残留的某台开发机，对你一定是无效的**， 装完忘了改是最常见的原因。

**3. 心跳发出去了吗。** 日志里搜：

```
E! failed to do heartbeat: ...

E! heartbeat status code: 401  response: ...
```

* **connection refused / timeout**：网络不通，在这台机器上 `curl -v <夜莺地址>` 试试；
* **401**：服务端开了 BasicAuth，`[heartbeat] basic_auth_user/pass` 要填上；
* **404**：地址写错了，路径必须是 `/v1/n9e/heartbeat`；也可能是服务端把 `[HTTP.APIForAgent] Enable` 关了。

**4. 什么日志都没有？** 试试前台跑一次，只跑心跳：

```
/opt/categraf/categraf --configs /opt/categraf/conf --debug --inputs heartbeat
```

**5. 出现了但又消失了。** 检查有没有 hostname 撞车——两台机器用同一个 hostname 时， 夜莺里只有一条记录，两边的元信息交替覆盖，**不会有任何告警**。 看「来源 IP」和「AGENT版本」这两列是不是在两个值之间来回跳。

## 主机在，但没有指标[​](#主机在但没有指标 "主机在，但没有指标的直接链接")

心跳和写入是两条独立的链路，心跳通不代表指标通。

**1. 写入地址对不对。**

```
[[writers]]

url = "http://10.0.0.10:17000/prometheus/v1/write"
```

路径是 `/prometheus/v1/write`，不是 `/prometheus/api/v1/write`（后者是时序库的接口， 不是夜莺 pushgw 的）。

**2. 日志里有没有写入失败。** 一次失败会打三行，都是 `W!`：

```
W! push data with remote write request got error: Post "http://...": dial tcp ...: connection refused response body:

W! post to http://... got error: ...

W! example timeseries: labels:<name:"__name__" value:"mem_total" > ...
```

第三行会举一条这批里的样本，能看出丢的是哪部分数据。返回非 2xx 时是：

```
W! post to <url> got error: push data with remote write request got status code: 401, response body:
```

**记住写入失败没有重试**，这一批数据就丢了。所以看到这些行，除了修问题， 还要知道这段时间的数据是补不回来的。

**3. 队列满了。**

```
E! write 1000 samples failed, please increase queue size(1000000)
```

这条说明产出比发送快。**先查后端是不是慢或不通**，确认后端没问题再调大 `[writer_opt] chan_size`——后端不通的时候调大队列只是让丢数据晚一点发生。

**4. 查错了数据源。** 指标写进了 A，你在 B 里查。默认落在内置时序库 （数据源名 `embedded-tsdb`），配了 `Pushgw.Writers` 转发的话要去对应的数据源里查。

## 某个插件没数据[​](#某个插件没数据 "某个插件没数据的直接链接")

**1. 插件启用了吗。** 启动日志里找：

```
I! input: local.mysql started

E! input: local.jolokia_agent_kafka not supported
```

`not supported` 说明 `conf/input.<名字>/` 这个目录名对不上任何插件。 包里自带的 `input.jolokia_agent_kafka/`、`input.jolokia_agent_misc/`、 `input.amd_rocm_smi/` 就是这种情况，删掉即可。

**2. 一行日志都没有？** 这是多实例插件最典型的表现：必填字段没填时，插件会被静默跳过， **不报错也不打 started**。加 `--debug` 才看得见：

```
W! no instances for input:mysql
```

包里自带的示例配置默认全是注释掉的，所以「有 `input.mysql` 目录但没数据」， 八成就是 `[[instances]]` 里一个字段都没填。

**3. 单独试采一次。**

```
/opt/categraf/categraf --configs /opt/categraf/conf --test --inputs mysql
```

`--configs` **一定要用绝对路径**：Categraf 启动时会把工作目录切到自己二进制所在的目录， 相对路径会解析到 categraf 安装目录下，不是你当前 shell 的目录。

看到指标行说明插件本身没问题，问题在写入侧。看不到就是连不上目标或者权限不够， 错误信息一般会直接说。

顺带一句：**`--test` 不会关掉心跳**，它照样往夜莺发心跳， 所以在生产机器上随手跑一次也会刷新设备列表里的记录。

**4. 插件 panic。**

```
E! mysql : gather metrics panic: ... <堆栈>
```

panic 会被兜住，reader 不会死，下个周期继续采。带上堆栈去 [categraf issues](https://github.com/flashcatcloud/categraf/issues) 提一个。

## 数据到了，但标签不对[​](#数据到了但标签不对 "数据到了，但标签不对的直接链接")

* **少了 `agent_hostname`**：`[global] omit_hostname` 被设成了 true， 或者插件的 `labels` 里显式占了这个键；
* **想删掉某个标签**：在 `labels` 里把它的值写成 `"-"`，比如 `labels = { region = "-" }`；
* **在夜莺里打的机器标签没出现在指标上**：这些标签是夜莺在转发时附加的， 所以 Categraf 必须写给夜莺（而不是直连时序库），并且服务端 `Pushgw.LabelRewrite` 要是打开的；
* **上报的标签和自定义标签键名撞了**：上报的赢，自定义的那条被丢掉。

## 一份自查清单[​](#一份自查清单 "一份自查清单的直接链接")

装完一台机器没数据，按这个顺序过一遍，基本能定位：

1. `systemctl status categraf` —— 进程活着吗；
2. `journalctl -u categraf | grep -E 'W!|E!|F!'` —— 有没有明显报错；
3. `conf/config.toml` 里的两个 url 是不是还是包里自带的示例地址（那个地址对你无效）；
4. 在这台机器上 `curl -v <夜莺地址>` —— 网络通不通；
5. 设备列表里有没有这台机器，「更新时间」和「状态」怎么显示；
6. `categraf --configs <绝对路径> --test --inputs <插件>` —— 插件本身采得到吗；
7. **数据查询 → 指标** 里查 `{agent_hostname="<主机名>"}` —— 换个数据源再查一次。

容器部署还有一条：**镜像里的 `N9E_HOST` 环境变量是不生效的**（entrypoint 里替换的那个 占位地址在当前的 `config.toml` 里已经不存在了），必须自己挂载或者改 `config.toml`。

## 下一步[​](#下一步 "下一步的直接链接")

* 主机显示无心跳：[Categraf 失联](https://n9e.github.io/zh/zh/docs/troubleshooting/categraf-offline.md)
* 数据源连上了但查不到数据：[查不到数据](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)
* 写入链路的细节：[Remote Write](https://n9e.github.io/zh/zh/docs/data/categraf/remote-write.md)
* 插件配置的细节：[输入插件](https://n9e.github.io/zh/zh/docs/data/categraf/plugins.md)
