# DevPulse

DevPulse is a focused workspace for software developers who want a clear view of what matters next. It keeps day-to-day priorities close at hand without turning the development process into another noisy project-management system.

The current workspace includes a responsive focus board with private browser persistence, progress summaries, keyboard-friendly controls, and a tested domain layer. Optional GitHub integration adds repository activity plus deterministic issue and pull-request triage without storing credentials.

## Highlights

- Fast, responsive interface built with TypeScript and Vite
- Local persistence with no account or external service required
- Versioned workspace data with automatic migration from the original focus-item format
- Focus items with completion tracking and safe input handling
- Accessible labels, focus states, and mobile layouts
- Reusable, tested UI rendering primitives and shared design tokens
- Typed GitHub connection boundary with in-memory credentials and rate-limit errors
- Versioned repository cache with synchronization change summaries
- Responsive repository activity view with safe external links
- One-step synchronization for recently active public GitHub repositories
- Open issue and pull-request retrieval with strict repository-path validation
- Explainable triage scoring for labels, review readiness, discussion, and waiting time
- Automated test, build, and GitHub Pages deployment workflow
- Domain logic covered by automated tests
- Production build with strict TypeScript checking

## Run locally

Requires Node.js 20.19+.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Use `npm test` for unit tests and `npm run build` for type checking and a production build.

Enter a GitHub user or organization in the GitHub Triage panel to synchronize its recently active public repositories. DevPulse ranks their open issues and pull requests using visible, deterministic signals. GitHub's unauthenticated API rate limit applies.

## Deploy

Every push to `main` runs the full test suite, creates the production build, and deploys `dist` through GitHub Pages. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once; subsequent releases are automatic.

## Project structure

```text
src/
  domain/focus.ts       Focus-item operations and persistence validation
  domain/focus.test.ts  Unit tests for the domain layer
  domain/workspace.ts   Versioned persistence and data migrations
  domain/workspace.test.ts  Persistence and migration tests
  domain/repositories.ts  Repository cache and synchronization logic
  domain/repositories.test.ts  Synchronization and diff tests
  domain/triage.ts     Deterministic issue and pull-request prioritization
  domain/triage.test.ts  Priority scoring and ordering tests
  ui/primitives.ts       Reusable HTML rendering primitives
  ui/primitives.test.ts  Rendering and escaping tests
  ui/repository-activity.ts  Repository activity presentation
  ui/repository-activity.test.ts  Activity rendering and link-safety tests
  ui/triage.ts         GitHub connection form and ranked queue
  ui/triage.test.ts    Triage rendering and link-safety tests
  integrations/github.ts  Secure GitHub API connection boundary
  integrations/github.test.ts  Contract, validation, and error tests
  design-system.css      Shared visual tokens and primitive styles
  main.ts               Application rendering and interactions
  styles.css            Responsive visual system
```

## Privacy

Focus items are stored in the browser's `localStorage`. They are not transmitted, synchronized, or backed up. Clearing site data removes them.

The public synchronization flow does not request or persist access tokens. It sends the entered owner name directly to GitHub's HTTPS API. A future private-repository connection must supply authentication at request time through an OAuth or server session.

Repository metadata and the ranked triage queue are normalized into the versioned local workspace cache. Existing workspace data is upgraded automatically.

## Quality checks

```sh
npm test
npm run build
```
