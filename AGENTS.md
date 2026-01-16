# AGENTS.md - BlueKing Lite Website

> Guidelines for AI coding agents working in this Docusaurus documentation site.

## Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm start` | Dev server on port 3001 |
| `pnpm build` | Production build to `/build` |
| `pnpm clear` | Clear Docusaurus cache |

## Tech Stack

- **Framework**: Docusaurus 3.8.1 (static site generator)
- **React**: 19.0.0
- **Styling**: CSS Modules + Infima CSS variables
- **Icons**: react-icons (FaIcons, RiIcons, HiIcons)
- **Package Manager**: pnpm
- **Node**: 18+
- **i18n**: zh-Hans (default), en

## Project Structure

```
bklite-website/
├── src/
│   ├── components/          # React components (6 total)
│   │   ├── HomepageFeatures/   # Feature grid showcase
│   │   ├── AIShowcase/         # Platform capabilities
│   │   ├── MegaMenu/           # Navigation dropdown
│   │   ├── LiquidNavbar/       # Scroll-reactive navbar
│   │   ├── FinalCTA/           # Call-to-action section
│   │   └── PartnersShowcase/   # Partner logos
│   ├── pages/               # Docusaurus pages
│   │   ├── index.js            # Homepage
│   │   └── pricing.js          # Pricing page
│   ├── theme/               # Theme overrides
│   └── css/
│       └── custom.css          # Global fonts & variables
├── docs/                    # Markdown documentation (14 modules)
├── static/                  # Static assets (images)
├── docusaurus.config.js     # Site configuration
└── sidebars.js              # Sidebar configuration
```

## Code Style Guidelines

### Import Ordering

Order imports in this sequence:
1. React and React hooks
2. External libraries (clsx, Docusaurus components)
3. Theme components (@theme/*)
4. Local components (@site/src/*)
5. Styles (CSS modules last)

```javascript
// ✅ Correct order
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.css';
```

### Component Patterns

**Functional components only** - no class components:

```javascript
// ✅ Correct: Functional component with hooks
function Feature({ title, description, icon }) {
  return (
    <div className={styles.featureItem}>
      <div className={styles.featureIcon}>{icon}</div>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      {FeatureList.map((props, idx) => (
        <Feature key={idx} {...props} />
      ))}
    </section>
  );
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HomepageFeatures`, `FinalCTA` |
| Functions | camelCase | `handleCopy`, `closeQRCode` |
| Variables | camelCase | `selectedVersion`, `showQRCode` |
| CSS classes | camelCase in modules | `styles.featureCard` |
| Files (components) | `index.js` in named folder | `components/MegaMenu/index.js` |
| Files (pages) | lowercase | `pricing.js` |
| CSS modules | `styles.module.css` | `HomepageFeatures/styles.module.css` |

### Export Patterns

- **Default exports** for page components and main component exports
- **Named exports** not used in this codebase

```javascript
// ✅ Standard pattern
export default function ComponentName() { ... }
```

### Styling

**CSS Modules** for component styles:

```javascript
import styles from './styles.module.css';

// Usage
<div className={styles.featureCard}>
<div className={clsx(styles.button, styles.primary)}>
```

**CSS Variables** (Infima) for theming:

```css
/* Use Docusaurus/Infima variables */
color: var(--ifm-color-primary);
font-family: var(--ifm-font-family-base);
font-weight: var(--ifm-font-weight-semibold);
```

**Gradient classes** defined per component:

```css
.gradient-monitoring { /* monitoring theme gradient */ }
.gradient-opspilot { /* AI theme gradient */ }
```

### Data Patterns

Data is defined as static arrays/objects within components:

```javascript
const FeatureGroups = [
  {
    groupTitle: '经典运维',
    groupSubtitle: '成熟稳定的运维能力体系',
    features: [
      {
        title: '监控中心',
        icon: <FaChartBar color="var(--ifm-color-primary)" />,
        badge: '全域监控',
        highlights: ['秒级监控', '弹性采集', '精准告警'],
        description: <>全域监控体系...</>,
      },
      // ...
    ]
  },
];
```

### State Management

Use React hooks for local state only:

```javascript
const [selectedVersion, setSelectedVersion] = useState('basic');
const [isOpen, setIsOpen] = useState(false);
const menuRef = useRef(null);

useEffect(() => {
  // Side effects
}, [dependency]);
```

### Error Handling

Wrap async operations in try-catch:

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

- Use `//` for single-line comments
- Use `/* */` for section dividers in CSS
- Chinese comments are acceptable (matches i18n default)

```javascript
// 版本切换处理函数
const handleVersionChange = (version) => { ... };

// 确保页面加载时滚动到顶部
useEffect(() => { ... }, []);
```

```css
/* ==============================================
   导航栏优化 - 配合 MegaMenu 使用
   ============================================== */
```

## Documentation Files

- Location: `/docs/{module}/`
- Format: Markdown (.md)
- Sidebars: Auto-generated from directory structure

Modules: `opspilot`, `monitor`, `log`, `alert`, `cmdb`, `node`, `mlops`, `itsm`, `console`, `system`, `deploy`, `faq`, `dev`, `operations`

## Build & Deploy

### Development
```bash
pnpm start  # Starts on http://localhost:3001
```

### Production Build
```bash
pnpm build  # Outputs to /build
```

### Docker
```bash
docker build -t bklite-website .
docker run -p 80:80 bklite-website
```

### Pre-commit Hook

Changes to `deploy/docker-compose/` trigger automatic regeneration of `static/install.run`:

```bash
# .husky/pre-commit
bash scripts/generate-install.sh
git add static/install.run
```

## DO NOT

- ❌ Add TypeScript (project uses JavaScript only)
- ❌ Use class components
- ❌ Import from relative paths when `@site/` or `@theme/` aliases work
- ❌ Add testing frameworks (none configured)
- ❌ Use global state management (Redux, Context) - not needed
- ❌ Modify `custom.css` font stacks without understanding CJK requirements
- ❌ Remove `!important` from font declarations (intentional for consistency)

## Key Files

| File | Purpose |
|------|---------|
| `docusaurus.config.js` | Site config, navbar, footer, i18n |
| `sidebars.js` | Documentation sidebar structure |
| `src/css/custom.css` | Global fonts, CSS variables |
| `src/pages/index.js` | Homepage with hero section |
| `Dockerfile` | Multi-stage build (Node → Nginx) |
