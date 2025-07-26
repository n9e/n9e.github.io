---
title: "Should 'High CPU Load' Trigger an Alert?"
description: "Should high CPU load on a server trigger an alert? This question has puzzled many practitioners in operation and maintenance monitoring. This article attempts to provide some suggestions."
date: 2025-07-26T17:09:50.320+08:00
lastmod: 2025-07-26T17:09:50.320+08:00
draft: false
images: []
menu:
  docs:
    parent: "faq"
weight: 25100
toc: true
---

Should high CPU load trigger an alert?

- If we don't set an alert, we're afraid of being blamed for missing alerts when problems occur.
- If we do set an alert, there seems to be too much noise, and engineers automatically ignore them.

How awkward...

The adult world is not black and white. To discuss this seriously, we need to add many qualifiers. To avoid ambiguity and align understanding, let me first introduce some prerequisite knowledge (principles).

## Prerequisite Knowledge (Principles)

Alerts should have different urgency levels. Some companies even stipulate 6 levels (probably their own engineers can't sort them out clearly...). Usually, 3 levels are sufficient:

- Critical: Business has been affected and requires immediate handling. Usually, multiple highly intrusive notification channels are used to send alert messages together, such as phone calls + SMS + IM + email. For example, a significant drop in e-commerce order volume is an emergency alert.
- Warning: No immediate handling is needed. A work order can be automatically created for gradual processing. However, it must be handled; otherwise, it may lead to major failures. Alerts are usually sent, but with less intrusive notification channels. For example, the disk usage of an important machine has reached 95% and may be full in another 24 hours; or a domain certificate will expire in 3 days.
- Info: Only generates an alert event without sending a notification. It is equivalent to extracting some slightly important information from massive metrics. If a failure occurs, this information serves as clues for troubleshooting. For example, a Pod is evicted and migrated; or a user has too many failed login attempts.

Overall, they can be divided into two categories:

- Need to be handled: Critical, Warning
- No need to be handled: Info

Among them, Info is not critical and can be configured or not. It can definitely wait until your monitoring and fault location system is more refined. We focus on the first two levels: Critical and Warning. These two levels have one thing in common: they both NEED TO BE HANDLED! In the English world, this is usually called "actionable" (which feels very accurate).

So, should we configure alerts for high CPU load?

## Logic for Formulating CPU Alerts

- If there are follow-up actions after a CPU alert is triggered, it should be configured. Even if the action is logging into the machine to take a look and writing a few follow-up conclusions, it counts as an action.
- If there are no follow-up actions, there's no need to configure it. For example, if you see the alert, get used to it, and directly ignore it, that's not an action, and the alert shouldn't be configured. Alternatively, it can be configured as an Info level, only generating an alert event without sending a notification.

In fact, this logic applies to all alert rule configurations. All alert rules should be actionable. Therefore, in theory, each alert rule should correspond to an SOP (Standard Operating Procedure). Both Prometheus and Nightingale's alert rules have an Annotations field. Typical fields that should be placed in Annotations are SOP URL and Dashboard URL.

Many people reading this may think that this requires a lot of work. Each alert rule needs to have an SOP sorted out (SOPs usually differ between companies; some SOPs for middleware and databases may be the same). Previously, they just found some alert rules online, imported them, and thought that was it, not expecting there to be more work!

In fact, compared to building a monitoring system, this is the more valuable part!