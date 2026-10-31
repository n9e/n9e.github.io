---
title: "Kubernetes alert rules for Prometheus: 77 rules with runbooks"
sidebar_label: "Kubernetes"
sidebar_position: 1
description: "77 ready-to-use Kubernetes alert rules in PromQL, each with severity, duration and runbook steps. Metrics from kube-state-metrics, cAdvisor (kubelet), apiserver. Download as a Prometheus rules file or import into Nightingale."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes
toc_max_heading_level: 2
mdx:
  format: md
---

Alert rules for Kubernetes clusters built on the metrics every cluster already exposes: kube-state-metrics for object state, cAdvisor through the kubelet for container resources, and the apiserver, kubelet, scheduler and controller-manager endpoints for the control plane. They cover crash-looping and unready pods, stuck rollouts, replica mismatches, failed jobs, resource overcommit, quota pressure, certificate expiry and control-plane outages. Most rules keep the alert names used by kubernetes-mixin and kube-prometheus (KubePodCrashLooping, KubeNodeNotReady, KubeAPIErrorBudgetBurn…), so they match the names you already see in Alertmanager.

## At a glance

- **77 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
- **Metrics from**: kube-state-metrics, cAdvisor (kubelet), apiserver
- **Download**: [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
- Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list

| Rule | Severity | For |
| --- | --- | --- |
| Deployment Pod availability below 70% (replicas above 9 pods) | Critical | 1m |
| Job failed | Info | 1m |
| Pod startup timeout | Warning | 1m |
| Pod state abnormal | Critical | 1m |
| Pod restarting frequently | Warning | 1m |
| Container CPU usage exceeds 80% | Info | 1m |
| Container memory usage exceeds 80% | Info | 1m |
| Node CPU usage exceeds 90% | Info | 1m |
| Node memory usage exceeds 90% | Warning | 1m |
| Node not ready | Critical | 1m |
| Node disk usage exceeds 90% | Info | 1m |
| [KubeClientCertificateExpiration-S2](/alert-rules/kubernetes/kubeclientcertificateexpiration) | Warning | — |
| [KubeClientCertificateExpiration-S1](/alert-rules/kubernetes/kubeclientcertificateexpiration) | Critical | — |
| AggregatedAPIErrors | Warning | — |
| AggregatedAPIDown | Warning | 5m |
| KubeAPIDown | Critical | 15m |
| [KubeAPIErrorBudgetBurn-S1-120s](/alert-rules/kubernetes/kubeapierrorbudgetburn) | Critical | 2m |
| [KubeAPIErrorBudgetBurn-S1-900s](/alert-rules/kubernetes/kubeapierrorbudgetburn) | Critical | 15m |
| [KubeAPIErrorBudgetBurn-S2-3600s](/alert-rules/kubernetes/kubeapierrorbudgetburn) | Warning | 60m |
| [KubeAPIErrorBudgetBurn-S2-10800s](/alert-rules/kubernetes/kubeapierrorbudgetburn) | Warning | 180m |
| Deployment replicas mismatch | Warning | 10m |
| StatefulSet replicas mismatch | Warning | 10m |
| DaemonSet has unready Pods | Warning | 10m |
| HPA scaling failed | Warning | 5m |
| Pod in Failed state | Warning | 5m |
| Job failed | Warning | 5m |
| CPUThrottlingHigh | Info | 15m |
| [KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown) | Warning | 5m |
| KubeAggregatedAPIErrors | Warning | — |
| KubeAPITerminatedRequests | Warning | 5m |
| KubeClientErrors | Warning | 15m |
| [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting) | Warning | 60m |
| KubeControllerManagerDown | Critical | 15m |
| [KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit) | Warning | 10m |
| KubeCPUQuotaOvercommit | Warning | 5m |
| [KubeDaemonSetMisScheduled](/alert-rules/kubernetes/kubedaemonsetmisscheduled) | Warning | 15m |
| KubeDaemonSetNotScheduled | Warning | 10m |
| KubeDaemonSetRolloutStuck | Warning | 15m |
| KubeDeploymentGenerationMismatch | Warning | 15m |
| [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch) | Warning | 15m |
| [KubeDeploymentRolloutStuck](/alert-rules/kubernetes/kubedeploymentrolloutstuck) | Warning | 15m |
| [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout) | Warning | 15m |
| KubeHpaReplicasMismatch | Warning | 15m |
| [KubeJobFailed](/alert-rules/kubernetes/kubejobfailed) | Warning | 15m |
| KubeJobNotCompleted | Warning | — |
| KubeletClientCertificateExpiration | Warning | — |
| KubeletClientCertificateRenewalErrors | Warning | 15m |
| [KubeletDown](/alert-rules/kubernetes/kubeletdown) | Critical | 15m |
| KubeletPlegDurationHigh | Warning | 5m |
| KubeletPodStartUpLatencyHigh | Warning | 15m |
| KubeletServerCertificateExpiration | Warning | — |
| KubeletServerCertificateRenewalErrors | Warning | 15m |
| [KubeletTooManyPods](/alert-rules/kubernetes/kubelettoomanypods) | Info | 15m |
| [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit) | Warning | 10m |
| KubeMemoryQuotaOvercommit | Warning | 5m |
| [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready) | Warning | 15m |
| KubeNodeReadinessFlapping | Warning | 15m |
| KubeNodeUnreachable | Warning | 15m |
| KubePersistentVolumeErrors | Critical | 5m |
| [KubePersistentVolumeFillingUp](/alert-rules/kubernetes/kubepersistentvolumefillingup) | Critical | 1m |
| KubePersistentVolumeInodesFillingUp | Critical | 1m |
| [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping) | Warning | 15m |
| [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready) | Warning | 15m |
| [KubeQuotaAlmostFull](/alert-rules/kubernetes/kubequotaalmostfull) | Info | 15m |
| KubeQuotaExceeded | Warning | 15m |
| KubeQuotaFullyUsed | Info | 15m |
| KubeSchedulerDown | Critical | 15m |
| KubeStatefulSetGenerationMismatch | Warning | 15m |
| [KubeStatefulSetReplicasMismatch](/alert-rules/kubernetes/kubestatefulsetreplicasmismatch) | Warning | 15m |
| KubeStatefulSetUpdateNotRolledOut | Warning | 15m |
| KubeVersionMismatch | Warning | 15m |
| Node running too many Pods | Warning | 15m |
| Node readiness flapping | Warning | 15m |
| Pod startup duration high | Warning | 15m |
| Client certificate expiring - S1 | Critical | — |
| Server certificate expiring - S1 | Critical | — |
| Kubelet down | Critical | 15m |

## kube-state-metrics, cAdvisor and control plane (77)

### Deployment Pod availability below 70% (replicas above 9 pods)

Critical · 1m · Trigger:

```promql
kube_deployment_status_replicas_unavailable and kube_deployment_status_replicas_available{} / kube_deployment_status_replicas{} * 100 < 70 and kube_deployment_status_replicas{} > 9
```

Runbook:

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
1. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
1. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
1. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

### Job failed

Info · 1m · Trigger:

```promql
kube_job_status_failed{} > 0
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
1. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
1. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
1. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

### Pod startup timeout

Warning · 1m · Trigger:

```promql
kube_pod_container_status_waiting_reason{} == 1
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
1. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
1. For slow mounts, check the PV/CSI driver state;
1. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

### Pod state abnormal

Critical · 1m · Trigger:

```promql
kube_pod_status_phase{phase=~"Pending|Unknown|Failed"} > 0
```

Runbook:

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
1. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
1. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
1. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

### Pod restarting frequently

Warning · 1m · Trigger:

```promql
increase(kube_pod_container_status_restarts_total{}[5m]) > 3
```

Runbook:

1. Run kubectl logs \<pod> -n \<ns> --previous to see the log before the last exit — this is the key step;
1. Run kubectl describe pod for the exit code and Events: 137 usually means OOM or killed, 1/2 usually means the application failed to start;
1. For config or dependency problems (unreachable database, missing ConfigMap/Secret), fix the dependency first;
1. For OOM, compare resources.limits.memory against actual usage, or fix the application's memory leak.

### Container CPU usage exceeds 80%

Info · 1m · Trigger:

```promql
100 * (sum(rate(container_cpu_usage_seconds_total{id!="/"}[2m])) by (pod_name,namespace,container) / sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.*)")) by (pod_name,namespace,container)) > 80 and sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.)")) by (pod_name,namespace,container) != 0
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers to compare actual usage against the limit;
1. Check the CPUThrottlingHigh metric to confirm whether it is already being throttled;
1. For genuine growth, raise resources.limits.cpu or scale out with an HPA;
1. For abnormal usage, capture a CPU profile in the application rather than papering over it with more quota.

### Container memory usage exceeds 80%

Info · 1m · Trigger:

```promql
(sum(container_memory_working_set_bytes{id!="/"}) BY (instance,name,container,pod_name,namespace) / sum(container_spec_memory_limit_bytes{id!="/"} > 0) BY (instance,name,container,pod_name,namespace) * 100) > 80
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers to compare usage against the limit;
1. Check the history curve to tell a steady climb (likely a leak) from a normal traffic peak;
1. For normal peaks, raise resources.limits.memory with headroom;
1. For a steady climb, capture a heap profile in the application — raising the quota only postpones it.

### Node CPU usage exceeds 90%

Info · 1m · Trigger:

```promql
100-cpu_usage_idle{cpu="cpu-total"} > 90
```

Runbook:

1. Run kubectl top node for the overall picture and kubectl top pod -A --sort-by=cpu for the biggest consumers;
1. Check whether too many high-load Pods landed on this node and drain some if needed;
1. Check whether Pod requests are set too low, causing overcommit;
1. If the cluster is running hot overall, add nodes.

### Node memory usage exceeds 90%

Warning · 1m · Trigger:

```promql
mem_used_percent > 90
```

Runbook:

1. Run kubectl top node and kubectl top pod -A --sort-by=memory to find the biggest consumers;
1. Check for Pods without a memory limit growing without bound;
1. Use kubectl drain to move some Pods off, confirming the target nodes have headroom;
1. Review the kubelet eviction thresholds, and add nodes if the cluster is tight overall.

### Node not ready

Critical · 1m · Trigger:

```promql
kube_node_status_condition{condition="Ready",status="true"} == 0
```

Runbook:

1. Run kubectl describe node \<node> for Conditions and Events to tell MemoryPressure, DiskPressure and a lost kubelet apart;
1. Log in to the node and check kubelet and the container runtime (systemctl status kubelet containerd);
1. Use journalctl -u kubelet -n 200 to locate the problem;
1. If the node cannot recover soon, run kubectl drain so the Pods move promptly instead of waiting for the eviction timeout.

### Node disk usage exceeds 90%

Info · 1m · Trigger:

```promql
disk_used_percent > 90
```

Runbook:

1. On the node run df -h to find the mount point, usually /var/lib/docker or /var/lib/containerd;
1. Run crictl rmi --prune or docker system prune to clean unused image layers — the fastest win;
1. Check whether a Pod is writing large amounts of data to an emptyDir or hostPath;
1. After cleaning, confirm the kubelet DiskPressure taint was removed automatically.

### KubeClientCertificateExpiration-S2

A client certificate used to authenticate to the apiserver is expiring in less than 7.0 days.

Warning · — · PromQL, common causes and runbook: [KubeClientCertificateExpiration](/alert-rules/kubernetes/kubeclientcertificateexpiration)

### KubeClientCertificateExpiration-S1

A client certificate used to authenticate to the apiserver is expiring in less than 24.0 hours.

Critical · — · PromQL, common causes and runbook: [KubeClientCertificateExpiration](/alert-rules/kubernetes/kubeclientcertificateexpiration)

### AggregatedAPIErrors

An aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has reported errors. The number of errors have increased for it in the past five minutes. High values indicate that the availability of the service changes too often.

Warning · — · Trigger:

```promql
sum by(name, namespace)(increase(aggregator_unavailable_apiservice_count[5m])) > 2
```

Runbook:

1. Run kubectl get apiservice to see which APIService is False;
1. Run kubectl describe apiservice \<name> for the specific error;
1. If the backing service is down, check its Deployment/Service health (commonly metrics-server);
1. For certificate problems, verify the CA bundle configuration.

### AggregatedAPIDown

An aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has been only \{\{ $value | humanize \}\}% available over the last 10m.

Warning · 5m · Trigger:

```promql
(1 - max by(name, namespace)(avg_over_time(aggregator_unavailable_apiservice[10m]))) * 100 < 85
```

Runbook:

1. Run kubectl get apiservice to identify the APIService;
1. Run kubectl -n \<ns> get pod to check its backing Pods;
1. Read that Pod's logs for startup or runtime errors;
1. After recovery, verify with something like kubectl top node that the functionality is back.

### KubeAPIDown

KubeAPI has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```promql
absent(up{job="apiserver"} == 1)
```

Runbook:

1. On the control plane node, check the kube-apiserver process/static Pod state and logs;
1. For multi-replica deployments, confirm whether only some instances are down and whether the load balancer removed the faulty ones;
1. Common root causes are unavailable etcd, expired certificates and resource exhaustion;
1. Restore etcd and certificates first — apiserver usually recovers on its own.

### KubeAPIErrorBudgetBurn-S1-120s

The API server is burning too much error budget.

Critical · 2m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### KubeAPIErrorBudgetBurn-S1-900s

The API server is burning too much error budget.

Critical · 15m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### KubeAPIErrorBudgetBurn-S2-3600s

The API server is burning too much error budget.

Warning · 60m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### KubeAPIErrorBudgetBurn-S2-10800s

The API server is burning too much error budget.

Warning · 180m · PromQL, common causes and runbook: [KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### Deployment replicas mismatch

Deployment \{\{ $labels.deployment \}\} in namespace \{\{ $labels.namespace \}\} has mismatched replicas.

Warning · 10m · Trigger:

```promql
kube_deployment_spec_replicas{job="kube-state-metrics"} != kube_deployment_status_replicas_available{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
1. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
1. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
1. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

### StatefulSet replicas mismatch

StatefulSet \{\{ $labels.statefulset \}\} in namespace \{\{ $labels.namespace \}\} has mismatched replicas.

Warning · 10m · Trigger:

```promql
kube_statefulset_status_replicas_ready{job="kube-state-metrics"} != kube_statefulset_spec_replicas{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl get pod -n \<ns> -l \<selector> and check by ordinal which replica is stuck;
1. Run kubectl describe pod to check whether its PVC bound successfully — this is the most common sticking point for stateful services;
1. For storage problems, check the PV/StorageClass and the CSI driver;
1. For application problems check kubectl logs; once fixed, the StatefulSet continues automatically.

### DaemonSet has unready Pods

DaemonSet \{\{ $labels.daemonset \}\} in namespace \{\{ $labels.namespace \}\} has unready pods.

Warning · 10m · Trigger:

```promql
kube_daemonset_status_number_ready{job="kube-state-metrics"} < kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe ds \<name> -n \<ns> for Events and desired/current counts;
1. Compare node taints against the DaemonSet's tolerations — a taint mismatch is the most common cause;
1. Check whether nodeSelector/affinity excludes those nodes;
1. For resource shortage, lower the DaemonSet's requests or free node resources.

### HPA scaling failed

HPA \{\{ $labels.hpa \}\} in namespace \{\{ $labels.namespace \}\} has scale up failures.

Warning · 5m · Trigger:

```promql
kube_hpa_status_failed_scale_up_total{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe hpa \<name> -n \<ns> and read the reason in Conditions;
1. ScalingLimited means it hit the min/max boundary; FailedGetScale means the target workload has a problem;
1. For metric failures, check whether metrics-server or the custom metrics adapter is healthy;
1. If new replicas stay Pending for lack of resources, add nodes.

### Pod in Failed state

Pod \{\{ $labels.pod \}\} in namespace \{\{ $labels.namespace \}\} has failed.

Warning · 5m · Trigger:

```promql
kube_pod_status_phase{job="kube-state-metrics",phase="Failed"} == 1
```

Runbook:

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
1. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
1. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
1. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

### Job failed

Job \{\{ $labels.job_name \}\} in namespace \{\{ $labels.namespace \}\} has failed.

Warning · 5m · Trigger:

```promql
kube_job_status_failed{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
1. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
1. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
1. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

### CPUThrottlingHigh

\{\{ $value | humanizePercentage \}\} throttling of CPU in namespace \{\{ $labels.namespace \}\} for container \{\{ $labels.container \}\} in pod \{\{ $labels.pod \}\}.

Info · 15m · Trigger:

```promql
sum(increase(container_cpu_cfs_throttled_periods_total{container!="", }[5m])) by (container, pod, namespace)
  /
sum(increase(container_cpu_cfs_periods_total{}[5m])) by (container, pod, namespace)
  > ( 25 / 100 )
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers and compare against resources.limits.cpu;
1. Note that runtimes like Java that do not detect the cgroup limit may spawn too many threads and worsen throttling — check the JVM version and flags;
1. Raise limits.cpu, or scale out horizontally with an HPA;
1. A limit far above the request is easily squeezed by overcommit — consider bringing them closer together.

### KubeAggregatedAPIDown

Kubernetes aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has been only \{\{ $value | humanize \}\}% available over the last 10m.

Warning · 5m · PromQL, common causes and runbook: [KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown)

### KubeAggregatedAPIErrors

Kubernetes aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has reported errors. It has appeared unavailable \{\{ $value | humanize \}\} times averaged over the past 10m.

Warning · — · Trigger:

```promql
sum by(name, namespace, cluster)(increase(aggregator_unavailable_apiservice_total{job="apiserver"}[10m])) > 4
```

Runbook:

1. Run kubectl get apiservice to see which one is False;
1. Run kubectl describe apiservice \<name> for the specific error;
1. If the backing service is down, check its Deployment/Service;
1. For certificate problems, verify the CA bundle configuration.

### KubeAPITerminatedRequests

The kubernetes apiserver has terminated \{\{ $value | humanizePercentage \}\} of its incoming requests.

Warning · 5m · Trigger:

```promql
sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m]))  / (  sum(rate(apiserver_request_total{job="apiserver"}[10m])) + sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m])) ) > 0.20
```

Runbook:

1. Check the apiserver_flowcontrol metrics to see which flow schema is being throttled;
1. Identify the client making the flood of requests (usually an Operator or script doing full LIST calls);
1. Rate limit that client or fix its request pattern;
1. If more capacity is genuinely needed, tune the FlowSchema and PriorityLevelConfiguration.

### KubeClientErrors

Kubernetes API server client '\{\{ $labels.job \}\}/\{\{ $labels.instance \}\}' is experiencing \{\{ $value | humanizePercentage \}\} errors.'

Warning · 15m · Trigger:

```promql
(sum(rate(rest_client_requests_total{job="apiserver",code=~"5.."}[5m])) by (cluster, instance, job, namespace)
  /
sum(rate(rest_client_requests_total{job="apiserver"}[5m])) by (cluster, instance, job, namespace))
> 0.01
```

Runbook:

1. Use the alert labels to identify the component/instance that is erroring;
1. Read the specific error code in that component's log: 401/403 is an RBAC problem, 429 is throttling, 5xx is an apiserver-side problem;
1. For permissions, verify the ServiceAccount's Role/ClusterRoleBinding;
1. For throttling, check whether the component is doing high-frequency LIST calls and switch to Watch or add a resourceVersion.

### KubeContainerWaiting

pod/\{\{ $labels.pod \}\} in namespace \{\{ $labels.namespace \}\} on container \{\{ $labels.container\}\} has been in waiting state for longer than 1 hour.

Warning · 60m · PromQL, common causes and runbook: [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting)

### KubeControllerManagerDown

KubeControllerManager has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```promql
absent(up{job="kube-controller-manager"} == 1)
```

Runbook:

1. On the control plane node, check the kube-controller-manager static Pod or process state and logs;
1. For multi-replica deployments, confirm leader election is failing over correctly;
1. Common root causes are an unavailable apiserver or expired certificates;
1. After recovery, confirm workloads with wrong replica counts start self-healing.

### KubeCPUOvercommit

Cluster \{\{ $labels.cluster \}\} has overcommitted CPU resource requests for Pods by \{\{ $value \}\} CPU shares and cannot tolerate node failure.

Warning · 10m · PromQL, common causes and runbook: [KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit)

### KubeCPUQuotaOvercommit

Cluster \{\{ $labels.cluster \}\}  has overcommitted CPU resource requests for Namespaces.

Warning · 5m · Trigger:

```promql
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(cpu|requests.cpu)"})) by (cluster)
  /
sum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"}) by (cluster)
  > 1.5
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
1. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
1. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
1. If headroom is genuinely insufficient, add nodes.

### KubeDaemonSetMisScheduled

\{\{ $value \}\} Pods of DaemonSet \{\{ $labels.namespace \}\}/\{\{ $labels.daemonset \}\} are running where they are not supposed to run.

Warning · 15m · PromQL, common causes and runbook: [KubeDaemonSetMisScheduled](/alert-rules/kubernetes/kubedaemonsetmisscheduled)

### KubeDaemonSetNotScheduled

\{\{ $value \}\} Pods of DaemonSet \{\{ $labels.namespace \}\}/\{\{ $labels.daemonset \}\} are not scheduled.

Warning · 10m · Trigger:

```promql
kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
  -
kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe ds \<name> -n \<ns> for Events and desired/current counts;
1. Compare node taints against the DaemonSet's tolerations — a taint mismatch is the most common cause;
1. Check whether nodeSelector/affinity excludes those nodes;
1. For resource shortage, lower the DaemonSet's requests or free node resources.

### KubeDaemonSetRolloutStuck

DaemonSet \{\{ $labels.namespace \}\}/\{\{ $labels.daemonset \}\} has not finished or progressed for at least 15 minutes.

Warning · 15m · Trigger:

```promql
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
1. Run kubectl describe pod to see why the new Pod is not ready;
1. If it cannot be fixed quickly, kubectl rollout undo ds/\<name>;
1. Check whether the updateStrategy maxUnavailable is too conservative.

### KubeDeploymentGenerationMismatch

Deployment generation for \{\{ $labels.namespace \}\}/\{\{ $labels.deployment \}\} does not match, this indicates that the Deployment has failed but has not been rolled back.

Warning · 15m · Trigger:

```promql
kube_deployment_status_observed_generation{job="kube-state-metrics"}
  !=
kube_deployment_metadata_generation{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe \<kind> \<name> -n \<ns> and compare generation with observedGeneration;
1. Check whether kube-controller-manager is healthy — a stalled controller is the most common cause;
1. Look for errors about this object in the controller-manager log;
1. Confirm apiserver and etcd are healthy; once the controller recovers, generation catches up automatically.

### KubeDeploymentReplicasMismatch

Deployment \{\{ $labels.namespace \}\}/\{\{ $labels.deployment \}\} has not matched the expected number of replicas for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch)

### KubeDeploymentRolloutStuck

Rollout of deployment \{\{ $labels.namespace \}\}/\{\{ $labels.deployment \}\} is not progressing for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeDeploymentRolloutStuck](/alert-rules/kubernetes/kubedeploymentrolloutstuck)

### KubeHpaMaxedOut

HPA \{\{ $labels.namespace \}\}/\{\{ $labels.horizontalpodautoscaler  \}\} has been running at max replicas for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout)

### KubeHpaReplicasMismatch

HPA \{\{ $labels.namespace \}\}/\{\{ $labels.horizontalpodautoscaler  \}\} has not matched the desired number of replicas for longer than 15 minutes.

Warning · 15m · Trigger:

```promql
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
1. ScalingLimited means it hit the min/max boundary; FailedGetScale means the target workload has a problem;
1. For metric failures, check whether metrics-server or the custom metrics adapter is healthy;
1. If new replicas stay Pending for lack of resources, add nodes.

### KubeJobFailed

Job \{\{ $labels.namespace \}\}/\{\{ $labels.job_name \}\} failed to complete. Removing failed job after investigation should clear this alert.

Warning · 15m · PromQL, common causes and runbook: [KubeJobFailed](/alert-rules/kubernetes/kubejobfailed)

### KubeJobNotCompleted

Job \{\{ $labels.namespace \}\}/\{\{ $labels.job_name \}\} is taking more than \{\{ "43200" | humanizeDuration \}\} to complete.

Warning · — · Trigger:

```promql
time() - max by(namespace, job_name, cluster) (kube_job_status_start_time{job="kube-state-metrics"}
  and
kube_job_status_active{job="kube-state-metrics"} > 0) > 43200
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for elapsed time and completions;
1. Run kubectl logs job/\<job> to see where it is stuck;
1. Determine whether the task is genuinely long-running or hung — for a hang, kubectl delete job, fix it and rerun;
1. Set a sensible activeDeadlineSeconds so Jobs cannot hang indefinitely.

### KubeletClientCertificateExpiration

Client certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

Warning · — · Trigger:

```promql
kubelet_certificate_manager_client_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
1. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
1. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
1. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### KubeletClientCertificateRenewalErrors

Kubelet on node \{\{ $labels.node \}\} has failed to renew its client certificate (\{\{ $value | humanize \}\} errors in the last 5 minutes).

Warning · 15m · Trigger:

```promql
increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
1. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
1. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
1. After fixing, confirm new CSRs are auto-approved and signed.

### KubeletDown

Kubelet has disappeared from Prometheus target discovery.

Critical · 15m · PromQL, common causes and runbook: [KubeletDown](/alert-rules/kubernetes/kubeletdown)

### KubeletPlegDurationHigh

The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of \{\{ $value \}\} seconds on node \{\{ $labels.node \}\}.

Warning · 5m · Trigger:

```promql
node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10
```

Runbook:

1. On the node run crictl ps and crictl info to gauge container runtime responsiveness;
1. Check whether the node has too many containers and whether disk IO is saturated — these are the main causes of slow PLEG;
1. For a stalled runtime, consider restarting containerd (briefly affects that node);
1. If it persists, reduce the Pod density on that node.

### KubeletPodStartUpLatencyHigh

Kubelet Pod startup 99th percentile latency is \{\{ $value \}\} seconds on node \{\{ $labels.node \}\}.

Warning · 15m · Trigger:

```promql
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le)) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
1. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
1. For slow mounts, check the PV/CSI driver state;
1. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

### KubeletServerCertificateExpiration

Server certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

Warning · — · Trigger:

```promql
kubelet_certificate_manager_server_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
1. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
1. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
1. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### KubeletServerCertificateRenewalErrors

Kubelet on node \{\{ $labels.node \}\} has failed to renew its server certificate (\{\{ $value | humanize \}\} errors in the last 5 minutes).

Warning · 15m · Trigger:

```promql
increase(kubelet_server_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
1. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
1. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
1. After fixing, confirm new CSRs are auto-approved and signed.

### KubeletTooManyPods

Kubelet '\{\{ $labels.node \}\}' is running at \{\{ $value | humanizePercentage \}\} of its Pod capacity.

Info · 15m · PromQL, common causes and runbook: [KubeletTooManyPods](/alert-rules/kubernetes/kubelettoomanypods)

### KubeMemoryOvercommit

Cluster \{\{ $labels.cluster \}\} has overcommitted memory resource requests for Pods by \{\{ $value | humanize \}\} bytes and cannot tolerate node failure.

Warning · 10m · PromQL, common causes and runbook: [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit)

### KubeMemoryQuotaOvercommit

Cluster \{\{ $labels.cluster \}\}  has overcommitted memory resource requests for Namespaces.

Warning · 5m · Trigger:

```promql
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(memory|requests.memory)"})) by (cluster)
  /
sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)
  > 1.5
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
1. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
1. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
1. If headroom is genuinely insufficient, add nodes.

### KubeNodeNotReady

\{\{ $labels.node \}\} has been unready for more than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready)

