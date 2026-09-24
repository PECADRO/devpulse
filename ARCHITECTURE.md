# Architecture

DevPulse is a TypeScript/Vite application with a deliberately small core. The application shell and event wiring live in `src/main.ts`; reusable, escaped HTML renderers live in `src/ui/primitives.ts`, with shared visual tokens in `src/design-system.css`. Pure focus-board operations live in `src/domain/focus.ts`. Versioned workspace persistence and legacy-data migration live in `src/domain/workspace.ts`. Browser `localStorage` provides the current storage adapter, while the domain boundary leaves room for other implementations.

`src/integrations/github.ts` defines the GitHub boundary independently from the UI. It requests credentials just in time from an injected token source, never stores them, requires HTTPS outside local development, validates response shapes, and exposes rate-limit metadata through typed errors. This keeps a future OAuth or server-session implementation replaceable without coupling credentials to browser persistence.

Principles: keep user data local by default; request the least GitHub permission needed; never put tokens in client-side source or browser storage; provide explicit error and offline states; keep domain logic independent of the UI; verify changes with automated tests and a production build.

Directly embedding a personal access token in a public static site is not acceptable.
