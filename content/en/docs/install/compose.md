---
title: "Docker Compose"
description: "Nightingale monitoring (Nightingale) supports Docker Compose deployment, this article introduces how to deploy Nightingale using Docker Compose."
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2025-07-26T13:58:52.542+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 300
toc: true
---

## Download

Refer to the [Binary Installation](/docs/install/binary/) section to download the Nightingale monitoring release package, which includes Docker Compose configuration files. Alternatively, you can directly download the Nightingale source repository, where you can also find the Docker Compose configuration files.

## Start

Whether you download the release package or the source code repository, there will be a `docker/compose-bridge` directory after decompression. Simply enter this directory and execute the `docker-compose up -d` command (due to domestic network restrictions, image downloads may fail, and you need to solve the problem of scientific internet access on your own).

```bash
root@ubuntu-linux-22-04-desktop:/opt/n9e/docker/compose-bridge# docker compose up -d
[+] Running 5/5
 ✔ Container victoriametrics  Started                                                                                                                                                                            0.6s
 ✔ Container redis            Started                                                                                                                                                                            0.6s
 ✔ Container mysql            Started                                                                                                                                                                            0.6s
 ✔ Container nightingale      Started                                                                                                                                                                            0.2s
 ✔ Container categraf         Started                                                                                                                                                                            0.2s
root@ubuntu-linux-22-04-desktop:/opt/n9e/docker/compose-bridge# docker compose ps
NAME              IMAGE                                                      COMMAND                  SERVICE           CREATED         STATUS         PORTS
categraf          m.daocloud.io/docker.io/flashcatcloud/categraf:latest      "/entrypoint.sh"         categraf          2 minutes ago   Up 3 seconds
mysql             mysql:8                                                    "docker-entrypoint.s…"   mysql             2 minutes ago   Up 4 seconds   0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp
nightingale       m.daocloud.io/docker.io/flashcatcloud/nightingale:latest   "sh -c /app/n9e"         nightingale       2 minutes ago   Up 3 seconds   0.0.0.0:17000->17000/tcp, :::17000->17000/tcp, 0.0.0.0:20090->20090/tcp, :::20090->20090/tcp
redis             redis:6.2                                                  "docker-entrypoint.s…"   redis             2 minutes ago   Up 4 seconds   0.0.0.0:6379->6379/tcp, :::6379->6379/tcp
victoriametrics   victoriametrics/victoria-metrics:v1.79.12                  "/victoria-metrics-p…"   victoriametrics   2 minutes ago   Up 4 seconds   0.0.0.0:8428->8428/tcp, :::8428->8428/tcp
```

Docker Compose starts multiple containers, which are:

- `victoriametrics`: Time-series database, compatible with Prometheus, with better performance.
- `redis`: Cache database, Nightingale uses Redis to store JWT tokens and machine heartbeat metadata
- `mysql`: Relational database, Nightingale uses MySQL to store user information, alert rules, dashboards, and other configuration data.
- `nightingale`: The core service of Nightingale monitoring.
- `categraf`: Monitoring data collector, responsible for collecting CPU, memory, disk, and other metric data from the host.

## Login

Use your browser to visit [http://localhost:17000](http://localhost:17000) to open the Nightingale monitoring page. The default username is `root`, and the default password is `root.2020`.

> Please replace `localhost` with your server's IP address.

## Cluster Mode

In cluster mode, multiple `n9e` instances need to share the same MySQL and Redis, so you cannot simply use the default Docker Compose. You need to modify the `config.toml` file in the `etc-nightingale` directory to configure the unified MySQL and Redis connection information.

## Edge Mode

The edge mode requires the `n9e-edge` process. However, the community does not provide a Docker image for `n9e-edge`, so in edge mode, it is still necessary to deploy the `n9e-edge` process using the [binary method](/docs/install/binary/). For detailed instructions on the edge mode, please refer to: [Nightingale Monitoring - Detailed Explanation of Edge Alert Engine Architecture](/docs/prologue/architecture/#edge-mode).

