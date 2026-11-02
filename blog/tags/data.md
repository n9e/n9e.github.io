# One post tagged with "Data"

Posts built on numbers from Nightingale's own templates and rule library.

[View all tags](https://n9e.io/blog/tags.md)

## [How long should a Prometheus alert wait? Data from 692 rules](https://n9e.io/blog/prometheus-alert-for-duration.md)

November 1, 2026 ·

<!-- -->

9 min read

Eric Qin

![A histogram of for durations across 692 alert rule templates, with 304 rules at 60 seconds](https://n9e.io/assets/images/alert-for-duration-8a11aeeb3b53ac4cd26ec55c82f56d39.webp)

Every alert rule answers two questions: what counts as bad, and how long it has to stay bad. Most review effort goes into the first one, the expression and the threshold. The second is the `for` duration, and it often gets whatever value the tool filled in.

We wanted to know how often that happens, so we counted. Nightingale ships alert rule templates for 49 integrations. **692 rules, and 304 of them (44%) have a `for` duration of exactly 60 seconds**, which is the default in Nightingale's rule editor. This post walks through what the numbers show and what `for` value suits which kind of alert.

**Tags:**

* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")
* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Data](https://n9e.io/blog/tags/data.md "Posts built on numbers from Nightingale's own templates and rule library.")

[**Read more**](https://n9e.io/blog/prometheus-alert-for-duration.md)
