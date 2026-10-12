# 配置文件布局

配置是一个目录：config.toml 供 n9e、alert、pushgw 读取，etc/edge 供 n9e-edge 读取；环境变量只填空缺，不覆盖已有配置。

夜莺的配置是**一个目录**，不是一个文件。搞清楚目录怎么加载、环境变量什么时候管用， 能省掉一整类「改了配置没生效」的排查。

## 配置目录在哪[​](#配置目录在哪 "配置目录在哪的直接链接")

默认是二进制同级的 `etc/`：

```
etc/

├── config.toml        # n9e / n9e-alert / n9e-pushgw 读这个

├── metrics.yaml       # 内置指标释义，被 [Center] MetricsYamlFile 指向

├── edge/

│   └── edge.toml      # n9e-edge 读这个

└── script/            # 通知脚本示例
```

换个位置用 `--configs`，或者对应的环境变量：

```
./n9e --configs /etc/n9e

N9E_CONFIGS=/etc/n9e ./n9e
```

| 进程         | 参数默认值 | 环境变量             |
| ------------ | ---------- | -------------------- |
| `n9e`        | `etc`      | `N9E_CONFIGS`        |
| `n9e-edge`   | `etc`      | `N9E_EDGE_CONFIGS`   |
| `n9e-alert`  | `etc`      | `N9E_ALERT_CONFIGS`  |
| `n9e-pushgw` | `etc`      | `N9E_PUSHGW_CONFIGS` |

`n9e-edge` 的默认值也是 `etc`，而 `etc` 里放的是**中心端**的 `config.toml`， 所以启动边缘进程必须显式写 `--configs etc/edge`。写成 `--configs etc/edge/edge.toml`（指到文件）同样不对——参数要的是目录。

## 目录是怎么加载的[​](#目录是怎么加载的 "目录是怎么加载的的直接链接")

进程把配置目录下**所有** `.toml` 文件按文件名顺序拼接成一份，再整体解析； `.json` 和 `.yaml` 也会被读进来。这带来两个后果：

* 想把口令从主配置里拆出去，直接放一个 `etc/secret.toml` 就行，不用改任何东西；
* 往 `etc/` 里丢一份备份 `config.toml.bak` 无所谓（后缀不是 `.toml`）， 但丢一份 `config.bak.toml` 会被当成正式配置合并进去。

`etc/edge/` 是 `etc/` 的子目录，不会被中心进程加载——目录扫描不递归。

## 环境变量只填空，不覆盖[​](#环境变量只填空不覆盖 "环境变量只填空，不覆盖的直接链接")

配置项确实能用环境变量给，命名是 `CONFIGTYPE_<段名>_<键名>`，全大写：

```
CONFIGTYPE_HTTP_PORT=17001

CONFIGTYPE_DB_DSN="n9e:<password>@tcp(mysql:3306)/n9e_v6?parseTime=True"

CONFIGTYPE_REDIS_ADDRESS=redis:6379
```

文件优先级高于环境变量

加载顺序是「默认值 → 环境变量 → 配置文件」，**后面的覆盖前面的**。 所以某个键在 `config.toml` 里写着，环境变量就完全不起作用。 发布包里的 `config.toml` 几乎把每个键都显式写出来了，也就是说： **环境变量默认全都是哑弹**，除非你先把文件里对应的那行注释掉。

判断一个环境变量有没有生效，最直接的办法是把文件里那行注释掉再启动，看日志里的实际取值。

不受这条限制的是另外两组变量，它们不走配置加载器：上面那张表里的 `N9E_*_CONFIGS`， 以及容器镜像用的 `WAIT_HOSTS` / `WAIT_TIMEOUT`（启动前等依赖端口通，compose 编排靠它排序）。

## 各段是干什么的[​](#各段是干什么的 "各段是干什么的的直接链接")

| 段                                                         | 管什么                                                    | 谁读                 |
| ---------------------------------------------------------- | --------------------------------------------------------- | -------------------- |
| `[Global]`                                                 | 运行模式                                                  | 全部                 |
| `[Log]`                                                    | 日志目录、级别、轮转                                      | 全部                 |
| `[HTTP]`                                                   | 监听地址端口、TLS 证书、超时、`/metrics` 开关             | 全部                 |
| `[HTTP.APIForAgent]`                                       | 采集器用的接口（心跳、写入）开关与鉴权                    | Center、Edge         |
| `[HTTP.APIForService]`                                     | 服务间接口（边缘回传、执行记录转发）开关与鉴权            | Center、Edge         |
| `[HTTP.JWTAuth]` / `[HTTP.ProxyAuth]` / `[HTTP.TokenAuth]` | 三种认证方式                                              | Center               |
| `[DB]`                                                     | 元数据库                                                  | 全部                 |
| `[Redis]`                                                  | Redis                                                     | 全部                 |
| `[Center]`                                                 | 指标释义文件、匿名访问、历史事件保留天数                  | Center               |
| `[Alert]`                                                  | 告警引擎心跳、引擎集群名、判定执行记录                    | Center、Alert、Edge  |
| `[Pushgw]`                                                 | 数据接收与转发，`[[Pushgw.Writers]]` 是外部时序库写入地址 | Center、Pushgw、Edge |
| `[EmbeddedTSDB]`                                           | 内置时序库                                                | **只有 Center**      |
| `[Ibex]`                                                   | 自愈任务的 RPC 监听                                       | Center、Edge         |
| `[CenterApi]`                                              | 中心端地址与凭据（只在 `edge.toml` 里）                   | Edge                 |

每个键的默认值和说明见[配置项](https://n9e.github.io/zh/zh/docs/reference/configuration.md)。

## 口令不要写明文[​](#口令不要写明文 "口令不要写明文的直接链接")

`[DB] DSN`、`[Redis] Password`、各处 BasicAuth 口令、`[[Pushgw.Writers]] BasicAuthPass`、 `[EmbeddedTSDB] BasicAuthPass` 都支持密文：值写成 `{{cipher}}<密文>`， 启动时用 `--crypto-key` 给出密钥。

```
./n9e --crypto-key '<your-key>'
```

没有 `{{cipher}}` 前缀的值按明文处理，所以可以逐个迁移。 更完整的做法见[密钥与凭据管理](https://n9e.github.io/zh/zh/docs/security/secrets.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* [配置项](https://n9e.github.io/zh/zh/docs/reference/configuration.md)——每个键的默认值
* [数据库选型](https://n9e.github.io/zh/zh/docs/install/databases.md)
* [高可用](https://n9e.github.io/zh/zh/docs/install/high-availability.md)——多实例之间哪些配置必须一致
