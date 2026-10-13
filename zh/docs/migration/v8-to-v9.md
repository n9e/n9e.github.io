# v8 升级 v9

v8 升 v9 换二进制即可，表结构启动时自动迁移；但有几段新配置必须手工补上，否则新功能静默不生效，部分功能也改了位置。

最后校对于 2026-10-10

看完这页，你能把一套 v8 升到 v9，知道升级前必须先满足什么条件、 哪几段配置**必须手工补**（否则新功能静默不生效）、以及升完该验证什么。

v8 和 v9 之间**没有需要手工执行的数据迁移**，也没有 API 的破坏性改名。 真正会咬人的是三件事：Redis 版本、几段只存在于新配置文件里的段落、以及启动时的在线建索引。

## 升级前必须先确认的三件事[​](#升级前必须先确认的三件事 "升级前必须先确认的三件事的直接链接")

1. **Redis 版本 ≥ 5.0。** v9 的 AI 助手依赖 Redis Streams，5.0 以下起不来。 用 Redis Cluster 的建议上到 7.0+，才能用分片 Pub/Sub。
2. **多进程部署要一起升。** 跑了 `n9e-edge` 或 `n9e-pushgw` 的， 必须和 `n9e` 同批替换，不要只升中心。
3. **磁盘要留量。** v9.1 起「判定记录」**默认开启**，告警引擎会把每一轮判定 写到自己本地的 `./evallog`，默认保留 8 天、上限 20 GB。 不想要就在配置里关掉（见下文），但不能当它不存在。

备份四样东西：数据库（`mysqldump`）、二进制、`etc/` 目录、`integrations/` 目录。

## 升级步骤[​](#升级步骤 "升级步骤的直接链接")

二进制部署：

```
# 1. 备份

mysqldump -u root -p n9e_v6 > n9e_v6.$(date +%F).sql

cp -a etc etc.bak && mv integrations integrations.bak



# 2. 换二进制和 integrations 目录（integrations 用新包里的，不要合并）

#    然后 diff 配置，把新增的段落补进你的配置文件

diff -u etc.bak/config.toml etc/config.toml



# 3. 重启
```

容器部署：把 `docker-compose.yml` 里的镜像 tag 换成 v9 的，`diff` 一遍配置，重启容器。

最后一步别漏：**强制刷新一次浏览器**，否则会用到缓存里的旧 js / css。

## 表结构怎么变[​](#表结构怎么变 "表结构怎么变的直接链接")

