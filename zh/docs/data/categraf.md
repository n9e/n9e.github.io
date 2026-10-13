* [](https://n9e.github.io/zh/index.md)
* [接入数据](https://n9e.github.io/zh/docs/data/overview.md)
* Categraf

# Categraf 采集器

推荐的采集器：一个 agent、100+ 输入插件，按 Prometheus Remote Write 推送。

## [安装与注册](https://n9e.github.io/zh/docs/data/categraf/install.md)

[安装 agent、填夜莺的写入地址、确认主机出现在对象列表里。](https://n9e.github.io/zh/docs/data/categraf/install.md)

## [输入插件](https://n9e.github.io/zh/docs/data/categraf/plugins.md)

[Categraf 内置 90 多个输入插件；每个插件一个 conf/input.<名> 目录，放入配置即启用，可在前台单独跑一个来验证。](https://n9e.github.io/zh/docs/data/categraf/plugins.md)

## [Remote Write](https://n9e.github.io/zh/docs/data/categraf/remote-write.md)

[Categraf 攒批后按 Prometheus Remote Write 发出指标，可配多个写入目标同时写夜莺和另一个后端；写失败不重试。](https://n9e.github.io/zh/docs/data/categraf/remote-write.md)

## [对象与心跳](https://n9e.github.io/zh/docs/data/categraf/targets.md)

[Categraf 每 10 秒向夜莺发一次心跳，带上主机元信息完成注册；设备列表据此显示状态和标签，主机要手动归入业务组。](https://n9e.github.io/zh/docs/data/categraf/targets.md)

## [排障](https://n9e.github.io/zh/docs/data/categraf/troubleshooting.md)

[Categraf 的问题按现象分三类：主机不出现、主机在但没指标、某个插件没数据；答案几乎都在日志里，包括不以 E! 标记的错误。](https://n9e.github.io/zh/docs/data/categraf/troubleshooting.md)

[上一页](https://n9e.github.io/zh/docs/data/sql-databases.md)

[MySQL / PostgreSQL / TDengine](https://n9e.github.io/zh/docs/data/sql-databases.md)

[下一页](https://n9e.github.io/zh/docs/data/categraf/install.md)

[安装与注册](https://n9e.github.io/zh/docs/data/categraf/install.md)

© 2026 Nightingale Contributors · Apache-2.0

[English](https://n9e.github.io/zh/docs/data/categraf)[简体中文](https://n9e.github.io/zh/docs/data/categraf.md)
