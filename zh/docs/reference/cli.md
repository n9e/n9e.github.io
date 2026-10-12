# 命令行

夜莺的命令行很薄：n9e、n9e-edge 等进程只有三个参数，配置全在 etc/ 的 toml 文件里，没有管理规则的子命令。

夜莺的命令行**很薄**——配置都在 `etc/` 的 toml 文件里，参数只有三个。 没有「用命令行管理告警规则」这类子命令，那些事走 [HTTP API](https://n9e.github.io/zh/zh/docs/reference/http-api.md)。

## 四个服务进程[​](#四个服务进程 "四个服务进程的直接链接")

`n9e`（Center）、`n9e-alert`、`n9e-pushgw`、`n9e-edge` 参数完全一样：

| 参数                 | 说明                                     | 默认  |
| -------------------- | ---------------------------------------- | ----- |
| `--configs <dir>`    | 配置目录。也可以用环境变量 `N9E_CONFIGS` | `etc` |
| `--crypto-key <key>` | 配置文件里加密字段的解密密钥             | 空    |
| `--version`          | 打印版本号后退出                         |       |

```
./n9e --configs /etc/n9e

N9E_CONFIGS=/etc/n9e ./n9e

./n9e --version
```

进程只依赖二进制同级目录的 `etc/` 和 `integrations/`，别的都不是必需的。

## `n9e-cli` 不是运维工具[​](#n9e-cli-不是运维工具 "n9e-cli-不是运维工具的直接链接")

发布包里的 `n9e-cli` **只做一件事：把 v5 的配置迁移到 v6**。

| 参数              | 说明                       |
| ----------------- | -------------------------- |
| `--config <path>` | v5.x 的 `webapi.conf` 路径 |
| `--upgrade`       | 执行迁移                   |
| `--version`       | 打印版本号                 |

现在还在用 v5 的话它有用，否则用不上它。

## 从源码构建[​](#从源码构建 "从源码构建的直接链接")

```
make            # 下载并嵌入前端，然后构建 center

make build      # 只构建 center（前端已经嵌好时用这个）

make build-edge

make build-alert

make build-pushgw

make build-cli
```

`make` 的第一步会跑 `fe.sh`：它把 `docker/initsql/a-n9e.sql` 拷成 `n9e.sql`， **只有 `./pub` 目录不存在时**才去 GitHub 下前端包，然后用 `statik` 把 `pub/` 嵌进 `front/statik`。 所以本地放好 `pub/` 就不会联网下载。

## 相关[​](#相关 "相关的直接链接")

* [配置项](https://n9e.github.io/zh/zh/docs/reference/configuration.md)
* [HTTP API](https://n9e.github.io/zh/zh/docs/reference/http-api.md)
* [二进制包安装](https://n9e.github.io/zh/zh/docs/install/binary.md)
