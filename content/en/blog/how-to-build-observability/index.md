---
title: "Five steps to build observability"
description: "Building an observability system can be a daunting task. This article outlines a simple framework to help you get started."
lead: "Building an observability system can be a daunting task. This article outlines a simple framework to help you get started."
date: 2025-07-30T10:42:47+08:00
lastmod: 2025-07-30T10:42:47+08:00
draft: false
weight: 50
# images: ["say-hello-to-doks.png"]
contributors: ["Ulric Qin"]
---

I’ve been working in monitoring for 11 years and spent 4 years building a startup in the observability space. Through countless conversations with clients, I’ve noticed that many enterprises want to build an observability system but struggle to find a clear path. I’ve summarized the entire process into a simple framework, hoping to offer you some inspiration.

Building an observability system, in my view, involves five key steps(CECRG):
- Clarify the Business
- Establish Standards
- Collect Data
- Reveal Patterns
- Gain Insights

Let me break them down one by one. The field of observability is vast and complex, so this article focuses more on the mindset rather than hands-on operations.


## Clarify the Business
First, you need to map out your business clearly. Start by identifying your core business goals and metrics—often called North Star Metrics. Examples include:
- For e-commerce systems: order volume, order value, etc.
- For games: number of online players, transaction value, etc.
- For video streaming: number of Play button clicks, etc.

Simply put, these are the metrics that matter at the leadership (company-wide) level. If they fluctuate abnormally (e.g., a sudden drop), it could signal a major business failure, requiring immediate intervention from SREs and developers.

North Star Metrics are usually outcome-oriented. For more granularity, you should break them down into process metrics. Take e-commerce order volume, for instance—we need to analyze which key links affect it and which process metrics can measure the health of the customer’s main journey (placing an order). These might include:
- Number of customer logins and login failures
- Frequency of product views and their response speed
- Number of cart additions, success rates, and latency
- Number of checkouts, checkout failures, and checkout latency
- And so on

Once you’ve clarified these key outcome and process metrics, the next step is to identify, from a technical perspective, which systems and modules impact these metrics. These systems should be classified as P1-level (priority 1) and receive focused protection. Their SLI and SLO data must be managed with extra care.


## Establish Standards
If your company is small—with fewer than 20 microservices and just a few dozen servers—the lack of standards might not feel like a big issue. But when you have thousands of microservices and tens of thousands of servers, the difference becomes glaring. Good standards let you scale operations and reuse knowledge across the board.

From an observability standpoint, areas that need standardization include:
- A unified system for metrics, logs, and trace tracking
- Log formatting rules
- Tags for all observability data
- Which observability data microservices should expose and how
- A unified way to collect and present change events
- Unified sorting, presentation, and alerting for SLI and SLO data
- Principles for formulating alert rules and assignment protocols
- Data protocol specifications
- And more

The earlier you establish these standards, the smoother things will be later. Senior architects, with experience in cross-cutting system design, often prioritize observability early on—because just like system availability and robustness, observability is a critical feature a system must have.


## Collect Data
The collection of various observability data (metrics, logs, traces, events, profiling) must follow the standards set earlier. You also need to consider costs and the future value of the data. For common middleware and databases, industry best practices often exist for which metrics and logs to collect and what to focus on. However, in-house developed microservices are a bit trickier. For these, you need to:
- Map out your business to determine which data to expose for easier future troubleshooting
- Drive instrumentation from the top down—otherwise, it will be hard to implement


## Reveal Patterns
Here, "patterns" refer to data patterns. Humans can’t sift through massive amounts of scattered observability data one by one, making it difficult to extract valuable insights. We need to organize data effectively to uncover patterns. Examples include:
- Plotting metrics on line charts to identify trends, min/max values, and sudden changes—this is a classic way to extract patterns from data
- Using clustering algorithms to identify log patterns in large datasets (e.g., distilling 10,000 logs into 20 patterns) to make analysis easier
- Aggregating alert events by tags—usually by alert rule title, or by region, severity, env, service, etc.
- Overlaying recent change events with key alerts on a timeline to easily analyze correlations between alerts and changes
- Aggregating microservices into subsystems and then into larger systems, so that when a failure occurs, you can quickly identify which systems are affected and confirm the scope of impact
- And so on

Tools like Grafana and Flashcat are powerful allies here, helping users quickly spot data patterns.


## Gain Insights
The biggest use case for an observability system is fault localization, which in turn enables loss prevention. The ultimate insight we need to derive from data patterns is the "basis for loss prevention." Users typically build various dashboards to analyze data patterns, synthesize findings, and ultimately arrive at that "basis."

For example, if users experience high latency when accessing an e-commerce app, we might analyze:
- Capacity utilization data
- Change records
- Health status of dependent services
- Underlying network conditions
- And more

By analyzing these patterns, we verify potential issues in each area. Combining conclusions from multiple angles helps pinpoint the root cause of the failure—and once you know the cause, you know how to stop the loss.


## Summary
This article outlines the five-step approach to building an observability system. It’s just an overview, but I hope it helps.


> <span style="color: #999;">Author: Ulric Qin, with 11 years in the monitoring field. He is the founder of [Nightingale](https://github.com/ccfos/nightingale), and currently co-founder of [Flashduty](https://console.flashcat.cloud/), working on his startup journey.</span>
