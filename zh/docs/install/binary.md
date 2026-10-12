# 二进制包

下载 GitHub Release 的 Linux amd64 / arm64 包，校验解压，接上已有的 MySQL 和 Redis，用 systemd 托管 n9e。

最后校对于 2026-10-10

这页做完，你会得到一个由 systemd 托管、连着你自己的 MySQL 和 Redis、监听 17000 的 `n9e` 进程。

## 下载与校验[​](#下载与校验 "下载与校验的直接链接")

Release 页只发 Linux 的 amd64 和 arm64 两种包——夜莺是服务端程序，没有 Windows / macOS 的发布包 （真要在别的系统上跑，参照仓库里的 `Makefile` 自己编）。

```
VERSION=9.1.1

curl -LO https://github.com/ccfos/nightingale/releases/download/v${VERSION}/n9e-v${VERSION}-linux-amd64.tar.gz

curl -LO https://github.com/ccfos/nightingale/releases/download/v${VERSION}/checksums.txt

sha256sum -c checksums.txt --ignore-missing
```

**预期结果**：`n9e-v9.1.1-linux-amd64.tar.gz: OK`。

压缩包**不带顶层目录**，解压前先把目录建好，否则会散落一地：

```
mkdir -p /opt/n9e && tar zxf n9e-v${VERSION}-linux-amd64.tar.gz -C /opt/n9e
```

## 包里有什么[​](#包里有什么 "包里有什么的直接链接")

| 路径               | 是什么                                                     |
| ------------------ | ---------------------------------------------------------- |
| `n9e`              | Center 进程，唯一必须的二进制                              |
| `n9e-edge`         | 边缘机房的本地告警引擎                                     |
| `n9e-cli`          | v5 → v6 的一次性数据迁移工具，日常运维用不到               |
| `etc/`             | 配置目录，进程必需                                         |
| `integrations/`    | 集成模板（仪表盘、告警规则、采集配置），进程必需           |
| `agents/categraf/` | 随包携带的 categraf 安装包，页面上的「安装采集器」从这里取 |
| `docker/`          | compose 编排、建库 SQL                                     |
| `n9e.sql`          | `docker/initsql/a-n9e.sql` 的副本，MySQL 建库脚本          |

`n9e` 进程只依赖同级目录的 `etc/` 和 `integrations/`，其余都可以删掉。

发布包里**没有** `n9e-alert` 和 `n9e-pushgw`。`Makefile` 里有 `build-alert`、`build-pushgw` 两个编译目标，但它们不参与发版，要拆分部署得自己从源码编。

## 先跑起来[​](#先跑起来 "先跑起来的直接链接")

```
cd /opt/n9e && ./n9e
```

默认配置零外部依赖：SQLite 存元数据、进程内 miniredis、内置时序库存指标。 浏览器打开 `http://<服务器地址>:17000`，用 `root` / `root.2020` 登录。

**预期结果**：日志里出现 `http server listening on: 0.0.0.0:17000`，页面能登进去。

这套默认值**不适合生产**，往下继续换掉它们，或者直接照 [上生产前的检查清单](https://n9e.github.io/zh/zh/docs/get-started/production-checklist.md) 走一遍。

## 接已有的 MySQL 和 Redis[​](#接已有的-mysql-和-redis "接已有的 MySQL 和 Redis的直接链接")

先建库。表结构不用手工导入——`n9e` 每次启动都会跑一次 AutoMigrate 把表补齐， 所以只要有一个空库和一个能建表改表的账号：

```
CREATE DATABASE n9e_v6 DEFAULT CHARACTER SET utf8mb4;
```

库名习惯叫 `n9e_v6`，从 v6 沿用至今，包里的建库脚本用的也是这个名字。

然后改 `etc/config.toml`：

```
[DB]

DBType = "mysql"

DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"



[Redis]

RedisType = "standalone"

Address = "redis:6379"
```

重启后**预期结果**：日志里没有 `failed to migrate table`，登录页仍然是 `root` / `root.2020` （root 这行数据是首次启动时写进新库的）。选型和权限细节见 [数据库选型](https://n9e.github.io/zh/zh/docs/install/databases.md)。

## 用 systemd 托管[​](#用-systemd-托管 "用 systemd 托管的直接链接")

```
[Unit]

Description=Nightingale

After=network-online.target

Wants=network-online.target



[Service]

Type=simple

User=n9e

WorkingDirectory=/opt/n9e

ExecStart=/opt/n9e/n9e

Restart=always

RestartSec=5

LimitNOFILE=65536



[Install]

WantedBy=multi-user.target
```

存成 `/etc/systemd/system/n9e.service`。`WorkingDirectory` 必须是解压出来的目录： `etc/`、`integrations/`、`data/tsdb`、`logs/` 全是相对工作目录找的。

```
sudo systemctl daemon-reload

sudo systemctl enable --now n9e

curl -s http://127.0.0.1:17000/ping
```

**预期结果**：`/ping` 返回 `pong`。

## 边缘机房[​](#边缘机房 "边缘机房的直接链接")

同一个包里的 `n9e-edge` 用于边缘机房，启动时必须指定**配置目录**而不是配置文件：

```
./n9e-edge --configs etc/edge
```

写成 `--configs etc` 会让它读到中心端的 `config.toml`，而且不报错。 详见[边缘机房](https://n9e.github.io/zh/zh/docs/install/edge.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* [数据库选型](https://n9e.github.io/zh/zh/docs/install/databases.md)——MySQL 还是 PostgreSQL，Redis 用来做什么
* [配置文件布局](https://n9e.github.io/zh/zh/docs/install/configuration.md)——`etc/` 里各段是干什么的
* [高可用](https://n9e.github.io/zh/zh/docs/install/high-availability.md)——多跑几个实例
