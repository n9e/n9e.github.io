/**
 * 告警规则库（/alert-rules/<slug>）收录哪些服务、规则从哪个集成里取、每页的介绍文案。
 *
 * 一期只收「指标名是社区标准」的服务：用 node_exporter、kube-state-metrics、mysqld_exporter
 * 这类标准采集器的人，不装夜莺也能直接复制规则。只适用于 Categraf 指标名的服务（SNMP 等）先不收。
 * 每页的介绍是手写的，没有介绍的服务不要加进来：只剩规则表格的页面不值得收录。
 *
 * from：[集成 ident, 过滤函数]，过滤函数拿到一条规则，返回 true 才收进本页。
 * 一个集成的规则可以拆到多页（Kubernetes 模板里混着 Prometheus 自监控和 node_exporter 规则）。
 */

const isPrometheusSelf = (a) => /^(Prometheus|ConfigReloader)/.test(a.name_en ?? '');

export const SERVICES = [
  {
    slug: 'kubernetes',
    name: 'Kubernetes',
    from: [['Kubernetes', (a) => a.source === 'default' && !isPrometheusSelf(a)]],
    exporter: 'kube-state-metrics, cAdvisor (kubelet), apiserver',
    upstream: 'kubernetes-mixin',
    intro: {
      en: 'Alert rules for Kubernetes clusters built on the metrics every cluster already exposes: kube-state-metrics for object state, cAdvisor through the kubelet for container resources, and the apiserver, kubelet, scheduler and controller-manager endpoints for the control plane. They cover crash-looping and unready pods, stuck rollouts, replica mismatches, failed jobs, resource overcommit, quota pressure, certificate expiry and control-plane outages. Most rules keep the alert names used by kubernetes-mixin and kube-prometheus (KubePodCrashLooping, KubeNodeNotReady, KubeAPIErrorBudgetBurn…), so they match the names you already see in Alertmanager.',
      zh: '基于每个集群都已经暴露的指标做的 Kubernetes 告警规则：kube-state-metrics 提供对象状态，kubelet 内置的 cAdvisor 提供容器资源用量，apiserver、kubelet、scheduler、controller-manager 的指标端点覆盖控制面。覆盖 Pod 反复重启与未就绪、发布卡住、副本数不一致、Job 失败、资源超卖、配额吃紧、证书过期和控制面宕机。大部分规则沿用 kubernetes-mixin / kube-prometheus 的告警名（KubePodCrashLooping、KubeNodeNotReady、KubeAPIErrorBudgetBurn 等），和你在 Alertmanager 里见到的名字一致。',
    },
  },
  {
    slug: 'prometheus',
    name: 'Prometheus',
    from: [['Kubernetes', (a) => isPrometheusSelf(a)]],
    exporter: "Prometheus's own /metrics, Prometheus Operator",
    upstream: 'kube-prometheus',
    intro: {
      en: "Rules that watch Prometheus itself: a bad configuration reload, failing or missed rule evaluations, a notification queue backing up, no connection to Alertmanager, remote write falling behind, TSDB compactions or reloads failing, scrape and label limits being hit, and the Prometheus Operator failing to reconcile. When these fire, every other alert you rely on may be silently missing, so they are worth routing to the people who own the monitoring stack rather than to application teams.",
      zh: '盯 Prometheus 自身的规则：配置重载失败、规则评估失败或漏评、通知队列积压、连不上 Alertmanager、Remote Write 落后、TSDB 压缩或重载失败、触及采集与标签上限，以及 Prometheus Operator 调和失败。这类告警一响，你依赖的其它告警可能已经悄悄失效，所以应该发给维护监控系统的人，而不是业务团队。',
    },
  },
  {
    slug: 'linux',
    name: 'Linux',
    from: [
      ['Kubernetes', (a) => a.source === 'exporter'],
      ['Linux', () => true],
    ],
    exporter: 'node_exporter, Categraf, Telegraf',
    upstream: 'awesome-prometheus-alerts',
    intro: {
      en: 'Host-level alert rules for Linux servers and Kubernetes nodes: memory exhaustion and pressure, disks and inodes running out (including "will fill up within 24 hours" predictions), disk latency, network errors, packet loss and saturation, CPU load and steal, OOM kills, conntrack and file-handle exhaustion, clock skew, crashed system services, missing processes, and failed PING, port and HTTP probes. The node_exporter group uses standard `node_*` metric names; the Categraf and Telegraf groups cover the same ground for hosts collected by those agents.',
      zh: 'Linux 服务器与 Kubernetes 节点的主机级告警规则：内存耗尽与内存压力、磁盘和 inode 将满（含「24 小时内将写满」的预测）、磁盘延迟、网络错误、丢包与带宽打满、CPU 负载与被宿主机抢占、OOM Kill、conntrack 表与文件句柄耗尽、时钟偏移、系统服务崩溃、进程消失，以及 PING、端口、HTTP 探测失败。node_exporter 一组用的是标准 `node_*` 指标名；Categraf 和 Telegraf 两组针对用这两种 agent 采集的主机，覆盖同样的问题。',
    },
  },
  {
    slug: 'mysql',
    name: 'MySQL',
    from: [['MySQL', () => true]],
    exporter: 'mysqld_exporter, Categraf',
    intro: {
      en: 'MySQL alert rules for the failures that page people in practice: an instance that is down or has just restarted, slow queries piling up, connections approaching max_connections, too many running threads, InnoDB log waits, open files nearing the limit, and replication problems (IO or SQL thread stopped, replica lag). The exporter group uses mysqld_exporter metric names (`mysql_global_status_*`, `mysql_slave_status_*`); each rule comes with the first commands to run, such as SHOW FULL PROCESSLIST and pt-query-digest, when it fires.',
      zh: 'MySQL 告警规则，覆盖实际最常把人叫起来的几类问题：实例宕机或刚重启、慢查询堆积、连接数逼近 max_connections、运行线程过多、InnoDB 日志等待、打开文件数逼近上限，以及复制异常（IO / SQL 线程停止、主从延迟）。exporter 一组使用 mysqld_exporter 的指标名（`mysql_global_status_*`、`mysql_slave_status_*`）；每条规则都附了告警后第一时间该执行的命令，比如 SHOW FULL PROCESSLIST、pt-query-digest。',
    },
  },
  {
    slug: 'redis',
    name: 'Redis',
    from: [['Redis', () => true]],
    exporter: 'redis_exporter, Categraf',
    intro: {
      en: 'Redis alert rules for high memory usage, a rising eviction rate, rejected connections, too many client connections, a falling cache hit ratio, high command or ping latency, and an instance that has just restarted. The exporter group uses oliver006/redis_exporter metric names; the Categraf group covers the same checks for instances collected by Categraf.',
      zh: 'Redis 告警规则：内存使用率过高、key 驱逐速率升高、连接被拒、客户端连接数过多、缓存命中率下降、命令或 PING 延迟过高、实例刚刚重启。exporter 一组使用 oliver006/redis_exporter 的指标名；Categraf 一组为用 Categraf 采集的实例提供同样的检查。',
    },
  },
  {
    slug: 'elasticsearch',
    name: 'Elasticsearch',
    from: [['Elasticsearch', () => true]],
    exporter: 'elasticsearch_exporter, Categraf',
    intro: {
      en: 'Elasticsearch alert rules for cluster health turning yellow or red, JVM heap usage climbing, disk space running low or out, unassigned, initializing and relocating shards, pending cluster tasks, and an index that has stopped receiving new documents. The exporter group uses prometheus-community/elasticsearch_exporter metric names; the Categraf group runs the same checks on Categraf-collected metrics.',
      zh: 'Elasticsearch 告警规则：集群健康变黄或变红、JVM 堆内存用量过高、磁盘空间不足或耗尽、未分配 / 初始化中 / 迁移中的分片、积压的集群任务，以及索引长时间没有新文档写入。exporter 一组使用 prometheus-community/elasticsearch_exporter 的指标名；Categraf 一组对 Categraf 采集的指标做同样的检查。',
    },
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    from: [['MongoDB', () => true]],
    exporter: 'mongodb_exporter',
    intro: {
      en: 'MongoDB alert rules for an instance that has crashed or just restarted, connections approaching the limit, high average operation latency, assertion errors, cursor timeouts, page faults and replica-set lag. They use mongodb_exporter metric names.',
      zh: 'MongoDB 告警规则：实例宕机或刚重启、连接数逼近上限、平均操作延迟过高、Assert 错误、游标超时、缺页中断、副本集主从延迟。使用 mongodb_exporter 的指标名。',
    },
  },
  {
    slug: 'windows',
    name: 'Windows',
    from: [['Windows', () => true]],
    exporter: 'windows_exporter, Categraf',
    intro: {
      en: 'Windows Server alert rules for high CPU and memory usage, disks that are full or predicted to fill within 4 hours, busy disk IO, inbound and outbound packet loss, an unexpected reboot, and a host whose collector has gone silent. The exporter group uses prometheus-community/windows_exporter metric names (`windows_*`); the Categraf group covers hosts collected by Categraf on Windows.',
      zh: 'Windows Server 告警规则：CPU 与内存使用率过高、磁盘已满或预计 4 小时内写满、磁盘 IO 繁忙、出入方向丢包、近期发生重启，以及采集端失联。exporter 一组使用 prometheus-community/windows_exporter 的指标名（`windows_*`）；Categraf 一组针对在 Windows 上用 Categraf 采集的主机。',
    },
  },
];

/** 规则表达式的出处。署名是许可证要求，不要删 */
export const UPSTREAMS = {
  'kubernetes-mixin': {
    url: 'https://github.com/kubernetes-monitoring/kubernetes-mixin',
    license: 'Apache-2.0',
  },
  'kube-prometheus': {
    url: 'https://github.com/prometheus-operator/kube-prometheus',
    license: 'Apache-2.0',
  },
  'awesome-prometheus-alerts': {
    url: 'https://github.com/samber/awesome-prometheus-alerts',
    license: 'CC BY 4.0',
  },
};

/** 规则来自哪个集成 → 该集成的独立页，用于互链 */
export const integrationSlug = (ident) => ident.toLowerCase().replace(/_+/g, '-');
