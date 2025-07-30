---
title: "Java 类程序"
description: "Java 类的程序如何监控？通常有如下几种方式：Actuator、Micrometer、JMX、组件自身暴露指标。本文介绍了这些方式的配置方法和使用场景。"
date: 2025-07-30T20:14:23+08:00
lastmod: 2025-07-30T20:14:23+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5500
toc: true
---

> 对于监控系统，基础功能的强弱确实非常关键，但是如何在不同的场景落地实践，则更为关键。在《监控实践》章节，搜罗各类监控实践经验，会以不同的组件分门别类，您如果对某个组件有好的实践经验，欢迎提 PR，把您的文章链接附到对应的组件目录下。

Java 类的程序如何监控？通常有如下几种方式：

- Actuator
- Micrometer
- JMX
- 组件自身暴露指标

## Actuator

如果你是 Spring Boot 的 App，可以直接使用 Actuator 来暴露指标。可以使用如下提示词来提问 GPT：

```
如何开启 actuator，暴露 Prometheus 格式的监控指标？
```

我把 AI 的回复贴在这里，大概率应该是对的，你可以尝试，如果发现问题，欢迎提 issue 或 pr。

要在 Spring Boot 项目中开启 Actuator 并暴露 Prometheus 监控指标，你需要完成以下几个步骤：

### 1. 引入依赖

在你的 `pom.xml` 中添加以下依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

如果你使用的是 Gradle：

```groovy
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-prometheus'
```

### 2. 配置 application.properties 或 application.yml

确保 Actuator 的端点和 Prometheus 指标端点是暴露的。例如：

```properties
management.endpoints.web.exposure.include=*
management.endpoint.prometheus.enabled=true
management.metrics.export.prometheus.enabled=true
```

或者 YAML 格式：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    prometheus:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
```

### 3. 启动应用

启动你的 Spring Boot 应用后，Actuator 的 Prometheus 端点会默认暴露在 `/actuator/prometheus`。

### 4. 验证指标端点

用浏览器或 curl 访问：

```
http://localhost:8080/actuator/prometheus
```

你将看到 Prometheus 格式的监控指标，使用 Prometheus 或 Categraf 来抓取即可。

**注意：**

- 如果你想只暴露部分端点，比如只暴露 `prometheus` 和 `health`，可以调整配置 `management.endpoints.web.exposure.include=prometheus,health`
- 如需更高级配置（自定义指标等），可以在代码中注入 `MeterRegistry` 并注册自定义指标。

## Micrometer

如果你不是 Spring Boot 的 App，也可以使用 Micrometer 来暴露 Prometheus 格式的监控指标。Micrometer 是一个独立的库，可以与任何 Java 应用程序集成。Actuator 实际上是基于 Micrometer 的。你可以使用如下提示词来提问 GPT：

```
如果没有使用 actuator，仅仅使用了 micrometer，应该如何把指标导出到 Prometheus？
```

我把 AI 的回复贴在这里，大概率应该是对的，你可以尝试，如果发现问题，欢迎提 issue 或 pr。

### 1. 添加 Micrometer 和 Prometheus 依赖

以 Maven 为例：

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-core</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### 2. 注册 PrometheusMeterRegistry

在你的应用代码中，手动创建并注册 `PrometheusMeterRegistry`，比如：

```java
import io.micrometer.prometheus.PrometheusMeterRegistry;
import io.micrometer.prometheus.PrometheusConfig;
import io.micrometer.core.instrument.MeterRegistry;

PrometheusMeterRegistry prometheusRegistry = new PrometheusMeterRegistry(PrometheusConfig.DEFAULT);

// 你可以通过 MeterRegistry 来注册自定义指标
// prometheusRegistry.counter("my_custom_counter").increment();
```

### 3. 暴露 Prometheus 指标 HTTP 接口

Micrometer 并不会自动暴露 HTTP 接口，你需要**自己实现一个 HTTP 端点**，例如用 Spring MVC 或其他 Web 框架：

```java
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PrometheusController {
    private final PrometheusMeterRegistry prometheusRegistry;

    public PrometheusController(PrometheusMeterRegistry prometheusRegistry) {
        this.prometheusRegistry = prometheusRegistry;
    }

    @GetMapping("/prometheus")
    public String scrape() {
        return prometheusRegistry.scrape();
    }
}
```

或者，如果不是 Spring 项目，可以用类似 Jetty、Undertow、Netty 等 WebServer 直接暴露 `/prometheus` 路径，将 `prometheusRegistry.scrape()` 的内容作为响应。最后使用 Prometheus 或 Categraf 来抓取这个端点即可。


## JMX

如果你要监控的 Java 程序不是自研的程序，而是一个开源组件，比如 Tomcat、Kafka、Zookeeper 等，通常这些组件会通过 JMX 暴露监控指标。你可以使用如下提示词来提问 GPT：

```
普通的 Java 中间件，比如 Tomcat、Kafka，应该如何采集其监控指标？
```

1. 推荐使用 [JMX Exporter](https://github.com/prometheus/jmx_exporter)，这是一个 jar 包，以 javaagent 的方式运行。
2. 下载 jmx_exporter 的 jar 包
3. 找到组件的启动命令，在启动参数中添加 javaagent 相关的参数，比如 `-javaagent:/path/to/jmx_prometheus_javaagent-<version>.jar=PORT:/path/to/config.yaml` 指定 jmx_exporter 的 jar 的路径、要暴露的指标端口以及配置文件的路径。

这样会在指定端口上暴露 Prometheus 指标（如 `http://localhost:PORT/metrics`）。然后使用 Prometheus 或 Categraf 来抓取这个端点即可。

但是注意，不同的组件需要不同的配置文件，jmx_exporter 提供了很多例子，具体地址是：[https://github.com/prometheus/jmx_exporter/tree/main/examples](https://github.com/prometheus/jmx_exporter/tree/main/examples)。你可以向 AI 继续提问：

- config.yaml 的配置项分别代表什么意思
- Java MBean 是个什么东西
- 如何配置 JMX Exporter 采集某个特定的 MBean
- 把 jmx_exporter 提供的样例配置扔给 AI，让 AI 帮你分析一下这个配置的具体含义

## 组件自身暴露指标

有些组件自身就内置了一些方式来暴露监控指标，比如 Tomcat，在 HTTP 端点 `/manager/status/all` 上可以看到各类监控指标。Categraf 提供的 tomcat 采集插件就是基于这个端点来采集监控指标的。配置方法是：

1、修改 tomcat-users.xml ，增加下面的内容，相当于是创建了一个用户来访问 `/manager/status/all` 端点：

```xml
<role rolename="admin-gui" />
<user username="tomcat" password="s3cret" roles="manager-gui" />
```

2、注释掉文件 `webapps/manager/META-INF/context.xml` 的以下内容：

```xml
  <Valve className="org.apache.catalina.valves.RemoteAddrValve"
         allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
```

3、在 Categraf 的 `conf/input.tomcat/tomcat.toml` 中配置 Tomcat 采集地址和认证信息即可。

> 注意：JMX 方式是通用的，但是各个组件自身暴露指标的方式不尽相同，上面只是用 Tomcat 举例，其他的组件就需要分别查阅其文档了。