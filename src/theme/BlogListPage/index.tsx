/**
 * 博客列表页（/blog）：默认是把每篇文章的封面和摘要整段往下排，6 篇就有 6 屏多。
 * 改成和集成页一样的页头 + 卡片网格。文章页、标签页不受影响，仍用官方组件。
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {PageMetadata, HtmlClassNameProvider, ThemeClassNames} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import type {Props} from '@theme/BlogListPage';
import pageStyles from '@site/src/pages/pages.module.css';
import styles from './styles.module.css';

type Item = Props['items'][number];

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

// front matter 的 image 是给 og:image 的 1200×630 JPEG；同名 .webp 是正文里用的 2x 图，卡片用它
function coverOf(image: unknown): string | undefined {
  return typeof image === 'string' ? image.replace(/\.jpe?g$/, '.webp') : undefined;
}

function PostCard({item}: {item: Item}) {
  const {metadata, frontMatter} = item.content;
  const {permalink, title, description, date, readingTime, tags} = metadata;
  const cover = useBaseUrl(coverOf(frontMatter.image) ?? '');
  return (
    <article className={styles.card}>
      {cover && (
        <Link to={permalink} className={styles.cover} tabIndex={-1} aria-hidden="true">
          <img src={cover} alt="" loading="lazy" width={1200} height={630} />
        </Link>
      )}
      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={permalink} className={styles.titleLink}>
            {title}
          </Link>
        </h2>
        {description && <p className={styles.desc}>{description}</p>}
        <div className={styles.meta}>
          <time dateTime={date}>{dateFormat.format(new Date(date))}</time>
          {typeof readingTime === 'number' && (
            <>
              <span aria-hidden="true">·</span>
              <span>{Math.ceil(readingTime)} min read</span>
            </>
          )}
        </div>
        {tags.length > 0 && (
          <ul className={styles.tags}>
            {tags.map((t) => (
              <li key={t.permalink}>
                <Link to={t.permalink} className={styles.tag}>
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function BlogListPage(props: Props): React.ReactElement {
  const {metadata, items} = props;
  const {siteConfig} = useDocusaurusContext();
  const {blogTitle, blogDescription, permalink, page} = metadata;
  const title = permalink === '/' ? siteConfig.title : blogTitle;

  // 页头下的话题行：只列本页文章用到的标签，按出现次数排
  const topics = new Map<string, {label: string; count: number}>();
  for (const it of items) {
    for (const t of it.content.metadata.tags) {
      const cur = topics.get(t.permalink);
      topics.set(t.permalink, {label: t.label, count: (cur?.count ?? 0) + 1});
    }
  }
  const topicList = [...topics.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <HtmlClassNameProvider className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogListPage)}>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
      <BlogListPageStructuredData {...props} />
      <Layout>
        <main>
          <header className={pageStyles.pageHeader}>
            <div className="n9e-container">
              <p className="n9e-eyebrow">BLOG</p>
              <h1 className={pageStyles.pageTitle}>{blogTitle}</h1>
              <p className={pageStyles.pageLead}>{blogDescription}</p>
              {page === 1 && topicList.length > 0 && (
                <nav className={styles.topics} aria-label="Topics">
                  {topicList.map(([to, t]) => (
                    <Link key={to} to={to} className={styles.tag}>
                      {t.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </header>
          <div className={clsx('n9e-container', pageStyles.pageBody)}>
            <div className={styles.grid}>
              {items.map((it) => (
                <PostCard key={it.content.metadata.permalink} item={it} />
              ))}
            </div>
            <div className={styles.paginator}>
              <BlogListPaginator metadata={metadata} />
            </div>
          </div>
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
