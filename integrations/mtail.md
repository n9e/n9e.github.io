---
title: "Turn logs into Nightingale metrics with mtail"
sidebar_label: "Mtail"
description: "Categraf embeds mtail: extract counters, gauges and histograms from log files with regular expressions and expressions, without shipping the logs to a log system first."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Mtail
toc_max_heading_level: 2
mdx:
  format: md
---

The mtail input turns logs into metrics. Input is a log file, output is a set of counters, gauges and histograms defined in mtail syntax; underneath it is Go regular expressions plus expression evaluation. It suits cases such as status-code distribution from Nginx access logs or error counts from application logs, with no need to ship the logs into Elasticsearch or Loki first.

Each `[[instances]]` block points at a set of `progs` (mtail program files or a directory) and the log paths to follow. Give different instances different progs, or distinguish them with `labels`, or their metrics will collide.

## What's in the template

- **Categraf collector config**: `input.mtail`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.mtail/mtail.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.mtail started` once the plugin is loaded.

   ```toml
   [[instances]]
   # progs = "/path/to/prog1" # prog dir1
   # logs = ["/path/to/a.log", "path/to/b.log"]
   # override_timezone = "Asia/Shanghai"
   # emit_metric_timestamp = "true" #string type

   # [[instances]]
   # progs = "/path/to/prog2" # prog dir2
   # logs = ["/path/to/logdir/"]
   # override_timezone = "Asia/Shanghai"
   # emit_metric_timestamp = "true" # string type
   ```

## Related

- [Mtail template source](https://github.com/ccfos/nightingale/tree/main/integrations/Mtail): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
