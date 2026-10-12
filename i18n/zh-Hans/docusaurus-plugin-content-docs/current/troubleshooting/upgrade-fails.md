---
title: "升级或数据库迁移为什么失败？"
sidebar_label: "升级或数据库迁移为什么失败？"
description: "升级后出现 Unknown column、新功能页面空白或进程卡住，都说明表结构没有完整升上去，常见于数据库权限不足或迁移中断。"
last_reviewed: 2026-10-10
---

换了新二进制，进程起来了，界面却报 `Unknown column`；或者某个新功能的页面一片空白；
或者启动之后整个进程卡住不动。这几种都指向同一件事：**表结构没有被完整地升上去。**

紧急程度看影响面：**报错只出现在某个新功能页面**，老功能都正常，可以从容修；
**登录不了、事件页打不开**，那就是核心表出了问题，先按最后一节回到一致状态。

## 进程起来了不等于迁移成功了

这是本页的地基，也是最反直觉的一条：**迁移失败是非致命的——错误只写进日志，进程照常启动。**

所以「服务起来了」完全不能作为升级成功的证据。唯一的证据是启动日志：

```bash
grep -n "failed to migrate table" /path/to/n9e.log
```

**有输出就是没升完。** 这一行长这样，冒号后面就是没升上去的那张表：

```
ERROR failed to migrate table:alert_his_event Error 1142 (42000): ALTER command denied to user 'n9e'@'%' for table 'alert_his_event'
```

顺带把这三类也一起捞出来，它们的含义各不相同：

```bash
grep -nE "failed to migrate table|failed to create index|skip index .* not migrated yet|recovered panic during" /path/to/n9e.log
```

| 日志 | 含义 | 要不要处理 |
|---|---|---|
| `failed to migrate table:<表名> ...` | 这张表没升上去 | **要**，看下面第一条根因 |
| `failed to create index ... please create it manually with an online DDL tool (gh-ost / pt-online-schema-change)` | 索引没建上，表结构本身是对的 | 要，但不紧急，见第二条 |
| `skip index <名字> on notification_record: column(...) not migrated yet, will retry on next start` | 建索引和补列是两条并行的路，这次没赶上 | **不用**，下次启动会自己补上 |
| `recovered panic during <阶段>` | 迁移过程中的 panic 被兜住了 | 要，把这段栈一起报上去 |

## 迁移是怎么发生的

**没有单独的迁移命令。** `n9e` 每次启动都跑一遍 GORM 的 AutoMigrate：
缺表就建表，缺列就加列，缺索引就建索引。它是**只增不减**的——
从不删除任何东西，也不记录改之前的样子。

由此推出三条会反复用到的结论：

1. **升级不需要你手工执行 SQL**，前提是连接数据库的那个账号有建表和改表的权限；
2. **同一个版本重启一次就会重试一次迁移**，所以一次失败之后，
   修好权限再重启往往就补齐了；
3. **没有反向迁移。** 回退二进制之后，库里会多出老版本不认识的表和列——
   老版本一般会忽略它们照常启动，但这不是保证。

`docker/sqlite.sql` 和 `docker/initsql/a-n9e.sql` 是**全新安装**用的，和升级无关。
尤其 `sqlite.sql` 还停在 v7，里面没有 `notify_rule`、`notify_channel`、
`message_template`、`event_pipeline`、`ai_llm_config` 这些表——
**这是正常的，AutoMigrate 会建。** 别拿这两个文件当表结构的标准答案。

数据库名从 v6 起就一直是 `n9e_v6`，升级不改名。

## 常见根因与确认方法

### 数据库账号没有建表 / 改表权限

这是 `failed to migrate table` 最主要的来源。很多生产库只给了应用账号增删改查，
没给 DDL。

**怎么确认**：日志里那一行的错误文本直接写着，MySQL 上是
`Error 1142 ... ALTER command denied` 或 `CREATE command denied`；
PostgreSQL 上是 `permission denied for table ...`。
也可以直接验一把：

```sql
-- 用夜莺连库的那个账号执行
SHOW GRANTS FOR CURRENT_USER();
```

**怎么修**，二选一：

- **临时给权限再重启**——给这个账号 `CREATE`、`ALTER`、`INDEX`，
  重启 `n9e` 让它自己补齐，确认日志干净之后再收回；
- **交给 DBA 手工执行**——把目标版本对应的段落从
  `docker/migratesql/migrate.sql` 里取出来给 DBA。这个文件是按版本累积的，
  一段一段来，出问题也好定位。

### 索引建不上，日志让你交给 DBA

两张大表的索引是**启动之后在后台异步建**的，大库上跑几十分钟很正常，**期间服务可用**。

| 表 | 索引 |
|---|---|
| `alert_his_event` | `idx_group_last_eval_time` |
| `notification_record` | `idx_nr_rule_created_evt`、`idx_nr_created_at` |

MySQL 上这两条是带 `ALGORITHM=INPLACE, LOCK=NONE` 显式发出去的——
**不支持在线加索引时它宁可报错，也不会悄悄退化成阻塞写入的 DDL。**
PostgreSQL 用 `CREATE INDEX CONCURRENTLY`。

**怎么确认**：日志里那句 `please create it manually with an online DDL tool`。
也可以直接查：

```sql
SHOW INDEX FROM notification_record;
SHOW INDEX FROM alert_his_event;
```

