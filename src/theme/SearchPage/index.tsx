import React from 'react';
import Head from '@docusaurus/Head';
import SearchPage from '@theme-original/SearchPage';

/**
 * 搜索结果页不该进搜索引擎索引：内容随 ?q= 变化，空页面没有信息量。
 * 同时在 docusaurus.config.ts 的 sitemap.ignorePatterns 里把它从 sitemap 排除。
 */
export default function SearchPageWrapper(props: React.ComponentProps<typeof SearchPage>): React.ReactElement {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <SearchPage {...props} />
    </>
  );
}
