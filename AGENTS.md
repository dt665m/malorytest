# Agent instructions

## Project context

- This repository is for a small browser game built during a live demo about constraints. The starting point is a rotating cube; add gameplay only when requested.
- Use TypeScript for application code, including frontend and server-side code.
- Host the website on Cloudflare Workers using Static Assets. Add server-side Worker code only when needed.
- The frontend stack is React, TypeScript, and Three.js with Vite. No database or authentication system is selected.

## Starter constraints

- This repository owns its starter. Do not import an external template or switch to Next.js, Vite+, React Three Fiber, or another game engine unless requested.
- Keep the initial app to one full-viewport canvas with a rotating cube. Do not add menus, controls, dashboards, assets, physics, or game mechanics unless requested.
- React owns the page and canvas lifecycle. Use Three.js directly in `src/App.tsx`; keep scene setup and animation together until gameplay requires more structure.
- Use Vite with `@vitejs/plugin-react` for hot module replacement and React Fast Refresh. Editing the app must not require restarting the dev server.
- Use pnpm and retain `pnpm-lock.yaml`. Follow the `packageManager` version in `package.json`. Install with `pnpm install --frozen-lockfile`; develop with `pnpm dev`; check types with `pnpm typecheck`; build with `pnpm build`; inspect the production build with `pnpm preview`.
- Keep animation independent of frame rate, handle viewport resizing, respect reduced-motion preferences, and dispose of rendering resources and event listeners on unmount or hot reload.
- The production output is `dist/`, served by the `malorytest` Worker configured in `wrangler.jsonc`. This is an assets-only Worker with no server entry point. Add Worker code only when the requested gameplay needs server-side behavior.
- Verify the cube renders and rotates, resizing works, and hot reload leaves one canvas without browser errors. Prepare dependencies before the live talk.

## Cloudflare deployment

- Cloudflare builds and deploys every push to `main` of this repository: it installs with pnpm and runs `wrangler deploy`, which first runs `build.command` (`pnpm build`) from `wrangler.jsonc`. Merging a pull request is the deployment; nothing else publishes.
- Do not run `wrangler login`, `wrangler deploy` or `pnpm run deploy`, and do not ask for Cloudflare credentials.
- Before opening a pull request, run `pnpm deploy:check`. It typechecks, builds and validates the Wrangler configuration without signing in or publishing.
- Keep `wrangler.jsonc` as the source of truth for the Worker name, compatibility date, build command and assets directory. The account is the one connected to this repository in Cloudflare; do not add `account_id`.
- Use Node.js 22.12+ and the pnpm version in `package.json`. Install with `pnpm install --frozen-lockfile`. `pnpm-workspace.yaml` permits the native installation scripts for Wrangler's `esbuild` and `workerd` dependencies.
- A dry run is not a deployment. Do not report a change as live unless Cloudflare's check on the merged commit succeeded.

## Implementation

- Build the smallest complete version of the requested demo. Reuse existing code and installed dependencies before adding new ones.
- Server-side code must run in the Cloudflare Workers runtime. Prefer standard Web APIs; do not assume a persistent filesystem, a long-running server process, or unrestricted Node.js APIs.
- Keep Cloudflare configuration in the project's Wrangler configuration. Access Cloudflare services through typed environment bindings.
- Keep secrets in Cloudflare secrets or local development secret files excluded from version control. Never embed secrets in client code or commit them.
- Validate unknown input at its owning boundary, then pass typed values inward. Avoid redundant validation and unnecessary helpers or abstractions.
- Before generating new UI components, use the image model to create mockups consistent with the current design language. Keep components self-describing and accessible.

## Workflow and verification

- Inspect the existing code and configuration before making changes. Preserve unrelated demo materials and user changes.
- Follow the project's established package manager, build commands, and tooling once present. Do not change build or deployment tooling unless requested.
- Discuss database schema changes and the migration approach, and obtain explicit approval before implementing a new migration.
- Present proposed GitHub Actions workflow changes and obtain explicit approval before creating or modifying workflows.
- Favor local end-to-end verification of realistic workflows, using the Cloudflare development runtime for Worker behavior.
- Check meaningful behavior. Avoid tautological tests and tests that merely lock in implementation details; add regression tests only for a genuine gap in behavior coverage.
- Run checks appropriate to code changes. Documentation-only and Git-only tasks do not require tests, builds, linting, or typechecks unless requested.
- Report what changed, what was verified, and any remaining limitations. Do not claim a deployment succeeded without verifying it.