### KubeNodeReadinessFlapping

The readiness status of node \{\{ $labels.node \}\} has changed \{\{ $value \}\} times in the last 15 minutes.

Warning · 15m · Trigger:

```promql
sum(changes(kube_node_status_condition{job="kube-state-metrics",status="true",condition="Ready"}[15m])) by (cluster, node) > 2
```

Runbook:

1. Run kubectl describe node \<node> and read the timeline of Condition changes;
1. On the node, check the kubelet log — common root causes are resource pressure, a stalled container runtime, or an unstable network to apiserver;
1. While it flaps, kubectl cordon the node so no new Pods land on it;
1. Uncordon only after the root cause is fixed — do not repeatedly restart kubelet during the flapping.

### KubeNodeUnreachable

\{\{ $labels.node \}\} is unreachable and some workloads may be rescheduled.

Warning · 15m · Trigger:

```promql
(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1
```

Runbook:

1. First confirm the machine is alive with ping/ssh — if it is down, handle it as a host outage;
1. If it is alive, investigate the node's network and certificates to apiserver (the kubelet log states the error clearly);
1. Check whether any single-replica critical service runs on that node and start it elsewhere first;
1. After recovery, confirm the node is Ready again and Pod states are normal.

### KubePersistentVolumeErrors

The persistent volume \{\{ $labels.persistentvolume \}\} has status \{\{ $labels.phase \}\}.

