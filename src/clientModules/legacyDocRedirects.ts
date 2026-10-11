import type { ClientModule } from '@docusaurus/types';
import { legacyTarget } from '@site/scripts/legacy-doc-urls.mjs';

const module: ClientModule = {
  onRouteUpdate({ location }) {
    const target = legacyTarget(location.pathname);
    if (target) window.location.replace(target + location.search + location.hash);
  },
};

export default module;
