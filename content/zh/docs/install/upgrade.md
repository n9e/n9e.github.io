---
title: "升级"
description: "夜莺监控（Nightingale）不同版本如何升级，应该注意什么，应该替换哪些文件"
lead: ""
date: 2025-06-17T15:57:36.444+08:00
lastmod: 2025-06-17T15:57:36.444+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 200
toc: true
---

V6、V7、以及 V8 各个小版本之间的升级，方法相同。

## 升级步骤

1. **备份数据**：在升级之前，备份 MySQL 数据库的内容、备份二进制、备份 `etc` 和 `integrations` 目录，以防万一，有了后路之后就可以放心大胆操作了
2. 如果是二进制部署，替换二进制、替换 integrations 目录（可以直接把老的 integrations 目录挪走 `mv integrations integrations.bak`，直接使用新的 integrations 目录），配置文件可以 diff 一下新老配置，手工补齐一下差异点（实际上应该几乎不用修改配置文件，因为已经很久没有调整过了）
3. 如果是容器部署的，拉取一下最新的镜像，配置文件 diff 一下，补齐差异点，再重启一下容器即可
4. 重新访问夜莺的时候，强制刷新一下浏览器，以防止浏览器缓存了旧的 js、css 文件


## 关于 DB 表结构

如果夜莺所用的 DB 账号是有建表、改表权限的话，您不需要手动去修改 DB 表结构，夜莺会在启动时自动检查表结构是否需要升级，如果需要升级，则会自动改表。如果夜莺所用的 DB 账号没有建表、改表权限，则需要手工调整，近期的改动可以参考 [migrate.sql](https://github.com/ccfos/nightingale/blob/main/docker/migratesql/migrate.sql)。如果自动改表失败，请提 [issue](https://github.com/ccfos/nightingale/issues)，我们会尽快跟进。

理论上数据库同时支持 MySQL 和 Postgres，不过社区缺少 Postgres 的长期贡献者，所以建议优先使用 MySQL。

## FAQ

### Docker 镜像如何使用老版本

可以到 [Docker Hub](https://hub.docker.com/r/flashcatcloud/nightingale/tags) 上选择需要的 Tag 自行 pull，然后在 docker-compose.yml 里指定对应的 Tag 即可。
