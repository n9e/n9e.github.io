INTEGRATIONS

# 接上你已有的一切

数据源、采集器、通知媒介、内置模板——夜莺对接现成的东西，不要求你换体系。下面是全部清单，每一项都可以点进去看怎么接。

83内置集成模板

13数据源类型

20通知媒介

搜索集�成：nginx、k8s、阿里云、证书……`/`

<!-- -->

聚焦搜索

[数据源](#sources)[通知媒介](#channels)[内置模板](#templates)[采集器](#collectors)

DATA SOURCES

## 数据源

夜莺不要求你搬数据，接上你已经在用的。指标类走 PromQL，日志类走各自的查询语法，SQL 类直接写 SQL——三类都能配告警规则和仪表盘。

指标

* [![Prometheus logo](https://n9e.github.io/zh/img/logos/prometheus.png)Prometheus](https://n9e.github.io/zh/docs/data/prometheus.md)
* [![VictoriaMetrics logo](https://n9e.github.io/zh/img/logos/victoriametrics.png)VictoriaMetrics](https://n9e.github.io/zh/docs/data/victoriametrics.md)
* [![内置 TSDB logo](https://n9e.github.io/zh/img/logo-mark.webp)内置 TSDB](https://n9e.github.io/zh/docs/data/embedded-tsdb.md)

日志

* [![ElasticSearch logo](https://n9e.github.io/zh/img/logos/elasticsearch.png)ElasticSearch](https://n9e.github.io/zh/docs/data/elasticsearch.md)
* [![OpenSearch logo](https://n9e.github.io/zh/img/logos/opensearch.png)OpenSearch](https://n9e.github.io/zh/docs/data/elasticsearch.md)
* [![Loki logo](https://n9e.github.io/zh/img/logos/loki.png)Loki](https://n9e.github.io/zh/docs/data/loki-victorialogs.md)
* [![VictoriaLogs logo](https://n9e.github.io/zh/img/logos/victorialogs.png)VictoriaLogs](https://n9e.github.io/zh/docs/data/loki-victorialogs.md)

SQL

* [![ClickHouse logo](https://n9e.github.io/zh/img/logos/ck.png)ClickHouse](https://n9e.github.io/zh/docs/data/clickhouse-doris-iotdb.md)
* [![MySQL logo](https://n9e.github.io/zh/img/logos/mysql.png)MySQL](https://n9e.github.io/zh/docs/data/sql-databases.md)
* [![PostgreSQL logo](https://n9e.github.io/zh/img/logos/pgsql.png)PostgreSQL](https://n9e.github.io/zh/docs/data/sql-databases.md)
* [![TDengine logo](https://n9e.github.io/zh/img/logos/tdengine.png)TDengine](https://n9e.github.io/zh/docs/data/sql-databases.md)
* [![Doris logo](https://n9e.github.io/zh/img/logos/doris.png)Doris](https://n9e.github.io/zh/docs/data/clickhouse-doris-iotdb.md)
* [![IoTDB logo](https://n9e.github.io/zh/img/logos/iotdb.png)IoTDB](https://n9e.github.io/zh/docs/data/clickhouse-doris-iotdb.md)

NOTIFICATIONS

## 通知媒介

钉钉、企业微信、飞书、邮件、电话短信开箱即用；Slack、Telegram、Discord、PagerDuty、Jira 这些有内置消息模板，建一个媒介就能发；剩下的走 Webhook 自定义 body。

* ![钉钉 logo](https://n9e.github.io/zh/img/logos/dingtalk.png)钉钉
* ![飞书 logo](https://n9e.github.io/zh/img/logos/feishu.png)飞书
* ![企业微信 logo](https://n9e.github.io/zh/img/logos/wecom.png)企业微信
* 电话 / 短信
* 邮件
* ![Slack logo](https://n9e.github.io/zh/img/logos/slack.png)Slack
* ![Telegram logo](https://n9e.github.io/zh/img/logos/telegram.png)Telegram
* ![Discord logo](https://n9e.github.io/zh/img/logos/discord.png)Discord
* ![Mattermost logo](https://n9e.github.io/zh/img/logos/mattermost.png)Mattermost
* ![PagerDuty logo](https://n9e.github.io/zh/img/logos/pagerduty.png)PagerDuty
* ![FlashDuty logo](https://n9e.github.io/zh/img/logos/flashduty.png)FlashDuty
* ![Jira logo](https://n9e.github.io/zh/img/logos/jira.png)Jira

[通知媒介文档<!-- --> →](https://n9e.github.io/zh/docs/notifications/overview.md)

BUILT-IN TEMPLATES

## 内置集成模板

每个模板打包了 Categraf 采集配置、仪表盘和一组告警规则，在集成中心一键导入即可使用。卡片上的数字是这个模板实际带了多少东西，构建时从仓库统计，不是手写的。

全部83主机与硬件14数据库与存储16消息队列8Web 与中间件15容器与云原生8云厂商与 CDN9网络与探测9DevOps 与其他4

* [![Linux logo](https://n9e.github.io/zh/img/integrations/Linux.png)Linux5 仪表盘·4 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/linux.md)
* [![Kubernetes logo](https://n9e.github.io/zh/img/integrations/Kubernetes.png)Kubernetes17 仪表盘·9 组规则·指标说明](https://n9e.github.io/zh/integrations/kubernetes.md)
* [![MySQL logo](https://n9e.github.io/zh/img/integrations/MySQL.png)MySQL7 仪表盘·2 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/mysql.md)
* [![Redis logo](https://n9e.github.io/zh/img/integrations/Redis.png)Redis3 仪表盘·2 组规则·采集配置](https://n9e.github.io/zh/integrations/redis.md)
* [![Windows logo](https://n9e.github.io/zh/img/integrations/Windows.png)Windows6 仪表盘·2 组规则](https://n9e.github.io/zh/integrations/windows.md)
* [![Docker logo](https://n9e.github.io/zh/img/integrations/Docker.png)Docker1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/docker.md)
* [![PostgreSQL logo](https://n9e.github.io/zh/img/integrations/PostgreSQL.png)PostgreSQL1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/postgresql.md)
* [![Nginx logo](https://n9e.github.io/zh/img/integrations/Nginx.png)Nginx3 仪表盘·2 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/nginx.md)
* [![Elasticsearch logo](https://n9e.github.io/zh/img/integrations/Elasticsearch.png)Elasticsearch5 仪表盘·2 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/elasticsearch.md)
* [![Kafka logo](https://n9e.github.io/zh/img/integrations/Kafka.png)Kafka2 仪表盘·2 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/kafka.md)
* [![MongoDB logo](https://n9e.github.io/zh/img/integrations/MongoDB.png)MongoDB1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/mongodb.md)
* [![Java logo](https://n9e.github.io/zh/img/integrations/Java.png)Java3 仪表盘](https://n9e.github.io/zh/integrations/java.md)
* [![RabbitMQ logo](https://n9e.github.io/zh/img/integrations/RabbitMQ.png)RabbitMQ4 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/rabbitmq.md)
* [![SNMP logo](https://n9e.github.io/zh/img/integrations/SNMP.png)SNMP9 仪表盘·5 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/snmp.md)
* [![Ping logo](https://n9e.github.io/zh/img/integrations/Ping.png)Ping2 仪表盘·1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/ping.md)
* [![Alibaba Cloud logo](https://n9e.github.io/zh/img/integrations/AliYun.png)Alibaba Cloud44 仪表盘·12 组规则·采集配置](https://n9e.github.io/zh/integrations/aliyun.md)
* [![AMD ROCm SMI logo](https://n9e.github.io/zh/img/integrations/AMD_ROCm_SMI.png)AMD ROCm SMI1 组规则·采集配置](https://n9e.github.io/zh/integrations/amd-rocm-smi.md)
* [![Exec logo](https://n9e.github.io/zh/img/integrations/Exec.png)Exec采集配置](https://n9e.github.io/zh/integrations/exec.md)
* [![Filecount logo](https://n9e.github.io/zh/img/integrations/Filecount.png)Filecount采集配置仅中文](https://github.com/ccfos/nightingale/blob/main/integrations/Filecount/markdown/README.md)
* [![IPMI logo](https://n9e.github.io/zh/img/integrations/IPMI.png)IPMI3 仪表盘·1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/ipmi.md)
* [![IPVS logo](https://n9e.github.io/zh/img/integrations/IPVS.png)IPVS1 组规则·采集配置仅中文](https://github.com/ccfos/nightingale/blob/main/integrations/IPVS/markdown/README.md)
* [![Netstat Filter logo](https://n9e.github.io/zh/img/integrations/Netstat_Filter.png)Netstat Filter1 组规则·采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Netstat_Filter/markdown/README.md)
* [![NFSClient logo](https://n9e.github.io/zh/img/integrations/NFSClient.png)NFSClient1 组规则·采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/NFSClient/markdown/README.md)
* [![NVIDIA logo](https://n9e.github.io/zh/img/integrations/NVIDIA.png)NVIDIA3 仪表盘·1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/nvidia.md)
* [![Procstat logo](https://n9e.github.io/zh/img/integrations/Procstat.png)Procstat1 仪表盘·1 组规则·采集配置·指标说明仅英文](https://github.com/ccfos/nightingale/blob/main/integrations/Procstat/markdown/README.en_US.md)
* [![Redfish logo](https://n9e.github.io/zh/img/integrations/Redfish.png)Redfish采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Redfish/markdown/README.md)
* [![SMART logo](https://n9e.github.io/zh/img/integrations/SMART.png)SMART1 仪表盘·1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/smart.md)
* [![Systemd logo](https://n9e.github.io/zh/img/integrations/Systemd.png)Systemd1 仪表盘·1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/systemd.md)
* [![ClickHouse logo](https://n9e.github.io/zh/img/integrations/ClickHouse.png)ClickHouse2 仪表盘·2 组规则·采集配置·指标说明仅中文](https://n9e.github.io/zh/integrations/clickhouse.md)
* [![Dameng logo](https://n9e.github.io/zh/img/integrations/Dameng.png)Dameng1 仪表盘·1 组规则·采集配置·指标说明仅英文](https://github.com/ccfos/nightingale/blob/main/integrations/Dameng/markdown/README.en_US.md)
* [![Doris logo](https://n9e.github.io/zh/img/integrations/Doris.svg)Doris1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/doris.md)
* [![Greenplum logo](https://n9e.github.io/zh/img/integrations/Greenplum.png)Greenplum1 组规则·采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Greenplum/markdown/README.md)
* [![Kingbase logo](https://n9e.github.io/zh/img/integrations/Kingbase.png)Kingbase1 仪表盘仅英文](https://github.com/ccfos/nightingale/blob/main/integrations/Kingbase/markdown/README.en_US.md)
* [![Oracle logo](https://n9e.github.io/zh/img/integrations/Oracle.png)Oracle1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/oracle.md)
* [![Prometheus logo](https://n9e.github.io/zh/img/integrations/Prometheus.png)Prometheus采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Prometheus/markdown/README.md)
* [![SQLServer logo](https://n9e.github.io/zh/img/integrations/SQLServer.png)SQLServer1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/sqlserver.md)
* [![TDengine logo](https://n9e.github.io/zh/img/integrations/TDEngine.png)TDengine1 仪表盘](https://github.com/ccfos/nightingale/blob/main/integrations/TDEngine/markdown/README.md)
* [![TiDB logo](https://n9e.github.io/zh/img/integrations/TiDB.png)TiDB1 仪表盘·1 组规则](https://n9e.github.io/zh/integrations/tidb.md)
* [![VictoriaMetrics logo](https://n9e.github.io/zh/img/integrations/VictoriaMetrics.png)VictoriaMetrics2 仪表盘·1 组规则](https://n9e.github.io/zh/integrations/victoriametrics.md)
* [![AutoMQ logo](https://n9e.github.io/zh/img/integrations/AutoMQ.png)AutoMQ5 仪表盘·1 组规则·采集配置·指标说明仅英文](https://n9e.github.io/zh/integrations/automq.md)
* [![Canal logo](https://n9e.github.io/zh/img/integrations/Canal.png)Canal1 仪表盘](https://github.com/ccfos/nightingale/blob/main/integrations/Canal/markdown/README.md)
* [![EMQX logo](https://n9e.github.io/zh/img/integrations/EMQX.png)EMQX1 组规则·采集配置](https://n9e.github.io/zh/integrations/emqx.md)
* [![NSQ logo](https://n9e.github.io/zh/img/integrations/NSQ.png)NSQ1 组规则·采集配置](https://n9e.github.io/zh/integrations/nsq.md)
* [![RocketMQ logo](https://n9e.github.io/zh/img/integrations/RocketMQ.png)RocketMQ采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/RocketMQ/markdown/README.md)
* [![ZooKeeper logo](https://n9e.github.io/zh/img/integrations/ZooKeeper.png)ZooKeeper1 仪表盘·1 组规则·采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/ZooKeeper/markdown/README.md)
* [![Apache logo](https://n9e.github.io/zh/img/integrations/Apache.png)Apache1 组规则·采集配置](https://n9e.github.io/zh/integrations/apache.md)
* [![Bind logo](https://n9e.github.io/zh/img/integrations/Bind.png)Bind1 组规则·采集配置](https://n9e.github.io/zh/integrations/bind.md)
* [![Consul logo](https://n9e.github.io/zh/img/integrations/Consul.png)Consul1 组规则·采集配置仅中文](https://n9e.github.io/zh/integrations/consul.md)
* [![HAProxy logo](https://n9e.github.io/zh/img/integrations/HAProxy.png)HAProxy1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/haproxy.md)
* [![IIS logo](https://n9e.github.io/zh/img/integrations/IIS.png)IIS采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/IIS/markdown/README.md)
* [![Jolokia Agent logo](https://n9e.github.io/zh/img/integrations/Jolokia_Agent.png)Jolokia Agent采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Jolokia_Agent/markdown/README.md)
* [![Ldap logo](https://n9e.github.io/zh/img/integrations/Ldap.png)Ldap1 组规则·采集配置仅中文](https://n9e.github.io/zh/integrations/ldap.md)
* [![Logstash logo](https://n9e.github.io/zh/img/integrations/Logstash.png)Logstash1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/logstash.md)
* [![Mtail logo](https://n9e.github.io/zh/img/integrations/Mtail.png)Mtail采集配置](https://n9e.github.io/zh/integrations/mtail.md)
* [![PHP logo](https://n9e.github.io/zh/img/integrations/PHP.png)PHP1 组规则·采集配置](https://n9e.github.io/zh/integrations/php.md)
* [![Radius logo](https://n9e.github.io/zh/img/integrations/Radius.png)Radius采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Radius/markdown/README.md)
* [![SpringBoot logo](https://n9e.github.io/zh/img/integrations/SpringBoot.png)SpringBoot2 仪表盘·1 组规则](https://n9e.github.io/zh/integrations/springboot.md)
* [![Tomcat logo](https://n9e.github.io/zh/img/integrations/Tomcat.png)Tomcat1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/tomcat.md)
* [![cAdvisor logo](https://n9e.github.io/zh/img/integrations/cAdvisor.png)cAdvisor1 仪表盘·1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/cadvisor.md)
* [![Ceph logo](https://n9e.github.io/zh/img/integrations/Ceph.png)Ceph1 仪表盘·1 组规则](https://n9e.github.io/zh/integrations/ceph.md)
* [![MinIO logo](https://n9e.github.io/zh/img/integrations/MinIO.png)MinIO2 仪表盘·1 组规则](https://n9e.github.io/zh/integrations/minio.md)
* [![OpenStack logo](https://n9e.github.io/zh/img/integrations/OpenStack.png)OpenStack1 组规则·采集配置](https://n9e.github.io/zh/integrations/openstack.md)
* [![vSphere logo](https://n9e.github.io/zh/img/integrations/vSphere.png)vSphere2 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/vsphere.md)
* [![XSKY logo](https://n9e.github.io/zh/img/integrations/XSKYApi.png)XSKY1 组规则·采集配置仅中文](https://github.com/ccfos/nightingale/blob/main/integrations/XSKYApi/markdown/README.md)
* [![Akamai logo](https://n9e.github.io/zh/img/integrations/Akamai.svg)Akamai1 仪表盘·1 组规则·采集配置仅英文](https://github.com/ccfos/nightingale/blob/main/integrations/Akamai/markdown/README.en_US.md)
* [![Azure logo](https://n9e.github.io/zh/img/integrations/Azure.svg)Azure采集配置仅英文](https://n9e.github.io/zh/integrations/azure.md)
* [![CDN logo](https://n9e.github.io/zh/img/integrations/CDN.png)CDN1 组规则·采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/CDN/markdown/README.md)
* [![Cloudflare logo](https://n9e.github.io/zh/img/integrations/Cloudflare.png)Cloudflare1 仪表盘·1 组规则·采集配置仅英文](https://github.com/ccfos/nightingale/blob/main/integrations/Cloudflare/markdown/README.en_US.md)
* [![CloudWatch logo](https://n9e.github.io/zh/img/integrations/CloudWatch.png)CloudWatch1 仪表盘·1 组规则·采集配置仅中文](https://n9e.github.io/zh/integrations/cloudwatch.md)
* [![GoogleCloud logo](https://n9e.github.io/zh/img/integrations/GoogleCloud.png)GoogleCloud采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/GoogleCloud/markdown/README.md)
* [![Huawei Cloud logo](https://n9e.github.io/zh/img/integrations/Huawei.svg)Huawei Cloud14 仪表盘·4 组规则·指标说明](https://n9e.github.io/zh/integrations/huawei.md)
* [![Tencent Cloud logo](https://n9e.github.io/zh/img/integrations/Tencent.svg)Tencent Cloud7 仪表盘仅英文](https://n9e.github.io/zh/integrations/tencent.md)
* [![DNS Query logo](https://n9e.github.io/zh/img/integrations/Dns_Query.png)DNS Query1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/dns-query.md)
* [![HTTP Response logo](https://n9e.github.io/zh/img/integrations/HTTP_Response.png)HTTP Response1 仪表盘·1 组规则·采集配置·指标说明仅英文](https://github.com/ccfos/nightingale/blob/main/integrations/HTTP_Response/markdown/README.en_US.md)
* [![Meraki logo](https://n9e.github.io/zh/img/integrations/Meraki.png)Meraki采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Meraki/markdown/README.md)
* [![Net Response logo](https://n9e.github.io/zh/img/integrations/Net_Response.png)Net Response2 仪表盘·1 组规则·采集配置·指标说明](https://n9e.github.io/zh/integrations/net-response.md)
* [![Switch (legacy) logo](https://n9e.github.io/zh/img/integrations/Switch_Legacy.png)Switch (legacy)1 仪表盘·1 组规则·采集配置](https://n9e.github.io/zh/integrations/switch-legacy.md)
* [![Whois logo](https://n9e.github.io/zh/img/integrations/Whois.png)Whois1 组规则·采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Whois/markdown/README.md)
* [![X.509 Certificate logo](https://n9e.github.io/zh/img/integrations/X509_Cert.png)X.509 Certificate采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/X509_Cert/markdown/README.md)
* [![AppDynamics logo](https://n9e.github.io/zh/img/integrations/AppDynamics.png)AppDynamics采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/AppDynamics/markdown/README.md)
* [![Gitlab logo](https://n9e.github.io/zh/img/integrations/Gitlab.png)Gitlab5 仪表盘·1 组规则](https://n9e.github.io/zh/integrations/gitlab.md)
* [![Jenkins logo](https://n9e.github.io/zh/img/integrations/Jenkins.png)Jenkins1 组规则·采集配置](https://github.com/ccfos/nightingale/blob/main/integrations/Jenkins/markdown/README.md)
* [![Zabbix logo](https://n9e.github.io/zh/img/integrations/Zabbix.svg)Zabbix1 仪表盘·采集配置仅英文](https://github.com/ccfos/nightingale/blob/main/integrations/Zabbix/markdown/README.en_US.md)

展开全部 83 个模板

<!-- -->

↓

[在 GitHub 查看全部模板<!-- --> →](https://github.com/ccfos/nightingale/tree/main/integrations)2026-10-15

COLLECTORS

## 数据怎么进来

夜莺自身不做数据采集。上面的模板默认按 Categraf 写，但只要能写 Prometheus Remote Write 的采集器都能接。

### Categraf推荐

一个 agent 覆盖操作系统、中间件、数据库与云厂商，内置模板的采集配置都是给它写的。

[Categraf 文档](https://n9e.github.io/zh/docs/data/categraf.md)

<!-- -->

[ →](https://n9e.github.io/zh/docs/data/categraf.md)

### Telegraf / Datadog Agent

已经在跑的不用换，把输出指到夜莺的 Remote Write 地址即可。

[采集器接入](https://n9e.github.io/zh/docs/data/integrations/collector-config.md)

<!-- -->

[ →](https://n9e.github.io/zh/docs/data/integrations/collector-config.md)

### 各类 Exporter

node\_exporter、mysqld\_exporter 这些 Prometheus 生态的 exporter 由 Categraf 或 Prometheus 抓取后写入。

[采集配置说明](https://n9e.github.io/zh/docs/data/integrations/collector-config.md)

<!-- -->

[ →](https://n9e.github.io/zh/docs/data/integrations/collector-config.md)

### Remote Write 直写

自研程序或 OpenTelemetry Collector 直接向 /prometheus/v1/write 推送。

[验证数据到达](https://n9e.github.io/zh/docs/data/integrations/verify.md)

<!-- -->

[ →](https://n9e.github.io/zh/docs/data/integrations/verify.md)

## 没找到你要的？

模板清单来自开源仓库，每个模板就是一个目录：图标、采集配置、仪表盘、告警规则。缺什么可以提 Issue，也可以按规范自己写一个提 PR。

[提 Issue 申请](https://github.com/ccfos/nightingale/issues/new/choose)[模板规范](https://n9e.github.io/zh/docs/reference/integration-schema.md)
