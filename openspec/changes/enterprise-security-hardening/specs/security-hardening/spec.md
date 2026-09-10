## Purpose

Provides enterprise-grade application security controls encompassing immutable audit logging, hardened session lifecycles, rigorous binary file inspection, and environment-agnostic infrastructure configuration to satisfy corporate infosec standards.

## ADDED Requirements

### Requirement: Immutable Audit Trail
The system SHALL strictly maintain an append-only audit trail and SHALL NOT allow any user, including Super Admins, to delete, truncate, or alter audit log entries through the web application or API.

#### Scenario: Attempting to delete audit log entry
- **WHEN** any user attempts to trigger audit log deletion actions
- **THEN** the system rejects the operation with an authorization error and no records are modified or removed

#### Scenario: Audit log UI display
- **WHEN** an administrator views the Audit Log management interface
- **THEN** no delete buttons, clear-all buttons, or bulk removal checkboxes are rendered

### Requirement: Hardened Session Lifecycle
The system SHALL limit session tokens to a maximum lifetime of 24 hours and SHALL immediately invalidate active sessions when an account's password is changed.

#### Scenario: Session token expiry after 24 hours
- **WHEN** a user presents a session token older than 24 hours
- **THEN** the system rejects the session as expired and redirects the user to the login screen

#### Scenario: Session invalidation upon password change
- **WHEN** a user successfully updates their password
- **THEN** all previous session tokens for that user are rendered invalid and require re-authentication

### Requirement: Strong Password Policy
The system SHALL enforce password complexity standards requiring at least 8 characters comprising uppercase letters, lowercase letters, numbers, and special characters.

#### Scenario: Password fails complexity rules
- **WHEN** an administrator or user attempts to set a password that lacks uppercase, lowercase, number, or special character, or is shorter than 8 characters
- **THEN** the system rejects the input with a descriptive validation error

#### Scenario: Password passes complexity rules
- **WHEN** a user supplies a compliant password meeting all four complexity criteria and minimum length
- **THEN** the system hashes the password with bcrypt (cost 12) and successfully updates the account

### Requirement: Magic Bytes File Upload Inspection
The system SHALL verify the initial binary bytes (magic numbers) of any uploaded attachment to confirm that the file content matches its declared extension and MIME type.

#### Scenario: Uploading genuine document or image
- **WHEN** a user uploads a valid PDF, Excel workbook, Word document, PNG, or JPEG file
- **THEN** the system confirms the binary header matches the allowed signature and stores the file safely

#### Scenario: Disguised executable or script upload
- **WHEN** a user uploads a disguised script or binary executable renamed with an allowed extension (e.g. `malicious.exe` renamed to `invoice.pdf`)
- **THEN** the system detects the magic bytes mismatch, rejects the upload, and records a security audit log

### Requirement: Dynamic Origin Configuration
The system SHALL load trusted origins and CORS parameters dynamically from environment variables (`APP_ORIGIN` and `ALLOWED_ORIGINS`) rather than relying on hardcoded cloud domains.

#### Scenario: Deploying to internal corporate domain
- **WHEN** the system is configured with a corporate domain via `APP_ORIGIN=https://fam-report.infomedia.co.id`
- **THEN** Server Actions and security headers automatically trust the configured domain without requiring code modifications
