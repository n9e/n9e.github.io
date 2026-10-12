/**
 * 生成 robots.txt。
 *
 * Docusaurus 不会自己生成；没有 robots.txt 时搜索引擎只会按约定去找根目录的 /sitemap.xml，
 * 中文站的 /zh/sitemap.xml 永远发现不了。Sitemap 行从 siteConfig.url 和各语言的 baseUrl 拼出来，
 * 站点地址只在 docusaurus.config.ts 改一处。
 *
 * 只在默认语言的构建里写一次（它的 outDir 就是站点根目录）；中文构建的 outDir 是 build/zh/，
 * 那里的 robots.txt 没人读。
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export default function robotsTxtPlugin(context) {
  return {
    name: 'n9e-robots-txt',
    async postBuild({ outDir, siteConfig, i18n }) {
      if (i18n.currentLocale !== i18n.defaultLocale) return;
      const origin = siteConfig.url.replace(/\/+$/, '');
      const sitemaps = i18n.locales.map((locale) => {
        const baseUrl = i18n.localeConfigs[locale]?.baseUrl ?? siteConfig.baseUrl;
        return `Sitemap: ${origin}${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}sitemap.xml`;
      });
      // 全站允许抓取，包括 AI 爬虫：llms.txt 和每页的 .md 原文就是给它们准备的。
      const lines = ['User-agent: *', 'Allow: /', '', ...sitemaps, ''];
      await fs.writeFile(path.join(outDir, 'robots.txt'), lines.join('\n'));
    },
  };
}
