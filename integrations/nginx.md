# Monitor Nginx with Nightingale

stub\_status covers connections and request totals, the VTS module adds per-server and per-upstream status codes and latency; an upstream\_check input reads health-check results.

Last reviewed 2026-10-27

Nginx can be monitored at three levels. The built-in `stub_status` module reports active connections, accepts, handled, requests and reading/writing/waiting counts, enough for liveness and traffic trends. The VTS module (`nginx-module-vts`) breaks requests, status codes, response time and traffic down by server zone and upstream, which is the recommended path; scrape its `/status/format/prometheus` with the Categraf `prometheus` input. The third is the `nginx_upstream_check` input, which reads the results of the upstream\_check module.

The three dashboards map to stub\_status, upstream health checks and VTS. The rules cover Nginx being unreachable, active connections spiking and upstream nodes marked down.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **3 dashboards**, 24 panels in total
* **3 alert rules**, each with runbook steps
* **7 metric descriptions**
* **Categraf collector config**: `input.nginx`, `input.nginx_upstream_check`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

   `conf/input.nginx/nginx.toml`

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   ## An array of Nginx stub_status URI to gather stats.

   urls = [

   #    "http://192.168.0.216:8000/nginx_status",

   #    "https://www.baidu.com/ngx_status"

   ]



   ## append some labels for series

   # labels = { region="cloud", product="n9e" }



   ## interval = global.interval * interval_times

   # interval_times = 1



   ## Set response_timeout (default 5 seconds)

   response_timeout = "5s"



   ## Whether to follow redirects from the server (defaults to false)

   # follow_redirects = false



   ## Optional HTTP Basic Auth Credentials

   #username = "admin"

   #password = "admin"



   ## Optional headers

   # headers = ["X-From", "categraf", "X-Xyz", "abc"]



   ## Optional TLS Config

   # use_tls = false

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

   `conf/input.nginx_upstream_check/nginx_upstream_check.toml`

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   targets = [

       # "http://127.0.0.1/status?format=json",

       # "http://10.2.3.56/status?format=json"

   ]



   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   ## Set http_proxy (categraf uses the system wide proxy settings if it's is not set)

   # http_proxy = "http://localhost:8888"



   ## Interface to use when dialing an address

   # interface = "eth0"



   ## HTTP Request Method

   # method = "GET"



   ## Set timeout (default 5 seconds)

   # timeout = "5s"



   ## Whether to follow redirects from the server (defaults to false)

   # follow_redirects = false



   ## Optional HTTP Basic Auth Credentials

   # username = "username"

   # password = "pa$$word"



   ## Optional headers

   # headers = ["X-From", "categraf", "X-Xyz", "abc"]



   ## Optional TLS Config

   # use_tls = false

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

2. Open the integration center in Nightingale, find Nginx, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard      | Panels |
| -------------- | ------ |
| Nginx Stub     | 6      |
| Nginx Upstream | 3      |
| Nginx VTS      | 15     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

3 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Nginx instance unreachable[​](#nginx-instance-unreachable "Direct link to Nginx instance unreachable")

S1 Critical · for 1 min · Trigger:

```
nginx_up == 0
```

Runbook:

1. Log in to the host and run systemctl status nginx or ps -ef | grep nginx to confirm the master process is alive;
2. If it is alive, run curl -s <http://127.0.0.1/nginx_status> to verify by hand whether stub\_status is blocked by allow/deny rules or a firewall;
3. If it is not running, validate the config with nginx -t before systemctl start nginx, and read the tail of error\_log for the exit reason;
4. Confirm the upstream VIP or load balancer has taken this node out of rotation so traffic stops flowing to it.

### Nginx dropping connections[​](#nginx-dropping-connections "Direct link to Nginx dropping connections")

S2 Warning · for 5 min · Trigger:

```
increase(nginx_accepts[5m]) - increase(nginx_handled[5m]) > 0
```

Runbook:

1. Check error\_log for worker\_connections are not enough or too many open files;
2. Estimate the connection ceiling as worker\_processes × worker\_connections, compare it with the current nginx\_active level, and raise worker\_connections;
3. Raise worker\_rlimit\_nofile and the systemd LimitNOFILE to match;
4. Run nginx -s reload and confirm the gap between accepts and handled stops growing.

### Nginx upstream backend node unavailable[​](#nginx-upstream-backend-node-unavailable "Direct link to Nginx upstream backend node unavailable")

S1 Critical · for 1 min · Trigger:

```
nginx_upstream_check_status_code == 2
```

Runbook:

1. Take upstream and name (the backend address) from the alert labels and run curl -sv http\://\<backend address>/ on the Nginx host to confirm it is genuinely unreachable;
2. If it is unreachable, log in to that backend host and confirm the application process and port are alive;
3. If the backend is healthy, check the network and security groups between Nginx and the backend, and whether the probe path in the check directive matches the backend's health check endpoint;
4. Run curl http\://\<nginx>/status?format=json to see how many nodes are left in the same upstream, and scale out immediately if only one remains.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

7 metrics, the ones the dashboards and rules above are built on.

| Metric                      | Meaning                                                                                                                                                                                                                                          | Unit |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| `nginx_waiting`             | Nginx stub \_ status Number of current idle connections — \[Documentation] (<https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md>)                                                                                        |      |
| `nginx_writing`             | Nginx stub \_ status The number of connections that are writing back response — \[Documentation] (<https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md>)                                                                  |      |
| `nginx_active`              | Nginx stub \_ status Number of active connections being processed — \[Documentation] (<https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md>) Sum of Reading + Writing + Waiting                                           |      |
| `nginx_reading`             | Nginx stub \_ status is reading the number of connections to the request header — \[Documentation] (<https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md>)                                                                |      |
| `irate(nginx_accepts[3m])`  | Nginx stub \_ status New connections accepted per second — \[Documentation] (<https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md>)                                                                                       |      |
| `irate(nginx_handled[3m])`  | Nginx stub \_ status New connections per second handle — \[Documentation] (<https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md>)                                                                                         |      |
| `irate(nginx_requests[3m])` | Nginx stub \_ status requests processed per second — \[Documentation] (<https://github.com/flashcatcloud/categraf/blob/main/inputs/nginx/README.md>) If there is a keep-alive connection, multiple requests will be processed on one connection. |      |

## Related[​](#related "Direct link to Related")

* [Nginx template source](https://github.com/ccfos/nightingale/tree/main/integrations/Nginx): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `nginx` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/nginx): every config option and the full metric list.
* [Categraf `nginx_upstream_check` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/nginx_upstream_check): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
