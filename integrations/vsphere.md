# Monitor vSphere with Nightingale

Pulls CPU, memory, disk and network performance counters for ESXi hosts, virtual machines, datastores and clusters through the vCenter API.

Last reviewed 2026-10-27

The vSphere input pulls performance data through the vCenter Server API across five levels: datacenter, cluster, ESXi host, virtual machine and datastore. That includes CPU ready time and usage, active memory and ballooning, disk latency and IOPS, network throughput and datastore capacity. A vCenter is required; connecting to a bare ESXi host does not work.

Give Categraf a vCenter account with a read-only role rather than administrator. The config lets you narrow the counters per object type, which is advisable on large vCenters. The rules cover hosts disconnecting, high VM CPU ready time, memory ballooning, datastores near capacity and disk latency.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **2 dashboards**, 74 panels in total
* **5 alert rules**, each with runbook steps
* **Categraf collector config**: `input.vsphere`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.vsphere/vsphere.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.vsphere started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   # Read metrics from one or many vCenters

   [[instances]]

     ##  vCenter URLs to be monitored. These three lines must be uncommented

     ## and edited for the plugin to work.

     #vcenter = "https://vcenter.local/sdk"

     #username = "user@corp.local"

     #password = "secret"



     ## VMs

     ## Typical VM metrics (if omitted or empty, all metrics are collected)

     # vm_include = [ "/*/vm/**"] # Inventory path to VMs to collect (by default all are collected)

     # vm_exclude = [] # Inventory paths to exclude

     vm_metric_include = [

       "cpu.demand.average",

       "cpu.idle.summation",

       "cpu.latency.average",

       "cpu.readiness.average",

       "cpu.ready.summation",

       "cpu.run.summation",

       "cpu.usagemhz.average",

       "cpu.used.summation",

       "cpu.wait.summation",

       "mem.active.average",

       "mem.granted.average",

       "mem.latency.average",

       "mem.swapin.average",

       "mem.swapinRate.average",

       "mem.swapout.average",

       "mem.swapoutRate.average",

       "mem.usage.average",

       "mem.vmmemctl.average",

       "net.bytesRx.average",

       "net.bytesTx.average",

       "net.droppedRx.summation",

       "net.droppedTx.summation",

       "net.usage.average",

       "power.power.average",

       "virtualDisk.numberReadAveraged.average",

       "virtualDisk.numberWriteAveraged.average",

       "virtualDisk.read.average",

       "virtualDisk.readOIO.latest",

       "virtualDisk.throughput.usage.average",

       "virtualDisk.totalReadLatency.average",

       "virtualDisk.totalWriteLatency.average",

       "virtualDisk.write.average",

       "virtualDisk.writeOIO.latest",

       "sys.uptime.latest",

     ]

     # vm_metric_exclude = [] ## Nothing is excluded by default

     # vm_instances = true ## true by default



     ## Hosts

     ## Typical host metrics (if omitted or empty, all metrics are collected)

     # host_include = [ "/*/host/**"] # Inventory path to hosts to collect (by default all are collected)

     # host_exclude [] # Inventory paths to exclude

     host_metric_include = [

       "cpu.coreUtilization.average",

       "cpu.costop.summation",

       "cpu.demand.average",

       "cpu.idle.summation",

       "cpu.latency.average",

       "cpu.readiness.average",

       "cpu.ready.summation",

       "cpu.swapwait.summation",

       "cpu.usage.average",

       "cpu.usagemhz.average",

       "cpu.used.summation",

       "cpu.utilization.average",

       "cpu.wait.summation",

       "disk.deviceReadLatency.average",

       "disk.deviceWriteLatency.average",

       "disk.kernelReadLatency.average",

       "disk.kernelWriteLatency.average",

       "disk.numberReadAveraged.average",

       "disk.numberWriteAveraged.average",

       "disk.read.average",

       "disk.totalReadLatency.average",

       "disk.totalWriteLatency.average",

       "disk.write.average",

       "mem.active.average",

       "mem.latency.average",

       "mem.state.latest",

       "mem.swapin.average",

       "mem.swapinRate.average",

       "mem.swapout.average",

       "mem.swapoutRate.average",

       "mem.totalCapacity.average",

       "mem.usage.average",

       "mem.vmmemctl.average",

       "net.bytesRx.average",

       "net.bytesTx.average",

       "net.droppedRx.summation",

       "net.droppedTx.summation",

       "net.errorsRx.summation",

       "net.errorsTx.summation",

       "net.usage.average",

       "power.power.average",

       "storageAdapter.numberReadAveraged.average",

       "storageAdapter.numberWriteAveraged.average",

       "storageAdapter.read.average",

       "storageAdapter.write.average",

       "sys.uptime.latest",

     ]



     # host_instances = true ## true by default

     # host_include = [] ## Nothing included by default

     # host_exclude = [] ## Nothing excluded by default

     # host_metric_include = [] ## Nothing included by default

     # host_metric_exclude = [] ## Nothing excluded by default



     ## Clusters

     # cluster_include = [ "/*/host/**"] # Inventory path to clusters to collect (by default all are collected)

     # cluster_exclude = [] # Inventory paths to exclude

     # cluster_metric_include = [] ## if omitted or empty, all metrics are collected

     # cluster_metric_exclude = [] ## Nothing excluded by default

     # cluster_instances = false ## false by default



     ## Resource Pools

     # resoucepool_include = [ "/*/host/**"] # Inventory path to datastores to collect (by default all are collected)

     # resoucepool_exclude = [] # Inventory paths to exclude

     # resoucepool_metric_include = [] ## if omitted or empty, all metrics are collected

     # resoucepool_metric_exclude = [] ## Nothing excluded by default

     # resoucepool_instances = false ## false by default



     ## Datastores

     # datastore_include = [ "/*/datastore/**"] # Inventory path to datastores to collect (by default all are collected)

     # datastore_exclude = [] # Inventory paths to exclude

     # datastore_metric_include = [] ## if omitted or empty, all metrics are collected

     # datastore_metric_exclude = [] ## Nothing excluded by default

     # datastore_instances = false ## false by default



     ## Datacenters

     # datacenter_include = [ "/*/host/**"] # Inventory path to clusters to collect (by default all are collected)

     # datacenter_exclude = [] # Inventory paths to exclude

     # datacenter_metric_include = [] ## if omitted or empty, all metrics are collected

     # datacenter_metric_exclude = [ "*" ] ## Datacenters are not collected by default.

     # datacenter_instances = false ## false by default



     ## Plugin Settings

     ## separator character to use for measurement and field names (default: "_")

     # separator = "_"



      ## Collect IP addresses? Valid values are "ipv4" and "ipv6"

     # ip_addresses = ["ipv6", "ipv4" ]



     ## When set to true, all samples are sent as integers. This makes the output

     ## data types backwards compatible with Telegraf 1.9 or lower. Normally all

     ## samples from vCenter, with the exception of percentages, are integer

     ## values, but under some conditions, some averaging takes place internally in

     ## the plugin. Setting this flag to "false" will send values as floats to

     ## preserve the full precision when averaging takes place.

     # use_int_samples = true



     ## Custom attributes from vCenter can be very useful for queries in order to slice the

     ## metrics along different dimension and for forming ad-hoc relationships. They are disabled

     ## by default, since they can add a considerable amount of tags to the resulting metrics. To

     ## enable, simply set custom_attribute_exclude to [] (empty set) and use custom_attribute_include

     ## to select the attributes you want to include.

     ## By default, since they can add a considerable amount of tags to the resulting metrics. To

     ## enable, simply set custom_attribute_exclude to [] (empty set) and use custom_attribute_include

     ## to select the attributes you want to include.

     # custom_attribute_include = []

     # custom_attribute_exclude = ["*"]



     ## The number of vSphere 5 minute metric collection cycles to look back for non-realtime metrics. In

     ## some versions (6.7, 7.0 and possible more), certain metrics, such as cluster metrics, may be reported

     ## with a significant delay (>30min). If this happens, try increasing this number. Please note that increasing

     ## it too much may cause performance issues.

     # metric_lookback = 3



     ## number of objects to retrieve per query for realtime resources (vms and hosts)

     ## set to 64 for vCenter 5.5 and 6.0 (default: 256)

     # max_query_objects = 256



     ## number of metrics to retrieve per query for non-realtime resources (clusters and datastores)

     ## set to 64 for vCenter 5.5 and 6.0 (default: 256)

     # max_query_metrics = 256



     ## number of go routines to use for collection and discovery of objects and metrics

     # collect_concurrency = 1

     # discover_concurrency = 1



     ## the interval before (re)discovering objects subject to metrics collection (default: 300s)

     # object_discovery_interval = "300s"



     ## timeout applies to any of the api request made to vcenter

     # timeout = "60s"



     ## Optional SSL Config

     # use_tls = false

     # tls_ca = "/path/to/cafile"

     # tls_cert = "/path/to/certfile"

     # tls_key = "/path/to/keyfile"

     ## Use SSL but skip chain & host verification

     # insecure_skip_verify = false



     ## The Historical Interval value must match EXACTLY the interval in the daily

     # "Interval Duration" found on the VCenter server under Configure > General > Statistics > Statistic intervals

     # historical_interval = "5m"
   ```

2. Open the integration center in Nightingale, find vSphere, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                 | Panels |
| ------------------------- | ------ |
| VMware by vSphere-monitor | 50     |
| Vsphere                   | 24     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### ESXi host CPU usage exceeds 70%[​](#esxi-host-cpu-usage-exceeds-70 "Direct link to ESXi host CPU usage exceeds 70%")

S2 Warning · for 1 min · Trigger:

```
(sum(vsphere_host_cpu_usage_average{}) by(esxhostname)/count(vsphere_host_cpu_usage_average{}) by(esxhostname)) > 70
```

Runbook:

1. Locate the ESXi host in vCenter and see which virtual machines contribute most of the load;
2. Use vSphere DRS or a manual vMotion to move some VMs to a less loaded host;
3. Confirm no VM is squeezing the others through over-provisioned vCPUs;
4. If the whole cluster is running hot, add physical hosts.

### ESXi host memory usage exceeds 70%[​](#esxi-host-memory-usage-exceeds-70 "Direct link to ESXi host memory usage exceeds 70%")

S2 Warning · for 1 min · Trigger:

```
(sum(vsphere_host_mem_usage_average{}) by(esxhostname)/count(vsphere_host_mem_usage_average{}) by(esxhostname)) > 70
```

Runbook:

1. Locate the ESXi host in vCenter and see which virtual machines contribute most of the load;
2. Use vSphere DRS or a manual vMotion to move some VMs to a less loaded host;
3. Confirm no VM is squeezing the others through over-provisioned vCPUs;
4. If the whole cluster is running hot, add physical hosts.

### VM CPU usage exceeds 70%[​](#vm-cpu-usage-exceeds-70 "Direct link to VM CPU usage exceeds 70%")

S2 Warning · for 1 min · Trigger:

```
(sum(vsphere_vm_cpu_usage_average{}) by(vmname)/count(vsphere_vm_cpu_usage_average{}) by(vmname))>70
```

Runbook:

1. Log in to the VM and use top or Task Manager to find the busiest process;
2. Tell traffic growth apart from a program fault (infinite loop, frequent GC);
3. Check the VM's CPU Ready value in vCenter — high means host contention rather than the VM being undersized;
4. Add vCPUs once confirmed, or migrate the VM to a less loaded host.

### VM memory usage exceeds 70%[​](#vm-memory-usage-exceeds-70 "Direct link to VM memory usage exceeds 70%")

S2 Warning · for 1 min · Trigger:

```
(sum(vsphere_vm_mem_usage_average{}) by(vmname)/count(vsphere_vm_mem_usage_average{}) by(vmname))>70
```

Runbook:

1. Log in to the VM and find the largest memory consumer, judging whether it is a leak;
2. In vCenter check the VM's Balloon and Swapped metrics — non-zero means the host is reclaiming its memory;
3. If the host is tight, migrate VMs or expand the host first;
4. If the VM itself is short, add memory; if it is a leak, locate it in the application.

### vSphere disk usage exceeds 70%[​](#vsphere-disk-usage-exceeds-70 "Direct link to vSphere disk usage exceeds 70%")

S2 Warning · for 15s · Trigger:

```
sum(vsphere_datastore_disk_used_latest{vcenter=~".+"}/vsphere_datastore_disk_capacity_latest{vcenter=~".+"}) by(source)*100 > 70
```

Runbook:

1. Locate the datastore in vCenter and sort by capacity to find the largest VMs and snapshots;
2. Clean up leftover snapshots first — snapshots are the most common reason a datastore fills up;
3. Remove unused ISOs, templates and leftover files from decommissioned VMs;
4. Use Storage vMotion to move some VMs to a datastore with headroom, and expand capacity longer term.

## Related[​](#related "Direct link to Related")

* [vSphere template source](https://github.com/ccfos/nightingale/tree/main/integrations/vSphere): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `vsphere` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/vsphere): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
