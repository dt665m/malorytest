# Live demo starter

Requires Node.js 22.12+ and pnpm 12.4.1.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Vite prints the local URL. React Fast Refresh updates edits while the dev server runs.

```sh
pnpm typecheck
pnpm build
pnpm preview
```

The production build is written to `dist/`. Cloudflare Workers serves these static assets using `wrangler.jsonc`.

```sh
pnpm preview:cloudflare  # Build and preview in the local Cloudflare runtime
pnpm deploy:check        # Build and validate deployment without publishing
```

Cloudflare deploys every push to `main` with `wrangler deploy`, which runs `pnpm build` first (`build.command` in `wrangler.jsonc`). See `AGENTS.md`.

Preview builds run on every pull request.
