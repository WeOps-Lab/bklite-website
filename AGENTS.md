# AGENTS.md - BlueKing Lite Website

> Guidelines for AI agents working on this Docusaurus documentation site.

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Development server | `pnpm start` (port 3001) |
| Production build | `pnpm build` |
| Clear cache | `pnpm clear` |
| Verify changes | `pnpm build` (no tests) |

**No test framework** - always verify with `pnpm build` before committing.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Docusaurus 3.8.1 |
| React | 19.0.0 |
| Node | 18+ required |
| Package Manager | pnpm |
| Styling | CSS Modules + Infima variables |
| Animation | framer-motion, canvas-confetti |
| Icons | react-icons (Fa, Ri, Hi prefixes) |
| i18n | zh-Hans (default), en |

## Project Structure

```
src/
├── components/           # React components (PascalCase folders)
│   ├── AIShowcase/       # Platform capabilities showcase
│   ├── AnimatedBackground/  # Aurora + floating orbs effects
│   ├── FinalCTA/         # Final call-to-action section
│   ├── HomepageFeatures/ # Feature grid with TiltCard
│   ├── LiquidNavbar/     # Custom navbar component
│   ├── MegaMenu/         # Navigation mega menu
│   ├── MicroInteractions/ # Hover/click micro-interactions
│   ├── PartnersShowcase/ # Partner logos section
│   ├── ScrollAnimations/ # FadeIn, StaggerContainer, etc.
│   └── TiltCard/         # 3D tilt hover effect card
├── pages/                # Docusaurus pages
│   ├── index.js          # Homepage (main entry)
│   └── pricing.js        # Pricing page
├── theme/                # Theme overrides
│   └── Navbar/           # Custom navbar overrides
└── css/
    └── custom.css        # Global fonts & CSS variables

docusaurus.config.js      # Site config, navbar, footer, i18n
sidebars.js               # Documentation sidebar structure
static/                   # Images, install scripts
deploy/                   # Docker deployment configs
```

## Code Style

### Import Order (STRICT - Follow This Exactly)

```javascript
// 1. React core
import React, { useState, useEffect, useRef } from 'react';

// 2. External libraries (alphabetical)
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// 3. Docusaurus/theme imports
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// 4. Internal components (@site/*)
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import { FadeInUp, StaggerContainer } from '@site/src/components/ScrollAnimations';
import { TiltCard } from '@site/src/components/TiltCard';

// 5. Styles (ALWAYS LAST)
import styles from './index.module.css';
```

### Component Pattern

**Functional components only**, default exports for main components:

```javascript
// Internal helper component (not exported)
function Feature({ title, icon, description }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </div>
  );
}

// Main component (default export)
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
| Component folders | PascalCase | `components/MegaMenu/index.js` |
| Functions/variables | camelCase | `handleCopy`, `selectedVersion` |
| CSS modules | `styles.module.css` | Import as `styles`, use `styles.featureCard` |
| Pages | lowercase | `pricing.js`, `index.js` |
| Constants | camelCase arrays | `const FeatureGroups = [...]` |

### Styling with CSS Modules

```javascript
import clsx from 'clsx';
import styles from './styles.module.css';

// Single class
<div className={styles.card}>

// Multiple classes
<div className={clsx(styles.card, styles.primary)}>

// Conditional classes
<div className={clsx(styles.card, isActive && styles.active)}>
```

Use Infima CSS variables in stylesheets:

```css
.card {
  color: var(--ifm-color-primary);
  font-family: var(--ifm-font-family-base);
  font-weight: var(--ifm-font-weight-semibold);
  /* spacing: var(--ifm-spacing-horizontal) */
}
```

### Animation Patterns

Use the reusable animation components from `ScrollAnimations`:

```javascript
import { FadeInUp, StaggerContainer, StaggerItem } from '@site/src/components/ScrollAnimations';

// Fade in on scroll
<FadeInUp delay={0.1}>
  <div>Content</div>
</FadeInUp>

// Staggered children animation
<StaggerContainer staggerDelay={0.08}>
  {items.map((item, idx) => (
    <StaggerItem key={idx} direction="up">
      <Card {...item} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

### Error Handling

Wrap async operations in try-catch with user feedback:

```javascript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(command);
    // Success feedback (visual change, confetti, etc.)
  } catch (err) {
    console.error('复制失败:', err);
    // Error feedback (visual indication)
  }
};
```

### Comments

- Chinese comments are OK (matches i18n default: zh-Hans)
- Use `//` for inline code comments
- Use `/* */` for CSS section dividers

## Pre-commit Hook

Changes to `deploy/docker-compose/` or `deploy/dev/` auto-regenerate install scripts:

```bash
# Triggered automatically by husky pre-commit hook
# Regenerates: static/install.run, static/install.dev
# Syncs: deploy/dev/conf/
```

## DO NOT

- **TypeScript**: JavaScript only, no `.ts`/`.tsx` files
- **Class components**: Functional components only
- **Relative imports**: Use `@site/` or `@theme/` aliases instead
- **State management**: No Redux, Context API, or external state libraries
- **Font modifications**: Don't remove `!important` from font declarations in custom.css
- **CJK font stacks**: Don't modify without understanding CJK rendering requirements

## Key Files Reference

| File | Purpose |
|------|---------|
| `docusaurus.config.js` | Site config, navbar items, footer, i18n, analytics |
| `sidebars.js` | Documentation sidebar structure |
| `src/css/custom.css` | Global fonts (CJK-optimized), Infima variables |
| `src/pages/index.js` | Homepage with hero, features, animations |
| `src/components/ScrollAnimations/index.js` | Reusable framer-motion wrappers |
| `src/components/TiltCard/index.js` | 3D hover effect card component |
| `.husky/pre-commit` | Auto-generate install scripts hook |

## Build & Deploy

```bash
# Local development
pnpm start

# Build and verify
pnpm build

# Docker deployment
pnpm build && docker build -t bklite-website . && docker run -p 80:80 bklite-website
```
