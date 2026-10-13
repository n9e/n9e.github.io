# Monitor OpenStack with Nightingale

Collects resources and quotas from Nova, Neutron, Cinder, Glance, Keystone and Heat through the OpenStack API, plus the state of every instance.

Last reviewed 2026-10-13

The OpenStack input calls each service's API with a read-capable account: Nova instances, hypervisors and quotas; Neutron networks, subnets, ports, floating IPs and security groups; Cinder volumes and snapshots; Glance images; Keystone projects and users; Heat stacks. Every instance's state, project and flavor is reported as a metric too.

Required API versions: blockstorage v3, compute v2, identity v3, networking v2. The rules cover instances entering ERROR, hypervisor resources near the limit, exhausted quotas and service APIs being unreachable.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 alert rules**, each with runbook steps
* **Categraf collector config**: `input.openstack`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.openstack/openstack.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.openstack started` once the plugin is loaded.

   ```
   # Collects performance metrics from OpenStack services

   [[instances]]

   ## The recommended interval to poll is '30m'



   ## The identity endpoint to authenticate against and get the service catalog from.

   # Keystone

   authentication_endpoint = "https://my.openstack.cloud:5000"

   ## The metric endpoint to collect metrics from.

   # Gnocchi

   metric_endpoint = "http://my.openstack.cloud:5000/metric/v1"

   ## The compute endpoint to collect metrics from.

   # Nova

   compute_endpoint = "http://my.openstack.cloud:5000/compute/v2.1"



   ## metric interval is the interval to collect metrics from the metric endpoint.

   metric_interval = "5m"



   # catch_ttl="4h"



   ## whether to gather metric in batch

   use_batch = false



   ## openstack version

   version = "v6"



   ## The domain to authenticate against when using a V3 identity endpoint.

   # domain = "default"



   ## The project to authenticate as.

   # project = "admin"



   ## User authentication credentials. Must have admin rights.

   username = "admin"

   password = "password"



   # rate limit for the OpenStack API requests

   # ratelimit=25



   ## Available services are:

   ## "agents", "aggregates", "cinder_services", "flavors", "hypervisors", "networks",

   ## "nova_services", "ports", "projects", "servers", "services", "stacks", "storage_pools",

   ## "metrics", "subnets", "volumes"

   # enabled_services = ["metrics", "services", "projects", "hypervisors", "flavors", "networks", "volumes"]



   # metric_resources = ["volume", "instance_network_interface", "instance_disk"]



   ## Collect Server Diagnostics

   # server_diagnotics = false



   ## output secrets (such as adminPass(for server) and UserID(for volume)).

   # output_secrets = false



   ## Amount of time allowed to complete the HTTP(s) request.

   # timeout = "5s"



   ## HTTP Proxy support

   # http_proxy_url = ""



   ## Optional TLS Config

   # tls_ca = /path/to/cafile

   # tls_cert = /path/to/certfile

   # tls_key = /path/to/keyfile

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false



   ## Options for tags received from Openstack

   # tag_prefix = "openstack_tag_"

   # tag_value = "true" # tag value is required.



   ## Timestamp format for timestamp data received from Openstack.

   ## If false format is unix nanoseconds.

   # human_readable_timestamps = false



   ## Measure Openstack call duration

   # measure_openstack_requests = false



   #[[instances]]

   ### The recommended interval to poll is '30m'



   ### The identity endpoint to authenticate against and get the service catalog from.

   #authentication_endpoint = "https://my.openstack.cloud:5000"

   ### The metric endpoint to collect metrics from.

   #metric_endpoint = "http://my.openstack.cloud:5000/metric/v1"

   ### The compute endpoint to collect metrics from.

   #compute_endpoint = "http://my.openstack.cloud:5000/compute/v2.1"



   ### metric interval is the interval to collect metrics from the metric endpoint.

   #metric_interval = "5m"



   # catch_ttl="4h"



   ## whether to gather metric in batch

   # use_batch = false



   ## openstack version

   # version = "v6"



   ### The domain to authenticate against when using a V3 identity endpoint.

   ## domain = "default"



   ### The project to authenticate as.

   ## project = "admin"



   ### User authentication credentials. Must have admin rights.

   #username = "admin"

   #password = "password"



   # rate limit for the OpenStack API requests

   # ratelimit=25



   ### Available services are:

   ### "agents", "aggregates", "cinder_services", "flavors", "hypervisors", "networks",

   ### "nova_services", "ports", "projects", "servers", "services", "stacks", "storage_pools",

   ### "metrics", "subnets", "volumes"

   ## enabled_services = ["metrics", "services", "projects", "hypervisors", "flavors", "networks", "volumes"]



   # metric_resources = ["volume", "instance_network_interface", "instance_disk"]



   ### Collect Server Diagnostics

   ## server_diagnotics = false



   ### output secrets (such as adminPass(for server) and UserID(for volume)).

   ## output_secrets = false



   ### Amount of time allowed to complete the HTTP(s) request.

   ## timeout = "5s"



   ### HTTP Proxy support

   ## http_proxy_url = ""



   ### Optional TLS Config

   ## tls_ca = /path/to/cafile

   ## tls_cert = /path/to/certfile

   ## tls_key = /path/to/keyfile

   ### Use TLS but skip chain & host verification

   ## insecure_skip_verify = false



   ### Options for tags received from Openstack

   ## tag_prefix = "openstack_tag_"

   ## tag_value = "true" # tag value is required.



   ### Timestamp format for timestamp data received from Openstack.

   ### If false format is unix nanoseconds.

   ## human_readable_timestamps = false



   ### Measure Openstack call duration

   ## measure_openstack_requests = false
   ```

2. Open the integration center in Nightingale, find OpenStack, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### OpenStack Neutron agent down[​](#openstack-neutron-agent-down "Direct link to OpenStack Neutron agent down")

S1 Critical · for 3 min · Trigger:

```
openstack_neutron_agent_alive == 0
```

Runbook:

1. Take agent\_host and agent\_type from the alert labels and confirm the state with openstack network agent list;
2. Log in to that node and run systemctl status neutron-openvswitch-agent (or the matching agent) to check the process and logs;
3. If the process is alive but the heartbeat has timed out, check connectivity from that node to the message queue (RabbitMQ); agent heartbeats travel over RPC, so an unreachable MQ is the most common cause;
4. After recovery run openstack network agent list to confirm alive is True and spot-check networking on one VM on that node.

### OpenStack Nova service forced down[​](#openstack-nova-service-forced-down "Direct link to OpenStack Nova service forced down")

S1 Critical · for 3 min · Trigger:

```
openstack_nova_service_forced_down == 1
```

Runbook:

1. Take host\_machine and name from the alert labels and confirm the state with openstack compute service list;
2. Check the change record to determine whether this is planned maintenance;
3. If unplanned, log in to the compute node and check the nova-compute process and connectivity to the MQ and database;
4. Once the node is confirmed healthy, clear the flag with nova service-force-down \<host> nova-compute --unset and verify VM scheduling works again.

### Hypervisor vCPU allocation too high[​](#hypervisor-vcpu-allocation-too-high "Direct link to Hypervisor vCPU allocation too high")

S2 Warning · for 10 min · Trigger:

```
openstack_hypervisor_vcpus_used / (openstack_hypervisor_vcpus > 0) * 100 > 90
```

Runbook:

1. Take hypervisor\_hostname from the alert labels and run openstack hypervisor show \<host> to confirm vcpus\_used and vcpus;
2. Read it together with cpu\_allocation\_ratio to see whether overcommit headroom remains; at the default 16:1 ratio the vcpus value is already the post-overcommit figure;
3. If idle VMs sit on this node, clean them up or migrate them with openstack server migrate;
4. If the whole cluster is short on headroom, add compute nodes, and first confirm the scheduler filters are not concentrating load on a few nodes.

### Hypervisor memory allocation too high[​](#hypervisor-memory-allocation-too-high "Direct link to Hypervisor memory allocation too high")

S2 Warning · for 10 min · Trigger:

```
openstack_hypervisor_memory_mb_used / (openstack_hypervisor_memory_mb > 0) * 100 > 90
```

Runbook:

1. Take hypervisor\_hostname from the alert labels and run openstack hypervisor show \<host> to compare memory\_mb\_used with memory\_mb;
2. Log in to the node and compare with free -g; high allocation but low real usage means VM flavors are oversized and the business can be pushed to right-size them;
3. To free capacity, migrate some instances to idle nodes with openstack server migrate;
4. If the cluster as a whole is tight, add compute nodes and double-check that ram\_allocation\_ratio has not been set above 1 by mistake.

### Hypervisor local disk allocation too high[​](#hypervisor-local-disk-allocation-too-high "Direct link to Hypervisor local disk allocation too high")

S2 Warning · for 10 min · Trigger:

```
openstack_hypervisor_local_gb_used / (openstack_hypervisor_local_gb > 0) * 100 > 90
```

Runbook:

1. Take hypervisor\_hostname from the alert labels, log in to the node, and run df -h plus du -sh /var/lib/nova/instances/\* | sort -rh | head to find the biggest consumers;
2. Clean up leftover directories from deleted instances and old base image caches (they accumulate indefinitely when nova's image cache manager is disabled);
3. To free capacity, migrate instances to other nodes or switch root disks to Cinder volume boot;
4. Longer term give /var/lib/nova/instances its own volume with a capacity alert.

## Related[​](#related "Direct link to Related")

* [OpenStack template source](https://github.com/ccfos/nightingale/tree/main/integrations/OpenStack): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
