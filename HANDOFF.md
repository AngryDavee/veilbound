# Handoff: pick up here (2026-11-10)

Read this first, then `CLAUDE.md` for setup, the code map and the recipe rules.

## Where things stand

- All seven worlds are built: 23 regions and 69 journal traces. The story chain runs from the sanctuary through every world and back home. Commit `d6d51d6` on `main`.
- Every check passes:
  - `npm run check`
  - `npm run test:regions` (all 23 regions)
  - `npm run test:journey`
  - `npm run test:browser`
  - `npm run test:chain` (stands at every exit and confirms the next region loads, all the way home)
- **Still on hold until the user says go:** character design, combat and the protagonist. Each region already has an empty `arena` set aside for a future battle.
- Story outline: `references/campaign-design.md`. Notes and known limits for each world: `references/worlds/*.md`.

## How the user works

- **Act, don't instruct.** Never give the user steps or commands to run. Do the work, check it with screenshots and tests, then report the result in plain language.
- Use original content only. Demon Slayer, Infinity Castle and Hinokami Chronicles are visual references. Their names, maps and characters stay out of the game.
- Commit or push only when the user asks. Never put Atlas credentials or signed URLs in the repo.

## The conversation left off here: visual quality

The user asked why the game looks like "shapes here and there" when other Three.js games look realistic, and what could improve it while still following the 404 recipe.

### Why it looks like shapes

1. **The recipe's real limit.** Every object is an import-free code module built from boxes, cylinders and turned shapes. Nothing is sculpted, scanned or imported from glTF. That's why outlines look geometric and edges are razor-sharp. The realistic Three.js games the user has seen almost all load models made in Blender or from scans, with lighting baked in that tool.
2. **Our gap: too few textures.** There are 24 Atlas textures, made for the Valley. The new worlds mostly reuse those or use procedural noise. In the city, only 4 of 40 materials use a texture.
3. **Our gap, and the biggest one: lighting.** `game/main.js` builds its own renderer: one sun, one hemisphere light, flat exponential fog, and no post-processing. It never used the recipe's `game/rig.js`, which has cascaded shadows, aerial-perspective haze and threshold bloom. As a result:
   - Lanterns don't glow; they're just bright-coloured boxes.
   - Nothing darkens where surfaces meet (no ambient occlusion), so objects look pasted onto the ground.

### Proposed upgrades (none started)

All of these stay inside the recipe. Ranked by payoff for the effort:

1. **Post-processing.** Threshold bloom, `GTAOPass` ambient occlusion, a per-world `LUTPass` colour grade, and `SMAAPass`. All of these are already in `game/vendor/addons/postprocessing/`. Either take the ideas from `rig.js` or adopt it. It's an exterior rig, so the Keep and interiors need their own fill.
2. **Baked vertex AO, computed once when a region loads.** Code only, no files, no runtime cost. Fixes the pasted-on look.
3. **A shared bevel/irregularity helper.** Rounded edges, slightly uneven vertices, sagging roof lines, worn corners. Run it over built objects, the same way `surfaces.js` runs over them, so the asset modules stay import-free.
4. **Set-dressing density.** Instanced clutter: leaves, pebbles, puddles, posters, ropes, wires, snow drifts.
5. **Moving surfaces.** Wind on grass and foliage, real water (`Water`, `Reflector`, `SSRPass` are vendored), wet streets reflecting lamps, heat shimmer at the forge, light shafts in the Keep.
6. **New Atlas textures for each world** (brick, lacquer, tatami, snow, rusted iron). This needs the Atlas generation connection, which wasn't available in the last session.

### Decision waiting on the user

Realistic or painted anime? The reference games are not photoreal: painted backgrounds, cel-shaded characters, heavy glow. The recommendation was **painted realism**: real light, AO, clutter and motion, but with stylised colour grades per world, rim light, painted skies and generous bloom. That way characters will fit later.

Suggested order once the user agrees:
1. Items 1–3 across the whole game. They're shared code, so all 23 regions benefit.
2. Try them first on Lamplight Avenue (`city-avenue`) and the Folded Court (`folded`).
3. Then items 4–5 one world at a time.
4. Re-run all the tests and keep frame rate near 60. Heaviest regions now: `express-dawn` and `springs-basin` at about 2.1M triangles, `express-carriages` at 202 draws.

Separately, Reedwater Crossing is the weakest-looking region in the game and is due a rebuild.

## Inspecting a region

```
PORT=4190 node tools/serve.mjs
node tools/region-shot.mjs --port 4190 --region <id> --views
node tools/map-shot.mjs --port 4190 --out evidence/worlds/world-map.png
```

`region-shot.mjs` also reports draws, triangles, fps, portal walkability and clue placement. Window hooks for scripted checks: `__READY__`, `__START__`, `__GO__`, `__VIEW__`, `__PLACE__`, `__GAME__`, `__SCENE__.getRegion()`.
