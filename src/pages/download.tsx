import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { useCopy } from '@site/src/content';
import type { InstallPathId, PlatformId } from '@site/src/content/types';
import releases from '@site/src/data/releases.json';
import styles from './download.module.css';

/**
 * 下载页：两级分流。先选"要干什么"，再选平台，页面只给这条路上用得到的命令。
 * 版本号、直链、大小、校验值全部来自构建时抓取的 releases.json，不手改。
 */

type Asset = (typeof releases.nightingale.assets)[number];
type CategrafAsset = (typeof releases.categraf.assets)[number];

function fmtSize(bytes: number): string {
  return `${Math.round(bytes / 1048576)} MB`;
}

/** 把文案里的占位符换成真实发布数据 */
function fill(line: string, vars: Record<string, string>): string {
  return line.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function CopyButton({ text, label, doneLabel }: { text: string; label: string; doneLabel: string }): React.ReactElement {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      // 剪贴板不可用时命令原样留在页面上，用户仍可手动选中
    }
  }
  return (
    <button type="button" className={styles.copy} onClick={copy} aria-live="polite">
      {done ? doneLabel : label}
    </button>
  );
}

function Cmd({ lines, copyLabel, copiedLabel }: { lines: string[]; copyLabel: string; copiedLabel: string }): React.ReactElement {
  return (
    <div className={styles.cmdBox}>
      <code className={styles.cmd}>
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </code>
      <CopyButton text={lines.join('\n')} label={copyLabel} doneLabel={copiedLabel} />
    </div>
  );
}

function Sha({ value, label }: { value: string | null; label: string }): React.ReactElement | null {
  if (!value) return null;
  return (
    <code className={styles.sha} title={value}>
      {label} {value.slice(0, 16)}…
    </code>
  );
}

