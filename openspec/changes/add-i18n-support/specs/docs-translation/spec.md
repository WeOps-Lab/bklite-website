## ADDED Requirements

### Requirement: All Markdown docs have English translations
Every Markdown documentation file under `docs/` SHALL have a corresponding English translation at `i18n/en/docusaurus-plugin-content-docs/current/` with the same directory structure and filename.

#### Scenario: English doc for each Chinese doc
- **WHEN** a user navigates to any doc page in English locale (e.g., `/en/docs/opspilot/introduce`)
- **THEN** the page displays the English translated version of the document

#### Scenario: Document structure preserved
- **WHEN** building the English locale docs
- **THEN** the sidebar structure, ordering, and hierarchy match the Chinese version exactly

### Requirement: Translation covers all 19 modules
English translations SHALL exist for all modules: opspilot, monitor, alert, log, job, cmdb, node, analysis, mlops, console, itsm, system, deploy, operations, dev, faq, lab, playground, asserts.

#### Scenario: Complete module coverage
- **WHEN** user browses the English docs sidebar
- **THEN** every module present in Chinese docs is also available in English with fully translated content

### Requirement: Technical terms consistency
Translations SHALL use consistent English terms for domain-specific concepts across all documents.

#### Scenario: Consistent terminology
- **WHEN** user reads multiple English docs
- **THEN** the same Chinese term (e.g., "监控中心", "告警中心", "作业管理") is consistently translated to the same English term throughout all documents
