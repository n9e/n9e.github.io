# 进程监控

区分系统进程总数和单个服务的资源占用，用 processes、procstat 或应用指标采集验证进程存活。

最后校对于 2026-10-11

这页办完，你会知道如何分别监控“系统进程太多”和“某个服务没了”，并采到单个服务的资源指标。 配置以 **Categraf v0.5.17、夜莺 v9** 为例。

## 总进程数和服务指标[​](#choose "总进程数和服务指标的直接链接")

* `processes` 插件统计运行、睡眠等状态下的系统进程数量，适合发现脚本或任务意外堆积。
* `procstat` 插件匹配具体进程，采集数量、CPU、内存、句柄等指标。
* 应用自身暴露的 Prometheus 指标还能描述请求、错误和运行时，见 [Java 监控](https://n9e.github.io/zh/docs/practice/java.md)。

进程存在不等于业务可用，重要服务还需要[端口或 HTTP 探测](https://n9e.github.io/zh/docs/practice/port.md)。

## 配置 procstat[​](#configure "配置 procstat的直接链接")

编辑 `conf/input.procstat/procstat.toml`：

```
[[instances]]

search_exec_substring = "nginx"

gather_total = true

gather_per_pid = false

gather_more_metrics = ["cpu", "mem", "fd", "uptime"]

labels = { service = "nginx" }
```

替换匹配条件。在采集机器上确认匹配的是目标服务，而不是进程名相似的其他程序。 另一个服务增加新的 `[[instances]]`；每组只选用适合的匹配方式。 `gather_per_pid = true` 会为每个进程附加 PID 标签，频繁重启时会增加时序数量，按需要使用。

## 验证和告警[​](#verify "验证和告警的直接链接")

```
./categraf --test --inputs processes:procstat
```

**预期结果**：进程总数和匹配服务的指标出现；匹配数量与实际进程一致。 确认后重启现有服务，在夜莺即时查询中检查 `procstat_lookup_count`。

匹配到目标时该值大于 0，匹配不到时为 0。先在测试服务上验证匹配，再配置持续一段时间的告警，避免正常重启触发瞬时噪音。 如果主机或采集器失联，指标可能消失；这和进程数量为 0 是不同情况，还需配[主机失联检测](https://n9e.github.io/zh/docs/practice/linux.md#missing-host)。

## JVM 与 systemd 环境[​](#jvm "JVM 与 systemd 环境的直接链接")

`gather_more_metrics` 的 `jvm` 项依赖目标机器的 `jstat`。 前台测试能运行、systemd 服务却失败时，检查服务的 PATH、JDK 安装位置和访问目标进程的权限。 使用 `sudo systemctl edit categraf.service` 加入实际 JDK 路径，例如：

```
[Service]

Environment="PATH=/usr/lib/jvm/java-17-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

重启后检查日志；不要把示例路径照搬到没有该 JDK 的机器。 配置依据：[procstat v0.5.17](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.procstat/procstat.toml)。

## 下一步[​](#next "下一步的直接链接")

* [Java 程序监控](https://n9e.github.io/zh/docs/practice/java.md)
* [指标告警规则](https://n9e.github.io/zh/docs/alerting/metric-rules.md)
