# Agent Guidelines for Nightingale Documentation Site

## Build, Lint, and Test Commands

### Development
```bash
# Start development server
npm start

# Start server without fast render
npm run server
```

### Build
```bash
# Clean and build for production
npm run build

# Build preview (includes drafts and future posts)
npm run build:preview

# Clean build artifacts
npm run clean
```

### Linting
```bash
# Run all linters (scripts, styles, markdown)
npm run lint

# Lint JavaScript only
npm run lint:scripts

# Lint SCSS/CSS only
npm run lint:styles

# Lint Markdown only
npm run lint:markdown

# Auto-fix Markdown issues
npm run lint:markdown-fix
```

### Testing
```bash
# Run tests (currently runs lint only)
npm test
```

## Code Style Guidelines

### JavaScript/TypeScript

#### General Style
- Use ES6 modules with `import`/`export` syntax
- Use single quotes for strings (`'example'`)
- Use semicolons at end of statements
- Use 2-space indentation
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks and short functions

#### Naming Conventions
- Variables and functions: camelCase (`searchResults`, `handleClick`)
- Constants: UPPER_SNAKE_CASE (`MAX_RESULTS`)
- Classes: PascalCase (`SearchComponent`)

#### Error Handling
- Always check for null/undefined before accessing DOM elements
```javascript
const element = document.getElementById('elementId');
if (element !== null) {
  // Safe to use element
}
```

#### Import Order
1. Third-party imports
2. Relative imports
3. Named imports first, default imports last

#### ESLint Rules
- `no-console`: disabled (allowed)
- `quotes`: single quotes required
- `comma-dangle`: required for multiline arrays/objects/imports/exports

### SCSS/CSS

#### General Style
- Use double quotes for strings (`"primary"`)
- Use 2-space indentation
- Follow Bootstrap 5 conventions
- Use SCSS variables from `_variables.scss`
- Keep specificity low, avoid nested selectors deeper than 3 levels

#### Naming Conventions
- Classes: kebab-case (`.suggestion__title`, `.homepage-banner-light`)
- Variables: kebab-case with `$` prefix (`$primary`, `$font-size-base`)
- Mixins: kebab-case with `@mixin` directive

#### Import Order
1. Third-party libraries (Bootstrap, KaTeX, etc.)
2. Theme variables
3. Common styles
4. Component styles
5. Layout styles

#### Stylelint Rules
- Extends `stylelint-config-standard-scss`
- String quotes: double
- Max line length: disabled
- Custom at-rules allowed (Hugo/SCSS directives)

### Markdown

#### Frontmatter
All content files must have frontmatter with:
```yaml
---
title: "Page Title"
description: "Page description"
lead: ""
date: YYYY-MM-DDTH08:48:45+00:00
lastmod: YYYY-MM-DDTH10:36:54+08:00
draft: false
images: []
---
```

#### Markdown Linting
- MD013 (line length): disabled
- MD024 (multiple headings with same content): disabled
- MD026 (trailing punctuation in heading): disabled
- MD033 (inline HTML): disabled
- MD034 (bare URL used): disabled

#### Writing Guidelines
- Use Chinese for content in `content/zh/` directory
- Use English for content in `content/en/` directory
- Write clear, concise descriptions
- Include relevant images in `static/` directory

### File Organization

#### JavaScript Files
- Place utility functions in `assets/js/`
- Use separate files for different features (alert, darkmode, search, etc.)
- Import Bootstrap via `bootstrap.js` file

#### SCSS Files
- Global variables in `assets/scss/common/_variables.scss`
- Component styles in `assets/scss/components/`
- Layout styles in `assets/scss/layouts/`
- Import all styles in `assets/scss/app.scss`

#### Content Files
- Organize by language (`zh/`, `en/`, `nl/`)
- Group by section (`docs/`, `blog/`, etc.)
- Use index pages (`_index.md`) for section configuration

### Hugo/Template Guidelines

- Use Hugo template syntax for dynamic content
- Keep templates simple and readable
- Use partials for reusable components
- Follow Doks theme conventions

### Netlify Functions

- Place in `functions/` directory
- Export a `handler` function
- Return proper HTTP response structure
```javascript
exports.handler = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hi from Lambda.' })
  });
}
```

## Development Workflow

1. Run `npm start` to start development server
2. Make changes to content, styles, or scripts
3. Run `npm run lint` before committing
4. Fix any linting errors
5. Build with `npm run build` to verify production build
6. Check changes in browser

## Key Dependencies

- Hugo 0.99.0 (static site generator)
- Bootstrap 5.1 (CSS framework)
- highlight.js (code highlighting)
- KaTeX (math rendering)
- FlexSearch (search functionality)
