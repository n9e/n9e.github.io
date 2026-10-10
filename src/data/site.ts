/**
 * 全站共用的外部地址。
 *
 * 单独抽出来，是因为同一个链接会同时出现在 docusaurus.config.ts（导航、页脚）
 * 和 src/content/*.ts（正文里的社区行）。散着写死的话，换一次链接要同时改对
 * 四五个地方，漏掉一处不会报错、不会 404，只会长期不一致。
 */

/**
 * Slack 社区邀请。
 * 注意这是 shared invite（zt- 开头），Slack 侧可以被撤销、也可能过期；
 * 一旦失效，首页社区行、顶部导航、页脚三个入口会同时变成报错页。
 * 换链接只改这一处。
 */
export const SLACK_INVITE =
  'https://join.slack.com/t/n9e/shared_invite/zt-480klxytf-P9qm3C1M87kDmRPp_H30Kw';

/**
 * Live Demo 演示站（设计文档 §6.1）。
 *
 * 留空时 Hero 主 CTA 与导航栏按钮都不渲染——官网上不会出现点进去是 404 的入口。
 * 填上地址后两处入口自动出现，且 Hero 的主 CTA 让位给它（§6.1：demo 是首页主 CTA）。
 *
 * 地址指向演示站的免登录入口（/api/n9e/auth/demo-login）：访客点进去会自动以公共演示账号登录，
 * 不用输入账号密码。
 *
 * ⚠️ 当前是公网 IP 直连，正式 demo 域名定下来后替换；docs/get-started/live-demo.md（中英两份）
 *    里写死了同一个地址，要一起改。
 *    另外它是 http，正式站走 https 后建议 demo 也上 https：虽然普通链接不受
 *    混合内容策略拦截，但浏览器地址栏的安全提示会让人犹豫要不要点。
 */
export const DEMO_URL = 'http://43.106.19.165/api/n9e/auth/demo-login';
