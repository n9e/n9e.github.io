# Configuration layout

Configuration is a directory: config.toml is read by n9e, alert and pushgw, etc/edge by n9e-edge; environment variables fill in blanks but never override set keys.

Nightingale is configured by a **directory**, not a file. Knowing how that directory is loaded, and when environment variables actually apply, removes a whole class of "I changed the config and nothing happened".

## Where the config directory is[​](#where-the-config-directory-is "Direct link to Where the config directory is")

By default, `etc/` next to the binary:

```
etc/

├── config.toml        # read by n9e / n9e-alert / n9e-pushgw

├── metrics.yaml       # built-in metric descriptions, pointed at by [Center] MetricsYamlFile

├── edge/

│   └── edge.toml      # read by n9e-edge

└── script/            # example notification scripts
```

Point somewhere else with `--configs`, or the matching environment variable:

```
./n9e --configs /etc/n9e

N9E_CONFIGS=/etc/n9e ./n9e
```

| Process      | Flag default | Environment variable |
| ------------ | ------------ | -------------------- |
| `n9e`        | `etc`        | `N9E_CONFIGS`        |
| `n9e-edge`   | `etc`        | `N9E_EDGE_CONFIGS`   |
| `n9e-alert`  | `etc`        | `N9E_ALERT_CONFIGS`  |
| `n9e-pushgw` | `etc`        | `N9E_PUSHGW_CONFIGS` |

`n9e-edge` also defaults to `etc`, and `etc` holds the **central** `config.toml` — so an edge process must always be started with `--configs etc/edge`. Pointing at the file (`--configs etc/edge/edge.toml`) is equally wrong: the flag takes a directory.

## How the directory is loaded[​](#how-the-directory-is-loaded "Direct link to How the directory is loaded")

The process concatenates **every** `.toml` file in the directory, in filename order, and parses the result as one document; `.json` and `.yaml` files are read too. Two consequences:

* to keep credentials out of the main file, just drop them in `etc/secret.toml` — nothing else needs changing;
* a backup named `config.toml.bak` is harmless (the suffix is not `.toml`), but one named `config.bak.toml` is merged in as real configuration.

`etc/edge/` is a subdirectory and is never picked up by the central process — the scan does not recurse.

## Environment variables fill gaps, they do not override[​](#environment-variables-fill-gaps-they-do-not-override "Direct link to Environment variables fill gaps, they do not override")

Config keys can be supplied through the environment, named `CONFIGTYPE_<SECTION>_<KEY>` in upper case:

```
CONFIGTYPE_HTTP_PORT=17001

CONFIGTYPE_DB_DSN="n9e:<password>@tcp(mysql:3306)/n9e_v6?parseTime=True"

CONFIGTYPE_REDIS_ADDRESS=redis:6379
```

The file wins over the environment

Loading order is defaults → environment → config file, and **each stage overrides the last**. A key present in `config.toml` therefore ignores its environment variable completely. The shipped `config.toml` sets nearly every key explicitly, which means **environment overrides are inert by default** until you comment the corresponding line out.

The quickest way to tell whether a variable took effect is to comment the line out of the file, restart, and read the value back from the log.

Two other groups are unaffected because they never reach the config loader: the `N9E_*_CONFIGS` variables above, and `WAIT_HOSTS` / `WAIT_TIMEOUT`, which make the process wait for dependency ports before starting and are how the compose bundles order themselves.

## What each section covers[​](#what-each-section-covers "Direct link to What each section covers")

| Section                                                    | Covers                                                                           | Read by              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------- |
| `[Global]`                                                 | Run mode                                                                         | All                  |
| `[Log]`                                                    | Log directory, level, rotation                                                   | All                  |
| `[HTTP]`                                                   | Listen address and port, TLS, timeouts, `/metrics`                               | All                  |
| `[HTTP.APIForAgent]`                                       | The collector-facing API (heartbeat, writes) and its auth                        | Center, Edge         |
| `[HTTP.APIForService]`                                     | The service-to-service API (edge callbacks, eval-record forwarding) and its auth | Center, Edge         |
| `[HTTP.JWTAuth]` / `[HTTP.ProxyAuth]` / `[HTTP.TokenAuth]` | The three authentication modes                                                   | Center               |
| `[DB]`                                                     | Metadata database                                                                | All                  |
| `[Redis]`                                                  | Redis                                                                            | All                  |
| `[Center]`                                                 | Metric description file, anonymous access, event history retention               | Center               |
| `[Alert]`                                                  | Engine heartbeat, engine cluster name, evaluation records                        | Center, Alert, Edge  |
| `[Pushgw]`                                                 | Ingestion and forwarding; `[[Pushgw.Writers]]` are external TSDB write URLs      | Center, Pushgw, Edge |
| `[EmbeddedTSDB]`                                           | The built-in time-series store                                                   | **Center only**      |
| `[Ibex]`                                                   | RPC listener for self-healing tasks                                              | Center, Edge         |
| `[CenterApi]`                                              | Central address and credentials (only in `edge.toml`)                            | Edge                 |

Defaults and notes for every key are in the [Configuration reference](https://n9e.github.io/docs/reference/configuration.md).

## Keep passwords out of plain text[​](#keep-passwords-out-of-plain-text "Direct link to Keep passwords out of plain text")

`[DB] DSN`, `[Redis] Password`, the BasicAuth passwords, `[[Pushgw.Writers]] BasicAuthPass` and `[EmbeddedTSDB] BasicAuthPass` all accept ciphertext: write the value as `{{cipher}}<ciphertext>` and supply the key at startup with `--crypto-key`.

```
./n9e --crypto-key '<your-key>'
```

Values without the `{{cipher}}` prefix are treated as plain text, so you can migrate them one at a time. For the full approach see [Secret management](https://n9e.github.io/docs/security/secrets.md).

## Next[​](#next "Direct link to Next")

* [Configuration reference](https://n9e.github.io/docs/reference/configuration.md) — every key and its default
* [Choosing a metadata database](https://n9e.github.io/docs/install/databases.md)
* [High availability](https://n9e.github.io/docs/install/high-availability.md) — which settings must match across instances
