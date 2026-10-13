// 集成独立页（/integrations/<slug>）的侧栏：按分类分组，条目来自 src/data/integration-pages/index.json，
// 由 scripts/integration-pages/fetch.mjs 维护。分类名和集成目录页的 chips 用同一份文案。
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
import index from './src/data/integration-pages/index.json';

const isEn = process.env.DOCUSAURUS_CURRENT_LOCALE === 'en';

// 顺序和 scripts/integration-categories.mjs 的 CATEGORY_ORDER 一致
const CATEGORY_ORDER = ['host', 'database', 'mq', 'web', 'cloud-native', 'cloud', 'network', 'devops', 'other'];

const LABELS: Record<string, [string, string]> = {
  host: ['Hosts & hardware', '主机与硬件'],
  database: ['Databases & storage', '数据库与存储'],
  mq: ['Message queues', '消息队列'],
  web: ['Web & middleware', 'Web 与中间件'],
  'cloud-native': ['Containers & cloud native', '容器与云原生'],
  cloud: ['Cloud providers & CDN', '云厂商与 CDN'],
  network: ['Network & probes', '网络与探测'],
  devops: ['DevOps & others', 'DevOps 与其他'],
  other: ['Others', '其他'],
};

const sidebars: SidebarsConfig = {
  integrations: [
    { type: 'link', label: isEn ? 'All integrations' : '全部集成', href: '/integrations' },
    ...CATEGORY_ORDER
      .map((category) => ({
        category,
        ids: index.pages.filter((p) => p.category === category).map((p) => p.slug),
      }))
      .filter((g) => g.ids.length > 0)
      .map((g) => ({
        type: 'category' as const,
        label: (LABELS[g.category] ?? [g.category, g.category])[isEn ? 0 : 1],
        collapsed: false,
        items: g.ids,
      })),
  ],
};

export default sidebars;
