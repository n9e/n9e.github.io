# Nightingale website design document

> Version: v1.0 | Date: 2026-08-25 | Status: for review
>
> This document builds on the 2025 research document "Nightingale website optimization", combined
> with a full round of supplementary research on 2026-08-25 (an audit of the current site, a
> benchmark of 10 competitor websites, research on site-building technology, and first-hand
> information from four local repositories).
> Scope: a complete redesign of the open-source Nightingale website (currently n9e.github.io),
> covering the homepage, the docs center, supporting pages, the technical approach and the
> roadmap. It also sets the boundary with the commercial site, flashcat.cloud.
>
> This is a historical record of the plan as of 2026-08-25. Some decisions changed during
> implementation — notably the site was built on Docusaurus 3 rather than Astro + Starlight.

---

## 1. Background and current problems

### 1.1 Key facts (2026-08-25)

| Item | Figure | Source |
|---|---|---|
| GitHub stars / forks | 13,265 / 1,762 | api.github.com/repos/ccfos/nightingale |
| Latest version | v9.1.1 (released 2026-08-18); v8 and v9 are both maintained | GitHub Releases |
| README positioning line | "Open-Source Alerting Expert" | ccfos/nightingale README |
| Core v9 features | Nightingale AI (built-in AI assistant), the Skills marketplace, LLM configuration, a built-in MCP server (`/mcp`, 74 tools: 42 read / 32 write / 13 toolsets) | README + release notes |
| International site size | 55 pages in English / 54 in Chinese, Hugo Doks theme + Netlify | n9e.github.io sitemap |
| Chinese docs size | Five directory trees (v5–v9) side by side in fc-site; v9 alone is about 165 articles × 3 language variants (zh/en/hk) | flashcatcloud/fc-site repository |

### 1.2 Gap list (the basis for the redesign)

Twelve hard problems confirmed by auditing the live sites, most severe first:

1. **v9's biggest selling points are invisible on the website**: Nightingale AI, the Skills
   marketplace and the MCP server exist only in release notes and deep in the README. Of the
   international site's 55 pages, **0** cover v9, AI, MCP or LLMs — the whole site is stuck in
   the v8 era.
2. **Two split websites, bilingual content out of sync**: n9e.github.io and flashcat.cloud/docs
   each go their own way. The Chinese v9 docs have entire chapters ("Guides", "AI configuration")
   that are completely missing in English. Flashcat even published a blog post to explain "what
   Nightingale / 夜莺 / Flashcat / 快猫 each are" — official proof of the brand confusion.
3. **Zero marketing power on the homepage**: one slogan, one architecture diagram and three
   paragraphs. No product screenshots, no live star count, no user logo wall, no release
   announcement; the README carries more information than the homepage.
4. **No live demo**: a staple among competitors (play.grafana.org, play.victoriametrics.com, the
   Netdata live demo) is missing; demo.flashcat.cloud serves only the commercial edition.
5. **Several doc versions side by side with no version switcher**: the Flashcat side lays out
   five trees, v5–v9, flat; the international site has no notion of versions at all. New users
   cannot tell which applies.
6. **Broken download path (tested)**: the download.flashcat.cloud CDN's hotlink protection blocks
   requests with an empty Referer, so `wget`/`curl -O` on the links in the docs returns 403.
   There is no directory index and no deb/rpm package.
7. **No changelog / release notes page**: version information is only on GitHub.
8. **An abandoned blog**: the international site has a single post.
9. **Stale numbers**: the product page says "12000+ GitHub Stars" (actually 13,265) — hard-coded
   numbers inevitably go stale.
10. **Product page docs links still point at v8**: flashcat.cloud/product/nightingale/ was not
    updated for the v9 GA.
11. **A thin footer and few trust signals**: the international site's footer is a single
    copyright line, with no community channels and no entry to governance, security policy or
    case studies.
