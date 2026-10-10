---
sidebar_label: Quick start
title: Bring up Nightingale in five minutes
description: "One docker compose up -d brings up Nightingale with its dependencies; sign in on port 17000 as root, then register a data source, write a rule and add a channel."
---

The compose bundle starts Nightingale together with the database and time-series store it needs, so
there is nothing to prepare beforehand.

```bash
git clone https://github.com/ccfos/nightingale.git
cd nightingale/docker/compose-bridge
docker compose up -d
```

Open **`http://localhost:17000`** and sign in as `root` / `root.2020`.

## What to do first

1. **Register a data source** — Prometheus, VictoriaMetrics, ElasticSearch, ClickHouse, Loki and
   more are all supported. Nightingale queries them where they are; nothing is migrated.
2. **Write one alert rule** against that source, scoped to a business group and graded S1 / S2 / S3.
3. **Add a notification channel** so the event reaches somebody.

Nothing collecting yet? [Categraf](/categraf) covers operating systems, middleware, databases,
network gear and Kubernetes with a single agent.

Next: [Installation](../install/overview.mdx) for production deployments.
