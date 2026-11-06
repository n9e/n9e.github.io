# Blog covers

Each `*.html` here is the source of one blog cover (1200×630, the size `og:image:width/height`
in docusaurus.config.ts promises). Style: warm paper, handwritten labels (Caveat), soft watercolor
blocks, no product logos — names are plain text.

Render with Playwright at deviceScaleFactor 1 (JPEG, quality 86) for `og:image`, and at 2 for the
in-post image (PNG → `cwebp -q 80`). Outputs go to `static/img/blog/<name>.jpg` and `.webp`.
Fonts load from Google Fonts at render time only; nothing here ships with the site.

The two `*.svg` covers use the same paper palette and Caveat/Inter typography.
`render-svg.py` shapes their text and converts it to paths in temporary SVGs,
so font fallback cannot change the layout. It renders the JPEG at 1200×630
(quality 86) and the WebP at 2400×1260 (`cwebp -q 80`).

Put the variable TTF files from Google Fonts in an external directory, named
`Caveat.ttf`, `Inter.ttf` and `JetBrainsMono.ttf`, then run on macOS with
`rsvg-convert`, `sips` and `cwebp` available:

```sh
uv run --no-project --with fonttools --with uharfbuzz python \
  scripts/blog-covers/render-svg.py --font-dir /path/to/fonts
```

Fonts and temporary outlined SVGs are not published with the site.
