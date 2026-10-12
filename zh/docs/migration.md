* [](https://n9e.github.io/zh/zh/.md)
* 迁移与对比

# 迁移与对比

从别的告警栈或从夜莺 v8 过来：什么对应什么，切换期间怎么两边并行。

## [v8 升级 v9](https://n9e.github.io/zh/zh/docs/migration/v8-to-v9.md)

[v8 升 v9 换二进制即可，表结构启动时自动迁移；但有几段新配置必须手工补上，否则新功能静默不生效，部分功能也改了位置。](https://n9e.github.io/zh/zh/docs/migration/v8-to-v9.md)

## [从 Prometheus + Alertmanager 迁移](https://n9e.github.io/zh/zh/docs/migration/from-alertmanager.md)

[Prometheus 继续负责存储和抓取；把规则、路由、静默、接收器搬成夜莺的对象。](https://n9e.github.io/zh/zh/docs/migration/from-alertmanager.md)

## [从 Zabbix 迁移](https://n9e.github.io/zh/zh/docs/migration/from-zabbix.md)

[从 Zabbix 迁移是重建而非搬迁：主机对应对象、模板对应集成、触发器对应规则，部分概念没有对应物，全程 Zabbix 不停机。](https://n9e.github.io/zh/zh/docs/migration/from-zabbix.md)

## [从 Grafana Alerting 迁移](https://n9e.github.io/zh/zh/docs/migration/from-grafana-alerting.md)

[Grafana 仪表盘留着；搬告警规则和联系点，以及统一告警的状态怎么处理。](https://n9e.github.io/zh/zh/docs/migration/from-grafana-alerting.md)

## [并行运行与回退方案](https://n9e.github.io/zh/zh/docs/migration/coexistence.md)

[切换期间两套系统跑同一批数据、对比触发结果、按媒介逐个切。](https://n9e.github.io/zh/zh/docs/migration/coexistence.md)

[上一页](https://n9e.github.io/zh/zh/docs/troubleshooting/performance.md)

[性能与积压现象](https://n9e.github.io/zh/zh/docs/troubleshooting/performance.md)

[下一页](https://n9e.github.io/zh/zh/docs/migration/v8-to-v9.md)

[v8 升级 v9](https://n9e.github.io/zh/zh/docs/migration/v8-to-v9.md)

© 2026 Nightingale Contributors · Apache-2.0

[English](https://n9e.github.io/zh/docs/migration)[简体中文](https://n9e.github.io/zh/zh/docs/migration.md)
