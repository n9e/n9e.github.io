# Monitor Docker with Nightingale

Collects per-container CPU, memory, block and network IO plus daemon state through the Docker API; the dashboard is written against docker\_\* metrics and verified on real hosts.

Last reviewed 2026-10-13

The Docker input is based on Telegraf's docker plugin. It connects to the Docker daemon socket (`unix:///var/run/docker.sock`) or a TCP endpoint and collects engine-level container counts and states, image count and storage driver information, plus CPU, memory, blkio and network IO for every container. Swarm services and extended memory statistics are optional.

The bundled `Docker Dashboard` is written against these `docker_*` metrics and verified on real hosts, so this input must be enabled for it. cAdvisor is also a recommended way to collect containers, but it emits `container_*` metrics and needs the dashboards from the [cAdvisor integration](https://n9e.github.io/integrations/cadvisor.md); the two do not mix. The rules cover container OOM kills, abnormal exits, CPU and memory over limits and the daemon being unreachable.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 16 panels in total
* **6 alert rules**, each with runbook steps
* **Categraf collector config**: `input.docker`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.docker/docker.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.docker started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   ## Docker Endpoint

   ##   To use TCP, set endpoint = "tcp://[ip]:[port]"

   ##   To use environment variables (ie, docker-machine), set endpoint = "ENV"

   # endpoint = "unix:///var/run/docker.sock"

   endpoint = ""



   ## Set to true to collect Swarm metrics(desired_replicas, running_replicas)

   gather_services = false

   gather_extend_memstats = false



   container_id_label_enable = true

   container_id_label_short_style = false



   ## Containers to include and exclude. Globs accepted.

   ## Note that an empty array for both will include all containers

   container_name_include = []

   container_name_exclude = []



   ## Container states to include and exclude. Globs accepted.

   ## When empty only containers in the "running" state will be captured.

   ## example: container_state_include = ["created", "restarting", "running", "removing", "paused", "exited", "dead"]

   ## example: container_state_exclude = ["created", "restarting", "running", "removing", "paused", "exited", "dead"]

   # container_state_include = []

   # container_state_exclude = []



   ## Timeout for docker list, info, and stats commands

   timeout = "5s"



   ## Specifies for which classes a per-device metric should be issued

   ## Possible values are 'cpu' (cpu0, cpu1, ...), 'blkio' (8:0, 8:1, ...) and 'network' (eth0, eth1, ...)

   ## Please note that this setting has no effect if 'perdevice' is set to 'true'

   perdevice_include = []



   ## Specifies for which classes a total metric should be issued. Total is an aggregated of the 'perdevice' values.

   ## Possible values are 'cpu', 'blkio' and 'network'

   ## Total 'cpu' is reported directly by Docker daemon, and 'network' and 'blkio' totals are aggregated by this plugin.

   ## Please note that this setting has no effect if 'total' is set to 'false'

   total_include = ["cpu", "blkio", "network"]



   ## Which environment variables should we use as a tag

   ##tag_env = ["JAVA_HOME", "HEAP_SIZE"]



   ## docker labels to include and exclude as tags. Globs accepted.

   ## Note that an empty array for both will include all labels as tags

   docker_label_include = []

   docker_label_exclude = ["annotation*", "io.kubernetes*", "*description*", "*maintainer*", "*hash", "*author*", "*org_*", "*date*", "*url*", "*docker_compose*"]



   ## Optional TLS Config

   # use_tls = false

   # tls_ca = "/etc/telegraf/ca.pem"

   # tls_cert = "/etc/telegraf/cert.pem"

   # tls_key = "/etc/telegraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

2. Open the integration center in Nightingale, find Docker, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard        | Panels |
| ---------------- | ------ |
| Docker Dashboard | 16     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

6 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Docker daemon unreachable[​](#docker-daemon-unreachable "Direct link to Docker daemon unreachable")

S1 Critical · for 1 min · Trigger:

```
docker_up == 0
```

Runbook:

1. Log in to the host and run systemctl status docker to confirm the daemon is alive;
2. Run docker ps to verify by hand — if it hangs without returning, the daemon is stuck, use journalctl -u docker -n 200 to locate the cause;
3. Confirm the permissions on /var/run/docker.sock match the collector account;
4. Confirm the disk (especially the partition holding /var/lib/docker) is not full, a full disk is a common cause of a stuck daemon.

### Docker container health check failing[​](#docker-container-health-check-failing "Direct link to Docker container health check failing")

S1 Critical · for 3 min · Trigger:

```
docker_container_health_status == 2
```

Runbook:

1. Take container\_name from the alert labels and run docker inspect \<container> and check the State.Health field in the output for the last few health check results;
2. Run docker logs --tail 200 \<container> to locate the application error;
3. Reproduce the health check by hand (docker exec \<container> \<health check command>) to tell an application failure apart from a wrongly written check;
4. If the application is broken and cannot be fixed quickly, first remove the instance from the upstream load balancer, then investigate.

### Docker container OOM killed[​](#docker-container-oom-killed "Direct link to Docker container OOM killed")

S1 Critical · Trigger:

```
docker_container_status_oomkilled == 1
```

Runbook:

1. Take container\_name from the alert labels and run docker inspect \<container> | grep -i memory to confirm the current limit;
2. Compare with the historical peak of docker\_container\_mem\_max\_usage to tell a too-small limit apart from an application memory leak;
3. If the limit is too small, raise --memory and recreate the container;
4. If a leak is suspected, capture a heap profile on the application side (jmap for Java, pprof for Go) instead of just raising the limit to hide the problem.

### Docker container restart loop[​](#docker-container-restart-loop "Direct link to Docker container restart loop")

S1 Critical · Trigger:

```
increase(docker_container_status_restart_count[10m]) > 3
```

Runbook:

1. Take container\_name from the alert labels and run docker logs --tail 200 \<container> to see the error before each exit;
2. Run docker inspect \<container> and read the State.ExitCode exit code in the output (137 usually means OOM or killed; 1 or 2 usually means the application failed to start);
3. For configuration or dependency problems (cannot reach the database, missing config file), fix the dependency before starting it again;
4. To keep the restart loop from filling the disk with logs, docker stop the container and remove it from the load balancer while you investigate.

### Docker container memory approaching its limit[​](#docker-container-memory-approaching-its-limit "Direct link to Docker container memory approaching its limit")

S2 Warning · for 5 min · Trigger:

```
docker_container_mem_usage_percent > 90
```

Runbook:

1. Take container\_name from the alert labels and run docker stats --no-stream \<container> to confirm current usage against the limit;
2. Check the history curve to tell a steady climb (likely a leak) apart from a normal traffic peak;
3. For normal peaks, raise --memory leaving 20% headroom and recreate the container;
4. For a steady climb, capture a heap profile on the application side to find the leak, and raise the limit meanwhile to buy investigation time.

### Docker container CPU throttled[​](#docker-container-cpu-throttled "Direct link to Docker container CPU throttled")

S2 Warning · for 5 min · Trigger:

```
rate(docker_container_cpu_throttling_throttled_periods[5m]) / rate(docker_container_cpu_throttling_periods[5m]) > 0.25
```

Runbook:

1. Take container\_name from the alert labels and run docker inspect \<container> | grep -iE 'cpuquota|cpuperiod|nanocpus' to confirm the current quota;
2. Compare with docker\_container\_cpu\_usage\_percent to tell a traffic increase apart from a busy loop in the application;
3. If traffic grew, raise --cpus and recreate the container, or scale out to several instances;
4. If usage looks abnormal, capture a CPU profile on the application side to find the hot functions.

## Related[​](#related "Direct link to Related")

* [Docker template source](https://github.com/ccfos/nightingale/tree/main/integrations/Docker): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `docker` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/docker): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
