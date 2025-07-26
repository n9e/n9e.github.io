---
title: "Oracle"
description: "There are various methods to collect Oracle monitoring data, such as using tools like Categraf and Cprobe. The underlying principle is similar: connecting to an Oracle instance and executing relevant commands to obtain monitoring data."
date: 2025-07-26T17:15:00.602+08:00
lastmod: 2025-07-26T17:15:00.602+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5400
toc: true
---

> For monitoring systems, the strength of basic functions is indeed crucial, but how to implement them in different scenarios is even more important. In the "Monitoring Practice" chapter, we collect various monitoring practice experiences, categorized by different components. If you have valuable practice experiences with a specific component, please submit a PR and attach a link to your article in the corresponding component directory.

There are various methods to collect Oracle monitoring data, such as using tools like [Categraf](https://github.com/flashcatcloud/categraf) and [Cprobe](https://github.com/cprobe/cprobe). The underlying principle is similar: connecting to an Oracle instance and executing relevant commands to obtain monitoring data. This article uses Categraf v0.4.15 or later as an example to introduce the configuration method for Oracle monitoring data collection.

## Overview of Oracle Plugin Configuration

All plugin configurations for Categraf are by default in the `conf` directory. The configuration directory for Oracle is `conf/input.oracle`, which contains two configuration files:

- `oracle.toml`: The main configuration file for the Oracle plugin, which configures connection and authentication information for different Oracle instances. Categraf can connect to multiple Oracle instances simultaneously, and the configuration file can include connection information for multiple instances through different `[[instances]]` configuration sections.
- `metric.toml`: The Oracle plugin collects Oracle monitoring data by executing various SQL statements. Some SQL statements are general and intended to be executed by all Oracle instances, while others are specific to certain instances. General SQL statements are configured in `metric.toml`, and instance-specific SQL statements are configured in `oracle.toml`.

## oracle.toml

A sample configuration for oracle.toml is as follows:

```toml
# Default collection frequency; all configured Oracle instances will use this frequency by default
# If an instance requires a different collection frequency, adjust it using interval_times in the instance configuration
# The final collection frequency for each instance = interval * interval_times
# If interval is not configured here, the global interval in Categraf's configuration will be used (default is 15 seconds)
# Unit is seconds, so the default is to collect monitoring data every 15 seconds
interval = 15

# Configuration for the first Oracle instance, enclosed in [[instances]]
# [[instances]] uses double brackets, which in TOML represent an array
# Multiple [[instances]] blocks can be configured, meaning multiple Oracle instances can be set up
[[instances]]
address = "10.1.2.3:1521/orcl"
username = "monitor"
password = "123456"
is_sys_dba = false
is_sys_oper = false
disable_connection_pool = false
max_open_connections = 5
# The final collection frequency for this instance is interval * interval_times
interval_times = 1
# Additional dimension labels can be attached to this instance, which will be added to the monitoring data of the current instance
labels = { region="cloud" }

# The metrics configuration section under instances specifies the monitoring data to be collected for the current instance
# Note that this metrics configuration section is specific to the current instance; other instances will not execute these SQL statements
[[instances.metrics]]
mesurement = "sessions"
label_fields = [ "status", "type" ]
metric_fields = [ "value" ]
timeout = "3s"
request = '''
SELECT status, type, COUNT(*) as value FROM v$session GROUP BY status, type
'''

[[instances]]
address = "192.168.10.10:1521/orcl"
username = "monitor"
password = "123456"
is_sys_dba = false
is_sys_oper = false
disable_connection_pool = false
max_open_connections = 5
labels = { region="local" }

# The second instance has no corresponding instances.metrics configuration section, indicating no instance-specific collection SQL
# That is: the second instance will only execute the general SQL configured in metric.toml
```

Principle of Oracle monitoring data collection: Periodically execute SQL, convert the returned results into Prometheus time-series data format, and send them to the server. The result of SQL execution is a two-dimensional table with multiple rows and columns. We need to configure Categraf to specify which columns serve as labels for the time-series data and which serve as metric values.

- mesurement: A custom metric prefix
- request: The SQL statement for querying monitoring data
- label_fields: Columns from the SQL result that will be used as labels for the time-series data
- metric_fields: Columns from the SQL result that will be used as metric values
- field_to_append: Whether to append the content of a column to the monitoring metric name as a suffix
- timeout: Timeout duration for SQL execution
- ignore_zero_result: Whether to ignore rows with a value of 0 in the query results. If not ignored (set to false) and no data is found, an error log will be printed. If ignored (set to true), no error log will be printed when no data is found.

## metric.toml

This file configures some commonly used SQL statements for Oracle monitoring data collection. Categraf will execute these SQL statements regularly to obtain monitoring data from all Oracle instances. The specific meanings and functions of these SQL statements are likely more familiar to Oracle DBAs. Oracle DBAs are welcome to write articles explaining these SQL statements and their uses. You can submit a PR with a link to your article on this page to benefit more people.