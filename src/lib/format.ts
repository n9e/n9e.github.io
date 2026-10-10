/** 千分位。手写而不用 toLocaleString，保证服务端与浏览器渲染结果一致。 */
export function thousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 概数（13272 → "13k+"）。按钮上放概数比精确值更好扫读。
 * 注意仍然由构建时抓来的真实 star 数算出，只是显示时向下取整——
 * 不是写死的字面量，不会出现"12000+"那种停在某一年的数字。
 */
export function compact(n: number): string {
  if (n < 1000) return String(n);
  return `${Math.floor(n / 1000)}k+`;
}

/**
 * 导航栏 star 数（13296 → "13.2k"），和同类开源官网一样保留一位小数。
 * 同样向下取整，宁可少报不多报；整千时去掉 ".0"。
 */
export function starCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(Math.floor(n / 100) / 10).toString()}k`;
}
