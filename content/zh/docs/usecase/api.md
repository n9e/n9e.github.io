---
title: "API"
description: "本文介绍使用 API 调用夜莺监控 Nightingale 的接口，主要是两类接口，一类是页面操作类，另一类是数据推送类"
date: 2025-06-13T17:52:38+08:00
lastmod: 2025-06-13T17:52:38+08:00
draft: false
images: []
menu:
  docs:
    parent: "usecase"
weight: 20000
toc: true
---

本文介绍如何使用 API 调用夜莺监控（Nightingale）的接口，主要是两类接口，一类是页面操作类，就是使用 API 模仿用户在页面上的操作，另一类是数据推送类，比如自己的程序采集了监控数据，想要推送给夜莺。

##  页面操作类

页面操作类的 API 主要是模拟用户在页面上的操作，比如创建告警规则、修改机器标签、修改机器备注、调整机器归属的业务组等。所有用户在页面上的操作，都可以使用 API 完成，您可以通过这些接口来实现自动化操作。

显然，要调用 API 需要有两个前提：

- 搞定认证
- 了解有哪些接口，各个接口有哪些参数

### 搞定认证

这里直接讲解 `v8.0.0-beta.5` 以上版本的认证方式，即个人中心 token 方式，这是最简单的方式。

#### 1. 修改配置文件

修改夜莺的配置文件 `etc/config.toml`，确保配置了 `HTTP.TokenAuth`，并且设置了 `Enable = true`，如下所示：

```toml
...
[HTTP.RSA]
OpenRSA = false

[HTTP.TokenAuth]
Enable = true

[DB]
...
```

#### 2. 获取 Token

登录夜莺监控，进入右上角头像，进入个人信息页面，点击 “Token 管理” 那个 Tab，然后点击“创建 Token”，随便起个名字，就可以得到一个 Token。

<img src="/img/usecase/api/01.png" alt="create api token"/>

#### 3. 使用 Token

在调用 API 的时候，需要在 HTTP 请求的 Header 中添加 `X-User-Token` 字段，值为你刚才创建的 Token。用 cURL 命令调用 API 的示例：

```bash
curl -s -X GET "http://<NIGHTINGALE_HOST><API_URL_PATH>" \
-H "X-User-Token: <YOUR_TOKEN>" \
-H "Content-Type: application/json"
```

我们测试一下获取个人信息的接口：

```bash
curl -s -H "X-User-Token: e6897d32-c237-4d27-a0fc-786345b682ea" -H "Content-Type: application/json" 'http://10.99.1.106:8003/api/n9e/self/profile' | python3 -m json.tool
{
    "dat": {
        "id": 1,
        "username": "root",
        "nickname": "Root",
        "phone": "",
        "email": "qinxiaohui@flashcat.cloud",
        "portrait": "/image/avatar1.png",
        "roles": [
            "Admin"
        ],
        "contacts": {
            "wecomid": "qinxiaohui"
        },
        "maintainer": 0,
        "create_at": 1733229739,
        "create_by": "system",
        "update_at": 1749811268,
        "update_by": "root",
        "belong": "",
        "admin": true,
        "user_groups": null,
        "busi_groups": null,
        "last_active_time": 1749811088
    },
    "err": ""
}
```

如上，正常返回了内容，表示成功。如果你要写程序调用 API，需要校验：

- 夜莺返回的 HTTP 状态码是否为 200，如果状态码不是 200，表示请求失败，此时可以把 Response Body 打印出来，查看具体的错误信息。
- 如果状态码是 200，Response Body 肯定是 JSON，此时还要校验 JSON 数据中 `err` 字段是否为空，如果不为空就是有问题的。

### 了解有哪些接口

直接使用 Chrome 打开夜莺的页面，按 F12 打开开发者工具，切换到 Network 标签页，然后在页面上操作，比如创建一个告警规则，或者修改机器标签等。你会看到 Network 中有很多 API 请求，这些就是夜莺的 API 接口。比如：

<img src="/img/usecase/api/02.png" alt="Chrome Network"/>

- Headers 下面可以看到 Request Method 和 URL
- Response 下面可以看到返回的内容

上面的接口没有任何 Query string 参数，如果有 Query string 参数，通常会在 URL 中显示。另外，如果是 POST 请求，就需要研究 Request Body 的格式了，届时会出现一个 Payload 的 Tab，在 Payload 下面可以看到 Request Body 的内容格式。

这种方式比接口文档要好多了，接口文档经常忘记更新，而且不同版本的差异经常忘记说明，而通过查看 Chrome 的这种方式，那信息绝对是 100% 准确的，有哪些接口，有哪些参数，一目了然，每个运维、后端研发都应该懂得这种方式。