12. **Template leftovers**: the repository still contains the Doks theme's Dutch content and the
    theme author's contributors page — the theme was customized and never cleaned up.

On the community side (GitHub issues), docs complaints cluster into three kinds: **missing,
outdated, can't find the entry point** (#691, #1933, #1977, #2118, #209, #49, #2442 and others).

---

## 2. Assessment of the earlier research document ("Nightingale website optimization" PDF)

### 2.1 Directions to keep (absorbed into this design)

- Add product screenshots, a stats bar, core-feature showcases and product comparisons to the
  homepage — exactly the pattern competitors share; kept and refined.
- Reorganize the docs center into Getting Started / Tutorials / How-To / Reference — the right
  direction (close to the Diátaxis framework); this document completes it into Diátaxis's four
  quadrants.
- A 5-minute Quick Start (docker compose brings everything up with built-in rules) and an
  "Alert Self-Healing with Ibex" tutorial — kept.
- Search, API docs and a playground environment — kept, with concrete plans.
- Keep's step-by-step narrative and community stats cards, and Vector's code-example-driven
  approach — kept, and further validated by this benchmark.

### 2.2 Points that need correcting

| In the earlier document | Problem | Correction |
|---|---|---|
| The highlight line "Nightingale for monitoring and alerting, just as Grafana is for visualization" | This **is already the current site's slogan**, not an improvement; and the README positioning has since moved to "Open-Source Alerting Expert" | See the new slogan options in §4.1; the Grafana analogy is demoted to a secondary tagline |
| Comparisons list only vs Prometheus and vs Grafana | No design for **how and where** comparison pages are written; also missing vs Zabbix (the domestic replacement scenario) and "alternative"-style SEO pages | See the three comparison-page patterns and how they combine in §6.2 |
| A stats bar (modeled on InfluxDB's number bar) | No **automatic update mechanism** — the stale "12000+ Stars" on the product page is the lesson | Pull from the GitHub / Docker Hub APIs at build time; see §7.4 |
| The FAQ in the docs outline is not addressed | "Put everything in the FAQ" is one root cause of docs being hard to find | Break the FAQ up into How-to; see §5.1 |

### 2.3 Entirely missing, to be added (new in this research)

1. **The AI narrative and v9's selling points**: the earlier document never mentions the MCP
   server, Nightingale AI or the Skills marketplace. In 2026 competitors all lead with AI
   (Grafana "AI for observability", Netdata "agent that thinks", SigNoz Noz, HertzBeat
   "AI-powered", Keep AIOps). Nightingale holds a ready-made differentiator in its built-in MCP
   server and has not used it — this is the redesign's **biggest incremental opportunity**.
2. **The split sites and brand strategy**: the earlier document does not cover the relationship
   between n9e.github.io and flashcat.cloud, how the two languages stay in sync, or separating
   the open-source and commercial paths.
3. **Docs versioning**: how to converge five coexisting versions (v5–v9), and whether to have a
   version switcher.
4. **Technology choice**: whether to keep Hugo Doks, which framework to migrate to, and search
   (Algolia is not usable in mainland China).
5. **AI-ready docs engineering**: llms.txt / llms-full.txt, a `.md` route for every page, "Copy
   page as Markdown", docs Q&A with AI — standard among leading projects in 2025–2026 (Anthropic,
   Cloudflare, Stripe, Vercel, Linear).
6. **SEO and growth engineering**: how to write comparison pages as bottom-of-funnel hooks,
   long-tail integration pages (programmatic SEO), hreflang, automatically generated OG images,
   and the three GitHub README traffic levers.
7. **Access from mainland China and dual deployment**: the reachability of GitHub Pages / Netlify
   / Vercel from mainland China, and a dual-deployment architecture with an ICP filing and a
   domestic CDN (EdgeOne Pages).
8. **How to deliver the playground**: the earlier document only says "playground environment" —
   it lacks the choice of form (read-only demo site vs Killercoda vs asciinema), operating cost
   and a reset mechanism.
