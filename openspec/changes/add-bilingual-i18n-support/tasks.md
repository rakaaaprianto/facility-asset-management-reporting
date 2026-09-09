## 1. Dictionary Infrastructure

- [x] 1.1 Create `lib/i18n/dictionaries/id.ts` and `en.ts` with typed dictionary structure covering common, navigation, dashboard, and reports
- [x] 1.2 Create `lib/i18n/language-context.tsx` with React context, cookie synchronization, and `useTranslation()` hook

## 2. Global UI Integration

- [x] 2.1 Create `components/layout/language-toggle.tsx` button component and verify toggle interaction
- [x] 2.2 Mount `LanguageProvider` in `app/layout.tsx` and place `LanguageToggle` in top navigation header
- [x] 2.3 Localize sidebar navigation items in `components/layout/sidebar.tsx` using translation keys

## 3. Core Page Surfaces Localization

- [x] 3.1 Localize Dashboard summary titles and metric cards in `app/(app)/dashboard/`
- [x] 3.2 Localize Report Status badges, filter dropdowns, and common action buttons in `app/(app)/reports/`
- [x] 3.3 Localize Section tab names and headers in report details `app/(app)/reports/[id]/`

## 4. Verification

- [x] 4.1 Verify compilation with `npx tsc --noEmit` and build with `npm run build`
- [x] 4.2 Test language switching in browser and verify cookie persistence
