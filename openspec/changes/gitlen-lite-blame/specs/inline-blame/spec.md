## ADDED Requirements

### Requirement: Display inline blame annotations
The system SHALL display git blame information at the end of each line in the editor showing the commit author and date.

#### Scenario: Successful blame annotation display
- **WHEN** a user opens a file in a git repository
- **THEN** the system SHALL display blame annotations at the end of each line showing author name and commit date
- **AND** the annotations SHALL be styled consistently with the editor theme

#### Scenario: Blame annotation for uncommitted changes
- **WHEN** a line has uncommitted changes
- **THEN** the system SHALL display "Not Committed Yet" as the blame annotation
- **AND** the annotation SHALL be visually distinct from committed changes

### Requirement: Update blame annotations on file changes
The system SHALL update blame annotations when the file content changes.

#### Scenario: Real-time blame update
- **WHEN** a user modifies a line in the editor
- **THEN** the system SHALL update the blame annotation for that line within 1 second
- **AND** other lines' annotations SHALL remain unchanged

#### Scenario: Blame refresh after commit
- **WHEN** the user commits changes to the repository
- **THEN** the system SHALL refresh all blame annotations in affected files
- **AND** the annotations SHALL reflect the new commit information
