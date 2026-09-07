## Purpose

Enforces edge-level request authentication, validates production cryptographic secrets, injects global HTTP security headers, throttles login attempts against brute-force attacks, and protects file attachments against arbitrary content injection.

## ADDED Requirements

### Requirement: Edge Middleware Route Protection
The system SHALL intercept incoming HTTP requests at the edge via standard Next.js middleware and enforce authentication checks before routing to protected application resources.

#### Scenario: Unauthenticated access to protected routes
- **WHEN** an unauthenticated client requests a URL under `/dashboard`, `/reports`, `/monitoring`, or `/admin`
- **THEN** the system redirects the request to `/login` with the original URL preserved in the `next` query parameter.

#### Scenario: Public route pass-through
- **WHEN** an unauthenticated client requests `/login` or `/api/health`
- **THEN** the edge middleware allows the request to pass through without redirection.

#### Scenario: Authenticated user accessing login
- **WHEN** a client with a valid session cookie navigates to `/login`
- **THEN** the system redirects the client to `/`.

### Requirement: Mandatory Production Session Secret
The system SHALL mandate a secure environment variable for session cookie cryptographic signing and fail fast during initialization if unconfigured.

#### Scenario: Missing secret in production environment
- **WHEN** the application starts with `NODE_ENV=production` and neither `SESSION_SECRET` nor `NEXTAUTH_SECRET` is defined
- **THEN** the system throws an explicit initialization error and prevents token signing with insecure default fallbacks.

### Requirement: Global HTTP Security Headers
The system SHALL inject defense-in-depth HTTP security headers into all responses emitted by the application via `next.config.ts`.

#### Scenario: Inspecting response headers
- **WHEN** any client receives an HTTP response from the application
- **THEN** the response includes `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy`, and a restrictive `Content-Security-Policy`.

### Requirement: Login Brute-Force Rate Limiting
The system SHALL throttle authentication attempts per IP and per account, enforcing a lockout after consecutive failures.

#### Scenario: Exceeding maximum failed login attempts
- **WHEN** a client submits 5 consecutive failed login attempts within 15 minutes for the same IP or account email
- **THEN** the system blocks subsequent login attempts for 15 minutes and returns a 429 Too Many Requests / clear lockout notification.

#### Scenario: Successful login resets failure counter
- **WHEN** a user successfully authenticates before reaching the maximum failed attempt limit
- **THEN** the system clears the failure counter for that account and IP address.

### Requirement: Secure File Uploads and Safe Serving
The system SHALL validate upload MIME types and serve attachments with restrictive content disposition headers.

#### Scenario: Uploading file with unauthorized extension or MIME
- **WHEN** a user uploads a file with an unapproved MIME type or script extension
- **THEN** the system rejects the upload with a clear validation error.

#### Scenario: Serving attachments safely
- **WHEN** a user downloads an attachment via `/api/attachments/[id]`
- **THEN** the system responds with `X-Content-Type-Options: nosniff` and `Content-Disposition: attachment` to prevent inline browser execution.