Critical · 5m · Trigger:

```promql
kube_persistentvolume_status_phase{phase=~"Failed|Pending",job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe pv \<pv> and kubectl describe pvc \<pvc> -n \<ns> and read the errors in Events;
1. Common causes are an unavailable storage backend, insufficient capacity, or wrong StorageClass parameters;
1. Check whether the CSI driver Pods are healthy (usually in kube-system);
1. For a storage backend failure, follow that system's own procedure — Pods stay Pending meanwhile.

### KubePersistentVolumeFillingUp

The PersistentVolume claimed by \{\{ $labels.persistentvolumeclaim \}\} in Namespace \{\{ $labels.namespace \}\} is only \{\{ $value | humanizePercentage \}\} free.

Critical · 1m · PromQL, common causes and runbook: [KubePersistentVolumeFillingUp](/alert-rules/kubernetes/kubepersistentvolumefillingup)

### KubePersistentVolumeInodesFillingUp

The PersistentVolume claimed by \{\{ $labels.persistentvolumeclaim \}\} in Namespace \{\{ $labels.namespace \}\} only has \{\{ $value | humanizePercentage \}\} free inodes.

Critical · 1m · Trigger:

```promql
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
1. Count files level by level to find the directories with the most small files;
1. Clean up useless small files (cache fragments, temporary files);
1. If it cannot be reduced, expand the volume or change storage type.

