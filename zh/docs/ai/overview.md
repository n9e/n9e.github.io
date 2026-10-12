# AI 能力与 MCP

内置助手、Skills 市场，以及一个让 Claude Code、Cursor 以你本人的权限操作夜莺的 MCP 端点。

最后校对于 2026-10-10

v9 起，`n9e` 进程自身就是一个 MCP Server。不用多部署一个组件：端点就在你已经跑着的那个进程里。

## 接入客户端[​](#接入客户端 "接入客户端的直接链接")

Claude Code、Cursor 等支持 MCP 的客户端直连 `/mcp`：

\~/.claude.json

```
{

  "mcpServers": {

    "nightingale": {

      "type": "http",

      "url": "http://127.0.0.1:17000/mcp",

      "headers": { "X-User-Token": "<your-token>" }

    }

  }

}
```

## 客户端能做什么[​](#客户端能做什么 "客户端能做什么的直接链接")

**13 个工具集共 74 个工具**——42 个读、32 个写：

`alerts` · `targets` · `datasource` · `mutes` · `busi_groups` · `notify_rules` · `alert_subscribes` · `event_pipelines` · `users` · `metrics` · `logs` · `dashboards` · `roles`

每次工具调用都带着你的 token 落到夜莺自己的 HTTP API 上，因此**客户端拿不到 token 主人看不到的 东西**——权限模型与该用户在页面上完全一致。

## 鉴权[​](#鉴权 "鉴权的直接链接")

个人 Token 或 OAuth 2.1。夜莺可以自己做授权服务器，让 Claude、ChatGPT 这类托管客户端零预注册 接入；也能作为资源服务器，对接企业既有的 Keycloak、Entra ID、Okta。

写工具默认不注册

32 个写工具要在配置里显式打开才会注册。

## Nightingale AI[​](#nightingale-ai "Nightingale AI的直接链接")

内置 AI 助手与 Skills 市场随产品发布。

## [Nightingale AI 概览](https://n9e.github.io/zh/zh/docs/ai/nightingale-ai.md)

[Nightingale AI 是内置在页面里的助手，能查告警、指标和配置并起草改动；权限与提问的人完全一致。](https://n9e.github.io/zh/zh/docs/ai/nightingale-ai.md)

## [配置大模型提供方](https://n9e.github.io/zh/zh/docs/ai/llm-provider.md)

[把夜莺指向 OpenAI 兼容、Anthropic 或自托管模型：密钥、地址与模型选择。](https://n9e.github.io/zh/zh/docs/ai/llm-provider.md)

## [Agent 与对话历史](https://n9e.github.io/zh/zh/docs/ai/agents.md)

[对话历史保存在夜莺服务端，可查看和删除；开源版的「Agent」是内部绑定，不是可以自行创建的对象。](https://n9e.github.io/zh/zh/docs/ai/agents.md)

## [安装、管理与编写 Skills](https://n9e.github.io/zh/zh/docs/ai/skills.md)

[Skill 是一份用 SKILL.md 描述的排查方法，可从市场安装或自己编写，设定可见团队后由助手在对应问题上自动调用。](https://n9e.github.io/zh/zh/docs/ai/skills.md)

## [启用 MCP 端点](https://n9e.github.io/zh/zh/docs/ai/mcp-endpoint.md)

[/mcp 端点内置在 n9e 进程里，默认开启；用 curl 列出工具清单即可确认存活，配置里可只放开部分工具集。](https://n9e.github.io/zh/zh/docs/ai/mcp-endpoint.md)

## [接入 MCP 客户端](https://n9e.github.io/zh/zh/docs/ai/mcp-clients.md)

[Claude Code、Cursor 等 MCP 客户端只需 /mcp 地址和一个 Token 即可接入；一条只读提示词就能验证连通。](https://n9e.github.io/zh/zh/docs/ai/mcp-clients.md)

## [个人 Token 认证](https://n9e.github.io/zh/zh/docs/ai/token-auth.md)

[创建 Token、放进 X-User-Token 头，并理解客户端继承的正是该用户的权限。](https://n9e.github.io/zh/zh/docs/ai/token-auth.md)

## [OAuth 2.1 与外部身份源](https://n9e.github.io/zh/zh/docs/ai/oauth.md)

[夜莺作为托管客户端的授权服务器，或作为 Keycloak、Entra ID、Okta 前面的资源服务器。](https://n9e.github.io/zh/zh/docs/ai/oauth.md)

## [读写工具集](https://n9e.github.io/zh/zh/docs/ai/toolsets.md)

[MCP 端点提供 13 个工具集共 74 个工具；六个工具集完全只读，没有删除工具，写工具需要单独开启。](https://n9e.github.io/zh/zh/docs/ai/toolsets.md)

## [安全地启用写工具](https://n9e.github.io/zh/zh/docs/ai/write-tools.md)

[MCP 写工具默认不注册；在 \[HTTP.A2A\] 配置里显式打开，可限定到某个 Token，每次改动都留在日志里可追溯。](https://n9e.github.io/zh/zh/docs/ai/write-tools.md)

## [权限继承与 RBAC](https://n9e.github.io/zh/zh/docs/ai/permissions.md)

[每次 MCP 工具调用都是以 Token 用户身份发起的内部 API 调用，客户端的权限因此与该用户完全一致，业务组边界同样生效。](https://n9e.github.io/zh/zh/docs/ai/permissions.md)

## [常见排查工作流](https://n9e.github.io/zh/zh/docs/ai/workflows.md)

[可直接粘贴的排查提示词，配上回答它们的内置 Skill：分诊活跃事件、找最吵的规则、解释一次指标尖峰。](https://n9e.github.io/zh/zh/docs/ai/workflows.md)

## [安全的自动化模式](https://n9e.github.io/zh/zh/docs/ai/automation.md)

[安全的 AI 自动化都让人留在写入那一刻：助手提议、人确认，默认只读、单账号可写，或 AI 起草脚本、人来执行。](https://n9e.github.io/zh/zh/docs/ai/automation.md)

## [A2A 端点](https://n9e.github.io/zh/zh/docs/ai/a2a.md)

[A2A 端点把夜莺暴露成可被其他 Agent 平台发现和调用的 Agent，Agent Card 声明地址与支持的方法。](https://n9e.github.io/zh/zh/docs/ai/a2a.md)

## [AI / Skill / MCP 排障](https://n9e.github.io/zh/zh/docs/ai/troubleshooting.md)

[按现象排查 AI 功能：助手不回答或半路中断、Skill 没被用上或装不上、MCP 客户端连不上——每条都能从产品日志核对。](https://n9e.github.io/zh/zh/docs/ai/troubleshooting.md)
