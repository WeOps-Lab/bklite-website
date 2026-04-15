## ADDED Requirements

### Requirement: Locale switcher in navbar
The site SHALL display a locale dropdown in the navbar right section that allows users to switch between zh-Hans and en.

#### Scenario: User switches to English
- **WHEN** user clicks the locale dropdown and selects "English"
- **THEN** the page navigates to the `/en/` prefixed version of the current page with all UI elements in English

#### Scenario: User switches back to Chinese
- **WHEN** user is on an English page and selects "中文" from the locale dropdown
- **THEN** the page navigates to the non-prefixed Chinese version of the current page

### Requirement: Translation JSON file structure
The site SHALL have translation JSON files at `i18n/en/` following Docusaurus conventions: `code.json`, `docusaurus-theme-classic/navbar.json`, `docusaurus-theme-classic/footer.json`, and `docusaurus-plugin-content-docs/current.json`.

#### Scenario: Build with English locale
- **WHEN** `docusaurus build` is executed
- **THEN** the build produces both zh-Hans and en static sites, with en site under `/en/` path prefix

#### Scenario: Navbar labels in English
- **WHEN** user visits the English locale site
- **THEN** navbar labels display as "Docs", "Deploy Guide", "Operations Manual", "Dev Guide", "AI Playground", "Pricing" instead of Chinese

#### Scenario: Footer labels in English
- **WHEN** user visits the English locale site
- **THEN** footer section titles and link labels display in English

### Requirement: Sidebar category translations
All `_category_.json` sidebar labels SHALL have English translations in `i18n/en/docusaurus-plugin-content-docs/current.json`.

#### Scenario: Sidebar displays in English
- **WHEN** user browses docs in English locale
- **THEN** all sidebar category names display in English (e.g., "监控" → "Monitoring", "告警" → "Alerts")

### Requirement: Development and build scripts
The `package.json` SHALL include scripts for English locale development: `start:en` for local dev and the default `build` SHALL build all locales.

#### Scenario: Local development in English
- **WHEN** developer runs `pnpm start:en`
- **THEN** the dev server starts with English locale content
