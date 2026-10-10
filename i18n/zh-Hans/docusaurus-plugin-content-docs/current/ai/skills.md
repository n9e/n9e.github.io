---
title: "安装、管理与编写 Skills"
sidebar_label: "安装、管理与编写 Skills"
description: "Skill 是一份用 SKILL.md 描述的排查方法，可从市场安装或自己编写，设定可见团队后由助手在对应问题上自动调用。"
---

这页办完你会得到：团队自己的排障方法被装成一个 Skill，可见范围给对了人，
并且别人问到对应问题时它能稳定被命中。

## Skill 是什么

一个 Skill 就是一个带 `SKILL.md` 的目录：YAML frontmatter + Markdown 正文。
助手**不会**把所有 Skill 都塞进每一次提问。它先看一份「名字 + 描述」的目录，
根据描述判断这次用不用得上，用得上才把正文加载进来。
所以**描述是最重要的字段**——命中与否就靠它。

于是 Skill 就是资深工程师方法论的落点：「MySQL 主从延迟告警来了，先看 `pt-heartbeat`，
再看复制线程，最后才看 binlog 大小。」写一次，之后所有人提问都按这个走。

Skill 不是模型，也不是工具。模型来自[配置大模型提供方](./llm-provider.md)，
工具是产品自带的。

## 页面在哪

**Nightingale AI → Skill 管理**，地址 `/nightingale-ai/skills`，老地址 `/ai-config/skills`
会跳过来。页面由权限点 `/ai-config/skills` 把守，**内置角色里只有 `Admin` 带这个点**——
别人要用，就在**人员组织 → 角色管理**里给自定义角色勾上。

<Shot src="/img/docs/ai/skills.zh" alt="Skill 管理" />

左边是一棵树：一个 Skill 一个节点，展开是它的文件。**产品内置了 22 个 Skill**，
带**内置**标签——覆盖告警规则不触发的排查、主机健康与上线诊断、仪表盘分析与创建、
PromQL 和 SQL 生成、通知模板编写、Prometheus 规则导入、自愈脚本编写等等。
它们的每个文件都能打开来看，但下载不了也删不掉。
同时它们也是写自己 Skill 时最好的范例。

右边是选中文件的渲染结果，顶部有启用开关和一个三点菜单（修改 / 替换、下载、删除）。
关掉的 Skill 会挂一个 `OFF` 标签，任何时候都不会被考虑。

## 三种添加方式

三种都在搜索框旁边的 `+` 按钮里。

### 在线创建 Skill

**在线创建 Skill** 打开一个表单：名称、描述、提示词指令，外加一段高级设置
（许可证、兼容性、预授权工具、元数据）。适合纯文字的方法论，没有附带文件。

名字用 kebab-case——`mysql-replication-lag`、`promql-helper`——因为这个名字同时也是
模型看到的标识符。

预期结果：树里多一个节点，处于启用状态，没有**内置**标签。

### 本地上传压缩包

**本地上传 Skill** 接受 `.zip` 或 `.tar.gz`，上限 10 MB。`SKILL.md` 必须在压缩包的
**根目录**（多包一层目录会被自动拆掉），旁边的其它文件会一起带进来——参考文档、
数据文件、脚本都行。

这套格式和
[Anthropic 的 Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/getting-started)
是同一套，所以为那个生态写的 Skill 打包上传即可，不用改。

预期结果：树节点展开后能看到 `SKILL.md` 和每一个附带文件。
如果报 `SKILL.md not found in archive root`，说明你多压了一层。

### 远程安装 Skill

**远程安装 Skill** 指向一个 http/https 仓库——**不支持 ssh 地址**——填引用类型
（分支 / 标签 / commit）、引用本身、仓库里放了多个 Skill 时的子目录，以及可选的凭据。

私有仓库选 token 认证，粘贴一个 personal access token。像 GitLab Deploy Token 这种
还需要用户名的凭据，写成 `用户名:令牌`。Token 会用 `[HTTP.RSA]` 的密钥加密存储，
所以那对密钥要先配好。

从 Git 装的 Skill 会和它的引用做比对，远端往前走了就挂一个**可更新**标签。
详情页上的**更新**按钮会重新拉取并覆盖内容——本地改动会丢，这正是它的用意：
仓库才是唯一事实源。

## SKILL.md 里写什么

```markdown
---
name: mysql-replication-lag
description: 诊断 MySQL 主从延迟告警。用户提到 seconds_behind_master、复制延迟、
  备库落后，或者贴出「MySQL 主从延迟」这类告警时使用。
license: Apache-2.0
compatibility: 需要夜莺里已注册 MySQL 数据源
allowed-tools: Bash(mysql:*) Read
max_iterations: 20
builtin_tools:
  - query_prometheus
  - search_active_alerts
---

# MySQL 主从延迟

## 1. 先确认延迟是真的
...
```

