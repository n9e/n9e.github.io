import React from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useCopy } from '@site/src/content';
import repo from '@site/src/data/stats.json';

const GITHUB = 'https://github.com/ccfos/nightingale';
const DOCKER_HUB = 'https://hub.docker.com/r/flashcatcloud/nightingale';
const WIKIDATA = 'https://www.wikidata.org/wiki/Q141806446';

/**
 * 首页的 JSON-LD。两段：
 *   SoftwareApplication —— 这是个什么软件：全名、别名（夜莺 / 夜莺监控 / n9e）、许可证、版本、仓库。
 *     "Nightingale" 单独一个词歧义太大，alternateName + sameAs 是搜索引擎和 AI 把站点和
 *     GitHub 仓库认成同一个实体的依据。
 *   WebSite —— 站点本身，带站内搜索入口（/search?q=）。
 * 旧 Hugo 站有一段 Organization，name 写成了主题名 Doks；这里不再声明组织，只声明软件和站点。
 */
export default function StructuredData(): React.ReactElement {
  const { siteConfig, i18n } = useDocusaurusContext();
  const { hero } = useCopy();
  const isEn = i18n.currentLocale === 'en';
  const base = siteConfig.url.replace(/\/+$/, '') + siteConfig.baseUrl;
  const inLanguage = isEn ? 'en' : 'zh-CN';

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Nightingale',
    alternateName: ['夜莺', '夜莺监控', 'n9e', 'N9E'],
    description: hero.metaDescription,
    url: base,
    inLanguage,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Linux, Docker, Kubernetes',
    softwareVersion: repo.latestRelease,
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: `${base}download`,
    softwareHelp: { '@type': 'CreativeWork', url: `${base}docs` },
    sameAs: [GITHUB, DOCKER_HUB, WIKIDATA],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: isEn ? 'Nightingale' : '夜莺监控 Nightingale',
    alternateName: ['n9e', '夜莺'],
    url: base,
    inLanguage,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${base}search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(software)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </Head>
  );
}
