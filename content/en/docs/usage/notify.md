---
title: "告警通知"
description: "夜莺（ Nightingale ）告警通知渠道"
lead: ""
date: 2020-10-06T08:48:57+00:00
lastmod: 2020-10-06T08:48:57+00:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 845
toc: true
---

夜莺告警通知，内置支持邮件、钉钉机器人、企微机器人、飞书机器人多种方式作为发送通道，也支持调用自定义脚本和Webhook，给用户自定义发送通道的能力。相关配置在 webapi.conf 和 server.conf 中都有涉及。这里分别讲解。

## webapi.conf

```toml
[[NotifyChannels]]
Label = "邮箱"
# do not change Key
Key = "email"

[[NotifyChannels]]
Label = "钉钉机器人"
# do not change Key
Key = "dingtalk"

[[NotifyChannels]]
Label = "企微机器人"
# do not change Key
Key = "wecom"

[[NotifyChannels]]
Label = "飞书机器人"
# do not change Key
Key = "feishu"

[[ContactKeys]]
Label = "Wecom Robot Token"
# do not change Key
Key = "wecom_robot_token"

[[ContactKeys]]
Label = "Dingtalk Robot Token"
# do not change Key
Key = "dingtalk_robot_token"

[[ContactKeys]]
Label = "Feishu Robot Token"
# do not change Key
Key = "feishu_robot_token"
```

NotifyChannels是个数组，可以写多个，告警规则配置页面，展示的通知媒介，就是读取的这个配置文件的内容。

ContactKeys也是个数组，用于控制用户的联系方式的配置，在个人中心编辑用户信息的时候，除了手机号、邮箱，还可以为用户配置多种联系方式，多种联系方式也是可以自定义的，就是通过上面的配置来控制。

基于上面的配置，我们可以为某个告警规则指定通知媒介了，也可以为告警接收人配置手机号、邮箱、相关的机器人Token了，具体做发送的时候就不是webapi来处理了，是server模块来处理，所以下面我们再来看server的配置。


## server.conf

```toml
[SMTP]
Host = "smtp.163.com"
Port = 994
User = "username"
Pass = "password"
From = "username@163.com"
InsecureSkipVerify = true
Batch = 5

[Alerting]
TemplatesDir = "./etc/template"
NotifyConcurrency = 10
# use builtin go code notify
NotifyBuiltinChannels = ["email", "dingtalk", "wecom", "feishu"]

[Alerting.CallScript]
# built in sending capability in go code
# so, no need enable script sender
Enable = false
ScriptPath = "./etc/script/notify.py"

[Alerting.CallPlugin]
Enable = false
# use a plugin via `go build -buildmode=plugin -o notify.so`
PluginPath = "./etc/script/notify.so"
# The first letter must be capitalized to be exported
Caller = "N9eCaller"

[Alerting.RedisPub]
Enable = false
# complete redis key: ${ChannelPrefix} + ${Cluster}
ChannelPrefix = "/alerts/"

[Alerting.Webhook]
Enable = false
Url = "http://a.com/n9e/callback"
BasicAuthUser = ""
BasicAuthPass = ""
Timeout = "5s"
Headers = ["Content-Type", "application/json", "X-From", "N9E"]
```

server内置支持邮件发送，所以，要配置SMTP，SMTP不会配置的自行Google。Alerting相关的配置，是告警通知相关的，夜莺不但内置支持了多种通知方式，也支持了调用外部脚本、调用外部Plugin、通过Redis做Publish、全局Webhook等多种方式，把告警消息推给外部处理逻辑，增强扩展性。

```
[Alerting]
TemplatesDir = "./etc/template"
NotifyConcurrency = 10
# use builtin go code notify
NotifyBuiltinChannels = ["email", "dingtalk", "wecom", "feishu"]
```

- TemplatesDir指定模板文件的目录，这个目录下有多个模板文件，遵从Go Template语法，可以控制告警发送的消息的格式
- NotifyConcurrency 表示并发度，可以维持默认，处理不过来了，有事件堆积（事件是否堆积可以查看n9e-server的这个指标：n9e_server_alert_queue_size，通过 `/metrics` 接口暴露的）了再调大
- NotifyBuiltinChannels 是配置Go代码内置的通知媒介，默认4个通知媒介都让Go代码来做，如果某些通知媒介想做一些自定义，可以从这个数组中删除对应的通知媒介，Go代码就不处理那个通知媒介了，自定义的通知媒介可以在后面介绍的脚本里自行处理，灵活自定义


```toml
[Alerting.CallScript]
# built in sending capability in go code
# so, no need enable script sender
Enable = false
ScriptPath = "./etc/script/notify.py"
```

CallScript是配置告警通知脚本的，如果没有自定义的需求，Go内置的4种发送通道 `["email", "dingtalk", "wecom", "feishu"]` 完全可以满足需求，这个CallScript是无需关注的，所以默认`Enable=false`。

如果内置的发送逻辑搞不定了，比如想支持短信、电话等通知方式，就可以启用CallScript，夜莺发现这里的`Enable=true`且指定了一个脚本，就会去执行这个脚本，把告警事件的内容发给这个脚本，由这个脚本做后续处理。

告警事件是怎么发给这个脚本的呢？系统会把告警事件的内容encode成json，然后通过stdin的方式传给notify.py。notify.py的脚本里有这么几行，大家可以看一下：

```python
def main():
    payload = json.load(sys.stdin)
    with open(".payload", 'w') as f:
        f.write(json.dumps(payload, indent=4))
```

逻辑很简单，脚本从stdin拿到内容，`json.load`了一下，把payload的内容写入了`.payload`文件里了。很多想自行开发notify.py的朋友，都不清楚数据结构是什么样子的，其实看一下 `.payload` 文件的内容就知道了，一目了然。

notify.py的同级目录，还有一个notify.bak.py，很多逻辑可以参考这个脚本。因为夜莺刚开始的版本发送告警只能通过脚本来做，后来才内置到go代码中的，所以，notify.bak.py里备份了很多老的逻辑，大家可以参考。

```toml
[Alerting.CallPlugin]
Enable = false
# use a plugin via `go build -buildmode=plugin -o notify.so`
PluginPath = "./etc/script/notify.so"
# The first letter must be capitalized to be exported
Caller = "N9eCaller"
```

CallPlugin是动态链接库的方式加载外部逻辑，有个小文档可以参考：[这里](https://github.com/ccfos/nightingale/tree/main/etc/script/notify) 非Go玩家，就不建议了解了，Go玩家，我就不用讲你也应该会了。


```toml
[Alerting.RedisPub]
Enable = false
# complete redis key: ${ChannelPrefix} + ${Cluster}
ChannelPrefix = "/alerts/"
```

这个配置如果开启，n9e-server会把生成的告警事件publish给redis，如果用户有自定义的逻辑，可以去subscribe，然后自行处理。

```toml
[Alerting.Webhook]
Enable = false
Url = "http://a.com/n9e/callback"
BasicAuthUser = ""
BasicAuthPass = ""
Timeout = "5s"
Headers = ["Content-Type", "application/json", "X-From", "N9E"]
```

这是全局Webhook，如果启用，n9e-server生成告警事件之后，就会回调这个Url，对接一些第三方系统。告警事件的内容会encode成json，放到HTTP request body中，POST给这个Url，也可以自定义Header，即Headers配置，Headers是个数组，必须是偶数个，Key1, Value1, Key2, Value2 这个写法。

