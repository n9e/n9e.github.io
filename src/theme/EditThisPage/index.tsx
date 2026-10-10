import React, { type ReactNode } from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import EditThisPage from '@theme-original/EditThisPage';
import type EditThisPageType from '@theme/EditThisPage';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof EditThisPageType>;

const DOCS_REPO = 'https://github.com/n9e/n9e.github.io';

/**
 * 「编辑此页」旁边加一个「报告问题」：预填标题和页面地址的 GitHub issue。
 * 调研 §16.4 把"页面没有反馈入口"列为 P0。没做 Mintlify 那种"有帮助 / 没帮助"两个按钮——
 * 没有后端记录的点赞是假按钮，点了什么都不会发生。
 */
export default function EditThisPageWrapper(props: Props): ReactNode {
  const { pathname } = useLocation();
  const { siteConfig } = useDocusaurusContext();
  const pageUrl = `${siteConfig.url}${pathname}`;
  const title = translate(
    { id: 'theme.n9e.issueTitle', message: 'Docs feedback: {path}' },
    { path: pathname },
  );
  const issueUrl = `${DOCS_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `Page: ${pageUrl}\n\n`,
  )}`;

  return (
    <span className="n9e-doc-actions">
      <EditThisPage {...props} />
      <Link to={issueUrl} className="n9e-doc-issue">
        <Translate id="theme.n9e.reportIssue" description="Link to open a docs issue for the current page">
          Report a problem
        </Translate>
      </Link>
    </span>
  );
}
