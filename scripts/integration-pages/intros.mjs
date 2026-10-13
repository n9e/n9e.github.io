/**
 * 每个集成页站点自己写的那部分：一句话摘要（description）、开头的介绍、「怎么接入」前的说明。
 * 其余内容（规则、指标、仪表盘、采集配置）全部来自上游数据，见 generate.mjs。
 *
 * 字段：
 *   zh / en:
 *     title?   页面标题，默认「用夜莺监控 <name>」/「Monitor <name> with Nightingale」
 *     summary  一句话，进 <meta description> 和 H1 下的导语，150 字以内
 *     intro    Markdown，两三段：这是什么、监控它要盯什么、模板怎么覆盖
 *     connect? Markdown，接入说明；没有采集配置的集成在这里给出抓取方式和示例
 *   related?  额外的相关链接，[{ zh: '[文案](路径)', en: '...' }]
 *
 * 不写的：商业版、任何站外文档站；数字（规则数等）由生成器按数据填，这里不要写死。
 */

const CATEGRAF_PROM = {
  zh: '这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](/docs/data/prometheus)，模板同样能用。',
  en: 'These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](/docs/data/prometheus) and the templates work as they are.',
};

const practice = (id, zh, en) => ({ zh: `[${zh}](/docs/practice/${id})`, en: `[${en}](/docs/practice/${id})` });

