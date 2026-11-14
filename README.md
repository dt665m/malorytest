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

## Origami butterfly

Select `?shape=butterfly`, or focus the canvas and press **B**, to unfold six
cube faces into paper wings and a faceted body on both objects. **B** replays
the unfolding; **S** restores the selected sphere, faceted or math shape.
The wings retain the selected palette, refreshable cats, animal/eye overlays,
Rubik panels and optional Gigachad texture. Rings, apples, Batman accessories,
math diagrams, orbit/jelly motion, flowers, mirror and background selection
remain in place. Reduced motion shows fully unfolded, stationary wings.
No background is replaced.

Requires Node.js 22.12+ and pnpm 12.4.1.

Both objects default to Omani flag colours (red, white and green), with opposite material regions sharing a colour. Add `?cubeColors=purple` for the existing purple palette, `?cubeColors=blue` for the original blue palette, or `?cubeColors=oman` for the Omani palette. Unknown values use Omani colours. These options combine with the existing shapes and themes, for example `?shape=faceted&theme=math&cubeColors=purple`. Only the base material colours change: cat textures, animal overlays, Rubik’s panels, rings, flowers, background and motion are preserved. Lighting and texture layers modulate the displayed colours.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Vite prints the local URL. React Fast Refresh updates edits while the dev server runs.

## Shape selection

The default object is a sphere, not a cube: its subdivided cube vertices are
projected onto a radius-0.75 sphere with radial normals. The six original
material groups and face-local UV regions retain the cat images, Rubik’s panels
and laughing animals; the orbit and flower border are unchanged.

Open `/?shape=sphere` to explicitly select the sphere or `/?shape=cube` for
the original cube silhouette. `?shape=faceted` and `?shape=butterfly` retain
the beveled and origami modes. Missing or unrecognized values select the sphere,
except in the math theme, which defaults to a cube. Explicit
`?theme=math&shape=sphere` keeps the diagram inside a spherical surface.
Shape selection takes effect on page load; there is no additional menu.
All modes use the same textures and accessories; **B** unfolds butterflies
and **S** restores the selected base shape.

Alternative-shape integrations should preserve the explicit `shape=sphere`
route and its six-region geometry in `src/shapeGeometry.ts`, rather than
replacing the sphere factory or bypassing the shared artwork setup.

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