9. **Running a changelog / blog / newsletter**: not mentioned at all.
10. **Fixing the download path**: the CDN hotlink 403, multi-platform packages, and instructions
    for domestic mirrors.
11. **Trust signals**: user logo wall assets (already in the README), endorsement from CCF's open
    governance (modeled on how Prometheus presents CNCF), and footer engineering.
12. **Roadmap and success metrics**: the earlier document is a list of requirements with no
    priorities or measures.
13. **Benchmark coverage**: the earlier document only looked at Keep and Vector; this round adds
    Grafana (including the /oss/ dual path), VictoriaMetrics, SigNoz, Netdata, Prometheus,
    HertzBeat, Uptime Kuma and Zabbix.

---

## 3. Goals, audience and positioning

### 3.1 Redesign goals and success metrics

| Goal | Metric (6 months after launch) |
|---|---|
| Make v9's AI capabilities visible | Share of PV on AI-related pages on the homepage and in the docs; visits to the MCP integration docs |
| Lower the barrier to getting started | Live demo UV and time on site; Quick Start completion rate (docs funnel) |
| Grow international reach | English site UV and organic search traffic; weekly growth of GitHub stars |
| Converge docs entry points | Docs search usage; fewer "can't find the docs" GitHub issues |
| Download conversion | Download success rate (after fixing the 403); growth in Docker pulls |

### 3.2 Target users

- **SREs / operations engineers in China** (Chinese, the core audience): migrating from
  Zabbix / Open-Falcon or building a new monitoring stack; they care about simple deployment,
  working out of the box, domestic open source, and an active community.
- **Overseas DevOps / platform engineers** (English, the growth target): Prometheus ecosystem
  users looking for a stronger replacement for Alertmanager; they care about compatibility with
  their existing stack, docs quality and project governance.
- **Early adopters of AI infrastructure** (both languages, a new persona): teams that want to
  manage monitoring and alerting through natural language or agents — the direct audience for
  the MCP server.

### 3.3 Division of labor between sites (fixing "two split sites")

Adopt **Grafana's dual-path model** (a commercial main site plus a separate OSS landing):

- **The open-source website** (the subject of this document; n9e.github.io or a new domain): the
  single entry point for open-source users. Homepage + docs + demo + comparison pages + blog +
  changelog + community. CTAs are self-serve: Live Demo / Get Started / GitHub.
- **flashcat.cloud**: the commercial path (Flashcat / FlashDuty / professional services). The
  open-source site points there only from the "deployment options" section and the footer, as
  "Need a hosted version or enterprise support?", without stealing the spotlight.
- **Docs convergence**: the open-source site is the single canonical source for open-source
  docs. The Nightingale part of flashcat.cloud/docs is gradually 301-redirected to it (or at
  least each page carries a "latest docs are here" banner), ending the double maintenance.
- **Domain** (open question, needs a team decision): staying on n9e.github.io costs the least but
  hurts the brand and binding a domestic CDN. Consider registering a dedicated domain (such as
  n9e.io / nightingale.dev), with the domestic domain going through Flashcat's existing ICP-filed
  setup.

---

## 4. Homepage design

### 4.1 Hero

**Slogan options** (pick one; A is recommended):

- **Option A (keep the README positioning, add an AI subtitle)**:
  Title: **The Open-Source Alerting Expert** (Chinese: 开源告警专家)
  Subtitle: All-in-one alerting for Prometheus, ElasticSearch, ClickHouse and 10+ data sources —
  with a built-in AI assistant and MCP server. (Chinese version: connect the data sources you
  already run, unify alert rules, noise reduction and routing; with a built-in AI assistant and
  MCP server.)
- Option B (keep the Grafana analogy): title "Monitoring and alerting, the open-source way", with
  the subtitle keeping "…just as Grafana is for visualization".
- Option C (engineer persona, modeled on VictoriaMetrics): title "Alerting that just works", with
  the subtitle stressing that it works out of the box.

