import type { ReactNode } from 'react';

/**
 * 导航栏不再放主题开关——它挪到了页脚（见 src/theme/Footer/Layout）。
 *
 * 这里返回 null 而不是把 colorMode.disableSwitch 设成 true：
 * disableSwitch 会连带把页脚那个也一起关掉，等于彻底取消切换能力。
 */
export default function NavbarColorModeToggle(): ReactNode {
  return null;
}
