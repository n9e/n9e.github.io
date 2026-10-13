# Monitor Consul with Nightingale

Collects the health-check state of every registered service through the Consul API, so you see at once which service is critical or warning on which node.

Last reviewed 2026-10-13

The Consul input calls the Consul health API and turns every registered health check into a metric with service name, node, check name and current state (passing, warning, critical). It does not collect Consul's own telemetry, which Consul can emit over StatsD or its built-in Prometheus endpoint; its single job is answering "is anything registered in Consul unhealthy".

The rules cover service instances turning critical, services with no healthy instance left, nodes dropping out, checks stuck in warning and Consul itself being unreachable. ACL tokens and TLS are supported.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **7 alert rules**, each with runbook steps
* **Categraf collector config**: `input.consul`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.consul/consul.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.consul started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   [[instances]]

     ## Consul server address

     # address = "localhost:8500"



     ## URI scheme for the Consul server, one of "http", "https"

     # scheme = "http"



     ## ACL token used in every request

     # token = ""



     ## HTTP Basic Authentication username and password.

     # username = ""

     # password = ""



     ## Data center to query the health checks from

     # datacenter = ""



     ## Allows any Consul server (non-leader) to service a read.

     ## Default is true

     # allow_stale = true



     ## Forces the read to be fully consistent.

     ## Default is false

     # require_consistent = false



     ## Prefix from which to expose key/value pairs.

     # kv_prefix = ""



     ## Regex that determines which keys to expose.

     ## Default is ".*"

     # kv_filter = ".*"



     ## Optional TLS Config

     # tls_ca = "/etc/telegraf/ca.pem"

     # tls_cert = "/etc/telegraf/cert.pem"

     # tls_key = "/etc/telegraf/key.pem"

     ## Use TLS but skip chain & host verification

     # insecure_skip_verify = true
   ```

2. Open the integration center in Nightingale, find Consul, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

7 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Consul instance unreachable[​](#consul-instance-unreachable "Direct link to Consul instance unreachable")

S1 Critical · for 1 min · Trigger:

```
consul_up == 0
```

Runbook:

1. Log in to the host and run systemctl status consul and consul members to check the process and the cluster view;
2. If the process is alive, run curl -s <http://127.0.0.1:8500/v1/status/leader> to verify the API; a 403 means the ACL token used for collection lacks permission or has expired;
3. If the process is gone, check journalctl -u consul for the cause (a corrupted raft data directory or a port conflict are common);
4. Before recovering, confirm the remaining nodes still form a quorum so you do not accidentally push the cluster out of quorum.

### Consul cluster has no leader[​](#consul-cluster-has-no-leader "Direct link to Consul cluster has no leader")

S1 Critical · for 1 min · Trigger:

```
consul_raft_leader == 0
```

Runbook:

1. Run consul operator raft list-peers on each server node and confirm whether the number of surviving servers has fallen below a quorum;
2. If quorum is lost, bring the failed servers back up first rather than jumping to a peers.json recovery;
3. If enough servers survive but no leader is elected, check connectivity on ports 8300/8301 between servers and clock skew (chronyc tracking);
4. Only once automatic recovery is ruled out should you rebuild the peer list by hand with raft/peers.json following the official outage recovery procedure.

### Consul Autopilot reports the cluster unhealthy[​](#consul-autopilot-reports-the-cluster-unhealthy "Direct link to Consul Autopilot reports the cluster unhealthy")

S1 Critical · for 3 min · Trigger:

```
consul_autopilot_healthy == 0
```

Runbook:

1. Run consul operator autopilot state and check Healthy and LastContact for every server;
2. For nodes with Healthy=false, check that the process is alive and measure network latency to the leader;
3. A LastIndex far behind means the node is still catching up on logs; watch whether it keeps converging, and note that slow disk IO is a common cause (confirm with iostat -x 1);
4. Once a node is confirmed dead, remove it from the cluster with consul force-leave \<node> or consul operator raft remove-peer.

### Consul cluster fault tolerance is zero[​](#consul-cluster-fault-tolerance-is-zero "Direct link to Consul cluster fault tolerance is zero")

S2 Warning · for 5 min · Trigger:

```
consul_autopilot_failure_tolerance == 0
```

Runbook:

1. Run consul operator raft list-peers and count the healthy servers (a 3-node cluster tolerates 1 failure, a 5-node cluster tolerates 2);
2. If a node is unhealthy, repair that node rather than adding a new one, so the peer count does not become even;
3. When you genuinely need to grow, scale to an odd number such as 5 and confirm fault tolerance recovers once the new node has caught up on raft;
4. Avoid any rolling restart or version upgrade until this is resolved.

### Consul service health check critical[​](#consul-service-health-check-critical "Direct link to Consul service health check critical")

categraf pushes one sample per status (passing/warning/critical/maintenance) with an identical metric name and label set, so the values overwrite each other once stored. This rule therefore tests for the presence of the status label rather than comparing values.

S2 Warning · for 3 min · Trigger:

```
count by (address, node, service_name, check_name) (consul_health_service_status{status="critical"}) > 0
```

Runbook:

1. Take node and service\_name from the alert labels and run consul catalog nodes -service=\<service\_name> to see how many healthy instances remain; scale out immediately if only one is left;
2. Log in to the node and run curl -s [http://127.0.0.1:8500/v1/health/checks/\\](http://127.0.0.1:8500/v1/health/checks/%5C)\<service\_name> to read the exact failure reason from the Output field;
3. Follow that Output to the matching process and port (check script timeout, unexpected HTTP status, TCP connection refused);
4. If the check itself is misconfigured (timeout too short, wrong path), fix the service definition and run consul reload.

### Consul node health check critical[​](#consul-node-health-check-critical "Direct link to Consul node health check critical")

S2 Warning · for 3 min · Trigger:

```
count by (address, node, check_name) (consul_health_node_status{status="critical"}) > 0
```

Runbook:

1. Take node from the alert labels and run consul members to see whether the node's Serf state is alive or failed;
2. failed means gossip is not getting through: check bidirectional connectivity on port 8301 and security groups, and whether the host is down;
3. If the node is up but serfHealth flaps repeatedly, it is usually packet loss or high host load causing gossip timeouts; confirm with mtr and uptime;
4. Once the node is confirmed decommissioned, clean it up with consul force-leave \<node> so the stale entry stops alerting.

### Consul cluster member not alive[​](#consul-cluster-member-not-alive "Direct link to Consul cluster member not alive")

S2 Warning · for 3 min · Trigger:

```
consul_serf_lan_member_status != 1
```

Runbook:

1. Take the node name from the member label and run consul members to confirm its current state;
2. For Failed, first check that the host is up and the consul process is running;
3. If the host is fine, check bidirectional TCP/UDP connectivity on port 8301 and the MTU (gossip relies on UDP, and an MTU mismatch causes intermittent loss of contact);
4. If the node really is decommissioned, run consul force-leave \<node>; entries left in the Left state are cleaned up automatically after 72 hours.

## Related[​](#related "Direct link to Related")

* [Consul template source](https://github.com/ccfos/nightingale/tree/main/integrations/Consul): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `consul` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/consul): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
