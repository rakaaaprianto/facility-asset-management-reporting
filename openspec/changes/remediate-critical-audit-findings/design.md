## Context

The audit identified critical security, performance, and reliability defects in the Infomedia AMRS application. The application runs Next.js 16 App Router on Node.js/Serverless with Prisma ORM v7 and PostgreSQL (Neon). See `proposal.md` for context and motivation.

## Goals / Non-Goals

**Goals:**
- Enable Next.js Edge Middleware protection via `middleware.ts` for all application routes.
- Prevent application boot with insecure secret fallbacks in production environments.
- Inject enterprise-grade HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) via `next.config.ts`.
- Enforce brute-force rate limiting (5 failed attempts per 15 minutes per IP and email) on authentication endpoints.
- Enforce explicit server-side RBAC validation on all export pathways, ensuring PIC users can only export reports belonging to their assigned sites.
- Enforce ACID consistency across multi-row report operations and bulk deletions via Prisma `$transaction`.
- Reduce Report Detail page database query load from 22 parallel table scans to minimal existence probes.
- Reduce multi-site consolidated Excel export query complexity from $O(S \times N)$ to $O(S)$ where $S$ is sections and $N$ is sites.
- Harden file upload validations and response headers against content injection.

**Non-Goals:**
- Implementing database-level session token revocation (`tokenVersion`) in this change (deferred).
- Rewriting Excel generation with streaming writer (`ExcelJS.stream.xlsx.WorkbookWriter`) in this change (deferred).
- Modifying UI layouts or business approval workflow states (`DRAFT` → `SUBMITTED` → `APPROVED` / `NEEDS_REVISION`).

## Decisions

### 1. Edge Middleware Activation (`proxy.ts` → `middleware.ts`)
- **Decision:** Rename `proxy.ts` to `middleware.ts` in the project root, exporting `export function middleware(request: NextRequest)` with the existing route matcher configuration.
- **Rationale:** Next.js App Router specifically expects `middleware.ts`. This immediately activates route interception and session token validation at the Edge before hitting application code.

### 2. Strict Production Secret Enforcement
- **Decision:** In `lib/session.ts`, validate that `process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET` is populated. If `NODE_ENV === "production"` and the secret is unset or equals the development placeholder, throw an explicit startup error.
- **Rationale:** Prevents catastrophic session signature forgery if environment variables fail to load in production.

### 3. Global Security Headers in `next.config.ts`
- **Decision:** Configure standard HTTP security headers in `nextConfig.headers()`:
  - `Content-Security-Policy`: Restricts script and style origins (`default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; frame-ancestors 'none';`).
  - `X-Frame-Options`: `DENY` (blocks clickjacking).
  - `X-Content-Type-Options`: `nosniff` (blocks MIME confusion attacks).
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (enforces HTTPS).
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`.
- **Rationale:** Defense-in-depth protection across all server responses.

### 4. Authentication Rate Limiting (`lib/rate-limit.ts`)
- **Decision:** Implement an in-memory sliding window rate limiter in `lib/rate-limit.ts` tracking failed attempts per IP address and per email key:
  - Max failed attempts: 5.
  - Lockout duration: 15 minutes (900,000 ms).
  - Clean up stale buckets periodically to prevent memory leaks.
  - Track in `lib/auth-actions.ts` during `login()`. On success, clear the bucket. On failure, increment and block if threshold exceeded.
- **Rationale:** Protects against credential stuffing and automated password dictionary attacks without external Redis infrastructure dependencies.

### 5. Explicit Export RBAC Validation
- **Decision:** In `buildReportWorkbook(reportId, user)` and all export endpoints:
  - Verify that if `user.roleCode === "PIC"`, `user.siteIds.includes(report.siteId)` is strictly `true`.
  - Throw a 403 Forbidden error if an unauthorized site report is requested.
- **Rationale:** Prevents Broken Object Level Authorization (BOLA/IDOR) on spreadsheet exports.

### 6. Atomic Database Transactions in `lib/report-actions.ts` & `lib/admin-actions.ts`
- **Decision:** Wrap `saveRowsBulk`, `deleteReportsBulk`, `deleteReportsByMonth`, and `savePksBulk` within `db.$transaction(async (tx) => { ... })`.
- **Rationale:** If an error occurs on row #20 of 50, all previous rows in the batch rollback automatically, maintaining complete financial and operational report consistency.

### 7. Tab Status Count Optimization on `/reports/[id]`
- **Decision:** In `app/(app)/reports/[id]/page.tsx`, replace `loadSectionRows(s.key, id)` (which retrieves all row columns) with a lightweight existence helper `hasSectionRows(sectionKey, reportId)` using `findFirst({ where: { reportId: id, ...fixed }, select: { id: true } })`.
- **Rationale:** Reduces network payload and query latency by over 80% when loading report detail pages.

### 8. Batched Excel Data Retrieval Pattern
- **Decision:** In `lib/excel-export.ts` (`buildMonthlyWorkbook`), fetch each section's data across all target reports in a single query:
  ```typescript
  const reportIds = reports.map((r) => r.id);
  const rows = await model.findMany({
    where: { reportId: { in: reportIds } },
    orderBy: { createdAt: "asc" },
  });
  ```
  Map results to their respective report IDs in memory.
- **Rationale:** Cuts database queries for a 50-site national export from ~1,050 queries down to ~22 queries, preventing gateway timeouts and database connection pool exhaustion.

## File-Level Impact Analysis

| File Path | Nature of Change | Impact Description |
|-----------|------------------|--------------------|
| `proxy.ts` → `middleware.ts` | **Rename & Export** | Activates Next.js Edge Middleware route guards. |
| `next.config.ts` | **Modify** | Injects global security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer, Permissions). |
| `lib/session.ts` | **Modify** | Adds startup secret validation and removes insecure production fallback. |
| `lib/rate-limit.ts` | **New** | Implements sliding-window rate limiter (5 failed attempts / 15 min). |
| `lib/auth-actions.ts` | **Modify** | Integrates rate limiting on login action. |
| `lib/excel-export.ts` | **Modify** | Enforces PIC site authorization in `buildReportWorkbook` and batches queries in `buildMonthlyWorkbook`. |
| `lib/report-actions.ts` | **Modify** | Wraps `saveRowsBulk`, `deleteReportsBulk`, and `deleteReportsByMonth` in `db.$transaction`. |
| `lib/admin-actions.ts` | **Modify** | Wraps `savePksBulk` in `db.$transaction`. |
| `lib/report-service.ts` | **Modify** | Adds lightweight `hasSectionRows(sectionKey, reportId)` helper for fast existence checks. |
| `app/(app)/reports/[id]/page.tsx` | **Modify** | Uses `hasSectionRows` instead of `loadSectionRows` for tab filled indicator. |
| `lib/attachment-actions.ts` | **Modify** | Adds extension and MIME type allowlist validation. |
| `app/api/attachments/[id]/route.ts` | **Modify** | Injects `X-Content-Type-Options: nosniff` and restrictive attachment download headers. |

## Risks / Trade-offs

- **[Risk] Long transactions in bulk save** → *Mitigation:* Cap bulk saves at 50 rows per batch (already enforced in UI) to ensure transaction duration remains <500ms.
- **[Risk] In-memory rate limiting in multi-instance deployments** → *Mitigation:* In-memory sliding window provides immediate protection per instance with zero external dependencies; designed with clean modular interfaces for future Redis adapter migration.