export default function Download(): React.ReactElement {
  const { downloadPage: page } = useCopy();
  const [path, setPath] = useState<InstallPathId>('try');
  const [platform, setPlatform] = useState<PlatformId>('linux-amd64');

  const n9e = releases.nightingale;
  const vars = {
    tag: n9e.tag,
    version: n9e.tag.replace(/^v/, ''),
    checksums: n9e.checksumsUrl,
  };
  const copyProps = { copyLabel: page.copyLabel, copiedLabel: page.copiedLabel };

  const linuxAsset: Asset | undefined = n9e.assets.find(
    (a) => a.os === 'linux' && a.arch === (platform === 'linux-arm64' ? 'arm64' : 'amd64'),
  );

  // 表里只放标准版，Linux → Windows，amd64 → arm64；精简版和 cgo 版交给发布页
  const osOrder = { linux: 0, windows: 1 } as Record<string, number>;
  const categrafAssets: CategrafAsset[] = releases.categraf.assets
    .filter((a) => a.variant === 'default')
    .sort((a, b) => (osOrder[a.os] ?? 9) - (osOrder[b.os] ?? 9) || a.arch.localeCompare(b.arch));

  const activePath = page.paths.find((p) => p.id === path) ?? page.paths[0];

  return (
    <Layout title={page.pageTitle} description={page.lead}>
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className="n9e-container">
            <p className="n9e-eyebrow">DOWNLOAD</p>
            <h1 className={styles.heroTitle}>
              {page.title.split('\n').map((line, i) => (
                <React.Fragment key={line}>
                  {i > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </h1>
            <p className={styles.heroLead}>{page.lead}</p>

            <div className={styles.versions}>
              <p className={styles.version}>
                <b>{n9e.tag}</b>
                <span>
                  {page.releasedLabel} {n9e.publishedAt}
                </span>
                <Link to={n9e.notesUrl}>{page.notesLabel} →</Link>
              </p>
            </div>
          </div>
        </header>

        <section className={styles.chooser} aria-labelledby="chooser-title">
          <div className="n9e-container">
            <h2 id="chooser-title" className={styles.sectionTitle}>
              {page.chooserTitle}
            </h2>
            <div className={styles.chooserGrid}>
            <div className={styles.rail} role="tablist" aria-orientation="vertical" aria-label={page.chooserTitle}>
              {page.paths.map((p, i) => {
                const active = p.id === path;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    id={`path-tab-${p.id}`}
                    aria-selected={active}
                    aria-controls="path-panel"
                    className={clsx(styles.tile, active && styles.tileActive)}
                    onClick={() => setPath(p.id)}
                  >
                    <span className={styles.tileHead}>
                      {p.title}
                      {i === 0 && <span className={styles.chip}>{page.recommendedLabel}</span>}
                    </span>
                    <span className={styles.tileBody}>{p.body}</span>
                  </button>
                );
              })}
            </div>

            <div id="path-panel" role="tabpanel" aria-labelledby={`path-tab-${activePath.id}`} className={styles.panel}>
              <h3 className={styles.panelTitle}>{activePath.title}</h3>
              {path === 'try' && (
                <div className={styles.panelGrid}>
                  <div>
                    <p className={styles.intro}>{page.tryPath.intro}</p>
                    <Cmd lines={page.tryPath.lines} {...copyProps} />
                    <h3 className={styles.subTitle}>{page.tryPath.afterTitle}</h3>
                    <ol className={styles.steps}>
                      {page.tryPath.after.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                    <p className={styles.docLink}>
                      <Link to={page.tryPath.link.href}>{page.tryPath.link.label} →</Link>
                    </p>
                  </div>
                  <aside className={styles.side}>
                    <h3 className={styles.subTitle}>{page.tryPath.variantsTitle}</h3>
                    <ul className={styles.variants}>
                      {page.tryPath.variants.map((v) => (
                        <li key={v.dir}>
                          <code>{v.dir}</code>
                          <span>{v.body}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                </div>
              )}

              {path === 'production' && (
                <div>
                  <p className={styles.prereq}>{page.production.prereq}</p>
                  <div className={styles.tabs} role="tablist">
                    {page.production.platforms.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        role="tab"
                        aria-selected={pl.id === platform}
                        className={clsx(styles.tab, pl.id === platform && styles.tabActive)}
                        onClick={() => setPlatform(pl.id)}
                      >
                        {pl.label}
                      </button>
                    ))}
                  </div>

                  {(platform === 'linux-amd64' || platform === 'linux-arm64') && linuxAsset && (
                    <div className={styles.panelWide}>
                      <div>
                        <p className={styles.intro}>{page.production.linux.intro}</p>
                        <div className={styles.asset}>
                          <div className={styles.assetMeta}>
                            <b>{linuxAsset.name}</b>
                            <span>{fmtSize(linuxAsset.size)}</span>
                            <Sha value={linuxAsset.sha256} label={page.sha256Label} />
                          </div>
                          <Link className="n9e-btn n9e-btn--primary" to={linuxAsset.url}>
                            {page.downloadLabel}
                          </Link>
                        </div>
                        <Cmd
                          lines={page.production.linux.lines.map((l) => fill(l, { ...vars, url: linuxAsset.url, name: linuxAsset.name }))}
                          {...copyProps}
                        />
                        <p className={styles.expected}>{page.production.linux.expected}</p>
                        <p className={styles.docLink}>
                          <Link to={page.production.linux.link.href}>{page.production.linux.link.label} →</Link>
                        </p>
                      </div>
                    </div>
                  )}

                  {platform === 'docker' && (
                    <div className={styles.panelWide}>
                      <div>
                        <p className={styles.intro}>{page.production.docker.intro}</p>
                        <Cmd lines={page.production.docker.lines.map((l) => fill(l, vars))} {...copyProps} />
                        <p className={styles.expected}>{page.production.docker.note}</p>
                        <p className={styles.docLink}>
                          <Link to={page.production.docker.link.href}>{page.production.docker.link.label} →</Link>
                        </p>
                      </div>
                    </div>
                  )}

                  {platform === 'kubernetes' && (
                    <div className={styles.panelWide}>
                      <div>
                        <p className={styles.intro}>{page.production.kubernetes.intro}</p>
                        <Cmd lines={page.production.kubernetes.lines} {...copyProps} />
                        <p className={styles.expected}>{page.production.kubernetes.expected}</p>
                        <p className={styles.expected}>{page.production.kubernetes.note}</p>
                        <p className={styles.docLink}>
                          <Link to={page.production.kubernetes.link.href}>{page.production.kubernetes.link.label} →</Link>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {path === 'edge' && (
                <div className={styles.panelWide}>
                  <div>
                    <p className={styles.intro}>{page.edge.intro}</p>
                    <Cmd lines={page.edge.lines} {...copyProps} />
                    <p className={styles.warning}>{page.edge.warning}</p>
                    <p className={styles.docLink}>
                      <Link to={page.edge.link.href}>{page.edge.link.label} →</Link>
                    </p>
                  </div>
                </div>
              )}

              {path === 'offline' && (
                <div className={styles.panelWide}>
                  <div>
                    <p className={styles.intro}>{page.offline.intro}</p>
                    <ol className={styles.steps}>
                      {page.offline.items.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                    <Cmd lines={page.offline.lines.map((l) => fill(l, vars))} {...copyProps} />
                    <p className={styles.docLink}>
                      <Link to={page.offline.link.href}>{page.offline.link.label} →</Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </section>

        <section className={clsx(styles.categraf, 'n9e-section--sunk')} aria-labelledby="categraf-title">
          <div className="n9e-container">
            <div className={styles.categrafHead}>
              <h2 id="categraf-title" className={styles.sectionTitle}>
                {page.categraf.title}
              </h2>
              <p className={styles.version}>
                <b>{releases.categraf.tag}</b>
                <span>
                  {page.releasedLabel} {releases.categraf.publishedAt}
                </span>
                <Link to={releases.categraf.notesUrl}>{page.notesLabel} →</Link>
              </p>
            </div>
            <p className={styles.intro}>{page.categraf.intro}</p>

            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {page.categraf.columns.map((c, i) => (
                      <th key={i} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categrafAssets.map((a) => (
                    <tr key={a.name}>
                      <td>
                        {page.categraf.osLabels[a.os] ?? a.os} {a.arch}
                      </td>
                      <td>{fmtSize(a.size)}</td>
                      <td>
                        <Sha value={a.sha256} label="" />
                      </td>
                      <td className={styles.tdAction}>
                        <Link className={styles.dl} to={a.url}>
                          {page.downloadLabel}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.expected}>
              {page.categraf.moreNote} <Link to={page.categraf.moreLink.href}>{page.categraf.moreLink.label} →</Link>
            </p>
            <p className={styles.expected}>{page.categraf.after}</p>
            <p className={styles.docLinks}>
              {page.categraf.links.map((l) => (
                <Link key={l.href} to={l.href}>
                  {l.label} →
                </Link>
              ))}
            </p>
          </div>
        </section>

        <section className={styles.foot}>
          <div className={clsx('n9e-container', styles.footGrid)}>
            <div>
              <h2 className={styles.footTitle}>{page.upgrade.title}</h2>
              <p className={styles.footBody}>{page.upgrade.body}</p>
              <p className={styles.docLinks}>
                {page.upgrade.links.map((l) => (
                  <Link key={l.href} to={l.href}>
                    {l.label} →
                  </Link>
                ))}
              </p>
            </div>
            <div>
              <h2 className={styles.footTitle}>{page.help.title}</h2>
              <p className={styles.footBody}>{page.help.body}</p>
              <p className={styles.docLinks}>
                {page.help.links.map((l) => (
                  <Link key={l.href} to={l.href}>
                    {l.label} →
                  </Link>
                ))}
              </p>
              <p className={styles.archive}>
                <Link to={page.help.archive.href}>{page.help.archive.label} →</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
