import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function NavbarSearch({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactNode {
  return <div className={clsx(className, styles.mobileOnly)}>{children}</div>;
}
