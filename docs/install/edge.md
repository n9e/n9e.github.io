---
title: Edge data centers
sidebar_label: Edge data centers
description: "A local alerting engine for sites whose link to the center is unreliable, and the one flag that silently breaks it."
last_reviewed: 2026-10-10
---

Where the network to the central site is unreliable, run `n9e-edge` as a local alerting engine so
alerts keep firing and keep being delivered through a partition:

```bash
n9e-edge --configs etc/edge
```

:::warning Point it at the edge config directory
`--configs` defaults to `etc`, which holds the **central** `config.toml`. The edge process has its
own config at `etc/edge/edge.toml` — passing `etc` instead makes it load the wrong file, and the
resulting misrouting is silent. Edge also needs its own Redis; it cannot share the one at the center.
:::