**怎么修**：照它说的，用 `gh-ost` 或 `pt-online-schema-change` 手工加。
**不加也能用**，只是事件列表和通知记录的查询会明显变慢。

PostgreSQL 上还有一个自愈行为：`CREATE INDEX CONCURRENTLY` 中途失败会留下一个
不可用的残次索引，夜莺下次启动会先把它删掉再重建，日志是
`dropping invalid index ... left behind by a failed CREATE INDEX CONCURRENTLY`。
看到这行不用管。

### 启动卡住不动

进程没退出、也没报错，日志停在迁移阶段。

**怎么确认**：到数据库上看有没有 DDL 在等锁：

```sql
SHOW PROCESSLIST;                          -- MySQL，找 "Waiting for table metadata lock"
SELECT * FROM pg_stat_activity WHERE state <> 'idle';   -- PostgreSQL
```

在很大的 `alert_his_event` 上重复发起的 `CREATE INDEX` 会一直等元数据锁，
**从而把启动挂住**。多个实例同时首次启动新版本时最容易撞上。

**怎么修**：**滚动升级，一次只起一个实例**，等它日志干净了再起下一个。
已经卡住了就先停掉多余的实例，让一个实例把索引建完。

### 配置文件是旧的，新功能默认关着

这一类不是迁移失败，但现象很像「升级没生效」：功能在，页面却是空的。

**怎么确认**：`diff` 一下，看新版本多出来哪些段落：

```bash
diff -u /opt/n9e/etc.bak/config.toml /opt/n9e/etc/config.toml
```

最典型的就是 `[EmbeddedTSDB]`——它**只存在于新版的 `etc/config.toml` 里**，
直接沿用旧配置文件就等于没开，表现为「换了二进制，内置时序库什么也没干」。

**怎么修**：把新段落逐个抄进你的配置文件，**不要用新文件整个覆盖**（那会丢掉你的定制）。
`integrations/` 目录相反：**整个换成新版的，不要合并**，
混进旧文件会得到对不上版本的仪表盘和规则模板。

### 界面版本和后端对不上

**怎么确认**：**系统配置 → 关于产品**，前端版本和后端版本是分开显示的，
两个都应该是新版本。

**怎么修**：**强制刷新浏览器**（清缓存那种）。前端 js 被缓存住是升级后最常见的假故障。

## 迁移做了一半，怎么回到一致状态

优先级从高到低，先试代价小的：

1. **修掉根因再重启一次。** 迁移每次启动都会重试，所以补上权限、腾出磁盘、
   解开表锁之后重启 `n9e`，绝大多数半截迁移会自己补齐。**这是首选**；
2. **让 DBA 手工把缺的表和列补上**，用 `docker/migratesql/migrate.sql` 里对应版本的段落，
   然后重启，确认日志里没有 `failed to migrate table`；
3. **回退二进制。** 新版加的列对老版本只是多余的，老版本一般会忽略它们正常启动。
   如果老版本报 `Unknown column` 或 `Error 1364`（字段没有默认值），这条路走不通；
4. **从备份恢复数据库。** 代价很明确：**备份之后产生的一切都会丢**——
   新写的规则、告警事件、通知记录、仪表盘改动。集群环境下要**先停掉所有实例**再恢复，
   否则活着的实例会一边写一边和你抢。

第 4 条正是升级前那份 `mysqldump` 的意义。步骤见
[回滚](../install/rollback.md)。

## 确认升级成功了

按顺序走完，每一步都有明确的预期：

1. **日志干净**：`grep "failed to migrate table" <日志>` **没有输出**；
2. **版本对**：

   ```bash
   curl -s --noproxy '*' http://127.0.0.1:17000/api/n9e/version
   ```

   再到**系统配置 → 关于产品**核对前端版本；
3. **心跳在跳**：**基础设施 → 设备列表**里主机的心跳时间在更新——
   不更新先查 Redis 连通性；
4. **端到端跑一条**：挑一条已有规则做**测试触发**，
   把查询、判定、事件、通知四段一次性验完；
5. **发一条测试通知**：在任意通知规则上点「运行测试」，确认媒介配置扛过了升级。

索引还在后台建的期间，第 4、5 步照样能过——**看到日志里在建索引不要因此重启**。

## 收集这些再去提问

1. 升级前后的**版本号**（`./n9e --version` 或 `/api/n9e/version`，前端版本在关于产品页）；
2. **完整的启动日志**，至少覆盖从启动到「开始服务」这一段；
3. `grep -nE "failed to migrate table|failed to create index|recovered panic during" <日志>` 的输出；
4. 数据库类型和版本，以及夜莺用的那个账号的 `SHOW GRANTS`；
5. `diff -u etc.bak/config.toml etc/config.toml` 的结果；
6. 部署形态：几个实例、有没有 edge、元数据库是 MySQL / PostgreSQL / SQLite。

**脱敏**：DSN 里的口令、媒介 token、大模型 API Key 一律替换；
**报错文本里的表名和列名要保留**，那就是答案。`SHOW GRANTS` 里的主机名可以打码。

## 下一步

- 升级的完整步骤：[升级](../install/upgrade.md)
- 跨大版本的断点：[v8 到 v9](../migration/v8-to-v9.md)
- 回不去的时候：[回滚](../install/rollback.md)
- 备份策略：[备份与恢复](../operations/backup-restore.md)
- 升完之后要监控什么：[监控夜莺自身](../operations/self-monitoring.md)
