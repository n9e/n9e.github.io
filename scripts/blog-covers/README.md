# Blog covers

Each `*.html` here is the source of one blog cover (1200×630, the size `og:image:width/height`
in docusaurus.config.ts promises). Style: warm paper, handwritten labels (Caveat), soft watercolor
blocks, no product logos — names are plain text.

Render with Playwright at deviceScaleFactor 1 (JPEG, quality 86) for `og:image`, and at 2 for the
in-post image (PNG → `cwebp -q 80`). Outputs go to `static/img/blog/<name>.jpg` and `.webp`.
Fonts load from Google Fonts at render time only; nothing here ships with the site.
