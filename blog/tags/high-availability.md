# One post tagged with "High availability"

Keeping monitoring and alerting up when parts of it fail.

[View all tags](https://n9e.io/blog/tags.md)

## [Prometheus high availability: storage vs alerting](https://n9e.io/blog/prometheus-high-availability.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![Two Prometheus replicas writing to deduplicated storage and sending alerts to a clustered Alertmanager](https://n9e.io/assets/images/prometheus-high-availability-116818454807068016c0d755e596c981.webp)

Ask how to make Prometheus highly available and the usual answer is "run two of them". That is correct, and it is only half the job. Two replicas give you two copies of every alert and two slightly different copies of every time series. Each needs its own fix, and the fixes don't share a configuration.

This post separates the two problems: keeping alerts flowing exactly once, and keeping the data queryable without gaps. It ends with a checklist.

**Tags:**

* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [High availability](https://n9e.io/blog/tags/high-availability.md "Keeping monitoring and alerting up when parts of it fail.")
* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.io/blog/prometheus-high-availability.md)
