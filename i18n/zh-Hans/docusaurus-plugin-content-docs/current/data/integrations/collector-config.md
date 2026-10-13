---
title: "安装采集配置"
sidebar_label: "安装采集配置"
description: "把模板里的采集配置放进 Categraf，开始采集该组件的指标。"
last_reviewed: 2026-10-10
---

import { figures } from '@site/src/data/figures';

这页办完你会得到：目标机器上多了一个 `conf/input.<插件>/<插件>.toml`，
Categraf 开始采集这个组件的指标，并且你已经确认指标到了夜莺。

前提是目标机器上**已经装好 Categraf**——还没装先看
[安装与注册](../categraf/install.md)。夜莺本身不采集任何东西，
它只是告诉你该往 Categraf 里放什么。

## 两条路

开源版有两条路，选一条就行：

| | 采集向导 | 模板中心的采集说明 |
|---|---|---|
| 入口 | **基础设施 → 设备列表 → 配置采集** | **集成中心 → 模板中心 → 选组件 → 采集说明** |
| 覆盖 | 55 个常见组件 | {figures.integrations} 个组件 |
| 怎么落到机器上 | 生成一条命令，你去机器上执行 | 你自己创建配置文件、粘贴、重启 |
| 适合 | 常见组件、要在多台机器上重复做 | 向导没覆盖的组件、要深度定制 |

## 路线一：采集向导

**基础设施 → 设备列表**，右上角点 **配置采集**。向导四步：

**1. 选择组件。** 按分类筛（全部 / 数据库 / 中间件 / Web 服务 / 网络探测 / 主机进程 / 其他）
或直接搜。以 MySQL 为例，点中 MySQL 那张卡片。

**2. 填写参数。** 两种模式：

- **表单模式**：一格一格填。MySQL 要填的是**地址**（必填）、用户名、密码、
  是否采集额外的 status 指标、以及**实例标签**——最后这个很关键，
  它会作为 `instance` 标签挂到这个实例的每一条指标上，内置仪表盘依赖它，所以要**全局唯一**；
- **编辑 toml**：直接改生成出来的配置。切回表单模式会丢弃这里的手工修改。

**采集间隔（秒）** 留空就用全局默认的 15 秒。同一个组件有多个实例（比如三个 MySQL），
点 **添加实例** 加一组，不用建三份配置。

右边一直有「生成的配置预览」，能看到最终写进去的 toml 长什么样。

**3. 执行命令。** 向导给出一条命令，形如：

```bash
curl -sSfL 'http://<夜莺地址>/api/n9e/agents/categraf/collect.sh' \
  | sudo bash -s -- --input 'mysql' --conf-b64 '<base64 编码的配置>'
```

**在目标机器上以 root 权限执行**，同一份命令可以在多台机器上重复执行。

不放心直接 pipe 给 bash 的，向导也给了分步版本：先 `curl -o collect-config.sh` 下载，
`less` 看一眼，再 `sudo bash collect-config.sh --input ... --conf-b64 ...`。

命令里内嵌了 base64 编码的完整配置，**里面可能有密码，别在不可信渠道传播**。

**4. 验证数据。** 向导会盯着一个哨兵指标，每 5 秒查一次，命令执行后通常 1 分钟内出现。
详见[验证数据到达](./verify.md)。

## 路线二：模板中心的采集说明

**集成中心 → 模板中心**，点开一个组件的卡片，第一个页签就是 **采集说明**。

这是一段 Markdown，讲清楚这个组件该怎么采：要改 Categraf 的哪个文件、
配置项什么意思、依赖什么前置条件。以 MySQL 为例，它直接告诉你要写
`conf/input.mysql/mysql.toml`，并给出可以整段复制的配置：

```toml
[[instances]]
address = "127.0.0.1:3306"
username = "root"
password = "1234"

# 想抓更多 global status 指标就打开
extra_status_metrics = true
# 主从状态比较关键，默认采集
gather_slave_status = true

# 给实例一个全局唯一的标识，附到每条指标上
labels = { instance="n9e-10.2.3.4:3306" }
```

照着做三步：

1. 在 Categraf 目录下建 `conf/input.mysql/mysql.toml`，把配置粘进去、改成你的地址和账号；
2. 先试采一次，确认配置和连通性都对：
   ```bash
   ./categraf --test --inputs mysql
   ```
3. 重启 Categraf 让配置生效。

采集说明是**给人读的文档，不是下发到 agent 的配置**——开源版不会替你把它推到机器上，
落地这一步得你自己做（或者走上面的向导）。

页面上那个「编辑」按钮，对内置的 {figures.integrations} 个组件不生效：内置组件的说明以夜莺自带的
`integrations` 目录为准，编辑不会被保存。

## 命令做了什么

向导那条命令不是黑盒，它做三件事：

1. 写入 `conf/input.<插件>/<插件>.toml`，**原文件会自动备份**；
2. 用 `categraf --test` 试采一次，试采不过就不生效；
3. 试采通过后重启 Categraf。

也就是说，配置写错的时候它会在第 2 步停下来，不会把一个跑不起来的配置留给你。

## 下一步

- 把这个组件的仪表盘和规则一起装上：[导入仪表盘与规则](./import.md)
- 确认指标真的到了：[验证数据到达](./verify.md)
- 手写插件配置的细节：[输入插件](../categraf/plugins.md)
- 数据没来：[Categraf 排障](../categraf/troubleshooting.md)
