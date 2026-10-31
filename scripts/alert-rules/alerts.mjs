/**
 * 单条告警页（/alert-rules/<服务>/<告警名小写>）的手写内容。
 *
 * 只给标准告警名（kubernetes-mixin / kube-prometheus 里的名字）写，因为站外有人按这些名字搜。
 * 页面上的 PromQL、级别、持续时间、处置步骤来自集成模板；这里补的是服务页上没有的部分：
 *   meaning  告警是什么意思、响了有什么影响
 *   causes   常见原因
 *   notes    规则本身容易误解的地方（名字和表达式不一致、依赖 recording rule 等），可省略
 *   related  相关告警名；有单页的链到单页，没有的链到服务页
 * 没写进这里的告警不出单页，仍在服务页上完整显示。写之前对着表达式核对，不确定的说法不要写。
 */

export const ALERTS = {
  // ---------------- Kubernetes ----------------
  KubePodCrashLooping: {
    service: 'kubernetes',
    related: ['KubeContainerWaiting', 'KubePodNotReady', 'KubeDeploymentReplicasMismatch'],
    en: {
      meaning:
        'A container keeps exiting and the kubelet is restarting it with a growing back-off delay (from 10 seconds up to 5 minutes), so its waiting reason reads `CrashLoopBackOff`. The rule fires when kube-state-metrics has reported that reason at any point in the last 5 minutes, for 15 minutes in a row. While the loop lasts the container serves nothing; if every replica is looping, the workload is down.',
      causes: [
        'The application exits on startup: a bad configuration value, a missing environment variable, or a failed migration.',
        'A dependency is unreachable (database, message queue, another service) and the process exits instead of retrying.',
        'The container is killed for exceeding its memory limit. `lastState.terminated.reason` shows `OOMKilled` and the exit code is 137.',
        'A liveness probe that is too strict, or that starts before the application is ready, keeps killing a healthy container.',
        'The image runs the wrong command or entrypoint, or is built for a different CPU architecture.',
      ],
      notes: [
        'The quickest way to see why the last run ended is `kubectl get pod <pod> -n <ns> -o jsonpath=\'{.status.containerStatuses[*].lastState.terminated}\'`, which prints the reason, exit code and timestamps.',
      ],
    },
    zh: {
      meaning:
        '容器反复退出，kubelet 以逐渐拉长的退避间隔（从 10 秒到最长 5 分钟）重启它，等待原因显示为 `CrashLoopBackOff`。规则的条件是：最近 5 分钟内 kube-state-metrics 报告过这个原因，并且持续 15 分钟。循环期间这个容器不提供服务；如果所有副本都在循环，这个负载就等于挂了。',
      causes: [
        '应用启动即退出：配置值写错、缺环境变量、数据库迁移失败。',
        '依赖连不上（数据库、消息队列、其它服务），进程直接退出而不是重试。',
        '容器超出内存限制被杀，`lastState.terminated.reason` 显示 `OOMKilled`，退出码 137。',
        '存活探针（liveness probe）太严，或者在应用就绪前就开始检测，把正常的容器反复杀掉。',
        '镜像的启动命令或 entrypoint 写错，或者镜像的 CPU 架构不对。',
      ],
      notes: [
        '想最快看到上一次为什么退出，执行 `kubectl get pod <pod> -n <ns> -o jsonpath=\'{.status.containerStatuses[*].lastState.terminated}\'`，会打印退出原因、退出码和时间。',
      ],
    },
  },

  KubePodNotReady: {
    service: 'kubernetes',
    related: ['KubeContainerWaiting', 'KubePodCrashLooping', 'KubeNodeNotReady', 'KubeQuotaAlmostFull'],
    en: {
      meaning:
        'A Pod that is not owned by a Job has been in the `Pending`, `Unknown` or `Failed` phase for 15 minutes. A Pending Pod has not started all its containers (often it has not even been scheduled), an Unknown Pod usually sits on a node that has stopped reporting, and a Failed Pod has terminated for good. Either way the Pod is not serving, and the workload is running with fewer replicas than it asked for.',
      causes: [
        'No node can take the Pod: not enough CPU or memory to satisfy its requests, or node selectors, affinity rules and taints rule out every node.',
        'A PersistentVolumeClaim it mounts is not bound, or the volume is in a different zone from every eligible node.',
        'The image cannot be pulled (wrong name or tag, missing `imagePullSecrets`, registry rate limits).',
        'The node it runs on lost contact with the control plane, which puts the Pod into `Unknown`.',
        'The namespace hit its ResourceQuota, so the Pod could not be admitted.',
      ],
      notes: [
        'Despite its name, the rule looks at the Pod phase, not the `Ready` condition. A Pod that is `Running` but failing its readiness probe does not trigger it; KubeDeploymentReplicasMismatch or KubeStatefulSetReplicasMismatch usually catch that case.',
        'Pods owned by Jobs are excluded, so finished or failed batch work does not page anyone through this rule. Use KubeJobFailed for those.',
      ],
    },
    zh: {
      meaning:
        '一个不属于 Job 的 Pod 已经处于 `Pending`、`Unknown` 或 `Failed` 阶段 15 分钟。Pending 表示容器还没全部启动（常常是还没调度上）；Unknown 通常是所在节点失联；Failed 表示 Pod 已经终止、不会再起来。无论哪种，这个 Pod 都没在提供服务，负载的实际副本数低于期望值。',
      causes: [
        '没有节点能接收这个 Pod：CPU 或内存不够满足 requests，或者节点选择器、亲和性规则、污点把所有节点都排除了。',
        '挂载的 PVC 没有绑定，或者卷所在的可用区与所有可调度节点都不一致。',
        '镜像拉不下来（名字或标签写错、缺 `imagePullSecrets`、镜像仓库限流）。',
        'Pod 所在节点与控制面失联，Pod 被标成 `Unknown`。',
        '命名空间的 ResourceQuota 用满，Pod 无法创建。',
      ],
      notes: [
        '名字叫 NotReady，但规则看的是 Pod 阶段，不是 `Ready` 状态。`Running` 但就绪探针失败的 Pod 不会触发它，这种情况通常由 KubeDeploymentReplicasMismatch 或 KubeStatefulSetReplicasMismatch 发现。',
        '属于 Job 的 Pod 被排除在外，批处理任务结束或失败不会通过这条规则告警，那种情况看 KubeJobFailed。',
      ],
    },
  },

  KubeContainerWaiting: {
    service: 'kubernetes',
    related: ['KubePodCrashLooping', 'KubePodNotReady'],
    en: {
      meaning:
        'A container has been in the `Waiting` state for more than an hour: it is neither running nor terminated. The waiting reason tells you which step it is stuck on, from pulling the image to mounting volumes to the back-off between crash restarts.',
      causes: [
        '`ImagePullBackOff` or `ErrImagePull`: wrong image name or tag, missing pull credentials, or the registry is unreachable or rate limiting.',
        '`CreateContainerConfigError`: a ConfigMap, Secret or key that the container references does not exist.',
        '`ContainerCreating` for a long time: a volume cannot be attached or mounted, or the network plugin cannot set up the Pod network.',
        '`CrashLoopBackOff`: the container keeps crashing; KubePodCrashLooping fires as well.',
        '`PodInitializing`: an init container has not finished.',
      ],
      notes: [
        'The rule sums `kube_pod_container_status_waiting_reason` without filtering on the reason, so every waiting reason counts. Group the alert by the `reason` label, or check it with `kubectl get pod <pod> -n <ns> -o jsonpath=\'{.status.containerStatuses[*].state.waiting}\'`.',
      ],
    },
    zh: {
      meaning:
        '一个容器处于 `Waiting` 状态已经超过 1 小时：既没运行，也没终止。等待原因说明它卡在哪一步，可能是拉镜像、挂卷，也可能是崩溃重启之间的退避等待。',
      causes: [
        '`ImagePullBackOff` 或 `ErrImagePull`：镜像名或标签写错、缺拉取凭据、镜像仓库不可达或限流。',
        '`CreateContainerConfigError`：容器引用的 ConfigMap、Secret 或其中的 key 不存在。',
        '长时间 `ContainerCreating`：卷挂载失败，或者网络插件没能给 Pod 配好网络。',
        '`CrashLoopBackOff`：容器反复崩溃，KubePodCrashLooping 也会同时告警。',
        '`PodInitializing`：init 容器还没执行完。',
      ],
      notes: [
        '规则对 `kube_pod_container_status_waiting_reason` 求和时没有按原因过滤，所有等待原因都算。可以按 `reason` 标签给告警分组，或者用 `kubectl get pod <pod> -n <ns> -o jsonpath=\'{.status.containerStatuses[*].state.waiting}\'` 查看。',
      ],
    },
  },

  KubeNodeNotReady: {
    service: 'kubernetes',
    related: ['KubeletDown', 'KubePodNotReady', 'KubeletTooManyPods'],
    en: {
      meaning:
        "A node's `Ready` condition has not been `True` for 15 minutes; it is either `False` (the kubelet reports a problem) or `Unknown` (the kubelet has stopped reporting). New Pods are not scheduled there, and Pods already on it are evicted once the not-ready or unreachable taint outlasts their toleration, which is 300 seconds by default.",
      causes: [
        'The kubelet or the container runtime (containerd, CRI-O) has stopped or keeps restarting.',
        'The node cannot reach the API server: network partition, firewall change, or a broken route.',
        'The node is out of resources: memory, disk, or process IDs, so the kubelet itself cannot work.',
        'The kubelet client certificate expired and the node can no longer authenticate.',
        'The machine was shut down, rebooted or reclaimed (for example a spot instance) without being drained.',
      ],
      notes: [
        'The expression `status="true" == 0` covers both `False` and `Unknown`. `kubectl describe node <node>` shows which one and the last heartbeat time, which separates "the kubelet says something is wrong" from "the kubelet is gone".',
      ],
    },
    zh: {
      meaning:
        '节点的 `Ready` 状态已经 15 分钟不是 `True`：要么是 `False`（kubelet 报告了问题），要么是 `Unknown`（kubelet 不再上报）。新的 Pod 不会再调度上来；节点上已有的 Pod，在 not-ready 或 unreachable 污点持续时间超过它的容忍时间（默认 300 秒）后会被驱逐。',
      causes: [
        'kubelet 或容器运行时（containerd、CRI-O）停止或反复重启。',
        '节点连不上 API Server：网络分区、防火墙变更、路由故障。',
        '节点资源耗尽：内存、磁盘或进程号用光，kubelet 自己都跑不动。',
        'kubelet 客户端证书过期，节点无法再通过认证。',
        '机器被关机、重启或回收（比如竞价实例），事先没有 drain。',
      ],
      notes: [
        '表达式 `status="true" == 0` 同时覆盖 `False` 和 `Unknown` 两种情况。`kubectl describe node <node>` 能看到是哪一种以及最后一次心跳时间，据此区分「kubelet 报告有问题」和「kubelet 已经失联」。',
      ],
    },
  },

  KubeletDown: {
    service: 'kubernetes',
    related: ['KubeNodeNotReady'],
    en: {
      meaning:
        'Prometheus has no kubelet target reporting `up == 1`. Because the rule wraps the whole selector in `absent()`, it only fires when every kubelet is missing or failing to scrape. One broken node does not trigger it. When it fires you lose kubelet and cAdvisor metrics (container CPU and memory, volume usage) for the whole cluster, and any rule built on them goes quiet.',
      causes: [
        'The scrape configuration changed: the ServiceMonitor for the kubelet was deleted, or its selector, port name or path no longer matches.',
        'Prometheus cannot authenticate to the kubelet on port 10250: an expired or missing bearer token, a TLS verification error, or RBAC that no longer grants `nodes/metrics`.',
        'A network policy or firewall now blocks Prometheus from reaching the nodes.',
        'Less often, the kubelets really are down across the cluster, for example after a bad configuration rollout.',
      ],
      notes: [
        'A single dead kubelet shows up as KubeNodeNotReady, not as this alert. Treat KubeletDown first as a monitoring problem: open the Prometheus `/targets` page and read the scrape error for the kubelet job.',
      ],
    },
    zh: {
      meaning:
        'Prometheus 里没有任何一个 kubelet 目标处于 `up == 1`。规则把整个选择器包在 `absent()` 里，所以只有所有 kubelet 都消失或都抓取失败时才会触发，单个节点坏了不会触发。它一响，整个集群的 kubelet 和 cAdvisor 指标（容器 CPU、内存、卷用量）都断了，依赖这些指标的规则也会跟着失声。',
      causes: [
        '采集配置变了：kubelet 的 ServiceMonitor 被删，或者它的选择器、端口名、路径对不上了。',
        'Prometheus 在 10250 端口上认证不了 kubelet：bearer token 过期或缺失、TLS 校验失败，或者 RBAC 不再授予 `nodes/metrics` 权限。',
        '网络策略或防火墙挡住了 Prometheus 到节点的访问。',
        '少见情况：集群里的 kubelet 真的全挂了，比如推了一份错误配置。',
      ],
      notes: [
        '单个 kubelet 挂掉表现为 KubeNodeNotReady，而不是这条告警。KubeletDown 响了，先按监控链路的问题处理：打开 Prometheus 的 `/targets` 页面，看 kubelet 任务的抓取报错。',
      ],
    },
  },

  KubePersistentVolumeFillingUp: {
    service: 'kubernetes',
    related: ['KubePersistentVolumeInodesFillingUp', 'KubePersistentVolumeErrors', 'KubeStatefulSetReplicasMismatch'],
    en: {
      meaning:
        'A PersistentVolume has less than 3% of its space left, as reported by the kubelet on the node that mounts it. Databases, queues and other stateful services usually stop accepting writes or crash once the volume is full, so this one is critical.',
      causes: [
        'Data has simply grown: tables, indexes, topic logs or object counts outpaced the size chosen at creation.',
        'Retention or cleanup stopped working: log rotation, compaction, TTL jobs or backups that delete old copies.',
        'Temporary files, dumps or core files written to the data volume and never removed.',
        'The volume was sized for a test environment and reused in production.',
      ],
      notes: [
        'Volumes mounted read-only by many Pods (`ReadOnlyMany`) are skipped. You can also silence one PVC by labelling it `excluded_from_alerts=true`, but kube-state-metrics only exports PVC labels that are listed in its `--metric-labels-allowlist` flag, so add that label there first.',
        'The metrics come from the kubelet (`kubelet_volume_stats_*`). Volumes whose driver does not report usage statistics never produce them, so the rule stays silent for those volumes.',
      ],
    },
    zh: {
      meaning:
        '一个 PersistentVolume 剩余空间不足 3%，数据来自挂载它的节点上的 kubelet。数据库、队列等有状态服务在卷写满后通常会拒绝写入或直接崩溃，所以这条是紧急级别。',
      causes: [
        '数据正常增长：表、索引、topic 日志或对象数量超过了创建时预估的大小。',
        '保留或清理机制失效：日志轮转、compaction、TTL 任务、清理旧备份的任务没在跑。',
        '临时文件、导出文件或 core 文件写进了数据卷，没人清理。',
        '卷按测试环境的大小创建，后来直接用到了生产。',
      ],
      notes: [
        '被多个 Pod 只读挂载（`ReadOnlyMany`）的卷不告警。也可以给某个 PVC 打上 `excluded_from_alerts=true` 标签来屏蔽，但 kube-state-metrics 只导出 `--metric-labels-allowlist` 参数里列出的 PVC 标签，要先把这个标签加进去。',
        '指标来自 kubelet（`kubelet_volume_stats_*`）。存储驱动不上报用量统计的卷不会有这些指标，规则对它们不起作用。',
      ],
    },
  },

  KubeDeploymentReplicasMismatch: {
    service: 'kubernetes',
    related: ['KubeDeploymentRolloutStuck', 'KubePodNotReady', 'KubePodCrashLooping', 'KubeHpaMaxedOut'],
    en: {
      meaning:
        'A Deployment has had fewer available replicas than it asks for, for 15 minutes, while no rollout is in progress: the number of updated replicas has not changed in the last 10 minutes. Some replicas are missing or unready, so the service runs below its planned capacity.',
      causes: [
        'New Pods cannot be scheduled: not enough CPU or memory, or affinity rules and taints leave no eligible node.',
        'Pods are crash looping or failing their readiness probe, so they never count as available.',
        'Images cannot be pulled on some nodes.',
        'The namespace quota is exhausted, so the ReplicaSet cannot create the missing Pods (look for `exceeded quota` events on the ReplicaSet).',
        'A node failure removed replicas and the replacements are stuck for one of the reasons above.',
      ],
      notes: [
        'The `changes(...[10m]) == 0` clause keeps the rule quiet during a normal rolling update. A rollout that stops making progress is reported by KubeDeploymentRolloutStuck instead.',
      ],
    },
    zh: {
      meaning:
        '一个 Deployment 的可用副本数已经 15 分钟低于期望值，并且当前没有在发布（最近 10 分钟内已更新副本数没有变化）。有副本缺失或未就绪，服务在低于计划容量的状态下运行。',
      causes: [
        '新 Pod 调度不上去：CPU 或内存不够，或者亲和性规则、污点让所有节点都不满足条件。',
        'Pod 在崩溃循环或就绪探针一直失败，始终不计入可用副本。',
        '部分节点上拉不下镜像。',
        '命名空间配额用满，ReplicaSet 创建不了缺的 Pod（看 ReplicaSet 上的 `exceeded quota` 事件）。',
        '节点故障带走了副本，替补的 Pod 又因为上面某个原因卡住。',
      ],
      notes: [
        '`changes(...[10m]) == 0` 这一段让规则在正常滚动发布期间保持安静。发布本身卡住不动时，告警的是 KubeDeploymentRolloutStuck。',
      ],
    },
  },

  KubeDeploymentRolloutStuck: {
    service: 'kubernetes',
    related: ['KubeDeploymentReplicasMismatch', 'KubePodCrashLooping', 'KubeContainerWaiting'],
    en: {
      meaning:
        "A Deployment's `Progressing` condition is `False`. Kubernetes sets this, with reason `ProgressDeadlineExceeded`, when a rollout has not made progress within `progressDeadlineSeconds` (600 seconds by default). Kubernetes does not roll back on its own: old and new ReplicaSets stay as they are, so you may be running a mix of versions until someone acts.",
      causes: [
        'The new version crashes or fails its readiness probe, so new Pods never become available.',
        'The new Pods cannot be scheduled, or their image cannot be pulled.',
        'The new version needs more CPU or memory than the namespace quota or the nodes have left.',
        '`maxUnavailable` is 0 and the cluster has no room for the extra surge Pod.',
      ],
      notes: [
        '`kubectl rollout status deploy/<name> -n <ns>` exits with an error once the deadline is exceeded, so the same signal can fail a CI/CD pipeline before this alert fires.',
      ],
    },
    zh: {
      meaning:
        'Deployment 的 `Progressing` 状态为 `False`。发布在 `progressDeadlineSeconds`（默认 600 秒）内没有进展时，Kubernetes 会把它置为 False，原因是 `ProgressDeadlineExceeded`。Kubernetes 不会自动回滚：新旧 ReplicaSet 保持原样，在有人处理之前，线上可能是新旧版本混跑。',
      causes: [
        '新版本崩溃或就绪探针失败，新 Pod 一直不可用。',
        '新 Pod 调度不上去，或者镜像拉不下来。',
        '新版本需要的 CPU 或内存超过了命名空间配额或节点剩余容量。',
        '`maxUnavailable` 为 0，而集群没有空间放下额外的 surge Pod。',
      ],
      notes: [
        '超过期限后 `kubectl rollout status deploy/<name> -n <ns>` 会报错退出，CI/CD 流水线可以靠它在这条告警之前就失败。',
      ],
    },
  },

  KubeStatefulSetReplicasMismatch: {
    service: 'kubernetes',
    related: ['KubePodNotReady', 'KubePersistentVolumeFillingUp', 'KubePersistentVolumeErrors', 'KubeDeploymentReplicasMismatch'],
    en: {
      meaning:
        'A StatefulSet has had a different number of ready replicas than it runs, for 15 minutes, with no update in progress. Stateful services are often quorum-based (etcd, ZooKeeper, Kafka, databases), so one missing replica can mean reduced redundancy, and two can mean an outage.',
      causes: [
        "A Pod's PersistentVolumeClaim cannot bind or attach, for example because the volume is in a different zone from the node (`volume node affinity conflict`).",
        "A replica is crash looping or failing its readiness probe, often because its data on disk is corrupted or its peers won't let it rejoin.",
        'The Pod cannot be scheduled: no node fits its requests, anti-affinity rules, or zone constraints.',
        'With the default `OrderedReady` pod management policy, one stuck Pod blocks every Pod with a higher ordinal from being created.',
      ],
      notes: [
        'Check Pods by ordinal (`<name>-0`, `<name>-1`, …). The lowest ordinal that is not ready is usually the one to fix; the rest are waiting behind it.',
      ],
    },
    zh: {
      meaning:
        '一个 StatefulSet 的就绪副本数已经 15 分钟与实际副本数不一致，并且当前没有在更新。有状态服务往往依赖多数派（etcd、ZooKeeper、Kafka、数据库），少一个副本可能意味着冗余下降，少两个就可能直接不可用。',
      causes: [
        'Pod 的 PVC 绑定或挂载失败，比如卷和节点不在同一个可用区（`volume node affinity conflict`）。',
        '某个副本在崩溃循环或就绪探针失败，常见原因是磁盘上的数据损坏，或者其它成员不让它重新加入。',
        'Pod 调度不上去：没有节点满足它的 requests、反亲和性规则或可用区约束。',
        '默认的 `OrderedReady` Pod 管理策略下，一个 Pod 卡住，序号比它大的 Pod 都不会被创建。',
      ],
      notes: [
        '按序号检查 Pod（`<name>-0`、`<name>-1`……）。序号最小的那个未就绪 Pod 通常就是要修的，后面的都在排队等它。',
      ],
    },
  },

  KubeJobFailed: {
    service: 'kubernetes',
    related: ['KubeJobNotCompleted', 'KubePodCrashLooping'],
    en: {
      meaning:
        'A Job has been marked `Failed` (`kube_job_failed > 0`): it used up its `backoffLimit` (6 retries by default) or ran past `activeDeadlineSeconds`, and the batch work it was meant to do (a backup, a report, a data sync) did not happen.',
      causes: [
        'The task itself errors out: bad input data, a failed query, a dependency that is down.',
        'Pods are killed for exceeding their memory limit, or evicted from a node under pressure.',
        'The Job ran longer than `activeDeadlineSeconds`.',
        'The container image or command changed and no longer works with the Job arguments.',
      ],
      notes: [
        'The alert keeps firing for as long as the failed Job object exists, even after a later run succeeds. Delete the Job once you have looked at it. For CronJobs, `failedJobsHistoryLimit` (1 by default) controls how many failed Jobs are kept.',
      ],
    },
    zh: {
      meaning:
        '一个 Job 被标记为 `Failed`（`kube_job_failed > 0`）：它用完了 `backoffLimit`（默认重试 6 次），或者超过了 `activeDeadlineSeconds`，原本要做的批处理工作（备份、报表、数据同步）没有完成。',
      causes: [
        '任务本身出错：输入数据有问题、查询失败、依赖服务不可用。',
        'Pod 超出内存限制被杀，或者在资源紧张的节点上被驱逐。',
        'Job 运行时间超过 `activeDeadlineSeconds`。',
        '容器镜像或命令改了，和 Job 的参数对不上了。',
      ],
      notes: [
        '只要失败的 Job 对象还在，这条告警就会一直响，哪怕后来的执行已经成功。排查完把这个 Job 删掉。CronJob 保留多少个失败 Job 由 `failedJobsHistoryLimit` 控制（默认 1）。',
      ],
    },
  },

  KubeHpaMaxedOut: {
    service: 'kubernetes',
    related: ['KubeHpaReplicasMismatch', 'KubeCPUOvercommit', 'KubeMemoryOvercommit', 'KubeDeploymentReplicasMismatch'],
    en: {
      meaning:
        'A HorizontalPodAutoscaler has been running at `maxReplicas` for 15 minutes. It cannot add more replicas, so if load keeps rising, each replica takes more of it and latency or error rates follow.',
      causes: [
        'Real growth in traffic or work that has outgrown the configured maximum.',
        '`maxReplicas` was set low on purpose (for cost or a downstream limit) and is now the bottleneck.',
        'The target is too low for the metric. For CPU, utilization is measured against requests, so a container with small requests looks busy all the time.',
        'The application slowed down (a slow dependency, a regression), so each replica handles less and the HPA keeps scaling out.',
      ],
      notes: [
        'Raising `maxReplicas` only helps if the cluster has room for the extra Pods. Check KubeCPUOvercommit and KubeMemoryOvercommit, or the cluster autoscaler, before you raise it.',
      ],
    },
    zh: {
      meaning:
        '一个 HorizontalPodAutoscaler 已经在 `maxReplicas` 上运行了 15 分钟。它不能再加副本，如果负载继续上涨，压力会摊到每个副本身上，延迟和错误率随之上升。',
      causes: [
        '流量或任务量确实增长，超过了配置的上限。',
        '`maxReplicas` 是有意设低的（出于成本或下游承载能力），现在成了瓶颈。',
        '目标值相对指标设得太低。CPU 利用率是按 requests 计算的，requests 设得很小的容器会一直显得很忙。',
        '应用变慢了（依赖变慢、版本回归），每个副本处理得更少，HPA 只能不停扩容。',
      ],
      notes: [
        '只有集群还放得下更多 Pod，调大 `maxReplicas` 才有用。调之前先看 KubeCPUOvercommit、KubeMemoryOvercommit，或者集群自动扩缩容的状态。',
      ],
    },
  },

  KubeCPUOvercommit: {
    service: 'kubernetes',
    related: ['KubeMemoryOvercommit', 'KubeCPUQuotaOvercommit', 'KubeHpaMaxedOut'],
    en: {
      meaning:
        'The CPU requested by all Pods in the cluster is more than the cluster could provide if its largest node went away. In other words, the cluster cannot survive losing one node: the Pods from that node would have nowhere to be rescheduled. It is a capacity warning, not an outage, and it is about requests, not actual CPU usage.',
      causes: [
        'Workloads grew (more replicas, HPAs scaling out) without the node pool growing.',
        'Nodes were removed or scaled down, by hand or by an autoscaler.',
        'Requests are set far above what containers actually use, so the cluster looks fuller than it is.',
        'One node is much larger than the others, so the "lose the largest node" reserve is big.',
      ],
      notes: [
        'The expression uses the `namespace_cpu:kube_pod_container_resource_requests:sum` recording rule from kubernetes-mixin. Without that recording rule loaded, the rule never fires.',
      ],
    },
    zh: {
      meaning:
        '集群里所有 Pod 申请的 CPU，已经超过「去掉最大那台节点后」集群能提供的量。换句话说，集群扛不住任何一台节点宕机：那台节点上的 Pod 将无处可调度。这是容量预警，不是故障；它看的是 requests，不是实际 CPU 用量。',
      causes: [
        '负载增长（副本数增加、HPA 扩容），节点池却没有跟着扩。',
        '节点被手动或被自动扩缩容缩掉了。',
        'requests 设得远高于容器实际用量，集群看起来比实际更满。',
        '有一台节点比其它节点大很多，「去掉最大节点」预留的量就很大。',
      ],
      notes: [
        '表达式用到 kubernetes-mixin 里的 recording rule `namespace_cpu:kube_pod_container_resource_requests:sum`。没加载这条 recording rule，规则永远不会触发。',
      ],
    },
  },

  KubeMemoryOvercommit: {
    service: 'kubernetes',
    related: ['KubeCPUOvercommit', 'KubeMemoryQuotaOvercommit', 'KubeHpaMaxedOut'],
    en: {
      meaning:
        'The memory requested by all Pods in the cluster is more than the cluster could provide if its largest node went away, so a single node failure would leave Pods unschedulable. Like its CPU twin it is about requests, not usage, but memory is less forgiving: Pods that do not fit stay Pending instead of running slower.',
      causes: [
        'Workloads grew without the node pool growing.',
        'Nodes were removed or scaled down.',
        'Memory requests are set well above actual usage.',
        'One node is much larger than the rest, so the reserve for losing it is large.',
      ],
      notes: [
        'The expression uses the `namespace_memory:kube_pod_container_resource_requests:sum` recording rule from kubernetes-mixin. Without it, the rule never fires.',
      ],
    },
    zh: {
      meaning:
        '集群里所有 Pod 申请的内存，已经超过「去掉最大那台节点后」集群能提供的量，任何一台节点宕机都会让一部分 Pod 无处可调度。和 CPU 那条一样，看的是 requests 而不是实际用量；但内存没有弹性，放不下的 Pod 会一直 Pending，而不是跑得慢一点。',
      causes: [
        '负载增长，节点池没有跟着扩。',
        '节点被缩掉了。',
        '内存 requests 设得远高于实际用量。',
        '有一台节点比其它节点大很多，为它预留的量就很大。',
      ],
      notes: [
        '表达式用到 kubernetes-mixin 里的 recording rule `namespace_memory:kube_pod_container_resource_requests:sum`。没加载它，规则永远不会触发。',
      ],
    },
  },

  KubeAPIErrorBudgetBurn: {
    service: 'kubernetes',
    related: ['KubeAPIDown', 'KubeClientErrors', 'KubeAggregatedAPIDown'],
    en: {
      meaning:
        'The Kubernetes API server is failing or slowing down requests fast enough to use up its error budget early. The rules use the multi-window burn-rate method from the Google SRE workbook against a 99% availability target. Each pairs a long and a short window, and both must exceed the threshold: 14.4 over 1h and 5m, and 6 over 6h and 30m, are critical; 3 over 1d and 2h, and 1 over 3d and 6h, are warnings. At a burn rate of 14.4 a 30-day error budget is gone in about two days. Controllers, kubectl and CI pipelines all go through the API server, so its errors spread everywhere.',
      causes: [
        'etcd is slow, most often because of disk latency, which drags down writes in particular.',
        'Clients issue expensive requests, such as LIST calls across all namespaces without a `resourceVersion`, which push latency past the SLO.',
        'An aggregated API (metrics-server, an admission webhook backend) is failing, and requests that depend on it fail with it.',
        'An admission webhook is slow or down, and every write it intercepts waits for it.',
        'The API server is short of CPU or memory, or one replica of several is unhealthy.',
      ],
      notes: [
        'The expressions read the `apiserver_request:burnrate*` recording rules from kubernetes-mixin. Load those recording rules too, or the rules never fire.',
      ],
    },
    zh: {
      meaning:
        'Kubernetes API Server 失败或变慢的请求太多，正在提前耗尽错误预算。规则采用 Google SRE Workbook 的多窗口燃烧率方法，可用性目标为 99%。每条规则搭配一长一短两个窗口，两个都超过阈值才触发：1h 与 5m 超过 14.4、6h 与 30m 超过 6 为紧急；1d 与 2h 超过 3、3d 与 6h 超过 1 为警告。燃烧率 14.4 时，30 天的错误预算大约两天就会用完。控制器、kubectl、CI 流水线都要经过 API Server，它出错会波及所有地方。',
      causes: [
        'etcd 变慢，最常见的是磁盘延迟高，写请求受影响最明显。',
        '客户端发起昂贵请求，比如不带 `resourceVersion` 的全命名空间 LIST，把延迟推过了 SLO。',
        '某个聚合 API（metrics-server、准入 webhook 的后端）出故障，依赖它的请求跟着失败。',
        '准入 webhook 变慢或宕机，被它拦截的每个写请求都要等它。',
        'API Server 自身 CPU 或内存不够，或者多个副本中有一个不健康。',
      ],
      notes: [
        '表达式读的是 kubernetes-mixin 里的 recording rule `apiserver_request:burnrate*`。要一并加载这些 recording rule，否则规则永远不会触发。',
      ],
    },
  },

  KubeQuotaAlmostFull: {
    service: 'kubernetes',
    related: ['KubeQuotaFullyUsed', 'KubeQuotaExceeded', 'KubePodNotReady'],
    en: {
      meaning:
        'A namespace is using between 90% and 100% of one of its ResourceQuota limits (CPU, memory, Pod count, storage and so on). Nothing is broken yet. Once the quota is full, the API server rejects new Pods and objects in that namespace, which typically shows up as a failed rollout or a scale-out that never happens.',
      causes: [
        'The team has grown its workloads and the quota was never revisited.',
        'An HPA scaled out and is now near the ceiling the quota allows.',
        'Finished Pods, old ReplicaSets or unused PVCs still count against the quota.',
        'A rollout needs room for surge Pods on top of the current replicas.',
      ],
      notes: [
        'This is an info-level rule meant for the namespace owner. KubeQuotaFullyUsed and KubeQuotaExceeded are the louder follow-ups.',
      ],
    },
    zh: {
      meaning:
        '一个命名空间的某项 ResourceQuota（CPU、内存、Pod 数、存储等）已用到 90% 到 100% 之间。现在还没出问题；配额一旦用满，API Server 会拒绝在这个命名空间创建新的 Pod 和对象，通常表现为发布失败，或者该扩容时扩不出来。',
      causes: [
        '团队的负载增长了，配额一直没调整。',
        'HPA 扩容后接近了配额允许的上限。',
        '已结束的 Pod、旧的 ReplicaSet、不再使用的 PVC 仍然占着配额。',
        '发布时需要在现有副本之外再放下 surge Pod。',
      ],
      notes: [
        '这是提醒级别的规则，应该发给命名空间的负责人。更紧急的后续告警是 KubeQuotaFullyUsed 和 KubeQuotaExceeded。',
      ],
    },
  },

  KubeletTooManyPods: {
    service: 'kubernetes',
    related: ['KubeNodeNotReady', 'KubePodNotReady'],
    en: {
      meaning:
        "A node is running more than 95% of the Pods it can hold, as set by the kubelet's `maxPods` (110 by default). When it reaches the limit, new Pods that would land there stay Pending, and a crowded node is more likely to show kubelet slowness.",
      causes: [
        'Many small Pods packed onto large nodes, which hit the Pod limit before CPU or memory run out.',
        'DaemonSets and sidecar-heavy workloads using up slots on every node.',
        'Completed or failed Pods that have not been garbage-collected yet.',
        'On some managed clusters the Pod limit is tied to the number of IP addresses a node can get, so it is lower than 110. On Amazon EKS with the VPC CNI, for example, it depends on the instance type.',
      ],
      notes: [
        'The ratio counts Pods in the `Running` phase against the node capacity reported by kube-state-metrics.',
      ],
    },
    zh: {
      meaning:
        '一个节点上运行的 Pod 数超过了它能容纳数量的 95%，上限由 kubelet 的 `maxPods` 决定（默认 110）。到上限后，本该落到这台节点的新 Pod 会一直 Pending；Pod 太密的节点也更容易出现 kubelet 变慢的问题。',
      causes: [
        '大节点上塞了很多小 Pod，CPU 和内存还没用完，Pod 数先到顶了。',
        'DaemonSet 和带大量 sidecar 的负载在每个节点上都占了名额。',
        '已完成或失败的 Pod 还没被回收。',
        '有些托管集群的 Pod 上限和节点能分到的 IP 数挂钩，比 110 低。比如 Amazon EKS 使用 VPC CNI 时，上限取决于实例类型。',
      ],
      notes: [
        '比值是 `Running` 阶段的 Pod 数除以 kube-state-metrics 报告的节点容量。',
      ],
    },
  },

  KubeDaemonSetMisScheduled: {
    service: 'kubernetes',
    related: ['KubeDaemonSetNotScheduled', 'KubeDaemonSetRolloutStuck'],
    en: {
      meaning:
        "Some of a DaemonSet's Pods are running on nodes where, according to the DaemonSet's current node selector, affinity and the node's taints, they should not run. It rarely breaks anything by itself, but it means the DaemonSet's placement and the cluster's node layout disagree.",
      causes: [
        'Node labels changed and no longer match the DaemonSet node selector or affinity.',
        "A `NoSchedule` taint was added to nodes. Pods already there keep running, but they no longer count as correctly placed.",
        'The DaemonSet spec was updated to target fewer nodes.',
      ],
      notes: [
        'Decide which side is right. If the DaemonSet should still run there, fix its selector or add a toleration. If it should not, remove the leftover Pods.',
      ],
    },
    zh: {
      meaning:
        'DaemonSet 有一部分 Pod 运行在按它当前的节点选择器、亲和性和节点污点来看「不该运行」的节点上。这本身很少直接造成故障，但说明 DaemonSet 的部署范围和集群的节点布局对不上了。',
      causes: [
        '节点标签变了，不再匹配 DaemonSet 的节点选择器或亲和性。',
        '节点被加了 `NoSchedule` 污点。已经在上面的 Pod 会继续运行，但不再算作放对了位置。',
        'DaemonSet 的定义改了，覆盖的节点变少了。',
      ],
      notes: [
        '先判断哪一边是对的。如果 DaemonSet 仍然应该在那些节点上运行，就修它的选择器或加容忍；如果不应该，就清掉残留的 Pod。',
      ],
    },
  },

  KubeAggregatedAPIDown: {
    service: 'kubernetes',
    related: ['KubeAggregatedAPIErrors', 'KubeAPIErrorBudgetBurn', 'KubeHpaReplicasMismatch'],
    en: {
      meaning:
        'An aggregated API, an APIService that the Kubernetes API server proxies to another service, has been available less than 85% of the time over the last 10 minutes. The most common one is `v1beta1.metrics.k8s.io` from metrics-server; others come from prometheus-adapter, custom metrics adapters and various operators.',
      causes: [
        'The backing Pods (metrics-server, prometheus-adapter) are crashing, not ready, or scaled to zero.',
        'The API server cannot reach the backing service: a network policy, a firewall, or a broken Service or endpoints.',
        'TLS problems between the API server and the backend, such as an expired serving certificate or a wrong `caBundle` on the APIService.',
        'The APIService still exists but points to a service that was uninstalled.',
      ],
      notes: [
        'Effects depend on the API. When the metrics API is down, `kubectl top` fails and HPAs that scale on CPU or memory stop scaling. A broken APIService can also stall namespace deletion, because the namespace controller cannot list resources from that group.',
      ],
    },
    zh: {
      meaning:
        '某个聚合 API（由 Kubernetes API Server 代理转发到其它服务的 APIService）在过去 10 分钟里可用时间低于 85%。最常见的是 metrics-server 提供的 `v1beta1.metrics.k8s.io`，其它的来自 prometheus-adapter、自定义指标适配器和各类 Operator。',
      causes: [
        '后端 Pod（metrics-server、prometheus-adapter）在崩溃、未就绪，或者副本数被缩到 0。',
        'API Server 访问不到后端服务：网络策略、防火墙，或者 Service、Endpoints 有问题。',
        'API Server 与后端之间的 TLS 有问题，比如服务端证书过期，或者 APIService 上的 `caBundle` 不对。',
        'APIService 还在，但它指向的服务已经卸载了。',
      ],
      notes: [
        '影响取决于是哪个 API。metrics API 不可用时，`kubectl top` 会失败，按 CPU 或内存扩缩的 HPA 也不再扩缩。坏掉的 APIService 还可能让命名空间删除卡住，因为命名空间控制器列不出那个 API 组下的资源。',
      ],
    },
  },

  KubeClientCertificateExpiration: {
    service: 'kubernetes',
    related: ['KubeletClientCertificateExpiration', 'KubeletServerCertificateExpiration', 'KubeNodeNotReady'],
    en: {
      meaning:
        'Of the client certificates presented to the API server over the last 5 minutes, at least 1% expire within 7 days (warning) or within 24 hours (critical). The rules take the 1st percentile of their remaining lifetime. When they expire, those clients get `401 Unauthorized`. If they belong to a kubelet, a controller or the scheduler, nodes go NotReady or the control plane stops reconciling.',
      causes: [
        'kubeadm issues control-plane certificates for one year and renews them during `kubeadm upgrade`. A cluster that has not been upgraded for a year runs into this.',
        'Kubelet client certificate rotation is off, or the CSRs it creates are not being approved.',
        'Long-lived kubeconfig files issued to people or CI systems with client certificates.',
        'Certificates generated by hand or by an external tool that has no renewal job.',
      ],
      notes: [
        "The metric is built from the certificates clients actually present, so it only reflects clients that have connected recently. It does not tell you which client is affected. On kubeadm clusters `kubeadm certs check-expiration` lists the control plane's own certificates.",
      ],
    },
    zh: {
      meaning:
        '过去 5 分钟里客户端向 API Server 出示的证书中，至少有 1% 会在 7 天内（警告）或 24 小时内（紧急）过期。规则取的是剩余有效期的第 1 百分位。过期后这些客户端会收到 `401 Unauthorized`。如果它们属于 kubelet、控制器或调度器，节点会变成 NotReady，或者控制面停止调和。',
      causes: [
        'kubeadm 签发的控制面证书有效期一年，在 `kubeadm upgrade` 时续期。一年没升级过的集群会遇到这个问题。',
        'kubelet 客户端证书轮换没有开启，或者它发起的 CSR 没有被批准。',
        '发给人员或 CI 系统、使用客户端证书认证的长期 kubeconfig 文件。',
        '手工或外部工具生成的证书，没有配续期任务。',
      ],
      notes: [
        '指标来自客户端实际出示的证书，所以只反映最近连接过的客户端，也看不出是哪个客户端。kubeadm 集群可以用 `kubeadm certs check-expiration` 列出控制面自己的证书。',
      ],
    },
  },

  // ---------------- Prometheus ----------------
  PrometheusRuleFailures: {
    service: 'prometheus',
    related: ['PrometheusMissingRuleEvaluations', 'PrometheusBadConfig', 'PrometheusOperatorRejectedResources'],
    en: {
      meaning:
        'Prometheus failed to evaluate one or more alerting or recording rules in the last 5 minutes. A rule that fails to evaluate produces no result, so an alert that should be firing stays silent, and recording rules leave gaps that other rules and dashboards then read.',
      causes: [
        'Vector matching errors that appear only with certain data: `many-to-many matching not allowed` or `found duplicate series for the match group` after a new label or a duplicate target shows up.',
        'A query that exceeds the query timeout or the maximum number of samples it may load.',
        'A rule that reads a recording rule or metric that has been renamed, so it now returns errors in a combined expression.',
        'Remote read or storage errors while the rule is being evaluated.',
      ],
      notes: [
        'The `/rules` page in the Prometheus UI shows the last error for each rule; this is quicker than searching the logs. Some of these errors depend on the data, so `promtool check rules` can pass while evaluation still fails.',
      ],
    },
    zh: {
      meaning:
        'Prometheus 在过去 5 分钟里有告警规则或 recording rule 求值失败。求值失败的规则不产生结果：本该触发的告警不会响，recording rule 会出现数据断档，依赖它的其它规则和仪表盘也跟着读到空值。',
      causes: [
        '只在特定数据下出现的向量匹配错误：新增了一个标签或出现重复目标后，报 `many-to-many matching not allowed` 或 `found duplicate series for the match group`。',
        '查询超过了查询超时时间，或超过了允许加载的最大样本数。',
        '规则引用的 recording rule 或指标改了名，组合表达式开始报错。',
        '求值时远程读或存储出错。',
      ],
      notes: [
        'Prometheus 界面的 `/rules` 页面会显示每条规则最近一次的错误，比翻日志快。这类错误有些和数据有关，所以 `promtool check rules` 能通过，求值时仍然会失败。',
      ],
    },
  },

  PrometheusBadConfig: {
    service: 'prometheus',
    related: ['PrometheusRuleFailures', 'PrometheusOperatorRejectedResources', 'PrometheusOperatorReconcileErrors'],
    en: {
      meaning:
        'The last attempt to reload the Prometheus configuration failed. Prometheus keeps running with the previous configuration, so nothing breaks at once. But every change made since then (new scrape targets, new rule files, new Alertmanager settings) is not in effect, and the next restart may not come back up if the file stays broken.',
      causes: [
        'A YAML syntax error or an unknown field in `prometheus.yml`.',
        'A rule file listed in `rule_files` that fails to parse.',
        'A referenced file (TLS certificate, password file, file_sd target list) that is missing or unreadable.',
        'On Kubernetes, a ServiceMonitor, PodMonitor or PrometheusRule that the Operator turned into an invalid configuration.',
      ],
      notes: [
        'Run `promtool check config prometheus.yml` before each reload. With the Operator the generated configuration lives in a Secret; the config-reloader sidecar logs show the reload error.',
      ],
    },
    zh: {
      meaning:
        '最近一次重载 Prometheus 配置失败。Prometheus 会继续用旧配置运行，所以不会立刻出问题；但此后的所有改动（新的采集目标、新的规则文件、新的 Alertmanager 配置）都没有生效。如果配置文件一直是坏的，下次重启时 Prometheus 可能起不来。',
      causes: [
        '`prometheus.yml` 有 YAML 语法错误或未知字段。',
        '`rule_files` 里列出的某个规则文件解析失败。',
        '引用的文件（TLS 证书、密码文件、file_sd 目标列表）不存在或不可读。',
        '在 Kubernetes 上，某个 ServiceMonitor、PodMonitor 或 PrometheusRule 被 Operator 生成成了无效配置。',
      ],
      notes: [
        '每次重载前先跑 `promtool check config prometheus.yml`。用 Operator 时，生成的配置放在一个 Secret 里，重载错误可以在 config-reloader sidecar 的日志里看到。',
      ],
    },
  },

  PrometheusNotConnectedToAlertmanagers: {
    service: 'prometheus',
    related: ['PrometheusErrorSendingAlertsToAnyAlertmanager', 'PrometheusErrorSendingAlertsToSomeAlertmanagers', 'PrometheusNotificationQueueRunningFull'],
    en: {
      meaning:
        'Prometheus has discovered no Alertmanager to send alerts to. Rules are still evaluated and alerts still show as firing on the Prometheus `/alerts` page, but no notifications go out. Everything is silent and nothing looks wrong, which is why this alert should be routed through a channel that does not depend on the same Alertmanager.',
      causes: [
        'The `alerting` section of the configuration is missing or was removed.',
        "Alertmanager discovery returns nothing: wrong service name, namespace or port name. With the Operator, check `spec.alerting.alertmanagers` in the Prometheus resource.",
        'Prometheus lacks RBAC permissions to list the endpoints of the Alertmanager service.',
        'All Alertmanager Pods are down, so the service has no endpoints.',
      ],
      notes: [
        'The Prometheus `/status` page (Runtime & Build Information) lists the Alertmanagers it has discovered.',
      ],
    },
    zh: {
      meaning:
        'Prometheus 没有发现任何可以发送告警的 Alertmanager。规则照常求值，告警在 Prometheus 的 `/alerts` 页面上照样显示为触发，但没有任何通知发出去。一切都静悄悄的、看不出异常，所以这条告警应该走一条不依赖同一个 Alertmanager 的通道发出。',
      causes: [
        '配置里的 `alerting` 段缺失或被删了。',
        'Alertmanager 服务发现没有结果：服务名、命名空间或端口名写错。用 Operator 的话，检查 Prometheus 资源里的 `spec.alerting.alertmanagers`。',
        'Prometheus 没有 RBAC 权限列出 Alertmanager 服务的 endpoints。',
        'Alertmanager 的 Pod 全挂了，服务下没有任何 endpoint。',
      ],
      notes: [
        'Prometheus 的 `/status` 页面（Runtime & Build Information）会列出已发现的 Alertmanager。',
      ],
    },
  },

  PrometheusRemoteWriteBehind: {
    service: 'prometheus',
    related: ['PrometheusRemoteWriteDesiredShards', 'PrometheusRemoteStorageFailures'],
    en: {
      meaning:
        'Remote write is more than 2 minutes behind: the newest sample Prometheus has ingested is more than 120 seconds newer than the newest sample it has sent to a remote endpoint. Dashboards and alerts that read from the remote store (VictoriaMetrics, Thanos Receive, Mimir, a managed service) see stale data. If the lag keeps growing, samples can be dropped before they are sent.',
      causes: [
        'The remote endpoint is slow or rejecting writes: overloaded, rate limiting with HTTP 429, or returning errors.',
        'Network latency or bandwidth between Prometheus and the endpoint is not enough for the write volume.',
        'Remote write is capped at too few shards for the series count (see PrometheusRemoteWriteDesiredShards).',
        'A spike in series count, for example from a new high-cardinality label, multiplied the write volume.',
        'After a restart, Prometheus is replaying a large WAL and catching up.',
      ],
      notes: [
      ],
    },
    zh: {
      meaning:
        'Remote Write 落后超过 2 分钟：Prometheus 已接收的最新样本，比已发往远端的最新样本新了 120 秒以上。读远端存储（VictoriaMetrics、Thanos Receive、Mimir、托管服务）的仪表盘和告警看到的都是旧数据。落后量如果持续扩大，可能有样本在发出去之前就被丢掉。',
      causes: [
        '远端写入慢或拒绝写入：过载、用 HTTP 429 限流，或者返回错误。',
        'Prometheus 到远端的网络延迟或带宽撑不住写入量。',
        'Remote Write 的分片（shard）上限相对序列数太低（见 PrometheusRemoteWriteDesiredShards）。',
        '序列数突增（比如新增了一个高基数标签），写入量成倍增加。',
        'Prometheus 重启后在回放大量 WAL，正在追赶。',
      ],
      notes: [
      ],
    },
  },

  PrometheusRemoteWriteDesiredShards: {
    service: 'prometheus',
    related: ['PrometheusRemoteWriteBehind', 'PrometheusRemoteStorageFailures'],
    en: {
      meaning:
        'Remote write calculates how many parallel shards it needs to keep up with the incoming samples. This alert fires when that number has been above the configured `max_shards` for 15 minutes. Remote write cannot add the shards it needs, so it will fall behind (PrometheusRemoteWriteBehind) unless something changes.',
      causes: [
        'The number of series or the scrape frequency grew, so there are more samples per second to send.',
        'Each send became slower because the remote endpoint or the network is slower, so more shards are needed for the same throughput.',
        '`max_shards` in `queue_config` is set lower than the workload needs.',
      ],
      notes: [
        'Fix the cause before raising the limit. If the endpoint is slow, more shards only add pressure on it. If the volume really grew, raise `max_shards`, or `max_samples_per_send` to send larger batches, and make sure Prometheus has the memory for the larger queues.',
      ],
    },
    zh: {
      meaning:
        'Remote Write 会根据进来的样本速度，计算需要多少个并行分片（shard）才能跟上。这条告警在这个计算值连续 15 分钟高于配置的 `max_shards` 时触发：Remote Write 加不了它需要的分片，如果情况不变，就会开始落后（PrometheusRemoteWriteBehind）。',
      causes: [
        '序列数或采集频率增加了，每秒要发的样本更多。',
        '远端或网络变慢，每次发送耗时变长，同样的吞吐需要更多分片。',
        '`queue_config` 里的 `max_shards` 设得比实际需要低。',
      ],
      notes: [
        '先解决原因，再调上限。远端慢的话，加分片只会给它更大压力；写入量确实涨了，再调大 `max_shards`，或调大 `max_samples_per_send` 让每批发得更多，同时确认 Prometheus 有足够的内存承载更大的队列。',
      ],
    },
  },

  PrometheusTargetLimitHit: {
    service: 'prometheus',
    related: ['PrometheusScrapeSampleLimitHit', 'PrometheusLabelLimitHit', 'PrometheusTargetSyncFailure'],
    en: {
      meaning:
        'A scrape job discovered more targets than its `target_limit` allows. Prometheus does not scrape just the first N in that case: it marks every target of that scrape pool as failed and scrapes none of them. A whole job goes dark at once, and its `up` series turn to 0.',
      causes: [
        'A ServiceMonitor or PodMonitor selector is too broad and now matches Services or Pods it was not meant to.',
        'The monitored workload scaled out past the limit, for example a large DaemonSet or an HPA scaling out.',
        'Relabeling that used to drop unwanted targets was changed or removed.',
        'The limit was set for a smaller cluster and never revisited.',
      ],
      notes: [
        'The `/targets` page shows the affected job with an error that mentions the target limit. With the Operator, the limit can come from `targetLimit` on a ServiceMonitor or PodMonitor, or `enforcedTargetLimit` on the Prometheus resource.',
      ],
    },
    zh: {
      meaning:
        '某个采集任务发现的目标数超过了它的 `target_limit`。这时 Prometheus 不会只抓前 N 个，而是把这个采集池里的所有目标都标成失败，一个都不抓。整个任务一下子全部断掉，对应的 `up` 序列全部变成 0。',
      causes: [
        'ServiceMonitor 或 PodMonitor 的选择器太宽，匹配到了本不该采集的 Service 或 Pod。',
        '被监控的负载扩容超过了上限，比如大规模的 DaemonSet，或者 HPA 扩容。',
        '原本用来过滤多余目标的 relabel 规则被改掉或删掉了。',
        '上限是按更小的集群设的，后来没有调整。',
      ],
      notes: [
        '`/targets` 页面上，受影响的任务会显示一条提到 target limit 的错误。用 Operator 时，上限可能来自 ServiceMonitor 或 PodMonitor 的 `targetLimit`，也可能来自 Prometheus 资源的 `enforcedTargetLimit`。',
      ],
    },
  },

  PrometheusOperatorRejectedResources: {
    service: 'prometheus',
    related: ['PrometheusOperatorReconcileErrors', 'PrometheusOperatorSyncFailed', 'PrometheusBadConfig'],
    en: {
      meaning:
        'The Prometheus Operator rejected one or more monitoring resources (ServiceMonitor, PodMonitor, Probe, PrometheusRule, AlertmanagerConfig) and left them out of the generated configuration. The resources still exist in the cluster and `kubectl apply` succeeded, but the targets they describe are not scraped and the rules they contain are not loaded. Nothing else tells you this has happened.',
      causes: [
        'A PrometheusRule contains a rule that does not parse, such as invalid PromQL or a bad duration.',
        'A ServiceMonitor or PodMonitor reads a file from the Prometheus filesystem (`bearerTokenFile`, TLS file paths) while the Operator is configured to forbid it.',
        'A resource references a Secret or ConfigMap that does not exist or is in a namespace the Operator cannot read.',
        'An AlertmanagerConfig uses a receiver or field that does not pass the Operator\'s validation.',
      ],
      notes: [
        'The `controller` and `resource` labels on the alert tell you which kind of object was rejected. The Operator logs name the object and the reason.',
      ],
    },
    zh: {
      meaning:
        'Prometheus Operator 拒绝了一个或多个监控资源（ServiceMonitor、PodMonitor、Probe、PrometheusRule、AlertmanagerConfig），没有把它们放进生成的配置。这些资源在集群里照样存在，`kubectl apply` 也成功了，但它们描述的目标没有被采集，里面的规则也没有加载。除了这条告警，没有别的地方会提醒你。',
      causes: [
        'PrometheusRule 里有解析不了的规则，比如 PromQL 写错或时长格式不对。',
        'ServiceMonitor 或 PodMonitor 要读取 Prometheus 所在文件系统里的文件（`bearerTokenFile`、TLS 文件路径），而 Operator 配置为禁止这种用法。',
        '资源引用的 Secret 或 ConfigMap 不存在，或者在 Operator 无权读取的命名空间里。',
        'AlertmanagerConfig 使用的接收器或字段没有通过 Operator 的校验。',
      ],
      notes: [
        '告警上的 `controller` 和 `resource` 标签说明了被拒的是哪类对象，Operator 日志里有具体对象名和原因。',
      ],
    },
  },
};
