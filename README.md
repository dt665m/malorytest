# Live demo starter

## Math cube

Select `?theme=math` for translucent rotating cubes containing a unit-circle diagram and a local,
rule-based math coach (not a connected AI service). Click the canvas or focus it
and press left/right arrows to adjust the angle in 15° steps. The diagram and
sine, cosine, and tangent values update together; tangent is undefined at 90°
and 270°. Reduced-motion preferences stop rotation without disabling input.
No API keys, network service, or extra dependencies are required. The default
spherical scene is unchanged; `?theme=math&shape=faceted` combines the math
view with the existing beveled geometry. Both objects keep their purple layered
animal textures, rings and motion; the math view makes the outer materials
translucent to reveal the diagram.

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