### KubePodCrashLooping

Pod \{\{ $labels.namespace \}\}/\{\{ $labels.pod \}\} (\{\{ $labels.container \}\}) is in waiting state (reason: "CrashLoopBackOff").

Warning · 15m · PromQL, common causes and runbook: [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping)

### KubePodNotReady

Pod \{\{ $labels.namespace \}\}/\{\{ $labels.pod \}\} has been in a non-ready state for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready)

### KubeQuotaAlmostFull

Namespace \{\{ $labels.namespace \}\} is using \{\{ $value | humanizePercentage \}\} of its \{\{ $labels.resource \}\} quota.

Info · 15m · PromQL, common causes and runbook: [KubeQuotaAlmostFull](/alert-rules/kubernetes/kubequotaalmostfull)

### KubeQuotaExceeded

Namespace \{\{ $labels.namespace \}\} is using \{\{ $value | humanizePercentage \}\} of its \{\{ $labels.resource \}\} quota.

Warning · 15m · Trigger:

```promql
kube_resourcequota{job="kube-state-metrics", type="used"}
  / ignoring(instance, job, type)
(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)
  > 1
```

Runbook:

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
1. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
1. Check for stopped-but-uncleaned resources still holding quota;
1. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

### KubeQuotaFullyUsed

Namespace \{\{ $labels.namespace \}\} is using \{\{ $value | humanizePercentage \}\} of its \{\{ $labels.resource \}\} quota.

