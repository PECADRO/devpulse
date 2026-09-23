# Architecture

DevPulse is a TypeScript/Vite application with a deliberately small core. The UI is rendered in `src/main.ts`; pure, testable focus-board operations live in `src/domain/focus.ts`. Versioned workspace persistence and legacy-data migration live in `src/domain/workspace.ts`. Browser `localStorage` provides the current storage adapter, while the domain boundary leaves room for other implementations.

Principles: keep user data local by default; request the least GitHub permission needed; never put tokens in client-side source or browser storage; provide explicit error and offline states; keep domain logic independent of the UI; verify changes with automated tests and a production build.

Any GitHub integration must use a secure authentication and token-storage design. Directly embedding a personal access token in a public static site is not acceptable.
