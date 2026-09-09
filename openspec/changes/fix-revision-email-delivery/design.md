## Context

See `proposal.md` for background on email delivery failures during report revision requests.
The system uses Next.js 16 Server Actions, Prisma ORM, and supports Resend HTTPS API, Brevo HTTPS API, and Nodemailer SMTP fallback.

## Goals / Non-Goals

**Goals:**
- Ensure revision notifications are sent via Resend HTTPS API using verified domain `notifications@monthly-reportfam.web.id`.
- Automatically capture `submittedById` on `submitReport`.
- Resolve recipients comprehensively (submitter + status log + assigned site PICs and SUPPORT users).
- Prevent serverless timeout hangs by applying short connection timeouts to Nodemailer SMTP fallback.

**Non-Goals:**
- Replacing Resend or adding extra third-party email providers.
- Changing the email HTML visual template layout.

## Decisions

### 1. Default `EMAIL_FROM` with Verified Domain
- **Decision:** Set `EMAIL_FROM` fallback in `lib/email-service.ts` and `.env` to `Infomedia AMRS <notifications@monthly-reportfam.web.id>`.
- **Rationale:** `monthly-reportfam.web.id` has been successfully verified in Resend (DKIM, SPF verified). This enables unconstrained delivery to any recipient domain via HTTPS Port 443 without corporate firewall blocks.
- **Alternatives Considered:** Brevo API (requires secondary API key registration and setup).

### 2. Capture `submittedById` in `submitReport`
- **Decision:** In `lib/report-actions.ts:submitReport`, include `submittedById: user.id` in `db.monthlyReport.update`.
- **Rationale:** The schema already has `submittedById String?` and `submittedBy User?`. Storing this guarantees the actual submitter is directly queryable.
- **Alternatives Considered:** Querying only `ReportStatusLog` (indirect, slower, and doesn't update the primary foreign key).

### 3. Resilient Recipient Lookup Strategy in `sendRevisionNotification`
- **Decision:**
  1. Add `report.submittedBy.email` if present.
  2. If `submittedBy` is null, query latest `ReportStatusLog` where `reportId = id` and `toStatus = 'SUBMITTED'`, joining `actedBy.email`.
  3. Include all users assigned to `report.site` whose role is `PIC` or `SUPPORT`.
  4. Deduplicate all emails and exclude empty/invalid strings.
- **Rationale:** Handles older reports created before `submittedById` was saved, as well as sites operated by SUPPORT engineers.

### 4. SMTP Connection Timeout Safeguard
- **Decision:** Configure `connectionTimeout: 5000` and `greetingTimeout: 5000` in Nodemailer transporter options.
- **Rationale:** If corporate network blocks port 587, Nodemailer will fail fast in 5 seconds rather than hanging the serverless request for 60-120 seconds.

## Risks / Trade-offs

- [Risk: Invalid recipient email in database] → Mitigation: Basic email format validation and filtering before sending.
- [Risk: Vercel environment variables out of sync with `.env`] → Mitigation: The user already added `EMAIL_FROM` and `RESEND_API_KEY` to Vercel and triggered redeploy.
