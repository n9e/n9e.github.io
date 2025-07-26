---
title: "Global Callback is Deprecated, How to Handle Global Scenarios?"
description: "The new version of Nightingale has removed the global callback function, but some scenarios still require global callbacks. This article introduces how to use subscription rules to replace global callbacks."
date: 2025-07-26T17:13:46.431+08:00
lastmod: 2025-07-26T17:13:46.431+08:00
draft: false
images: []
menu:
  docs:
    parent: "faq"
weight: 25000
toc: true
---

It is planned to remove the global callback in the V9 version. If you are currently using the global callback function, you need to migrate to the new method as soon as possible. So, what method can be used to replace the global callback?

The answer is: **[Subscription Rules](/docs/usecase/subscribe/)** ( 👈 click to view usage instructions).

The menu entry for subscription rules is: `Monitors - Rules - Subscription Rules TAB`. Below is the interface for creating a subscription rule:

<img src="/img/faq/global-callback/01.png" alt="Global Subscription Rules" />

We can create a subscription rule and then subscribe to all alert events, that is, do not add filtering conditions and directly select all levels. In this way, any alert event will match this subscription rule. Note:

- The above image is from an older version, where the data source type still must be selected. Therefore, strictly speaking, the subscription rule in the above example is not for all alert events, but for all alert events of the Prometheus data source type.
- Future versions will be optimized, and the data source type will be made **non-mandatory**, meaning you can subscribe to alert events of all data source types.

Then, select a notification rule. In this way, all alert events can go through this notification rule. Compared with the previous global callback, there are two typical advantages:

- In subscription rules, you can set some filters, such as subscribing only to alert events of a certain data source type or a certain level.
- All alert events go through a unified notification rule. The notification rule can have an event processor Pipeline, and different notification media can be used. Different notification media can also have fine-grained filtering configurations, which is overall more flexible than the global callback.