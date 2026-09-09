## Purpose

Ensures report revision requests trigger reliable email notifications to the responsible PIC and assigned site users via secure HTTPS delivery that bypasses corporate network firewall restrictions.

## ADDED Requirements

### Requirement: Record Report Submitter on Submission
The system SHALL persist the submitting user's ID (`submittedById`) when a monthly report is transitioned to `SUBMITTED` status.

#### Scenario: Submitter recorded on submit
- **WHEN** an authorized PIC or SUPPORT user submits a monthly report
- **THEN** the report's `submittedById` field is updated with the current user's ID alongside `submittedAt` and status `SUBMITTED`

### Requirement: Reliable Revision Notification Recipient Resolution
The system SHALL resolve recipient email addresses for revision notifications by combining the report submitter, historical submitters from status logs, and assigned site personnel (including PIC and SUPPORT roles).

#### Scenario: Revision email resolved for submitted report
- **WHEN** an administrator requests revision with a feedback note on a report
- **THEN** the system resolves the submitter's email and all assigned PIC/SUPPORT emails into a deduplicated recipient list

#### Scenario: Fallback to status log when submittedBy is unlinked
- **WHEN** a report has no direct `submittedById` link
- **THEN** the system queries the latest `SUBMITTED` log entry from `ReportStatusLog` to identify the submitter's email

### Requirement: Firewall-Resistant Email Transport
The system SHALL prioritize HTTPS-based email transmission (Resend REST API) with a verified sender domain, and enforce a maximum 5-second connection timeout on fallback SMTP.

#### Scenario: Notification sent via verified Resend domain
- **WHEN** Resend API key is configured
- **THEN** the system dispatches the revision email via HTTPS POST to `api.resend.com` using the verified sender `Infomedia AMRS <notifications@monthly-reportfam.web.id>`

#### Scenario: SMTP fallback terminates quickly on blocked ports
- **WHEN** HTTPS dispatch fails or is unconfigured and the corporate firewall blocks outbound SMTP port 587
- **THEN** Nodemailer aborts connection within 5 seconds without freezing the server action
