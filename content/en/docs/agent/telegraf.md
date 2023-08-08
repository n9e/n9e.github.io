---
title: "Telegraf"
description: "Use Telegraf as collector for Nightingale"
lead: ""
date: 2022-05-12T13:26:54+01:00
lastmod: 2022-05-12T13:26:54+01:00
draft: false
images: []
menu:
  docs:
    parent: "agent"
weight: 710
toc: true
---

## Introduction

[Telegraf](https://github.com/influxdata/telegraf) is an agent for collecting, processing, aggregating, and writing metrics. Based on a plugin system to enable developers in the community to easily add support for additional metric collection.

Telegraf supports multiple output plugins and we use opentsdb plugin to send metrics to Nightingale.

## Install

```bash
#!/bin/sh

version=1.20.4
tarball=telegraf-${version}_linux_amd64.tar.gz
wget https://dl.influxdata.com/telegraf/releases/$tarball
tar xzvf $tarball

mkdir -p /opt/telegraf
cp -far telegraf-${version}/usr/bin/telegraf /opt/telegraf

cat <<EOF > /opt/telegraf/telegraf.conf
[global_tags]

[agent]
  interval = "10s"
  round_interval = true
  metric_batch_size = 1000
  metric_buffer_limit = 10000
  collection_jitter = "0s"
  flush_interval = "10s"
  flush_jitter = "0s"
  precision = ""
  hostname = ""
  omit_hostname = false

[[outputs.opentsdb]]
  host = "http://127.0.0.1"
  port = 17000
  http_batch_size = 50
  http_path = "/opentsdb/put"
  debug = false
  separator = "_"

[[inputs.cpu]]
  percpu = true
  totalcpu = true
  collect_cpu_time = false
  report_active = true

[[inputs.disk]]
  ignore_fs = ["tmpfs", "devtmpfs", "devfs", "iso9660", "overlay", "aufs", "squashfs"]

[[inputs.diskio]]

[[inputs.kernel]]

[[inputs.mem]]

[[inputs.processes]]

[[inputs.system]]
  fielddrop = ["uptime_format"]

[[inputs.net]]
  ignore_protocol_stats = true

EOF

cat <<EOF > /etc/systemd/system/telegraf.service
[Unit]
Description="telegraf"
After=network.target

[Service]
Type=simple

ExecStart=/opt/telegraf/telegraf --config telegraf.conf
WorkingDirectory=/opt/telegraf

SuccessExitStatus=0
LimitNOFILE=65535
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=telegraf
KillMode=process
KillSignal=SIGQUIT
TimeoutStopSec=5
Restart=always


[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable telegraf
systemctl restart telegraf
systemctl status telegraf
```