---
title: "应用监控"
description: "夜莺（ Nightingale ）通过 Prometheus SDK 监控应用程序"
lead: ""
date: 2020-10-06T08:48:57+00:00
lastmod: 2020-10-06T08:48:57+00:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 820
toc: true
---

## 写在前面

应用监控实际要比 OS、中间件的监控更为关键，因为某个 OS 层面的指标异常，比如 CPU 飙高了，未必会影响终端用户的体验，但是应用层面的监控指标出问题，通常就会影响客户的感受、甚至影响客户的付费。

针对应用监控，Google提出了 4 个黄金指标，分别是：流量、延迟、错误、饱和度，其中前面 3 个指标都可以通过内嵌 SDK 的方式埋点采集，本节重点介绍这种方式。当然了，内嵌 SDK 有较强的代码侵入性，如果业务研发难以配合，也可以采用解析日志的方案，这个超出了夜莺（夜莺是指标监控系统）的范畴，大家如果感兴趣，可以了解一下[快猫的商业化产品](https://flashcat.cloud/)

## 埋点工具

最常见的通用埋点工具有两个，一个是 statsd，一个是 prometheus SDK，当然，各个语言也会有自己的更方便的方式，比如 Java 生态使用 micrometer 较多，如果是 SpringBoot 的程序，则使用 actuator 会更便捷，actuator 底层就是使用 micrometer。

## 夜莺自身监控

我们就以夜莺自身的代码举例，讲解如何内嵌埋点工具，这里选择 prometheus SDK 作为埋点方案。

夜莺核心模块有两个，Webapi 主要是提供 HTTP 接口给 JavaScript 调用，Server 主要是负责接收监控数据，处理告警规则，这两个模块都引入了 Prometheus 的 Go 的SDK，用此方式做 App Performance 监控，本节以夜莺的代码为例，讲解如何使用 Prometheus 的 SDK。

### Webapi

Webapi 模块主要统计两个内容，一个是请求的数量统计，一个是请求的延迟统计，统计时，要用不同的 Label 做维度区分，后面就可以通过不同的维度做多种多样的统计分析，对于 HTTP 请求，规划 4 个核心 Label，分别是：service、code、path、method。service 标识服务名称，要求全局唯一，便于和其他服务名称区分开，比如 Webapi 模块，就定义为 n9e-webapi，code 是 HTTP 返回的状态码，200 就表示成功数量，其他 code 就是失败的，后面我们可以据此统计成功率，method 是 HTTP 方法，GET、POST、PUT、DELETE 等，比如新增用户和获取用户列表可能都是 `/api/n9e/users`，从路径上无法区分，只能再加上 method 才能区分开。

path 着重说一下，表示请求路径，比如上面提到的`/api/n9e/users`，但是，在 restful 实践中，url 中经常会有参数，比如获取编号为1的用户的信息，接口是`/api/n9e/user/1`，获取编号为2的用户信息，接口是`/api/n9e/user/2`，如果这俩带有用户编号的 url 都作为 Label，会造成时序库索引爆炸，而且从业务方使用角度来看，我们也不关注编号为1的用户获取请求还是编号为2的用户获取请求，而是关注整体的`GET /api/n9e/user/:id`这个接口的监控数据。所以我们在设置 Label 的时候，要把path设置为`/api/n9e/user/:id`，而不是那具体的带有用户编号的 url 路径。夜莺用的 gin 框架，gin 框架有个 FullPath 方法就是获取这个信息的，比较方便。

首先，我们在 Webapi 下面创建一个 stat package，放置相关统计变量：

```go
package stat

import (
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

const Service = "n9e-webapi"

var (
	labels = []string{"service", "code", "path", "method"}

	uptime = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "uptime",
			Help: "HTTP service uptime.",
		}, []string{"service"},
	)

	RequestCounter = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_request_count_total",
			Help: "Total number of HTTP requests made.",
		}, labels,
	)

	RequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Buckets: []float64{.01, .1, 1, 10},
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latencies in seconds.",
		}, labels,
	)
)

func Init() {
	// Register the summary and the histogram with Prometheus's default registry.
	prometheus.MustRegister(
		uptime,
		RequestCounter,
		RequestDuration,
	)

	go recordUptime()
}

// recordUptime increases service uptime per second.
func recordUptime() {
	for range time.Tick(time.Second) {
		uptime.WithLabelValues(Service).Inc()
	}
}
```

uptime 变量是顺手为之，统计进程启动了多久时间，不用太关注，RequestCounter 和 RequestDuration，分别统计请求流量和请求延迟。Init 方法是在 Webapi 模块进程初始化的时候调用，所以进程一起，就会自动注册好。

然后我们写一个 middleware，在请求进来的时候拦截一下，省的每个请求都要去统计，middleware 方法的代码如下：

```go
import (
	...
	promstat "github.com/didi/nightingale/v5/src/webapi/stat"
)

func stat() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		code := fmt.Sprintf("%d", c.Writer.Status())
		method := c.Request.Method
		labels := []string{promstat.Service, code, c.FullPath(), method}

		promstat.RequestCounter.WithLabelValues(labels...).Inc()
		promstat.RequestDuration.WithLabelValues(labels...).Observe(float64(time.Since(start).Seconds()))
	}
}
```

有了这个 middleware 之后，new 出 gin 的 engine 的时候，就立马 Use 一下，代码如下：

```go
...
r := gin.New()
r.Use(stat())
...
```

最后，监控数据要通过`/metrics`接口暴露出去，我们要暴露这个请求端点，代码如下：

```go
import (
	...
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func configRoute(r *gin.Engine, version string) {
	...
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
}
```

如上，每个 Webapi 的接口的流量和成功率都可以监控到了。如果你也部署了夜莺，请求 Webapi 的端口（默认是18000）的 `/metrics` 接口看看吧。

{{< alert icon="💡" text="如果服务部署多个实例，甚至多个 region，多个环境，上面的 4 个 Label 就不够用了，因为只有这 4 个 Label 不足以唯一标识一个具体的实例，此时需要 env、region、instance 这种 Label，这些 Label不 需要在代码里埋点，在采集的时候一般可以附加额外的标签，通过附加标签的方式来处理即可" />}}

### Server

Server 模块的监控，和 Webapi 模块的监控差异较大，因为关注点不同，Webapi 关注的是 HTTP 接口的请求量和延迟，而 Server 模块关注的是接收了多少监控指标，内部事件队列的长度，从数据库同步告警规则花费多久，同步了多少条数据等，所以，我们也需要在 Server 的 package 下创建一个 stat 包，stat 包下放置 stat.go，内容如下：

```go
package stat

import (
	"github.com/prometheus/client_golang/prometheus"
)

const (
	namespace = "n9e"
	subsystem = "server"
)

var (
	// 各个周期性任务的执行耗时
	GaugeCronDuration = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: namespace,
		Subsystem: subsystem,
		Name:      "cron_duration",
		Help:      "Cron method use duration, unit: ms.",
	}, []string{"cluster", "name"})

	// 从数据库同步数据的时候，同步的条数
	GaugeSyncNumber = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: namespace,
		Subsystem: subsystem,
		Name:      "cron_sync_number",
		Help:      "Cron sync number.",
	}, []string{"cluster", "name"})

	// 从各个接收接口接收到的监控数据总量
	CounterSampleTotal = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: namespace,
		Subsystem: subsystem,
		Name:      "samples_received_total",
		Help:      "Total number samples received.",
	}, []string{"cluster", "channel"})

	// 产生的告警总量
	CounterAlertsTotal = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: namespace,
		Subsystem: subsystem,
		Name:      "alerts_total",
		Help:      "Total number alert events.",
	}, []string{"cluster"})

	// 内存中的告警事件队列的长度
	GaugeAlertQueueSize = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: namespace,
		Subsystem: subsystem,
		Name:      "alert_queue_size",
		Help:      "The size of alert queue.",
	}, []string{"cluster"})
)

func Init() {
	// Register the summary and the histogram with Prometheus's default registry.
	prometheus.MustRegister(
		GaugeCronDuration,
		GaugeSyncNumber,
		CounterSampleTotal,
		CounterAlertsTotal,
		GaugeAlertQueueSize,
	)
}
```

定义一个监控指标，除了 name 之外，还可以设置 namespace、subsystem，最终通过 `/metrics` 接口暴露的时候，可以发现：监控指标的最终名字，就是`$namespace_$subsystem_$name`，三者拼接在一起。Webapi 模块的监控代码中我们看到了 counter 类型和 histogram 类型的处理，这次我们拿 GaugeAlertQueueSize 举例，这是个 GAUGE 类型的统计数据，起一个 goroutine 周期性获取队列长度，然后 Set 到 GaugeAlertQueueSize 中：

```go
package engine

import (
	"context"
	"time"

	"github.com/didi/nightingale/v5/src/server/config"
	promstat "github.com/didi/nightingale/v5/src/server/stat"
)

func Start(ctx context.Context) error {
	...
	go reportQueueSize()
	return nil
}

func reportQueueSize() {
	for {
		time.Sleep(time.Second)
		promstat.GaugeAlertQueueSize.WithLabelValues(config.C.ClusterName).Set(float64(EventQueue.Len()))
	}
}

```

另外，Init 方法要在 Server 模块初始化的时候调用，Server 的 router.go 中要暴露 `/metrics` 端点路径，这些就不再详述了，大家可以扒拉一下夜莺的代码看一下。

### 数据抓取

应用自身的监控数据已经通过 `/metrics` 接口暴露了，后续采集规则可以在 prometheus.yml 中配置，prometheus.yml 中有个 section 叫：scrape_configs 可以配置抓取目标，这是 Prometheus 范畴的知识了，大家可以参考[Prometheus官网](https://prometheus.io/)。

或者，大家也可以使用 Categraf 的 prometheus 插件抓取 `/metrics` 数据，就是把 url 配置进去即可，比较容易。

## 参考资料

- [https://prometheus.io/docs/instrumenting/clientlibs/](https://prometheus.io/docs/instrumenting/clientlibs/)
- [https://github.com/prometheus/client_golang/tree/master/examples](https://github.com/prometheus/client_golang/tree/master/examples)