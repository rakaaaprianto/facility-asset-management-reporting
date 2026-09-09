## 1. Environment and Configuration

- [x] 1.1 Update `EMAIL_FROM` in `.env` and `.env.example` to use `Infomedia AMRS <notifications@monthly-reportfam.web.id>` and verify file contents
- [x] 1.2 Update default `configuredFrom` in `lib/email-service.ts` to `Infomedia AMRS <notifications@monthly-reportfam.web.id>` and verify with unit check

## 2. Server Actions and Data Persistence

- [x] 2.1 Update `submitReport` in `lib/report-actions.ts` to record `submittedById: user.id` in `db.monthlyReport.update` and verify type check
- [x] 2.2 Enhance `sendRevisionNotification` in `lib/email-service.ts` to query `ReportStatusLog` fallback and include `SUPPORT` role assignments

## 3. Transport Reliability and Fast Timeout

- [x] 3.1 Add `connectionTimeout: 5000` and `greetingTimeout: 5000` to Nodemailer transporter in `lib/email-service.ts`
- [x] 3.2 Verify build compiles cleanly with `npm run build` or typecheck
