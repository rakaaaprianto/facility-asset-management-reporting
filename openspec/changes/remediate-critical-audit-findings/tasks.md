## 1. Security & Edge Middleware Hardening

- [x] 1.1 Rename `proxy.ts` to `middleware.ts`, update function export to `export function middleware`, and verify unauthenticated access to `/dashboard` redirects to `/login`.
- [x] 1.2 Update `lib/session.ts` to enforce mandatory `SESSION_SECRET` / `NEXTAUTH_SECRET` in production mode and eliminate hardcoded secret fallback.
- [x] 1.3 Add global HTTP security headers in `next.config.ts` (CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) and verify headers in HTTP responses.
- [x] 1.4 Implement in-memory sliding window rate limiter in `lib/rate-limit.ts` (5 attempts / 15 minute lockout) and integrate into `lib/auth-actions.ts` `login()`.
- [x] 1.5 Update `lib/attachment-actions.ts` to validate upload file extensions against an approved allowlist (PDF, PNG, JPG, JPEG, XLSX) before writing to disk.
- [x] 1.6 Update `app/api/attachments/[id]/route.ts` to inject `X-Content-Type-Options: nosniff` and sanitize filename headers.

## 2. Access Control & Export RBAC

- [x] 2.1 Update `buildReportWorkbook` in `lib/excel-export.ts` to accept session user context and strictly enforce that PIC users can only export reports for their assigned `siteIds`.
- [x] 2.2 Verify and enforce site-level authorization across all direct export invocations and route handlers.

## 3. Database Transaction Boundaries & Data Integrity

- [x] 3.1 Refactor `saveRowsBulk` in `lib/report-actions.ts` to execute all creates and updates within `db.$transaction` and verify all-or-nothing rollback on validation errors.
- [x] 3.2 Refactor `savePksBulk` in `lib/admin-actions.ts` to execute batch contract creations/updates within `db.$transaction`.
- [x] 3.3 Refactor `deleteReportsBulk` and `deleteReportsByMonth` in `lib/report-actions.ts` to execute cascading detachment and deletion within `db.$transaction`.

## 4. Query Optimization & Performance Fixes

- [x] 4.1 Implement lightweight `hasSectionRows` existence checker in `lib/report-service.ts` using `findFirst({ select: { id: true } })`.
- [x] 4.2 Update `app/(app)/reports/[id]/page.tsx` tab counters to use `hasSectionRows` instead of `loadSectionRows` and verify tab filled badges render correctly.
- [x] 4.3 Refactor `buildMonthlyWorkbook` in `lib/excel-export.ts` to batch query each section across all reports using `where: { reportId: { in: reportIds } }` and verify generated Excel sheets contain all site records.

## 5. Verification & Integration Testing

- [x] 5.1 Run TypeScript typecheck (`npm run typecheck`) and ESLint (`npm run lint`) to ensure zero regression across all modified files.
- [x] 5.2 Verify global security headers on `GET /` and `/login` using curl or browser inspection.
- [x] 5.3 Verify login rate limiting blocks on the 6th consecutive bad password and allows login with valid credentials within the threshold.
- [x] 5.4 Test unauthorized PIC export attempt and confirm 403 Forbidden rejection.
- [x] 5.5 Test bulk row save with intentional duplicate/invalid data to confirm atomic rollback behavior.
- [x] 5.6 Generate a multi-site monthly Excel export and verify export completes without timeouts.
