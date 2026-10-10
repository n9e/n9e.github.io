---
title: "离线部署"
sidebar_label: "离线部署"
description: "在没有外网的机器上安装：需要提前准备的包、镜像和集成模板。"
---

夜莺装完之后本身不需要外网——发布包是自包含的，集成模板、内置仪表盘、
甚至采集器安装包都在包里。要提前准备的只有「怎么把包搬进去」这件事。

## 提前下好的东西

在一台有外网的机器上下齐，再拷进内网：

| 东西 | 从哪拿 | 备注 |
|---|---|---|
| `n9e-v<版本>-linux-<架构>.tar.gz` | GitHub Release | 约 280 MB，已含 `etc/`、`integrations/`、`agents/categraf/` |
| `checksums.txt` | 同上 | 在内网核对一次，别把损坏的包装上去 |
| MySQL / Redis 的安装介质 | 你自己的渠道 | 用内网已有的实例就不用准备 |
| 外部时序库 | 你自己的渠道 | 用内置时序库就不用准备 |

用 Docker 的话，额外要提前拉镜像并 `docker save`：

```bash
docker pull flashcatcloud/nightingale:v9.1.1
docker pull flashcatcloud/categraf:latest
docker save flashcatcloud/nightingale:v9.1.1 flashcatcloud/categraf:latest -o n9e-images.tar
```

compose 编排还会用到 `mysql:8`、`redis:6.2`、`victoriametrics/victoria-metrics`，
按你选的那套编排文件里的镜像清单一起拉。

## 二进制方式

拷进去之后的步骤和联网时**完全一样**，见[二进制包](./binary.md)：解压、改
`etc/config.toml`、systemd 托管、启动。

有几件事值得确认一下，它们是「联网时不会注意到」的部分：

- **表结构不用联网**。`n9e` 启动时自己跑 AutoMigrate 建表，不下载任何东西；
- **集成模板已经在包里**。`integrations/` 目录里是随版本发布的仪表盘、
  告警规则和采集配置，页面上的模板中心读的就是它，不联网；
- **采集器安装包也在包里**。`agents/categraf/` 下是随版本携带的 categraf 安装包，
  页面上「安装采集器」给出的下载地址指向夜莺自己的 17000 端口，不去 GitHub。

**预期结果**：一台完全断网的机器上，`./n9e` 能起来、能登录、
模板中心里能看到内置模板、能下载采集器。

## Docker 方式

```bash
docker load -i n9e-images.tar
```

然后按[Docker Compose](./docker-compose.md) 的做法起，只是把编排文件里的
`image:` 都换成你 load 进来的 tag，并去掉 `:latest`——离线环境里 `latest`
没有意义，而且容易在重启时触发拉取失败。

## 从源码编译

内网自己编也可以，但要注意 `fe.sh` 的行为：**`./pub` 目录不存在时它会去 GitHub 下前端包**。
提前把前端包解压成 `pub/` 放在仓库根目录，`make` 就不会联网：

```bash
tar zxf n9e-fe-<版本>.tar.gz    # 解出 pub/
make
```

Go 依赖同理，提前 `go mod download` 或者配好内网的 module proxy。

## 装完之后哪些功能仍然需要外网

这些不影响安装，但会影响你能用到什么：

| 功能 | 要连什么 |
|---|---|
| 通知媒介 | 钉钉、飞书、企业微信、邮件、短信网关的地址 |
| Nightingale AI | 大模型的 API 地址；用内网自建模型就不需要外网 |
| 告警回调 / 工作流 | 回调目标的地址 |
| 升级到新版本 | 每次都要重复一遍上面的下载搬运 |

另外，进程启动时会做一次出口 IP 探测（用于生成实例身份）。这只是查本机路由表，
不发包也不需要能出网；探测不到时会退化成用主机名。想避开这个不确定性，
在 `[Alert.Heartbeat] IP` 里直接写死地址。

## 下一步

- [二进制包](./binary.md)
- [升级](./upgrade.md)——离线环境的升级同样是先搬包
- [上生产前的检查清单](../get-started/production-checklist.md)
