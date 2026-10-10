import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Head from '@docusaurus/Head';
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
 */
function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  return shouldRender ? metadata.title : null;
}

export default function DocItemContent({ children }: Props): ReactNode {
  const { frontMatter } = useDoc();
  const syntheticTitle = useSyntheticTitle();
  const planned = Boolean((frontMatter as { planned?: boolean }).planned);
  const lead = !planned && syntheticTitle ? frontMatter.description : undefined;

  return (
    <>
      {planned && (
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
      )}
      <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
        {syntheticTitle && (
          <header className="n9e-doc-header">
            <Heading as="h1">{syntheticTitle}</Heading>
            {lead && <p className="n9e-doc-lead">{lead}</p>}
          </header>
        )}
        <MDXContent>{children}</MDXContent>
        {planned && <Planned />}
      </div>
    </>
  );
}