Info · 15m · Trigger:

```promql
kube_resourcequota{job="kube-state-metrics", type="used"}
  / ignoring(instance, job, type)
(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)
  == 1
```

Runbook:

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
1. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
1. Check for stopped-but-uncleaned resources still holding quota;
1. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

### KubeSchedulerDown

KubeScheduler has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```promql
absent(up{job="kube-scheduler"} == 1)
```

Runbook:

1. On the control plane node, check the kube-scheduler static Pod or process state and logs;
1. For multi-replica deployments, confirm whether it merely lost leadership and another replica can take over;
1. Common root causes are an unavailable apiserver or certificate problems;
1. After recovery, confirm Pending Pods start being scheduled.

### KubeStatefulSetGenerationMismatch

StatefulSet generation for \{\{ $labels.namespace \}\}/\{\{ $labels.statefulset \}\} does not match, this indicates that the StatefulSet has failed but has not been rolled back.

Warning · 15m · Trigger:

```promql
kube_statefulset_status_observed_generation{job="kube-state-metrics"}
  !=
kube_statefulset_metadata_generation{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe \<kind> \<name> -n \<ns> and compare generation with observedGeneration;
1. Check whether kube-controller-manager is healthy — a stalled controller is the most common cause;
1. Look for errors about this object in the controller-manager log;
1. Confirm apiserver and etcd are healthy; once the controller recovers, generation catches up automatically.

### KubeStatefulSetReplicasMismatch

StatefulSet \{\{ $labels.namespace \}\}/\{\{ $labels.statefulset \}\} has not matched the expected number of replicas for longer than 15 minutes.

Warning · 15m · PromQL, common causes and runbook: [KubeStatefulSetReplicasMismatch](/alert-rules/kubernetes/kubestatefulsetreplicasmismatch)

### KubeStatefulSetUpdateNotRolledOut

StatefulSet \{\{ $labels.namespace \}\}/\{\{ $labels.statefulset \}\} update has not been rolled out.

Warning · 15m · Trigger:

```promql
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
1. StatefulSets update in order, so one stuck replica blocks all the rest — focus on the one currently updating;
1. Run kubectl describe pod to find why it is not ready (PVC, probe, image);
1. If it cannot be fixed quickly, kubectl rollout undo.

