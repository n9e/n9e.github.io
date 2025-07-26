---
title: "Plugin Scripts"
description: "This article introduces the mechanism of custom monitoring plugin scripts in Categraf. Plugin scripts can be written in Shell, Python, Go, etc. Simply tell Categraf the path of the executable file, and Categraf will periodically execute these scripts at the configured time interval and collect the output as monitoring data."
date: 2025-07-26T17:14:04.903+08:00
lastmod: 2025-07-26T17:14:04.903+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5110
toc: true
---

> For a monitoring system, the strength of basic functions is indeed crucial, but how to implement them in different scenarios is even more critical. In the "Monitoring Practice" chapter, we collect various monitoring practice experiences, which will be categorized by different components. If you have good practical experience with a certain component, you are welcome to submit a PR and attach the link of your article to the corresponding component directory.

Although Categraf has many built-in collection plugins, there are always some scenarios where custom monitoring data collection is required. In such cases, you can consider using Categraf's input.exec plugin. This plugin can execute user-specified scripts (which can be Shell, Python, Perl scripts, or binary files of Go, C++, as long as they are executable files), then capture the stdout of the script and parse it into monitoring data.

- [EXEC Plugin User Documentation](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/exec/)

Some community users have previously provided some plugin script examples for reference: [Categraf Exec Plugin Script Examples](https://github.com/flashcatcloud/categraf/tree/main/inputs/exec/scripts). Everyone is welcome to continue submitting examples.