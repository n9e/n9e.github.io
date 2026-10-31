# Kubernetes alert rules for Prometheus: 77 rules with runbooks

77 ready-to-use Kubernetes alert rules in PromQL, each with severity, duration and runbook steps. Metrics from kube-state-metrics, cAdvisor (kubelet), apiserver. Download as a Prometheus rules file or import into Nightingale.

Last reviewed 2026-10-31

Alert rules for Kubernetes clusters built on the metrics every cluster already exposes: kube-state-metrics for object state, cAdvisor through the kubelet for container resources, and the apiserver, kubelet, scheduler and controller-manager endpoints for the control plane. They cover crash-looping and unready pods, stuck rollouts, replica mismatches, failed jobs, resource overcommit, quota pressure, certificate expiry and control-plane outages. Most rules keep the alert names used by kubernetes-mixin and kube-prometheus (KubePodCrashLooping, KubeNodeNotReady, KubeAPIErrorBudgetBurn…), so they match the names you already see in Alertmanager.

## At a glance[​](#at-a-glance "Direct link to At a glance")

* **77 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
* **Metrics from**: kube-state-metrics, cAdvisor (kubelet), apiserver
* **Download**: [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
* Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list[​](#rule-list "Direct link to Rule list")

| Rule                                                                                                                  | Severity | For  |
| --------------------------------------------------------------------------------------------------------------------- | -------- | ---- |
| Deployment Pod availability below 70% (replicas above 9 pods)                                                         | Critical | 1m   |
| Job failed                                                                                                            | Info     | 1m   |
| Pod startup timeout                                                                                                   | Warning  | 1m   |
| Pod state abnormal                                                                                                    | Critical | 1m   |
| Pod restarting frequently                                                                                             | Warning  | 1m   |
| Container CPU usage exceeds 80%                                                                                       | Info     | 1m   |
| Container memory usage exceeds 80%                                                                                    | Info     | 1m   |
| Node CPU usage exceeds 90%                                                                                            | Info     | 1m   |
| Node memory usage exceeds 90%                                                                                         | Warning  | 1m   |
| Node not ready                                                                                                        | Critical | 1m   |
| Node disk usage exceeds 90%                                                                                           | Info     | 1m   |
| [KubeClientCertificateExpiration-S2](https://n9e.github.io/alert-rules/kubernetes/kubeclientcertificateexpiration.md) | Warning  | —    |
| [KubeClientCertificateExpiration-S1](https://n9e.github.io/alert-rules/kubernetes/kubeclientcertificateexpiration.md) | Critical | —    |
| AggregatedAPIErrors                                                                                                   | Warning  | —    |
| AggregatedAPIDown                                                                                                     | Warning  | 5m   |
| KubeAPIDown                                                                                                           | Critical | 15m  |
| [KubeAPIErrorBudgetBurn-S1-120s](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)              | Critical | 2m   |
| [KubeAPIErrorBudgetBurn-S1-900s](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)              | Critical | 15m  |
| [KubeAPIErrorBudgetBurn-S2-3600s](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)             | Warning  | 60m  |
| [KubeAPIErrorBudgetBurn-S2-10800s](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)            | Warning  | 180m |
| Deployment replicas mismatch                                                                                          | Warning  | 10m  |
| StatefulSet replicas mismatch                                                                                         | Warning  | 10m  |
| DaemonSet has unready Pods                                                                                            | Warning  | 10m  |
| HPA scaling failed                                                                                                    | Warning  | 5m   |
| Pod in Failed state                                                                                                   | Warning  | 5m   |
| Job failed                                                                                                            | Warning  | 5m   |
| CPUThrottlingHigh                                                                                                     | Info     | 15m  |
| [KubeAggregatedAPIDown](https://n9e.github.io/alert-rules/kubernetes/kubeaggregatedapidown.md)                        | Warning  | 5m   |
| KubeAggregatedAPIErrors                                                                                               | Warning  | —    |
| KubeAPITerminatedRequests                                                                                             | Warning  | 5m   |
| KubeClientErrors                                                                                                      | Warning  | 15m  |
| [KubeContainerWaiting](https://n9e.github.io/alert-rules/kubernetes/kubecontainerwaiting.md)                          | Warning  | 60m  |
| KubeControllerManagerDown                                                                                             | Critical | 15m  |
| [KubeCPUOvercommit](https://n9e.github.io/alert-rules/kubernetes/kubecpuovercommit.md)                                | Warning  | 10m  |
| KubeCPUQuotaOvercommit                                                                                                | Warning  | 5m   |
| [KubeDaemonSetMisScheduled](https://n9e.github.io/alert-rules/kubernetes/kubedaemonsetmisscheduled.md)                | Warning  | 15m  |
| KubeDaemonSetNotScheduled                                                                                             | Warning  | 10m  |
| KubeDaemonSetRolloutStuck                                                                                             | Warning  | 15m  |
| KubeDeploymentGenerationMismatch                                                                                      | Warning  | 15m  |
| [KubeDeploymentReplicasMismatch](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md)      | Warning  | 15m  |
| [KubeDeploymentRolloutStuck](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentrolloutstuck.md)              | Warning  | 15m  |
| [KubeHpaMaxedOut](https://n9e.github.io/alert-rules/kubernetes/kubehpamaxedout.md)                                    | Warning  | 15m  |
| KubeHpaReplicasMismatch                                                                                               | Warning  | 15m  |
| [KubeJobFailed](https://n9e.github.io/alert-rules/kubernetes/kubejobfailed.md)                                        | Warning  | 15m  |
| KubeJobNotCompleted                                                                                                   | Warning  | —    |
| KubeletClientCertificateExpiration                                                                                    | Warning  | —    |
| KubeletClientCertificateRenewalErrors                                                                                 | Warning  | 15m  |
| [KubeletDown](https://n9e.github.io/alert-rules/kubernetes/kubeletdown.md)                                            | Critical | 15m  |
| KubeletPlegDurationHigh                                                                                               | Warning  | 5m   |
| KubeletPodStartUpLatencyHigh                                                                                          | Warning  | 15m  |
| KubeletServerCertificateExpiration                                                                                    | Warning  | —    |
| KubeletServerCertificateRenewalErrors                                                                                 | Warning  | 15m  |
| [KubeletTooManyPods](https://n9e.github.io/alert-rules/kubernetes/kubelettoomanypods.md)                              | Info     | 15m  |
| [KubeMemoryOvercommit](https://n9e.github.io/alert-rules/kubernetes/kubememoryovercommit.md)                          | Warning  | 10m  |
| KubeMemoryQuotaOvercommit                                                                                             | Warning  | 5m   |
| [KubeNodeNotReady](https://n9e.github.io/alert-rules/kubernetes/kubenodenotready.md)                                  | Warning  | 15m  |
| KubeNodeReadinessFlapping                                                                                             | Warning  | 15m  |
| KubeNodeUnreachable                                                                                                   | Warning  | 15m  |
| KubePersistentVolumeErrors                                                                                            | Critical | 5m   |
| [KubePersistentVolumeFillingUp](https://n9e.github.io/alert-rules/kubernetes/kubepersistentvolumefillingup.md)        | Critical | 1m   |
| KubePersistentVolumeInodesFillingUp                                                                                   | Critical | 1m   |
| [KubePodCrashLooping](https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping.md)                            | Warning  | 15m  |
| [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md)                                    | Warning  | 15m  |
| [KubeQuotaAlmostFull](https://n9e.github.io/alert-rules/kubernetes/kubequotaalmostfull.md)                            | Info     | 15m  |
| KubeQuotaExceeded                                                                                                     | Warning  | 15m  |
| KubeQuotaFullyUsed                                                                                                    | Info     | 15m  |
| KubeSchedulerDown                                                                                                     | Critical | 15m  |
| KubeStatefulSetGenerationMismatch                                                                                     | Warning  | 15m  |
| [KubeStatefulSetReplicasMismatch](https://n9e.github.io/alert-rules/kubernetes/kubestatefulsetreplicasmismatch.md)    | Warning  | 15m  |
| KubeStatefulSetUpdateNotRolledOut                                                                                     | Warning  | 15m  |
| KubeVersionMismatch                                                                                                   | Warning  | 15m  |
| Node running too many Pods                                                                                            | Warning  | 15m  |
| Node readiness flapping                                                                                               | Warning  | 15m  |
| Pod startup duration high                                                                                             | Warning  | 15m  |
| Client certificate expiring - S1                                                                                      | Critical | —    |
| Server certificate expiring - S1                                                                                      | Critical | —    |
| Kubelet down                                                                                                          | Critical | 15m  |

## kube-state-metrics, cAdvisor and control plane (77)[​](#kube-state-metrics-cadvisor-and-control-plane-77 "Direct link to kube-state-metrics, cAdvisor and control plane (77)")

### Deployment Pod availability below 70% (replicas above 9 pods)[​](#deployment-pod-availability-below-70-replicas-above-9-pods "Direct link to Deployment Pod availability below 70% (replicas above 9 pods)")

Critical · 1m · Trigger:

```
kube_deployment_status_replicas_unavailable and kube_deployment_status_replicas_available{} / kube_deployment_status_replicas{} * 100 < 70 and kube_deployment_status_replicas{} > 9
```

Runbook:

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
2. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
3. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
4. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

### Job failed[​](#job-failed "Direct link to Job failed")

Info · 1m · Trigger:

```
kube_job_status_failed{} > 0
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
2. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
3. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
4. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

### Pod startup timeout[​](#pod-startup-timeout "Direct link to Pod startup timeout")

Warning · 1m · Trigger:

```
kube_pod_container_status_waiting_reason{} == 1
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
2. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
3. For slow mounts, check the PV/CSI driver state;
4. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

### Pod state abnormal[​](#pod-state-abnormal "Direct link to Pod state abnormal")

Critical · 1m · Trigger:

```
kube_pod_status_phase{phase=~"Pending|Unknown|Failed"} > 0
```

Runbook:

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
2. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
3. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
4. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

### Pod restarting frequently[​](#pod-restarting-frequently "Direct link to Pod restarting frequently")

Warning · 1m · Trigger:

```
increase(kube_pod_container_status_restarts_total{}[5m]) > 3
```

Runbook:

1. Run kubectl logs \<pod> -n \<ns> --previous to see the log before the last exit — this is the key step;
2. Run kubectl describe pod for the exit code and Events: 137 usually means OOM or killed, 1/2 usually means the application failed to start;
3. For config or dependency problems (unreachable database, missing ConfigMap/Secret), fix the dependency first;
4. For OOM, compare resources.limits.memory against actual usage, or fix the application's memory leak.

### Container CPU usage exceeds 80%[​](#container-cpu-usage-exceeds-80 "Direct link to Container CPU usage exceeds 80%")

Info · 1m · Trigger:

```
100 * (sum(rate(container_cpu_usage_seconds_total{id!="/"}[2m])) by (pod_name,namespace,container) / sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.*)")) by (pod_name,namespace,container)) > 80 and sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.)")) by (pod_name,namespace,container) != 0
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers to compare actual usage against the limit;
2. Check the CPUThrottlingHigh metric to confirm whether it is already being throttled;
3. For genuine growth, raise resources.limits.cpu or scale out with an HPA;
4. For abnormal usage, capture a CPU profile in the application rather than papering over it with more quota.

### Container memory usage exceeds 80%[​](#container-memory-usage-exceeds-80 "Direct link to Container memory usage exceeds 80%")

Info · 1m · Trigger:

```
(sum(container_memory_working_set_bytes{id!="/"}) BY (instance,name,container,pod_name,namespace) / sum(container_spec_memory_limit_bytes{id!="/"} > 0) BY (instance,name,container,pod_name,namespace) * 100) > 80
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers to compare usage against the limit;
2. Check the history curve to tell a steady climb (likely a leak) from a normal traffic peak;
3. For normal peaks, raise resources.limits.memory with headroom;
4. For a steady climb, capture a heap profile in the application — raising the quota only postpones it.

### Node CPU usage exceeds 90%[​](#node-cpu-usage-exceeds-90 "Direct link to Node CPU usage exceeds 90%")

Info · 1m · Trigger:

```
100-cpu_usage_idle{cpu="cpu-total"} > 90
```

Runbook:

1. Run kubectl top node for the overall picture and kubectl top pod -A --sort-by=cpu for the biggest consumers;
2. Check whether too many high-load Pods landed on this node and drain some if needed;
3. Check whether Pod requests are set too low, causing overcommit;
4. If the cluster is running hot overall, add nodes.

### Node memory usage exceeds 90%[​](#node-memory-usage-exceeds-90 "Direct link to Node memory usage exceeds 90%")

Warning · 1m · Trigger:

```
mem_used_percent > 90
```

Runbook:

1. Run kubectl top node and kubectl top pod -A --sort-by=memory to find the biggest consumers;
2. Check for Pods without a memory limit growing without bound;
3. Use kubectl drain to move some Pods off, confirming the target nodes have headroom;
4. Review the kubelet eviction thresholds, and add nodes if the cluster is tight overall.

### Node not ready[​](#node-not-ready "Direct link to Node not ready")

Critical · 1m · Trigger:

```
kube_node_status_condition{condition="Ready",status="true"} == 0
```

Runbook:

1. Run kubectl describe node \<node> for Conditions and Events to tell MemoryPressure, DiskPressure and a lost kubelet apart;
2. Log in to the node and check kubelet and the container runtime (systemctl status kubelet containerd);
3. Use journalctl -u kubelet -n 200 to locate the problem;
4. If the node cannot recover soon, run kubectl drain so the Pods move promptly instead of waiting for the eviction timeout.

### Node disk usage exceeds 90%[​](#node-disk-usage-exceeds-90 "Direct link to Node disk usage exceeds 90%")

Info · 1m · Trigger:

```
disk_used_percent > 90
```

Runbook:

1. On the node run df -h to find the mount point, usually /var/lib/docker or /var/lib/containerd;
2. Run crictl rmi --prune or docker system prune to clean unused image layers — the fastest win;
3. Check whether a Pod is writing large amounts of data to an emptyDir or hostPath;
4. After cleaning, confirm the kubelet DiskPressure taint was removed automatically.

### KubeClientCertificateExpiration-S2[​](#kubeclientcertificateexpiration-s2 "Direct link to KubeClientCertificateExpiration-S2")

A client certificate used to authenticate to the apiserver is expiring in less than 7.0 days.

Warning · — · PromQL, common causes and runbook: [KubeClientCertificateExpiration](https://n9e.github.io/alert-rules/kubernetes/kubeclientcertificateexpiration.md)

### KubeClientCertificateExpiration-S1[​](#kubeclientcertificateexpiration-s1 "Direct link to KubeClientCertificateExpiration-S1")

A client certificate used to authenticate to the apiserver is expiring in less than 24.0 hours.

Critical · — · PromQL, common causes and runbook: [KubeClientCertificateExpiration](https://n9e.github.io/alert-rules/kubernetes/kubeclientcertificateexpiration.md)

### AggregatedAPIErrors[​](#aggregatedapierrors "Direct link to AggregatedAPIErrors")

An aggregated API {{ $labels.name }}/{{ $labels.namespace }} has reported errors. The number of errors have increased for it in the past five minutes. High values indicate that the availability of the service changes too often.

Warning · — · Trigger:

```
sum by(name, namespace)(increase(aggregator_unavailable_apiservice_count[5m])) > 2
```

Runbook:

1. Run kubectl get apiservice to see which APIService is False;
2. Run kubectl describe apiservice \<name> for the specific error;
3. If the backing service is down, check its Deployment/Service health (commonly metrics-server);
4. For certificate problems, verify the CA bundle configuration.

### AggregatedAPIDown[​](#aggregatedapidown "Direct link to AggregatedAPIDown")

An aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.

Warning · 5m · Trigger:

```
(1 - max by(name, namespace)(avg_over_time(aggregator_unavailable_apiservice[10m]))) * 100 < 85
```

Runbook:

1. Run kubectl get apiservice to identify the APIService;
2. Run kubectl -n \<ns> get pod to check its backing Pods;
3. Read that Pod's logs for startup or runtime errors;
4. After recovery, verify with something like kubectl top node that the functionality is back.

### KubeAPIDown[​](#kubeapidown "Direct link to KubeAPIDown")

KubeAPI has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```
absent(up{job="apiserver"} == 1)
```

Runbook:

1. On the control plane node, check the kube-apiserver process/static Pod state and logs;
2. For multi-replica deployments, confirm whether only some instances are down and whether the load balancer removed the faulty ones;
3. Common root causes are unavailable etcd, expired certificates and resource exhaustion;
4. Restore etcd and certificates first — apiserver usually recovers on its own.

### KubeAPIErrorBudgetBurn-S1-120s[​](#kubeapierrorbudgetburn-s1-120s "Direct link to KubeAPIErrorBudgetBurn-S1-120s")

The API server is burning too much error budget.

Critical · 2m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)

### KubeAPIErrorBudgetBurn-S1-900s[​](#kubeapierrorbudgetburn-s1-900s "Direct link to KubeAPIErrorBudgetBurn-S1-900s")

The API server is burning too much error budget.

Critical · 15m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)

### KubeAPIErrorBudgetBurn-S2-3600s[​](#kubeapierrorbudgetburn-s2-3600s "Direct link to KubeAPIErrorBudgetBurn-S2-3600s")

The API server is burning too much error budget.

Warning · 60m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)

### KubeAPIErrorBudgetBurn-S2-10800s[​](#kubeapierrorbudgetburn-s2-10800s "Direct link to KubeAPIErrorBudgetBurn-S2-10800s")

The API server is burning too much error budget.

Warning · 180m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn.md)

### Deployment replicas mismatch[​](#deployment-replicas-mismatch "Direct link to Deployment replicas mismatch")

Deployment {{ $labels.deployment }} in namespace {{ $labels.namespace }} has mismatched replicas.

Warning · 10m · Trigger:

```
kube_deployment_spec_replicas{job="kube-state-metrics"} != kube_deployment_status_replicas_available{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
2. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
3. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
4. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

### StatefulSet replicas mismatch[​](#statefulset-replicas-mismatch "Direct link to StatefulSet replicas mismatch")

StatefulSet {{ $labels.statefulset }} in namespace {{ $labels.namespace }} has mismatched replicas.

Warning · 10m · Trigger:

```
kube_statefulset_status_replicas_ready{job="kube-state-metrics"} != kube_statefulset_spec_replicas{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl get pod -n \<ns> -l \<selector> and check by ordinal which replica is stuck;
2. Run kubectl describe pod to check whether its PVC bound successfully — this is the most common sticking point for stateful services;
3. For storage problems, check the PV/StorageClass and the CSI driver;
4. For application problems check kubectl logs; once fixed, the StatefulSet continues automatically.

### DaemonSet has unready Pods[​](#daemonset-has-unready-pods "Direct link to DaemonSet has unready Pods")

DaemonSet {{ $labels.daemonset }} in namespace {{ $labels.namespace }} has unready pods.

Warning · 10m · Trigger:

```
kube_daemonset_status_number_ready{job="kube-state-metrics"} < kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe ds \<name> -n \<ns> for Events and desired/current counts;
2. Compare node taints against the DaemonSet's tolerations — a taint mismatch is the most common cause;
3. Check whether nodeSelector/affinity excludes those nodes;
4. For resource shortage, lower the DaemonSet's requests or free node resources.

### HPA scaling failed[​](#hpa-scaling-failed "Direct link to HPA scaling failed")

HPA {{ $labels.hpa }} in namespace {{ $labels.namespace }} has scale up failures.

Warning · 5m · Trigger:

```
kube_hpa_status_failed_scale_up_total{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe hpa \<name> -n \<ns> and read the reason in Conditions;
2. ScalingLimited means it hit the min/max boundary; FailedGetScale means the target workload has a problem;
3. For metric failures, check whether metrics-server or the custom metrics adapter is healthy;
4. If new replicas stay Pending for lack of resources, add nodes.

### Pod in Failed state[​](#pod-in-failed-state "Direct link to Pod in Failed state")

Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has failed.

Warning · 5m · Trigger:

```
kube_pod_status_phase{job="kube-state-metrics",phase="Failed"} == 1
```

Runbook:

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
2. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
3. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
4. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

### Job failed[​](#job-failed-1 "Direct link to Job failed")

Job {{ $labels.job\_name }} in namespace {{ $labels.namespace }} has failed.

Warning · 5m · Trigger:

```
kube_job_status_failed{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
2. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
3. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
4. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

### CPUThrottlingHigh[​](#cputhrottlinghigh "Direct link to CPUThrottlingHigh")

{{ $value | humanizePercentage }} throttling of CPU in namespace {{ $labels.namespace }} for container {{ $labels.container }} in pod {{ $labels.pod }}.

Info · 15m · Trigger:

```
sum(increase(container_cpu_cfs_throttled_periods_total{container!="", }[5m])) by (container, pod, namespace)

  /

sum(increase(container_cpu_cfs_periods_total{}[5m])) by (container, pod, namespace)

  > ( 25 / 100 )
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers and compare against resources.limits.cpu;
2. Note that runtimes like Java that do not detect the cgroup limit may spawn too many threads and worsen throttling — check the JVM version and flags;
3. Raise limits.cpu, or scale out horizontally with an HPA;
4. A limit far above the request is easily squeezed by overcommit — consider bringing them closer together.

### KubeAggregatedAPIDown[​](#kubeaggregatedapidown "Direct link to KubeAggregatedAPIDown")

Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.

Warning · 5m · PromQL, common causes and runbook: [KubeAggregatedAPIDown](https://n9e.github.io/alert-rules/kubernetes/kubeaggregatedapidown.md)

### KubeAggregatedAPIErrors[​](#kubeaggregatedapierrors "Direct link to KubeAggregatedAPIErrors")

Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has reported errors. It has appeared unavailable {{ $value | humanize }} times averaged over the past 10m.

Warning · — · Trigger:

```
sum by(name, namespace, cluster)(increase(aggregator_unavailable_apiservice_total{job="apiserver"}[10m])) > 4
```

Runbook:

1. Run kubectl get apiservice to see which one is False;
2. Run kubectl describe apiservice \<name> for the specific error;
3. If the backing service is down, check its Deployment/Service;
4. For certificate problems, verify the CA bundle configuration.

### KubeAPITerminatedRequests[​](#kubeapiterminatedrequests "Direct link to KubeAPITerminatedRequests")

The kubernetes apiserver has terminated {{ $value | humanizePercentage }} of its incoming requests.

Warning · 5m · Trigger:

```
sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m]))  / (  sum(rate(apiserver_request_total{job="apiserver"}[10m])) + sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m])) ) > 0.20
```

Runbook:

1. Check the apiserver\_flowcontrol metrics to see which flow schema is being throttled;
2. Identify the client making the flood of requests (usually an Operator or script doing full LIST calls);
3. Rate limit that client or fix its request pattern;
4. If more capacity is genuinely needed, tune the FlowSchema and PriorityLevelConfiguration.

### KubeClientErrors[​](#kubeclienterrors "Direct link to KubeClientErrors")

Kubernetes API server client '{{ $labels.job }}/{{ $labels.instance }}' is experiencing {{ $value | humanizePercentage }} errors.'

Warning · 15m · Trigger:

```
(sum(rate(rest_client_requests_total{job="apiserver",code=~"5.."}[5m])) by (cluster, instance, job, namespace)

  /

sum(rate(rest_client_requests_total{job="apiserver"}[5m])) by (cluster, instance, job, namespace))

> 0.01
```

Runbook:

1. Use the alert labels to identify the component/instance that is erroring;
2. Read the specific error code in that component's log: 401/403 is an RBAC problem, 429 is throttling, 5xx is an apiserver-side problem;
3. For permissions, verify the ServiceAccount's Role/ClusterRoleBinding;
4. For throttling, check whether the component is doing high-frequency LIST calls and switch to Watch or add a resourceVersion.

### KubeContainerWaiting[​](#kubecontainerwaiting "Direct link to KubeContainerWaiting")

pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour.

Warning · 60m · PromQL, common causes and runbook: [KubeContainerWaiting](https://n9e.github.io/alert-rules/kubernetes/kubecontainerwaiting.md)

### KubeControllerManagerDown[​](#kubecontrollermanagerdown "Direct link to KubeControllerManagerDown")

KubeControllerManager has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```
absent(up{job="kube-controller-manager"} == 1)
```

Runbook:

1. On the control plane node, check the kube-controller-manager static Pod or process state and logs;
2. For multi-replica deployments, confirm leader election is failing over correctly;
3. Common root causes are an unavailable apiserver or expired certificates;
4. After recovery, confirm workloads with wrong replica counts start self-healing.

### KubeCPUOvercommit[​](#kubecpuovercommit "Direct link to KubeCPUOvercommit")

Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure.

Warning · 10m · PromQL, common causes and runbook: [KubeCPUOvercommit](https://n9e.github.io/alert-rules/kubernetes/kubecpuovercommit.md)

### KubeCPUQuotaOvercommit[​](#kubecpuquotaovercommit "Direct link to KubeCPUQuotaOvercommit")

Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Namespaces.

Warning · 5m · Trigger:

```
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(cpu|requests.cpu)"})) by (cluster)

  /

sum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"}) by (cluster)

  > 1.5
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
2. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
3. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
4. If headroom is genuinely insufficient, add nodes.

### KubeDaemonSetMisScheduled[​](#kubedaemonsetmisscheduled "Direct link to KubeDaemonSetMisScheduled")

{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run.

Warning · 15m · PromQL, common causes and runbook: [KubeDaemonSetMisScheduled](https://n9e.github.io/alert-rules/kubernetes/kubedaemonsetmisscheduled.md)

### KubeDaemonSetNotScheduled[​](#kubedaemonsetnotscheduled "Direct link to KubeDaemonSetNotScheduled")

{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are not scheduled.

Warning · 10m · Trigger:

```
kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  -

kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe ds \<name> -n \<ns> for Events and desired/current counts;
2. Compare node taints against the DaemonSet's tolerations — a taint mismatch is the most common cause;
3. Check whether nodeSelector/affinity excludes those nodes;
4. For resource shortage, lower the DaemonSet's requests or free node resources.

### KubeDaemonSetRolloutStuck[​](#kubedaemonsetrolloutstuck "Direct link to KubeDaemonSetRolloutStuck")

DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} has not finished or progressed for at least 15 minutes.

Warning · 15m · Trigger:

```
(

  (

    kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  ) or (

    kube_daemonset_status_number_misscheduled{job="kube-state-metrics"}

      !=

    0

  ) or (

    kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  ) or (

    kube_daemonset_status_number_available{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  )

) and (

  changes(kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}[5m])

    ==

  0

)
```

Runbook:

1. Run kubectl rollout status ds/\<name> -n \<ns> to see which nodes are stuck;
2. Run kubectl describe pod to see why the new Pod is not ready;
3. If it cannot be fixed quickly, kubectl rollout undo ds/\<name>;
4. Check whether the updateStrategy maxUnavailable is too conservative.

### KubeDeploymentGenerationMismatch[​](#kubedeploymentgenerationmismatch "Direct link to KubeDeploymentGenerationMismatch")

Deployment generation for {{ $labels.namespace }}/{{ $labels.deployment }} does not match, this indicates that the Deployment has failed but has not been rolled back.

Warning · 15m · Trigger:

```
kube_deployment_status_observed_generation{job="kube-state-metrics"}

  !=

kube_deployment_metadata_generation{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe \<kind> \<name> -n \<ns> and compare generation with observedGeneration;
2. Check whether kube-controller-manager is healthy — a stalled controller is the most common cause;
3. Look for errors about this object in the controller-manager log;
4. Confirm apiserver and etcd are healthy; once the controller recovers, generation catches up automatically.

### KubeDeploymentReplicasMismatch[​](#kubedeploymentreplicasmismatch "Direct link to KubeDeploymentReplicasMismatch")

Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeDeploymentReplicasMismatch](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md)

### KubeDeploymentRolloutStuck[​](#kubedeploymentrolloutstuck "Direct link to KubeDeploymentRolloutStuck")

Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeDeploymentRolloutStuck](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentrolloutstuck.md)

### KubeHpaMaxedOut[​](#kubehpamaxedout "Direct link to KubeHpaMaxedOut")

HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }} has been running at max replicas for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeHpaMaxedOut](https://n9e.github.io/alert-rules/kubernetes/kubehpamaxedout.md)

### KubeHpaReplicasMismatch[​](#kubehpareplicasmismatch "Direct link to KubeHpaReplicasMismatch")

HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }} has not matched the desired number of replicas for longer than 15 minutes.

Warning · 15m · Trigger:

```
(kube_horizontalpodautoscaler_status_desired_replicas{job="kube-state-metrics"}

  !=

kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"})

  and

(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  >

kube_horizontalpodautoscaler_spec_min_replicas{job="kube-state-metrics"})

  and

(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  <

kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"})

  and

changes(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}[15m]) == 0
```

Runbook:

1. Run kubectl describe hpa \<name> -n \<ns> and read the reason in Conditions;
2. ScalingLimited means it hit the min/max boundary; FailedGetScale means the target workload has a problem;
3. For metric failures, check whether metrics-server or the custom metrics adapter is healthy;
4. If new replicas stay Pending for lack of resources, add nodes.

### KubeJobFailed[​](#kubejobfailed "Direct link to KubeJobFailed")

Job {{ $labels.namespace }}/{{ $labels.job\_name }} failed to complete. Removing failed job after investigation should clear this alert.

Warning · 15m · PromQL, common causes and runbook: [KubeJobFailed](https://n9e.github.io/alert-rules/kubernetes/kubejobfailed.md)

### KubeJobNotCompleted[​](#kubejobnotcompleted "Direct link to KubeJobNotCompleted")

Job {{ $labels.namespace }}/{{ $labels.job\_name }} is taking more than {{ "43200" | humanizeDuration }} to complete.

Warning · — · Trigger:

```
time() - max by(namespace, job_name, cluster) (kube_job_status_start_time{job="kube-state-metrics"}

  and

kube_job_status_active{job="kube-state-metrics"} > 0) > 43200
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for elapsed time and completions;
2. Run kubectl logs job/\<job> to see where it is stuck;
3. Determine whether the task is genuinely long-running or hung — for a hang, kubectl delete job, fix it and rerun;
4. Set a sensible activeDeadlineSeconds so Jobs cannot hang indefinitely.

### KubeletClientCertificateExpiration[​](#kubeletclientcertificateexpiration "Direct link to KubeletClientCertificateExpiration")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

Warning · — · Trigger:

```
kubelet_certificate_manager_client_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### KubeletClientCertificateRenewalErrors[​](#kubeletclientcertificaterenewalerrors "Direct link to KubeletClientCertificateRenewalErrors")

Kubelet on node {{ $labels.node }} has failed to renew its client certificate ({{ $value | humanize }} errors in the last 5 minutes).

Warning · 15m · Trigger:

```
increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
2. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
3. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
4. After fixing, confirm new CSRs are auto-approved and signed.

### KubeletDown[​](#kubeletdown "Direct link to KubeletDown")

Kubelet has disappeared from Prometheus target discovery.

Critical · 15m · PromQL, common causes and runbook: [KubeletDown](https://n9e.github.io/alert-rules/kubernetes/kubeletdown.md)

### KubeletPlegDurationHigh[​](#kubeletplegdurationhigh "Direct link to KubeletPlegDurationHigh")

The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of {{ $value }} seconds on node {{ $labels.node }}.

Warning · 5m · Trigger:

```
node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10
```

Runbook:

1. On the node run crictl ps and crictl info to gauge container runtime responsiveness;
2. Check whether the node has too many containers and whether disk IO is saturated — these are the main causes of slow PLEG;
3. For a stalled runtime, consider restarting containerd (briefly affects that node);
4. If it persists, reduce the Pod density on that node.

### KubeletPodStartUpLatencyHigh[​](#kubeletpodstartuplatencyhigh "Direct link to KubeletPodStartUpLatencyHigh")

Kubelet Pod startup 99th percentile latency is {{ $value }} seconds on node {{ $labels.node }}.

Warning · 15m · Trigger:

```
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le)) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
2. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
3. For slow mounts, check the PV/CSI driver state;
4. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

### KubeletServerCertificateExpiration[​](#kubeletservercertificateexpiration "Direct link to KubeletServerCertificateExpiration")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

Warning · — · Trigger:

```
kubelet_certificate_manager_server_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### KubeletServerCertificateRenewalErrors[​](#kubeletservercertificaterenewalerrors "Direct link to KubeletServerCertificateRenewalErrors")

Kubelet on node {{ $labels.node }} has failed to renew its server certificate ({{ $value | humanize }} errors in the last 5 minutes).

Warning · 15m · Trigger:

```
increase(kubelet_server_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
2. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
3. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
4. After fixing, confirm new CSRs are auto-approved and signed.

### KubeletTooManyPods[​](#kubelettoomanypods "Direct link to KubeletTooManyPods")

Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.

Info · 15m · PromQL, common causes and runbook: [KubeletTooManyPods](https://n9e.github.io/alert-rules/kubernetes/kubelettoomanypods.md)

### KubeMemoryOvercommit[​](#kubememoryovercommit "Direct link to KubeMemoryOvercommit")

Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure.

Warning · 10m · PromQL, common causes and runbook: [KubeMemoryOvercommit](https://n9e.github.io/alert-rules/kubernetes/kubememoryovercommit.md)

### KubeMemoryQuotaOvercommit[​](#kubememoryquotaovercommit "Direct link to KubeMemoryQuotaOvercommit")

Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Namespaces.

Warning · 5m · Trigger:

```
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(memory|requests.memory)"})) by (cluster)

  /

sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)

  > 1.5
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
2. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
3. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
4. If headroom is genuinely insufficient, add nodes.

### KubeNodeNotReady[​](#kubenodenotready "Direct link to KubeNodeNotReady")

{{ $labels.node }} has been unready for more than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeNodeNotReady](https://n9e.github.io/alert-rules/kubernetes/kubenodenotready.md)

### KubeNodeReadinessFlapping[​](#kubenodereadinessflapping "Direct link to KubeNodeReadinessFlapping")

The readiness status of node {{ $labels.node }} has changed {{ $value }} times in the last 15 minutes.

Warning · 15m · Trigger:

```
sum(changes(kube_node_status_condition{job="kube-state-metrics",status="true",condition="Ready"}[15m])) by (cluster, node) > 2
```

Runbook:

1. Run kubectl describe node \<node> and read the timeline of Condition changes;
2. On the node, check the kubelet log — common root causes are resource pressure, a stalled container runtime, or an unstable network to apiserver;
3. While it flaps, kubectl cordon the node so no new Pods land on it;
4. Uncordon only after the root cause is fixed — do not repeatedly restart kubelet during the flapping.

### KubeNodeUnreachable[​](#kubenodeunreachable "Direct link to KubeNodeUnreachable")

{{ $labels.node }} is unreachable and some workloads may be rescheduled.

Warning · 15m · Trigger:

```
(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1
```

Runbook:

1. First confirm the machine is alive with ping/ssh — if it is down, handle it as a host outage;
2. If it is alive, investigate the node's network and certificates to apiserver (the kubelet log states the error clearly);
3. Check whether any single-replica critical service runs on that node and start it elsewhere first;
4. After recovery, confirm the node is Ready again and Pod states are normal.

### KubePersistentVolumeErrors[​](#kubepersistentvolumeerrors "Direct link to KubePersistentVolumeErrors")

The persistent volume {{ $labels.persistentvolume }} has status {{ $labels.phase }}.

Critical · 5m · Trigger:

```
kube_persistentvolume_status_phase{phase=~"Failed|Pending",job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe pv \<pv> and kubectl describe pvc \<pvc> -n \<ns> and read the errors in Events;
2. Common causes are an unavailable storage backend, insufficient capacity, or wrong StorageClass parameters;
3. Check whether the CSI driver Pods are healthy (usually in kube-system);
4. For a storage backend failure, follow that system's own procedure — Pods stay Pending meanwhile.

### KubePersistentVolumeFillingUp[​](#kubepersistentvolumefillingup "Direct link to KubePersistentVolumeFillingUp")

The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free.

Critical · 1m · PromQL, common causes and runbook: [KubePersistentVolumeFillingUp](https://n9e.github.io/alert-rules/kubernetes/kubepersistentvolumefillingup.md)

### KubePersistentVolumeInodesFillingUp[​](#kubepersistentvolumeinodesfillingup "Direct link to KubePersistentVolumeInodesFillingUp")

The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} only has {{ $value | humanizePercentage }} free inodes.

Critical · 1m · Trigger:

```
(

  kubelet_volume_stats_inodes_free{job="kubelet", metrics_path="/metrics"}

    /

  kubelet_volume_stats_inodes{job="kubelet", metrics_path="/metrics"}

) < 0.03

and

kubelet_volume_stats_inodes_used{job="kubelet", metrics_path="/metrics"} > 0

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

Runbook:

1. kubectl exec into a Pod using the volume and run df -i;
2. Count files level by level to find the directories with the most small files;
3. Clean up useless small files (cache fragments, temporary files);
4. If it cannot be reduced, expand the volume or change storage type.

### KubePodCrashLooping[​](#kubepodcrashlooping "Direct link to KubePodCrashLooping")

Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: "CrashLoopBackOff").

Warning · 15m · PromQL, common causes and runbook: [KubePodCrashLooping](https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping.md)

### KubePodNotReady[​](#kubepodnotready "Direct link to KubePodNotReady")

Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md)

### KubeQuotaAlmostFull[​](#kubequotaalmostfull "Direct link to KubeQuotaAlmostFull")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

Info · 15m · PromQL, common causes and runbook: [KubeQuotaAlmostFull](https://n9e.github.io/alert-rules/kubernetes/kubequotaalmostfull.md)

### KubeQuotaExceeded[​](#kubequotaexceeded "Direct link to KubeQuotaExceeded")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

Warning · 15m · Trigger:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  > 1
```

Runbook:

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
2. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
3. Check for stopped-but-uncleaned resources still holding quota;
4. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

### KubeQuotaFullyUsed[​](#kubequotafullyused "Direct link to KubeQuotaFullyUsed")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

Info · 15m · Trigger:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  == 1
```

Runbook:

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
2. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
3. Check for stopped-but-uncleaned resources still holding quota;
4. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

### KubeSchedulerDown[​](#kubeschedulerdown "Direct link to KubeSchedulerDown")

KubeScheduler has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```
absent(up{job="kube-scheduler"} == 1)
```

Runbook:

1. On the control plane node, check the kube-scheduler static Pod or process state and logs;
2. For multi-replica deployments, confirm whether it merely lost leadership and another replica can take over;
3. Common root causes are an unavailable apiserver or certificate problems;
4. After recovery, confirm Pending Pods start being scheduled.

### KubeStatefulSetGenerationMismatch[​](#kubestatefulsetgenerationmismatch "Direct link to KubeStatefulSetGenerationMismatch")

StatefulSet generation for {{ $labels.namespace }}/{{ $labels.statefulset }} does not match, this indicates that the StatefulSet has failed but has not been rolled back.

Warning · 15m · Trigger:

```
kube_statefulset_status_observed_generation{job="kube-state-metrics"}

  !=

kube_statefulset_metadata_generation{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe \<kind> \<name> -n \<ns> and compare generation with observedGeneration;
2. Check whether kube-controller-manager is healthy — a stalled controller is the most common cause;
3. Look for errors about this object in the controller-manager log;
4. Confirm apiserver and etcd are healthy; once the controller recovers, generation catches up automatically.

### KubeStatefulSetReplicasMismatch[​](#kubestatefulsetreplicasmismatch "Direct link to KubeStatefulSetReplicasMismatch")

StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeStatefulSetReplicasMismatch](https://n9e.github.io/alert-rules/kubernetes/kubestatefulsetreplicasmismatch.md)

### KubeStatefulSetUpdateNotRolledOut[​](#kubestatefulsetupdatenotrolledout "Direct link to KubeStatefulSetUpdateNotRolledOut")

StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} update has not been rolled out.

Warning · 15m · Trigger:

```
(

  max without (revision) (

    kube_statefulset_status_current_revision{job="kube-state-metrics"}

      unless

    kube_statefulset_status_update_revision{job="kube-state-metrics"}

  )

    *

  (

    kube_statefulset_replicas{job="kube-state-metrics"}

      !=

    kube_statefulset_status_replicas_updated{job="kube-state-metrics"}

  )

)  and (

  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[5m])

    ==

  0

)
```

Runbook:

1. Run kubectl rollout status sts/\<name> -n \<ns> to see which replica it is stuck on;
2. StatefulSets update in order, so one stuck replica blocks all the rest — focus on the one currently updating;
3. Run kubectl describe pod to find why it is not ready (PVC, probe, image);
4. If it cannot be fixed quickly, kubectl rollout undo.

### KubeVersionMismatch[​](#kubeversionmismatch "Direct link to KubeVersionMismatch")

There are {{ $value }} different semantic versions of Kubernetes components running.

Warning · 15m · Trigger:

```
count by (cluster) (count by (git_version, cluster) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"},"git_version","$1","git_version","(v[0-9]*.[0-9]*).*"))) > 1
```

Runbook:

1. Run kubectl get node -o wide for kubelet versions and kubectl version for the control plane;
2. Confirm the skew is within the officially supported window (kubelet must not exceed apiserver and must not lag by more than two minor versions);
3. This usually means an unfinished upgrade — bring the lagging nodes up to date;
4. Before upgrading, confirm workload compatibility with the new API versions.

### Node running too many Pods[​](#node-running-too-many-pods "Direct link to Node running too many Pods")

Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.

Warning · 15m · Trigger:

```
count by(node) (

  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})

)

/

max by(node) (

  kube_node_status_capacity_pods{job="kube-state-metrics"} != 1

) > 0.95
```

Runbook:

1. Run kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l for the actual count;
2. Compare against the kubelet maxPods setting (110 by default);
3. Use kubectl drain or scheduling policy to move some Pods to other nodes;
4. If you genuinely need higher density, raise maxPods but reassess node CPU/memory/PLEG pressure at the same time.

### Node readiness flapping[​](#node-readiness-flapping "Direct link to Node readiness flapping")

The readiness status of node {{ $labels.node }} has changed {{ $value }} times in the last 15 minutes.

Warning · 15m · Trigger:

```
sum(changes(kube_node_status_condition{status="true",condition="Ready"}[15m])) by (node) > 2
```

Runbook:

1. Run kubectl describe node \<node> and read the timeline of Condition changes;
2. On the node, check the kubelet log — common root causes are resource pressure, a stalled container runtime, or an unstable network to apiserver;
3. While it flaps, kubectl cordon the node so no new Pods land on it;
4. Uncordon only after the root cause is fixed — do not repeatedly restart kubelet during the flapping.

### Pod startup duration high[​](#pod-startup-duration-high "Direct link to Pod startup duration high")

Kubelet Pod startup 99th percentile latency is {{ $value }} seconds on node {{ $labels.node }}.

Warning · 15m · Trigger:

```
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (instance, le)) * on(instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
2. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
3. For slow mounts, check the PV/CSI driver state;
4. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

### Client certificate expiring - S1[​](#client-certificate-expiring---s1 "Direct link to Client certificate expiring - S1")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

Critical · — · Trigger:

```
kubelet_certificate_manager_client_ttl_seconds < 86400
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### Server certificate expiring - S1[​](#server-certificate-expiring---s1 "Direct link to Server certificate expiring - S1")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

Critical · — · Trigger:

```
kubelet_certificate_manager_server_ttl_seconds < 86400
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### Kubelet down[​](#kubelet-down "Direct link to Kubelet down")

Kubelet has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```
absent(up{job="kubelet"} == 1)
```

Runbook:

1. On the node run systemctl status kubelet to check the process;
2. Use journalctl -u kubelet -n 200 --no-pager to find the exit or error reason;
3. Common causes are expired certificates, config errors and an unavailable container runtime;
4. After recovery, confirm the node is Ready again and check whether Pods were wrongly evicted meanwhile.

## How to use these rules[​](#how-to-use-these-rules "Direct link to How to use these rules")

* **With Prometheus or vmalert**: download [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
* **With Nightingale**: the same rules ship in the [Kubernetes](https://n9e.github.io/integrations/kubernetes.md) integration template. Open the integration center, [import the rules into a business group](https://n9e.github.io/docs/data/integrations/import.md), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

Many rule expressions are adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps and the remaining rules come from Nightingale's integration templates ([Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes), Apache-2.0). Corrections are welcome as pull requests there.

## Related[​](#related "Direct link to Related")

* [Monitor Kubernetes with Nightingale](https://n9e.github.io/integrations/kubernetes.md): collector config, dashboards and metric reference
* [Write a metric rule in Nightingale](https://n9e.github.io/docs/alerting/metric-rules.md)
* [All alert rules](https://n9e.github.io/alert-rules.md)
