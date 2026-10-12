---
title: "集成模板清单与结构"
sidebar_label: "集成模板结构"
description: "集成模板的文件结构，照着就能自己写一个并贡献回来。"
last_reviewed: 2026-10-10
---

集成模板就是「一个组件的成套监控配置」：采集配置 + 仪表盘 + 告警规则 + 指标说明。
夜莺自带 **88 个**，在源码仓库的 `integrations/` 目录下，进程启动时加载到模板中心。

想给一个还没覆盖的组件做一套，照着这个结构建目录、提 PR 就行。

## 目录结构

一个组件一个目录，目录名就是模板中心里显示的名字：

```
integrations/MySQL/
├── icon/
│   └── mysql.png              图标，模板中心的卡片用
├── markdown/
│   ├── README.md              采集说明（中文）
│   ├── README.en_US.md        采集说明（英文）
│   └── mysql.md               补充文档，可有多份
├── collect/
│   └── *.toml                 Categraf 的采集配置样例
├── dashboards/
│   └── *.json                 仪表盘，可以有多份
├── alerts/
│   └── *.json                 告警规则，可以有多份
├── metrics/
│   └── *.json                 指标说明，进「指标视图」
└── i18n/
    └── en_US.json             文案翻译
```

每一层都是可选的——只有仪表盘没有告警规则也能贡献。

## 各部分的格式

**`dashboards/*.json`** 就是仪表盘的导出格式。做法是在界面上画好，导出，放进来。

**`alerts/*.json`** 是告警规则的导出格式，可以是单条对象，也可以是数组。
关键字段：`name`、`cate`、`prod`、`severity`、`rule_config`（v6 之后查询写在这里面的
`queries` 数组里，顶层 `prom_ql` 留空）、`prom_eval_interval`、`prom_for_duration`、
`append_tags`、`annotations`。完整字段见[告警规则的导入导出](../alerting/import-export.md)。

**`metrics/*.json`** 是「这个组件会产出哪些指标、各是什么意思」，
进产品里的**指标视图**。内置的一共 1300 多条。

**`collect/*.toml`** 是 Categraf 的采集配置样例。
注意：这些文件在开源版里**只被 AI 的文档索引用到**，
设备列表里的采集向导用的是另一套前端目录 + `public/n9e-collect-templates/*.toml`。

**`i18n/en_US.json`** 是键值对翻译，键是中文原文，值是英文。
`GET /api/n9e/builtin-payloads` 会按请求的 `X-Language` 头返回对应语言的名字。

## 加载时机

`n9e` 进程启动时从二进制同级的 `integrations/` 目录加载。**改完要重启进程**才能看到。

数据库里也可以有用户自建的模板（在模板中心里手动创建的），
和文件里的会合并展示；同名时**数据库里的那份覆盖文件里的**。

## 贡献

在 [ccfos/nightingale](https://github.com/ccfos/nightingale) 仓库的 `integrations/` 下加目录、提 PR。
建议先在自己的环境里把整套跑通再提——仪表盘能出图、规则能触发，别只提 JSON。

## 相关

- [导入仪表盘与规则](../data/integrations/import.md)
- [安装采集配置](../data/integrations/collector-config.md)
- [告警规则的导入导出](../alerting/import-export.md)
