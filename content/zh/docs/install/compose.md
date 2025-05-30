---
title: "Docker Compose"
description: "使用 Docker Compose 方式部署夜莺监控项目"
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2025-01-26T09:26:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 300
toc: true
---


```bash
$ git clone https://github.com/ccfos/nightingale.git
$ cd nightingale/docker/compose-bridge

$ docker-compose up -d
Creating network "docker_nightingale" with driver "bridge"
Creating mysql      ... done
Creating redis      ... done
Creating prometheus ... done
Creating ibex       ... done
Creating agentd     ... done
Creating nwebapi    ... done
Creating nserver    ... done
Creating telegraf   ... done

$ docker-compose ps
NAME                IMAGE                              COMMAND                  SERVICE             CREATED             STATUS              PORTS
categraf            flashcatcloud/categraf:latest      "/entrypoint.sh"         categraf            2 days ago          Up 2 days
ibex                ulric2019/ibex:0.3                 "sh -c '/wait && /ap…"   ibex                2 days ago          Up 2 days
mysql               mysql:5.7                          "docker-entrypoint.s…"   mysql               2 days ago          Up 2 days
n9e                 flashcatcloud/nightingale:latest   "sh -c '/wait && /ap…"   n9e                 2 days ago          Up 2 days
prometheus          prom/prometheus                    "/bin/prometheus --c…"   prometheus          2 days ago          Up 2 days
redis               redis:6.2                          "docker-entrypoint.s…"   redis               2 days ago          Up 2 days
```

使用浏览器访问 [http://localhost:17000](http://localhost:17000) 打开夜莺监控的页面，默认用户名是 `root`，默认密码是 `root.2020`。

> 请把 localhost 替换成你的服务器 IP 地址。
