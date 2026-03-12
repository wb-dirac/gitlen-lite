## ADDED Requirements

### Requirement: Display commit hover cards
The system SHALL display detailed commit information in a hover card when the user hovers over a blame annotation.

#### Scenario: Commit hover card display
- **WHEN** the user hovers over a blame annotation for 500ms
- **THEN** the system SHALL display a hover card showing commit hash, author, date, and commit message
- **AND** the hover card SHALL appear positioned near the blame annotation
- **AND** the card SHALL disappear when the mouse moves away

#### Scenario: Hover card with truncated message
- **WHEN** a commit message exceeds 100 characters
- **THEN** the hover card SHALL display the first 100 characters with an ellipsis
- **AND** the full message SHALL be available in a tooltip or expanded view

### Requirement: Include commit actions in hover cards
The system SHALL provide actionable buttons within the hover card for common git operations.

#### Scenario: Copy commit hash action
- **WHEN** the user clicks the copy button in the hover card
- **THEN** the system SHALL copy the full commit hash to the clipboard
- **AND** the hover card SHALL remain visible

#### Scenario: Open commit in external tool
- **WHEN** the user clicks the external tool button in the hover card
- **THEN** the system SHALL attempt to open the commit in the configured git GUI tool
- **AND** the system SHALL show an error message if no external tool is configured
