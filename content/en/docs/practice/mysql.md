---
title: "MySQL"
description: "This article introduces how to monitor MySQL. As one of the most commonly used databases in China, MySQL is widely used and has a lot of related materials. Monitoring MySQL involves two aspects: one is monitoring MySQL's performance data, and the other is monitoring MySQL's business data."
date: 2025-07-26T17:14:27.191+08:00
lastmod: 2025-07-26T17:14:27.191+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5200
toc: true
---

> For monitoring systems, the strength of basic functions is indeed crucial, but how to implement them in different scenarios is even more critical. In the "Monitoring Practice" chapter, we collect various monitoring practice experiences, which will be categorized by different components. If you have good practical experience with a certain component, you are welcome to submit a PR and attach the link of your article to the corresponding component directory.

- [Getting Started Tutorial for Monitoring MySQL with Categraf](https://mp.weixin.qq.com/s/v9us3-Dkafa_UR42WxReDg)
- [Building MySQL Monitoring According to the Guidance of Nightingale Template Center](https://mp.weixin.qq.com/s/NNSNc7TOo2y6tRy10zgYow)
- [How to Detect and Handle MySQL Master-Slave Delay Issues](https://mp.weixin.qq.com/s/Ca0qleA9XFqf1y3BiW8PfQ)
- [Explanation of MySQL Monitoring Principles](https://mp.weixin.qq.com/s/v72AZf9-yUXblbQxAck7dw)
- [Monitoring MySQL with Exporter](https://mp.weixin.qq.com/s/gyqXh1ZGnoOC6jg6xOp-IA)
- [Solving the max_prepared_stmt_count Problem in MySQL](https://mp.weixin.qq.com/s/YkzDo81OqGoDhbXLqQsvHw)

In addition to monitoring MySQL's performance data, we can also customize SQL to monitor data in MySQL (which can be done through Categraf's [mysql](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/mysql/) plugin). This usually has two purposes:

- Extending performance monitoring metrics. If the default performance monitoring data is insufficient, this method can be used for extension.
- Monitoring business data. This scenario is extremely extensive, such as monitoring order data, user data, etc. This scenario is easily overlooked but can sometimes have surprising effects.