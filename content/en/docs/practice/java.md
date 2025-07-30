---
title: "Java Programs"
description: "How to monitor Java programs? There are usually the following methods: Actuator, Micrometer, JMX, and components exposing metrics themselves. This article introduces the configuration methods and usage scenarios of these methods."
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

> For monitoring systems, the strength of basic functions is indeed crucial, but how to implement them in different scenarios is even more critical. In the "Monitoring Practice" chapter, we collect various monitoring practice experiences, which will be categorized by different components. If you have good practical experience with a certain component, you are welcome to submit a PR and attach the link of your article to the corresponding component directory.

How to monitor Java programs? There are usually the following methods:

- Actuator
- Micrometer
- JMX
- Components exposing metrics themselves

## Actuator

If you have a Spring Boot app, you can directly use Actuator to expose metrics. You can use the following prompt to ask GPT:

```
How to enable actuator and expose monitoring metrics in Prometheus format?
```

I have pasted the AI's reply here, which is probably correct. You can try it. If you find any problems, please feel free to submit an issue or PR.

To enable Actuator and expose Prometheus monitoring metrics in a Spring Boot project, you need to complete the following steps:

### 1. Add dependencies

Add the following dependencies to your `pom.xml`:

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

If you are using Gradle:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-prometheus'
```

### 2. Configure application.properties or application.yml

Ensure that Actuator endpoints and the Prometheus metrics endpoint are exposed. For example:

```properties
management.endpoints.web.exposure.include=*
management.endpoint.prometheus.enabled=true
management.metrics.export.prometheus.enabled=true
```

Or in YAML format:

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

### 3. Start the application

After starting your Spring Boot application, Actuator's Prometheus endpoint will be exposed at `/actuator/prometheus` by default.

### 4. Verify the metrics endpoint

Access it using a browser or curl:

```
http://localhost:8080/actuator/prometheus
```

You will see monitoring metrics in Prometheus format, which can be scraped using Prometheus or Categraf.

**Note:**

- If you want to expose only some endpoints, such as `prometheus` and `health`, you can adjust the configuration to `management.endpoints.web.exposure.include=prometheus,health`
- For more advanced configurations (such as custom metrics), you can inject `MeterRegistry` in the code and register custom metrics.

## Micrometer

If you are not using a Spring Boot app, you can also use Micrometer to expose monitoring metrics in Prometheus format. Micrometer is an independent library that can be integrated with any Java application. Actuator is actually based on Micrometer. You can use the following prompt to ask GPT:

```
If actuator is not used and only micrometer is used, how to export metrics to Prometheus?
```

I have pasted the AI's reply here, which is probably correct. You can try it. If you find any problems, please feel free to submit an issue or PR.

### 1. Add Micrometer and Prometheus dependencies

Taking Maven as an example:

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

### 2. Register PrometheusMeterRegistry

In your application code, manually create and register `PrometheusMeterRegistry`, for example:

```java
import io.micrometer.prometheus.PrometheusMeterRegistry;
import io.micrometer.prometheus.PrometheusConfig;
import io.micrometer.core.instrument.MeterRegistry;

PrometheusMeterRegistry prometheusRegistry = new PrometheusMeterRegistry(PrometheusConfig.DEFAULT);

// You can register custom metrics through MeterRegistry
// prometheusRegistry.counter("my_custom_counter").increment();
```

### 3. Expose Prometheus metrics HTTP interface

Micrometer does not automatically expose an HTTP interface. You need to **implement an HTTP endpoint yourself**, such as using Spring MVC or other web frameworks:

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

Alternatively, if it is not a Spring project, you can use a web server like Jetty, Undertow, or Netty to directly expose the `/prometheus` path and use the content of `prometheusRegistry.scrape()` as the response. Finally, use Prometheus or Categraf to scrape this endpoint.


## JMX

If the Java program you want to monitor is not a self-developed program but an open-source component, such as Tomcat, Kafka, Zookeeper, etc., these components usually expose monitoring metrics through JMX. You can use the following prompt to ask GPT:

```
How to collect monitoring metrics for ordinary Java middleware such as Tomcat and Kafka?
```

1. It is recommended to use [JMX Exporter](https://github.com/prometheus/jmx_exporter), which is a jar package that runs as a javaagent.
2. Download the jmx_exporter jar package.
3. Find the component's startup command and add javaagent-related parameters to the startup parameters, such as `-javaagent:/path/to/jmx_prometheus_javaagent-<version>.jar=PORT:/path/to/config.yaml` to specify the path of the jmx_exporter jar, the port to expose metrics, and the path of the configuration file.

This will expose Prometheus metrics on the specified port (e.g., `http://localhost:PORT/metrics`). Then use Prometheus or Categraf to scrape this endpoint.

However, note that different components require different configuration files. JMX Exporter provides many examples at the specific address: [https://github.com/prometheus/jmx_exporter/tree/main/examples](https://github.com/prometheus/jmx_exporter/tree/main/examples). You can continue to ask AI:

- What do the configuration items in config.yaml mean?
- What is a Java MBean?
- How to configure JMX Exporter to collect a specific MBean?
- Throw the sample configuration provided by jmx_exporter to AI and let AI help you analyze the specific meaning of this configuration.

## Components exposing metrics themselves

Some components have built-in ways to expose monitoring metrics. For example, Tomcat can display various monitoring metrics on the HTTP endpoint `/manager/status/all`. The Tomcat collection plugin provided by Categraf collects monitoring metrics based on this endpoint. The configuration method is:

1. Modify tomcat-users.xml and add the following content, which is equivalent to creating a user to access the `/manager/status/all` endpoint:

```xml
<role rolename="admin-gui" />
<user username="tomcat" password="s3cret" roles="manager-gui" />
```

2. Comment out the following content in the file `webapps/manager/META-INF/context.xml`:

```xml
  <Valve className="org.apache.catalina.valves.RemoteAddrValve"
         allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
```

3. Configure the Tomcat collection address and authentication information in Categraf's `conf/input.tomcat/tomcat.toml`.

> Note: The JMX method is universal, but the way each component exposes metrics varies. The above is just an example with Tomcat. For other components, you need to refer to their respective documents.