# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-19

### Added
- Setup of a clean Angular 19 standalone workspace.
- Created `SyllabusService` to load, store, update, and track syllabus details and completed checklist states.
- Created `AppComponent` layout featuring:
  - Glassmorphic header card with instructor profile info (Dr. Elena Vance).
  - Main tab switcher (Weekly Schedule, Grading Breakdown, JSON Editor).
  - Dynamic weekly accordion modules showing required readings and deliverables checklists.
  - LocalStorage persistency for checked states.
  - Live JSON editor with real-time validation alerting of parser errors.
  - Universal progress bar showing percentage and complete items count.
- Added Jest/Karma unit tests in `tests/` directory verifying state updates, completions, and layout titles.
