# 用夜莺监控 PostgreSQL

用 pg\_monitor 角色的只读账号采集连接、事务、缓存命中、锁和复制状态，支持自定义业务表查询。

最后校对于 2026-10-27

PostgreSQL 插件以客户端身份连上数据库，读取 `pg_stat_*` 系列监控视图：每个库的连接数、提交和回滚、缓存命中率、死锁、临时文件，以及复制延迟。还可以配自定义查询，把业务表里的数字当指标上报。

建一个专用账号并授予 `pg_monitor` 角色就够了，只有自定义查询才需要再给对应 schema 的 SELECT。规则覆盖连接数打满、长事务、缓存命中率下降和复制延迟。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 14 个面板
* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.postgresql`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.postgresql/postgresql.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.postgresql started` 就说明插件已加载。

   ```
   # Read metrics from one or many postgresql servers

   # # collect interval

   # interval = 15



   [[instances]]

     ## specify address via a url matching:

     ##   postgres://[pqgotest[:password]]@localhost[/dbname]?sslmode=[disable|verify-ca|verify-full]

     ## or a simple string:

     ##   host=localhost user=pqgotest password=... sslmode=... dbname=app_production

     ##

     ## All connection parameters are optional.

     ##

     ## Without the dbname parameter, the driver will default to a database

     ## with the same name as the user. This dbname is just for instantiating a

     ## connection with the server and doesn't restrict the databases we are trying

     ## to grab metrics for.

     ##

     # address = "host=localhost user=postgres sslmode=disable"



     ## A custom name for the database that will be used as the "server" tag in the

     ## measurement output. If not specified, a default one generated from

     ## the connection address is used.

     # outputaddress = "db01"



     ## connection configuration.

     ## maxlifetime - specify the maximum lifetime of a connection.

     ## default is forever (0s)

     # max_lifetime = "0s"



     ## A  list of databases to explicitly ignore.  If not specified, metrics for all

     ## databases are gathered.  Do NOT use with the 'databases' option.

     # ignored_databases = ["postgres", "template0", "template1"]



     ## A list of databases to pull metrics about. If not specified, metrics for all

     ## databases are gathered.  Do NOT use with the 'ignored_databases' option.

     # databases = ["app_production", "testing"]



     ## Whether to use prepared statements when connecting to the database.

     ## This should be set to false when connecting through a PgBouncer instance

     ## with pool_mode set to transaction.

     #prepared_statements = true

     # [[instances.metrics]]

     # measurement = "sessions"

     # label_fields = [ "state" ]

     # metric_fields = [ "value" ]

     # timeout = "3s"

     # request = '''

     # SELECT COALESCE(state, 'unknown') AS state,

     #        COUNT(*)::double precision AS value

     # FROM pg_stat_activity

     # GROUP BY COALESCE(state, 'unknown')

     # '''
   ```

2. 在夜莺「集成中心」里找到 PostgreSQL，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                 | 面板数 |
| ---------------------- | ------ |
| postgresql by categraf | 14     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### posgresql读取时间过高[​](#posgresql读取时间过高 "posgresql读取时间过高的直接链接")

数据库中花费在读取文件的时间，这个值很高说明内存较小，需要频繁从磁盘读入数据文件

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(postgresql_blk_read_time[5m]) > 100
```

处置步骤:

1. 先确认 SHOW track\_io\_timing 为 on，否则该指标恒为 0，需先开启才有意义；
2. 用 pg\_stat\_statements 按 shared\_blks\_read 排序找出读盘最多的 SQL，补索引或改写；
3. 对比 shared\_buffers 与实例内存，通常设为物理内存的 25% 左右；
4. 用 iostat -x 1 确认数据目录所在磁盘是否已经打满。

### Postgresql down[​](#postgresql-down "Postgresql down的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
postgresql_up!=1
```

处置步骤:

1. 登录主机用 systemctl status postgresql 或 docker ps 确认进程是否存活；
2. 进程存活则用 psql -h \<host> -p \<port> -U \<user> 手工连一次，区分实例夯住与网络/pg\_hba 认证问题；
3. 进程不在则看 $PGDATA/log 下的日志尾部定位原因（OOM、磁盘满、WAL 目录写满）再拉起；
4. 有流复制备库的立即评估是否需要提升备库（pg\_ctl promote）。

### postgresql写入时间过高[​](#postgresql写入时间过高 "postgresql写入时间过高的直接链接")

数据库中花费在写数据文件的时间，pg中脏页一般写入page cache，如果这个值较高，则说明cache较小，操作系统的cache需要更积极的写入

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(postgresql_blk_write_time[5m]) > 100
```

处置步骤:

1. 先确认 SHOW track\_io\_timing 为 on，否则该指标恒为 0；
2. 看 pg\_stat\_bgwriter 的 buffers\_backend 是否远大于 buffers\_checkpoint——若是说明 shared\_buffers 偏小或 bgwriter 太保守；
3. 适当调大 checkpoint\_timeout 与 checkpoint\_completion\_target，把刷盘摊平避免 IO 尖峰；
4. 用 iostat -x 1 确认磁盘是否已打满，必要时换更快的存储。

### postgresql有死锁[​](#postgresql有死锁 "postgresql有死锁的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(postgresql_deadlocks[10m]) > 0
```

处置步骤:

1. 在 postgresql.conf 里确认 log\_lock\_waits=on、deadlock\_timeout 合理，然后从日志里取死锁双方的完整 SQL；
2. 查 pg\_locks 与 pg\_stat\_activity 关联，确认是哪两张表、哪种锁互相等待；
3. 根因通常是不同事务以相反顺序更新同几行——统一业务侧的加锁顺序即可消除；
4. 长事务会放大死锁概率，检查是否有事务开启后长时间不提交。

### Postgresql缓存命中率低于50%[​](#postgresql缓存命中率低于50 "Postgresql缓存命中率低于50%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(postgresql_blks_hit[5m])*100/(rate(postgresql_blks_hit[5m])+rate(postgresql_blks_read[5m])) < 50
```

处置步骤:

1. 先排除刚重启导致的缓存冷启动（对照实例 uptime）；
2. 用 pg\_stat\_statements 按 shared\_blks\_read 排序找出读盘最多的 SQL，优先补索引消除全表扫描；
3. 对比 shared\_buffers 与实例内存，通常调到物理内存的 25%；
4. 确认是否有大表全量扫描或批处理任务把缓存冲掉，可错峰执行。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[PostgreSQL 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/PostgreSQL）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/PostgreSQL%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `postgresql` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/postgresql)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
