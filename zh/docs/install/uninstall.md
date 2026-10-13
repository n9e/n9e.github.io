# 卸载与数据保留

干净地卸载夜莺，以及卸载前该保留或导出什么。

最后校对于 2026-10-10

夜莺没有安装器，也就没有卸载器：停进程、删目录、删库，三步。 真正需要想清楚的是**删之前哪些东西你还要**——尤其是那些搬到别处也还有用的配置。

## 卸载前先导出[​](#卸载前先导出 "卸载前先导出的直接链接")

按「换个系统还用得上吗」来判断：

| 东西             | 怎么留                    | 换到别的系统还有用吗                     |
| ---------------- | ------------------------- | ---------------------------------------- |
| 告警规则         | 规则管理页批量导出成 JSON | 有用，规则是最花时间的资产               |
| 仪表盘           | 仪表盘页导出 JSON         | 有用，也能导进 Grafana 之外的地方        |
| 元数据库整库     | `mysqldump n9e_v6`        | 只对夜莺自己有用，但**这是唯一的后悔药** |
| `etc/` 配置目录  | 直接拷走                  | 有用，重装时省一遍调参                   |
| 内置时序库的指标 | 只能提前迁走，见下        | 看你还要不要这段历史                     |

先把整库 dump 一份放到别的机器上，再动手。删完发现少导了一个东西， 有这份 dump 就还能捞回来。

**内置时序库的数据没有导出功能。** 还想留住这段指标历史，得在卸载前先配双写， 把数据同时写进一个外部时序库，等攒够了再卸载——办法见 [外置时序库与双写迁移](https://n9e.github.io/zh/docs/install/external-tsdb.md)。

## 停进程[​](#停进程 "停进程的直接链接")

```
systemctl stop n9e

systemctl disable n9e

rm /etc/systemd/system/n9e.service

systemctl daemon-reload
```

集群部署时每台都要停。有 `n9e-edge` 的话，边缘机房的进程也一起停。

Docker Compose 部署：

```
docker compose down          # 保留数据卷

docker compose down -v       # 连数据卷一起删
```

## 删磁盘上的东西[​](#删磁盘上的东西 "删磁盘上的东西的直接链接")

所有运行时产生的东西都在解压目录下，删掉这个目录就干净了：

| 路径                                 | 是什么                               | 删了会怎样               |
| ------------------------------------ | ------------------------------------ | ------------------------ |
| `n9e`、`n9e-edge`、`n9e-cli`         | 二进制                               | —                        |
| `etc/`                               | 配置                                 | 重装要重新配一遍         |
| `integrations/`                      | 集成模板，随版本发布                 | 重装会带回来             |
| `data/tsdb/`                         | 内置时序库的数据                     | 指标历史彻底没了         |
| `logs/`                              | 日志，含 `logs/evallog` 判定执行记录 | 少一段排障线索           |
| `skill/`                             | AI 技能的运行目录                    | 重启会重新生成           |
| `n9e.db`、`n9e.db-wal`、`n9e.db-shm` | 用 SQLite 时的元数据库               | **所有配置和历史都没了** |

```
rm -rf /opt/n9e
```

夜莺不往 `/etc`、`/var/lib` 这些系统目录写东西，也不建系统用户， 除了你自己加的 systemd unit 之外，系统里不会有残留。

## 删数据库和 Redis[​](#删数据库和-redis "删数据库和 Redis的直接链接")

用的是外部 MySQL / PostgreSQL 和 Redis 时，进程停了它们不会自己清理：

```
DROP DATABASE n9e_v6;
```

Redis 里夜莺的键有前缀，只删自己的部分即可（JWT 的前缀是 `[HTTP.JWTAuth] RedisKeyPrefix`，默认 `/jwt/`）。这个 Redis 只服务夜莺的话， `FLUSHDB` 更省事——**确认它不被别的系统共用**再动手。

## 采集端[​](#采集端 "采集端的直接链接")

装过 Categraf 的机器要单独收尾，否则它们会继续往一个已经不存在的地址推数据， 在自己的日志里刷连接失败：

```
cd /opt/categraf && ./categraf --stop && ./categraf --remove

rm -rf /opt/categraf
```

`--remove` 会把它自己注册的 systemd 服务反注册掉，不用手工删 unit 文件。

只是换地址就不用卸载，改 Categraf 配置里的写入地址即可。

## 下一步[​](#下一步 "下一步的直接链接")

* [外置时序库与双写迁移](https://n9e.github.io/zh/docs/install/external-tsdb.md)——想留住指标历史就从这里开始
* [备份与恢复](https://n9e.github.io/zh/docs/operations/backup-restore.md)——卸载前那份 dump 该怎么做
* [二进制包](https://n9e.github.io/zh/docs/install/binary.md)——重新装回来
