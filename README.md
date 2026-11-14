# Live demo starter

## Red Batman

Select `?theme=red-batman` to give both rotating objects red Batman cowls,
pointed ears, white eyes, bat emblems and capes. The costume follows their
rotation, orbit, jumping and jelly motion. It preserves the six layered animal
materials, Rubik panels, rings and apples, and adapts to `&shape=faceted`.
Batman defaults to red; an explicit `&cubeColors=oman`, `purple` or `blue`
keeps that palette beneath the red accessories. Omit the theme to retain the
default Omani scene; `?theme=original&cubeColors=blue` selects the blue appearance
without the costume. Math and Gigachad remain available via their existing themes.

## Math cube

Select `?theme=math` for translucent rotating cubes containing a unit-circle diagram and a local,
rule-based math coach (not a connected AI service). Click the canvas or focus it
and press left/right arrows to adjust the angle in 15° steps. The diagram and
sine, cosine, and tangent values update together; tangent is undefined at 90°
and 270°. Reduced-motion preferences stop rotation without disabling input.
No API keys, network service, or extra dependencies are required. The default
spherical scene is unchanged; `?theme=math&shape=faceted` combines the math
view with the existing beveled geometry. Both objects keep their selected palette and layered
animal textures, rings and motion; the math view makes the outer materials
translucent to reveal the diagram.

The canvas turns green for five seconds at 30, 60, 90… seconds after mounting,
then returns to its selected theme. This output tint preserves the underlying
material colors and textures and runs even when reduced motion pauses rotation.
Unmounting clears the timer and tint.

Requires Node.js 22.12+ and pnpm 12.4.1.

Both objects default to Omani flag colours (red, white and green), with opposite material regions sharing a colour. Add `?cubeColors=purple` for the existing purple palette, `?cubeColors=blue` for the original blue palette, or `?cubeColors=oman` for the Omani palette. Unknown values use Omani colours. These options combine with the existing shapes and themes, for example `?shape=faceted&theme=math&cubeColors=purple`. Only the base material colours change: cat textures, animal overlays, Rubik’s panels, rings, flowers, background and motion are preserved. Lighting and texture layers modulate the displayed colours.

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
