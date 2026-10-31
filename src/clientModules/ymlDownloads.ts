/**
 * 告警规则文件（/alert-rules/*.yml）的下载统计。
 *
 * GA4 增强型衡量的 file_download 只认它内置的扩展名列表，.yml 不在里面，点了也不记。
 * 这里在点击时手动补一个同名事件，数据进入现有的文件下载报告。只匹配 .yml，
 * 避免和 GA4 自动记录的扩展名重复计数。gtag 只在生产构建加载，本地开发不会上报。
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

if (ExecutionEnvironment.canUseDOM) {
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || typeof window.gtag !== 'function') return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !/\.ya?ml$/i.test(url.pathname)) return;
      window.gtag('event', 'file_download', {
        file_extension: url.pathname.split('.').pop()!.toLowerCase(),
        file_name: url.pathname.split('/').pop(),
        link_url: url.href,
        link_text: (a.textContent ?? '').trim(),
      });
    },
    { capture: true },
  );
}

export {};