## 数据推送类

自己的程序暴露监控数据，通常有两个手段，一个是埋入 Prometheus SDK，暴露 `/metrics` 接口，然后用 Prometheus 或 Categraf 来抓取（称为 PULL 模式），另一个是直接调用夜莺的 API 接口，推送监控数据（称为 PUSH 模式），夜莺支持多种数据接收的接口，包括 OpenTSDB、Open-Falcon、PrometheusRemoteWrite、Datadog 等协议。

### 推送样例

以 OpenTSDB 协议为例，夜莺接口路径是 `/opentsdb/put`，HTTP Method 是 POST，Request Body 里放置你要上报的监控数据，格式样例如下：

```json
[
	{
		"metric": "cpu_usage_idle",
		"timestamp": 1637732157,
		"tags": {
			"cpu": "cpu-total",
			"ident": "c3-ceph01.bj"
		},
		"value": 30.5
	},
	{
		"metric": "cpu_usage_util",
		"timestamp": 1637732157,
		"tags": {
			"cpu": "cpu-total",
			"ident": "c3-ceph01.bj"
		},
		"value": 69.5
	}
]
```

显然，JSON 最外层是个数组，如果只上报一条监控数据，也可以不要外面的中括号，直接把对象结构上报：

```json
{
  "metric": "cpu_usage_idle",
  "timestamp": 1637732157,
  "tags": {
    "cpu": "cpu-total",
    "ident": "c3-ceph01.bj"
  },
  "value": 30.5
}
```

服务端会看第一个字符是否是 `[`，来判断上报的是数组，还是单个对象，自动做相应的 Decode。如果觉得上报的内容太过占用带宽，也可以在你的程序里对 Request Body 做 gzip 压缩，同时在 HTTP Header 里带上 `Content-Encoding: gzip` 的 Header。

各个字段的含义可以 Google 一下或者询问 GPT，关键字是 “OpenTSDB 数据格式里各个字段的含义”。这里我稍作说明：

- metric: 监控指标的名称，通常是一个英文单词，多个单词用下划线连接，比如 `cpu_usage_idle`
- timestamp: 时间戳，单位是秒，表示监控数据的采集时间
- tags: 标签，通常是一个 map 结构，key 是标签名，value 是标签值，用于描述指标的各类维度信息或元信息
- value: 监控数据的值，通常是一个数字，表示指标的数值

> 🟢 注意 ident 这个标签，ident 是 identity 的缩写，表示设备的唯一标识，如果标签中有 ident 标签，n9e 就认为这个监控数据是来自某个机器的，会自动获取 ident 的 value，注册到夜莺的机器列表里。

其他常用的接口路径：

- `/openfalcon/push`: Open-Falcon 数据接收接口
- `/prometheus/v1/write`: Prometheus Remote Write 数据接收接口

### 如何认证

如果你的夜莺暴露在公网，那所有人都可以推监控数据给你，这显然是不安全的。所以我们建议：

- 不要把夜莺暴露在公网
- 如果实在要暴露在公网，要用 HTTPS 协议，同时开启 Basic Auth 认证

如何开启 Basic Auth 认证呢？在 `etc/config.toml` 中配置：

```toml
[HTTP.APIForAgent]
Enable = true
[HTTP.APIForAgent.BasicAuth]
user001 = "Pa55word01"
user002 = "Pa55word02"
```

你自己的程序调用夜莺的接口上报监控数据，此时你的程序就相当于一个 agent 的角色，所以就是跟 `HTTP.APIForAgent` 这块的配置相关。

- `HTTP.APIForAgent` 下面的 Enable 首先要设置为 true，才会启用相关接口，否则你调用那些上报数据的接口都会报 404 Not Found 错误。
- `HTTP.APIForAgent.BasicAuth` 下面的配置是用户名和密码，格式是 `username = "password"`，你可以设置多个用户，这些用户的认证方式是 Basic Auth。如果 `HTTP.APIForAgent.BasicAuth` 下面一个用户也没有配置，那么就表示不需要认证，任何人都可以推送数据。

> 🔴 注意：跟 `HTTP.APIForAgent` 紧挨着的还有一个 `HTTP.APIForService` 配置段，用于提供一些接口给 n9e-edge 使用，即夜莺的边缘机房部署模式，如果你没有用到 n9e-edge，一定要把 `HTTP.APIForService` 给 Disable 掉，即 `HTTP.APIForService` 下面的 Enable 设置为 false，避免安全风险。

