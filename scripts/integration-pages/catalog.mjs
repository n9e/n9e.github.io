/**
 * 哪些集成有独立页（/integrations/<slug>），以及 ident → slug 的规则。
 *
 * 一期只放「富」页面：内置规则 ≥ 5 条、或仪表盘 ≥ 2 张、或上游 README ≥ 4KB 的 54 个。
 * 没列进来的集成，目录页卡片仍然链到 GitHub 上的模板目录。上游新增模板不会自动进来——
 * 这是刻意的：每一页都要先在 intros.mjs 里写好介绍，没有介绍的页面只剩表格，不值得收录。
 */
export const PAGES = [
  // 主机
  'Linux', 'Windows', 'Systemd', 'SMART', 'IPMI', 'NVIDIA', 'AMD_ROCm_SMI', 'Exec',
  // 数据库
  'MySQL', 'PostgreSQL', 'Redis', 'MongoDB', 'Oracle', 'SQLServer', 'Elasticsearch',
  'ClickHouse', 'Doris', 'TiDB', 'VictoriaMetrics',
  // 消息队列
  'Kafka', 'RabbitMQ', 'NSQ', 'EMQX', 'AutoMQ',
  // Web 与中间件
  'Nginx', 'Apache', 'HAProxy', 'Tomcat', 'Java', 'SpringBoot', 'PHP', 'Consul', 'Ldap',
  'Bind', 'Logstash', 'Mtail',
  // 容器与云原生
  'Kubernetes', 'Docker', 'cAdvisor', 'Ceph', 'MinIO', 'OpenStack', 'vSphere',
  // 云平台
  'AliYun', 'Huawei', 'Tencent', 'CloudWatch', 'Azure',
  // 网络
  'SNMP', 'Switch_Legacy', 'Ping', 'Net_Response', 'Dns_Query',
  // DevOps
  'Gitlab',
];

/** `AMD_ROCm_SMI` → `amd-rocm-smi`，`cAdvisor` → `cadvisor` */
export function slugOf(ident) {
  return ident.toLowerCase().replace(/_+/g, '-');
}
