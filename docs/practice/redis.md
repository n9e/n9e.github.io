# Monitor Redis

Use the Categraf Redis input or scrape an existing Redis Exporter, then verify the stored runtime metrics.

Last reviewed 2026-10-11

By the end of this page, Redis runtime metrics will be available in Nightingale. An existing Redis Exporter can remain in place. The examples target **Categraf v0.5.17 and Nightingale v9**.

## Collect Redis directly[​](#direct-collection "Direct link to Collect Redis directly")

The input connects to Redis and reads status using commands such as `INFO`. After [installing and registering Categraf](https://n9e.github.io/docs/data/categraf/install.md), edit `conf/input.redis/redis.toml`:

```
[[instances]]

address = "127.0.0.1:6379"

username = "monitor"

password = "replace-with-monitor-password"

pool_size = 2

labels = { instance = "redis-local:6379" }
```

Replace the credentials and instance label. Older Redis installations without ACL users may require an empty `username`. Use a monitoring account with permissions for the enabled collection set. Allowing `INFO` alone does not necessarily cover every optional command. Slow-log and custom-command collection need their own permissions. See the [configuration](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.redis/redis.toml).

## Reuse an exporter[​](#exporter "Direct link to Reuse an exporter")

If Prometheus or vmagent already scrapes the exporter, register that [store as a datasource](https://n9e.github.io/docs/data/overview.md) without collecting it twice.

Alternatively, add the exporter to `conf/input.prometheus/prometheus.toml`:

```
[[instances]]

urls = ["http://127.0.0.1:9121/metrics"]

url_label_key = "instance"

url_label_value = "{{.Host}}"
```

This is the exporter's HTTP endpoint, not Redis port 6379. Fetching it from the collector host should return Redis metrics in Prometheus text format.

## Verify[​](#verify "Direct link to Verify")

Test the selected path:

```
./categraf --test --inputs redis

# For the exporter path:

./categraf --test --inputs prometheus
```

**Expected result**: Redis metrics without authentication or scraping errors. Restart the collector service. Select the destination store in Nightingale's explorer and check `redis_` metrics, instance labels and new samples.

The native input and Redis Exporter do not use identical metric names. Import dashboards and rules matching the collector you chose.

## Next[​](#next "Direct link to Next")

* [Import dashboards and rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Remote Write](https://n9e.github.io/docs/data/categraf/remote-write.md)
