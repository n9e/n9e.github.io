# 回滚

升级失败后回到上一版本，包括已经执行过的表结构变更该怎么处理。

最后校对于 2026-10-10

回滚二进制很简单，难的是数据库——新版本启动的那一刻就已经改过表结构了， 而且**没有反向迁移**。这页讲怎么在这个前提下把系统退回可用状态。

## 先认清一件事[​](#先认清一件事 "先认清一件事的直接链接")

`n9e` 每次启动跑的 AutoMigrate 只做加法：建缺的表、补缺的列和索引， **不会删任何东西，也不会记录「升级前长什么样」**。所以：

* 换回旧二进制之后，库里会多出一些旧版本不认识的表和列。 旧版本读表时按自己的字段读，多出来的部分被忽略，**通常能正常启动**；
* 但这只是「通常」，不是保证。新版本改过语义的列、加过非空约束的列， 都可能让旧版本在写入时报错；
* 新版本在新表里产生的数据（比如新功能的配置），旧版本看不到，也不会迁回去。

所以**升级前那份 `mysqldump` 是唯一可靠的退路**。 [升级](https://n9e.github.io/zh/docs/install/upgrade.md)里让你先备份，就是为了这一刻。

## 只回滚二进制[​](#只回滚二进制 "只回滚二进制的直接链接")

改动小、跑得不久、没动过新功能的配置时，先试这条路——它最快，也不丢数据：

```
systemctl stop n9e

cp /opt/n9e/n9e.<旧版本> /opt/n9e/n9e

rm -rf /opt/n9e/integrations && mv /opt/n9e/integrations.bak /opt/n9e/integrations

cp -a /opt/n9e/etc.bak/config.toml /opt/n9e/etc/config.toml

systemctl start n9e
```

配置文件也要一起退回去——新版本新增的配置段旧版本不认识， 虽然多余的段会被忽略，但你升级时顺手改的值可能是按新语义写的。

**预期结果**：`/api/n9e/version` 返回旧版本号；日志里没有数据库报错； 页面能登录，仪表盘和告警规则都在。

日志里出现 `Unknown column`、`Error 1364`（字段没有默认值）这类数据库错误， 说明这条路走不通，走下面那条。

## 从备份恢复数据库[​](#从备份恢复数据库 "从备份恢复数据库的直接链接")

二进制回滚不干净，或者新版本已经往新表里写了不该写的数据时，连库一起退：

```
systemctl stop n9e                     # 集群里所有实例都要停

mysql -u root -p -e "DROP DATABASE n9e_v6; CREATE DATABASE n9e_v6 DEFAULT CHARACTER SET utf8mb4;"

mysql -u root -p n9e_v6 < n9e_v6.<日期>.sql

cp /opt/n9e/n9e.<旧版本> /opt/n9e/n9e

systemctl start n9e
```

代价很直接：**备份之后产生的所有数据都没了**——这段时间新建的规则、 告警事件、通知记录、仪表盘改动。所以升级窗口越短，这个代价越小。

集群部署时务必先把所有实例都停掉再恢复，否则还活着的实例会一边写、 一边和你导入的数据打架。

## 内置时序库和执行记录[​](#内置时序库和执行记录 "内置时序库和执行记录的直接链接")

这两样不在数据库里，回滚时按自己的情况处理：

* **内置时序库**（`data/tsdb`）——数据格式在小版本之间是兼容的，回滚不用动它。 升级时如果顺手改了 `RetentionDuration` 或 `MaxBytes` 又调小了，已经被删掉的旧数据回不来；
* **判定执行记录**（`logs/evallog`）——每个实例本地的一堆文件，删了只是少一段 「当时查了什么」的记录，不影响告警。

## `n9e-cli` 不是回滚工具[​](#n9e-cli-不是回滚工具 "n9e-cli-不是回滚工具的直接链接")

发布包里的 `n9e-cli` 只有一个用途：把 v5 的数据迁移到 v6 （`n9e-cli -upgrade -config <v5 的 webapi.conf>`）。 它不做降级，也不做任何版本间的表结构回退。

## 下一步[​](#下一步 "下一步的直接链接")

* [升级](https://n9e.github.io/zh/docs/install/upgrade.md)——把备份这步做扎实，回滚就用不上
* [备份与恢复](https://n9e.github.io/zh/docs/operations/backup-restore.md)——常态化的备份策略
* [回滚与恢复](https://n9e.github.io/zh/docs/operations/rollback.md)——配置推错、元数据库损坏时怎么办
