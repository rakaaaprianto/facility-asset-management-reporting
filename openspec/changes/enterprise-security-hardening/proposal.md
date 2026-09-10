## Why

Following recent IT Security mitigations regarding shared-IP reputation on public cloud providers (Vercel), the application must be hardened to corporate enterprise security standards. Because the final on-premise/VPS infrastructure and official Infomedia subdomain are still pending provisioning, application-level security controls must be decoupled from hosting infrastructure so the system is self-contained, enterprise-compliant, and ready to deploy anywhere without code modification.

## What Changes

- **Immutable Audit Logging**: Enforce write-only audit trail by removing `deleteAuditLog`, `deleteAuditLogsBulk`, and `clearAllAuditLogs` actions and UI controls (compliance with ISO 27001 & NIST non-repudiation).
- **Session Lifecycle Hardening**: Reduce session max-age from 7 days to 24 hours absolute timeout with token version tracking to invalidate sessions upon password change.
- **Enterprise Password Policy**: Enforce strong password complexity rules (minimum 8 characters with uppercase, lowercase, numbers, and special symbols).
- **Magic Bytes File Upload Validation**: Inspect raw binary header signatures for all uploaded attachments to prevent executable disguise or polyglot payload bypass.
- **Dynamic Infrastructure & Origin Decoupling**: Refactor `next.config.ts` to consume dynamic origin configurations (`APP_ORIGIN`, `ALLOWED_ORIGINS`) via environment variables, removing hardcoded cloud domains.
- **Enterprise Containerization**: Provide a production-grade multi-stage `Dockerfile` (Next.js standalone mode) allowing immediate deployment on any internal Linux VPS, Docker host, or on-premise server.
- **Dependency Security Patching**: Resolve high/critical vulnerabilities identified during `npm audit` (updating `next` to patched release and cleaning unneeded legacy packages).

## Capabilities

### New Capabilities
- `security-hardening`: Covers audit log immutability, session expiration and invalidation, magic bytes upload inspection, and environment-agnostic origin configuration.

### Modified Capabilities
*(None - existing business requirements remain intact)*

## Impact

- **Affected Code**: `lib/admin-actions.ts`, `lib/session.ts`, `lib/auth.ts`, `lib/attachment-actions.ts`, `next.config.ts`, `package.json`.
- **New Files**: `Dockerfile`, `.dockerignore`, `lib/magic-bytes.ts`.
- **User Experience**: Super Admins will no longer see "Hapus Log" buttons in the Audit Log view. Users will require stronger passwords when creating or updating accounts.
