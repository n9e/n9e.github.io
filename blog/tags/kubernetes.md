# One post tagged with "Kubernetes"

Monitoring and alerting on Kubernetes clusters.

[View all tags](https://n9e.github.io/blog/tags.md)

## [kube-state-metrics vs metrics-server vs cAdvisor vs node\_exporter](https://n9e.github.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![Four Kubernetes metric sources: kube-state-metrics, cAdvisor, node\_exporter and metrics-server](https://n9e.github.io/assets/images/kubernetes-metrics-sources-29962af59a23c3f84206f81323ffa542.webp)

Kubernetes metrics come from four places, and their names look alike. `kube_pod_container_resource_limits`, `container_memory_working_set_bytes`, `node_memory_MemAvailable_bytes` and the numbers in `kubectl top` all sound like they describe the same thing. They are made by different components and they answer different questions. Only three of the four are meant for monitoring.

This post explains what each component measures and how to tell which one a metric came from. It also covers the renames that make a query copied from a 2019 blog post return nothing.

**Tags:**

* [Kubernetes](https://n9e.github.io/blog/tags/kubernetes.md "Monitoring and alerting on Kubernetes clusters.")
* [Prometheus](https://n9e.github.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.github.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)
