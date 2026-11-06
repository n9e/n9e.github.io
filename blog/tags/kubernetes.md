# One post tagged with "Kubernetes"

Monitoring and alerting on Kubernetes clusters.

[View all tags](https://n9e.io/blog/tags.md)

## [kube-state-metrics vs metrics-server: which should you use?](https://n9e.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

November 1, 2026 ·

<!-- -->

9 min read

Eric Qin

![Four Kubernetes metric sources: kube-state-metrics, cAdvisor, node\_exporter and metrics-server](https://n9e.io/assets/images/kubernetes-metrics-sources-29962af59a23c3f84206f81323ffa542.webp)

**kube-state-metrics exposes Kubernetes object state for monitoring; metrics-server supplies recent CPU and memory usage through the Metrics API for autoscaling and `kubectl top`.** A Deployment's missing replicas and a Pod's current CPU usage are different questions. A cluster that needs both autoscaling and object-state alerts will commonly use both components.

For a full monitoring setup, add the other two sources: cAdvisor for container resource usage and node\_exporter for the host underneath. This post explains which component answers each question, where to scrape it, and the metric renames that can break an otherwise valid alert query.

**Tags:**

* [Kubernetes](https://n9e.io/blog/tags/kubernetes.md "Monitoring and alerting on Kubernetes clusters.")
* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)
