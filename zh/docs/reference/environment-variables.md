# 环境变量

夜莺读的环境变量，以及为什么配置项本身不能用环境变量覆盖。

**先说清楚一件事：夜莺没有「用环境变量覆盖任意配置项」的机制。** 没有 `N9E_DB_DSN` 这种东西。配置的唯一来源是 `etc/` 下的 toml 文件。

容器化部署时的做法是**挂载配置文件**，不是堆环境变量—— compose 方案就是这么做的（`./etc-nightingale:/app/etc`）。

## 夜莺读的环境变量[​](#夜莺读的环境变量 "夜莺读的环境变量的直接链接")

| 变量                           | 作用                                        | 默认       |
| ------------------------------ | ------------------------------------------- | ---------- |
| `N9E_CONFIGS`                  | Center 的配置目录，等价于 `--configs`       | `etc`      |
| `N9E_ALERT_CONFIGS`            | `n9e-alert` 的配置目录                      | `etc`      |
| `N9E_PUSHGW_CONFIGS`           | `n9e-pushgw` 的配置目录                     | `etc`      |
| `N9E_EDGE_CONFIGS`             | `n9e-edge` 的配置目录                       | `etc/edge` |
| `N9E_PROXY_URL`                | 出向 HTTP 请求走的代理                      | 空         |
| `N9E_GRAFANA_IMPORT_ALLOWLIST` | 从 Grafana 导入时允许连接的地址白名单       | 空         |
| `N9E_SKILL_GATEWAY`            | Skill 沙箱的出网网关 socket（Linux 沙箱用） | 空         |

## compose 方案里出现的环境变量[​](#compose-方案里出现的环境变量 "compose 方案里出现的环境变量的直接链接")

这些是**给别的容器用的**，不是夜莺自己读的，看 compose 文件时别搞混：

| 变量                                                             | 属于谁                        |
| ---------------------------------------------------------------- | ----------------------------- |
| `MYSQL_ROOT_PASSWORD`                                            | mysql 容器                    |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `PGDATA` | postgres 容器                 |
| `WAIT_HOSTS`                                                     | 等待依赖就绪的启动脚本        |
| `HOST_PROC` / `HOST_SYS` / `HOST_MOUNT_PREFIX`                   | categraf 容器，用来采集宿主机 |
| `GIN_MODE` / `TZ`                                                | 通用                          |

## 想按环境改配置怎么办[​](#想按环境改配置怎么办 "想按环境改配置怎么办的直接链接")

三种做法，按推荐程度排：

1. **每个环境一份配置文件**，用 `N9E_CONFIGS` 或 `--configs` 指到对应目录。 最直白，也最好审计。
2. **配置模板 + 启动时渲染**：在容器的 entrypoint 里用 envsubst 之类把变量填进 toml， 然后再启动进程。
3. **加密字段**：敏感值用 `--crypto-key` 对应的密钥加密后存在配置文件里， 密钥本身走环境变量或密钥管理系统。见[凭据管理](https://n9e.github.io/zh/zh/docs/security/secrets.md)。

## 相关[​](#相关 "相关的直接链接")

* [配置项](https://n9e.github.io/zh/zh/docs/reference/configuration.md)
* [命令行](https://n9e.github.io/zh/zh/docs/reference/cli.md)
* [Docker Compose](https://n9e.github.io/zh/zh/docs/install/docker-compose.md)
