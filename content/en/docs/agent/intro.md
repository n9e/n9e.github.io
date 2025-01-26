---
title: "Pre explanation"
description: ""
lead: ""
date: 2025-01-26T10:55:54+08:00
lastmod: 2025-01-26T10:55:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "agent"
weight: 100
toc: true
---

Nightingale is an alarm engine, which does not need to be integrated with the collector, but directly connects to various data sources for query alarms.

That is to say, if you have collected various monitoring data and stored it in the time series database, you can configure the time series database as a data source in Nightingale, and Nightingale can directly query the data in the time series database. There is no need to use various collectors mentioned in this chapter.

However, many new users have not built their own collection capabilities, so we provide some collector docking solutions to facilitate users to get started quickly. However, Nightingale still does not provide storage capabilities. These collectors collect data and push it to Nightingale, and Nightingale then forwards the data to the time series database.

In the Nightingale configuration file `etc/config.toml`, there is a `[[Pushgw.Writers]]` section, which is used to configure the address of the time series database. After receiving the data, Nightingale forwards the data to these addresses.