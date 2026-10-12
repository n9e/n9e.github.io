# 学习夜莺的前置知识

先掌握日志、进程、时序数据、PromQL 与采集链路，再按现象定位采集、存储、告警和通知问题。

最后校对于 2026-10-11

读完这页，你会知道使用夜莺前需要掌握什么，并能把“没数据”“没告警”“没通知”拆成具体环节排查。

## Linux 与部署基础[​](#linux "Linux 与部署基础的直接链接")

二进制部署需要知道进程工作目录、配置文件位置、stdout / stderr 和 systemd 服务。 容器部署需要知道端口映射、挂载目录、容器日志，以及容器内的 `127.0.0.1` 指向哪里。

```
sudo journalctl -u n9e.service -n 100 --no-pager

sudo journalctl -u categraf.service -n 100 --no-pager
```

服务名按实际安装修改。**预期结果**：能看到所排查进程的近期日志；如果没有该服务单元，换成实际运行方式的日志入口。

## 时序数据模型[​](#time-series "时序数据模型的直接链接")

* **指标名**描述测量对象，比如 CPU 使用率。
* **标签**区分主机、服务和实例；指标名与标签组合标识一条时序。
* **时间戳与数值**是一条样本。主机时钟错误会让数据落到错误时间范围。
* **Gauge** 表示当前值；**Counter** 表示累计值，计算速率时要考虑重启归零。
* Histogram / Summary 不是一个普通数值，查询时需要理解桶、计数和求和。

避免把每次请求的唯一 ID 当作标签。更多概念见 [Prometheus 数据模型](https://prometheus.io/docs/concepts/data_model/)。

## PromQL[​](#promql "PromQL的直接链接")

先能做三件事：按标签选择时序、对 Counter 计算 `rate()`、按需要聚合多个实例。 指标阈值应建立在数据语义上，不能把累计计数直接当每秒请求量。

Instant query 返回某个时刻的结果，Range query 返回一段时间内的序列；查询时间范围和步长影响展示。 在[即时查询](https://n9e.github.io/zh/zh/docs/query/metric-explorer.md)验证表达式，再放到[指标告警规则](https://n9e.github.io/zh/zh/docs/alerting/metric-rules.md)里。 表达式说明见 [Prometheus 查询文档](https://prometheus.io/docs/prometheus/latest/querying/basics/)。

## Pull 与 Push[​](#collection-paths "Pull 与 Push的直接链接")

Prometheus / vmagent 的抓取是 Pull：采集端知道一次抓取是否成功，可以产生 `up`。 Categraf Remote Write 是 Push：采集器主动发送指标，不能把它的链路直接套成抓取 `up` 的判断。

夜莺 v9 可以使用内置时序库，也可以查询外置存储。已有 Prometheus 数据时，接数据源即可，不必迁移数据。 心跳元信息与时序写入也是两条不同链路，见 [Linux 机器监控](https://n9e.github.io/zh/zh/docs/practice/linux.md)。

## 排查与提问[​](#troubleshooting "排查与提问的直接链接")

先确定哪条链路出了问题：

1. 采集器本地有没有样本？
2. 样本有没有送到正确存储？
3. 夜莺查询的是不是该数据源？
4. 规则判定有没有产生事件？
5. 事件有没有被屏蔽、过滤或处理？
6. 通知发送是否成功？

提问时附组件版本、部署方式、预期与实际现象、问题时间段、最小配置和相关日志。 配置与日志中的密码、Token、真实用户信息先做脱敏。保留错误上下文，比只贴一行“报错了”更容易定位。

## 下一步[​](#next "下一步的直接链接")

* [快速开始](https://n9e.github.io/zh/zh/docs/get-started/quick-start.md)
* [系统架构](https://n9e.github.io/zh/zh/docs/concepts/architecture.md)
* [数据源连上了，为什么查不到数据？](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)
