# How to write the docs

Hard rules for anyone (people and agents) filling in `docs/`. The information architecture is
settled: each page's title and description are its outline (see `scripts/docs-tree.mjs`), so there
is no need to redesign the table of contents.

The benchmark is `docs/get-started/quick-start.md`: short, direct, one point per paragraph.

## 1. Everything checkable must be traced to a source

| What you are writing | Where to check it |
|---|---|
| Menu names, page titles, field names | `n9e/fe/src/components/SideMenu/locale/{zh_CN,en_US}.ts`, plus the `locale/` of the page itself |
| Routes / UI paths | Actually click through them at `http://localhost:8765` |
| Config keys, defaults | `ccfos/nightingale/etc/config.toml` and the matching config structs |
| API paths, parameters | `ccfos/nightingale/center/router/` |
| Tables, field meaning | `ccfos/nightingale/models/` |
| Chinese text that already exists on the old site | `flashcatcloud/fc-site/content/chinese/docs/content/flashcat-monitor/nightingale-v9/` (the `legacy:` URL in a stub maps mechanically to the local file) |

The old site's `_en.md` files are unfinished drafts marked `hidden: true`. **Do not use them as the
English source.**

## 2. If it cannot be written accurately, do not write it

If the current source code and environment cannot get a page to the point where "a reader who
follows it succeeds", **keep `planned: true`** and say in the batch report where it is stuck. An
honest half-page beats a full page that is made up.

## 3. No commercial-edition features

Nothing listed in `plus-only-menus.json` goes into the open-source docs. How to tell is described
in `scripts/docs-env/README.md`. The easy one to get wrong is AI configuration — it is open
source, its entry point just lives inside the Nightingale AI workspace.

## 4. Style

- 60–150 lines per page is normal; more than 250 means it is wordy;
- No layout descriptions like "a three-column layout overall" — say what each area does;
- The first sentence says what the reader will have when the page is done, not what the feature
  is called;
- End with "Next", linking to the next step of the journey;
- Commands and config snippets are complete and copyable, with explicit versions and no real
  credentials;
- Every procedural step has an "Expected result" so readers can tell whether they got it right.

## 5. Chinese and English

Chinese is written first (the source material is Chinese) and English is produced in the same
batch. It is not machine translation — restructure it the way English readers expect, and align
terms with `en_US.ts`.

**Both versions must have the same heading structure** (count, order, and the anchor slugs that
other pages link to). Once the headings drift, cross-page `#anchor` links break in only one
language, and `onBrokenAnchors: 'warn'` only warns instead of failing — nobody will spot it in the
build log of 159 pages.

## 6. Screenshots

Only "follow these steps" pages get screenshots; concept, troubleshooting and reference pages rely
on text and tables. To add one, add an entry to `scripts/docs-env/shot-manifest.mjs` and run
`node scripts/docs-env/shoot-docs.mjs <section>` — do not take screenshots by hand and drop them
into the repo.

Reference images as `/img/docs/<section>/<name>.png`. Chinese pages reference the `.zh.png`
variant.

## 7. When a page is done

1. Remove the comment block, `planned: true`, `sidebar_class_name: planned` and `legacy:` (if
   present) from the front matter; keep `title` / `sidebar_label` / `description`;
2. Change both trees: `docs/` and `i18n/zh-Hans/docusaurus-plugin-content-docs/current/`;
3. Add `{ existing: true }` to the matching `doc(...)` in `scripts/docs-tree.mjs` — it is the only
   safeguard that stops scaffold from silently recreating an accidentally deleted file as an empty
   placeholder;
4. Run `npm run scaffold` and confirm that `git diff` is empty for the four generated files:
   `sidebars.ts`, `src/data/docs-tabs.json`, `src/css/docs-icons.css` and
   `i18n/en/docusaurus-plugin-content-docs/current.json`. Putting `{ existing: true }` on a
   `category(...)` by mistake silently changes the sidebar output;
5. `npm run build` passes (both locales; `onBrokenLinks: 'throw'` is a hard gate).
