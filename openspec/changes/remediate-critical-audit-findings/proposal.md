## Why

A comprehensive technical and security audit of the Infomedia AMRS platform identified critical vulnerabilities and scalability bottlenecks. Edge middleware is currently inactive due to an incorrect filename (`proxy.ts`), leaving routes unprotected at the network boundary. Critical fallback secrets in session signing present privilege escalation risks. Database bulk operations lack atomic transactions, risking financial report corruption upon partial failure. Additionally, missing global security headers expose the platform to clickjacking and MIME attacks, lack of authentication rate limiting permits credential stuffing, single-report export lacks strict PIC site-level RBAC validation, and 22-query waterfalls on report views cause severe latency and serverless timeout risks.

This remediation plan resolves all **Critical (P0)** and **High (P1)** audit findings plus vital defense-in-depth controls (global security headers, rate limiting, export RBAC) to achieve enterprise-grade security, data consistency, and sub-second page performance prior to production deployment.

## What Changes

- **Activate Next.js Edge Middleware**: Rename `proxy.ts` to `middleware.ts` with standard `middleware` export to enforce authentication and routing guards at the Edge.
- **Enforce Mandatory Production Session Secret**: Throw an immediate startup error if `SESSION_SECRET` or `NEXTAUTH_SECRET` is unset in production, removing the `"dev-only-insecure-secret-change-me"` fallback.
- **Configure Global HTTP Security Headers**: Inject enterprise security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) in `next.config.ts`.
- **Implement Login Rate Limiting**: Introduce IP and account-based throttling on authentication endpoints with a 5-failed-attempt threshold and a 15-minute lockout window.
- **Enforce Explicit Export RBAC Validation**: Strictly validate server-side that PIC users can only export reports belonging to their assigned `siteIds`, blocking unauthorized cross-site data exfiltration.
- **Wrap Bulk Mutations in Atomic Transactions**: Refactor `saveRowsBulk`, `deleteReportsBulk`, `deleteReportsByMonth`, and `savePksBulk` using `db.$transaction` to guarantee all-or-nothing consistency.
- **Eliminate Report Detail Query Waterfall**: Replace 21 full-table parallel data fetches (`loadSectionRows`) in `app/(app)/reports/[id]/page.tsx` with lightweight `findFirst({ select: { id: true } })` existence checks.
- **Batch Regional/National Excel Export Queries**: Refactor `lib/excel-export.ts` to fetch section records across all site reports in single batched `IN` queries instead of nested loops.
- **Secure File Uploads & Storage**: Enforce server-side file extension and MIME type validation with safe content delivery headers (`X-Content-Type-Options: nosniff`).

## Capabilities

### New Capabilities
- `security-hardening`: Edge middleware activation, mandatory production session secret enforcement, global HTTP security headers in `next.config.ts`, login brute-force rate limiting, and upload content-type validation.
- `access-control`: Strict role-based access control (RBAC) and site assignment authorization on all report and Excel export pathways.
- `database-integrity`: Atomic `$transaction` encapsulation for multi-row report operations, bulk deletions, and contract updates.
- `query-optimization`: Lightweight tab status resolution for report details and batched SQL/Prisma query patterns for multi-site Excel generation.

### Modified Capabilities
<!-- No previous delta specs exist in openspec/specs -->

## Impact

- **Affected Code**: 
  - [`proxy.ts`](file:///c:/Project/infomedia-monthly-report/proxy.ts) -> [`middleware.ts`](file:///c:/Project/infomedia-monthly-report/middleware.ts)
  - [`next.config.ts`](file:///c:/Project/infomedia-monthly-report/next.config.ts)
  - [`lib/session.ts`](file:///c:/Project/infomedia-monthly-report/lib/session.ts)
  - [`lib/auth-actions.ts`](file:///c:/Project/infomedia-monthly-report/lib/auth-actions.ts)
  - [`lib/rate-limit.ts`](file:///c:/Project/infomedia-monthly-report/lib/rate-limit.ts) [NEW]
  - [`lib/excel-export.ts`](file:///c:/Project/infomedia-monthly-report/lib/excel-export.ts)
  - [`app/api/export/monthly/route.ts`](file:///c:/Project/infomedia-monthly-report/app/api/export/monthly/route.ts)
  - [`lib/report-actions.ts`](file:///c:/Project/infomedia-monthly-report/lib/report-actions.ts)
  - [`lib/admin-actions.ts`](file:///c:/Project/infomedia-monthly-report/lib/admin-actions.ts)
  - [`app/(app)/reports/[id]/page.tsx`](file:///c:/Project/infomedia-monthly-report/app/(app)/reports/[id]/page.tsx)
  - [`lib/attachment-actions.ts`](file:///c:/Project/infomedia-monthly-report/lib/attachment-actions.ts)
- **Dependencies**: Zero new runtime dependencies. Rate limiting uses high-performance sliding window state.
- **Database**: No schema migration required; query pattern and transaction boundaries updated.
- **Breaking Changes**: None.
