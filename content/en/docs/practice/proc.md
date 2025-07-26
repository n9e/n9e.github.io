---
title: "Process"
description: "This article introduces practical experience in process monitoring, including overall process count statistics and single process metric collection. It provides detailed explanations of Categraf's processes plugin and procstat plugin, along with links to related dashboards."
date: 2025-07-26T17:15:21.536+08:00
lastmod: 2025-07-26T17:15:25.451+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5100
toc: true
---

> For monitoring systems, the strength of basic functions is indeed crucial, but how to implement them in different scenarios is even more critical. In the "Monitoring Practice" chapter, we collect various monitoring practices, categorized by different components. If you have good practical experience with a certain component, please submit a PR and attach your article link to the corresponding component directory.

Process monitoring consists of two parts: one is the statistics of the total number of processes in the operating system, and the other is the collection of metrics for individual processes.

## Overall Process Count

Taking Categraf as an example, Categraf provides the `processes` plugin for counting the number of processes on a machine, such as the total number of processes, the number of processes in Running state, the number of processes in Sleeping state, etc. For the data collected by the `processes` plugin, we have sorted out a dedicated dashboard:

> https://github.com/ccfos/nightingale/blob/main/integrations/Linux/dashboards/categraf-processes.json

What is the use of such metrics? They are usually useful in scenarios where a large number of unexpected processes are started. For example, the author once encountered a situation where a crontab script was poorly written and hung, and there was no check in the cron script to see if the previous process had exited. As a result, each time crontab executed, a new process was started, eventually leading to a large number of processes with the same name running on the machine, which eventually caused an accident. At this time, the metrics collected by the `processes` plugin can be used to detect the problem.

## Single Process Metrics

Single process metrics refer to indicators such as CPU, memory, and file handles occupied by a process. There are multiple ways to collect them.

- Embedding monitoring points in the process. For example, Java programs can use micrometer or Spring Boot Actuator to collect metrics, and Go programs can use Prometheus's Go client library to collect metrics.
- Collecting outside the process. For example, using Process Exporter, Categraf's procstat plugin, etc., to collect process metrics.

In general, embedding monitoring points in the process is a more recommended approach. It can not only collect conventional metrics such as CPU and memory of the process but also collect more runtime metrics. For example, Java programs can collect some JVM metrics, and Go programs can collect some goroutine and gc metrics. All excellent open-source software will expose their own monitoring metrics. As business developers have varying levels of proficiency, some may not be aware of the importance of embedding monitoring points. In such cases, out-of-process collection can be used as a supplement.

> Spring Boot Actuator can be configured to directly expose metrics data in Prometheus format, so no additional plugins are needed for collection. You can directly use Categraf's `prometheus` plugin. Alternatively, you can configure scraping rules directly in Prometheus or vmagent.

Taking Categraf's `procstat` plugin as an example, its documentation can be referenced [here](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/procstat/). The key metrics to focus on are:

- procstat_lookup_count: the number of processes. If it is 0, it means the corresponding process has crashed.
- procstat_rlimit_num_fds_soft: the soft limit of file handles for the process. If it is 1024, it usually indicates that the system parameters are not properly tuned.
- procstat_cpu_usage_total: process CPU usage.
- procstat_mem_usage_total: process memory usage.
- procstat_num_fds_total: the total number of file handles opened by the process.
- procstat_read_bytes_total: the total number of bytes read by the process.
- procstat_write_bytes_total: the total number of bytes written by the process.

For a dashboard for single processes, you can refer to:

> https://github.com/ccfos/nightingale/blob/main/integrations/Procstat/dashboards/categraf-procstat.json

## FAQ

**1. How to monitor multiple processes with the procstat plugin?**

A configuration example is as follows:

```toml
[[instances]]
search_exec_substring = "mysqld"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]

[[instances]]
search_exec_substring = "n9e-plus"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]
```

**2. What is the purpose of the jvm parameter in gather_more_metrics in the procstat configuration?**

If gather_more_metrics includes jvm, it will be considered that the target process to be collected is a Java process, and the system's jstat command will be called to collect some basic JVM metrics. jstat is a tool that comes with the JDK installation, located in the bin directory of the JDK. A common pitfall here is that users configure jvm in gather_more_metrics, have jstat on the machine, and can collect data when testing with the following command:

```bash
./categraf --test --inputs procstat
```

But after restarting Categraf for formal collection, data cannot be collected. The usual reason is that Categraf is managed by systemd, and systemd does not know the JDK environment variables, so it cannot find the jstat command. The solution is to configure Categraf's service file and add the JDK environment variables. For example:

```
Environment="PATH=/usr/lib/jvm/java-11-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```