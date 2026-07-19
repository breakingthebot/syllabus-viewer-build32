# Interactive Course Syllabus Viewer

A premium, interactive, and structured academic course syllabus viewer built with Angular 19. It helps students track weekly required readings, assignment deadlines, course metrics, and policies, with support for live syllabus customization via a raw JSON payload editor.

### Topics
`angular` `syllabus-viewer` `course-tracker` `typescript` `localstorage` `dark-theme` `json-validation` `rxjs` `jasmine-unit-testing`

## Stack
- **Framework**: Angular 19 (Standalone architecture)
- **Styling**: Vanilla CSS (Premium Dark theme, Outfit & Inter typography, glassmorphic gradients)
- **Key libraries**: Zone.js, RxJS
- **Storage**: Browser `localStorage` (Strictly local, no external database or server tracking)

## Setup
1. Navigate to the project directory:
   ```bash
   cd Build_32
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

## Environment Variables
Refer to `.env.example` for details. This app runs entirely in the browser and does not require any backend environment keys.
- `PORT`: Set local server port (default `4200`).

## Running Locally
To launch the development server, run:
```bash
npm run start
```
Open `http://localhost:4200` to view the dashboard application.

To run Jasmine unit tests in headless mode:
```bash
npm run test -- --watch=false --browsers=ChromeHeadless
```

## Deployed
- **Vercel Production URL**: [https://syllabus-viewer-build32.vercel.app](https://syllabus-viewer-build32.vercel.app)

## Architecture Notes
We developed this project using a strict separation of concerns following atomic patterns:
- **Models (`models/syllabus.model.ts`)**: Defines TypeScript type shapes for instructors, grading items, weekly lectures, tasks, and state records.
- **Service Layer (`services/syllabus.service.ts`)**: Serves as the single source of truth (state store) handling reactive RxJS streams (`BehaviorSubject`), calculating progress completion percentages, and reading/writing checklist data from local storage.
- **View Controller (`app.component.ts` / `app.component.html` / `app.component.css`)**: Standalone root component displaying structural syllabus blocks, handling search queries, filtering categories, toggling module accordions, validating input JSON schemas, and rendering interactive checkboxes with CSS animations.

## Data Handling
- **Data Collection**: No personal identifying information (PII), behavior tracking cookies, or diagnostic logs are collected.
- **Data Storage**: All syllabus updates, checklist checkbox configurations, and completion statuses are stored locally on the client machine inside the browser's `localStorage` namespace (`@syllabus_viewer/syllabus` and `@syllabus_viewer/checked_states`).
- **Data Sharing**: No user data is sent to external servers, CDNs, third-party analytics APIs, or shared with any hosts. The application runs 100% self-contained in the user's browser sandbox.

## Notes & Justifications
- **API Permissions**: The app requires no external API permissions or credentials.
- **Local Persistence Design**: Local storage ensures that a student's progress and syllabus adjustments persist across page refreshes without needing a database server.
