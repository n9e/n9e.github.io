# Probe ports and HTTP endpoints

Configure Categraf TCP, UDP and HTTP probes, then verify result codes, response content and certificate expiry metrics.

Last reviewed 2026-10-11

By the end of this page, an independent probe will check service ports and HTTP responses rather than process existence alone. The configuration targets **Categraf v0.5.17 and Nightingale v9**.

## TCP and UDP[​](#tcp-udp "Direct link to TCP and UDP")

Edit `conf/input.net_response/net_response.toml`:

```
[[instances]]

targets = ["127.0.0.1:22"]

protocol = "tcp"

timeout = "2s"

labels = { probe = "ssh-local" }
```

Replace the target. A successful TCP connection proves that the port accepts connections, not that the application is healthy. Configure a protocol-appropriate `send` and `expect` pair when response checking is required.

UDP needs a meaningful request and expected reply. Changing `protocol` to `udp` alone does not make a complete probe. See the [net\_response configuration](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.net_response/net_response.toml).

## HTTP[​](#http "Direct link to HTTP")

Edit `conf/input.http_response/http_response.toml`:

```
[[instances]]

targets = ["http://127.0.0.1:8080/health"]

method = "GET"

response_timeout = "5s"

expect_response_status_code = 200

expect_response_substring = "ok"

follow_redirects = false

labels = { probe = "application-health" }
```

Use the application's actual health endpoint and response. Check both status and body. Enable redirect following deliberately so a login redirect does not masquerade as health. HTTPS targets can also produce certificate-expiry metrics.

## Verify and alert[​](#verify "Direct link to Verify and alert")

```
./categraf --test --inputs net_response:http_response
```

**Expected result**: `net_response_result_code` or `http_response_result_code` for the intended target. Zero means the configured check succeeded; nonzero means failure. The plugins use different nonzero codes, so do not share their error-code descriptions.

Restart collection after testing and check labels, result codes and timestamps in the destination store. Start with a `result_code != 0` condition, an appropriate sustained duration and a meaningful severity.

When an HTTPS target produces `http_response_cert_expire_timestamp`, this expression returns seconds until expiry:

```
http_response_cert_expire_timestamp - time()
```

Verify the metric exists before enabling an expiry threshold. DNS, network access and probe permissions also affect results; a failed probe does not necessarily mean a process exited.

## Next[​](#next "Direct link to Next")

* [Metric alert rules](https://n9e.github.io/docs/alerting/metric-rules.md)
* [Import dashboards and rules](https://n9e.github.io/docs/data/integrations/import.md)

Full HTTP options: [v0.5.17 configuration](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.http_response/http_response.toml).
