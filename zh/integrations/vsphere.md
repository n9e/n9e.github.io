# 用夜莺监控 vSphere

通过 vCenter API 采集 ESXi 主机、虚拟机、数据存储和集群的 CPU、内存、磁盘与网络性能计数器。

最后校对于 2026-10-13

vSphere 插件通过 vCenter Server 的 API 拉取性能数据，覆盖数据中心、集群、ESXi 主机、虚拟机和数据存储五个层级：CPU 就绪时间与使用率、内存活跃与 ballooning、磁盘延迟与 IOPS、网络吞吐、数据存储容量。监控 vSphere 必须有 vCenter，直接连 ESXi 不行。

给 Categraf 一个只读角色的 vCenter 账号，不要用 administrator。配置里可以按对象类型筛选要采的计数器，vCenter 规模大时建议收窄。规则覆盖主机失联、虚拟机 CPU 就绪时间过高、内存 ballooning、数据存储空间逼近上限和磁盘延迟。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **2 张仪表盘**，共 74 个面板
* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.vsphere`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.vsphere/vsphere.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.vsphere started` 就说明插件已加载。

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

2. 在夜莺「集成中心」里找到 vSphere，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                    | 面板数 |
| ------------------------- | ------ |
| VMware by vSphere-monitor | 50     |
| Vsphere                   | 24     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### ESXi实例CPU使用率大于70%[​](#esxi实例cpu使用率大于70 "ESXi实例CPU使用率大于70%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
(sum(vsphere_host_cpu_usage_average{}) by(esxhostname)/count(vsphere_host_cpu_usage_average{}) by(esxhostname)) > 70
```

处置步骤:

1. 在 vCenter 上定位该 ESXi 主机，看是哪些虚拟机贡献了主要负载；
2. 用 vSphere DRS 或手工 vMotion 把部分虚拟机迁到负载较低的主机；
3. 确认没有虚拟机因配置过高（vCPU 超配）而挤占资源；
4. 若整个集群水位都高，则需要扩容物理主机。

### ESXi实例内存使用率大于70%[​](#esxi实例内存使用率大于70 "ESXi实例内存使用率大于70%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
(sum(vsphere_host_mem_usage_average{}) by(esxhostname)/count(vsphere_host_mem_usage_average{}) by(esxhostname)) > 70
```

处置步骤:

1. 在 vCenter 上定位该 ESXi 主机，看是哪些虚拟机贡献了主要负载；
2. 用 vSphere DRS 或手工 vMotion 把部分虚拟机迁到负载较低的主机；
3. 确认没有虚拟机因配置过高（vCPU 超配）而挤占资源；
4. 若整个集群水位都高，则需要扩容物理主机。

### VM虚拟机CPU使用率大于70%[​](#vm虚拟机cpu使用率大于70 "VM虚拟机CPU使用率大于70%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
(sum(vsphere_vm_cpu_usage_average{}) by(vmname)/count(vsphere_vm_cpu_usage_average{}) by(vmname))>70
```

处置步骤:

1. 登录该虚拟机内部，用 top/任务管理器定位占用最高的进程；
2. 区分业务量增长与程序异常（死循环、频繁 GC）；
3. 在 vCenter 看该虚机的 CPU Ready 值——高说明是宿主机争抢而非虚机自身不够；
4. 确认后按需给虚机加 vCPU，或把它迁到负载更低的宿主机。

### VM虚拟机内存使用率大于70%[​](#vm虚拟机内存使用率大于70 "VM虚拟机内存使用率大于70%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
(sum(vsphere_vm_mem_usage_average{}) by(vmname)/count(vsphere_vm_mem_usage_average{}) by(vmname))>70
```

处置步骤:

1. 登录该虚拟机内部，定位占用最高的进程并判断是否内存泄漏；
2. 在 vCenter 看该虚机的 Balloon 与 Swapped 指标——不为 0 说明宿主机在回收它的内存；
3. 宿主机紧张的先迁虚机或扩宿主机；
4. 虚机自身不够的按需加内存，泄漏的在应用侧定位。

### VSphere磁盘使用率大于70%[​](#vsphere磁盘使用率大于70 "VSphere磁盘使用率大于70%的直接链接")

S2 警告 · 持续 15 秒 · 触发条件:

```
sum(vsphere_datastore_disk_used_latest{vcenter=~".+"}/vsphere_datastore_disk_capacity_latest{vcenter=~".+"}) by(source)*100 > 70
```

处置步骤:

1. 在 vCenter 定位该 Datastore，按容量排序找出占用最大的虚拟机与快照；
2. 优先清理遗留快照——快照是 Datastore 被吃满最常见的原因；
3. 清理无用的 ISO、模板与已下线虚机的残留文件；
4. 用 Storage vMotion 把部分虚机迁到余量充足的存储，长期需扩容。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[vSphere 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/vSphere）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/vSphere%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `vsphere` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/vsphere)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
