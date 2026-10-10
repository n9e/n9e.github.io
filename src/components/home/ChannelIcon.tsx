import React from 'react';
import type { IntegrationIcon } from '@site/src/content/types';

/**
 * 电话、邮件这类通用媒介没有品牌 logo，但要和旁边的品牌 logo 摆在同一排。
 * 品牌 logo 全是实心、有色的徽标，细线描边的字形放进去会显得又轻又小，
 * 所以这里也做成"实心圆角方块 + 白色字形"的徽标：尺寸、分量和 logo 一致。
 * 填充色取自站点自己的紫色和电蓝——电话短信、邮件是夜莺自带的通道，
 * 不是第三方产品，用站点色而不是随便借一个品牌色。
 * 和 logo 一样用固定色值，明暗主题下保持不变。
 */
const BADGES: Record<IntegrationIcon, { fill: string; glyph: React.ReactElement }> = {
  phone: {
    fill: '#6c53b1',
    glyph: (
      <path d="M7.6 3.6H5.4a1.9 1.9 0 0 0-1.9 2.1 16.4 16.4 0 0 0 14.8 14.8 1.9 1.9 0 0 0 2.1-1.9v-2.2a1.5 1.5 0 0 0-1.2-1.5l-2.4-.5a1.5 1.5 0 0 0-1.4.4l-1 1a13 13 0 0 1-5.3-5.3l1-1a1.5 1.5 0 0 0 .4-1.4l-.5-2.4a1.5 1.5 0 0 0-1.5-1.2Z" />
    ),
  },
  email: {
    fill: '#3453e6',
    glyph: (
      <>
        <rect x="2.9" y="5.6" width="18.2" height="12.8" rx="2.4" />
        <path d="m3.9 8 6.9 4.7a2.3 2.3 0 0 0 2.4 0l6.9-4.7" />
      </>
    ),
  },
};

export default function ChannelIcon({
  name,
  className,
}: {
  name: IntegrationIcon;
  className?: string;
}): React.ReactElement {
  const { fill, glyph } = BADGES[name];
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="22" rx="5.5" fill={fill} />
      {/* 字形缩到徽标的六成大小居中；描边在缩放前加粗，落地约 1.7px，与品牌 logo 的笔画相当 */}
      <g
        transform="translate(12 12) scale(0.6) translate(-12 -12)"
        fill="none"
        stroke="#fff"
        strokeWidth={2.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </g>
    </svg>
  );
}
