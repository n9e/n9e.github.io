import MDXComponents from '@theme-original/MDXComponents';
import Shot from '@site/src/components/docs/Shot';
import StackLayers from '@site/src/components/docs/StackLayers';

/**
 * 注册到全局的 MDX 组件，正文里不用 import 就能直接写。
 * Shot：截图要跟着站点主题切明暗，用普通的 ![]() 做不到。
 * StackLayers：where-it-fits 页的六层架构图，颜色同样跟着主题走。
 */
export default {
  ...MDXComponents,
  Shot,
  StackLayers,
};
