import React from 'react';
import Layout from '@theme/Layout';
import { useCopy } from '@site/src/content';
import Hero from '@site/src/components/home/Hero';
import Stats from '@site/src/components/home/Stats';
import Pipeline from '@site/src/components/home/Pipeline';
import Mcp from '@site/src/components/home/Mcp';
import Integrations from '@site/src/components/home/Integrations';
import Deploy from '@site/src/components/home/Deploy';
import Compare from '@site/src/components/home/Compare';
import Trust from '@site/src/components/home/Trust';
import FinalCta from '@site/src/components/home/FinalCta';

export default function Home(): React.ReactElement {
  const { hero } = useCopy();

  return (
    <Layout description={hero.lead}>
      <main>
        <Hero />
        <Stats />
        <Pipeline />
        <Mcp />
        <Integrations />
        <Deploy />
        <Compare />
        <Trust />
        <FinalCta />
      </main>
    </Layout>
  );
}
