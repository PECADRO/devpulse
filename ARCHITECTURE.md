# Architecture

DevPulse begins as a small TypeScript/Vite application. The UI is rendered in `src/main.ts`; pure, testable focus-board operations live in `src/domain/focus.ts`. Browser `localStorage` is the temporary persistence adapter. A database and GitHub connection abstraction are later milestones, not current capabilities.

Principles: keep user data local by default; request the least GitHub permission needed; never put tokens in client-side source or browser storage; provide explicit error and offline states; keep domain logic independent of the UI; verify changes with automated tests and a production build.

Before adding GitHub integration, choose a secure authentication and token-storage design. Directly embedding a personal access token in a public static site is not acceptable.
