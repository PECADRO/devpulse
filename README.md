# DevPulse

A local-first developer productivity dashboard. The first release provides a private focus board; future milestones connect GitHub repositories, issues, pull requests, CI, and delivery insights.

## Run locally

Requires Node.js 20.19+.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Use `npm test` for unit tests and `npm run build` for type checking and a production build.

Focus items are stored in this browser's `localStorage`. They are not synced or backed up. No GitHub permissions or credentials are needed yet.

## Status

Milestone 1 of the [20-day roadmap](ROADMAP.md) is complete locally. GitHub publishing and deployment are not configured. The Git author email must be confirmed as belonging to the intended GitHub account before commits are attributed to the profile.