### KubeVersionMismatch

There are \{\{ $value \}\} different semantic versions of Kubernetes components running.

Warning · 15m · Trigger:

```promql
count by (cluster) (count by (git_version, cluster) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"},"git_version","$1","git_version","(v[0-9]*.[0-9]*).*"))) > 1
```

Runbook:

1. Run kubectl get node -o wide for kubelet versions and kubectl version for the control plane;
1. Confirm the skew is within the officially supported window (kubelet must not exceed apiserver and must not lag by more than two minor versions);
1. This usually means an unfinished upgrade — bring the lagging nodes up to date;
1. Before upgrading, confirm workload compatibility with the new API versions.

### Node running too many Pods

Kubelet '\{\{ $labels.node \}\}' is running at \{\{ $value | humanizePercentage \}\} of its Pod capacity.

Warning · 15m · Trigger:

```promql
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
1. Compare against the kubelet maxPods setting (110 by default);
1. Use kubectl drain or scheduling policy to move some Pods to other nodes;
1. If you genuinely need higher density, raise maxPods but reassess node CPU/memory/PLEG pressure at the same time.

### Node readiness flapping

The readiness status of node \{\{ $labels.node \}\} has changed \{\{ $value \}\} times in the last 15 minutes.

Warning · 15m · Trigger:

```promql
sum(changes(kube_node_status_condition{status="true",condition="Ready"}[15m])) by (node) > 2
```

Runbook:

1. Run kubectl describe node \<node> and read the timeline of Condition changes;
1. On the node, check the kubelet log — common root causes are resource pressure, a stalled container runtime, or an unstable network to apiserver;
1. While it flaps, kubectl cordon the node so no new Pods land on it;
1. Uncordon only after the root cause is fixed — do not repeatedly restart kubelet during the flapping.

### Pod startup duration high

Kubelet Pod startup 99th percentile latency is \{\{ $value \}\} seconds on node \{\{ $labels.node \}\}.

Warning · 15m · Trigger:

```promql
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (instance, le)) * on(instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
1. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
1. For slow mounts, check the PV/CSI driver state;
1. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

### Client certificate expiring - S1

Client certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

Critical · — · Trigger:

```promql
kubelet_certificate_manager_client_ttl_seconds < 86400
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
1. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
1. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
1. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### Server certificate expiring - S1

Server certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

Critical · — · Trigger:

```promql
kubelet_certificate_manager_server_ttl_seconds < 86400
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
1. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
1. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
1. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

### Kubelet down

Kubelet has disappeared from Prometheus target discovery.

Critical · 15m · Trigger:

```promql
absent(up{job="kubelet"} == 1)
```

Runbook:

1. On the node run systemctl status kubelet to check the process;
1. Use journalctl -u kubelet -n 200 --no-pager to find the exit or error reason;
1. Common causes are expired certificates, config errors and an unavailable container runtime;
1. After recovery, confirm the node is Ready again and check whether Pods were wrongly evicted meanwhile.

## How to use these rules

- **With Prometheus or vmalert**: download [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
- **With Nightingale**: the same rules ship in the [Kubernetes](/integrations/kubernetes) integration template. Open the integration center, [import the rules into a business group](/docs/data/integrations/import), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license

Many rule expressions are adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps and the remaining rules come from Nightingale's integration templates ([Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes), Apache-2.0). Corrections are welcome as pull requests there.

## Related

- [Monitor Kubernetes with Nightingale](/integrations/kubernetes): collector config, dashboards and metric reference
- [Write a metric rule in Nightingale](/docs/alerting/metric-rules)
- [All alert rules](/alert-rules)