| 键 | 作用 |
|---|---|
| `name` | 必填。为空或缺失，整个 Skill 会被拒绝 |
| `description` | 命中判断就看它。用用户会说的话写 |
| `license`、`compatibility`、`metadata` | 显示在详情页；前置条件写在 `compatibility` 里 |
| `allowed-tools` | 空格分隔的预授权工具列表，例如 `Bash(git:*) Read` |
| `builtin_tools` | 这个 Skill 被加载后，往模型的工具表里追加哪些产品内置工具 |
| `max_iterations` | 诊断链很长时抬高工具调用次数上限，基线是 25 |

`version:` **不是**支持的键——有几个内置 Skill 里带着它，但会被静默丢掉，别依赖它。
`tags`、`examples`、`recommended_tools` 在压缩包和 Git 安装路径上会被读取，
但在线表单创建的 Skill 不会保存这几个。

## 可见范围与管理团队

每个 Skill 都有**管理团队**和**可见范围**（全员可见 / 仅管理团队可见）。
管理团队是必填项：它决定谁能改这个 Skill；对私有 Skill 来说，还决定谁能看见它。

私有 Skill 会从目录里对团队之外的人整个摘掉——模型根本不知道它存在，
既叫不出名字也加载不了。

还有一个地方你的 Skill 永远不会出现：A2A 的 Agent Card 只公布内置 Skill，
所以第三方 Agent 发现夜莺时看到的是内置那批，不含你自己写的。
但它仍然能受益，因为问题命中时 Skill 是在服务端加载的——见 [A2A 端点](./a2a.md)。

## 会跑脚本的 Skill

一个 Skill 可以在 `SKILL.md` 旁边放一个 `main.py` 或 `main.sh`，模型能把它跑起来。
有两条边界，装别人写的 Skill 之前都得知道。

**第一：模型只有在 Skill 主动要的时候才拿得到执行器。** 执行脚本的工具叫
`run_skill_script`，只有被加载的 Skill 在 `builtin_tools` 里列了它，模型才调得到。
22 个内置 Skill 里只有一个列了。

**第二：真隔离只在 Linux 上有，而且要你自己搭。** 沙箱优先用 bubblewrap 加一份
python-base 根文件系统。搭不起来的时候——任何非 Linux 主机，以及没提供根文件系统的
Linux 主机——它会退化成**直接在夜莺所在主机上跑脚本**，并在启动日志里明说：

```
sandbox: SKILL EXECUTION RUNNING WITHOUT ISOLATION (unsafe-exec) — install bubblewrap
+ a python-base rootfs for real isolation, or set Sandbox.RequireIsolation=true to
refuse. reason: ... (tier=..., os=..., kernel=...)
```

在启动日志里 grep 一下这行。如果它在，那么每一个装进来的 Skill 都要当成
「以夜莺进程的身份运行的代码」来看待。会安装第三方 Skill 的服务器，安全姿势是
**宁可拒绝也不要降级**。这一节 `etc/config.toml` 里没有，自己加：

```toml
[Center.Sandbox]
RequireIsolation = true

# Linux 上把这个指向一份 python-base 根文件系统，拿到的就是真隔离，
# 而不是拒绝执行：
[Center.Sandbox.Rootfs]
Path = "/opt/n9e/sandbox/python-base"
```

重启 center。之后 Skill 脚本会被拒绝执行，而不是裸跑。隔离真的生效时，
脚本拿到的是只读挂载的 Skill 目录和输入、一个可写的临时目录、一份干净的环境变量，
以及默认 30 秒、256 MB、一个 CPU 的额度。而在 `unsafe-exec` 下脚本**没有网络**，
因为没有沙箱就没法强制出网代理。

每次执行都有日志：`sandbox audit: exec_id=... engine=... network=... exit_code=...`，
对话里的回答也会写明这次是在什么隔离级别下跑的。

## 让它真的被用上

最常见的抱怨——「我写了个 Skill，也启用了，助手就是不理它」——几乎总是描述的问题。

- **用用户的话写描述，不是用你的话。** 把别人真的会打出来的说法列进去，
  包括他们会粘贴进来的告警名和报错串。
- **也写清楚什么时候不该用它。** 内置 Skill 就是这么干的：`alert-rule-troubleshoot`
  明确指出另一类问题该找 `ops-troubleshooting`。
- **一个 Skill 一个主题。** 几个描述长得差不多的 Skill 会同时命中、同时被加载、
  同时吃上下文。
- **在对话里试一遍**再调：没被命中就改描述，命中了但做得不对就改指令。

## 下一步

- 模型从哪来：[配置大模型提供方](./llm-provider.md)
- 助手拿 Skill 做什么：[Nightingale AI 概览](./nightingale-ai.md)
- 一切会改状态的动作的护栏：[安全的自动化模式](./automation.md)
