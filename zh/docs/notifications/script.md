# 脚本媒介

把事件交给你自己的程序：脚本怎么保存和执行、stdin 里收到什么、成功和失败怎么记录。

最后校对于 2026-10-10

这页办完你会得到：通知规则命中的每个事件，都交给一个你自己写的程序处理—— 调内部短信网关、写消息队列，或者任何 HTTP 回调做不到的事。

只有 [Callback](https://n9e.github.io/zh/zh/docs/notifications/callback.md) 不够用时才用它。脚本**跑在告警引擎所在的机器上、以引擎进程的用户身份运行**， 能力更强，也更容易出错。

## 1. 新建媒介[​](#1-新建媒介 "1. 新建媒介的直接链接")

**告警通知 → 通知媒介 → 新增**，在类型面板里选 **Script**。

| 字段                | 说明                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 使用脚本 / 使用路径 | 提供程序的两种方式，见下文                                                                                                              |
| 超时时间            | 毫秒，默认 5000。超时直接杀进程                                                                                                         |
| 联系方式            | 在 **变量配置** 里：从规则选中的用户和团队身上收集哪个联系方式字段，见[联系方式](https://n9e.github.io/zh/zh/docs/security/contacts.md) |
| 自定义参数          | 也在 **变量配置** 里：通知规则里会出现的输入框，脚本从 `params` 里读                                                                    |

### 使用脚本：直接贴内容[​](#使用脚本直接贴内容 "使用脚本：直接贴内容的直接链接")

内容跟着媒介一起保存。第一次执行时，引擎把它写成**引擎工作目录下**一个叫 `.notify_script_<媒介 ID>` 的文件，加上可执行权限再运行。内容没变就不会重写这个文件。

这个文件是被直接执行的，不经过 shell，所以**第一行必须是 shebang**：

```
#!/usr/bin/env python3
```

不写的话每次都失败，报 `exec format error`。shebang 指定的解释器得装在引擎所在的机器上。

### 使用路径：指向一个已有文件[​](#使用路径指向一个已有文件 "使用路径：指向一个已有文件的直接链接")

引擎直接执行这个路径上的文件。用绝对路径；相对路径会按引擎的工作目录来解析。 这个文件**在每台跑告警引擎的机器上**都得存在且可执行——`n9e` 本身，以及每个 `n9e-edge` 或独立部署的告警引擎——因为通知是由评估这条规则的那个引擎发出去的。

## 2. 脚本收到什么[​](#2-脚本收到什么 "2. 脚本收到什么的直接链接")

命令行参数是空的。所有内容都在 **stdin 里，是一个 JSON 对象**：

| 键        | 内容                                                 |
| --------- | ---------------------------------------------------- |
| `event`   | 这次发送的第一个事件                                 |
| `events`  | 这次发送的全部事件，数组                             |
| `tpl`     | 规则里选的消息模板渲染后的结果，每个模板字段一个 key |
| `params`  | 通知规则里填的自定义参数                             |
| `sendtos` | 按所选联系方式取到的接收人地址，数组                 |

事件字段和历史告警表一致，见[通知模板变量](https://n9e.github.io/zh/zh/docs/reference/notification-variables.md)。 没填所选联系方式的用户，已经从 `sendtos` 里去掉了。

一个把每个事件转发给内部网关的最小脚本：

```
#!/usr/bin/env python3

import json, sys, urllib.request



data = json.load(sys.stdin)

for ev in data["events"]:

    body = json.dumps({

        "to": data["sendtos"],

        "title": ev["rule_name"],

        "severity": ev["severity"],

        "recovered": ev["is_recovered"],

        "text": data["tpl"].get("content", ""),

    }).encode()

    req = urllib.request.Request(

        "http://sms-gw.internal/send", data=body,

        headers={"Content-Type": "application/json"})

    urllib.request.urlopen(req, timeout=3)



print("sent", len(data["events"]))
```

想看一眼真实输入，第一次运行时把 `sys.stdin.read()` 写到一个文件里就行。

## 3. 一次运行怎么判定[​](#3-一次运行怎么判定 "3. ��一次运行怎么判定的直接链接")

| 结果       | 记录为                                          |
| ---------- | ----------------------------------------------- |
| 退出码 0   | 成功                                            |
| 退出码非 0 | 失败，`failed to execute script: exit status N` |
| 超时       | 失败，`timeout and killed process`              |

stdout 和 stderr 合在一起收集，**前 512 字节**作为响应内容写进通知记录， 所以打印一行简短的状态，别整段输出。引擎日志里每次运行还会打一条 `event_script_notify_result`，带完整输出和当时的 stdin。

脚本媒介**不重试**，也不排队：每次发送就地跑一次。目标可能偶发失败的话，在脚本里自己重试。

## 4. 测试[​](#4-测试 "4. 测试的直接链接")

**脚本媒介必须先保存才能测试。** 测试未保存的脚本，等于把请求里的内容写到磁盘上直接执行， 所以媒介表单里的测试会拒绝，提示「脚本类媒介需要先保存再测试」。先保存， 再到用了它的通知规则里，在通知配置右上角点 **通知测试**，用一个事件去跑已保存的脚本。 见[端到端测试一条通知](https://n9e.github.io/zh/zh/docs/notifications/test.md)。

## 容易踩的坑[​](#容易踩的坑 "容易踩的坑的直接链接")

* **没写 shebang。** 最常见的失败：`exec format error`。
* **手动跑没问题，引擎跑就失败。** 引擎的用户、`PATH`、工作目录都和你的登录 shell 不一样， 脚本里用到的命令和文件一律写绝对路径。
* **多引擎部署下用路径模式。** 文件只放在一台机器上，规则却由另一台机器上的引擎评估， 那台引擎就报 no such file。
* **能编辑通知媒介的人，就能在引擎所在机器上执行代码。** 这个权限要按这个分量来给， 见[角色与权限矩阵](https://n9e.github.io/zh/zh/docs/security/roles.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* 接进规则：[通知规则](https://n9e.github.io/zh/zh/docs/notifications/rules.md)
* HTTP 的替代方案：[Callback（通用 Webhook）](https://n9e.github.io/zh/zh/docs/notifications/callback.md)
* `sendtos` 里的地址从哪来：[联系方式](https://n9e.github.io/zh/zh/docs/security/contacts.md)
