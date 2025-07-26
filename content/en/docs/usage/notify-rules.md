---
title: "Notification Rules"
description: "Nightingale monitoring supports notification rules, which allow configuration of notification methods, recipients, etc. When an alarm event is triggered, Nightingale will send notifications according to the notification rules. For example, high-level alarms can be sent via phone calls, SMS, or DingTalk, while low-level alarms can be sent via email."
date: 2025-07-26T17:16:57.828+08:00
lastmod: 2025-07-26T17:16:57.828+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 1400
toc: true
---

Alarm rules are responsible for generating alarm events, and notification rules are responsible for sending out alarms. Different alarms can use different notification media. For example, high-level alarms can be sent via phone calls, SMS, or DingTalk, while low-level alarms can be sent via email.

## Design Purpose

Older versions of Nightingale did not have the concept of notification rules. Notification media and recipients were directly configured in alarm rules. Although this was intuitive, it lacked flexibility, with the following issues:

- When suppression was enabled in alarm rules, the notification media were still hard-coded. In previous versions, enabling suppression rules usually meant that different thresholds required different levels, and thus different notification media. For example, Critical-level alarms might use phone calls or SMS, while Info-level alarms used Email. However, in previous versions, the notification media were fixed and could not vary by level.
- Integrating notification methods like phone calls and SMS was inconvenient. This version provides universal HTTP and script-based sending methods, with customizable HTTP parameters, headers, and bodies, making it easier to integrate different notification media.
- Previous notification methods were tightly coupled with alarm rules, making modifications cumbersome. The new version introduces the concept of "notification rules." Alarm rules are directly associated with notification rules, and the specific sending methods are defined in the notification rules. This decouples alarm rules from notification rules. Multiple alarm rules can be associated with a single notification rule, so changing the notification method only requires modifying the notification rule, affecting all associated alarm rules.
- Message templates in previous versions were rigid, with each type of notification medium limited to a fixed template. The new version supports custom message templates, and each notification medium can be associated with different templates. For example, the DBA team and Big Data team can both use DingTalk robots for alarms but with different message templates.

## Logic Diagram

The overall process for sending alarm events in the new version is as follows:

<img src="/img/usage/notify-rules/01.png" alt="Interaction logic between notification rules and alarm rules"/>

In previous versions, notification media and recipients were directly configured in alarm rules, leading to tight coupling. In the new version, alarm rules are associated with notification rules, and the sending details are defined in the notification rules. This decoupling allows multiple alarm rules to reference a single notification rule, simplifying updates to notification methods.

## Configuration Instructions

Notification rules support different notification media and can define the scope of application for each medium. For example, phone calls may only apply to Critical alarms, while Email may apply to Critical, Warning, and Info alarms. Below is a sample configuration of a notification rule:

<img src="/img/usage/notify-rules/02.png" alt="Sample notification rule configuration"/>

We provide some built-in notification media for out-of-the-box use:

<img src="/img/usage/notify-rules/03.png" alt="List of built-in media"/>

When configuring a notification medium, the "Variable Configuration" may be confusing. Consider this scenario: Both the DBA team and BigData team want to use WeCom for alarms but with different WeCom robots (i.e., similar Webhook URLs but different Key parameters in the URL, where each Key represents a different robot). How to handle this?

In Nightingale's design, we avoid creating two separate notification media. Instead, we use a single WeCom medium that supports parameters. DBA team members configure the WeCom medium in their notification rules and provide their robot's Key, while BigData team members do the same with their Key. This way, one medium supports multiple robots.

To enable parameter support for a notification medium, configure variables in the medium's settings. The built-in WeCom medium, for example, has two parameters: Key (WeCom robot Key) and Bot Name (a custom name for easy reference, similar to a note). These parameters can then be referenced in the medium's HTTP configuration:

<img src="/img/usage/notify-rules/04.png" alt="Notification medium variable definition"/>

This scenario is straightforward: the medium retrieves the Key provided by the user. For more complex scenarios, such as sending SMS, how should medium parameters be defined? If we directly define a Phone parameter and require users to enter phone numbers manually in notification rules, it would be cumbersome. Additionally, if a user's contact information changes, they would need to update both their profile and the notification rule, which is inefficient. Since phone numbers are already stored in user profiles, we can link the two.

For such scenarios, medium parameters can be derived from user Profile information. This requires referencing user Profile data in the medium's variable configuration. For example:

<img src="/img/usage/notify-rules/05.png" alt="Notification medium managing user Profile"/>

In the medium variables, selecting "Phone" as the contact method enables the following functionality:

- In the notification rule, the system recognizes that the medium requires phone numbers from user profiles, allowing selection of contacts or teams instead of manual entry of phone numbers.
- In the HTTP request body or query string, the magic variable `{{ $sendto }}` can be referenced, representing the recipient's phone number. This allows the medium to send alarms to the correct recipient. The `{{ $sendto }}` design is inspired by Zabbix, so users familiar with Zabbix will find it intuitive.

## Configuration Examples

- [Integrating DingTalk Alerts](https://flashcat.cloud/blog/n9e-v8-notify-dingtalk/)
- [Integrating WeCom Alerts](https://flashcat.cloud/blog/n9e-v8-notify-wecom/)
- [Integrating Feishu Alerts](https://flashcat.cloud/blog/n9e-v8-notify-feishu/)
- [Integrating DingTalk Alerts: How to Configure Mentions](https://flashcat.cloud/blog/n9e-v8-notify-dingtalk-ats/)
- [Integrating DingTalk, Feishu, and WeCom Notifications](https://flashcat.cloud/blog/n9e-v8-notify-practice/)
- [Integrating Alibaba Cloud SMS](https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/notification/ali-sms/)

Additionally, a video tutorial on integrating Feishu alerts is available on the WeChat Channels: SRETALK. You can search for it to watch.

## Email Alarm Configuration

The links above cover common IM notification media. Here, we补充 (add) instructions for configuring email alarms. To send alarm emails, three key configurations are required:

1. SMTP server settings
2. Recipients' email addresses in their profiles
3. Email notification message templates

### 1. SMTP Server Configuration

Navigate to the `Media types` menu, find the built-in Email medium, and edit it to enter SMTP server details. An example configuration is shown below:

<img src="/img/usage/notify-rules/06.png" alt="Email notification medium configuration"/>

### 2. Users Configure Their Email Addresses in Personal Profiles

Click the avatar in the top-right corner to access the personal information page and enter the email address for receiving alarms.

### 3. Configure Notification Rules

For testing, create a new notification rule (or modify an existing one to add the email medium) that applies to all alarm levels, ensuring every alarm triggers an email notification. Example configuration:

<img src="/img/usage/notify-rules/07.png" alt="Email notification rule configuration"/>

The example above sends notifications to an individual, but you can also select a team. Click "Test Notification" and choose a historical alarm event to test email delivery. Finally, associate this notification rule with your alarm rules.

### 4. Email Notification Message Template

In the `Message templates` menu, find the `Email` template, which includes two variables:

- content: Email body content
- subject: Email subject

Both fields use Go template syntax, allowing customization of email content and subject as needed.