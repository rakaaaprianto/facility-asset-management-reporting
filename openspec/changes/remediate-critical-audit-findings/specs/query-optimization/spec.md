## Purpose

Optimizes database query patterns across high-frequency report detail views and large multi-site consolidated Excel exports.

## ADDED Requirements

### Requirement: Lightweight Report Tab Status Resolution
The system SHALL determine whether report sections contain data using lightweight existence queries rather than loading complete record sets.

#### Scenario: Rendering report detail page tabs
- **WHEN** an authenticated user opens a monthly report detail page
- **THEN** the system resolves the filled state of all tabs using lightweight ID checks or counts without fetching full row contents into memory.

### Requirement: Batched Data Retrieval for Excel Generation
The system SHALL retrieve section data for multi-site workbooks using batched set-based database queries.

#### Scenario: Generating regional or national monthly Excel export
- **WHEN** an authorized administrator requests a consolidated monthly Excel export covering multiple sites
- **THEN** the system executes batched queries filtered by the list of report IDs for each section rather than executing individual sequential queries per site.
