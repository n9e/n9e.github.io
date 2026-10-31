import React from 'react';
import Head from '@docusaurus/Head';
import type { PageMeta as Meta } from '@site/src/content/types';

/**
 * 整句接管 <title>：Layout 收到 title 会拼成「X | 站点名」，这里放在 Layout 里面渲染，
 * 覆盖 Layout 写的 title / og:title。description 仍然交给 Layout。
 */
export default function PageMeta({ meta }: { meta: Meta }): React.ReactElement {
  return (
    <Head>
      <title>{meta.title}</title>
      <meta property="og:title" content={meta.title} />
      <meta name="twitter:title" content={meta.title} />
    </Head>
  );
}
