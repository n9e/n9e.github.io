# 用夜莺监控 OpenStack

通过 OpenStack API 采集 Nova、Neutron、Cinder、Glance、Keystone 和 Heat 的资源与配额，以及每台实例的状态。

最后校对于 2026-10-13

OpenStack 插件以一个有读取权限的账号调用各服务的 API：Nova 的实例、hypervisor 与配额，Neutron 的网络、子网、端口、浮动 IP 与安全组，Cinder 的卷与快照，Glance 的镜像，Keystone 的项目与用户，Heat 的栈。每台实例的状态、所属项目和 flavor 也会作为指标上报。

需要的 API 版本：blockstorage v3、compute v2、identity v3、networking v2。规则覆盖实例进入 ERROR、hypervisor 资源逼近上限、配额用尽、服务 API 不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.openstack`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.openstack/openstack.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.openstack started` 就说明插件已加载。

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

2. 在夜莺「集成中心」里找到 OpenStack，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### OpenStack Neutron Agent 离线[​](#openstack-neutron-agent-离线 "OpenStack Neutron Agent 离线的直接链接")

S1 紧急 · 持续 3 分钟 · 触发条件:

```
openstack_neutron_agent_alive == 0
```

处置步骤:

1. 从告警标签取 agent\_host 与 agent\_type，执行 openstack network agent list 确认状态；
2. 登录该节点执行 systemctl status neutron-openvswitch-agent（或对应 agent）查看进程与日志；
3. 进程存活但心跳超时的，检查该节点到消息队列（RabbitMQ）的连通性，agent 心跳走 RPC，MQ 不通是最常见原因；
4. 恢复后执行 openstack network agent list 确认 alive 变为 True，并抽查一台该节点上的虚拟机网络是否正常。

### OpenStack Nova 服务被强制下线[​](#openstack-nova-服务被强制下线 "OpenStack Nova 服务被强制下线的直接链接")

S1 紧急 · 持续 3 分钟 · 触发条件:

```
openstack_nova_service_forced_down == 1
```

处置步骤:

1. 从告警标签取 host\_machine 与 name，执行 openstack compute service list 确认状态；
2. 确认是否是计划内的维护下线，核对变更单；
3. 非计划的登录该计算节点检查 nova-compute 进程、到 MQ 与数据库的连通性；
4. 节点确认恢复后执行 nova service-force-down \<host> nova-compute --unset 取消强制下线标记，再验证虚拟机调度是否恢复正常。

### Hypervisor vCPU 分配率过高[​](#hypervisor-vcpu-分配率过高 "Hypervisor vCPU 分配率过高的直接链接")

S2 警告 · 持续 10 分钟 · 触发条件:

```
openstack_hypervisor_vcpus_used / (openstack_hypervisor_vcpus > 0) * 100 > 90
```

处置步骤:

1. 从告警标签取 hypervisor\_hostname，执行 openstack hypervisor show \<host> 确认 vcpus\_used 与 vcpus；
2. 结合 cpu\_allocation\_ratio 确认是否还有超分空间，默认 16:1 的超分比下 vcpus 已是折算后的值；
3. 该节点上有闲置虚拟机的先清理或迁移（openstack server migrate）；
4. 集群整体余量不足的需要扩容计算节点，扩容前先确认调度器的 filter 配置没有把负载压在少数节点上。

### Hypervisor 内存分配率过高[​](#hypervisor-内存分配率过高 "Hypervisor 内存分配率过高的直接链接")

S2 警告 · 持续 10 分钟 · 触发条件:

```
openstack_hypervisor_memory_mb_used / (openstack_hypervisor_memory_mb > 0) * 100 > 90
```

处置步骤:

1. 从告警标签取 hypervisor\_hostname，执行 openstack hypervisor show \<host> 对比 memory\_mb\_used 与 memory\_mb；
2. 登录节点执行 free -g 对比实际使用，分配率高但实际使用低说明虚拟机规格开大了，可推动业务缩容；
3. 需要腾空间的用 openstack server migrate 把部分实例迁到空闲节点；
4. 集群整体紧张的扩容计算节点，并复核 ram\_allocation\_ratio 是否被误设为大于 1。

### Hypervisor 本地磁盘分配率过高[​](#hypervisor-本地磁盘分配率过高 "Hypervisor 本地磁盘分配率过高的直接链接")

S2 警告 · 持续 10 分钟 · 触发条件:

```
openstack_hypervisor_local_gb_used / (openstack_hypervisor_local_gb > 0) * 100 > 90
```

处置步骤:

1. 从告警标签取 hypervisor\_hostname，登录节点执行 df -h 与 du -sh /var/lib/nova/instances/\* | sort -rh | head 找出占用大头；
2. 清理已删除实例的残留目录与旧的 base 镜像缓存（nova 的 image cache manager 未开启时会持续累积）；
3. 需要腾空间的把实例迁到其他节点，或把系统盘改为 Cinder 卷启动；
4. 长期建议给 /var/lib/nova/instances 使用独立卷并配置扩容告警。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[OpenStack 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/OpenStack）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/OpenStack%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
