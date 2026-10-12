# Monitor Linux hosts

Collect Linux metrics with Categraf, distinguish heartbeat metadata from stored samples, and detect missing hosts.

Last reviewed 2026-10-11

By the end of this page, Linux host metrics will be queryable in Nightingale, and you will know why an online target and a populated dashboard are separate checks. The collector commands target **Categraf v0.5.17 and Nightingale v9**.

## Collect and connect[​](#collect "Direct link to Collect and connect")

Configure `writers` and `heartbeat` using [Install and register](https://n9e.github.io/docs/data/categraf/install.md). Host metrics come from inputs such as `cpu`, `mem`, `disk`, `diskio`, `net` and `system`, configured under `conf/input.<name>/`.

From the collector installation directory:

```
./categraf --test --inputs cpu:mem:disk
```

**Expected result**: the terminal prints the corresponding metrics without permission or configuration errors. This proves local collection only. Select the destination store in Nightingale's explorer and verify that new samples arrive.

## Online target, empty dashboard[​](#no-data "Direct link to Online target, empty dashboard")

Check the two paths separately:

| Path                                      | Purpose                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `heartbeat` → `/v1/n9e/heartbeat`         | Target metadata and liveness                          |
| `writers` → `/prometheus/v1/write` → TSDB | Samples used by queries, dashboards and metric alerts |

Nightingale v9 **can use its embedded TSDB**. The old statement that it always forwards metrics without storing them is no longer generally correct. For external storage, also check the `Pushgw.Writers` destinations and the backend's receiver configuration.

Work through these checks:

1. Does `--test` produce samples? If not, fix collection first.
2. Does `writers` in `conf/config.toml` point to the intended Nightingale or Edge?
3. Do collector logs show authentication, connection or write failures?
4. Is the destination accepting data? Prometheus needs its Remote Write receiver enabled.
5. Is the query using the right source, and are clocks synchronized?
6. Are dashboard variables excluding the business group, `ident` or `instance`?

```
sudo journalctl -u categraf.service -n 100 --no-pager
```

**Expected result**: a direct query against the correct store returns samples. Resolve dashboard filtering after that. See [Connected datasource with no data](https://n9e.github.io/docs/troubleshooting/no-data.md) for detailed troubleshooting.

## Detect missing hosts[​](#missing-host "Direct link to Detect missing hosts")

Prometheus generates `up` when it actively scrapes a Node Exporter endpoint. Categraf pushes with Remote Write and **does not automatically generate that scrape-status metric**.

Use a **Host-type rule** in Nightingale for missing-target detection. Select the intended targets, tags or business groups and configure the missing duration. Stop and restart collection on one test host to verify triggering and recovery before applying the rule broadly.

**Expected result**: the test host produces an event after the configured duration and recovers when its heartbeat resumes. Independent Ping or port probes are also useful, but measure reachability or service response rather than collector health.

## Next[​](#next "Direct link to Next")

* [Targets and heartbeat](https://n9e.github.io/docs/data/categraf/targets.md)
* [Import dashboards and rules](https://n9e.github.io/docs/data/integrations/import.md)
