# DevPulse

DevPulse is a focused workspace for software developers who want a clear view of what matters next. It keeps day-to-day priorities close at hand without turning the development process into another noisy project-management system.

The current workspace includes a responsive focus board with private browser persistence, progress summaries, keyboard-friendly controls, and a small tested domain layer. Repository activity, issue triage, pull-request health, and delivery insights fit into the same architecture as optional integrations.

## Highlights

- Fast, responsive interface built with TypeScript and Vite
- Local persistence with no account or external service required
- Versioned workspace data with automatic migration from the original focus-item format
- Focus items with completion tracking and safe input handling
- Accessible labels, focus states, and mobile layouts
- Reusable, tested UI rendering primitives and shared design tokens
- Typed GitHub connection boundary with in-memory credentials and rate-limit errors
- Versioned repository cache with synchronization change summaries
- Domain logic covered by automated tests
- Production build with strict TypeScript checking

## Run locally

Requires Node.js 20.19+.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Use `npm test` for unit tests and `npm run build` for type checking and a production build.

## Project structure

```text
src/
  domain/focus.ts       Focus-item operations and persistence validation
  domain/focus.test.ts  Unit tests for the domain layer
  domain/workspace.ts   Versioned persistence and data migrations
  domain/workspace.test.ts  Persistence and migration tests
  domain/repositories.ts  Repository cache and synchronization logic
  domain/repositories.test.ts  Synchronization and diff tests
  ui/primitives.ts       Reusable HTML rendering primitives
  ui/primitives.test.ts  Rendering and escaping tests
  integrations/github.ts  Secure GitHub API connection boundary
  integrations/github.test.ts  Contract, validation, and error tests
  design-system.css      Shared visual tokens and primitive styles
  main.ts               Application rendering and interactions
  styles.css            Responsive visual system
```

## Privacy

Focus items are stored in the browser's `localStorage`. They are not transmitted, synchronized, or backed up. Clearing site data removes them.

The GitHub connection layer does not persist access tokens. Authentication must be supplied at request time by an OAuth/session integration, and remote API endpoints must use HTTPS.

Repository metadata is normalized into the versioned workspace cache. Existing workspace data is upgraded automatically when the repository cache is introduced.

## Quality checks

```sh
npm test
npm run build
```
