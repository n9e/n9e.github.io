/**
 * 百度统计的单页应用补丁。
 *
 * hm.js 只在整页加载时记一次 PV；Docusaurus 站内点链接是前端路由切换，不会重新加载页面，
 * 不补的话从首页点进文档的所有浏览都记不上。这里在每次路由切换后手动上报一次。
 * 首次加载由 hm.js 自己记，跳过，避免重复。
 */
import type { ClientModule } from '@docusaurus/types';

declare global {
  interface Window {
    _hmt?: unknown[][];
  }
}

const module: ClientModule = {
  onRouteDidUpdate({ location, previousLocation }) {
    if (!previousLocation || location.pathname === previousLocation.pathname) return;
    window._hmt = window._hmt || [];
    window._hmt.push(['_trackPageview', location.pathname + location.search]);
  },
};

export default module;
