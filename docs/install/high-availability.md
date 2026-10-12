# High availability

Run multiple Center and Alert instances behind a load balancer, and what still needs to be a singleton.

A Nightingale cluster needs no extra component: **run several `n9e` processes with identical config, sharing one MySQL and one Redis**. This page covers doing that correctly — the load balancer in front, what the instances need from each other, and which pieces stay single even when everything else is replicated.

## Building it[​](#building-it "Direct link to Building it")

Install `n9e` on several hosts ([Binary packages](https://n9e.github.io/docs/install/binary.md)) with the same configuration file. Three sections have to match:

```
[DB]

DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"



[Redis]

RedisType = "standalone"

Address = "redis:6379"



# only instances in the same engine cluster share rules with each other

[Alert.Heartbeat]

EngineName = "default"
```

Once they are up, open **System → Alerting engines**: every instance should be listed with a heartbeat that keeps advancing. Rules are distributed across them by consistent hash, and a rule runs on exactly one instance, so there are no duplicate alerts.

**Turn the embedded TSDB off first** — see "What stays a singleton" below.

## Instances have to reach each other[​](#instances-have-to-reach-each-other "Direct link to Instances have to reach each other")

This step is the one that gets skipped: the instances do not only talk to the database, **they call each other directly over HTTP**.

Evaluation records for a rule live on the local disk of **whichever instance owns that rule**. When your browser lands on a different instance, that instance forwards the query to its siblings, at `http://<peer ip:port>/v1/n9e/eval-records`, over the service-to-service API.

So every instance in the cluster must expose that API, with the same credentials:

```
[HTTP.APIForService]

Enable = true

[HTTP.APIForService.BasicAuth]

n9e-cluster = "<your-own-password>"
```

`[HTTP.APIForService]` is **off by default**, and the `user001` credentials shipped in the config file are a public example — replace them. Leaving it off does not produce an error; it just means you only ever see evaluation records for the rules the instance you reached happens to own.

An instance's identity is `<IP>:<HTTP port>`, and the IP is auto-detected. In containers, or on hosts with several NICs, set it explicitly so siblings do not end up with an address they cannot reach:

```
[Alert.Heartbeat]

IP = "n9e-1.example.internal"
```

Open the network path too: instance-to-instance access on port 17000.

## The load balancer[​](#the-load-balancer "Direct link to The load balancer")

Put an L4 or L7 load balancer in front, spreading traffic across the instances' port 17000:

* **health check** `GET /ping`, which returns `pong`;
* **no session affinity needed**. Login state is a JWT issued and revoked through the shared Redis, so any instance accepts any request;
* **do not forward only the UI paths**. The write endpoint `/prometheus/v1/write`, the heartbeat `/v1/n9e/heartbeat`, the web UI and `/api/n9e/*` all sit on the same port 17000 — agents and browsers come in through the same door;
* **be generous with timeouts**. Dashboard and evaluation-record queries can take ten seconds or more; a 60-second backend timeout is comfortable.

The ibex RPC used by self-healing is on 20090 and is a **long-lived TCP connection**. Do not put it behind an L7 proxy; forward it at L4, or let agents connect directly.

## What stays a singleton[​](#what-stays-a-singleton "Direct link to What stays a singleton")

Several instances remove exactly one failure domain, the `n9e` process. These are not in it:

| Thing                | Situation                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Embedded TSDB        | Data sits on one instance's local disk; a cluster must turn it off and use an external store      |
| MySQL, Redis         | If they go, everything goes — there is no degraded mode, and their HA is their own                |
| Evaluation records   | On each instance's local disk, with no replica; losing the instance loses its records             |
| DingTalk stream mode | Runs on the leader only — the lowest-sorted `IP:port` among live instances, elected automatically |

Turning the embedded store off:

```
[EmbeddedTSDB]

Enable = false
```

For the migration path see [External TSDB and dual-write migration](https://n9e.github.io/docs/install/external-tsdb.md).

## About n9e-alert and n9e-pushgw[​](#about-n9e-alert-and-n9e-pushgw "Direct link to About n9e-alert and n9e-pushgw")

Rule evaluation and ingestion already live inside `n9e`, so scaling out means running more `n9e` processes. Splitting them into separate processes is optional, and **neither binary is in the release package** — the `Makefile` has `build-alert` and `build-pushgw` targets, so a split deployment has to be built from source.

## Next[​](#next "Direct link to Next")

* [High availability and failure domains](https://n9e.github.io/docs/operations/high-availability.md) — what it survives, and how to rehearse it
* [External TSDB and dual-write migration](https://n9e.github.io/docs/install/external-tsdb.md)
* [Upgrade](https://n9e.github.io/docs/install/upgrade.md) — rolling a cluster
