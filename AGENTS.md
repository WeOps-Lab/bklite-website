# AGENTS.md - BlueKing Lite Website

> Guidelines for AI agents working on this Docusaurus documentation site.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm start` | Dev server on http://localhost:3001 |
| `pnpm build` | Production build to `/build` |
| `pnpm clear` | Clear Docusaurus cache |

**No test framework configured** - verify changes with `pnpm build`.

## Tech Stack

- **Framework**: Docusaurus 3.8.1 | **React**: 19.0.0 | **Node**: 18+
- **Styling**: CSS Modules + Infima variables
- **Animation**: framer-motion, canvas-confetti
- **Icons**: react-icons (Fa, Ri, Hi prefixes)
- **i18n**: zh-Hans (default), en
- **Package Manager**: pnpm

## Project Structure

```
src/
├── components/     # React components (10 total, each in named folder)
│   ├── HomepageFeatures/index.js   # Feature grid
│   ├── AIShowcase/index.js         # Platform capabilities
│   ├── AnimatedBackground/index.js # Aurora + floating orbs
│   └── ...                         # MegaMenu, TiltCard, ScrollAnimations, etc.
├── pages/          # Docusaurus pages (index.js, pricing.js)
├── theme/          # Theme overrides
└── css/custom.css  # Global fonts & variables
docs/               # Markdown docs (35 files across 14 modules)
static/             # Images + generated install scripts
```

## Code Style

### Import Order (STRICT)

```javascript
import React, { useState, useEffect } from 'react';  // 1. React
import clsx from 'clsx';                              // 2. External libs
import { motion } from 'framer-motion';
import Layout from '@theme/Layout';                   // 3. @theme/*
import Heading from '@theme/Heading';
import HomepageFeatures from '@site/src/components/HomepageFeatures'; // 4. @site/*
import styles from './index.module.css';              // 5. Styles LAST
```

### Component Pattern

**Functional components only** with default exports:

```javascript
function Feature({ title, icon, description }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      {FeatureList.map((props, idx) => <Feature key={idx} {...props} />)}
    </section>
  );
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HomepageFeatures`, `TiltCard` |
| Functions/variables | camelCase | `handleCopy`, `selectedVersion` |
| Component folders | PascalCase | `components/MegaMenu/index.js` |
| CSS modules | `styles.module.css` | `styles.featureCard` |
| Pages | lowercase | `pricing.js` |

### Styling

Use CSS Modules with Infima variables:

```javascript
import styles from './styles.module.css';
<div className={clsx(styles.card, styles.primary)}>
```

```css
.card {
  color: var(--ifm-color-primary);
  font-family: var(--ifm-font-family-base);
  font-weight: var(--ifm-font-weight-semibold);
}
```

### Data & Error Handling

Define static data as const arrays within components. Wrap async ops in try-catch:

```javascript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(command);
    // Success feedback
  } catch (err) {
    console.error('复制失败:', err);
    // Error feedback
  }
};
```

### Comments

- Chinese comments OK (matches i18n default)
- Use `//` for code, `/* */` for CSS section dividers

## Pre-commit Hook

Changes to `deploy/docker-compose/` or `deploy/dev/` auto-regenerate `static/install.run` and `static/install.dev`.

## DO NOT

- Add TypeScript (JavaScript only)
- Use class components
- Use relative imports when `@site/` or `@theme/` aliases work
- Add testing frameworks or Redux/Context
- Use `as any`, `@ts-ignore`, `@ts-expect-error`
- Remove `!important` from font declarations in custom.css
- Modify CJK font stacks without understanding requirements

## Key Files

| File | Purpose |
|------|---------|
| `docusaurus.config.js` | Site config, navbar, footer, i18n, analytics |
| `sidebars.js` | Doc sidebar structure |
| `src/css/custom.css` | Global fonts (CJK-optimized), CSS variables |
| `src/pages/index.js` | Homepage with framer-motion animations |
| `.husky/pre-commit` | Auto-generate install scripts |

## Build & Deploy

```bash
pnpm build && docker build -t bklite-website . && docker run -p 80:80 bklite-website
```
