# Monitor NSQ with Nightingale

Reads nsqd's /stats endpoint for per-topic and per-channel depth, in-flight, timeouts and client counts; rules watch growing backlog and lost consumers.

Last reviewed 2026-10-27

The NSQ input is ported from Telegraf and reads the `/stats` HTTP endpoint of nsqd: message counts and depth per topic, depth, in-flight, deferred, requeue and timeout counters per channel, and ready and in-flight state per client connection.

The rules cover channel depth growing steadily, rising timeouts and requeues, channels without consumers and nsqd being unreachable.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 alert rules**, each with runbook steps
* **Categraf collector config**: `input.nsq`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.nsq/nsq.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.nsq started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   # [[instances]]

   ## The Nsq API URI used to collect statistical information.

   # targets = ["http://localhost:4151"]

    

   # headers={Authorization="", X-Forwarded-For="", Host=""}

    

   # timeout="5s"



   # # basic auth

   # username=""

   # password=""



   ## append some labels for series

   # labels = { product="nsq" }



   ## interval = global.interval * interval_times

   # interval_times = 1
   ```

2. Open the integration center in Nightingale, find NSQ, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### NSQ channel backlog[​](#nsq-channel-backlog "Direct link to NSQ channel backlog")

S2 Warning · for 5 min · Trigger:

```
nsq_channel_depth > 10000
```

Runbook:

1. Take topic and channel from the alert labels and run curl -s http\://\<nsqd>:4151/stats?format=json to inspect client\_count and in\_flight\_count for that channel;
2. If client\_count looks normal but in\_flight stays at its ceiling, individual messages are slow to process; go to the consumer application logs and tracing to find the slow step;
3. If the processing logic itself is slow, scale out consumer instances or raise max\_in\_flight on the consumer;
4. If the backlog came from a one-off traffic spike, you may run curl -X POST 'http\://\<nsqd>:4151/channel/empty?topic=..\&channel=..' after evaluating the impact, but note this drops messages and must be confirmed with the business first.

### NSQ channel overflowing to disk[​](#nsq-channel-overflowing-to-disk "Direct link to NSQ channel overflowing to disk")

S2 Warning · for 5 min · Trigger:

```
nsq_channel_backend_depth > 0
```

Runbook:

1. Run curl -s http\://\<nsqd>:4151/stats?format=json and compare depth with backend\_depth to size the spill;
2. The root cause is usually still slow consumption, so scale out consumers or optimise consumption logic as for a backlog;
3. Check the free space on the disk holding the nsqd data directory (--data-path) with df -h so it cannot fill up;
4. For an expected short spike you can raise --mem-queue-size to buy memory buffering, but re-check the nsqd process memory ceiling at the same time.

### NSQ channel has no consumer but has a backlog[​](#nsq-channel-has-no-consumer-but-has-a-backlog "Direct link to NSQ channel has no consumer but has a backlog")

S2 Warning · for 3 min · Trigger:

```
nsq_channel_client_count == 0 and nsq_channel_depth > 0
```

Runbook:

1. Take topic and channel from the alert labels and confirm whether the consuming service has been fully taken offline or has crashed;
2. If the consumer is running, check its connections to nsqlookupd/nsqd (netstat -anp | grep 4150) and look for connection errors in the consumer logs;
3. If a release changed the channel name and left the old channel orphaned, confirm it is unused and delete it with curl -X POST 'http\://\<nsqd>:4151/channel/delete?topic=..\&channel=..';
4. If the consumer does need to come back, start it and watch depth begin to fall.

### NSQ message processing timeouts spiking[​](#nsq-message-processing-timeouts-spiking "Direct link to NSQ message processing timeouts spiking")

S2 Warning · for 5 min · Trigger:

```
rate(nsq_channel_timeout_count[5m]) > 1
```

Runbook:

1. Take topic and channel from the alert labels and look in the consumer application logs for handlers exceeding msg-timeout;
2. If processing genuinely needs longer, call Touch() periodically on long tasks in the consumer, or raise --msg-timeout on nsqd;
3. If a slow downstream dependency (database, third-party API) is dragging processing down, fix the dependency first and add timeouts and circuit breaking in the consumer;
4. Make sure the business logic is idempotent, otherwise redelivery will cause duplicate writes.

### NSQ message requeues spiking[​](#nsq-message-requeues-spiking "Direct link to NSQ message requeues spiking")

S3 Info · for 5 min · Trigger:

```
rate(nsq_channel_requeue_count[5m]) > 10
```

Runbook:

1. Aggregate the failure reasons from the consumer logs and separate business validation failures (which should not be retried) from dependency flapping (which should);
2. Validation failures should be FIN-ed and written to a dead-letter store rather than requeued forever;
3. For dependency flapping, check that retry backoff is configured sensibly, since fixed-interval retries create storms;
4. Read this together with nsq\_channel\_timeout\_count: if both are high the consumer is simply overloaded and needs to be scaled out first.

## Related[​](#related "Direct link to Related")

* [NSQ template source](https://github.com/ccfos/nightingale/tree/main/integrations/NSQ): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `nsq` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/nsq): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
