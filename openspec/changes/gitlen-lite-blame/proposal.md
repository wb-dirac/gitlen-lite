## Why

Developers need inline git blame information to understand code ownership and change history without leaving their editor. Current VS Code extensions either lack this functionality or are overly complex with unnecessary features that impact performance.

## What Changes

- Add inline blame annotations showing commit author and date at the end of each line
- Implement hover cards that display detailed commit information when hovering over blame annotations
- Add diff comparison functionality to view changes between current and previous versions
- Create a lightweight, performant implementation focused on core blame features

## Capabilities

### New Capabilities
- `inline-blame`: Display git blame information inline at the end of each line showing author and commit date
- `commit-hover-cards`: Show detailed commit information in hover cards when mouse hovers over blame annotations
- `diff-comparison`: Enable side-by-side comparison between current file version and previous commit

### Modified Capabilities
- None

## Impact

- Core editor extension files for blame functionality
- Git integration for repository analysis and blame data retrieval
- UI components for inline annotations and hover cards
- Diff viewer integration for version comparison
- Performance optimizations for large repositories
