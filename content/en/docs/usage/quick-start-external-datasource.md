---
title: "Quick Start(External Datasource)"
date: 2020-10-06T08:48:57+00:00
lastmod: 2020-10-06T08:48:57+00:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 100
toc: true
---

## Add datasource

We can add Prometheus, VictoriaMetrics, Thanos, ElasticSearch, Loki, etc. as data sources.

<img src="/images/usage/datasource-adding.png" />

## Query metrics

Go to the exploration page to query metrics. If data can be queried, it indicates that the data source configuration is correct.

<img src="/images/usage/metrics-explorer.png" />

## Add alerting rules

Want to add alerting rules? Go to the alerting page to add alerting rules.

<img src="/images/usage/alerting-rule-adding.png" />

## Query events

If everything is normal, an alarm event will be generated shortly. Go to the active event page to view the alarm event.

<img src="/images/usage/query-active-events.png" />

## Using Notification Media

Nightingale supports Slack, mm, Dingtalk, Wecom, etc. as notification media. 

<img src="/images/usage/notify-media.png" />
<br>
<br>

You can perform the test by following these steps:

1. Enable email channel
2. Configure email attribute in profile page
3. Check email channel in alerting rule
4. Configure event receiver in alerting rule
