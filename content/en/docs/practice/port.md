---
title: "Port"
description: "This article introduces practical experience in port monitoring, including port monitoring for TCP/UDP protocols and HTTP protocol. Use Categraf's net_response and http_response plugins to implement port monitoring, and provides links to related dashboards."
date: 2025-07-26T17:15:10.889+08:00
lastmod: 2025-07-26T17:15:10.889+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5102
toc: true
---

> For monitoring systems, the strength of basic functions is indeed crucial, but how to implement them in different scenarios is even more critical. In the "Monitoring Practice" chapter, we collect various monitoring practice experiences, which will be categorized by different components. If you have good practical experience with a certain component, please submit a PR and attach your article link to the corresponding component directory.

Port monitoring is a typical method for process liveness detection. Compared with counting the number of processes, port monitoring is more reliable because processes may sometimes hang, resulting in normal process count statistics but unresponsive ports.

Generally speaking, port detection is divided into three protocols:

- TCP protocol
- UDP protocol
- HTTP protocol

Depending on the port protocol type that the service listens to, different detection methods are used.

## TCP/UDP Protocols

Port monitoring for TCP/UDP protocols is suitable for RPC services and can be implemented using Categraf's `net_response` plugin.

- [Categraf net_response Plugin Description](https://github.com/flashcatcloud/categraf/blob/main/inputs/net_response/README.md)

The most important metric to focus on here is: `net_response_result_code`. If the value of this metric is 0, it indicates everything is normal; if it is non-zero, it indicates an exception, and different values represent different types of exceptions.

- 0: Success
- 1: Timeout
- 2: ConnectionFailed
- 3: ReadFailed
- 4: StringMismatch

Relevant dashboards can be found in Nightingale's `Integrations - Components`.

## HTTP Protocol

The detection of the HTTP protocol is similar to that of the TCP/UDP protocols, and Categraf also provides the `http_response` plugin for implementation. Compared with TCP/UDP protocols, port monitoring for the HTTP protocol can go a step further. In addition to detecting whether the port is available, it can also detect whether the HTTP response content (returned status code, returned Response body) meets expectations. For HTTPS sites, it can also detect the certificate expiration time.

- [Categraf http_response Plugin Description](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/http-response/)

The metric used for alarming is http_response_result_code. As long as this metric is 0, it is normal; if it is non-zero, it is abnormal, and different values represent different meanings:

```
Success          = 0
ConnectionFailed = 1
Timeout          = 2
DNSError         = 3
AddressError     = 4
BodyMismatch     = 5
CodeMismatch     = 6
```

`http_response_cert_expire_timestamp` is the timestamp of the certificate expiration time. `http_response_cert_expire_timestamp - time()` indicates how long it will be until the certificate expires, in seconds.

Relevant dashboards can be found in Nightingale's `Integrations - Components`.