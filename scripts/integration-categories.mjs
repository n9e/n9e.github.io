/**
 * 内置集成模板的分类映射与隐藏名单。
 *
 * ccfos/nightingale 的 integrations/ 目录没有分类字段（BuiltinComponent 只有
 * ident / logo / readme），官网是分类的唯一来源，所以放在站点里手维护。
 * 上游新增模板而这里没归类时，fetch-integrations.mjs 会打印警告并把它落到 other。
 *
 * 分类 id 的中英文名在 src/content/{zh,en}.ts 的 integrationsPage.categories 里。
 */

/** 分类顺序即页面上 chips 的顺序：主机、数据库、消息队列这些高频的排前面。 */
export const CATEGORY_ORDER = ['host', 'database', 'mq', 'web', 'cloud-native', 'cloud', 'network', 'devops', 'other'];

export const CATEGORY_OF = {
  // 主机与硬件
  Linux: 'host',
  Windows: 'host',
  Procstat: 'host',
  Systemd: 'host',
  Netstat_Filter: 'host',
  Filecount: 'host',
  Exec: 'host',
  NFSClient: 'host',
  IPVS: 'host',
  SMART: 'host',
  IPMI: 'host',
  Redfish: 'host',
  NVIDIA: 'host',
  AMD_ROCm_SMI: 'host',
  HUATUO: 'host',

  // 数据库与存储引擎
  MySQL: 'database',
  PostgreSQL: 'database',
  Oracle: 'database',
  SQLServer: 'database',
  MongoDB: 'database',
  Redis: 'database',
  ClickHouse: 'database',
  Doris: 'database',
  TDEngine: 'database',
  TiDB: 'database',
  Greenplum: 'database',
  Dameng: 'database',
  Kingbase: 'database',
  Elasticsearch: 'database',
  VictoriaMetrics: 'database',
  Prometheus: 'database',

  // 消息队列
  Kafka: 'mq',
  RabbitMQ: 'mq',
  RocketMQ: 'mq',
  NSQ: 'mq',
  EMQX: 'mq',
  AutoMQ: 'mq',
  ZooKeeper: 'mq',
  Canal: 'mq',

  // Web 与中间件
  Nginx: 'web',
  Apache: 'web',
  HAProxy: 'web',
  Tomcat: 'web',
  PHP: 'web',
  IIS: 'web',
  Java: 'web',
  SpringBoot: 'web',
  Jolokia_Agent: 'web',
  Bind: 'web',
  Ldap: 'web',
  Radius: 'web',
  Consul: 'web',
  Logstash: 'web',
  Mtail: 'web',

  // 容器与云原生
  Kubernetes: 'cloud-native',
  Docker: 'cloud-native',
  cAdvisor: 'cloud-native',
  vSphere: 'cloud-native',
  OpenStack: 'cloud-native',
  Ceph: 'cloud-native',
  MinIO: 'cloud-native',
  XSKYApi: 'cloud-native',

  // 云厂商与 CDN
  AliYun: 'cloud',
  Tencent: 'cloud',
  Huawei: 'cloud',
  CloudWatch: 'cloud',
  Azure: 'cloud',
  GoogleCloud: 'cloud',
  Akamai: 'cloud',
  Cloudflare: 'cloud',
  CDN: 'cloud',

  // 网络与探测
  SNMP: 'network',
  Switch_Legacy: 'network',
  Meraki: 'network',
  Ping: 'network',
  Dns_Query: 'network',
  Net_Response: 'network',
  HTTP_Response: 'network',
  X509_Cert: 'network',
  Whois: 'network',

  // DevOps 与其他
  Gitlab: 'devops',
  Jenkins: 'devops',
  Skywalking: 'devops',
  AppDynamics: 'devops',
  Zabbix: 'devops',
  N9E: 'devops',
  LLM: 'devops',
};

/** 对外解释成本高的模板，官网目录里不展示（2026-09-19 评审决定）。 */
export const HIDDEN = new Set(['HUATUO', 'Skywalking', 'N9E', 'LLM']);

/**
 * 目录名到展示名。目录名带下划线或大小写随意（Dns_Query、cAdvisor、AliYun），
 * 没列的按目录名原样显示。
 */
export const DISPLAY_NAME = {
  AMD_ROCm_SMI: 'AMD ROCm SMI',
  AliYun: 'Alibaba Cloud',
  Dns_Query: 'DNS Query',
  HTTP_Response: 'HTTP Response',
  Huawei: 'Huawei Cloud',
  Jolokia_Agent: 'Jolokia Agent',
  Net_Response: 'Net Response',
  Netstat_Filter: 'Netstat Filter',
  Switch_Legacy: 'Switch (legacy)',
  TDEngine: 'TDengine',
  Tencent: 'Tencent Cloud',
  X509_Cert: 'X.509 Certificate',
  XSKYApi: 'XSKY',
};

/** 搜索别名：用户会敲的缩写或旧叫法。 */
export const ALIASES = {
  AliYun: ['aliyun', '阿里云'],
  Tencent: ['腾讯云', 'qcloud'],
  Huawei: ['华为云', 'hwcloud'],
  Kubernetes: ['k8s'],
  PostgreSQL: ['pgsql', 'postgres'],
  Elasticsearch: ['es'],
  VictoriaMetrics: ['vm'],
  SQLServer: ['mssql'],
  Dns_Query: ['dns'],
  X509_Cert: ['ssl', 'tls', 'cert', '证书'],
  Net_Response: ['tcp', 'port', '端口'],
  HTTP_Response: ['http', 'url', '拨测'],
  Ping: ['icmp'],
  Linux: ['host', '主机', 'cpu', 'mem', 'disk'],
  Windows: ['win'],
  vSphere: ['vmware', 'esxi'],
  CloudWatch: ['aws', 'amazon'],
  GoogleCloud: ['gcp'],
  Switch_Legacy: ['交换机'],
  SNMP: ['交换机', '网络设备'],
};
