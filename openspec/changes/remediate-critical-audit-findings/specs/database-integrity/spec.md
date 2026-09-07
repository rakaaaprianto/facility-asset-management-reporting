## Purpose

Guarantees all-or-nothing atomicity for multi-row data modifications and bulk report deletions across the asset reporting lifecycle.

## ADDED Requirements

### Requirement: Atomic Bulk Section Row Persistence
The system SHALL wrap all row insertions, updates, and asset creations within a database transaction during bulk saves.

#### Scenario: Successful bulk save
- **WHEN** a user saves up to 50 rows in a report section and all validations pass
- **THEN** all rows are committed simultaneously in a single transaction and an audit log is recorded.

#### Scenario: Failure during bulk save
- **WHEN** a validation error or database constraint fails on any row within the batch
- **THEN** all changes in the batch are rolled back completely and no partial rows remain persisted.

### Requirement: Atomic Multi-Report Deletion
The system SHALL execute report deletions and related unlinking in a unified transaction.

#### Scenario: Bulk report deletion
- **WHEN** an authorized administrator triggers bulk deletion of reports for a site or month
- **THEN** all non-cascading asset links, attachments, logs, and report records are deleted atomically.
