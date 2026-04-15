## ADDED Requirements

### Requirement: Homepage fully translated
The homepage (`src/pages/index.js`) SHALL display all text in English when in English locale, including hero section, version selector, stat cards, and all child components.

#### Scenario: Hero section in English
- **WHEN** user visits `/en/`
- **THEN** hero subtitle displays "Full-stack, Lightweight", stat cards display "AI Native", "Easy Deploy", "On-demand" (or equivalent English)

#### Scenario: Version selector in English
- **WHEN** user views the install section on English homepage
- **THEN** version names display as "Basic" and "Smart" with English descriptions

### Requirement: Pricing page fully translated
The pricing page (`src/pages/pricing.js`) SHALL display all plan names, descriptions, features, and button text in English when in English locale.

#### Scenario: Pricing plans in English
- **WHEN** user visits `/en/pricing`
- **THEN** plan names display as "Community", "Standard", "Enterprise" with English descriptions and feature lists

#### Scenario: Pricing CTA buttons in English
- **WHEN** user views pricing page in English
- **THEN** buttons display "Free Trial", "Buy Now", "Contact Sales" respectively

### Requirement: Playground page fully translated
The Playground page (`src/pages/playground/`) SHALL display page title, login prompts, and tab labels in English when in English locale.

#### Scenario: Playground page in English
- **WHEN** user visits `/en/playground`
- **THEN** page title shows "AI Playground", login prompts and navigation tabs display in English
