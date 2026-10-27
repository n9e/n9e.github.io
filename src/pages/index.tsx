import React from 'react';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import StructuredData from '@site/src/components/home/StructuredData';
import { useCopy } from '@site/src/content';
import Hero from '@site/src/components/home/Hero';
import Stats from '@site/src/components/home/Stats';
import Pipeline from '@site/src/components/home/Pipeline';
import Ai from '@site/src/components/home/Ai';
import Integrations from '@site/src/components/home/Integrations';
import Deploy from '@site/src/components/home/Deploy';
import Compare from '@site/src/components/home/Compare';
import Trust from '@site/src/components/home/Trust';
import FinalCta from '@site/src/components/home/FinalCta';

export default function Home(): React.ReactElement {
  const { hero } = useCopy();

  return (
    // Layout 不传 title：传了会拼成「X | 站点名」。首页的 <title> 由下面的 <Head> 整句接管，
    // 品牌和别名已经在句子里，不需要再加后缀。Head 在 Layout 之后渲染，会覆盖它写的 title / og:title。
    <Layout description={hero.metaDescription}>
      <Head>
        <title>{hero.metaTitle}</title>
        {/* 分享卡片的标题单独写（shareTitle），搜索结果里的 <title> 保持不变。
            X 优先读 twitter:title，没有才退回 og:title，两个都写上 */}
        <meta property="og:title" content={hero.shareTitle} />
        <meta name="twitter:title" content={hero.shareTitle} />
        <meta property="og:type" content="website" />
      </Head>
      <StructuredData />
      <main>
        <Hero />
        <Stats />
        <Pipeline />
        <Ai />
        <Integrations />
        <Deploy />
        <Compare />
        <Trust />
        <FinalCta />
      </main>
    </Layout>
  );
}
