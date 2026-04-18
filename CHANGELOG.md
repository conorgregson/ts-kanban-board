# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] - 2026-04-17

### Added

- Added a fully interactive Kanban board built with strict TypeScript
- Added support for creating, renaming, and deleting columns
- Added support for creating, renaming, and deleting tasks
- Added native HTML5 drag-and-drop for moving tasks within and between columns
- Added support for dropping tasks into empty columns
- Added live insertion indicators while dragging tasks
- Added full-column drag-over highlighting for clearer drop feedback
- Added auto-scroll while dragging near the left and right edges of the board
- Added per-column WIP limits with inline visual feedback
- Added WIP preset cycling for `∞`, `2`, `3`, `5`, `8`, and `13`
- Added custom WIP limit input via shift-click
- Added WIP enforcement to block invalid drops into full columns
- Added task labels/tags with inline editing
- Added common-label quick-select chips and support for custom labels
- Added color-coded label chips with deterministic styling for custom labels
- Added live text filtering for tasks
- Added label-based task filtering
- Added clear-filters control
- Added multi-select task support with Ctrl/Cmd-click
- Added range selection within a column using Shift-click
- Added bulk actions for clearing selection, deleting tasks, and moving selected tasks
- Added visible selected state styling for tasks
- Added one-time onboarding tips for task renaming and multi-select behavior
- Added theme selection with built-in themes:
  - Sky
  - Grape
  - Slate
  - Sunset
  - Forest
  - Ocean
  - Sand
  - Rose
- Added theme persistence across sessions
- Added local persistence using `localStorage`
- Added auto-backup support and backup status display
- Added restore-from-backup support
- Added JSON export support
- Added JSON import in both replace and merge modes
- Added toast notifications for success, error, and informational feedback
- Added Vite-based development and build workflow

### Changed

- Refactored the original UI layer from a large single-file implementation into focused modules under `src/ui/`
- Improved drag-and-drop UX with clearer empty-column behavior and more precise drop feedback
- Improved task-card interaction discoverability with tooltip hints and onboarding toasts
- Improved task selection feedback and bulk action visibility
- Improved column header responsiveness on smaller screens
- Improved styling consistency for labels, selection states, and drag states
- Improved theme handling so theme changes continue working correctly after import and restore flows
- Improved overall maintainability by separating rendering, selection, filters, theme, backup, bulk actions, and UI utilities into dedicated modules

### Fixed

- Fixed drag-and-drop failing when the destination column was empty
- Fixed drop target behavior so empty columns now expose a usable drop area
- Fixed incorrect task move behavior caused by destination column lookup issues
- Fixed WIP limit persistence and setter behavior
- Fixed multi-select counter synchronization issues
- Fixed bulk action bar visibility/state issues
- Fixed task selection styling becoming out of sync across columns
- Fixed column header overflow issues on smaller screen sizes
- Fixed Tailwind utility conflicts around `hidden` and `flex` in the bulk actions bar
- Fixed theme binding so changes apply to the current board instance after import and backup restore
- Fixed label color styling inconsistencies
- Fixed toast info styling typo
- Fixed TypeScript strict-mode issues in drag/drop and WIP preset handling

### Notes

- This release represents the first public version of the project
- The project is intentionally framework-free and focused on advanced TypeScript, DOM state management, and modular UI architecture
- Future improvements may include bulk label editing, undo/redo history, richer task metadata, stronger keyboard workflows, and a backend persistence layer
