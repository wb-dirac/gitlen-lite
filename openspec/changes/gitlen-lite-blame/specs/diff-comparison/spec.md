## ADDED Requirements

### Requirement: Enable diff comparison from blame annotations
The system SHALL provide a diff comparison button in hover cards to compare current file version with the blamed commit.

#### Scenario: Diff comparison initiation
- **WHEN** the user clicks the diff comparison button in a hover card
- **THEN** the system SHALL open a diff view showing changes between the current file and the blamed commit
- **AND** the diff view SHALL highlight additions, deletions, and modifications

#### Scenario: Diff view navigation
- **WHEN** the diff view is open
- **THEN** the user SHALL be able to navigate between changes using next/previous buttons
- **AND** the current change SHALL be highlighted in both the diff and the original editor

### Requirement: Handle diff comparison for different commit states
The system SHALL handle diff comparison appropriately for various commit scenarios.

#### Scenario: Diff with uncommitted changes
- **WHEN** the user requests diff comparison for a line with uncommitted changes
- **THEN** the system SHALL compare the working directory version with the blamed commit
- **AND** uncommitted changes SHALL be clearly marked in the diff view

#### Scenario: Diff for first commit
- **WHEN** the user requests diff comparison for the first commit in a file's history
- **THEN** the system SHALL show the diff as the entire file being added
- **AND** the system SHALL display an appropriate message indicating this is the initial commit