夜莺启动时用 AutoMigrate 自动改表，**你不需要手工执行任何 SQL**——前提是 连库的账号有建表、改表权限。没有权限就把 [`docker/migratesql/migrate.sql`](https://github.com/ccfos/nightingale/blob/main/docker/migratesql/migrate.sql) 里对应版本段落交给 DBA 执行。库名从 v6 沿用至今，仍然叫 `n9e_v6`，不用改。

`docker/sqlite.sql` 和 `docker/initsql/a-n9e.sql` 是**全新安装**用的初始化文件，升级用不到它们。 其中 `sqlite.sql` 明显停在 v7 期，`notify_rule`、`notify_channel`、`message_template`、 `event_pipeline`、`ai_llm_config` 这些表它一张都没有——**这不是问题，它们由 AutoMigrate 建**。 所以不要拿这两个文件当表结构的真相源。

有两处索引是**启动后异步建**的，在大表上要跑很久，这段时间服务是可用的：

| 表                    | 索引                                           | 注意                               |
| --------------------- | ---------------------------------------------- | ---------------------------------- |
| `alert_his_event`     | `idx_group_last_eval_time`                     | 历史事件表通常最大，可能跑几十分钟 |
| `notification_record` | `idx_nr_rule_created_evt`、`idx_nr_created_at` | 高频写入表                         |

**只有 `notification_record` 那两个索引是在线加的。** 它们在 MySQL 上显式要求 `ALGORITHM=INPLACE, LOCK=NONE`：不支持在线加索引时**宁可报错**，也不会静默退化成锁写的 DDL； 真报错了，日志里会写明让 DBA 用 `gh-ost` 或 `pt-online-schema-change` 手工加。 PostgreSQL 上它们走 `CREATE INDEX CONCURRENTLY`。

**`alert_his_event` 上那个索引是普通的 `CREATE INDEX`。** MySQL 5.6 以上它仍然是在线操作， 但 **PostgreSQL 上普通 `CREATE INDEX` 会在整个构建期间持有共享锁**， 往这张通常是最大的表里写入会被卡住，直到索引建完。

PostgreSQL 上的大库要提前打算：要么放在维护窗口里接受这段卡顿， 要么**在启动新版本之前先手工 `CREATE INDEX CONCURRENTLY` 把它建好**， 迁移时发现索引已存在就会跳过。

另外，从很老的版本上来的库可能还缺 `notify_rule_id` 列，那一条索引会跳过并提示下次启动重试—— 这是预期行为，不用管。

## 配置文件里要手工处理的三处[​](#配置文件里要手工处理的三处 "配置文件里要手工处理的三处的直接链接")

### 内置时序库：不补就是关的[​](#内置时序库不补就是关的 "内置时序库：不补就是关的的直接链接")

```
[EmbeddedTSDB]

Enable = true

Dir = "data/tsdb"

RetentionDuration = "15d"

MaxBytes = "10GiB"
```

这一段**只存在于新版的 `etc/config.toml` 里**，沿用旧配置文件就等于没开—— 这是「只换二进制，内置时序库却没生效」的唯一原因。它**只由 center 进程处理**， `n9e-edge` / `n9e-alert` / `n9e-pushgw` 会忽略它并打一条 warning。 数据落在**那一个 center 实例的本地磁盘**上，只适合单实例部署； 多副本请继续用外部时序库。细节见[内置时序库与外部存储](https://n9e.github.io/zh/docs/concepts/storage.md)。

### 判定记录：不补也是开的[​](#判定记录不补也是开的 "判定记录：不补也是开的的直接链接")

```
# [Alert.EvalLog]

# Disable = false          # 默认就是 false，也就是开启

# Dir = "logs/evallog"     # 默认 <[Log] Dir>/evallog

# RetentionHours = 192     # 8 天

# MaxDiskGB = 20
```

新配置文件里这一段是**注释掉**的，因为代码里的默认值就是开启。 换句话说：不动配置，它照样写盘。要缩短保留期或关掉，才需要把这几行放开。 用途见[判定记录](https://n9e.github.io/zh/docs/alerting/execution-records.md)。

### 用 telegraf 的另有一条[​](#用-telegraf-的另有一条 "用 telegraf 的另有一条的直接链接")

telegraf 的指标写入地址要追加 `ignore_host=false`，否则跑 telegraf 的机器 **不再注册进设备列表**。Categraf 用户不受影响。

## 导航变了，这些东西挪了地方[​](#导航变了这些东西挪了地方 "导航变了，这些东西挪了地方的直接链接")

v9 重排了导航。从 v8 上来最容易找不到的是这几个——它们**都还在，开源版都能用**， 只是不再是顶级菜单项：

| 你在找的                     | v9 里在哪                           |
| ---------------------------- | ----------------------------------- |
| 屏蔽规则、订阅规则           | 「告警通知 → 规则管理」页顶部的 tab |
| 记录规则、指标视图、快捷视图 | 「数据查询 → 指标」页顶部的 tab     |
| 事件 Pipeline 的执行记录     | 「告警通知 → 工作流」页的 tab       |
| 大模型配置、技能管理         | Nightingale AI 工作区左侧的二级导航 |
| 机器列表                     | 「基础设施 → 设备列表」             |

## 行为变化：写脚本和查库的要注意[​](#行为变化写脚本和查库的要注意 "行为变化：写脚本和查库的要注意的直接链接")

| 变化                                     | 影响                                                                                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target.update_at` **不再是心跳时间**    | 心跳只写 Redis（key `n9e_meta_update_time_<ident>`），接口里要读 `beat_time`。拿 `update_at` 判离线会全部误判                                                     |
| 订阅规则的「重新定义级别 / 媒介 / 回调」 | 通知版本为新版时，保存即被清零（连「授权团队」一起）。这些语义改由订阅规则选中的通知规则表达，见[订阅规则](https://n9e.github.io/zh/docs/events/subscriptions.md) |
| 告警规则的顶层 `prom_ql`                 | 一直是空串，查询在 `rule_config.queries[].prom_ql` 里。解析规则 JSON 的脚本要按后者取                                                                             |
| `prom_for_duration`                      | 源码里标了 `Deprecated`，但它**仍是持续时长的唯一实现**，不要清掉                                                                                                 |

通知规则 + 通知媒介 + 消息模板这套三层模型**是 v8 就有的**，不是 v9 的新东西， v8 上来的配置原样保留。v9 改的是通知媒介的管理界面，不是数据模型。

## 升级后验证[​](#升级后验证 "升级后验证的直接链接")

1. **看启动日志。** 搜 `failed to migrate table`。有这行说明某张表没改成功， 多半是权限问题，按上面的 `migrate.sql` 手工补。
2. **看版本。** 「系统配置 → 关于产品」页会分别显示前端版本和后端版本，两个都该是 v9。
3. **看设备列表。** 「基础设施 → 设备列表」里机器的心跳时间在正常刷新。 不刷新先查 Redis 通不通。
4. **跑一次试运行。** 挑一条现有告警规则点[试运行](https://n9e.github.io/zh/docs/alerting/test-fire.md)， 看查询→阈值→事件→通知各段是否都通。这是一次性验证整条链路最快的办法。
5. **发一条测试通知。** 在任意通知规则上点「发送测试」，确认媒介配置没在升级中失效。

## 回退[​](#回退 "回退的直接链接")

夜莺升级**不会自动清数据**，但 AutoMigrate 加过的列不会自己撤销。回退按这个顺序：

1. 停进程；
2. 换回旧二进制，把 `etc.bak` 和 `integrations.bak` 挪回来；
3. **只有在旧版本起不来的时候**才恢复数据库备份——v9 加的列对 v8 是多余的列， v8 通常能忽略它们正常启动，恢复备份反而会丢掉升级后产生的事件和记录；
4. 起进程，强刷浏览器。

跨大版本（比如 v6 直接到 v9）官方建议逐版本升上来。这是建议不是硬限制—— `migrate.sql` 是按版本段落累加的，逐段执行比一次跳三级更好定位问题。

## 下一步[​](#下一步 "下一步的直接链接")

* 每个版本改了什么：[发布说明](https://n9e.github.io/zh/docs/help/release-notes.md)
* 哪些东西被弃用了：[弃用与生命周期](https://n9e.github.io/zh/docs/help/deprecations.md)
