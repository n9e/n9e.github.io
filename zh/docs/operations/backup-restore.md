# 备份与恢复

夜莺真正不可再生的只有元数据库和 etc/ 目录，两者必须定期备份并演练恢复；内置时序库可选，指标丢了可以重新采集。

最后校对于 2026-10-10

夜莺真正不可再生的东西只有两样：**元数据库**和 `etc/` 目录。 指标可以再采，日志可以不要，配置和规则丢了得靠人一条条重建。 这页说清楚备份哪些、怎么备、以及怎么验证这份备份真的能用。

## 该备份什么[​](#该备份什么 "该备份什么的直接链接")

| 内容           | 位置                                   | 不备份的后果                             | 建议频率             |
| -------------- | -------------------------------------- | ---------------------------------------- | -------------------- |
| 元数据库       | MySQL / PostgreSQL，或 `n9e.db`        | 用户、业务组、规则、仪表盘、通知配置全没 | 每天，保留 7–30 天   |
| 配置文件       | `etc/` 目录                            | 得重新调一遍所有配置                     | 每次改动（放版本库） |
| 集成模板       | `integrations/` 目录                   | 自定义的仪表盘和规则模板丢失             | 同上                 |
| 内置时序库     | `[EmbeddedTSDB] Dir`，默认 `data/tsdb` | 历史指标丢失                             | 看你依赖它到什么程度 |
| 日志和判定记录 | `[Log] Dir`                            | 没有后果                                 | **不用备份**         |

判定记录是排障用的，本身有保留期上限、会自动清理，也会随着新的判定重新产生， 没有备份价值。

## 元数据库[​](#元数据库 "元数据库的直接链接")

绝大部分价值都在这里。

```
# MySQL

mysqldump --single-transaction --routines --triggers \

  -h mysql -u n9e -p n9e_v6 | gzip > n9e_v6-$(date +%F).sql.gz



# PostgreSQL

pg_dump -h postgres -U n9e -Fc n9e_v6 > n9e_v6-$(date +%F).dump
```

`--single-transaction` 让导出在一致的快照上进行，不用锁表。

**SQLite 只在测试环境出现**，它的备份有个专门的坑：数据不是只在 `n9e.db` 里， 还有同目录下的 `n9e.db-wal` 和 `n9e.db-shm`。**三个文件必须一起拷、一起恢复**， 只拷 `n9e.db` 会得到一个配着旧 WAL 的库。更稳的做法是停掉进程再拷。

## 配置与集成模板[​](#配置与集成模板 "配置与集成模板的直接链接")

```
tar czf n9e-etc-$(date +%F).tar.gz etc/ integrations/
```

`etc/` 里有 `config.toml`、边缘的 `etc/edge/edge.toml`、`metrics.yaml` 和通知脚本。 更好的做法是**把 `etc/` 放进版本库**，这样「什么时候改的、谁改的、改了什么」 都有记录，回滚也是一条 `git checkout`。

注意 `config.toml` 里有数据库口令，放版本库前先把凭据挪出去，见 [敏感信息管理](https://n9e.github.io/zh/docs/security/secrets.md)。

## 内置时序库[​](#内置时序库 "内置时序库的直接链接")

内置时序库**没有在线快照接口**。要留一份，只能停进程再拷目录：

```
systemctl stop n9e

tar czf n9e-tsdb-$(date +%F).tar.gz data/tsdb/

systemctl start n9e
```

运行中直接拷会拷到写了一半的数据块，恢复后可能起不来。

现实一点：如果内置时序库里存的是「看趋势用的近 15 天数据」， 停机备份不值得，丢了就丢了。如果它是你唯一的指标存储、而且丢不起， 那真正该做的不是备份它，而是**换成外部时序库**——见 [内置时序库的单 Center 限制](https://n9e.github.io/zh/docs/operations/embedded-tsdb-limits.md)。

## 恢复步骤[​](#恢复步骤 "恢复步骤的直接链接")

按这个顺序来，别跳步：

1. **停掉所有 `n9e` 进程。** 集群里每一个都要停，包括边缘的 `n9e-edge`。 还在跑的实例会往你正在恢复的库里写心跳和事件。

2. **恢复数据库。**

   ```
   gunzip < n9e_v6-2026-09-01.sql.gz | mysql -h mysql -u n9e -p n9e_v6
   ```

   **预期结果**：`select count(*) from alert_rule;` 的条数和备份时一致。

3. **恢复 `etc/` 和 `integrations/`。** 确认 `[DB] DSN` 指向的是你刚恢复的那个库。

4. **恢复内置时序库**（如果备份了、而且还在用它）：把 `data/tsdb` 拷回去。

5. **先起一个实例。** 不要一次全起。 **预期结果**：`curl --noproxy '*' http://n9e:17000/ping` 返回 `pong`， 登录后规则列表、仪表盘、通知配置都在。

6. **确认判定恢复了。** `curl --noproxy '*' http://n9e:17000/metrics | grep n9e_alert_rule_eval_total`， **预期结果**：进程启动 30 秒后这个数开始增长（启动后有 30 秒的判定延迟）。

7. **再起其余实例。** 到**系统配置 → 告警引擎**确认它们都出现了。

Redis **不需要恢复**。它存的是登录态、设备心跳时间戳和主机元信息，都有过期时间， 空着起来就行——代价是所有人要重新登录一次，设备的心跳时间要等采集器下次上报才刷新。

## 演练[​](#演练 "演练的直接链接")

没恢复过的备份不算备份。至少验证到这个程度：

* 每次备份完检查文件大小是否合理，突然变小说明导出中途失败了；
* **每季度做一次完整恢复**，恢复到一个独立的测试库和测试实例上， 按上面第 5、6 步验证到「能登录、规则在、判定在跑」；
* 演练时记录耗时。真出事的时候，「恢复要多久」是必须回答的问题。

在全新环境里从零重建的完整流程，见[灾备](https://n9e.github.io/zh/docs/operations/disaster-recovery.md)。

## 相关[​](#相关 "相关的直接链接")

* [灾备](https://n9e.github.io/zh/docs/operations/disaster-recovery.md)
* [回滚与恢复](https://n9e.github.io/zh/docs/operations/rollback.md)
* [内置时序库的单 Center 限制](https://n9e.github.io/zh/docs/operations/embedded-tsdb-limits.md)
* [上线前检查清单](https://n9e.github.io/zh/docs/get-started/production-checklist.md)
