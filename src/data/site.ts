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
  'https://join.slack.com/t/n9e/shared_invite/zt-4ejx42fd0-S9aVULH4FTdH~jEAz80U7g';

/**
 * Live Demo 演示站（设计文档 §6.1）。
 *
 * 留空时 Hero 主 CTA 与导航栏按钮都不渲染——官网上不会出现点进去是 404 的入口。
 * 填上地址后两处入口自动出现，且 Hero 的主 CTA 让位给它（§6.1：demo 是首页主 CTA）。
 *
 * 地址指向演示站的免登录入口（/api/n9e/auth/demo-login）：访客点进去会自动以公共演示账号登录，
 * 不用输入账号密码。
 *
 * docs/get-started/live-demo.md（中英两份）里写死了同一个地址，换域名时要一起改。
 */
export const DEMO_URL = 'https://play.n9e.io/api/n9e/auth/demo-login';
