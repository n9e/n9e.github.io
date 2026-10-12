# 嵌入与被集成

把夜莺嵌进既有门户、按需隐藏菜单、把身份透传过去。

这页办完你会得到两件事：夜莺侧栏里多出几个外部系统的入口；以及一个把夜莺页面 嵌进自家门户、且不用让用户再登录一次的做法。

## 两个方向，别混[​](#两个方向别混 "两个方向，别混的直接链接")

* **别人进来。** 「系统集成」把外部网页以 iframe 挂进夜莺侧栏，配置页在 集成中心里，有界面。
* **夜莺出去。** 把夜莺页面嵌进别的门户，靠的是 URL 参数加上代理认证， **没有专门的配置页**，改的是配置文件和链接。

## 把外部系统嵌进夜莺[​](#把外部系统嵌进夜莺 "把外部系统嵌进夜莺的直接链接")

**集成中心 → 系统集成**（`/embedded-products`），点 **新增**。

![系统集成](/zh/img/docs/query/embedded-products.zh.png)![系统集成](/zh/img/docs/query/embedded-products.zh.dark.png)

| 字段   | 填什么                                                        |
| ------ | ------------------------------------------------------------- |
| 名称   | 侧栏里显示的菜单名，短一点好认                                |
| 链接   | 要嵌入的完整 URL，例如 `https://cmdb.example.com/hosts`       |
| 可见性 | **登录用户可见**，或者 **指定团队可见**（后者还要选具体团队） |

保存。预期结果：侧栏最下面多出一项，点开在主区域加载这个页面（有时要刷一次浏览器）。

列表页每行还有两个开关：**是否在菜单显示** 关掉后配置留着但侧栏不显示，适合临时下线； 行首可以拖拽调整侧栏里的顺序。

典型用法是把 CMDB、工单系统、团队 Wiki 的故障处理手册挂进来，收到告警之后不用切标签页。

## 嵌进来一片空白，多半是对方不让嵌[​](#嵌进来一片空白多半是对方不让嵌 "嵌进来一片空白，多半是对方不让嵌的直接链接")

夜莺这边只是个 iframe 容器，能不能嵌完全取决于对方的响应头：

| 对方的响应头                                      | 结果                    |
| ------------------------------------------------- | ----------------------- |
| `X-Frame-Options: DENY` 或 `SAMEORIGIN`           | 浏览器拒绝，iframe 空白 |
| `Content-Security-Policy: frame-ancestors 'self'` | 同上                    |
| 两个头都没有，或显式放开了你的域名                | 能嵌                    |

打开浏览器 Console 就能看到原文：`Refused to display ... in a frame because it set 'X-Frame-Options'`，或者 `Refused to frame ... because an ancestor violates ... frame-ancestors`。

两种解法：让对方加上 `Content-Security-Policy: frame-ancestors https://<你的夜莺域名>`， 或者自己起一个 nginx 反代对方站点、在代理层改写响应头，再把代理地址填进来。

还有一层是 Cookie：对方的登录态 Cookie 如果是 `SameSite=Lax/Strict`，跨站 iframe 里 不会被带上，用户看到的就是一个登录页。要么让对方改成 `SameSite=None; Secure`， 要么两边接同一套 SSO。

## 把夜莺嵌进别的门户：先藏掉导航[​](#把夜莺嵌进别的门户先藏掉导航 "把夜莺嵌进别的门户：先藏掉导航的直接链接")

夜莺认三个 URL 参数，任何页面都可以带：

| 参数                        | 效果                                         |
| --------------------------- | -------------------------------------------- |
| `?menu=hide`                | 隐藏左侧菜单，正文照常                       |
| `?viewMode=fullscreen`      | 仅仪表盘详情页有效：连页头一起隐藏，只剩面板 |
| `&themeMode=dark` / `light` | 固定明暗主题，不跟随浏览器                   |

例如把一个仪表盘嵌成纯画布：

```
<iframe src="https://n9e.example.com/dashboards/12?viewMode=fullscreen&themeMode=dark"

        width="100%" height="800" frameborder="0"></iframe>
```

`viewMode=fullscreen` 在 iframe 里退不出来——退出全屏的快捷键受 iframe 安全限制管不到， 要手动把这个参数从 URL 里去掉。产品界面上也是这么提示的。

只想给外部一个仪表盘、又不想让对方登录，别走这条路，走 [匿名限时分享](https://n9e.github.io/zh/zh/docs/query/sharing.md)：`/dashboards/share/<id>?__token=` 这个路径本来就不带菜单， 而且到期自动失效。

## 把登录态透传过去[​](#把登录态透传过去 "把登录态透传过去的直接链接")

门户已经有自己的登录体系时，用代理认证，让用户在夜莺这边不用再登一次：

```
[HTTP.ProxyAuth]

Enable = true

# 从哪个请求头取用户名

HeaderUserNameKey = "X-User-Name"

# 头里的用户名在夜莺里不存在时，自动建号并给这些角色

DefaultRoles = ["Standard"]
```

门户或网关在转发请求给夜莺时带上 `X-User-Name: <用户名>`，夜莺按这个头找用户， 找不到就按 `DefaultRoles` 自动建一个。

三条必须做到，否则这就是个开放的越权入口：

1. **这个头只能由你信得过的反向代理注入**，并且要在入口处把客户端自带的同名头 **无条件剥掉**——不剥的话，任何人加一个 header 就能变成任意用户；
2. **夜莺只监听内网地址**，只允许网关访问，不要直接对外；
3. 打开 `ProxyAuth` 之后 **JWT 登录就被停用了**：夜莺自己的登录页不再生效， 退出登录接口会直接报错。这是单向开关，切换前想清楚。

## 它管不到的边界[​](#它管不到的边界 "它管不到的边界的直接链接")

* 「可见性」只控制侧栏里那个入口给谁看，**不是被嵌系统的安全边界**。用户拿到 URL 直接访问对方系统时，夜莺完全管不着——被嵌的系统自己也要鉴权。
* 没有「按名单隐藏某几个菜单」的 URL 参数。`menu=hide` 是全隐藏；要按人裁菜单， 用角色和权限点，见[角色与权限点](https://n9e.github.io/zh/zh/docs/security/roles.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* 只分享一个板：[匿名限时分享](https://n9e.github.io/zh/zh/docs/query/sharing.md)
* 已经在用 Grafana：[与 Grafana 配合](https://n9e.github.io/zh/zh/docs/query/grafana.md)
* 谁能看到什么：[用户、团队与角色](https://n9e.github.io/zh/zh/docs/security/users-teams.md)
