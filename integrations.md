INTEGRATIONS

# Plugs into what you already run

Data sources, collectors, notification channels and templates — Nightingale connects to what exists rather than replacing it. The full list is below, and every entry links to how to wire it up.

83Built-in templates

13Data source types

20Notification channels

Search integrations: nginx, k8s, aws, cert…`/`

<!-- -->

to search

[Data sources](#sources)[Notifications](#channels)[Templates](#templates)[Collectors](#collectors)

DATA SOURCES

## Data sources

Nightingale does not make you move your data; it queries what you already run. Metrics stores speak PromQL, log stores use their own query syntax, and SQL stores take plain SQL — alert rules and dashboards work on all three.

Metrics

* [![Prometheus logo](https://n9e.github.io/img/logos/prometheus.png)Prometheus](https://n9e.github.io/docs/data/prometheus.md)
* [![VictoriaMetrics logo](https://n9e.github.io/img/logos/victoriametrics.png)VictoriaMetrics](https://n9e.github.io/docs/data/victoriametrics.md)
* [![Embedded TSDB logo](https://n9e.github.io/img/logo-mark.webp)Embedded TSDB](https://n9e.github.io/docs/data/embedded-tsdb.md)

Logs

* [![ElasticSearch logo](https://n9e.github.io/img/logos/elasticsearch.png)ElasticSearch](https://n9e.github.io/docs/data/elasticsearch.md)
* [![OpenSearch logo](https://n9e.github.io/img/logos/opensearch.png)OpenSearch](https://n9e.github.io/docs/data/elasticsearch.md)
* [![Loki logo](https://n9e.github.io/img/logos/loki.png)Loki](https://n9e.github.io/docs/data/loki-victorialogs.md)
* [![VictoriaLogs logo](https://n9e.github.io/img/logos/victorialogs.png)VictoriaLogs](https://n9e.github.io/docs/data/loki-victorialogs.md)

SQL

* [![ClickHouse logo](https://n9e.github.io/img/logos/ck.png)ClickHouse](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)
* [![MySQL logo](https://n9e.github.io/img/logos/mysql.png)MySQL](https://n9e.github.io/docs/data/sql-databases.md)
* [![PostgreSQL logo](https://n9e.github.io/img/logos/pgsql.png)PostgreSQL](https://n9e.github.io/docs/data/sql-databases.md)
* [![TDengine logo](https://n9e.github.io/img/logos/tdengine.png)TDengine](https://n9e.github.io/docs/data/sql-databases.md)
* [![Doris logo](https://n9e.github.io/img/logos/doris.png)Doris](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)
* [![IoTDB logo](https://n9e.github.io/img/logos/iotdb.png)IoTDB](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)

NOTIFICATIONS

## Notification channels

DingTalk, WeCom, Feishu, email and phone/SMS work out of the box. Slack, Telegram, Discord, PagerDuty and Jira come with built-in message templates — create the media type and send. Anything else goes through a webhook with a custom body.

* ![Slack logo](https://n9e.github.io/img/logos/slack.png)Slack
* ![PagerDuty logo](https://n9e.github.io/img/logos/pagerduty.png)PagerDuty
* Email
* ![Telegram logo](https://n9e.github.io/img/logos/telegram.png)Telegram
* ![Discord logo](https://n9e.github.io/img/logos/discord.png)Discord
* ![Jira logo](https://n9e.github.io/img/logos/jira.png)Jira
* ![Mattermost logo](https://n9e.github.io/img/logos/mattermost.png)Mattermost
* Phone / SMS
* ![FlashDuty logo](https://n9e.github.io/img/logos/flashduty.png)FlashDuty
* ![DingTalk logo](https://n9e.github.io/img/logos/dingtalk.png)DingTalk
* ![Feishu logo](https://n9e.github.io/img/logos/feishu.png)Feishu
* ![WeCom logo](https://n9e.github.io/img/logos/wecom.png)WeCom

[Notification docs<!-- --> →](https://n9e.github.io/docs/notifications/overview.md)

BUILT-IN TEMPLATES

## Built-in templates

Each template bundles Categraf collector config, dashboards and a set of alert rules, importable in one click from the integration center. The numbers on each card are counted from the repo at build time — they say what the template actually ships, not what we hope it does.

All83Hosts & hardware14Databases & storage16Message queues8Web & middleware15Containers & cloud native8Cloud providers & CDN9Network & probes9DevOps & others4

* [![Linux logo](https://n9e.github.io/img/integrations/Linux.png)Linux5 dashboards·4 rule sets·collector config·metric docs](https://n9e.github.io/integrations/linux.md)
* [![Kubernetes logo](https://n9e.github.io/img/integrations/Kubernetes.png)Kubernetes17 dashboards·9 rule sets·metric docs](https://n9e.github.io/integrations/kubernetes.md)
* [![MySQL logo](https://n9e.github.io/img/integrations/MySQL.png)MySQL7 dashboards·2 rule sets·collector config·metric docs](https://n9e.github.io/integrations/mysql.md)
* [![Redis logo](https://n9e.github.io/img/integrations/Redis.png)Redis3 dashboards·2 rule sets·collector config](https://n9e.github.io/integrations/redis.md)
* [![Windows logo](https://n9e.github.io/img/integrations/Windows.png)Windows6 dashboards·2 rule sets](https://n9e.github.io/integrations/windows.md)
* [![Docker logo](https://n9e.github.io/img/integrations/Docker.png)Docker1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/docker.md)
* [![PostgreSQL logo](https://n9e.github.io/img/integrations/PostgreSQL.png)PostgreSQL1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/postgresql.md)
* [![Nginx logo](https://n9e.github.io/img/integrations/Nginx.png)Nginx3 dashboards·2 rule sets·collector config·metric docs](https://n9e.github.io/integrations/nginx.md)
* [![Elasticsearch logo](https://n9e.github.io/img/integrations/Elasticsearch.png)Elasticsearch5 dashboards·2 rule sets·collector config·metric docs](https://n9e.github.io/integrations/elasticsearch.md)
* [![Kafka logo](https://n9e.github.io/img/integrations/Kafka.png)Kafka2 dashboards·2 rule sets·collector config·metric docs](https://n9e.github.io/integrations/kafka.md)
* [![MongoDB logo](https://n9e.github.io/img/integrations/MongoDB.png)MongoDB1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/mongodb.md)
* [![Java logo](https://n9e.github.io/img/integrations/Java.png)Java3 dashboards](https://n9e.github.io/integrations/java.md)
* [![RabbitMQ logo](https://n9e.github.io/img/integrations/RabbitMQ.png)RabbitMQ4 dashboards·1 rule set·collector config](https://n9e.github.io/integrations/rabbitmq.md)
* [![SNMP logo](https://n9e.github.io/img/integrations/SNMP.png)SNMP9 dashboards·5 rule sets·collector config·metric docs](https://n9e.github.io/integrations/snmp.md)
* [![Ping logo](https://n9e.github.io/img/integrations/Ping.png)Ping2 dashboards·1 rule set·collector config·metric docs](https://n9e.github.io/integrations/ping.md)
* [![Alibaba Cloud logo](https://n9e.github.io/img/integrations/AliYun.png)Alibaba Cloud44 dashboards·12 rule sets·collector config](https://n9e.github.io/integrations/aliyun.md)
* [![AMD ROCm SMI logo](https://n9e.github.io/img/integrations/AMD_ROCm_SMI.png)AMD ROCm SMI1 rule set·collector config](https://n9e.github.io/integrations/amd-rocm-smi.md)
* [![Exec logo](https://n9e.github.io/img/integrations/Exec.png)Execcollector config](https://n9e.github.io/integrations/exec.md)
* [![Filecount logo](https://n9e.github.io/img/integrations/Filecount.png)Filecountcollector configChinese only](https://github.com/ccfos/nightingale/blob/main/integrations/Filecount/markdown/README.md)
* [![IPMI logo](https://n9e.github.io/img/integrations/IPMI.png)IPMI3 dashboards·1 rule set·collector config·metric docs](https://n9e.github.io/integrations/ipmi.md)
* [![IPVS logo](https://n9e.github.io/img/integrations/IPVS.png)IPVS1 rule set·collector configChinese only](https://github.com/ccfos/nightingale/blob/main/integrations/IPVS/markdown/README.md)
* [![Netstat Filter logo](https://n9e.github.io/img/integrations/Netstat_Filter.png)Netstat Filter1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/Netstat_Filter/markdown/README.en_US.md)
* [![NFSClient logo](https://n9e.github.io/img/integrations/NFSClient.png)NFSClient1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/NFSClient/markdown/README.en_US.md)
* [![NVIDIA logo](https://n9e.github.io/img/integrations/NVIDIA.png)NVIDIA3 dashboards·1 rule set·collector config·metric docs](https://n9e.github.io/integrations/nvidia.md)
* [![Procstat logo](https://n9e.github.io/img/integrations/Procstat.png)Procstat1 dashboard·1 rule set·collector config·metric docsEnglish only](https://github.com/ccfos/nightingale/blob/main/integrations/Procstat/markdown/README.en_US.md)
* [![Redfish logo](https://n9e.github.io/img/integrations/Redfish.png)Redfishcollector config](https://github.com/ccfos/nightingale/blob/main/integrations/Redfish/markdown/README.en_US.md)
* [![SMART logo](https://n9e.github.io/img/integrations/SMART.png)SMART1 dashboard·1 rule set·collector config·metric docs](https://n9e.github.io/integrations/smart.md)
* [![Systemd logo](https://n9e.github.io/img/integrations/Systemd.png)Systemd1 dashboard·1 rule set·collector config·metric docs](https://n9e.github.io/integrations/systemd.md)
* [![ClickHouse logo](https://n9e.github.io/img/integrations/ClickHouse.png)ClickHouse2 dashboards·2 rule sets·collector config·metric docsChinese only](https://n9e.github.io/integrations/clickhouse.md)
* [![Dameng logo](https://n9e.github.io/img/integrations/Dameng.png)Dameng1 dashboard·1 rule set·collector config·metric docsEnglish only](https://github.com/ccfos/nightingale/blob/main/integrations/Dameng/markdown/README.en_US.md)
* [![Doris logo](https://n9e.github.io/img/integrations/Doris.svg)Doris1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/doris.md)
* [![Greenplum logo](https://n9e.github.io/img/integrations/Greenplum.png)Greenplum1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/Greenplum/markdown/README.en_US.md)
* [![Kingbase logo](https://n9e.github.io/img/integrations/Kingbase.png)Kingbase1 dashboardEnglish only](https://github.com/ccfos/nightingale/blob/main/integrations/Kingbase/markdown/README.en_US.md)
* [![Oracle logo](https://n9e.github.io/img/integrations/Oracle.png)Oracle1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/oracle.md)
* [![Prometheus logo](https://n9e.github.io/img/integrations/Prometheus.png)Prometheuscollector config](https://github.com/ccfos/nightingale/blob/main/integrations/Prometheus/markdown/README.en_US.md)
* [![SQLServer logo](https://n9e.github.io/img/integrations/SQLServer.png)SQLServer1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/sqlserver.md)
* [![TDengine logo](https://n9e.github.io/img/integrations/TDEngine.png)TDengine1 dashboard](https://github.com/ccfos/nightingale/blob/main/integrations/TDEngine/markdown/README.en_US.md)
* [![TiDB logo](https://n9e.github.io/img/integrations/TiDB.png)TiDB1 dashboard·1 rule set](https://n9e.github.io/integrations/tidb.md)
* [![VictoriaMetrics logo](https://n9e.github.io/img/integrations/VictoriaMetrics.png)VictoriaMetrics2 dashboards·1 rule set](https://n9e.github.io/integrations/victoriametrics.md)
* [![AutoMQ logo](https://n9e.github.io/img/integrations/AutoMQ.png)AutoMQ5 dashboards·1 rule set·collector config·metric docsEnglish only](https://n9e.github.io/integrations/automq.md)
* [![Canal logo](https://n9e.github.io/img/integrations/Canal.png)Canal1 dashboard](https://github.com/ccfos/nightingale/blob/main/integrations/Canal/markdown/README.en_US.md)
* [![EMQX logo](https://n9e.github.io/img/integrations/EMQX.png)EMQX1 rule set·collector config](https://n9e.github.io/integrations/emqx.md)
* [![NSQ logo](https://n9e.github.io/img/integrations/NSQ.png)NSQ1 rule set·collector config](https://n9e.github.io/integrations/nsq.md)
* [![RocketMQ logo](https://n9e.github.io/img/integrations/RocketMQ.png)RocketMQcollector config](https://github.com/ccfos/nightingale/blob/main/integrations/RocketMQ/markdown/README.en_US.md)
* [![ZooKeeper logo](https://n9e.github.io/img/integrations/ZooKeeper.png)ZooKeeper1 dashboard·1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/ZooKeeper/markdown/README.en_US.md)
* [![Apache logo](https://n9e.github.io/img/integrations/Apache.png)Apache1 rule set·collector config](https://n9e.github.io/integrations/apache.md)
* [![Bind logo](https://n9e.github.io/img/integrations/Bind.png)Bind1 rule set·collector config](https://n9e.github.io/integrations/bind.md)
* [![Consul logo](https://n9e.github.io/img/integrations/Consul.png)Consul1 rule set·collector configChinese only](https://n9e.github.io/integrations/consul.md)
* [![HAProxy logo](https://n9e.github.io/img/integrations/HAProxy.png)HAProxy1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/haproxy.md)
* [![IIS logo](https://n9e.github.io/img/integrations/IIS.png)IIScollector config](https://github.com/ccfos/nightingale/blob/main/integrations/IIS/markdown/README.en_US.md)
* [![Jolokia Agent logo](https://n9e.github.io/img/integrations/Jolokia_Agent.png)Jolokia Agentcollector config](https://github.com/ccfos/nightingale/blob/main/integrations/Jolokia_Agent/markdown/README.en_US.md)
* [![Ldap logo](https://n9e.github.io/img/integrations/Ldap.png)Ldap1 rule set·collector configChinese only](https://n9e.github.io/integrations/ldap.md)
* [![Logstash logo](https://n9e.github.io/img/integrations/Logstash.png)Logstash1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/logstash.md)
* [![Mtail logo](https://n9e.github.io/img/integrations/Mtail.png)Mtailcollector config](https://n9e.github.io/integrations/mtail.md)
* [![PHP logo](https://n9e.github.io/img/integrations/PHP.png)PHP1 rule set·collector config](https://n9e.github.io/integrations/php.md)
* [![Radius logo](https://n9e.github.io/img/integrations/Radius.png)Radiuscollector config](https://github.com/ccfos/nightingale/blob/main/integrations/Radius/markdown/README.en_US.md)
* [![SpringBoot logo](https://n9e.github.io/img/integrations/SpringBoot.png)SpringBoot2 dashboards·1 rule set](https://n9e.github.io/integrations/springboot.md)
* [![Tomcat logo](https://n9e.github.io/img/integrations/Tomcat.png)Tomcat1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/tomcat.md)
* [![cAdvisor logo](https://n9e.github.io/img/integrations/cAdvisor.png)cAdvisor1 dashboard·1 rule set·collector config·metric docs](https://n9e.github.io/integrations/cadvisor.md)
* [![Ceph logo](https://n9e.github.io/img/integrations/Ceph.png)Ceph1 dashboard·1 rule set](https://n9e.github.io/integrations/ceph.md)
* [![MinIO logo](https://n9e.github.io/img/integrations/MinIO.png)MinIO2 dashboards·1 rule set](https://n9e.github.io/integrations/minio.md)
* [![OpenStack logo](https://n9e.github.io/img/integrations/OpenStack.png)OpenStack1 rule set·collector config](https://n9e.github.io/integrations/openstack.md)
* [![vSphere logo](https://n9e.github.io/img/integrations/vSphere.png)vSphere2 dashboards·1 rule set·collector config](https://n9e.github.io/integrations/vsphere.md)
* [![XSKY logo](https://n9e.github.io/img/integrations/XSKYApi.png)XSKY1 rule set·collector configChinese only](https://github.com/ccfos/nightingale/blob/main/integrations/XSKYApi/markdown/README.md)
* [![Akamai logo](https://n9e.github.io/img/integrations/Akamai.svg)Akamai1 dashboard·1 rule set·collector configEnglish only](https://github.com/ccfos/nightingale/blob/main/integrations/Akamai/markdown/README.en_US.md)
* [![Azure logo](https://n9e.github.io/img/integrations/Azure.svg)Azurecollector configEnglish only](https://n9e.github.io/integrations/azure.md)
* [![CDN logo](https://n9e.github.io/img/integrations/CDN.png)CDN1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/CDN/markdown/README.en_US.md)
* [![Cloudflare logo](https://n9e.github.io/img/integrations/Cloudflare.png)Cloudflare1 dashboard·1 rule set·collector configEnglish only](https://github.com/ccfos/nightingale/blob/main/integrations/Cloudflare/markdown/README.en_US.md)
* [![CloudWatch logo](https://n9e.github.io/img/integrations/CloudWatch.png)CloudWatch1 dashboard·1 rule set·collector configChinese only](https://n9e.github.io/integrations/cloudwatch.md)
* [![GoogleCloud logo](https://n9e.github.io/img/integrations/GoogleCloud.png)GoogleCloudcollector config](https://github.com/ccfos/nightingale/blob/main/integrations/GoogleCloud/markdown/README.en_US.md)
* [![Huawei Cloud logo](https://n9e.github.io/img/integrations/Huawei.svg)Huawei Cloud14 dashboards·4 rule sets·metric docs](https://n9e.github.io/integrations/huawei.md)
* [![Tencent Cloud logo](https://n9e.github.io/img/integrations/Tencent.svg)Tencent Cloud7 dashboardsEnglish only](https://n9e.github.io/integrations/tencent.md)
* [![DNS Query logo](https://n9e.github.io/img/integrations/Dns_Query.png)DNS Query1 rule set·collector config·metric docs](https://n9e.github.io/integrations/dns-query.md)
* [![HTTP Response logo](https://n9e.github.io/img/integrations/HTTP_Response.png)HTTP Response1 dashboard·1 rule set·collector config·metric docsEnglish only](https://github.com/ccfos/nightingale/blob/main/integrations/HTTP_Response/markdown/README.en_US.md)
* [![Meraki logo](https://n9e.github.io/img/integrations/Meraki.png)Merakicollector config](https://github.com/ccfos/nightingale/blob/main/integrations/Meraki/markdown/README.en_US.md)
* [![Net Response logo](https://n9e.github.io/img/integrations/Net_Response.png)Net Response2 dashboards·1 rule set·collector config·metric docs](https://n9e.github.io/integrations/net-response.md)
* [![Switch (legacy) logo](https://n9e.github.io/img/integrations/Switch_Legacy.png)Switch (legacy)1 dashboard·1 rule set·collector config](https://n9e.github.io/integrations/switch-legacy.md)
* [![Whois logo](https://n9e.github.io/img/integrations/Whois.png)Whois1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/Whois/markdown/README.en_US.md)
* [![X.509 Certificate logo](https://n9e.github.io/img/integrations/X509_Cert.png)X.509 Certificatecollector config](https://github.com/ccfos/nightingale/blob/main/integrations/X509_Cert/markdown/README.en_US.md)
* [![AppDynamics logo](https://n9e.github.io/img/integrations/AppDynamics.png)AppDynamicscollector config](https://github.com/ccfos/nightingale/blob/main/integrations/AppDynamics/markdown/README.en_US.md)
* [![Gitlab logo](https://n9e.github.io/img/integrations/Gitlab.png)Gitlab5 dashboards·1 rule set](https://n9e.github.io/integrations/gitlab.md)
* [![Jenkins logo](https://n9e.github.io/img/integrations/Jenkins.png)Jenkins1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/Jenkins/markdown/README.en_US.md)
* [![Zabbix logo](https://n9e.github.io/img/integrations/Zabbix.svg)Zabbix1 dashboard·collector configEnglish only](https://github.com/ccfos/nightingale/blob/main/integrations/Zabbix/markdown/README.en_US.md)

Show all 83 templates

<!-- -->

↓

[Browse every template on GitHub<!-- --> →](https://github.com/ccfos/nightingale/tree/main/integrations)2026-10-27

COLLECTORS

## How data gets in

Nightingale does not collect data itself. The templates above are written for Categraf, but any collector that speaks Prometheus Remote Write can feed it.

### CategrafRecommended

One agent for operating systems, middleware, databases and cloud providers. Every built-in template ships its collector config for Categraf.

[Categraf docs](https://n9e.github.io/docs/data/categraf.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/categraf.md)

### Telegraf / Datadog Agent

Keep what is already running; point its output at the Nightingale Remote Write endpoint.

[Collector setup](https://n9e.github.io/docs/data/integrations/collector-config.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/integrations/collector-config.md)

### Exporters

node\_exporter, mysqld\_exporter and the rest of the Prometheus ecosystem, scraped by Categraf or Prometheus and written in.

[Collector config](https://n9e.github.io/docs/data/integrations/collector-config.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/integrations/collector-config.md)

### Remote Write directly

Your own programs or the OpenTelemetry Collector push straight to /prometheus/v1/write.

[Verify data arrives](https://n9e.github.io/docs/data/integrations/verify.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/integrations/verify.md)

## Not seeing what you need?

The template list comes straight from the open-source repo, where a template is one directory: icon, collector config, dashboards, alert rules. Ask for what is missing in an issue, or write one to the spec and send a PR.

[Request in an issue](https://github.com/ccfos/nightingale/issues/new/choose)[Template spec](https://n9e.github.io/docs/reference/integration-schema.md)
