---
title: "Connect Datadog Agent"
sidebar_label: "Connect Datadog Agent"
description: "Send Datadog Agent v1 metric series to Nightingale, with the API-version and authentication boundaries made explicit."
last_reviewed: 2026-10-11
---

This page lets hosts with Datadog Agent keep their collectors and send **compatible metric series** to Nightingale.

:::note Compatibility
Nightingale v9 registers `/datadog/api/v1/series`. It is not a complete Datadog backend and does not provide a v2 series receiver.
The settings below are checked against **Datadog Agent 7.70.0**. Verify that other versions still support v1 before using them.
:::

## Configure {#configure}

Edit `/etc/datadog-agent/datadog.yaml` on Linux:

```yaml
api_key: "replace-with-agent-key"
dd_url: "http://127.0.0.1:17000/datadog"
use_v2_api:
  series: false
```

Replace the URL and key. End `dd_url` at `/datadog`; the Agent appends the API path itself.

Changing `dd_url` alone is insufficient: [Agent 7.70.0 enables v2 series by default](https://github.com/DataDog/datadog-agent/blob/7.70.0/pkg/config/setup/config.go).
Setting `use_v2_api.series: false` selects the v1 JSON format Nightingale receives.

Enable `[HTTP.APIForAgent].Enable` on the server. If `[HTTP.APIForAgent.BasicAuth]` is configured, Nightingale matches the request's `api_key` against its configured **password values**. A web-login token is not interchangeable with that key.

Without server authentication, Nightingale does not check this value, although the Agent still requires a valid nonempty configuration.

## Restart and verify {#verify}

```bash
sudo systemctl restart datadog-agent
sudo datadog-agent status
sudo journalctl -u datadog-agent -n 100 --no-pager
```

**Expected result**: the Agent starts and sends series to `/datadog/api/v1/series` without authentication or routing errors.
In Nightingale's explorer, select the actual destination store and confirm that collected metrics appear and keep receiving new samples.

Nightingale replaces dots and hyphens in metric names with underscores: `system.cpu.user` becomes `system_cpu_user`.
Inspect both Agent and Nightingale logs; a running service alone does not prove delivery.

Success on auxiliary compatibility endpoints does not prove that logs, APM, events or all service checks were stored. This guide covers the v1 metric-series path only.
If your Agent cannot use it, choose [Categraf](../data/categraf/install.md) or a verified Prometheus collection path.

## Next {#next}

- [Data ingestion protocols](../reference/write-protocols.md)
- [Connected datasource with no data](../troubleshooting/no-data.md)

Implementation: [Pushgw routes](https://github.com/ccfos/nightingale/blob/01a8e22eb21d81f5cbe5c34e5a1511ff63e39983/pushgw/router/router.go) and [series parsing and authentication](https://github.com/ccfos/nightingale/blob/01a8e22eb21d81f5cbe5c34e5a1511ff63e39983/pushgw/router/router_datadog.go).
