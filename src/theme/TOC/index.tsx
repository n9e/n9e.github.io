import React, { type ReactNode } from 'react';
import Translate from '@docusaurus/Translate';
import TOC from '@theme-original/TOC';
import type TOCType from '@theme/TOC';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof TOCType>;

/** 右侧目录加一行标题（参考 Mintlify 的 "On this page"）：没有标题的一列短链接，
 *  读者要看一眼才知道那是本页目录还是相关链接。 */
export default function TOCWrapper(props: Props): ReactNode {
  return (
    <div className="n9e-toc">
      <p className="n9e-toc-title">
        <Translate id="theme.TOC.title" description="Heading above the on-page table of contents">
          On this page
        </Translate>
      </p>
      <TOC {...props} />
    </div>
  );
}
