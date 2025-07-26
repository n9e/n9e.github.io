---
title: "Redis"
description: "There are various methods to collect Redis monitoring data, such as using tools like Categraf, Redis-Exporter, and Cprobe. The principle is similar: connecting to the Redis instance and executing commands like `info` to obtain monitoring data."
date: 2025-07-26T17:15:33.458+08:00
lastmod: 2025-07-26T17:15:33.458+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5300
toc: true
---

> For a monitoring system, the strength of basic functions is indeed crucial, but how to implement them in different scenarios is even more important. In the "Monitoring Practice" chapter, we collect various monitoring practice experiences, categorized by different components. If you have good practical experience with a certain component, please submit a PR and attach the link to your article in the corresponding component directory.

- [Collect Redis Monitoring Data with Categraf](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/redis/)
- [Monitor MySQL, Redis, MongoDB, Oracle, Postgres, etc. with Cprobe](https://mp.weixin.qq.com/s/6dEgijH-nWddbK8yCEUUOA)

## Principle of Redis Monitoring Data Collection

Whether using Categraf or Redis-Exporter to collect Redis monitoring data, the principle is similar: connect to Redis using information such as the Redis connection address, username, and password, and execute commands like `info` to obtain monitoring data.

## How to Connect Redis-Exporter

Some users use Categraf to collect machine metrics, process metrics, and custom plugins, but do not use Categraf to collect Redis monitoring data; instead, they use Redis-Exporter. Then they are confused: how to connect the data collected by Redis-Exporter to Nightingale?

There are two methods:

- Configure Scrape rules directly in your time-series database to scrape data from Redis-Exporter
- Use the input.prometheus plugin of Categraf to scrape data from Redis-Exporter
