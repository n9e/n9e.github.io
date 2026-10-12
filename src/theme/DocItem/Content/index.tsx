import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Head from '@docusaurus/Head';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import type { Props } from '@theme/DocItem/Content';
import Planned from '@site/src/components/docs/Planned';

/**
 * 覆盖官方 DocItem/Content（升级时对照 theme-classic/lib/theme/DocItem/Content 同步）。
 * 改了两处：
 *
 * 1. H1 下面渲染 front matter 的 description 作为导语（参考 Mintlify / Flashduty 的文章头：
 *    分组名 → 标题 → 一句话说明 → 正文）。每一页本来就有这句话——它同时是分组索引卡片、
 *    <meta description> 和占位页"本页将会讲"的内容；让它在正文里也可见，作者就会认真写它。
 *    占位页不渲染（Planned 组件已经把这句话放在显眼位置），hide_title 的页也不渲染。
 *
 * 2. planned: true 的页面在正文（此时只有 H1）后面渲染占位提示，并打 noindex。
 *    noindex 一石二鸟：站点地图和站内搜索插件都会跳过——占位页既不会被 Google
 *    收录成一百多页"敬请期待"，也不会把真正写了的页挤下去。
 *
 * 3. front matter 的 last_reviewed（YYYY-MM-DD）渲染成导语下的「最后校对于」一行，并作为
 *    article:modified_time 和 TechArticle.dateModified 输出。有意不用 git 时间
 *    （见 docusaurus.config.ts 里关于 showLastUpdateTime 的说明）：这个日期只在有人真的
 *    对着产品核过这一页之后手工改，所以它才是有信息量的新鲜度信号。
 */
function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  return shouldRender ? metadata.title : null;
}

type N9eFrontMatter = { planned?: boolean; last_reviewed?: string | Date };

/** front matter 里的日期 YAML 会解析成 Date；统一成 YYYY-MM-DD 字符串 */
function isoDate(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : undefined;
}

export default function DocItemContent({ children }: Props): ReactNode {
  const { frontMatter, metadata } = useDoc();
  const { siteConfig, i18n } = useDocusaurusContext();
  const syntheticTitle = useSyntheticTitle();
  const { planned = false, last_reviewed } = frontMatter as N9eFrontMatter;
  const lead = !planned && syntheticTitle ? frontMatter.description : undefined;
  const reviewed = planned ? undefined : isoDate(last_reviewed);
  const article = reviewed && {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metadata.title,
    description: metadata.description,
    inLanguage: i18n.currentLocale === 'en' ? 'en' : 'zh-CN',
    dateModified: reviewed,
    url: siteConfig.url.replace(/\/+$/, '') + metadata.permalink,
  };

  return (
    <>
      {planned && (
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      )}
      {reviewed && (
        <Head>
          <meta property="article:modified_time" content={reviewed} />
          <script type="application/ld+json">{JSON.stringify(article)}</script>
        </Head>
      )}
      <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
        {syntheticTitle && (
          <header className="n9e-doc-header">
            <Heading as="h1">{syntheticTitle}</Heading>
            {lead && <p className="n9e-doc-lead">{lead}</p>}
            {reviewed && (
              <p className="n9e-doc-reviewed">
                <Translate id="theme.n9e.lastReviewed" values={{ date: <time dateTime={reviewed}>{reviewed}</time> }}>
                  {'Last reviewed {date}'}
                </Translate>
              </p>
            )}
          </header>
        )}
        <MDXContent>{children}</MDXContent>
        {planned && <Planned />}
      </div>
    </>
  );
}
