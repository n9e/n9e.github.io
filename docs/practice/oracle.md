# Monitor Oracle

Configure Categraf Oracle instances and SQL collection, map labels and values, and verify database permissions.

Last reviewed 2026-10-11

By the end of this page, Oracle samples will reach your TSDB, and you will know where shared and per-instance SQL belongs. The example uses the **Categraf v0.5.17** Oracle configuration and the store used by Nightingale v9.

## Configuration files[​](#configuration-files "Direct link to Configuration files")

* `conf/input.oracle/oracle.toml`: connections and `[[instances]]` for one or more targets.
* `conf/input.oracle/metric.toml`: shared collection queries.
* `[[instances.metrics]]`: queries specific to the owning instance.

Reuse the writer configured during [installation and registration](https://n9e.github.io/docs/data/categraf/install.md); Oracle collection does not require another TSDB.

## Configure one instance[​](#configure "Direct link to Configure one instance")

Use a monitoring account permitted to query the required views:

```
interval = 15



[[instances]]

address = "127.0.0.1:1521/ORCLPDB1"

username = "monitor"

password = "replace-with-monitor-password"

is_sys_dba = false

is_sys_oper = false

max_open_connections = 5

labels = { instance = "oracle-local:1521" }



[[instances.metrics]]

mesurement = "sessions"

label_fields = ["status", "type"]

metric_fields = ["value"]

timeout = "3s"

request = '''

SELECT status, type, COUNT(*) AS value

FROM v$session GROUP BY status, type

'''
```

Replace the service name, credentials and instance label. `mesurement` is the plugin's actual key; do not correct it to `measurement`. The `status` and `type` columns become labels; `value` is numeric. Column names must match the mapping.

Avoid SYS. Ask a DBA to grant access for each enabled query. This custom query needs `v$session`; the bundled queries may require additional views. Passing one query is not proof that the account can run the entire collection set.

## Verify[​](#verify "Direct link to Verify")

```
./categraf --test --inputs oracle
```

**Expected result**: Oracle metrics without connection, permission or column-mapping errors. For an ORA error, check the service and credentials, then the views used by the failing SQL.

After local collection succeeds, restart the existing service and check `oracle_` metrics and `instance` labels in the destination store. Give each target distinct labels to prevent collisions.

## Shared queries and cost[​](#shared-queries "Direct link to Shared queries and cost")

Put queries required by every instance in `metric.toml`; keep special queries under the target's `[[instances.metrics]]`. Have a DBA review execution plans and frequency before enabling queries against large tables. See the [Oracle configuration directory](https://github.com/flashcatcloud/categraf/tree/v0.5.17/conf/input.oracle) for fields and bundled queries.

## Next[​](#next "Direct link to Next")

* [Input plugins](https://n9e.github.io/docs/data/categraf/plugins.md)
* [Import dashboards and rules](https://n9e.github.io/docs/data/integrations/import.md)
