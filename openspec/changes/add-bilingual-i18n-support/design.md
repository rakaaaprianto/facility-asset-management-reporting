## Context

The application is built on Next.js 16 (App Router), React 19, and Tailwind CSS.
See `proposal.md` for motivation. The user explicitly chose Option A (Cookie/Client-State switcher without URL restructuring).

## Goals / Non-Goals

**Goals:**
- Provide instant toggling between Indonesian (`id`) and English (`en`).
- Keep all existing URLs unchanged (`/reports/[id]`, `/dashboard`, etc.).
- Add zero additional database queries or network requests.
- Translate primary UI surfaces: Navigation Sidebar, Header, Dashboard metrics, Status Badges, Action buttons, Report Tab headers, and Audit Log labels.

**Non-Goals:**
- Machine translation of user-entered field notes (PIC remarks remain in their original submitted text).
- URL-based sub-path routing (`/en/...` or `/id/...`).

## Decisions

### 1. Dictionary Architecture
- **Decision:** Implement typed dictionary files in `lib/i18n/dictionaries/id.ts` and `en.ts`, with a unified `TranslationKey` type.
- **Rationale:** Strongly typed dictionaries ensure compile-time safety: any missing English key is caught by TypeScript during build.
- **Alternatives Considered:** External i18n libraries (like `next-intl` or `react-i18next`) which add unnecessary bundle weight and complex routing middleware.

### 2. State & Persistence via Cookie and React Context
- **Decision:** Store active locale in a cookie named `app_locale` with a fallback to `id`. Wrap the application with `LanguageProvider` providing `useTranslation()` hook.
- **Rationale:** Cookies allow Server Components to read the locale directly from incoming headers/cookies for initial HTML render, while Client Components can toggle it without page reloads.

### 3. UI Language Switcher Placement
- **Decision:** Place a compact segmented toggle button `🇮🇩 ID | 🇬🇧 EN` in the global Header next to the notification and user profile indicators.
- **Rationale:** High visibility, accessible on all pages, and does not crowd mobile sidebars.

## Risks / Trade-offs

- [Risk: Missing key in dictionary] → Mitigation: Provide automatic fallback to Indonesian default string if an English key is missing.
- [Risk: Hydration mismatch between server and client] → Mitigation: Default to `id` on initial server render, or read `app_locale` from `cookies()` in root layout.
