## Purpose

Enforces strict role-based access control and site-assignment authorization rules across all data exports, reporting endpoints, and management operations.

## ADDED Requirements

### Requirement: Explicit Export Authorization
The system SHALL validate that PIC users can only export monthly reports and data for sites explicitly assigned to their user account.

#### Scenario: PIC attempting to export an assigned site report
- **WHEN** an authenticated PIC user requests an Excel export for a report associated with one of their assigned `siteIds`
- **THEN** the system authorizes and generates the workbook.

#### Scenario: PIC attempting to export an unassigned site report
- **WHEN** an authenticated PIC user requests an export for a report associated with a site not present in their `siteIds`
- **THEN** the system denies access with a 403 Forbidden response.

#### Scenario: PIC attempting national or regional consolidated export
- **WHEN** an authenticated PIC user requests a national or multi-site regional export via `/api/export/monthly`
- **THEN** the system denies access with a 403 Forbidden response.
