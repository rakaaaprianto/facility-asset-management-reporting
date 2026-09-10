## Context

See `proposal.md` for motivation and background regarding the recent IT Security shared-IP mitigation. The application currently relies on Next.js 16 (App Router) and Prisma ORM on PostgreSQL. The audit identified areas where application controls must be fortified to enterprise standards, independent of the pending final server and subdomain allocation.

## Goals / Non-Goals

**Goals:**
- Make the application 100% infrastructure-agnostic and domain-agnostic via environment variables.
- Guarantee audit trail non-repudiation by permanently disabling in-app audit log deletion.
- Fortify user session security by reducing token lifespan to 24 hours and enforcing invalidation upon password reset.
- Prevent disguised malicious uploads by inspecting binary magic numbers.
- Provide a standardized, production-ready multi-stage `Dockerfile` for deployment on any corporate server or private cloud.

**Non-Goals:**
- Setting up the corporate network firewall or managing Telkom internal DNS routing (responsibility of Infomedia/Telkom Network Operations).
- Enforcing hardware-based MFA (FIDO2/WebAuthn) in this phase (can be addressed in a future SSO/SAML integration).

## Decisions

### 1. Remove In-App Audit Log Deletion
- **Choice:** Completely remove `deleteAuditLog`, `deleteAuditLogsBulk`, and `clearAllAuditLogs` Server Actions from `lib/admin-actions.ts`, and remove the corresponding UI deletion controls from `app/(app)/admin/audit/page.tsx`.
- **Rationale:** Enterprise compliance standards (ISO 27001, SOC 2, and Telkom Group infosec policy) dictate that audit logs must be immutable and append-only. Long-term log archiving or data purging should only be handled via authorized database DBA backup jobs.
- **Alternatives Considered:** Restricting deletion to a 2-man authorization rule (rejected: still violates immutability principles).

### 2. Session Lifetime & Invalidation Logic
- **Choice:** Reduce `MAX_AGE_SECONDS` from 7 days (`604800s`) to 24 hours (`86400s`) in `lib/session.ts`. Include an issued-at timestamp `iat` in the signed JWT payload. Compare `iat` against `user.updatedAt` during authentication checks in `lib/auth.ts` to invalidate existing sessions when a password is changed.
- **Rationale:** Limits exposure window if a cookie is ever intercepted, and guarantees immediate session revocation upon password updates.

### 3. Magic Bytes File Upload Validation
- **Choice:** Create `lib/magic-bytes.ts` to inspect the initial 4–8 bytes of incoming file buffers against known signatures:
  - PDF: `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`)
  - PNG: `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`)
  - JPEG: `\xFF\xD8\xFF`
  - Office/ZIP (DOCX, XLSX, ZIP): `PK\x03\x04` (`0x50 0x4B 0x03 0x04`)
- **Rationale:** Fast, zero-overhead in-memory check without requiring heavy native C-bindings or external CLI utilities.

### 4. Dynamic Domain Decoupling via Environment Variables
- **Choice:** Refactor `next.config.ts` to parse `ALLOWED_ORIGINS` and `APP_ORIGIN` dynamically:
  ```ts
  const envOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  ```
  Fall back to `localhost:3000` in development. Remove hardcoded third-party cloud domains (`*.vercel.app`).
- **Rationale:** When Infomedia assigns the final internal subdomain (e.g. `fam-report.infomedia.co.id`), deployment requires zero code modification—only setting `.env`.

### 5. Multi-Stage Docker Packaging
- **Choice:** Implement `output: "standalone"` in `next.config.ts` paired with a 3-stage `Dockerfile` (`deps`, `builder`, `runner`) on `node:20-alpine`.
- **Rationale:** Yields a secure, lightweight container (~150 MB) that drops root privileges (`USER nextjs`) and runs portably on any Linux VPS or on-premise Kubernetes cluster.

## Risks / Trade-offs

- **[Risk] Daily re-login required for users:**
  → *Mitigation:* 24 hours comfortably covers an entire working day shift. Modern browsers securely handle credential autofill.
- **[Risk] CSV files lack binary magic numbers (plain text):**
  → *Mitigation:* CSV files will be validated with an ASCII/UTF-8 text heuristic and delimiter check to prevent binary injection.
- **[Risk] Docker build requires Prisma Client generation:**
  → *Mitigation:* The builder stage executes `npx prisma generate` before `next build`.
