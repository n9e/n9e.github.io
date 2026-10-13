/**
 * 给 @signalwire/docusaurus-plugin-llms-txt 用的 remark 插件，修两处链接问题。
 *
 * 1. 中文站 `/zh/zh/...`。插件把站内链接拼成绝对地址时用的是 siteConfig.url + baseUrl
 *    （中文构建里是 https://n9e.github.io/zh/），而构建出的 HTML 里 href 本身已经带了
 *    baseUrl（/zh/docs/x），两段一拼就多了一层 /zh/。英文站 baseUrl 是 /，碰不到。
 *    不能在 HTML 阶段把前缀剥掉：插件的路由表按带前缀的路径建，剥了就查不到，
 *    链接会被当成站外路径、丢掉 .md 后缀。所以等它拼完，在 Markdown 树上把
 *    「站点地址 + 两次 baseUrl」收成一次。
 * 2. 图片地址。插件只改链接，<img src="/img/..."> 原样落进 .md，离开站点就失效。
 *    这些 Markdown 是给站外模型读的，图片也拼成绝对地址。
 *
 * 只动以 / 开头的站内路径；协议相对（//）、外链、锚点不碰。
 */
export default function llmsTxtLinks({ baseUrl = '/', siteUrl }) {
  const origin = siteUrl.replace(/\/+$/, '');
  const prefix = baseUrl === '/' ? '' : baseUrl.replace(/\/+$/, '');
  const doubled = prefix ? `${origin}${prefix}${prefix}/` : null;
  const single = `${origin}${prefix}/`;

  const isSitePath = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');

  const visit = (node) => {
    if ((node.type === 'link' || node.type === 'definition') && doubled && node.url?.startsWith(doubled)) {
      node.url = single + node.url.slice(doubled.length);
      // 语言首页：插件只认 / 是首页，/zh/ 被当成普通路径，拼出 /zh/.md
      if (node.url === `${single}.md`) node.url = `${single}index.md`;
    }
    if (node.type === 'image' && isSitePath(node.url)) node.url = origin + node.url;
    for (const child of node.children ?? []) visit(child);
  };

  return (tree) => visit(tree);
}
