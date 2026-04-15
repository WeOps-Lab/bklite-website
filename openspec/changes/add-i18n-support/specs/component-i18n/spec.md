## ADDED Requirements

### Requirement: All React component visible text uses Translate
Every user-visible Chinese string in React components under `src/components/` and `src/pages/` SHALL be wrapped with `<Translate>` component or `translate()` function from `@docusaurus/Translate`.

#### Scenario: HomepageFeatures displays in English
- **WHEN** user visits the homepage in English locale
- **THEN** all feature titles (e.g., "经典运维" → "Classic Operations") and descriptions display in English

#### Scenario: AIShowcase displays in English
- **WHEN** user visits the homepage in English locale
- **THEN** all AI showcase feature names (e.g., "AI 原生" → "AI Native") and descriptions display in English

#### Scenario: FinalCTA displays in English
- **WHEN** user visits the homepage in English locale
- **THEN** the CTA section heading, description, and feature bullets display in English

#### Scenario: MegaMenu displays in English
- **WHEN** user opens the navigation mega menu in English locale
- **THEN** all menu section titles and item descriptions display in English

### Requirement: Navbar custom components support i18n
Custom navbar components (JoinCommunityNavbarButton, LogoutNavbarButton) SHALL display translated text based on current locale.

#### Scenario: Login/logout UI in English
- **WHEN** user is on the English locale site
- **THEN** login button shows "Login", logout shows "Logout", account roles show "Admin"/"Guest"/"User"

#### Scenario: Join community in English
- **WHEN** user clicks join community in English locale
- **THEN** the popup shows English text for community joining instructions

### Requirement: Translation IDs follow naming convention
All translation IDs SHALL follow the pattern `componentName.semanticPath` (e.g., `hero.subtitle`, `pricing.plan.community.name`, `features.classic.title`).

#### Scenario: code.json contains organized translation keys
- **WHEN** `docusaurus write-translations --locale en` is executed
- **THEN** the generated `i18n/en/code.json` contains all translation keys organized by component namespace

### Requirement: Playground components support i18n
All Playground components (MLOpsTab, OpsPilotTab, scenarios) SHALL display translated UI strings including scenario names, button labels, status messages, and error messages.

#### Scenario: MLOps scenario list in English
- **WHEN** user visits Playground in English locale
- **THEN** scenario names display as "Anomaly Detection", "Time Series Prediction", "Log Clustering", etc.

#### Scenario: Playground error messages in English
- **WHEN** a Playground action fails in English locale
- **THEN** frontend-generated error messages display in English (backend API errors may remain in Chinese)
