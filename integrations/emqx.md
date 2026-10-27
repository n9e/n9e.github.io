# Monitor EMQX with Nightingale

Collects node state, connections, subscriptions, message throughput and drops through the EMQX Dashboard API; supports v3, v4 and v5.

Last reviewed 2026-10-27

The EMQX input calls the Dashboard API (port 18083 by default). It first reads `/nodes` for each node's version, running state, connection count, processes and memory, then the cluster-level subscription count, routes, message sent, received and dropped counters, sessions and retained messages. Listing several node addresses for one cluster makes it pick a reachable one at random; use separate `[[instances]]` blocks for separate clusters.

Set `version` to match the EMQX major version (v3, v4 or v5), and supply Dashboard credentials. The rules cover nodes going offline, sudden drops in connections, rising message drops and process counts near the limit.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **9 alert rules**, each with runbook steps
* **Categraf collector config**: `input.emqx`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.emqx/emqx.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.emqx started` once the plugin is loaded.

   ```
   [[instances]]

   ## emqx的dashboard地址，ip:port, 单个集群监控使用逗号分割多个IP,会随机挑一个可用ip进行连接请求

   ## 多个集群，拆分到多个instance配置

   address="http://192.168.11.12:18083"

   ## 指定emqx的版本，支持v3/v4/v5, 分别对应emqx的3.X/4.X/5.X 版本

   version="v3"

   ## api需要鉴权，输入用户名和密码

   username="admin"

   password="public"
   ```

2. Open the integration center in Nightingale, find EMQX, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

9 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### EMQX node not running[​](#emqx-node-not-running "Direct link to EMQX node not running")

S1 Critical · for 1 min · Trigger:

```
emqx_node_status != 1
```

Runbook:

1. Take node from the alert labels, log in to that host, and run emqx ctl status and systemctl status emqx to check the process;
2. If the process is alive but the status is abnormal, read the tail of log/emqx.log.1; an exhausted Erlang VM heap or a full disk driving the node into self-protection are the usual causes;
3. If the process is gone, rule out resource problems with df -h and free -g before starting it;
4. After recovery run emqx ctl cluster status to confirm the node rejoined the cluster and watch the connection count return.

### EMQX cluster has a stopped node[​](#emqx-cluster-has-a-stopped-node "Direct link to EMQX cluster has a stopped node")

S1 Critical · for 2 min · Trigger:

```
emqx_cluster_node_stopped > 0
```

Runbook:

1. Take cluster from the alert labels and run emqx ctl cluster status on any surviving node to see which nodes are stopped;
2. Log in to the stopped node and troubleshoot it as a single-node failure (process, memory, disk, logs);
3. If the node cannot be recovered soon, run emqx ctl cluster force-leave \<node> to remove it so the routing table stops trying to sync with it;
4. During recovery watch the connection count and memory on the remaining nodes and scale out before letting devices reconnect if needed.

### EMQX connections approaching the file descriptor limit[​](#emqx-connections-approaching-the-file-descriptor-limit "Direct link to EMQX connections approaching the file descriptor limit")

S2 Warning · for 5 min · Trigger:

```
emqx_node_connections / (emqx_node_max_fds > 0) * 100 > 80
```

Runbook:

1. Take node from the alert labels and run emqx ctl listeners to see the current and maximum connections per listener;
2. Run cat /proc/$(pgrep -f beam.smp)/limits | grep 'open files' to confirm the actual fd limit;
3. Raise LimitNOFILE in systemd and node.max\_ports in emqx.conf and restart to apply, re-checking memory (each connection costs tens of KB);
4. If misbehaving clients are consuming connections by reconnecting furiously, rate-limit them at the gateway and review the client reconnect backoff.

### EMQX Erlang process count approaching the limit[​](#emqx-erlang-process-count-approaching-the-limit "Direct link to EMQX Erlang process count approaching the limit")

S2 Warning · for 5 min · Trigger:

```
emqx_node_process_used / (emqx_node_process_available > 0) * 100 > 80
```

Runbook:

1. Take node from the alert labels and run emqx ctl vm to see the live process/used and process/limit values;
2. Compare against connection growth to decide whether this is normal growth or a session leak (persistent sessions with clean\_session=false accumulating);
3. For accumulating persistent sessions, review the session expiry configuration and spot-check with emqx ctl sessions list;
4. If you genuinely need more capacity, raise node.process\_limit in emqx.conf and restart, re-checking memory.

### EMQX node memory usage too high[​](#emqx-node-memory-usage-too-high "Direct link to EMQX node memory usage too high")

S2 Warning · for 5 min · Trigger:

```
emqx_node_memory_used_bytes / (emqx_node_memory_total_bytes > 0) * 100 > 85
```

Runbook:

1. Take node from the alert labels and run emqx ctl vm memory to see the breakdown (processes/binary/ets);
2. A high binary share usually means messages piling up in session queues; look for subscribers that are not consuming fast enough and confirm the hot topics with emqx ctl topics list;
3. A high processes share usually means too many sessions; handle it as for the Erlang process alert;
4. As a stopgap lower mqueue\_max\_len to cap per-session queue length so a single slow consumer cannot drag the node down.

### EMQX message drops spiking[​](#emqx-message-drops-spiking "Direct link to EMQX message drops spiking")

S2 Warning · for 5 min · Trigger:

```
rate(emqx_messages_dropped[5m]) > 1
```

Runbook:

1. Take node from the alert labels and run emqx ctl metrics | grep dropped to separate the drop reasons (queue\_full / no\_subscribers / expired);
2. queue\_full means subscribers are consuming too slowly; investigate the consumers first, then consider raising mqueue\_max\_len;
3. For no\_subscribers, confirm the publisher's topic spelling and whether the subscriber has disconnected;
4. For expired, check that the Message Expiry Interval matches the real delivery latency.

### EMQX client authentication failures spiking[​](#emqx-client-authentication-failures-spiking "Direct link to EMQX client authentication failures spiking")

S2 Warning · for 5 min · Trigger:

```
rate(emqx_packets_connack_auth_error[5m]) > 1
```

Runbook:

1. Take node from the alert labels and read the authentication failure entries in log/emqx.log to see the clientid and source IP distribution;
2. Concentrated sources with regular clientids usually mean a broken authentication backend; check that the data source configured in emqx ctl authn list (MySQL/Redis/HTTP) is reachable;
3. Scattered sources with random clientids indicate brute forcing; rate-limit at the firewall or gateway and enable a blacklist;
4. If a batch of credentials expired at once, allow them through temporarily and push the device side to update.

### EMQX rule engine action failure rate too high[​](#emqx-rule-engine-action-failure-rate-too-high "Direct link to EMQX rule engine action failure rate too high")

S2 Warning · for 5 min · Trigger:

```
rate(emqx_actions_failure[5m]) / ((rate(emqx_actions_success[5m]) + rate(emqx_actions_failure[5m])) > 0) * 100 > 5
```

Runbook:

1. Take node from the alert labels and check the per-rule failure counters on the rule engine page of the Dashboard to identify the failing rule and action;
2. Read that action's error in log/emqx.log to distinguish an unreachable downstream, a timeout, and a data format mismatch;
3. For an unreachable downstream, fix it first and confirm the bridge's connection pool and timeout settings are sensible;
4. For format problems, review the field mapping in the rule SQL, verify with the Dashboard's test feature, and then publish.

### EMQX node restarted recently[​](#emqx-node-restarted-recently "Direct link to EMQX node restarted recently")

S3 Info · for 1 min · Trigger:

```
emqx_node_uptime_seconds < 300
```

Runbook:

1. First confirm whether this was a planned release or a scaling operation;
2. If unplanned, check log/emqx.log.1 and journalctl -u emqx --since '-30min' for the cause;
3. Run dmesg -T | grep -i 'killed process' to rule out an OOM kill, and handle it as a memory alert if that is the case;
4. After the restart watch the connection recovery curve and CPU, and rate-limit reconnections at the gateway if needed so the storm does not take down the node again.

## Related[​](#related "Direct link to Related")

* [EMQX template source](https://github.com/ccfos/nightingale/tree/main/integrations/EMQX): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
