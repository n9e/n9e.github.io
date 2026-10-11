---
title: "Monitor Java applications"
sidebar_label: "Monitor Java applications"
description: "Choose Actuator, Micrometer, JMX Exporter or built-in application metrics, then scrape them with Categraf or Prometheus."
---

By the end of this page, you will choose a suitable Java metrics endpoint and connect JVM or application metrics to Nightingale.
Nightingale v9 does not scrape Java processes itself. Use **Categraf v0.5.17**, Prometheus or vmagent.

## Actuator {#actuator}

For a Spring Boot application, prefer Actuator. This example uses dependency management from **Spring Boot 3.5.x**:

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

Let the application's Spring Boot BOM manage versions instead of mixing Micrometer release lines.
Expose the endpoint in `application.properties`:

```properties
management.server.port=8081
management.endpoints.web.exposure.include=health,prometheus
```

Allow the collector to access the management port. Adjust paths and credentials for Spring Security, proxies and custom application contexts.

```bash
curl --fail http://127.0.0.1:8081/actuator/prometheus
```

**Expected result**: Prometheus text with JVM metrics, not a login page, JSON error or 404.
See the [Spring Boot 3.5 metrics documentation](https://docs.spring.io/spring-boot/3.5/reference/actuator/metrics.html).

## Micrometer {#micrometer}

Without Spring Boot, use `micrometer-registry-prometheus`, register application meters with a shared `PrometheusMeterRegistry`, and serve its `scrape()` output over HTTP.

Package names vary between Micrometer and Prometheus client versions. Follow the [official example](https://docs.micrometer.io/micrometer/reference/implementations/prometheus.html) for your dependencies instead of copying old imports.

A registry without an HTTP endpoint cannot be scraped. Adding a registry dependency without binding JVM meters does not create all JVM metrics automatically.

## JMX {#jmx}

For an application you cannot modify but that exposes MBeans, use the JMX Exporter Java Agent.
This HTTP-mode example uses **JMX Exporter 1.3.0**. Put the jar and `jmx.yaml` in the working directory:

```yaml
rules:
  - pattern: ".*"
```

```bash
java -javaagent:./jmx_prometheus_javaagent-1.3.0.jar=9404:./jmx.yaml -jar ./app.jar
curl --fail http://127.0.0.1:9404/metrics
```

**Expected result**: port 9404 returns Prometheus metrics. The broad rule is for initial verification; narrow it to required MBeans and restrict endpoint access for production.
Use the [1.3.0 documentation](https://prometheus.github.io/jmx_exporter/1.3.0/java-agent/http-mode/) for the package and options.

## Built-in component metrics {#component-metrics}

Reuse a component's existing Prometheus endpoint rather than adding a second JMX collection path.
Some middleware and service frameworks already expose `/metrics`; verify the format and authentication first.
Metric names and labels vary, so choose matching dashboards and rules.

## Connect and verify {#verify}

Add the actual endpoint to `conf/input.prometheus/prometheus.toml`. This example matches the Actuator configuration above:

```toml
[[instances]]
urls = ["http://127.0.0.1:8081/actuator/prometheus"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
```

```bash
./categraf --test --inputs prometheus
```

**Expected result**: metrics such as `jvm_` without scraping or parsing errors. Restart collection and check that new samples arrive in Nightingale's destination store.
If Prometheus or vmagent already scrapes the application, register its store as a datasource without adding another scrape path.

## Next {#next}

- [Prometheus datasource](../data/prometheus.md)
- [Process monitoring](./proc.md)
