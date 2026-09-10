## 1. Audit Log Immutability

- [x] 1.1 Remove `deleteAuditLog`, `deleteAuditLogsBulk`, and `clearAllAuditLogs` Server Actions from `lib/admin-actions.ts` and verify audit logs cannot be deleted programmatically
- [x] 1.2 Remove delete action buttons and bulk selection controls from `app/(app)/admin/audit/page.tsx` and verify the interface is strictly read-only

## 2. Session Lifecycle & Password Complexity

- [x] 2.1 Update `lib/session.ts` to reduce `MAX_AGE_SECONDS` to 24 hours (86400s) and include `iat` timestamp in session token payload
- [x] 2.2 Add session revocation verification in `lib/auth.ts` to invalidate active tokens when account passwords are updated
- [x] 2.3 Add enterprise password complexity validator (minimum 8 characters, requiring uppercase, lowercase, number, and special character) in `lib/admin-actions.ts` for user creation and password changes

## 3. Magic Bytes Upload Inspection

- [x] 3.1 Create `lib/magic-bytes.ts` with binary header signature verification for PDF, Office (DOCX/XLSX), ZIP, PNG, and JPEG formats
- [x] 3.2 Integrate magic bytes inspection into `uploadAttachment` in `lib/attachment-actions.ts` and verify spoofed file extensions are rejected

## 4. Infrastructure & Domain Decoupling

- [x] 4.1 Refactor `next.config.ts` to dynamically consume `ALLOWED_ORIGINS` and `APP_ORIGIN` environment variables, and enable `output: "standalone"`
- [x] 4.2 Create production multi-stage `Dockerfile` and `.dockerignore` optimized for corporate Linux server or container deployment
- [x] 4.3 Update `.env.example` with enterprise security and deployment environment variables

## 5. Verification & Security Patching

- [x] 5.1 Resolve high-severity dependency advisories via `npm audit fix` and remove unneeded legacy packages
- [x] 5.2 Verify complete compilation with `npx tsc --noEmit` and run production build with `npm run build`
