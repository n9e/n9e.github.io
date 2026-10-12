# Java 程序监控

按应用能力选择 Spring Boot Actuator、Micrometer、JMX Exporter 或组件自带指标，再用 Categraf 或现有 Prometheus 抓取。

最后校对于 2026-10-11

这页办完，你会选择适合 Java 应用的指标暴露方式，并把 JVM 或应用指标接入夜莺。 夜莺 v9 不直接抓取 Java 进程；用 **Categraf v0.5.17** 或已有 Prometheus / vmagent 完成采集。

## Actuator[​](#actuator "Actuator的直接链接")

已有 Spring Boot 应用优先使用 Actuator。以下以 **Spring Boot 3.5.x** 的依赖管理为例，在应用的 Maven 依赖中加入：

```
<dependency>

  <groupId>org.springframework.boot</groupId>

  <artifactId>spring-boot-starter-actuator</artifactId>

</dependency>

<dependency>

  <groupId>io.micrometer</groupId>

  <artifactId>micrometer-registry-prometheus</artifactId>

</dependency>
```

版本由应用的 Spring Boot BOM 管理，不要混用另一条 Micrometer 版本线。 在 `application.properties` 中暴露 Prometheus 端点：

```
management.server.port=8081

management.endpoints.web.exposure.include=health,prometheus
```

应用需允许采集器访问该管理端口；使用 Spring Security、反向代理或自定义上下文路径时，按实际部署设置地址和认证。

```
curl --fail http://127.0.0.1:8081/actuator/prometheus
```

**预期结果**：响应是 Prometheus 文本指标，含 JVM 等指标，而不是登录页、JSON 错误或 404。 端点和注册表说明见 [Spring Boot 3.5 指标文档](https://docs.spring.io/spring-boot/3.5/reference/actuator/metrics.html)。

## Micrometer[​](#micrometer "Micrometer的直接链接")

没有 Spring Boot 时，也可以使用 Micrometer。选择 `micrometer-registry-prometheus`，将业务 Meter 注册到同一个 `PrometheusMeterRegistry`，通过 HTTP 返回它的 `scrape()` 文本。

不同 Micrometer 版本和 Prometheus 客户端版本的包名不同，按项目实际依赖使用[官方示例](https://docs.micrometer.io/micrometer/reference/implementations/prometheus.html)，不要照搬旧文中的 Java import。

仅创建 registry 而没有 HTTP 端点，采集器抓不到数据；仅引入依赖而未绑定 JVM 指标，也不会自动获得完整 JVM 数据。

## JMX[​](#jmx "JMX的直接链接")

无法修改应用源码、但组件提供 JMX MBean 时，可使用 JMX Exporter Java Agent。 以 **JMX Exporter 1.3.0** 的 HTTP 模式为例，在工作目录准备对应 jar 和 `jmx.yaml`：

```
rules:

  - pattern: ".*"
```

```
java -javaagent:./jmx_prometheus_javaagent-1.3.0.jar=9404:./jmx.yaml -jar ./app.jar

curl --fail http://127.0.0.1:9404/metrics
```

**预期结果**：9404 端口返回 Prometheus 指标。上面的规则用于起步验证，上线时按所需 MBean 收窄范围，并限制指标端口访问。 发行包与参数以 [1.3.0 官方说明](https://prometheus.github.io/jmx_exporter/1.3.0/java-agent/http-mode/) 为准。

## 组件自身暴露指标[​](#component-metrics "组件自身暴露指标的直接链接")

组件已有 Prometheus 指标端点时，优先复用，不必再添加重复的 JMX 抓取链路。 比如某些消息队列、中间件或服务框架提供自己的 `/metrics`；先确认返回格式及鉴权。 不同端点的指标名称与标签不同，应配套选择仪表盘和告警规则。

## 接入并验证[​](#verify "接入并验证的直接链接")

将实际端点加入 `conf/input.prometheus/prometheus.toml`，下面对应前面的 Actuator 示例：

```
[[instances]]

urls = ["http://127.0.0.1:8081/actuator/prometheus"]

url_label_key = "instance"

url_label_value = "{{.Host}}"
```

```
./categraf --test --inputs prometheus
```

**预期结果**：输出 `jvm_` 等指标，没有抓取或解析错误。重启现有采集服务后，在夜莺选择实际目的时序库，确认 JVM 样本持续更新。 已有 Prometheus 或 vmagent 抓取时，直接注册它们使用的存储为数据源，不必再用 Categraf 重复抓取。

## 下一步[​](#next "下一步的直接链接")

* [Prometheus 数据源](https://n9e.github.io/zh/zh/docs/data/prometheus.md)
* [进程监控](https://n9e.github.io/zh/zh/docs/practice/proc.md)
