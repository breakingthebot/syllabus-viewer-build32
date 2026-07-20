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
  - Print/Export-to-PDF dashboard trigger that calls the browser printing view.
  - Custom CSS print layout `@media print` rules, which expand all weekly modules, apply high-contrast colors, omit navigation bars/search interfaces, and prevent split layouts using `break-inside: avoid`.
  - Multiple Course Syllabus Profiles, enabling students to switch between multiple classes (e.g. CS-301, MATH-101), add new course profiles, and delete selected profiles.
  - Interactive profile dialog popover modal to enter new course metadata (course code, title, instructor name/email).
  - Calendar Integration (.ics file export) button in progress footer, generating standard-compliant calendar event files for all assignments and week topics.
  - Due date countdown badges next to assignments, color-coding and showing dynamically calculated states ('Due today', 'Due tomorrow', 'Due in X days', 'Overdue by X days', and 'Done').
  - Global Upcoming Deliverable Deadlines alert block above the weekly schedule grid, listing unchecked deliverables in the near future.
- Added Jest/Karma unit tests in `tests/` directory verifying state updates, completions, layout titles, profile operations, calendar date parsing, and due date difference maths.
- Added **📊 Course Analytics & Workload Estimator** Collapsible Drawer widget:
  - Displays progress percentages for readings and deliverables.
  - Visualizes weekly workload distributions using vertical bar charts color-coded by workload complexity (light, medium, heavy) and interactive hover detail tooltips.
- Added **Interactive Grade Tracker & Goal Projection Calculator**:
  - Displays dynamic current average scores and letter grade badges.
  - Integrates target grade goal projection tracking, displaying estimated averages required on ungraded categories to hit user goals.
  - Added recorded grades entries checklist per category, complete with add/delete operations and inline popup forms.
  - Added unit test spec suites asserting weight averages and letter grade ranges.
- Added **📅 Study Planner & Calendar Event Scheduler**:
  - Adds dedicated study session timeline agenda.
  - Integrates creation form selecting tasks, date, start/end times, and note goals.
  - Generates countdown badges ('⚡ Active Now', 'Scheduled Today', 'Starts in X days', 'Expired', '✓ Completed') matching local time.
  - Supports task-completions and slot deletion handlers.
- Added **Syllabus Raw Text Auto-Parser**:
  - Created a parsing script `syllabus-parser.ts` to scan raw pasted copy text and extract structured course codes, titles, instructors, grading breakdowns, weekly schedules, readings, and deliverables.
  - Restructured the course creation dialog with manual setup on the left and magic parsing text area on the right.
- Added **Instructor Office Hours Scheduler & Email Query Drafter**:
  - Added interactive buttons to the instructor profile widget to book an office hour study session block or open the email template query modal.
  - Renders email templates with pre-selected assignment context subjects and bodies, featuring a one-click copy button.
  - Placed "Ask" email buttons inline on deliverables checklists to immediately compose query drafts.

