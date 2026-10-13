# Report custom metrics to Nightingale from scripts (Exec)

For anything no plugin covers: write a script that prints Prometheus, InfluxDB line protocol or Open-Falcon format to stdout, and Categraf collects and ships it.

Last reviewed 2026-10-13

The exec input is Categraf's catch-all. You write a script, the script prints metrics to standard output, and Categraf runs it on a schedule and parses the result. Any language works; the output must be one of three formats, chosen with `data_format`: Prometheus text exposition, InfluxDB line protocol (`measurement,label=v field=1`) or Open-Falcon JSON.

Use it for business metrics, health checks of legacy systems and one-off inspection scripts. Keep the script's run time below the collection interval, and remember that values must be numeric.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **Categraf collector config**: `input.exec`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.exec/exec.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.exec started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # # commands, support glob

   commands = [

   #     "/opt/categraf/scripts/*.sh"

   ]



   # # timeout for each command to complete

   # timeout = 5



   # # interval = global.interval * interval_times

   # interval_times = 1



   # # choices: influx prometheus falcon

   # # influx stdout example: measurement,labelkey1=labelval1,labelkey2=labelval2 field1=1.2,field2=2.3

   # data_format = "influx"
   ```

## Related[​](#related "Direct link to Related")

* [Exec template source](https://github.com/ccfos/nightingale/tree/main/integrations/Exec): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `exec` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/exec): every config option and the full metric list.
* [Walkthrough: custom metrics from scripts](https://n9e.github.io/docs/practice/exec.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
