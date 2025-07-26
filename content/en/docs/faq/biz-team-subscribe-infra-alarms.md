---
title: "Should upper-layer businesses receive alarms from underlying infrastructure?"
description: "I am a DEV or SRE of a business application. My application depends on underlying services and infrastructure, such as basic networks, Kubernetes, MySQL, and cash register services. Should I receive alarms if these basic services have problems? There is a subscription rule in Nightingale. Is it designed for this purpose?"
date: 2025-07-26T17:13:17.223+08:00
lastmod: 2025-07-26T17:13:17.223+08:00
draft: false
images: []
menu:
  docs:
    parent: "faq"
weight: 25200
toc: true
---

A friend asked: **I am a DEV or SRE of a business application. My application depends on underlying services and infrastructure, such as basic networks, Kubernetes, MySQL, and cash register services. Should I receive alarms if these basic services have problems? There is a subscription rule in Nightingale. Is it designed for this purpose?**

This article presents the author's personal understanding, for reference only.

First, please read the previous article "[Should high CPU load trigger an alarm?](/docs/faq/cpu-alerting/)", which mentions a point: Only actionable alarm rules are meaningful!

So, it depends on your situation:

**1.** If your service is deployed in a single computer room, and you can do nothing about problems with these infrastructure and services but passively wait for recovery (i.e., you have no SOP), then receiving these alarms is of little significance.

The recommended approach at this time is: Create a visualization page, put the key **SLI** of the infrastructure and services you depend on, so that you can understand the health status of each infrastructure and service by viewing the UI trend chart. Facebook has an internal product called SLICK, which follows a similar logic. Our startup's [**Flashcat**](https://flashcat.cloud/product/flashcat-enterprise/) has a feature called "Fire Fighting Chart" with a similar effect. This is a common practice.

**2.** If you have an SOP, such as the ability to switch traffic, then subscribing to such alarms is meaningful.

However, you may not understand the key indicators of many underlying services, so it is better to have a specification. For example, when configuring alarm rules, the person in charge of each underlying service, if they think a certain alarm rule is very important and the corresponding alarm will affect upper-layer services, can mark that rule with a special label. For example, `advertise=mysql` indicates all MySQL-related alarms that need to be known, and `advertise=k8s` indicates all Kubernetes-related alarms that need to be known. Then, DEVs and SREs of upper-layer applications can subscribe to such labels to be informed of relevant alarms.

**In addition**

For services like MySQL and cash registers, a better way than subscribing to their SLI alarms is to bury points in upper-layer applications yourself, mainly collecting the number of requests, failures, and delays.

Because from MySQL's perspective, its SLI indicators are for the entire instance, while if you bury points in upper-layer applications, the indicators can be refined to be related to this service, or even to specific business scenarios of this service, making it more precise.