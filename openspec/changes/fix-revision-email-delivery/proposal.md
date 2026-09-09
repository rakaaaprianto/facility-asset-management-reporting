## Why

When an administrator requests revisions on a submitted monthly report, the email notification fails to reach the site PIC in production and corporate network environments. This occurs because the system was configured with Resend's default testing sender (`onboarding@resend.dev`) which strictly rejects external recipients (HTTP 403), the fallback Nodemailer SMTP is blocked on corporate firewalls (ports 587/465), and `submittedById` was never persisted when a report was submitted.

## What Changes

- Update default `EMAIL_FROM` configuration to use the verified custom domain `Infomedia AMRS <notifications@monthly-reportfam.web.id>`.
- Fix `submitReport` server action in `lib/report-actions.ts` to record `submittedById: user.id` in `db.monthlyReport.update`.
- Enhance `sendRevisionNotification` in `lib/email-service.ts`:
  - Query submitter from `submittedBy` and fallback to `ReportStatusLog` history (`toStatus: "SUBMITTED"`).
  - Include both `PIC` and `SUPPORT` role assignments from `site.users`.
  - Add strict connection timeouts (5 seconds) on Nodemailer SMTP fallback to prevent serverless function hangs when SMTP ports are blocked.
  - Add structured logging to assist runtime troubleshooting.
- Update `.env` and `.env.example` templates with the production email settings.

## Capabilities

### New Capabilities
- `revision-notification`: Reliable delivery of revision request notification emails to report submitters and assigned site personnel using HTTPS-based email APIs.

### Modified Capabilities
<!-- None -->

## Impact

- `lib/report-actions.ts`: `submitReport` stores `submittedById`.
- `lib/email-service.ts`: Recipient resolution and transport timeout improvements.
- `.env` & `.env.example`: Updated sender email address.
