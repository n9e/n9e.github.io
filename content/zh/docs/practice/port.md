---
title: "端口监控"
description: "本文介绍了端口监控的实践经验，包括 TCP/UDP 协议和 HTTP 协议的端口监控。使用 Categraf 的 net_response 和 http_response 插件来实现端口监控，并提供了相关的仪表盘链接。"
date: 2025-06-09T09:58:02+08:00
lastmod: 2025-06-09T09:58:02+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5102
toc: true
---

> 对于监控系统，基础功能的强弱确实非常关键，但是如何在不同的场景落地实践，则更为关键。在《监控实践》章节，搜罗各类监控实践经验，会以不同的组件分门别类，您如果对某个组件有好的实践经验，欢迎提 PR，把您的文章链接附到对应的组件目录下。

端口监控，是进程存活性探测的典型方式，相比统计进程数量，端口监控更为靠谱，因为进程有时会 hang 住，导致进程数量统计正常，但是端口无法正常响应。

一般来说，端口探测分三种协议：

- TCP 协议
- UDP 协议
- HTTP 协议

依据服务监听的端口协议类型不同，使用的探测方式也不同。

## TCP/UDP 协议

TCP/UDP 协议的端口监控，适合针对 RPC 类的服务，可以使用 Categraf 的 `net_response` 插件来实现。

- [Categraf net_response 插件说明](https://github.com/flashcatcloud/categraf/blob/main/inputs/net_response/README.md)

这里最应该关注的指标是：`net_response_result_code`，如果这个指标的值是 0，表示一切正常，如果非 0 则表示异常，不同的值表示不同的异常类型。

- 0: Success
- 1: Timeout
- 2: ConnectionFailed
- 3: ReadFailed
- 4: StringMismatch

在夜莺的`集成中心-模板中心`可以找到相关的仪表盘。

## HTTP 协议

HTTP 协议的探测和 TCP/UDP 协议类似，Categraf 也提供了 `http_response` 插件来实现。相比 TCP/UDP 协议，HTTP 协议的端口监控可以更进一步，除了探测端口是否可用，还可以探测 HTTP 响应内容（返回的状态码、返回的 Response body）是否符合预期，如果是 HTTPS 站点，还可以探测证书过期时间。

- [Categraf http_response 插件说明](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/http-response/)

用于告警的指标是 http_response_result_code 只要这个指标是 0 就是正常的，如果这个指标非 0，就是异常的，不同的值代表不同的含义：

```
Success          = 0
ConnectionFailed = 1
Timeout          = 2
DNSError         = 3
AddressError     = 4
BodyMismatch     = 5
CodeMismatch     = 6
```

`http_response_cert_expire_timestamp` 是证书过期的时间戳，`http_response_cert_expire_timestamp - time()` 表示证书还有多久过期，单位是秒。

在夜莺的`集成中心-模板中心`可以找到相关的仪表盘。
