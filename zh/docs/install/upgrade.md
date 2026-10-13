# 升级

小版本升级与 v8 → v9 跨版本升级：先备份、读数据库变更说明、再滚动替换二进制。

最后校对于 2026-10-10

夜莺的升级就是**换二进制、重启**：表结构由进程启动时自己补齐，没有单独的迁移命令要跑。 麻烦的部分在前后两头——升级前的备份，和升级后确认真的升上去了。

## 升级前[​](#升级前 "升级前的直接链接")

四样东西要留一份：

```
mysqldump -u root -p n9e_v6 > n9e_v6.$(date +%F).sql

cp -a /opt/n9e/etc /opt/n9e/etc.bak

cp -a /opt/n9e/n9e /opt/n9e/n9e.$(./n9e -version)

mv /opt/n9e/integrations /opt/n9e/integrations.bak
```

数据库是唯一不可再生的那份，其余三样只是省事。`./n9e -version` 会打印当前版本， 把它拼进备份文件名，回滚时不用猜。

再去读一遍目标版本的发布说明。跨大版本时先看 [v8 升级 v9](https://n9e.github.io/zh/docs/migration/v8-to-v9.md)，那页列了必须手工补的配置段。

## 小版本升级[​](#小版本升级 "小版本升级的直接链接")

单实例部署：

```
systemctl stop n9e

tar zxf n9e-v<新版本>-linux-amd64.tar.gz -C /opt/n9e

diff -u /opt/n9e/etc.bak/config.toml /opt/n9e/etc/config.toml

systemctl start n9e
```

三点注意：

* **`integrations/` 整个换新的，不要合并。** 里面是随版本发布的仪表盘和规则模板， 混着旧版本的文件会出现对不上的模板；
* **配置文件用 `diff` 看，不要直接覆盖。** 新版本可能加了配置段， 旧文件里没有的那些会静默地保持关闭；
* **浏览器强制刷新一次**，否则前端还在用缓存里的旧 js。

## 集群滚动升级[​](#集群滚动升级 "集群滚动升级的直接链接")

多实例部署时一台一台来，不要一起停：

1. 停第一个实例。它负责的规则会在 30 秒内被别的实例接管；
2. 换二进制、比对配置、启动；
3. 到**系统配置 → 告警引擎**确认它重新出现在列表里，心跳在走；
4. **再等一会儿**——实例启动后有一段延迟（默认 30 秒）才开始判定， 要等配置从数据库同步进内存；
5. 确认之后再动下一台。

整个过程中告警不中断，因为任一时刻都至少有一个实例在跑规则。 急着一起重启的代价是这段时间里没人判定规则。

有 `n9e-edge` 的话，边缘进程和中心一起升，不要只升中心。

## 升级后检查[​](#升级后检查 "升级后检查的直接链接")

按顺序做三件事：

```
curl -s http://127.0.0.1:17000/api/n9e/version

grep -i "failed to migrate table" /opt/n9e/logs/*.log
```

**预期结果**：版本号是新的；日志里没有迁移失败。

然后打开**系统配置 → 关于产品**，页面上的版本号应该和命令行一致：

![关于产品页](https://n9e.github.io/zh/img/docs/operations/about.zh.webp)![关于产品页](https://n9e.github.io/zh/img/docs/operations/about.zh.dark.webp)

最后确认功能没坏：随便打开一个仪表盘看图出得来、去告警事件页看新事件还在产生。 大表（`alert_his_event`、`notification_record`）的索引是**启动后异步建的**， 大库上可能要几十分钟，这期间服务照常可用，不要因为看到建索引的日志就重启。

## 下一步[​](#下一步 "下一步的直接链接")

* [回滚](https://n9e.github.io/zh/docs/install/rollback.md)——升级不顺利时怎么退回去
* [v8 升级 v9](https://n9e.github.io/zh/docs/migration/v8-to-v9.md)——跨大版本的不兼容点
* [升级与数据库迁移](https://n9e.github.io/zh/docs/operations/upgrade.md)——表结构迁移的机制