export const INTROS = {
  // ---------------------------------------------------------------- 主机
  Linux: {
    related: [practice('linux', '实践：监控 Linux 主机', 'Walkthrough: monitor Linux hosts')],
    zh: {
      summary: 'CPU、内存、磁盘、网络、进程到内核参数，Categraf 装上就有数据，模板覆盖 Categraf、node_exporter 和 Telegraf 三种采集口径。',
      intro: `Linux 主机是绝大多数监控的起点。Categraf 自带的 cpu、mem、disk、diskio、net、netstat、kernel、processes 等插件默认开启，装好就上报，不用额外配置；下面列出的是那些有可调项的插件。

模板里的仪表盘和规则分三套：按 Categraf 指标名写的、按 node_exporter 指标名写的、按 Telegraf 指标名写的。用哪种采集器就导哪一套，混用会看到空面板。规则覆盖了磁盘写满预测、IO 繁忙、conntrack 表、时间漂移、失联等运维上真正会半夜被叫醒的场景。`,
    },
    en: {
      summary: 'CPU, memory, disk, network, processes and kernel parameters out of the box; templates cover Categraf, node_exporter and Telegraf metric names.',
      intro: `Linux hosts are where most monitoring starts. Categraf's cpu, mem, disk, diskio, net, netstat, kernel and processes inputs are enabled by default and report as soon as the agent starts. The configs listed below are the plugins that have options worth tuning.

The templates come in three sets, written against Categraf, node_exporter and Telegraf metric names respectively. Import the set that matches your collector; mixing them produces empty panels. The rules cover the things that actually page people: disks predicted to fill up, busy IO, conntrack exhaustion, clock drift and hosts going silent.`,
    },
  },
  Windows: {
    zh: {
      summary: 'Categraf 在 Windows 上采集的指标和 Linux 同名，主机仪表盘与规则可以复用；另有按 windows_exporter 指标写的 AD、DNS、ADFS 仪表盘。',
      intro: `Categraf 同样支持 Windows，而且 CPU、内存、磁盘、网络这些基础指标的命名和 Linux 保持一致，所以主机类的告警规则和仪表盘不用为 Windows 另写一份。

模板里还有一组按 windows_exporter 指标名写的仪表盘，覆盖 Windows Server 本身以及 Active Directory、DNS、ADFS 这几个常见的 Windows 服务。用 Categraf 就导「by Categraf」那张，用 windows_exporter 就导「exporter」那组。`,
      connect: `Categraf 的 Windows 版本以服务方式安装，步骤见 [Categraf 安装](/docs/data/categraf/install)。基础插件默认开启，不需要为 Windows 单独写采集配置。用 windows_exporter 的话，用 Categraf 的 \`prometheus\` 插件抓 \`http://<host>:9182/metrics\`，或把已有的 Prometheus [接成数据源](/docs/data/prometheus)。`,
    },
    en: {
      summary: 'Categraf reports the same metric names on Windows as on Linux, so host dashboards and rules carry over; extra dashboards cover AD, DNS and ADFS via windows_exporter.',
      intro: `Categraf runs on Windows too, and the basic CPU, memory, disk and network metrics keep the same names as on Linux. Host-level alert rules and dashboards therefore do not need a separate Windows edition.

The template also ships a set of dashboards written against windows_exporter metric names, covering Windows Server itself plus Active Directory, DNS and ADFS. Import the "by Categraf" dashboard if you collect with Categraf, or the "exporter" set if you run windows_exporter.`,
      connect: `Categraf installs as a Windows service; see [Install Categraf](/docs/data/categraf/install). The basic inputs are on by default, so no Windows-specific collector config is needed. For windows_exporter, scrape \`http://<host>:9182/metrics\` with the Categraf \`prometheus\` input, or [add your existing Prometheus as a data source](/docs/data/prometheus).`,
    },
  },
  Systemd: {
    related: [practice('proc', '实践：进程与端口监控', 'Walkthrough: processes and ports')],
    zh: {
      summary: '通过 D-Bus 读取 systemd unit 的状态、重启次数和启动耗时，服务挂了或反复拉起都能第一时间告警。',
      intro: `systemd 插件通过 D-Bus 接口和 systemd 通信，采集每个 unit 的运行状态、是否 enabled、重启次数、任务数和启动耗时。相比只看进程是否存在，它能分辨「服务在但处于 failed」和「服务被反复拉起」这两种更隐蔽的故障。

默认采集所有 unit，并排除 automount、device、mount、scope、slice 这些噪音类型；生产上建议用 \`unit_include\` 只保留自己关心的服务。需要 Linux 且 systemd 212 以上。`,
    },
    en: {
      summary: 'Reads systemd unit state, restart counts and startup time over D-Bus, so failed or flapping services page you right away.',
      intro: `The systemd input talks to systemd over D-Bus and collects each unit's active state, enabled flag, restart count, task count and startup time. Unlike a plain process check, it tells "the service exists but is failed" apart from "the service keeps getting restarted".

All units are collected by default, minus the noisy automount, device, mount, scope and slice types. In production, narrow it down with \`unit_include\` to the services you actually care about. Requires Linux with systemd 212 or newer.`,
    },
  },
  SMART: {
    zh: {
      summary: '调用 smartctl 读取 HDD、SSD 和 NVMe 的 S.M.A.R.T. 健康属性，在硬盘真正坏掉之前看到重映射扇区、温度和剩余寿命。',
      intro: `S.M.A.R.T. 是硬盘和固态盘内建的自检机制。Categraf 的 smart 插件执行 \`smartctl\`（以及 NVMe 的 \`nvme\` 工具）读取这些属性，输出 \`smart_device\` 整体健康指标和 \`smart_attribute\` 逐项属性，重映射扇区、待处理扇区、温度、通电时间、SSD 磨损这些指标都在其中。

模板里的规则盯的是会导致数据丢失的前兆：健康检查失败、重映射扇区增长、温度过高。需要主机上装有 smartmontools，并给 Categraf 执行 smartctl 的权限（通常是 sudo 免密）。`,
    },
    en: {
      summary: 'Runs smartctl to read S.M.A.R.T. health attributes from HDDs, SSDs and NVMe drives, so you see reallocated sectors, temperature and wear before a disk actually dies.',
      intro: `S.M.A.R.T. is the self-monitoring built into hard drives and SSDs. The Categraf smart input runs \`smartctl\` (and the \`nvme\` tool for NVMe devices) and emits \`smart_device\` for overall health plus \`smart_attribute\` for individual attributes: reallocated sectors, pending sectors, temperature, power-on hours, SSD wear and more.

The bundled rules watch the precursors of data loss: failed health checks, growing reallocated-sector counts and high temperature. The host needs smartmontools installed and Categraf needs permission to run smartctl, usually via passwordless sudo.`,
    },
  },
  IPMI: {
    zh: {
      summary: '通过 IPMI 读取服务器带外的温度、风扇、电压、电源和传感器状态，本地或远程 BMC 都能采。',
      intro: `IPMI 插件从 ipmi_exporter 移植而来，原理是执行 FreeIPMI 的一系列命令并把输出转换成指标：温度、风扇转速、电压、功耗、各传感器的健康状态，以及机箱电源状态。这些数据来自 BMC，操作系统挂了也能读到。

可以在服务器本机采集，也可以在一台采集机上配置多个远端 BMC 的地址和账号集中采集。前提是 IPMI 本身已经配置正确、\`ipmimonitoring\` 这类命令能拿到输出，否则插件没有数据可转。`,
    },
    en: {
      summary: 'Reads out-of-band temperature, fan, voltage, power and sensor state over IPMI, from the local BMC or remote ones.',
      intro: `The IPMI input is ported from ipmi_exporter. It runs a set of FreeIPMI commands and turns the output into metrics: temperatures, fan speeds, voltages, power draw, the health of every sensor and the chassis power state. The data comes from the BMC, so it is still available when the operating system is down.

Collect locally on each server, or point one collector at a list of remote BMC addresses and credentials. IPMI itself must already be configured so that commands such as \`ipmimonitoring\` return output; otherwise there is nothing to convert.`,
    },
  },
  NVIDIA: {
    zh: {
      summary: '两条路采 NVIDIA GPU：nvidia-smi 轻量够用，DCGM 指标更全；模板带 GPU 总览、单卡和训练任务视角的仪表盘。',
      intro: `NVIDIA GPU 有两种采集方式。\`nvidia_smi\` 插件执行本机的 \`nvidia-smi\` 命令并解析输出，不需要额外安装东西，利用率、显存、温度、功耗、时钟都有；也可以通过 SSH 采远端机器。\`dcgm\` 插件对接 NVIDIA DCGM，指标更细（SM 活跃度、NVLink、XID 错误等），但需要 Categraf 的 with-cgo-plugin 版本和主机上的 DCGM。

仪表盘分别按两种指标写，GPU 总览、单卡明细和按任务汇总各一张。规则关注显存吃满和温度过高。`,
    },
    en: {
      summary: 'Two ways to collect NVIDIA GPUs: nvidia-smi is light and usually enough, DCGM gives more; dashboards cover a fleet overview, single cards and training jobs.',
      intro: `There are two collection paths for NVIDIA GPUs. The \`nvidia_smi\` input runs the local \`nvidia-smi\` command and parses its output, so nothing else needs installing; utilization, memory, temperature, power and clocks are all there, and remote hosts can be reached over SSH. The \`dcgm\` input talks to NVIDIA DCGM for finer metrics such as SM activity, NVLink traffic and XID errors, but needs the with-cgo-plugin build of Categraf and DCGM on the host.

The dashboards are written for each metric family: a fleet overview, per-card detail and a per-job view. The rules watch for full memory and high temperature.`,
    },
  },
  AMD_ROCm_SMI: {
    zh: {
      summary: '调用 rocm-smi 采集 AMD GPU 的利用率、显存、温度、功耗和时钟，规则覆盖过热和显存吃满。',
      intro: `AMD ROCm SMI 插件从 Telegraf 移植，执行 ROCm 自带的 \`rocm-smi\` 二进制并解析输出，得到每张 AMD GPU 的使用率、显存占用、温度、功耗、风扇和各级时钟。

主机上要装好 ROCm，默认在 \`/opt/rocm/bin/rocm-smi\`；路径不同就在配置里改 \`bin_path\`。规则针对温度过高、显存占满和功耗接近上限。`,
    },
    en: {
      summary: 'Runs rocm-smi to collect AMD GPU utilization, memory, temperature, power and clocks; rules cover overheating and full memory.',
      intro: `The AMD ROCm SMI input is ported from Telegraf. It runs the \`rocm-smi\` binary that ships with ROCm and parses the output into per-GPU utilization, memory usage, temperature, power draw, fan speed and clock frequencies.

ROCm must be installed on the host; the default binary path is \`/opt/rocm/bin/rocm-smi\`, adjustable via \`bin_path\`. The rules fire on high temperature, exhausted memory and power close to the cap.`,
    },
  },
  Exec: {
    related: [practice('exec', '实践：用脚本采集自定义指标', 'Walkthrough: custom metrics from scripts')],
    zh: {
      title: '用脚本给夜莺上报自定义指标（Exec）',
      summary: '现成插件覆盖不到的东西，写个脚本按 Prometheus、InfluxDB 行协议或 Open-Falcon 格式打印到 stdout，Categraf 负责采集和上报。',
      intro: `exec 插件是 Categraf 的万能兜底：你写脚本，脚本把监控数据打印到标准输出，Categraf 定时执行并解析。脚本用什么语言无所谓，输出格式三选一：Prometheus 文本格式、InfluxDB 行协议（\`measurement,label=v field=1\`）或 Open-Falcon 的 JSON，由 \`data_format\` 指定。

适合业务自定义指标、遗留系统的状态检查、一次性的巡检脚本。注意脚本执行时间要短于采集周期，输出的值只能是数字。`,
    },
    en: {
      title: 'Report custom metrics to Nightingale from scripts (Exec)',
      summary: 'For anything no plugin covers: write a script that prints Prometheus, InfluxDB line protocol or Open-Falcon format to stdout, and Categraf collects and ships it.',
      intro: `The exec input is Categraf's catch-all. You write a script, the script prints metrics to standard output, and Categraf runs it on a schedule and parses the result. Any language works; the output must be one of three formats, chosen with \`data_format\`: Prometheus text exposition, InfluxDB line protocol (\`measurement,label=v field=1\`) or Open-Falcon JSON.

Use it for business metrics, health checks of legacy systems and one-off inspection scripts. Keep the script's run time below the collection interval, and remember that values must be numeric.`,
    },
  },

  // ---------------------------------------------------------------- 数据库
  MySQL: {
    related: [practice('mysql', '实践：监控 MySQL', 'Walkthrough: monitor MySQL')],
    zh: {
      summary: '连上实例跑 SHOW STATUS、SHOW VARIABLES 和复制状态，慢查询堆积、连接数打满、主从中断与延迟都有现成规则和处置步骤。',
      intro: `MySQL 插件的原理很直接：连到实例，执行 \`SHOW GLOBAL STATUS\`、\`SHOW GLOBAL VARIABLES\`、\`SHOW SLAVE STATUS\` 等语句，把结果整理成指标。默认采集基础状态和复制状态，InnoDB 扩展指标、processlist、库表大小这些按需打开。还可以写自定义 SQL，把查询结果当指标上报。

模板里的告警规则覆盖运维上最常见的几类事故：慢查询堆积、连接数接近 max_connections、线程大面积 running、主从 IO/SQL 线程中断、复制延迟、实例重启、打开文件数逼近上限，每条都附处置步骤。仪表盘分「本机采集」「按 address 筛选远端多实例」「按 instance 标签筛选」三种用法，另有一套按 mysqld_exporter 指标名写的。

给监控账号 \`PROCESS\`、\`REPLICATION CLIENT\` 和 \`SELECT\` 权限即可，不要用 root。`,
    },
    en: {
      summary: 'Connects to the instance and runs SHOW STATUS, SHOW VARIABLES and replica status; slow-query pileups, connection exhaustion and broken or lagging replication come with rules and runbooks.',
      intro: `The MySQL input is straightforward: it connects to the instance, runs \`SHOW GLOBAL STATUS\`, \`SHOW GLOBAL VARIABLES\`, \`SHOW SLAVE STATUS\` and friends, and turns the results into metrics. Basic status and replication are collected by default; extended InnoDB metrics, the processlist and schema and table sizes are opt-in. Custom SQL can also be turned into metrics.

The bundled rules cover the incidents that actually happen: slow queries piling up, connections approaching max_connections, too many threads running, replica IO or SQL thread stopped, replication lag, unexpected restarts and open files near the limit, each with runbook steps. The dashboards come in three flavours for local collection, remote multi-instance by address, and by instance label, plus a set written for mysqld_exporter metric names.

Grant the monitoring account \`PROCESS\`, \`REPLICATION CLIENT\` and \`SELECT\`; do not use root.`,
    },
  },
  PostgreSQL: {
    zh: {
      summary: '用 pg_monitor 角色的只读账号采集连接、事务、缓存命中、锁和复制状态，支持自定义业务表查询。',
      intro: `PostgreSQL 插件以客户端身份连上数据库，读取 \`pg_stat_*\` 系列监控视图：每个库的连接数、提交和回滚、缓存命中率、死锁、临时文件，以及复制延迟。还可以配自定义查询，把业务表里的数字当指标上报。

建一个专用账号并授予 \`pg_monitor\` 角色就够了，只有自定义查询才需要再给对应 schema 的 SELECT。规则覆盖连接数打满、长事务、缓存命中率下降和复制延迟。`,
    },
    en: {
      summary: 'Collects connections, transactions, cache hit ratio, locks and replication state with a read-only pg_monitor account; custom queries against business tables are supported.',
      intro: `The PostgreSQL input connects as a client and reads the \`pg_stat_*\` monitoring views: connections per database, commits and rollbacks, cache hit ratio, deadlocks, temp files and replication lag. Custom queries can turn numbers from your own tables into metrics as well.

A dedicated account with the \`pg_monitor\` role is all it needs; only custom queries require extra SELECT grants on the relevant schemas. The rules cover connection exhaustion, long-running transactions, falling cache hit ratio and replication lag.`,
    },
  },
  Redis: {
    related: [practice('redis', '实践：监控 Redis', 'Walkthrough: monitor Redis')],
    zh: {
      summary: '连上 Redis 执行 INFO 采集内存、命中率、连接、慢日志和主从状态，另带 Sentinel 插件和按 redis_exporter 写的模板。',
      intro: `Redis 插件连上实例执行 \`INFO\` 命令并解析，得到内存使用与碎片率、键空间命中率、连接数、阻塞客户端、持久化状态、主从复制状态等指标。多个实例就写多个 \`[[instances]]\`，建议给每个实例一个 \`instance\` 标签，仪表盘靠它区分。

Sentinel 环境另有 \`redis_sentinel\` 插件采集哨兵视角的主从拓扑。模板里的仪表盘分 Categraf 和 redis_exporter 两套，规则覆盖内存逼近 maxmemory、命中率下降、连接数异常、主从断开和实例重启。`,
    },
    en: {
      summary: 'Runs INFO against Redis to collect memory, hit ratio, connections, slowlog and replication state; includes a Sentinel input and templates for redis_exporter.',
      intro: `The Redis input connects to the instance, runs \`INFO\` and parses the result into memory usage and fragmentation, keyspace hit ratio, connected and blocked clients, persistence state and replication status. Add one \`[[instances]]\` block per instance and give each an \`instance\` label; the dashboards filter on it.

For Sentinel deployments the \`redis_sentinel\` input collects the topology from the sentinel's point of view. Dashboards come in Categraf and redis_exporter editions; the rules cover memory nearing maxmemory, dropping hit ratio, abnormal connection counts, broken replication and restarts.`,
    },
  },
  MongoDB: {
    zh: {
      summary: '内置 mongodb_exporter 的采集逻辑，覆盖连接、操作计数、复制集与分片状态；仪表盘要求开启兼容模式的指标名。',
      intro: `MongoDB 插件由 percona 的 mongodb_exporter 封装而来，通过 \`serverStatus\`、\`replSetGetStatus\` 等命令采集连接数、操作计数、队列、WiredTiger 缓存、复制集成员状态和 oplog 窗口。分片集群用 \`mongodb_cluster\` 插件从 mongos 侧采集。

模板里的仪表盘按 \`mongodb_ss_*\` 这类 0.1x 兼容指标名编写，所以 Categraf 配置里必须设置 \`compatible_mode = true\`，并给每个实例一个 \`instance\` 标签。规则覆盖连接数、复制延迟、副本集成员异常和实例不可达。`,
    },
    en: {
      summary: 'Embeds the mongodb_exporter collector for connections, op counters, replica set and sharding state; the dashboards need the compatible metric names turned on.',
      intro: `The MongoDB input wraps Percona's mongodb_exporter and collects connections, op counters, queues, WiredTiger cache, replica set member state and oplog window via \`serverStatus\`, \`replSetGetStatus\` and related commands. For sharded clusters, the \`mongodb_cluster\` input collects from the mongos side.

The bundled dashboards are written against the 0.1x-compatible metric names such as \`mongodb_ss_*\`, so the Categraf config must set \`compatible_mode = true\` and give every instance an \`instance\` label. The rules cover connection counts, replication lag, unhealthy replica set members and unreachable instances.`,
    },
  },
  Oracle: {
    related: [practice('oracle', '实践：监控 Oracle', 'Walkthrough: monitor Oracle')],
    zh: {
      summary: '用只读账号跑一组可自定义的 SQL 采集会话、表空间、等待事件和缓存命中率，Linux 上的 Categraf 也能远程监控 Windows 上的 Oracle。',
      intro: `Oracle 插件连接实例并执行 \`metric.toml\` 里定义的一组 SQL：会话数、活动会话、表空间使用率、等待事件、SGA/PGA、缓存命中率、归档日志等，每条 SQL 都能改、能加。连接配置和查询定义分在两个文件，方便按版本和环境裁剪。

插件默认不能跑在 Windows 上，但可以用 Linux 上的 Categraf 远程连接 Windows 上的 Oracle。监控账号给 \`CREATE SESSION\` 和 \`SELECT_CATALOG_ROLE\` 即可；某条 SQL 报 ORA-00942 或 ORA-01031 时，补该视图的读取权限，不要换业务账号。`,
    },
    en: {
      summary: 'Runs a customizable set of SQL queries with a read-only account to collect sessions, tablespaces, wait events and cache hit ratios; a Linux Categraf can monitor Oracle on Windows remotely.',
      intro: `The Oracle input connects to the instance and runs the queries defined in \`metric.toml\`: session counts, active sessions, tablespace usage, wait events, SGA and PGA, cache hit ratios, archive logs and more. Every query can be edited or extended. Connection settings and query definitions live in separate files so they can be trimmed per version and environment.

The input does not run on Windows itself, but a Categraf on Linux can connect to an Oracle instance hosted on Windows. The monitoring account needs \`CREATE SESSION\` and \`SELECT_CATALOG_ROLE\`; if a query fails with ORA-00942 or ORA-01031, grant read access on that view rather than switching to an application account.`,
    },
  },
  SQLServer: {
    zh: {
      summary: '基于 DMV 和性能计数器采集 SQL Server 的连接、等待、缓冲区、日志和数据库状态，只需 VIEW SERVER STATE 权限。',
      intro: `SQL Server 插件基于 Telegraf 的同名插件，通过动态管理视图（DMV）和性能计数器采集：连接与请求、等待统计、缓冲区命中率、页生命周期、事务日志使用、数据库状态与大小、Always On 可用性组状态。已在 SQL Server 2022 上完成真实采集验证。

在 master 库里建一个登录名并授予 \`VIEW SERVER STATE\`、\`VIEW ANY DEFINITION\`，2022 及以上再加 \`VIEW SERVER PERFORMANCE STATE\`。规则覆盖阻塞、死锁、日志空间、缓冲区命中率下降和数据库离线。`,
    },
    en: {
      summary: 'Collects connections, waits, buffer pool, log usage and database state from DMVs and performance counters; VIEW SERVER STATE is all the permission it needs.',
      intro: `The SQL Server input is based on the Telegraf plugin of the same name and reads dynamic management views (DMVs) and performance counters: connections and requests, wait statistics, buffer cache hit ratio, page life expectancy, transaction log usage, database state and size, and Always On availability group health. It has been verified against SQL Server 2022.

Create a login in master and grant \`VIEW SERVER STATE\` and \`VIEW ANY DEFINITION\`; on 2022 and later add \`VIEW SERVER PERFORMANCE STATE\`. The rules cover blocking, deadlocks, log space, falling cache hit ratio and databases going offline.`,
    },
  },
  Elasticsearch: {
    related: [{ zh: '[把 Elasticsearch 接成日志数据源](/docs/data/elasticsearch)', en: '[Use Elasticsearch as a log data source](/docs/data/elasticsearch)' }],
    zh: {
      summary: '通过 ES 自己的 HTTP 接口采集集群健康、节点 JVM、线程池、索引和分片状态，小集群抓一个节点即可拿到全集群数据。',
      intro: `Elasticsearch 通过 HTTP JSON 接口暴露自身状态，插件抓 \`_cluster/health\`、\`_cluster/stats\`、\`_nodes/stats\` 和索引统计：集群颜色、未分配分片、节点 JVM 堆与 GC、断路器、线程池拒绝、索引写入与查询延迟、磁盘水位。

小集群设 \`local = false\`，从任意一个节点抓就能拿到所有节点的数据；大集群建议每个节点部署 Categraf 并设 \`local = true\` 只抓本机。模板里的仪表盘分 Categraf 和 elasticsearch_exporter 两套，规则覆盖集群变红变黄、分片未分配、JVM 堆逼近上限、线程池拒绝和磁盘水位。`,
    },
    en: {
      summary: "Collects cluster health, node JVM, thread pools, index and shard state through Elasticsearch's own HTTP API; one node is enough to see the whole cluster on small deployments.",
      intro: `Elasticsearch exposes its state over HTTP JSON. The input reads \`_cluster/health\`, \`_cluster/stats\`, \`_nodes/stats\` and index statistics: cluster colour, unassigned shards, node JVM heap and GC, circuit breakers, thread pool rejections, indexing and search latency, and disk watermarks.

On a small cluster set \`local = false\` and scrape any one node to get data for all of them; on a large cluster run Categraf on every node with \`local = true\`. Dashboards come in Categraf and elasticsearch_exporter editions; the rules cover the cluster turning yellow or red, unassigned shards, JVM heap near the limit, thread pool rejections and disk watermarks.`,
    },
  },
  ClickHouse: {
    related: [{ zh: '[把 ClickHouse 接成数据源](/docs/data/clickhouse-doris-iotdb)', en: '[Use ClickHouse as a data source](/docs/data/clickhouse-doris-iotdb)' }],
    zh: {
      summary: '通过 HTTP 接口读取 system.metrics、system.events 和 system.asynchronous_metrics，查询、合并、复制队列和内存都有指标说明。',
      intro: `ClickHouse 插件通过 HTTP 接口（默认 8123）查询 \`system.metrics\`、\`system.events\`、\`system.asynchronous_metrics\` 和 \`system.parts\` 等系统表：并发查询、合并与 mutation、复制队列与延迟、内存与缓存、parts 数量、ZooKeeper 会话。已在 ClickHouse 24.8 真实负载上验证。

模板里的两张仪表盘用的指标族不同：\`ClickHouse_Categraf\` 对应本插件，\`ClickHouse_Exporter\` 对应 ClickHouse 自带的 Prometheus 端点暴露的 \`clickhouse_*\` 指标，不能互换。规则覆盖查询堆积、复制延迟、parts 过多、内存逼近上限和 ZooKeeper 断连。`,
    },
    en: {
      summary: 'Reads system.metrics, system.events and system.asynchronous_metrics over HTTP; queries, merges, replication queues and memory all come with metric descriptions.',
      intro: `The ClickHouse input queries the system tables over HTTP (port 8123 by default): \`system.metrics\`, \`system.events\`, \`system.asynchronous_metrics\`, \`system.parts\` and others. That yields concurrent queries, merges and mutations, replication queue and lag, memory and caches, part counts and ZooKeeper sessions. Verified against a real ClickHouse 24.8 workload.

The two dashboards use different metric families and are not interchangeable: \`ClickHouse_Categraf\` expects this input, \`ClickHouse_Exporter\` expects the \`clickhouse_*\` metrics from ClickHouse's built-in Prometheus endpoint. The rules cover query backlog, replication lag, too many parts, memory near the limit and lost ZooKeeper sessions.`,
    },
  },
  Doris: {
    related: [{ zh: '[把 Doris 接成数据源](/docs/data/clickhouse-doris-iotdb)', en: '[Use Doris as a data source](/docs/data/clickhouse-doris-iotdb)' }],
    zh: {
      summary: 'FE 和 BE 都自带 Prometheus 格式的 /metrics，用 Categraf 的 prometheus 插件抓取即可，模板覆盖查询、导入、Compaction 和节点状态。',
      intro: `Doris 的 FE（默认 8030）和 BE（默认 8040）进程都通过 \`/metrics\` 暴露 Prometheus 协议的监控数据，不需要专门插件。给每类节点打上 \`group\` 和 \`job\` 标签，仪表盘按这两个标签区分 FE/BE 和集群。

模板覆盖查询 QPS 与延迟、导入任务、Compaction 积压、Tablet 状态、BE 磁盘与内存、节点存活。`,
      connect: CATEGRAF_PROM.zh,
    },
    en: {
      summary: 'FE and BE both expose Prometheus-format /metrics; scrape them with the Categraf prometheus input. Templates cover queries, loads, compaction and node state.',
      intro: `Doris FE (port 8030 by default) and BE (8040) processes both expose Prometheus metrics on \`/metrics\`, so no dedicated plugin is needed. Label each node type with \`group\` and \`job\`; the dashboards use those labels to separate FE from BE and one cluster from another.

The templates cover query QPS and latency, load jobs, compaction backlog, tablet state, BE disk and memory, and node liveness.`,
      connect: CATEGRAF_PROM.en,
    },
  },
  TiDB: {
    zh: {
      summary: 'TiDB、PD、TiKV 都通过 /metrics 暴露 Prometheus 指标，模板覆盖 SQL 延迟、Region 调度、存储和节点健康。',
      intro: `TiDB 集群的各组件都自带 Prometheus 指标端点：TiDB Server 在 10080、PD 在 2379、TiKV 在 20180，TiFlash、TiCDC 等按各自配置。用 Categraf 的 \`prometheus\` 插件逐个抓取，或者直接把 TiUP 部署时自带的 Prometheus 接成夜莺数据源。

仪表盘依赖 \`k8s_cluster\`、\`tidb_cluster\`、\`job\` 和 \`instance\` 四个标签，非 Kubernetes 部署也要给前两个标签固定值。规则覆盖 TiDB 查询失败与慢查询、PD Region 异常、TiKV 存储和 Raft 延迟、组件宕机。`,
      connect: `${CATEGRAF_PROM.zh}

\`\`\`toml
# conf/input.prometheus/tidb.toml
interval = 15

[[instances]]
urls = ["http://<tidb>:10080/metrics"]
labels = { job = "tidb", k8s_cluster = "", tidb_cluster = "prod" }

[[instances]]
urls = ["http://<pd>:2379/metrics"]
labels = { job = "pd", k8s_cluster = "", tidb_cluster = "prod" }

[[instances]]
urls = ["http://<tikv>:20180/metrics"]
labels = { job = "tikv", k8s_cluster = "", tidb_cluster = "prod" }
\`\`\``,
    },
    en: {
      summary: 'TiDB, PD and TiKV all expose Prometheus metrics on /metrics; the templates cover SQL latency, Region scheduling, storage and node health.',
      intro: `Every TiDB component ships a Prometheus endpoint: TiDB Server on 10080, PD on 2379, TiKV on 20180, with TiFlash and TiCDC on whatever ports they are configured with. Scrape them with the Categraf \`prometheus\` input, or add the Prometheus that TiUP deploys as a Nightingale data source.

The dashboards depend on four labels: \`k8s_cluster\`, \`tidb_cluster\`, \`job\` and \`instance\`. Give the first two fixed values even outside Kubernetes. The rules cover failed and slow queries on TiDB, Region anomalies on PD, storage and Raft latency on TiKV, and components going down.`,
      connect: `${CATEGRAF_PROM.en}

\`\`\`toml
# conf/input.prometheus/tidb.toml
interval = 15

[[instances]]
urls = ["http://<tidb>:10080/metrics"]
labels = { job = "tidb", k8s_cluster = "", tidb_cluster = "prod" }

[[instances]]
urls = ["http://<pd>:2379/metrics"]
labels = { job = "pd", k8s_cluster = "", tidb_cluster = "prod" }

[[instances]]
urls = ["http://<tikv>:20180/metrics"]
labels = { job = "tikv", k8s_cluster = "", tidb_cluster = "prod" }
\`\`\``,
    },
  },
  VictoriaMetrics: {
    related: [{ zh: '[把 VictoriaMetrics 接成数据源](/docs/data/victoriametrics)', en: '[Use VictoriaMetrics as a data source](/docs/data/victoriametrics)' }],
    zh: {
      summary: '单机版和集群版都自带 /metrics，模板分别覆盖 vmsingle 以及 vmstorage、vmselect、vminsert 三个集群组件。',
      intro: `VictoriaMetrics 通常既是夜莺的时序库，也是需要被监控的对象。单机版在 8428 端口暴露 \`/metrics\`；集群版要分别抓 vmstorage（8482）、vmselect（8481）和 vminsert（8480），只抓一个组件看不到全貌。

模板分单机和集群两张仪表盘，规则覆盖写入拒绝、慢插入、查询超时、磁盘空间、存储节点离线和合并积压。`,
      connect: `${CATEGRAF_PROM.zh}

\`\`\`toml
# conf/input.prometheus/victoriametrics.toml
[[instances]]
urls = ["http://127.0.0.1:8428/metrics"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
labels = { job = "victoriametrics", service = "vmsingle" }
\`\`\`

集群版把 \`urls\` 换成各组件的地址，并把 \`service\` 标签分别设为 \`vmstorage\`、\`vmselect\`、\`vminsert\`。`,
    },
    en: {
      summary: 'Both the single-node and cluster editions expose /metrics; templates cover vmsingle as well as the vmstorage, vmselect and vminsert cluster components.',
      intro: `VictoriaMetrics is often both Nightingale's time-series store and something that needs monitoring itself. The single-node edition exposes \`/metrics\` on port 8428; the cluster edition must be scraped per component, vmstorage (8482), vmselect (8481) and vminsert (8480), or you only see part of the picture.

There is one dashboard for single-node and one for cluster. The rules cover rejected writes, slow inserts, query timeouts, disk space, storage nodes going offline and merge backlog.`,
      connect: `${CATEGRAF_PROM.en}

\`\`\`toml
# conf/input.prometheus/victoriametrics.toml
[[instances]]
urls = ["http://127.0.0.1:8428/metrics"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
labels = { job = "victoriametrics", service = "vmsingle" }
\`\`\`

For the cluster edition, point \`urls\` at each component and set the \`service\` label to \`vmstorage\`, \`vmselect\` or \`vminsert\` accordingly.`,
    },
  },

  // ---------------------------------------------------------------- 消息队列
  Kafka: {
    zh: {
      summary: 'Broker 指标走 JMX，消费者延迟靠内置的 kafka_exporter 逻辑；模板分 Categraf 和 exporter 两套，规则盯积压、离线分区和 ISR 收缩。',
      intro: `Kafka 的核心指标通过 JMX 暴露，这部分用 jolokia 或 jmx_exporter 采集即可。Categraf 的 \`kafka\` 插件解决的是 JMX 拿不到的那块：消费组的 lag、每个分区的 offset 和消费速率。它 fork 自 davidmparrott 版本的 kafka_exporter，指标名和 danielqsj 版本略有差异，设置 \`rename_uncommit_offset_to_lag = true\` 可以切回更常见的 \`kafka_consumergroup_lag\` 命名。

模板里的仪表盘分 Categraf 和 kafka_exporter 两套。规则覆盖消费积压持续增长、分区离线、under-replicated、ISR 收缩和 Broker 掉线。`,
    },
    en: {
      summary: 'Broker metrics come from JMX, consumer lag from the embedded kafka_exporter logic; templates come in Categraf and exporter editions, rules watch lag, offline partitions and shrinking ISR.',
      intro: `Kafka's core broker metrics are exposed over JMX; collect those with jolokia or jmx_exporter. The Categraf \`kafka\` input fills the gap JMX cannot: consumer group lag, per-partition offsets and consumption rate. It is forked from the davidmparrott flavour of kafka_exporter, whose metric names differ slightly from the danielqsj flavour; set \`rename_uncommit_offset_to_lag = true\` to switch to the more common \`kafka_consumergroup_lag\` naming.

Dashboards come in Categraf and kafka_exporter editions. The rules cover steadily growing consumer lag, offline partitions, under-replicated partitions, shrinking ISR and brokers dropping out.`,
    },
  },
  RabbitMQ: {
    zh: {
      summary: '3.8 以上直接抓内置 Prometheus 插件的 15692 端口，旧版本走管理 API；模板按版本分开，规则盯队列积压、未确认消息和节点状态。',
      intro: `RabbitMQ 3.8 起内置 \`rabbitmq_prometheus\` 插件，\`rabbitmq-plugins enable rabbitmq_prometheus\` 后在 15692 端口暴露 \`/metrics\`，推荐用 Categraf 的 \`prometheus\` 插件抓取。低于 3.8 的版本启用 \`rabbitmq_management\`，用 Categraf 的 \`rabbitmq\` 插件访问 15672 的管理 API。

两条链路的指标名不同，模板里的仪表盘也按 3.8+ 和 3.8- 分开，别导错。规则覆盖队列消息堆积、未确认消息过多、消费者为零、内存与磁盘告警阈值触发、节点宕机。模板要看到吞吐和积压面板，需要真实的 exchange、queue 和收发流量。`,
    },
    en: {
      summary: 'On 3.8+ scrape the built-in Prometheus plugin on port 15692; older versions go through the management API. Templates are split by version; rules watch queue backlog, unacked messages and node state.',
      intro: `RabbitMQ 3.8 and later ship the \`rabbitmq_prometheus\` plugin: run \`rabbitmq-plugins enable rabbitmq_prometheus\` and \`/metrics\` appears on port 15692, which the Categraf \`prometheus\` input scrapes. Versions below 3.8 enable \`rabbitmq_management\` instead and use the Categraf \`rabbitmq\` input against the management API on 15672.

The two paths produce different metric names, so the dashboards are split into 3.8+ and 3.8- editions; import the right one. The rules cover message backlog, too many unacked messages, queues without consumers, memory and disk alarms, and nodes going down. The throughput and backlog panels only show data once real exchanges, queues and traffic exist.`,
    },
  },
  NSQ: {
    zh: {
      summary: '读取 nsqd 的 /stats 接口，拿到每个 topic 和 channel 的积压、在途消息、超时和客户端数，规则盯积压增长和消费者掉线。',
      intro: `NSQ 插件从 Telegraf 移植，访问 nsqd 的 \`/stats\` HTTP 接口，采集 topic 级别的消息总数与积压、channel 级别的 depth、in-flight、deferred、requeue 和 timeout 计数，以及每个客户端连接的 ready 与 in-flight 状态。

规则覆盖 channel 积压持续增长、消息超时和 requeue 升高、channel 没有消费者、nsqd 不可达。`,
    },
    en: {
      summary: "Reads nsqd's /stats endpoint for per-topic and per-channel depth, in-flight, timeouts and client counts; rules watch growing backlog and lost consumers.",
      intro: `The NSQ input is ported from Telegraf and reads the \`/stats\` HTTP endpoint of nsqd: message counts and depth per topic, depth, in-flight, deferred, requeue and timeout counters per channel, and ready and in-flight state per client connection.

The rules cover channel depth growing steadily, rising timeouts and requeues, channels without consumers and nsqd being unreachable.`,
    },
  },
  EMQX: {
    zh: {
      summary: '通过 EMQX Dashboard API 采集节点状态、连接数、订阅、消息收发与丢弃，支持 v3、v4、v5 三代版本。',
      intro: `EMQX 插件调用 Dashboard API（默认 18083）采集：先从 \`/nodes\` 拿到每个节点的版本、运行状态、连接数、进程与内存，再采集集群级的订阅数、路由、消息收发与丢弃计数、会话与保留消息。一个集群写多个节点地址会随机挑一个可用的连，多个集群拆成多个 \`[[instances]]\`。

配置里的 \`version\` 要和 EMQX 的大版本对应（v3/v4/v5），API 需要 Dashboard 账号。规则覆盖节点离线、连接数突降、消息丢弃升高和进程数逼近上限。`,
    },
    en: {
      summary: 'Collects node state, connections, subscriptions, message throughput and drops through the EMQX Dashboard API; supports v3, v4 and v5.',
      intro: `The EMQX input calls the Dashboard API (port 18083 by default). It first reads \`/nodes\` for each node's version, running state, connection count, processes and memory, then the cluster-level subscription count, routes, message sent, received and dropped counters, sessions and retained messages. Listing several node addresses for one cluster makes it pick a reachable one at random; use separate \`[[instances]]\` blocks for separate clusters.

Set \`version\` to match the EMQX major version (v3, v4 or v5), and supply Dashboard credentials. The rules cover nodes going offline, sudden drops in connections, rising message drops and process counts near the limit.`,
    },
  },
  AutoMQ: {
    zh: {
      summary: 'AutoMQ 通过 OTel Collector 或自身的 Prometheus 端点暴露指标，模板覆盖集群总览、Broker、Topic、消费组和明细。',
      intro: `AutoMQ 是存算分离的 Kafka 兼容消息系统。它把指标发给 OTel Collector 的 Prometheus exporter，或直接在自己的端点（实测用的是 8890）暴露 Prometheus 格式数据，用 Categraf 的 \`prometheus\` 插件抓取即可，端口按部署配置为准。

模板带集群总览、Broker、Topic、消费组和明细五张仪表盘，指标说明覆盖请求、吞吐、延迟、存储和对象存储操作。规则覆盖 Broker 离线、请求错误率、消费积压和存储操作失败。`,
      connect: CATEGRAF_PROM.zh,
    },
    en: {
      summary: 'AutoMQ exposes metrics through an OTel Collector or its own Prometheus endpoint; templates cover cluster overview, brokers, topics, consumer groups and detail.',
      intro: `AutoMQ is a Kafka-compatible messaging system with separated compute and storage. It sends metrics to an OTel Collector's Prometheus exporter or exposes Prometheus-format data on its own endpoint (8890 in the reference test). Scrape that with the Categraf \`prometheus\` input, using whatever port your deployment configures.

The template ships five dashboards (cluster overview, broker, topic, consumer group and detail) and metric descriptions for requests, throughput, latency, storage and object-store operations. The rules cover brokers going offline, request error rate, consumer lag and failed storage operations.`,
      connect: CATEGRAF_PROM.en,
    },
  },

  // ---------------------------------------------------------------- Web 与中间件
  Nginx: {
    zh: {
      summary: 'stub_status 够看连接和请求总量，VTS 模块能到每个 server 和 upstream 的状态码与延迟；另带 upstream_check 健康检查插件。',
      intro: `Nginx 监控有三个层次。\`stub_status\` 模块自带，给出活跃连接、accepts、handled、requests 和读写等待数，够做存活与流量趋势。VTS 模块（\`nginx-module-vts\`）能按 server zone 和 upstream 细分请求数、状态码、响应时间和流量，是最推荐的方式，用 Categraf 的 \`prometheus\` 插件抓它的 \`/status/format/prometheus\`。第三个是 \`nginx_upstream_check\` 插件，读取 upstream_check 模块的健康检查结果。

模板里三张仪表盘分别对应 stub_status、upstream 健康检查和 VTS。规则覆盖 Nginx 不可达、活跃连接突增和 upstream 节点被判定为 down。`,
    },
    en: {
      summary: 'stub_status covers connections and request totals, the VTS module adds per-server and per-upstream status codes and latency; an upstream_check input reads health-check results.',
      intro: `Nginx can be monitored at three levels. The built-in \`stub_status\` module reports active connections, accepts, handled, requests and reading/writing/waiting counts, enough for liveness and traffic trends. The VTS module (\`nginx-module-vts\`) breaks requests, status codes, response time and traffic down by server zone and upstream, which is the recommended path; scrape its \`/status/format/prometheus\` with the Categraf \`prometheus\` input. The third is the \`nginx_upstream_check\` input, which reads the results of the upstream_check module.

The three dashboards map to stub_status, upstream health checks and VTS. The rules cover Nginx being unreachable, active connections spiking and upstream nodes marked down.`,
    },
  },
  Apache: {
    zh: {
      summary: '读取 mod_status 的 server-status?auto 输出，采集请求速率、busy/idle worker、CPU 和流量，规则盯 worker 耗尽和服务不可达。',
      intro: `Apache httpd 开启 \`mod_status\` 后，\`/server-status?auto\` 以机器可读格式输出运行状态。插件抓这个页面，得到总访问量与流量、每秒请求数、busy 与 idle worker、CPU 负载、运行时长，以及各个 worker 的状态分布。

规则覆盖 idle worker 耗尽、请求排队、httpd 不可达和重启。记得限制 server-status 的访问来源。`,
    },
    en: {
      summary: 'Reads the server-status?auto output of mod_status for request rate, busy and idle workers, CPU and traffic; rules watch worker exhaustion and unreachable servers.',
      intro: `With \`mod_status\` enabled, Apache httpd serves a machine-readable status page at \`/server-status?auto\`. The input scrapes it for total accesses and traffic, requests per second, busy and idle workers, CPU load, uptime and the distribution of worker states.

The rules cover idle workers running out, requests queuing, httpd being unreachable and restarts. Remember to restrict who can reach the status page.`,
    },
  },
  HAProxy: {
    zh: {
      summary: '读取 HAProxy 的 CSV stats 页面或 Runtime API，拿到每个 frontend、backend 和 server 的会话、队列、错误和健康状态。',
      intro: `HAProxy 插件读取 stats 页面的 CSV 输出（\`/stats;csv\`）或 Runtime API 的 Unix socket，按 frontend、backend、server 三个层级采集当前与最大会话数、队列长度、请求速率、各类状态码、连接与响应错误、重试与重分发，以及每个后端 server 的健康检查结果。已在真实后端流量上验证。

规则覆盖后端 server 被判定为 DOWN、backend 没有可用 server、队列堆积、5xx 升高和 HAProxy 本身不可达。`,
    },
    en: {
      summary: "Reads HAProxy's CSV stats page or Runtime API for sessions, queues, errors and health state per frontend, backend and server.",
      intro: `The HAProxy input reads the CSV output of the stats page (\`/stats;csv\`) or the Runtime API Unix socket. It collects current and maximum sessions, queue length, request rate, status code classes, connection and response errors, retries and redispatches at frontend, backend and server level, plus the health-check result of every backend server. Verified against real backend traffic.

The rules cover backend servers marked DOWN, backends with no servers left, queue buildup, rising 5xx and HAProxy itself being unreachable.`,
    },
  },
  Tomcat: {
    related: [practice('java', '实践：监控 Java 应用', 'Walkthrough: monitor Java applications')],
    zh: {
      summary: '读取 Manager 应用的 /manager/status/all 接口，采集 JVM 内存、各连接器的线程与请求、流量和错误，需要 manager-gui 角色。',
      intro: `Tomcat 插件访问 Manager 应用的 \`/manager/status/all\` 接口，解析出 JVM 堆与各内存池的使用、每个连接器（HTTP、AJP）的线程池大小与忙碌数、请求数、处理时间、错误数、收发字节。

这个接口需要鉴权：在 \`tomcat-users.xml\` 里添加 manager-gui 角色的用户，并放开 \`webapps/manager/META-INF/context.xml\` 里的 RemoteAddrValve 限制（默认只允许本机访问），否则会收到 403。规则覆盖线程池耗尽、堆内存逼近上限、错误率升高和实例不可达。`,
    },
    en: {
      summary: 'Reads the /manager/status/all endpoint of the Manager app for JVM memory, per-connector threads and requests, traffic and errors; needs the manager-gui role.',
      intro: `The Tomcat input calls the Manager app's \`/manager/status/all\` endpoint and parses JVM heap and memory pool usage, thread pool size and busy count per connector (HTTP, AJP), request counts, processing time, errors and bytes sent and received.

The endpoint requires authentication: add a user with the manager-gui role in \`tomcat-users.xml\` and relax the RemoteAddrValve in \`webapps/manager/META-INF/context.xml\`, which only allows localhost by default, or you get a 403. The rules cover thread pool exhaustion, heap near the limit, rising error rate and unreachable instances.`,
    },
  },
  Java: {
    related: [practice('java', '实践：监控 Java 应用', 'Walkthrough: monitor Java applications')],
    zh: {
      title: '用夜莺监控 Java 应用（JVM）',
      summary: 'JVM 内存、GC、线程和类加载，用 JMX Exporter 或 OpenTelemetry Java Agent 暴露，模板按这两种指标名各备一套仪表盘。',
      intro: `监控 Java 应用通常就是监控 JVM：堆与非堆内存、各代 GC 的次数与耗时、线程数与死锁、类加载、文件描述符。两种常见的暴露方式指标名不同，模板也分开：

- \`JMX\` 和 \`JMX - Kubernetes\`：应用加载 Prometheus JMX Exporter 的 Java Agent，指标是 \`jvm_memory_*\`、\`jvm_gc_collection_seconds_*\` 这类。
- \`JVM by OpenTelemetry\`：应用加载 OpenTelemetry Java Agent，经 OTel Collector 转成 Prometheus 指标。

两套不能混用。Spring Boot 项目还可以走 Actuator，见 [Spring Boot 集成](/integrations/springboot)。`,
      connect: `以 JMX Exporter 为例：启动参数里加 \`-javaagent:jmx_prometheus_javaagent.jar=9404:config.yaml\`，确认 \`http://<host>:9404/metrics\` 有输出，然后用 Categraf 的 \`prometheus\` 插件抓取：

\`\`\`toml
# conf/input.prometheus/java-jmx.toml
[[instances]]
urls = ["http://127.0.0.1:9404/metrics"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
labels = { job = "order-service" }
\`\`\`

\`job\` 标签填应用名，仪表盘按它区分服务。已有 Prometheus 在抓的话，直接[接成数据源](/docs/data/prometheus)。`,
    },
    en: {
      title: 'Monitor Java applications (JVM) with Nightingale',
      summary: 'JVM memory, GC, threads and class loading exposed via the JMX Exporter or the OpenTelemetry Java Agent; one dashboard set for each metric naming.',
      intro: `Monitoring a Java application mostly means monitoring the JVM: heap and non-heap memory, GC count and pause time per generation, thread count and deadlocks, class loading, file descriptors. The two common ways of exposing these produce different metric names, so the templates are split:

- \`JMX\` and \`JMX - Kubernetes\`: the application loads the Prometheus JMX Exporter Java Agent and emits \`jvm_memory_*\`, \`jvm_gc_collection_seconds_*\` and friends.
- \`JVM by OpenTelemetry\`: the application loads the OpenTelemetry Java Agent and an OTel Collector converts the data to Prometheus metrics.

The two sets do not mix. Spring Boot applications can also go through Actuator; see the [Spring Boot integration](/integrations/springboot).`,
      connect: `Taking the JMX Exporter as the example: add \`-javaagent:jmx_prometheus_javaagent.jar=9404:config.yaml\` to the JVM options, check that \`http://<host>:9404/metrics\` responds, then scrape it with the Categraf \`prometheus\` input:

\`\`\`toml
# conf/input.prometheus/java-jmx.toml
[[instances]]
urls = ["http://127.0.0.1:9404/metrics"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
labels = { job = "order-service" }
\`\`\`

Put the application name in the \`job\` label; the dashboards filter on it. If a Prometheus already scrapes these targets, [add it as a data source](/docs/data/prometheus) instead.`,
    },
  },
  SpringBoot: {
    related: [practice('java', '实践：监控 Java 应用', 'Walkthrough: monitor Java applications')],
    zh: {
      title: '用夜莺监控 Spring Boot 应用',
      summary: '引入 Actuator 和 micrometer-registry-prometheus，应用自己暴露 /actuator/prometheus，模板带按应用名区分的 JVM 仪表盘。',
      intro: `Spring Boot 应用不需要外挂 agent：引入 \`spring-boot-starter-actuator\` 和 \`micrometer-registry-prometheus\` 两个依赖，开放 prometheus 端点，应用就在 \`/actuator/prometheus\` 暴露 JVM、HTTP 请求、数据源连接池、线程池和自定义指标。Actuator 底层用的就是 Micrometer。

模板里两张 JVM 仪表盘按 Actuator 的指标名（\`jvm_memory_used_bytes\`、\`http_server_requests_seconds\` 等）编写，其中一张按 \`application\` 标签区分多个服务。规则覆盖堆内存逼近上限、GC 停顿过长、HTTP 5xx 升高和线程数异常。`,
      connect: `Spring Boot 3.x 在 \`application.properties\` 里加：

\`\`\`properties
management.endpoints.web.exposure.include=health,info,prometheus
management.endpoint.prometheus.enabled=true
management.prometheus.metrics.export.enabled=true
\`\`\`

2.x 把最后一行换成 \`management.metrics.export.prometheus.enabled=true\`。启动后确认 \`http://localhost:8080/actuator/prometheus\` 有输出，再用 Categraf 的 \`prometheus\` 插件抓取，\`labels\` 里给 \`application\` 标签填应用名。不要把 \`exposure.include\` 设成 \`*\`。`,
    },
    en: {
      title: 'Monitor Spring Boot applications with Nightingale',
      summary: 'Add Actuator and micrometer-registry-prometheus and the application exposes /actuator/prometheus itself; the template ships JVM dashboards split by application name.',
      intro: `Spring Boot applications need no external agent. Add the \`spring-boot-starter-actuator\` and \`micrometer-registry-prometheus\` dependencies, expose the prometheus endpoint, and the application serves JVM, HTTP request, datasource pool, executor and custom metrics on \`/actuator/prometheus\`. Actuator is built on Micrometer underneath.

The two JVM dashboards are written against Actuator metric names (\`jvm_memory_used_bytes\`, \`http_server_requests_seconds\` and so on); one of them separates services by the \`application\` label. The rules cover heap near the limit, long GC pauses, rising HTTP 5xx and abnormal thread counts.`,
      connect: `For Spring Boot 3.x, add to \`application.properties\`:

\`\`\`properties
management.endpoints.web.exposure.include=health,info,prometheus
management.endpoint.prometheus.enabled=true
management.prometheus.metrics.export.enabled=true
\`\`\`

On 2.x the last line is \`management.metrics.export.prometheus.enabled=true\`. Check that \`http://localhost:8080/actuator/prometheus\` responds, then scrape it with the Categraf \`prometheus\` input and set an \`application\` label to the service name. Do not set \`exposure.include\` to \`*\`.`,
    },
  },
  PHP: {
    zh: {
      title: '用夜莺监控 PHP-FPM',
      summary: '开启 pm.status_path 后，插件通过 HTTP 或 Unix socket 读取 PHP-FPM 的进程池状态：活跃与空闲进程、请求队列、慢请求和达到上限的次数。',
      intro: `PHP-FPM 插件由 Telegraf 的 phpfpm 改造而来，读取进程池的状态页：接受的连接数、监听队列长度与最大值、空闲与活跃进程、总进程数、达到 \`max_children\` 的次数、慢请求数。这些是判断 PHP 应用是否被打满的直接依据。

需要在 \`php-fpm.conf\` 或池配置里开启 \`pm.status_path = /status\`。通过 HTTP 访问时支持超时、Basic Auth、自定义 header 和 TLS；走 Unix socket 时 Categraf 要和 socket 在同一台机器且有读权限。规则覆盖进程池打满、监听队列积压、慢请求升高和 FPM 不可达。`,
    },
    en: {
      title: 'Monitor PHP-FPM with Nightingale',
      summary: 'With pm.status_path enabled, the input reads the PHP-FPM pool status over HTTP or a Unix socket: active and idle processes, request queue, slow requests and max-children hits.',
      intro: `The PHP-FPM input is adapted from Telegraf's phpfpm plugin and reads the pool status page: accepted connections, listen queue length and maximum, idle and active processes, total processes, how often \`max_children\` was reached and the slow request count. These are the direct indicators of a saturated PHP application.

Enable \`pm.status_path = /status\` in \`php-fpm.conf\` or the pool config. Over HTTP the input supports timeouts, Basic Auth, custom headers and TLS; over a Unix socket, Categraf must run on the same host with read access to the socket. The rules cover a full process pool, listen queue backlog, rising slow requests and FPM being unreachable.`,
    },
  },
  Consul: {
    zh: {
      summary: '通过 Consul API 采集所有注册服务的健康检查状态，哪个服务在哪个节点上 critical 或 warning 一目了然。',
      intro: `Consul 插件调用 Consul 的健康检查 API，把每一项注册的 health check 转成指标：服务名、节点、检查名、当前状态（passing、warning、critical）。它不采集 Consul 自身的 telemetry（那部分 Consul 可以通过 StatsD 或自带的 Prometheus 端点输出），专注于「注册在 Consul 里的服务有没有挂」这一个问题。

规则覆盖服务实例进入 critical、整个服务没有健康实例、节点失联、检查长期 warning 和 Consul 本身不可达。支持 ACL token 和 TLS。`,
    },
    en: {
      summary: 'Collects the health-check state of every registered service through the Consul API, so you see at once which service is critical or warning on which node.',
      intro: `The Consul input calls the Consul health API and turns every registered health check into a metric with service name, node, check name and current state (passing, warning, critical). It does not collect Consul's own telemetry, which Consul can emit over StatsD or its built-in Prometheus endpoint; its single job is answering "is anything registered in Consul unhealthy".

The rules cover service instances turning critical, services with no healthy instance left, nodes dropping out, checks stuck in warning and Consul itself being unreachable. ACL tokens and TLS are supported.`,
    },
  },
  Ldap: {
    zh: {
      title: '用夜莺监控 LDAP（OpenLDAP、389ds）',
      summary: '读取 LDAP 服务器的 cn=Monitor 后端，采集连接、各类操作计数、等待者和线程状态，支持 OpenLDAP 和 389 Directory Server。',
      intro: `LDAP 插件查询服务器的监控后端（\`cn=Monitor\`），得到当前与累计连接数、bind、search、modify、add、delete 等操作的计数、等待中的读写、线程池状态和运行时长。支持 OpenLDAP 和 389ds 两种方言，指标名按方言略有不同。

前提是 LDAP 服务器启用了 monitor 后端（OpenLDAP 的 \`olcDatabase=monitor\`）并允许监控账号读取。支持 StartTLS 和 LDAPS。规则覆盖连接数异常、操作错误升高、bind 失败增多和服务不可达。`,
    },
    en: {
      title: 'Monitor LDAP (OpenLDAP, 389ds) with Nightingale',
      summary: "Reads the LDAP server's cn=Monitor backend for connections, operation counters, waiters and thread state; supports OpenLDAP and 389 Directory Server.",
      intro: `The LDAP input queries the server's monitoring backend (\`cn=Monitor\`) for current and total connections, counters for bind, search, modify, add, delete and other operations, pending reads and writes, thread pool state and uptime. OpenLDAP and 389ds dialects are both supported, with slightly different metric names.

The server must have the monitor backend enabled (\`olcDatabase=monitor\` on OpenLDAP) and allow the monitoring account to read it. StartTLS and LDAPS are supported. The rules cover abnormal connection counts, rising operation errors, growing bind failures and the service being unreachable.`,
    },
  },
  Bind: {
    zh: {
      title: '用夜莺监控 BIND DNS',
      summary: '通过 BIND 的 statistics channel（XML v3）采集查询计数、响应码、缓存和内存上下文，规则盯 SERVFAIL 升高和服务不可达。',
      intro: `BIND 插件从 Telegraf 移植，读取 named 的 statistics channel（默认 \`http://localhost:8053/xml/v3\`）：收到的各类查询、按 rcode 分类的响应、递归客户端数、socket 与网络计数、各 view 的缓存状态，以及内存上下文的使用。

在 \`named.conf\` 里配置 \`statistics-channels\` 并限制访问来源。规则覆盖 SERVFAIL 和 REFUSED 比例升高、递归客户端逼近上限、查询量突降和 named 不可达。`,
    },
    en: {
      title: 'Monitor BIND DNS with Nightingale',
      summary: "Collects query counts, response codes, cache and memory contexts from BIND's statistics channel (XML v3); rules watch rising SERVFAIL and unreachable servers.",
      intro: `The BIND input is ported from Telegraf and reads the statistics channel of named (\`http://localhost:8053/xml/v3\` by default): incoming queries by type, responses by rcode, recursive clients, socket and network counters, cache state per view and memory context usage.

Configure \`statistics-channels\` in \`named.conf\` and restrict who can reach it. The rules cover rising SERVFAIL and REFUSED ratios, recursive clients near the limit, query volume dropping and named being unreachable.`,
    },
  },
  Logstash: {
    zh: {
      summary: '通过 Logstash 的节点 API 采集 pipeline 的事件进出与过滤耗时、队列和 JVM 状态，规则盯事件堆积和 JVM 压力。',
      intro: `Logstash 默认在 9600 端口提供 HTTP API，插件抓 \`_node/stats\`：每个 pipeline 的输入、过滤、输出事件数与耗时，持久化队列的容量与积压，JVM 堆、GC 与线程，以及进程的 CPU 和文件描述符。

API 开了 Basic Auth 或 TLS 就同步配置用户名、密码和证书。模板里事件吞吐、队列和 pipeline 面板只有在 Logstash 真正处理事件后才有非零数据。规则覆盖事件处理停滞、队列持续增长、JVM 堆逼近上限和 Logstash 不可达。`,
    },
    en: {
      summary: "Collects pipeline event in/out and filter time, queue state and JVM health from Logstash's node API; rules watch event backlog and JVM pressure.",
      intro: `Logstash serves an HTTP API on port 9600 by default. The input reads \`_node/stats\`: input, filter and output event counts and durations per pipeline, persistent queue capacity and backlog, JVM heap, GC and threads, and process CPU and file descriptors.

If the API has Basic Auth or TLS enabled, configure the username, password and certificates accordingly. The throughput, queue and pipeline panels only show non-zero data once Logstash actually processes events. The rules cover stalled event processing, a steadily growing queue, heap near the limit and Logstash being unreachable.`,
    },
  },
  Mtail: {
    zh: {
      title: '用 mtail 把日志变成夜莺指标',
      summary: 'Categraf 内置了 mtail：用正则和表达式从日志里提取 counter、gauge、histogram，不用把日志先送进日志系统。',
      intro: `mtail 插件把日志变成指标：输入是日志文件，输出是按 mtail 语法定义的 counter、gauge 和 histogram，本质是 Go 正则提取加表达式计算。适合从 Nginx 访问日志统计状态码分布、从应用日志数错误次数这类场景，不需要先把日志送进 Elasticsearch 或 Loki。

每个 \`[[instances]]\` 指向一组 \`progs\`（mtail 程序文件或目录）和要跟踪的日志路径；不同实例要用不同的 progs，或者用 \`labels\` 区分，否则指标会互相干扰。`,
    },
    en: {
      title: 'Turn logs into Nightingale metrics with mtail',
      summary: 'Categraf embeds mtail: extract counters, gauges and histograms from log files with regular expressions and expressions, without shipping the logs to a log system first.',
      intro: `The mtail input turns logs into metrics. Input is a log file, output is a set of counters, gauges and histograms defined in mtail syntax; underneath it is Go regular expressions plus expression evaluation. It suits cases such as status-code distribution from Nginx access logs or error counts from application logs, with no need to ship the logs into Elasticsearch or Loki first.

Each \`[[instances]]\` block points at a set of \`progs\` (mtail program files or a directory) and the log paths to follow. Give different instances different progs, or distinguish them with \`labels\`, or their metrics will collide.`,
    },
  },

  // ---------------------------------------------------------------- 容器与云原生
  Kubernetes: {
    zh: {
      summary: '抓 apiserver、kubelet、controller-manager、scheduler、kube-proxy、CoreDNS、kube-state-metrics 和 node-exporter 的原生 /metrics，模板覆盖控制面到 Pod 的每一层。',
      intro: `Kubernetes 的每个组件都自带 Prometheus 格式的 \`/metrics\`，推荐用 Categraf 的 \`prometheus\` 插件直接抓取，再部署 kube-state-metrics（工作负载状态）和 node-exporter（节点资源）。旧的 Categraf kubernetes 插件已废弃，但模板里的仪表盘和规则照常可用。

| 数据源 | 常用端点 | 覆盖的模板 |
| --- | --- | --- |
| kube-apiserver | \`https://<api-server>:6443/metrics\` | API Server |
| kubelet | \`https://<node>:10250/metrics\`、\`/metrics/cadvisor\`、\`/metrics/resource\` | Kubelet、Node、Pod、Container |
| kube-controller-manager | \`https://<control-plane>:10257/metrics\` | Controller Manager |
| kube-scheduler | \`https://<control-plane>:10259/metrics\` | Scheduler |
| kube-proxy | \`http://<node>:10249/metrics\` | Proxy |
| kube-state-metrics | \`http://<service>:8080/metrics\` | Deployment、StatefulSet、DaemonSet、Pod 状态 |
| CoreDNS | \`http://<coredns>:9153/metrics\` | CoreDNS |
| node-exporter | \`http://<node>:9100/metrics\` | Node 资源 |

这是模板数量最多的一个集成：仪表盘覆盖控制面各组件、节点、Deployment、StatefulSet、DaemonSet、Pod、容器和 CoreDNS；规则覆盖 Pod 反复重启与 Pending、副本数不足、节点 NotReady 与资源压力、apiserver 延迟与错误率、etcd 与调度失败、证书到期；指标说明按组件逐条解释。`,
      connect: `${CATEGRAF_PROM.zh}

控制面组件的端点需要 ServiceAccount token 或客户端证书，Categraf 以 DaemonSet 部署在集群内时用 \`bearer_token_file\` 读取挂载的 token。K3s 等发行版的 scheduler、controller-manager 和 kube-proxy 可能只监听 loopback，要在控制面节点本机采集；不要为了方便把这些无鉴权端点暴露到公网。`,
    },
    en: {
      summary: 'Scrapes the native /metrics of the apiserver, kubelet, controller-manager, scheduler, kube-proxy, CoreDNS, kube-state-metrics and node-exporter; templates cover every layer from control plane to Pod.',
      intro: `Every Kubernetes component exposes Prometheus-format \`/metrics\`. The recommended path is to scrape them directly with the Categraf \`prometheus\` input and deploy kube-state-metrics (workload state) and node-exporter (node resources). The old Categraf kubernetes input is deprecated, but the dashboards and rules in this template keep working.

| Source | Typical endpoint | Templates it feeds |
| --- | --- | --- |
| kube-apiserver | \`https://<api-server>:6443/metrics\` | API Server |
| kubelet | \`https://<node>:10250/metrics\`, \`/metrics/cadvisor\`, \`/metrics/resource\` | Kubelet, Node, Pod, Container |
| kube-controller-manager | \`https://<control-plane>:10257/metrics\` | Controller Manager |
| kube-scheduler | \`https://<control-plane>:10259/metrics\` | Scheduler |
| kube-proxy | \`http://<node>:10249/metrics\` | Proxy |
| kube-state-metrics | \`http://<service>:8080/metrics\` | Deployment, StatefulSet, DaemonSet, Pod state |
| CoreDNS | \`http://<coredns>:9153/metrics\` | CoreDNS |
| node-exporter | \`http://<node>:9100/metrics\` | Node resources |

This is the largest template in the catalog. Dashboards cover each control-plane component, nodes, Deployments, StatefulSets, DaemonSets, Pods, containers and CoreDNS. Rules cover crash-looping and Pending Pods, missing replicas, NotReady nodes and resource pressure, apiserver latency and error rate, etcd and scheduling failures, and expiring certificates. The metric reference explains the metrics component by component.`,
      connect: `${CATEGRAF_PROM.en}

Control-plane endpoints need a ServiceAccount token or client certificate; when Categraf runs as a DaemonSet inside the cluster, use \`bearer_token_file\` to read the mounted token. On distributions such as K3s, the scheduler, controller-manager and kube-proxy may listen on loopback only, so collect them on the control-plane node itself. Do not expose these unauthenticated endpoints to the internet for convenience.`,
    },
  },
  Docker: {
    zh: {
      summary: '通过 Docker API 采集每个容器的 CPU、内存、块设备和网络 IO 以及守护进程状态，仪表盘按 docker_* 指标编写并经过真实验证。',
      intro: `Docker 插件基于 Telegraf 的 docker 插件，连接 Docker 守护进程的 socket（\`unix:///var/run/docker.sock\`）或 TCP 端点，采集引擎层面的容器数量与状态、镜像数、存储驱动信息，以及每个容器的 CPU、内存、blkio 和网络 IO。可选采集 Swarm service 和扩展内存统计。

模板里的 \`Docker Dashboard\` 按这些 \`docker_*\` 指标编写并完成真实验证，所以必须启用本插件。cAdvisor 也是推荐的容器采集方式，但它输出的是 \`container_*\` 指标，要用 [cAdvisor 集成](/integrations/cadvisor)的仪表盘，两者不能混用。规则覆盖容器 OOM、异常退出、CPU 与内存超限和守护进程不可达。`,
    },
    en: {
      summary: 'Collects per-container CPU, memory, block and network IO plus daemon state through the Docker API; the dashboard is written against docker_* metrics and verified on real hosts.',
      intro: `The Docker input is based on Telegraf's docker plugin. It connects to the Docker daemon socket (\`unix:///var/run/docker.sock\`) or a TCP endpoint and collects engine-level container counts and states, image count and storage driver information, plus CPU, memory, blkio and network IO for every container. Swarm services and extended memory statistics are optional.

The bundled \`Docker Dashboard\` is written against these \`docker_*\` metrics and verified on real hosts, so this input must be enabled for it. cAdvisor is also a recommended way to collect containers, but it emits \`container_*\` metrics and needs the dashboards from the [cAdvisor integration](/integrations/cadvisor); the two do not mix. The rules cover container OOM kills, abnormal exits, CPU and memory over limits and the daemon being unreachable.`,
    },
  },
  cAdvisor: {
    zh: {
      summary: '抓 kubelet 内置或独立部署的 cAdvisor，拿到每个容器的 CPU、内存、文件系统和网络指标，kubelet 模式下还能附加 Pod 的 label 和 annotation。',
      intro: `cAdvisor 插件采集 cAdvisor 暴露的 \`container_*\` 指标：容器级的 CPU 使用与限流、内存工作集与 OOM、文件系统读写、网络收发与丢包。两种接法：\`type = "kubelet"\` 抓 kubelet 的 \`/metrics/cadvisor\`（10250 端口，需要鉴权），并且可以把 Pod 的 label 和 annotation 附加到指标上；\`type = "cadvisor"\` 直接抓独立部署的 cAdvisor（默认 8080）。

模板里的仪表盘按容器维度展示资源使用，指标说明逐条解释 \`container_*\` 指标的含义。规则覆盖容器 CPU 被限流、内存逼近 limit、OOM 和网络丢包。`,
    },
    en: {
      summary: 'Scrapes the cAdvisor built into kubelet or a standalone one for per-container CPU, memory, filesystem and network metrics; in kubelet mode it can attach Pod labels and annotations.',
      intro: `The cAdvisor input collects the \`container_*\` metrics that cAdvisor exposes: per-container CPU usage and throttling, memory working set and OOM events, filesystem reads and writes, network traffic and drops. Two ways to connect: \`type = "kubelet"\` scrapes the kubelet's \`/metrics/cadvisor\` (port 10250, authenticated) and can attach Pod labels and annotations to the metrics; \`type = "cadvisor"\` scrapes a standalone cAdvisor (port 8080 by default).

The dashboard shows resource usage per container and the metric reference explains each \`container_*\` metric. The rules cover CPU throttling, memory near the limit, OOM kills and network drops.`,
    },
  },
  Ceph: {
    zh: {
      summary: '开启 Ceph 的 prometheus mgr 模块后直接抓 9283 端口，模板覆盖集群健康、OSD、PG、池容量和 IOPS。',
      intro: `Ceph 的 mgr 自带 prometheus 模块：\`ceph mgr module enable prometheus\` 之后在 9283 端口暴露 \`/metrics\`，用 Categraf 的 \`prometheus\` 插件抓取即可，不需要专门插件。

模板里的仪表盘覆盖集群健康状态、OSD 在线与容量、PG 状态分布、各存储池的用量与 IOPS、MON 法定人数。规则覆盖集群 HEALTH_WARN/ERR、OSD down、PG 异常、池容量逼近上限和 MON 失去法定人数。`,
      connect: `${CATEGRAF_PROM.zh}

\`\`\`toml
# conf/input.prometheus/ceph.toml
[[instances]]
urls = ["http://<ceph-mgr>:9283/metrics"]
labels = { service = "ceph", cluster = "ceph-cluster-001" }
\`\`\``,
    },
    en: {
      summary: "Enable Ceph's prometheus mgr module and scrape port 9283; templates cover cluster health, OSDs, PGs, pool capacity and IOPS.",
      intro: `Ceph's mgr ships a prometheus module: after \`ceph mgr module enable prometheus\`, \`/metrics\` is served on port 9283 and the Categraf \`prometheus\` input scrapes it without any dedicated plugin.

The dashboard covers cluster health, OSD availability and capacity, PG state distribution, usage and IOPS per pool, and MON quorum. The rules cover HEALTH_WARN and HEALTH_ERR, OSDs down, abnormal PGs, pools near capacity and loss of MON quorum.`,
      connect: `${CATEGRAF_PROM.en}

\`\`\`toml
# conf/input.prometheus/ceph.toml
[[instances]]
urls = ["http://<ceph-mgr>:9283/metrics"]
labels = { service = "ceph", cluster = "ceph-cluster-001" }
\`\`\``,
    },
  },
  MinIO: {
    zh: {
      summary: 'MinIO 自带 Prometheus 端点，要同时抓 cluster、bucket 和 node 三个路径，模板才能把对象、Bucket、进程和磁盘面板填满。',
      intro: `MinIO 在 \`/minio/v2/metrics/\` 下按 \`cluster\`、\`bucket\`、\`node\` 三个路径暴露 Prometheus 指标。模板里的两张仪表盘同时用到三类指标，只抓 \`/cluster\` 会导致对象数、Bucket 用量、进程和磁盘面板缺数据。

指标端点默认需要 Bearer Token 鉴权；测试环境可以设 \`MINIO_PROMETHEUS_AUTH_TYPE=public\`，生产环境保留鉴权并在 Categraf 里配置 token，不要把端点暴露到公网。规则覆盖节点离线、磁盘离线与容量逼近上限、S3 请求错误率和健康检查失败。`,
      connect: `${CATEGRAF_PROM.zh}

\`\`\`toml
# conf/input.prometheus/minio.toml
[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/cluster"]
labels = { job = "minio", instance = "minio-01:9000" }

[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/bucket"]
labels = { job = "minio", instance = "minio-01:9000" }

[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/node"]
labels = { job = "minio", instance = "minio-01:9000" }
\`\`\``,
    },
    en: {
      summary: 'MinIO ships a Prometheus endpoint; scrape the cluster, bucket and node paths together or the object, bucket, process and disk panels stay empty.',
      intro: `MinIO exposes Prometheus metrics under \`/minio/v2/metrics/\` on three paths: \`cluster\`, \`bucket\` and \`node\`. The two bundled dashboards use all three families, so scraping \`/cluster\` alone leaves the object count, bucket usage, process and disk panels without data.

The endpoint requires a Bearer Token by default. \`MINIO_PROMETHEUS_AUTH_TYPE=public\` is fine for a test environment; in production keep authentication on, configure the token in Categraf, and do not expose the endpoint to the internet. The rules cover nodes offline, disks offline or near capacity, S3 request error rate and failed health checks.`,
      connect: `${CATEGRAF_PROM.en}

\`\`\`toml
# conf/input.prometheus/minio.toml
[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/cluster"]
labels = { job = "minio", instance = "minio-01:9000" }

[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/bucket"]
labels = { job = "minio", instance = "minio-01:9000" }

[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/node"]
labels = { job = "minio", instance = "minio-01:9000" }
\`\`\``,
    },
  },
  OpenStack: {
    zh: {
      summary: '通过 OpenStack API 采集 Nova、Neutron、Cinder、Glance、Keystone 和 Heat 的资源与配额，以及每台实例的状态。',
      intro: `OpenStack 插件以一个有读取权限的账号调用各服务的 API：Nova 的实例、hypervisor 与配额，Neutron 的网络、子网、端口、浮动 IP 与安全组，Cinder 的卷与快照，Glance 的镜像，Keystone 的项目与用户，Heat 的栈。每台实例的状态、所属项目和 flavor 也会作为指标上报。

需要的 API 版本：blockstorage v3、compute v2、identity v3、networking v2。规则覆盖实例进入 ERROR、hypervisor 资源逼近上限、配额用尽、服务 API 不可达。`,
    },
    en: {
      summary: 'Collects resources and quotas from Nova, Neutron, Cinder, Glance, Keystone and Heat through the OpenStack API, plus the state of every instance.',
      intro: `The OpenStack input calls each service's API with a read-capable account: Nova instances, hypervisors and quotas; Neutron networks, subnets, ports, floating IPs and security groups; Cinder volumes and snapshots; Glance images; Keystone projects and users; Heat stacks. Every instance's state, project and flavor is reported as a metric too.

Required API versions: blockstorage v3, compute v2, identity v3, networking v2. The rules cover instances entering ERROR, hypervisor resources near the limit, exhausted quotas and service APIs being unreachable.`,
    },
  },
  vSphere: {
    zh: {
      summary: '通过 vCenter API 采集 ESXi 主机、虚拟机、数据存储和集群的 CPU、内存、磁盘与网络性能计数器。',
      intro: `vSphere 插件通过 vCenter Server 的 API 拉取性能数据，覆盖数据中心、集群、ESXi 主机、虚拟机和数据存储五个层级：CPU 就绪时间与使用率、内存活跃与 ballooning、磁盘延迟与 IOPS、网络吞吐、数据存储容量。监控 vSphere 必须有 vCenter，直接连 ESXi 不行。

给 Categraf 一个只读角色的 vCenter 账号，不要用 administrator。配置里可以按对象类型筛选要采的计数器，vCenter 规模大时建议收窄。规则覆盖主机失联、虚拟机 CPU 就绪时间过高、内存 ballooning、数据存储空间逼近上限和磁盘延迟。`,
    },
    en: {
      summary: 'Pulls CPU, memory, disk and network performance counters for ESXi hosts, virtual machines, datastores and clusters through the vCenter API.',
      intro: `The vSphere input pulls performance data through the vCenter Server API across five levels: datacenter, cluster, ESXi host, virtual machine and datastore. That includes CPU ready time and usage, active memory and ballooning, disk latency and IOPS, network throughput and datastore capacity. A vCenter is required; connecting to a bare ESXi host does not work.

Give Categraf a vCenter account with a read-only role rather than administrator. The config lets you narrow the counters per object type, which is advisable on large vCenters. The rules cover hosts disconnecting, high VM CPU ready time, memory ballooning, datastores near capacity and disk latency.`,
    },
  },

  // ---------------------------------------------------------------- 云平台
  AliYun: {
    zh: {
      title: '用夜莺监控阿里云',
      summary: '通过云监控 OpenAPI 拉取 ECS、RDS、Redis、SLB、CDN、ARMS 等产品的指标，模板里有几十张按产品划分的仪表盘和告警规则。',
      intro: `阿里云插件用 \`aliyun\` 插件调用云监控（CloudMonitor）的 OpenAPI，按 namespace 拉取各产品的指标：ECS、RDS、Redis、MongoDB、SLB/ALB、OSS、CDN、消息队列、ARMS 应用监控等。拉下来的指标以 \`aliyun_<namespace>_<metric>\` 命名，带实例 ID 和地域标签。

需要一个 RAM 用户，授予 \`AliyunCloudMonitorReadOnlyAccess\` 并创建 AccessKey。云监控指标粒度一般是 60 秒，采集周期不要短于它。模板是整个目录里仪表盘最多的集成之一，按产品各一张，规则覆盖 ECS CPU 与磁盘、RDS 连接与 IOPS、Redis 内存、SLB 后端异常、CDN 状态码等常见场景。`,
    },
    en: {
      title: 'Monitor Alibaba Cloud with Nightingale',
      summary: 'Pulls ECS, RDS, Redis, SLB, CDN, ARMS and other product metrics through the CloudMonitor OpenAPI; the template ships dozens of per-product dashboards and rules.',
      intro: `The \`aliyun\` input calls the CloudMonitor OpenAPI and pulls metrics per namespace: ECS, RDS, Redis, MongoDB, SLB/ALB, OSS, CDN, message queues, ARMS application monitoring and more. Metrics arrive named \`aliyun_<namespace>_<metric>\` with instance ID and region labels.

Create a RAM user, grant \`AliyunCloudMonitorReadOnlyAccess\` and issue an AccessKey. CloudMonitor metrics are usually at 60-second granularity, so do not collect more often than that. This is one of the dashboard-richest templates in the catalog, one per product, and the rules cover ECS CPU and disk, RDS connections and IOPS, Redis memory, SLB backend health, CDN status codes and other everyday cases.`,
    },
  },
  Huawei: {
    zh: {
      title: '用夜莺监控华为云',
      summary: '用华为云 cloudeye-exporter 把云监控（CES）指标转成 Prometheus 格式后抓取，模板覆盖 ECS、RDS、DCS、ELB、Kafka、RocketMQ、CSS 和 WAF。',
      intro: `华为云的指标来自云监控服务（Cloud Eye）。华为云官方维护的 \`cloudeye-exporter\` 会按产品 namespace 把 CES 指标转成 \`huaweicloud_sys_<service>_<metric>\` 形式的 Prometheus 指标，用 Categraf 的 \`prometheus\` 插件抓取即可。

模板按产品分：ECS 主机、RDS（MySQL、PostgreSQL）、DCS Redis 的实例与代理节点、ELB、分布式消息（Kafka、RabbitMQ、RocketMQ）、云搜索（CSS/ES）和 WAF，每种一张仪表盘。规则覆盖 ECS CPU 与内存、RDS 连接与磁盘、DCS 内存与命中率、ELB 后端异常；指标说明逐条解释各产品的指标含义。`,
      connect: `部署 [cloudeye-exporter](https://github.com/huaweicloud/cloudeye-exporter)，在它的配置里填 IAM 账号的 AK/SK、项目和要采集的 namespace。确认 \`http://<exporter>:8087/metrics?services=SYS.ECS\` 有输出后，用 Categraf 的 \`prometheus\` 插件按 namespace 抓取：

\`\`\`toml
# conf/input.prometheus/huaweicloud.toml
interval = 120

[[instances]]
urls = ["http://<exporter>:8087/metrics?services=SYS.ECS,SYS.RDS,SYS.DCS,SYS.ELB"]
labels = { job = "huaweicloud" }
\`\`\`

云监控指标粒度通常是 60 秒以上，采集周期不要短于它。`,
    },
    en: {
      title: 'Monitor Huawei Cloud with Nightingale',
      summary: 'Scrape Cloud Eye (CES) metrics converted to Prometheus format by the cloudeye-exporter; templates cover ECS, RDS, DCS, ELB, Kafka, RocketMQ, CSS and WAF.',
      intro: `Huawei Cloud metrics come from the Cloud Eye service (CES). The \`cloudeye-exporter\` maintained by Huawei Cloud converts CES metrics per product namespace into Prometheus metrics named \`huaweicloud_sys_<service>_<metric>\`, which the Categraf \`prometheus\` input scrapes.

The templates are split by product: ECS hosts, RDS (MySQL and PostgreSQL), DCS Redis instances and proxy nodes, ELB, distributed messaging (Kafka, RabbitMQ, RocketMQ), Cloud Search (CSS/ES) and WAF, one dashboard each. The rules cover ECS CPU and memory, RDS connections and disk, DCS memory and hit ratio, ELB backend health; the metric reference explains each product's metrics one by one.`,
      connect: `Deploy the [cloudeye-exporter](https://github.com/huaweicloud/cloudeye-exporter) and configure it with an IAM account's AK/SK, the project and the namespaces to collect. Once \`http://<exporter>:8087/metrics?services=SYS.ECS\` responds, scrape it per namespace with the Categraf \`prometheus\` input:

\`\`\`toml
# conf/input.prometheus/huaweicloud.toml
interval = 120

[[instances]]
urls = ["http://<exporter>:8087/metrics?services=SYS.ECS,SYS.RDS,SYS.DCS,SYS.ELB"]
labels = { job = "huaweicloud" }
\`\`\`

Cloud Eye metrics are at 60-second granularity or coarser, so do not collect more often than that.`,
    },
  },
  Tencent: {
    zh: {
      title: '用夜莺监控腾讯云',
      summary: '用 tencentcloud-exporter 把云监控指标转成 Prometheus 格式后抓取，模板覆盖 CVM、CKafka、PostgreSQL、Redis、TDSQL-C 和负载均衡。',
      intro: `腾讯云的指标来自云监控（Cloud Monitor）。腾讯云官方维护的 \`tencentcloud-exporter\` 按产品把这些指标转成 \`qce_<product>_<metric>\` 形式的 Prometheus 指标，用 Categraf 的 \`prometheus\` 插件抓取即可。

模板按产品各一张仪表盘：CVM 云服务器、CKafka、云数据库 PostgreSQL、Redis 内存版、TDSQL-C（MySQL）以及公网和内网负载均衡。页面下方的指标说明是腾讯云各产品的监控指标清单，含义、单位和统计维度都在。`,
      connect: `部署 [tencentcloud-exporter](https://github.com/TencentCloud/tencentcloud-exporter)，在配置里填 API 密钥和要采集的产品与地域。确认 \`http://<exporter>:9123/metrics\` 有输出后，用 Categraf 的 \`prometheus\` 插件抓取：

\`\`\`toml
# conf/input.prometheus/tencentcloud.toml
interval = 60

[[instances]]
urls = ["http://<exporter>:9123/metrics"]
labels = { job = "tencentcloud" }
\`\`\``,
    },
    en: {
      title: 'Monitor Tencent Cloud with Nightingale',
      summary: 'Scrape Cloud Monitor metrics converted to Prometheus format by the tencentcloud-exporter; templates cover CVM, CKafka, PostgreSQL, Redis, TDSQL-C and load balancers.',
      intro: `Tencent Cloud metrics come from its Cloud Monitor service. The \`tencentcloud-exporter\` maintained by Tencent Cloud converts them per product into Prometheus metrics named \`qce_<product>_<metric>\`, which the Categraf \`prometheus\` input scrapes.

The templates ship one dashboard per product: CVM instances, CKafka, Cloud PostgreSQL, Redis (memory edition), TDSQL-C for MySQL, and public and private load balancers. The metric reference further down lists Tencent Cloud's monitoring metrics per product with meaning, unit and dimensions.`,
      connect: `Deploy the [tencentcloud-exporter](https://github.com/TencentCloud/tencentcloud-exporter) and configure it with an API key plus the products and regions to collect. Once \`http://<exporter>:9123/metrics\` responds, scrape it with the Categraf \`prometheus\` input:

\`\`\`toml
# conf/input.prometheus/tencentcloud.toml
interval = 60

[[instances]]
urls = ["http://<exporter>:9123/metrics"]
labels = { job = "tencentcloud" }
\`\`\``,
    },
  },
  CloudWatch: {
    zh: {
      title: '用夜莺监控 AWS CloudWatch',
      summary: '通过 CloudWatch API 拉取任意 namespace 的指标统计值，EC2、RDS、ELB、Lambda 都能接；模板带 RDS 仪表盘和常用规则。',
      intro: `CloudWatch 插件从 Telegraf 移植，调用 CloudWatch 的 GetMetricData API 按 namespace（\`AWS/EC2\`、\`AWS/RDS\`、\`AWS/ELB\` 等）拉取指标的统计值，可以按维度过滤只采自己关心的资源。认证走标准的凭证链：\`role_arn\`、显式 AK/SK、profile、环境变量、共享凭证文件、EC2 实例角色，按这个顺序尝试。

CloudWatch 按 API 调用计费，采集周期和 namespace 范围要和账单一起考虑。模板带一张 RDS 仪表盘，规则覆盖 EC2 状态检查失败、CPU 持续高、RDS 连接数与存储、ELB 5xx 和不健康后端。`,
    },
    en: {
      title: 'Monitor AWS CloudWatch with Nightingale',
      summary: 'Pulls metric statistics from any CloudWatch namespace through the API, so EC2, RDS, ELB and Lambda all fit; the template ships an RDS dashboard and common rules.',
      intro: `The CloudWatch input is ported from Telegraf. It calls the GetMetricData API to pull statistics per namespace (\`AWS/EC2\`, \`AWS/RDS\`, \`AWS/ELB\` and so on), with dimension filters to limit collection to the resources you care about. Authentication follows the standard credential chain: \`role_arn\`, explicit access keys, a named profile, environment variables, the shared credentials file and the EC2 instance profile, tried in that order.

CloudWatch bills per API call, so choose the interval and namespace scope with the invoice in mind. The template ships an RDS dashboard, and the rules cover EC2 status check failures, sustained high CPU, RDS connections and storage, ELB 5xx and unhealthy backends.`,
    },
  },
  Azure: {
    zh: {
      title: '用夜莺监控 Azure Monitor',
      summary: '通过 Azure Monitor API 按资源类型拉取指标，用服务主体鉴权，只需 Monitoring Reader 角色。',
      intro: `Azure 插件调用 Azure Monitor 的指标 API，按订阅、资源组或资源类型（虚拟机、存储账户、SQL 数据库、应用服务等）拉取指标，配置里可以按资源类型指定要采的指标名和聚合方式。

需要注册一个服务主体，授予 \`Monitoring Reader\` 角色，把租户 ID、客户端 ID、密钥和订阅 ID 填进配置。Azure API 每小时限 12000 次读取，采集周期和指标数量要控制在这个额度内。`,
    },
    en: {
      title: 'Monitor Azure Monitor with Nightingale',
      summary: 'Pulls metrics per resource type through the Azure Monitor API, authenticating with a service principal that only needs the Monitoring Reader role.',
      intro: `The Azure input calls the Azure Monitor metrics API and pulls metrics by subscription, resource group or resource type (virtual machines, storage accounts, SQL databases, App Service and so on). The config lets you name the metrics and aggregations to collect per resource type.

Register a service principal, grant it the \`Monitoring Reader\` role, and put the tenant ID, client ID, secret and subscription ID into the config. The Azure API allows 12,000 reads per hour, so keep the interval and metric count within that budget.`,
    },
  },

  // ---------------------------------------------------------------- 网络
  SNMP: {
    related: [{ zh: '[Switch Legacy：交换机零配置采集](/integrations/switch-legacy)', en: '[Switch Legacy: zero-config switch collection](/integrations/switch-legacy)' }],
    zh: {
      title: '用夜莺通过 SNMP 监控网络设备',
      summary: '配置 OID 就能采任意网络设备，还能把 OID 的值当标签用；模板带 Cisco、Juniper 和通用交换机的仪表盘与几十条规则。',
      intro: `Categraf 从 v0.2.13 起集成了 Telegraf 的 snmp 插件。核心逻辑是：要采什么指标，配置对应的 OID；\`[[instances.field]]\` 采单个值，\`[[instances.table]]\` 按表采多行，表里的某些 OID（比如接口名）可以作为标签。通用 OID（接口流量、错误、状态）对绝大多数设备都有效，CPU、内存这类私有 OID 则按厂商和型号配置。

模板带通用交换机状态汇总、设备流量视图、接入交换机、Cisco 和 Juniper 设备详情几张仪表盘，规则覆盖接口 down、流量逼近带宽、错包与丢包、CPU 与内存过高、设备不可达。需要为不同型号积累配置时，模板目录里的 \`Cisco.toml\` 是个起点。`,
    },
    en: {
      title: 'Monitor network devices over SNMP with Nightingale',
      summary: 'Collect any network device by listing OIDs, with OID values usable as labels; the template ships Cisco, Juniper and generic switch dashboards and dozens of rules.',
      intro: `Categraf has included Telegraf's snmp input since v0.2.13. The idea is simple: list the OIDs for the metrics you want. \`[[instances.field]]\` reads single values, \`[[instances.table]]\` walks a table into multiple rows, and selected OIDs in a table (interface names, say) can become labels. Generic OIDs for interface traffic, errors and state work on almost every device; vendor-specific OIDs for CPU and memory are configured per vendor and model.

The template ships dashboards for a generic switch overview, device traffic, access switches, and Cisco and Juniper device detail. The rules cover interfaces going down, traffic near bandwidth, errors and discards, high CPU and memory, and unreachable devices. The \`Cisco.toml\` in the template directory is a starting point for per-model configs.`,
    },
  },
  Switch_Legacy: {
    related: [{ zh: '[SNMP：按 OID 自定义采集](/integrations/snmp)', en: '[SNMP: custom collection by OID](/integrations/snmp)' }],
    zh: {
      title: '用夜莺零配置监控交换机（Switch Legacy）',
      summary: '给一组 IP 就能自动识别设备型号，采 CPU、内存和每个端口的流量、错包与状态，只支持 SNMP v2c。',
      intro: `switch_legacy 插件 fork 自 swcollector，面向「只想把交换机快速接进来」的场景：配置里给 IP 列表（单个、网段或范围），插件自动探测设备型号，用通用 OID 采集 CPU、内存使用率以及每个网口的流量、包数、错包、丢包和 up/down 状态，不用自己写 OID。

只支持 SNMP v2c，认证就是一个 community 字符串。把 \`switch_id_label\` 设为 \`ident\`，交换机会以 IP 为标识自动出现在夜莺的监控对象列表里。需要自定义 OID 或 SNMP v3 时换 [SNMP 集成](/integrations/snmp)。规则覆盖端口 down、流量逼近带宽、错包升高和设备不可达。`,
    },
    en: {
      title: 'Monitor switches with zero config (Switch Legacy) in Nightingale',
      summary: 'Give it a list of IPs and it detects the device model and collects CPU, memory and per-port traffic, errors and state; SNMP v2c only.',
      intro: `The switch_legacy input is forked from swcollector and targets the "just get the switches in quickly" case. List IPs in the config (single addresses, subnets or ranges), and the input detects the device model and uses generic OIDs to collect CPU and memory usage plus traffic, packets, errors, discards and up/down state for every port. No OIDs to write.

It supports SNMP v2c only, so authentication is a single community string. Set \`switch_id_label\` to \`ident\` and each switch appears in Nightingale's host list keyed by its IP. For custom OIDs or SNMP v3, use the [SNMP integration](/integrations/snmp) instead. The rules cover ports going down, traffic near bandwidth, rising errors and unreachable devices.`,
    },
  },
  Ping: {
    related: [practice('port', '实践：端口与连通性探测', 'Walkthrough: port and connectivity probes')],
    zh: {
      title: '用夜莺做 Ping 探测',
      summary: '从 Categraf 所在机器 ping 一批目标，得到丢包率、往返延迟和抖动，是判断机器存活最简单的手段。',
      intro: `ping 插件向 \`targets\` 里的地址发 ICMP 探测，上报丢包率、最小/平均/最大/标准差 RTT 和 TTL。只要目标没禁 ping，这就是最省事的存活探测；也可以在多个机房各部署一个 Categraf，互相 ping 来观察链路质量。

不同的目标可以拆成多个 \`[[instances]]\` 并附加 \`region\`、\`product\` 之类的标签，仪表盘和规则按标签筛。目标多时要调大 Categraf 进程的文件描述符上限。规则覆盖目标不可达和丢包率升高。`,
    },
    en: {
      title: 'Ping probes with Nightingale',
      summary: 'Ping a list of targets from wherever Categraf runs and get packet loss, round-trip latency and jitter; the simplest liveness check there is.',
      intro: `The ping input sends ICMP probes to the addresses in \`targets\` and reports packet loss, minimum, average, maximum and standard deviation RTT, and TTL. As long as the targets do not block ping, it is the cheapest liveness check; running one Categraf per site and pinging across sites also gives a picture of link quality.

Split targets into several \`[[instances]]\` blocks with labels such as \`region\` or \`product\`; the dashboards and rules filter on them. With many targets, raise the file descriptor limit of the Categraf process. The rules cover unreachable targets and rising packet loss.`,
    },
  },
  Net_Response: {
    related: [practice('port', '实践：端口与连通性探测', 'Walkthrough: port and connectivity probes')],
    zh: {
      title: '用夜莺做 TCP/UDP 端口探测',
      summary: '探测本机或远端的端口是否可连、响应是否符合预期，结果码 0 到 4 分别表示成功、超时、连接失败、读失败和内容不匹配。',
      intro: `net_response 插件对 \`targets\` 里的 \`host:port\` 做 TCP 连接或 UDP 收发探测，可选发送一段数据并用 \`expect\` 匹配响应。结果上报为 \`net_response_result_code\`：0 成功、1 超时、2 连接失败、3 读失败、4 响应内容不匹配，同时上报连接耗时。

它回答的是「这个端口此刻能不能从这里连上」，和进程存活、Ping 可达是三个不同的问题。规则覆盖端口不可连和探测耗时过长。`,
    },
    en: {
      title: 'TCP/UDP port probes with Nightingale',
      summary: 'Checks whether a local or remote port accepts connections and responds as expected; result codes 0 to 4 mean success, timeout, connection failure, read failure and content mismatch.',
      intro: `The net_response input opens a TCP connection or exchanges a UDP packet with each \`host:port\` in \`targets\`, optionally sending a payload and matching the reply against \`expect\`. The outcome is reported as \`net_response_result_code\`: 0 success, 1 timeout, 2 connection failed, 3 read failed, 4 response mismatch, along with the connect time.

It answers "can this port be reached from here right now", which is a different question from process liveness or ping reachability. The rules cover unreachable ports and probes taking too long.`,
    },
  },
  Dns_Query: {
    zh: {
      title: '用夜莺监控 DNS 解析质量',
      summary: '用本机或指定的 DNS 服务器查询一组域名，上报解析耗时、返回码和记录数，第一时间发现解析慢或解析失败。',
      intro: `dns_query 插件向指定的 DNS 服务器（可以是本机配置的，也可以是外部的公共 DNS）查询 \`domains\` 里的域名，支持 A、AAAA、CNAME、MX、TXT 等记录类型，上报查询耗时、rcode、返回的记录数和结果值。

通常不需要每台机器都开，挑一两台做探测点，把业务域名和关键第三方域名配进去，并用标签区分探测点和 DNS 服务器。规则覆盖解析失败、解析耗时过长和返回码异常。`,
    },
    en: {
      title: 'Monitor DNS resolution quality with Nightingale',
      summary: 'Resolves a list of domains against the local or a named DNS server and reports query time, return code and record count, so slow or failing resolution shows up immediately.',
      intro: `The dns_query input resolves the names in \`domains\` against the configured DNS servers (the host's own resolver or external public ones), supporting A, AAAA, CNAME, MX, TXT and other record types. It reports query time, rcode, the number of records returned and the result values.

You rarely need it on every host; pick one or two probe points, list your business domains and critical third-party domains, and label by probe point and DNS server. The rules cover failed resolution, slow queries and unexpected return codes.`,
    },
  },

  // ---------------------------------------------------------------- DevOps
  Gitlab: {
    zh: {
      title: '用夜莺监控 GitLab',
      summary: 'GitLab 软件包内置多个 exporter，分别抓主机、Rails/Sidekiq、Gitaly、Workhorse、PostgreSQL、Redis 和 NGINX 的指标，模板有五张仪表盘。',
      intro: `GitLab Linux Package 自带一整套 exporter：node_exporter（主机）、gitlab_exporter（Rails 与 Sidekiq）、Gitaly、Workhorse、postgres_exporter、redis_exporter 和 NGINX VTS。模板里的五张仪表盘（总览、机器性能、NGINX、PostgreSQL、Redis）各用其中一部分，要完整使用需要把这些端点都抓下来，而不是只抓一个 \`/metrics\`。

规则覆盖 Sidekiq 队列积压、Gitaly 与 Workhorse 错误率、数据库连接与 Redis 内存、HTTP 5xx 和主机资源。`,
      connect: `外部 Categraf 抓取时，在 \`/etc/gitlab/gitlab.rb\` 里让各 exporter 监听可达地址，并用防火墙只允许采集节点访问：

\`\`\`ruby
prometheus['enable'] = false
node_exporter['listen_address'] = '0.0.0.0:9100'
gitlab_workhorse['prometheus_listen_addr'] = '0.0.0.0:9229'
gitlab_exporter['listen_address'] = '0.0.0.0'
gitlab_exporter['listen_port'] = '9168'
redis_exporter['listen_address'] = '0.0.0.0:9121'
postgres_exporter['listen_address'] = '0.0.0.0:9187'
gitaly['configuration'] = { prometheus_listen_addr: '0.0.0.0:9236' }
\`\`\`

\`gitlab-ctl reconfigure\` 后，用 Categraf 的 \`prometheus\` 插件把这些端口逐个配进 \`urls\`，\`labels\` 里统一给 \`job = "gitlab"\`。如果保留了 GitLab 自带的 Prometheus，也可以直接把它[接成数据源](/docs/data/prometheus)。`,
    },
    en: {
      title: 'Monitor GitLab with Nightingale',
      summary: 'The GitLab package bundles several exporters for the host, Rails/Sidekiq, Gitaly, Workhorse, PostgreSQL, Redis and NGINX; the template ships five dashboards.',
      intro: `The GitLab Linux Package comes with a full set of exporters: node_exporter (host), gitlab_exporter (Rails and Sidekiq), Gitaly, Workhorse, postgres_exporter, redis_exporter and NGINX VTS. The five dashboards (overview, machine performance, NGINX, PostgreSQL, Redis) each use part of that set, so scrape all of these endpoints rather than a single \`/metrics\`.

The rules cover Sidekiq queue backlog, Gitaly and Workhorse error rates, database connections and Redis memory, HTTP 5xx and host resources.`,
      connect: `For an external Categraf, make the exporters listen on reachable addresses in \`/etc/gitlab/gitlab.rb\` and firewall them to the collector node:

\`\`\`ruby
prometheus['enable'] = false
node_exporter['listen_address'] = '0.0.0.0:9100'
gitlab_workhorse['prometheus_listen_addr'] = '0.0.0.0:9229'
gitlab_exporter['listen_address'] = '0.0.0.0'
gitlab_exporter['listen_port'] = '9168'
redis_exporter['listen_address'] = '0.0.0.0:9121'
postgres_exporter['listen_address'] = '0.0.0.0:9187'
gitaly['configuration'] = { prometheus_listen_addr: '0.0.0.0:9236' }
\`\`\`

After \`gitlab-ctl reconfigure\`, list each port in the \`urls\` of the Categraf \`prometheus\` input with \`job = "gitlab"\` in \`labels\`. If you keep GitLab's bundled Prometheus, [adding it as a data source](/docs/data/prometheus) works too.`,
    },
  },
};