**CTAs (three, modeled on Grafana's OSS page and HertzBeat)**:

1. `Live Demo` (primary button; see §6.1)
2. `Get Started` (points to the 5-minute Quick Start)
3. A copyable one-line install command (modeled on HertzBeat; the most practical conversion for
   open-source users in China):
   ```
   curl -sSL https://.../quick-start.sh | sh   # or bring everything up with docker compose
   ```

**Hero visual**: put a **real product screenshot** on the right or below (the alert event board or
a dashboard, with light and dark versions), replacing today's abstract architecture diagram. Add a
v9 release pill ("🎉 v9.1.1 released — Nightingale AI & built-in MCP Server →" linking to the
changelog).

### 4.2 Homepage section order (top to bottom)

Designed from the main line the 10 benchmarked sites share:

| # | Section | Key content | Modeled on |
|---|---|---|---|
| 0 | Announcement bar | Latest release / major events, linking to the changelog | Common |
| 1 | Hero | §4.1 | — |
| 2 | **Stats bar** | GitHub stars · Docker pulls · contributors · 20+ notification channels · 10+ data sources (updated automatically from APIs at build time; see §7.4) | VictoriaMetrics (right under the first screen), InfluxDB |
| 3 | **Step 1-2-3-4 narrative** | ① Connect — plug in existing data sources (logos: Prometheus / VM / ES / CK / SLS…) → ② Alert — unified alert rules, a built-in rule library, one rule across several data sources → ③ Automate — event pipelines, mute / subscribe / on-call schedules, alert self-healing (ibex) → ④ AI — Nightingale AI, the MCP server, Skills. Each step has a real UI screenshot | Keep (its flow mirrors Nightingale's exactly) |
| 4 | **AI deep-dive** | Text left, visual right: a recording of Claude Code / Cursor managing Nightingale alerts over MCP (asciinema or an animation); "74 tools, zero extra deployment" | The standard 2026 competitor narrative |
| 5 | Integrations ecosystem | "10+ data sources · 20+ notification channels · 60+ built-in integration templates" plus a logo grid, linking to the integrations catalog | Vector (components as numbers), Keep |
| 6 | Three deployment cards | Self-hosted (open source, Download / GitHub) · Edge (alert engine for edge data centers, a differentiator) · Need hosting and expert support → Flashcat (the only commercial referral) | Keep, Grafana |
| 7 | Comparison entry | Three cards, "Nightingale vs Prometheus + Alertmanager / vs Zabbix / vs Grafana Alerting", linking to the comparisons hub | Netdata |
| 8 | Users and trust | User logo wall (ready-made in the README) + 1–2 migration testimonials + **endorsement from CCF open governance** (hosted by the CCF open source development committee, Apache-2.0, no vendor lock-in — modeled on how Prometheus presents CNCF) | Zabbix, Prometheus |
| 9 | Closing CTA | Get Started + community entry points (GitHub / Slack / WeChat group QR code [Chinese site]) + newsletter signup [English site] | Vector |

**Restraint**: no more than 10 sections in total (Netdata's 30+ sections are the counter-example).
The Chinese and English sites share the same section structure; only section 9's community
channels differ by region (WeChat group vs Slack / newsletter).

### 4.3 Navbar

```
Logo | Docs | Integrations | Comparisons | Blog | Changelog | Community ▾ | [🔍] [🌐 中/EN] [⭐ GitHub 13.3k] [Live Demo]
```

- The GitHub button shows the live star count (modeled on Keep, which promotes GitHub to the top
  level); Live Demo is a highlighted button.
- The Community dropdown: GitHub Discussions / Slack / WeChat group / contribution guide /
  governance.

### 4.4 Footer (fixing "a single copyright line")

Four columns: Product (Docs / Download / Changelog / Roadmap) · Resources (Blog / Comparisons /
Integrations / best practices) · Community (GitHub / Slack / WeChat / contribution guide / Code of
Conduct / Security) · About (CCF governance / License / commercial support Flashcat / FlashDuty).
Plus hreflang language switching and RSS.

---

## 5. Docs center design

### 5.1 Structure (Diátaxis's four quadrants)

The top-level navigation maps straight onto the four quadrants, replacing today's mixed
prologue / install / usage / practice / usecase / faq structure:

```
📕 Get Started (Tutorial, learning-oriented)
   ├─ 5-minute quick start (docker compose with demo data sources and alert rules built in; you see an alert as soon as it is up)
   ├─ 30-minute walkthrough: your first alert (install Categraf → connect a data source → write a rule → receive a notification, end to end)
   ├─ Core concepts (data sources / business groups / alert rules / events / subscriptions… all the terms on one page)
   └─ Architecture overview
📗 Guides (How-to, task-oriented) — today's FAQ is broken up into this section
   ├─ Installation: binary / compose / Helm / edge nodes / upgrade / configuration
   ├─ Data sources: Prometheus, VictoriaMetrics, ElasticSearch, Loki, ClickHouse, MySQL,
   │   Postgres, TDengine, OpenSearch, VictoriaLogs… (one page each, doubling as long-tail SEO pages)
   ├─ Collectors: Categraf / Telegraf / Datadog-Agent / exporters
   ├─ Alerting: rules / mutes / subscriptions / notification rules (each of the 20 channels) / event pipelines / self-healing (ibex)
   ├─ Dashboards and queries
   ├─ AI: connecting MCP clients such as Claude Code and Cursor / the Nightingale AI assistant / managing Skills / LLM configuration
   ├─ Users and permissions: business groups / roles / SSO (with concrete cases such as DingTalk)
   └─ Embedding and being embedded: embedding Grafana / CMDB / menu visibility
📘 Reference (information-oriented, generated wherever possible)
   ├─ Every config file option
   ├─ HTTP API
   ├─ MCP server: the 74 tools (42 read / 32 write / 13 toolsets) and auth (OAuth 2.1 / token)
   ├─ Notification channels and message template variables
   └─ Built-in metrics / write protocols (Remote Write · OpenTSDB · Datadog · Falcon)
📙 Concepts (Explanation, understanding-oriented)
   ├─ Alert engine design and the thinking behind noise reduction
   ├─ The relationship with the Prometheus / Alertmanager ecosystem
   ├─ The edge deployment model (n9e-edge)
   └─ Version history and upgrade philosophy (v8 → v9)
🏆 Best practices (long-form production case studies, doubling as blog material)
```

Writing discipline: each page serves one mode only. Reference is generated (config options, API
and MCP tools from code / OpenAPI) so it cannot go stale by hand.

### 5.2 Versioning (converging five coexisting versions, v5–v9)

- The docs maintain the body for **the current stable major version only** (v9 today), with a
  version dropdown at the top.
- v8 is frozen as an archived snapshot (subpath `/docs/v8/`, with an "old docs" banner pointing to
  the latest); v5–v7 go offline, archived on GitHub, with on-site 301s.
- No heavyweight "full snapshot per version" mechanism (a weak versioning need should not lock
  in the framework; see §7.1).

### 5.3 Bilingual strategy

- **Chinese is the source of truth** (the team's first-hand output); English is allowed to lag.
- Untranslated pages fall back to Chinese automatically with a notice bar (built into Starlight);
  translation status is tracked (modeled on Astro's i18n status page, marking pages outdated).
- Every page outputs reciprocal `zh-CN` / `en` hreflang plus `x-default` (pointing at English, to
  serve international growth).
- fc-site's three-variant mechanism with `_en` / `_hk` suffixes is not continued; merging the hk
  variant is to be assessed (if there is real demand, as a zh-Hant locale).

### 5.4 Search and AI-readiness

- **Search**: Pagefind (a static index built at build time and served from the CDN, so its
  availability in China equals the site's; Chinese segmentation works out of the box; built into
  Starlight by default). The English site can add Algolia DocSearch v4 (free) for **AskAI
  conversational Q&A**; the Chinese site does not depend on Algolia (no mainland nodes, 600 ms+
  latency).
- **The AI-ready four** (do them all at once; the cost is close to zero):
  1. `llms.txt` + `llms-full.txt` (one each for Chinese and English, generated by the
     starlight-llms-txt plugin);
  2. Appending `.md` to any page URL returns the raw Markdown;
  3. "Copy page as Markdown" / "Open in ChatGPT · Claude" buttons on each page (modeled on
     Linear / Mintlify);
  4. Self-contained writing (few runtime-assembled components, so the raw Markdown is complete).
- Docs Q&A: start with the free DocSearch AskAI for English; for Chinese, consider feeding the
  docs to an in-house bot; paid services like kapa.ai wait for an overseas commercial budget.

---

## 6. Supporting pages

### 6.1 Live demo (demo site)

- **Form**: a public, read-only demo site (the de facto standard for open-source monitoring
  software: play.grafana.org, play.victoriametrics.com).
- **Plan**: one cloud host running the latest stable version, preloaded with a Categraf +
  Prometheus / VictoriaMetrics data flow, some real alert rules (with events firing), example
  mute / subscription / notification rules and built-in dashboards. A read-only viewer account
  logs in automatically (no sign-up, no password). It resets from a snapshot daily, with basic
  abuse protection (rate limiting, read-only API).
- **Entry points**: the homepage hero's primary CTA, a permanent navbar button, and the first
  screen of the README.
- Extras: 2–3 asciinema recordings showing the one-step install and MCP interaction (embedded on
  the homepage and in the Quick Start).

### 6.2 Comparisons

A "hub + SEO landing pages" combination (patterns 2 + 1 + 3 from the benchmark):

- **A `/comparisons/` hub** (the Netdata pattern): four pages in the first batch — vs Prometheus +
  Alertmanager, vs Zabbix, vs Grafana Alerting / OnCall, vs commercial monitoring clouds. Each
  page: one paragraph on positioning → a comparison table (deployment effort / alerting
  capabilities / multiple data sources / permissions / AI) → **where each one fits (acknowledge
  the other side's strengths, to protect the project's standing in the open-source community)** →
  CTA.
- **Chinese SEO landing pages** (the SigNoz pattern): such as "Zabbix replacement options" and
  "Choosing an open-source alerting platform", linked from the footer to collect search traffic
  over time.
- **Performance and capability claims** are backed by reproducible benchmark blog posts (the
  VictoriaMetrics pattern); no unsourced numbers on marketing pages.

### 6.3 Integrations catalog

- One templated page for each data source, notification channel and built-in integration
  template (programmatic SEO), with material taken straight from the integration center and the
  Categraf plugin library.
- Every page must carry genuinely distinct content: a config example, screenshots, common
  questions — otherwise search engines treat it as a thin page.
- Linked from homepage section 5 and the navbar; the headline count "60+ built-in integrations"
  follows the actual inventory.

### 6.4 Changelog / blog / newsletter

- **Changelog page**: synced from the GitHub Releases API and rendered automatically; major
  releases get hand-written highlights; surfaced in the homepage announcement bar and the top
  navigation.
- **Blog**: seed it by selecting, translating and migrating the Nightingale technical posts that
  already exist in fc-site (the v8 notification series, edge deployment, log monitoring and so
  on); aim for 1–2 posts a month (release walkthroughs / best practices / user stories /
  benchmarks).
- **Newsletter**: a signup in the English site's footer (modeled on Vector's closing section); in
  Chinese, the WeChat official account and WeChat groups take this role.

### 6.5 Download page

- **Fix the CDN hotlink protection**: download.flashcat.cloud should allow an empty Referer (a
  blocklist is enough to stop hotlinking), so `wget` / `curl -O` work directly — this is the
  current, tested hard problem.
- The page offers: tar.gz for each version (amd64 / arm64) + MD5, Docker images (with notes on
  domestic mirrors), the Helm chart and a quick install script; deb/rpm to be assessed.
- Version numbers and download entries are updated automatically by the release process (the
  existing n9e-release-note flow already covers this; fold it into the site build).

---

## 7. Technical approach

### 7.1 Framework choice

**Recommended: Astro + Starlight in one repository** (the marketing homepage and blog designed
freely in Astro, docs mounted at `/docs` with Starlight).

| Reason | Detail |
|---|---|
| i18n fallback | Starlight's built-in "untranslated pages fall back to the source language with a notice" hits the pain of unequal Chinese and English content head-on (Docusaurus needs copied directories and has no native fallback) |
| Search | Pagefind built in, Chinese segmentation works, no third-party dependency, usable in China |
| Homepage design freedom | Astro's islands architecture keeps marketing pages free of the docs theme (a Docusaurus homepage has to be hand-written in React and is constrained in style) |
| Performance | Static output with almost zero JS by default, good for domestic CDN delivery and SEO |
| Versioning | Starlight has no official versioning — but §5.2 already narrows the need to "archived snapshots", which a directory convention satisfies. If the team insists on heavyweight multi-version coexistence, the fallback is Docusaurus 3.9 (the de facto versioning standard, at the cost of homepage freedom and i18n fallback) |

Migration path: the content of the current Hugo Doks site (international) and Hugo fc-site (the
Nightingale part in Chinese) is Markdown, so a script that migrates the front matter is enough; a
full 301 map of old URLs is produced along with the migration.

### 7.2 Deployment architecture (dual deployment, China and overseas)

- The same build output, published twice by CI:
  - **International domain**: Cloudflare Pages or Vercel;
  - **Domestic domain**: Tencent Cloud EdgeOne Pages (or Alibaba Cloud OSS + CDN), on Flashcat's
    existing ICP-filed domains (CDN acceleration in mainland China requires a filing).
- Precedent: Vue's cn.vuejs.org domestic mirror.
- The Chinese build strips overseas third-party dependencies: self-hosted fonts, no Google Fonts
  / Algolia / YouTube (videos go to both Bilibili and YouTube).

### 7.3 SEO engineering

- hreflang on every page (zh-CN / en / x-default); each language has its own canonical — never
  canonicalize one to the other.
- OG / Twitter cards across the site, with OG images generated from templates at build time
  (satori / @vercel/og style).
- The sitemap only includes canonical, 200, indexable URLs.
- **The three GitHub traffic levers**: the site link in the repo's About; site / docs / live demo
  links on the README's first screen; a GitHub social preview image.

### 7.4 Data automation (no more "12000+"-style staleness)

- Pull at build time: the GitHub API (stars / forks / contributors / latest release) and the
  Docker Hub API (pulls); a daily scheduled rebuild (CI cron) keeps the numbers fresh.
- The integration count, data source count and so on are driven by the integrations catalog data
  file — one source for the numbers, referenced by the homepage, the docs and the README alike.

---

## 8. Visual and copy tone

- **Visual**: light by default with a complete dark mode (the existing screenshots already come
  in both themes); **real product screenshots** are the core visual asset (modeled on Keep), with
  no purely abstract illustrations; the brand color stays Nightingale green (matching the logo),
  with high-contrast emphasis in the stats bar and comparison tables.
- **Screenshot rules**: a uniform browser frame, uniform demo data (use the demo site's data so it
  is real and reproducible), one set each for the Chinese and English UI, and an owner who
  updates them with each release.
- **Copy**: engineers writing for engineers (modeled on VictoriaMetrics' "By Engineers For
  Engineers"); config snippets and real commands instead of adjectives (modeled on Vector);
  comparisons stay restrained and acknowledge where the other tool fits.

---

## 9. Roadmap

### Phase 1: stop the bleeding + a new storefront (within 1–2 months of launch)

1. Launch the redesigned homepage (all the sections in §4; until the live demo is ready, Get
   Started takes the top CTA slot).
2. **Bring the v9 docs to the English site** (translate the AI configuration chapter, with the
   MCP integration guide first — an SEO window nobody has filled yet).
3. Data automation (§7.4); fix the stale numbers and v8 dead links on the product page.
4. Fix the download CDN's hotlink 403; three links on the README's first screen + a social
   preview.
5. Clean up the template leftovers (the Dutch content, the Doks contributors page).

### Phase 2: conversion + growth (months 2–4)

6. Launch the live demo site and switch the hero's primary CTA to it.
7. Reorganize the docs by Diátaxis + converge versions (v9 body + v8 archive, v5–v7 offline with
   301s) + Pagefind search.
8. The first four comparisons + the first batch of the integrations catalog (data sources and
   notification channels).
9. Automatic changelog sync; start the blog with migrated content.
10. Ship the AI-ready four.

### Phase 3: systematization (months 4–6)

11. Finish the framework migration (if phases 1 and 2 were built on the old framework, switch
    everything to Astro + Starlight in this phase; alternatively, start a new repository in phase
    1, build the site in parallel and cut over traffic in phase 3).
12. Dual deployment in China + a CDN on an ICP-filed domain.
13. DocSearch AskAI (English); the newsletter; collect user stories (logo wall authorization + 2–3
    case studies).
14. Converge the Nightingale part of flashcat.cloud/docs with 301s.

> Scheduling note: items 2 (v9 English docs) and 4 (the download fix) in phase 1 do not depend on
> the redesign and can start immediately.

---

## Appendix A: benchmark quick reference (the main line 10 sites share)

```
Hero (one positioning line + 2 CTAs) → proof of trust (logo wall / stats bar, first screen) → product capabilities (3–8 sections)
→ differentiating narrative (2026 = AI) → integrations ecosystem → deployment / version choice → testimonials → closing CTA (+ newsletter)
```

What each site is most worth learning from: Grafana (the /oss/ dual path, the version timeline),
VictoriaMetrics (the engineer-persona slogan, the stats bar on the first screen), SigNoz ("Open
Source XX Alternative" SEO pages, migration testimonials), Keep (the step 1–4 narrative,
integration count as a core metric), Netdata (the comparisons hub; counter-example: 30+ homepage
sections), Prometheus (open-governance endorsement), HertzBeat (a docker run command in the hero),
Uptime Kuma (a temporary demo instance on click), Vector (code-example driven, components as
numbers, a closing newsletter), Zabbix (deployment counts + years + third-party ratings as
enterprise credentials).

## Appendix B: main sources

- Audit of the current sites (2026-08-25): the n9e.github.io sitemap, flashcat.cloud,
  api.github.com/repos/ccfos/nightingale, tests against download.flashcat.cloud.
- Local repositories: n9e/n9e.github.io (the Hugo Doks site at the time), flashcatcloud/fc-site
  (the structure of the Chinese v5–v9 docs), ccfos/nightingale (README, tags, MCP notes).
- Competitor benchmark: grafana.com (including /oss/grafana/), victoriametrics.com, signoz.io,
  keephq.dev, netdata.cloud, prometheus.io, hertzbeat.apache.org, uptime.kuma.pet, vector.dev,
  zabbix.com (each crawled on 2026-08-25).
- Technology choice: pkgpulse.com (framework size), starlight.astro.build/guides/i18n/,
  pagefind.app, algolia.com/blog (DocSearch v4 / AskAI), llmstxt.org,
  ahrefs.com/blog/llmstxt-study/, diataxis.fr, docs.victoriametrics.com/playgrounds/,
  github.com/xingpingcn/enhanced-FaaS-in-China, Tencent Cloud EdgeOne Pages docs.
