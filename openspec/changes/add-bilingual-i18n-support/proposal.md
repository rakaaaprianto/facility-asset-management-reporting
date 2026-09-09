## Why

The management requires the AMRS platform to support bilingual capability (Bahasa Indonesia as default, with an option to switch to English). This allows executive stakeholders and international auditors to view reporting interfaces in English while preserving existing URL structures, preventing server rendering degradation, and maintaining operational continuity for local site PICs.

## What Changes

- Add a language toggle component (`🇮🇩 ID | 🇬🇧 EN`) in the header/navigation bar.
- Introduce a lightweight client-and-server bilingual dictionary system using cookie/storage persistence without altering route URLs (`/reports`, `/dashboard` remains identical).
- Provide English and Indonesian localization dictionaries for:
  - Sidebar navigation and header controls
  - Dashboard status labels and metric cards
  - Report workflow states (Draf, Submitted, Needs Revision, Approved)
  - Common action buttons (Submit, Save, Export Excel, Delete, Back)
  - Section tab labels across monthly reports
  - Audit log action descriptions and headers
- Preserve existing database content as-is (freeform text entered by field PICs remains in original input language).

## Capabilities

### New Capabilities
- `i18n-localization`: Bilingual interface support (ID/EN) with seamless language switching and zero performance impact on server rendering.

### Modified Capabilities
<!-- None -->

## Impact

- `app/layout.tsx`: Provide locale context or cookie detection.
- `components/layout/header.tsx` & `components/layout/sidebar.tsx`: Language switcher button and localized labels.
- `lib/i18n/`: Dictionary definitions (id.ts, en.ts) and translation hook/helper.
- Zero URL routing changes (no `/en/` or `/id/` prefixes).
- Zero database schema changes.
