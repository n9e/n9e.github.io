#!/usr/bin/env node
/**
 * 上游集成模板里已知问题的临时修正，在 fetch.mjs 写 src/data/integration-pages/<Ident>.json 时套用。
 *
 * 正式修复在 ccfos/nightingale 的 fix/integration-alert-templates 分支（2026-11-01）。上游合并之后，
 * 下次抓取时这里的条目会因为 when() 不再成立而不生效，脚本会打印提示——那时把对应条目删掉。
 * 每条都必须带 when()：只在上游仍是旧写法时改，避免盖掉上游后来的修改。
 *
 *   node scripts/integration-pages/overrides.mjs   # 对已入库的 JSON 原地套用一次（幂等）
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const promql = (a) => a.queries.map((q) => q.promql).join('\n');

export const ALERT_OVERRIDES = [
  {
    ident: 'Kubernetes',
    name: '容器CPU使用率超过80%',
    why: 'kube_pod_container_resource_limits_cpu_cores 在 kube-state-metrics 2.0 已删除，pod_name 标签在 Kubernetes 1.16 已删除，规则在新集群上永远不命中',
    when: (a) => promql(a).includes('kube_pod_container_resource_limits_cpu_cores'),
    promql:
      '100 * sum by (namespace, pod, container) (rate(container_cpu_usage_seconds_total{container!="", container!="POD"}[2m])) / sum by (namespace, pod, container) (kube_pod_container_resource_limits{resource="cpu"}) > 80',
  },
  {
    ident: 'Kubernetes',
    name: '容器内存超过80%',
    why: '按已删除的 pod_name 标签分组，且把 Pod 级 cgroup 也算了进去',
    when: (a) => promql(a).includes('pod_name'),
    promql:
      '100 * sum by (namespace, pod, container) (container_memory_working_set_bytes{container!="", container!="POD"}) / sum by (namespace, pod, container) (container_spec_memory_limit_bytes{container!="", container!="POD"} > 0) > 80',
  },
  {
    ident: 'Elasticsearch',
    name: 'Elastic Cluster Yellow status',
    why: '滚动重启时集群必然短暂变黄，for 0 会在第一个样本就告警',
    when: (a) => a.for === 0,
    for: 600,
  },
  {
    ident: 'Kubernetes',
    name: '使用的节点Conntrack条目数量高',
    why: '采样值单点超阈值就告警；和同类的 80% 规则一样等 5 分钟',
    when: (a) => a.for === 0,
    for: 300,
  },
];

/** 返回修正后的规则；不匹配或上游已修好时原样返回 */
export function applyAlertOverrides(ident, alert, used = new Set()) {
  for (const [i, o] of ALERT_OVERRIDES.entries()) {
    if (o.ident !== ident || o.name !== alert.name) continue;
    if (!o.when(alert)) continue;
    used.add(i);
    const next = { ...alert };
    if (o.for !== undefined) next.for = o.for;
    if (o.promql !== undefined) {
      if (next.queries.length !== 1) throw new Error(`${ident} / ${alert.name}: 预期只有一条查询`);
      next.queries = [{ ...next.queries[0], promql: o.promql }];
    }
    return next;
  }
  return alert;
}

/** 本次没生效的条目：多半是上游已经修好，提示删除 */
export function reportUnused(used, idents) {
  for (const [i, o] of ALERT_OVERRIDES.entries()) {
    if (!used.has(i) && idents.includes(o.ident)) {
      console.log(`overrides: ${o.ident} / ${o.name} 未生效：数据已是新写法。若刚从上游重新抓取过，说明上游已修复，可删除此条`);
    }
  }
}

// 直接运行：对已入库的 JSON 原地套用
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data', 'integration-pages');
  const used = new Set();
  const idents = [...new Set(ALERT_OVERRIDES.map((o) => o.ident))];
  for (const ident of idents) {
    const file = join(dir, `${ident}.json`);
    const data = JSON.parse(await readFile(file, 'utf8'));
    data.alerts = data.alerts.map((a) => applyAlertOverrides(ident, a, used));
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
  }
  reportUnused(used, idents);
  console.log(`overrides: 已套用 ${used.size} / ${ALERT_OVERRIDES.length} 条`);
}
