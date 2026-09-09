## Purpose

Provides a lightweight, zero-overhead bilingual translation system for Indonesian and English interface elements without URL changes or performance penalties.

## ADDED Requirements

### Requirement: Language Toggle Switcher
The system SHALL display a language selector in the top application header allowing users to choose between Bahasa Indonesia (`id`) and English (`en`).

#### Scenario: Switching from Indonesian to English
- **WHEN** user clicks the `EN` language toggle
- **THEN** the interface language switches immediately to English and persists across page reloads via cookie and local storage

#### Scenario: Default to Bahasa Indonesia
- **WHEN** a new user accesses the application with no language preference set
- **THEN** the system defaults to Bahasa Indonesia (`id`)

### Requirement: Localized Navigation and Action Controls
The system SHALL render navigation items, action buttons, filter selectors, and status badges in the active language.

#### Scenario: English navigation rendering
- **WHEN** active language is English (`en`)
- **THEN** sidebar items display as "Dashboard", "Monthly Reports", "Approvals", "Master Data", "User Management", "Audit Log", "Settings", and "Logout"

#### Scenario: English workflow status rendering
- **WHEN** active language is English (`en`)
- **THEN** report status badges display as "DRAFT", "SUBMITTED", "NEEDS REVISION", and "APPROVED"

### Requirement: Preserve URL and Content Integrity
The system SHALL NOT alter URL paths when switching languages and SHALL preserve user-generated field data in its original input language.

#### Scenario: Same URL structure across languages
- **WHEN** a user switches between `id` and `en` on `/reports/123`
- **THEN** the URL remains `/reports/123` without redirecting to `/en/reports/123` or `/id/reports/123`

#### Scenario: User input remains untranslated
- **WHEN** a PIC enters remarks or maintenance notes in Indonesian
- **THEN** the stored and displayed remark remains in Indonesian while column headers and action buttons translate to English
