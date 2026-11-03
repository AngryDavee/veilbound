# Veilbound — The Valley of Silent Bells

Four explorable regions for an original anime-inspired sword adventure: a mountain training sanctuary, dense forest thicket, rainy canal town and shifting architectural observatory. Story traces and connected travel routes are implemented; characters and combat come later.

## Run

Use Node.js 22.12+ (Node 24 LTS recommended). No API keys or Atlas connection are needed to run the checked-in game. See [CLAUDE.md](CLAUDE.md) for the development handoff.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4186. The portable `game/` folder also works on a static HTTP server. Three.js is included locally; optional Google Fonts fall back to system fonts if unavailable. Do not open index.html with file:// because ES modules require HTTP.

## Controls

- Enter the sanctuary: start exploring.
- WASD / arrow keys: walk. Shift: run.
- Drag the view: look. Double-click the scene optionally locks the mouse; Escape releases it.
- E or the contextual button: inspect a nearby clue or travel at a marked exit.
- M: world map. V: viewpoints within the region. P: photo view. J: journal.
- Header controls: world map, sanctuary morning/evening, optional ambient sound, journal.
- Touch: left joystick moves; drag the scene to look. Discoveries have a touch button.

Twelve story traces span the four regions. The original sanctuary clues remain a letter inside the hall, a ribbon in the western garden, and the upper bell. Journal discoveries persist in browser localStorage. There is no combat or rigged protagonist in this environment-first milestone.

## Build provenance

Based on [404-Repo/404-game-recipe](https://github.com/404-Repo/404-game-recipe), pinned source commit `4effad311c5e137bca316257259fe5bffd6737de`. Uses Path B code geometry. The stock `assetlib.js`, `surfaces.js`, and `rig.js` are copied unchanged into `game/`. `assetlib.js` loads and batches scenery. Current scene lighting is custom; copied `rig.js` is retained for later experiments.

Recipe helper hashes are recorded in `tools/recipe-provenance.json`; checks work without a sibling checkout.

All six major asset types have three construction candidates under `candidates/`, with five-view verification sheets and reports. `tools/build-candidates.mjs` is the reproducible source for these constructions. Chosen production modules are in `game/assets/`. Distant foliage reduces construction complexity rather than decimating geometry.

Atlas generated two concept/reference images, four PBR material sets, and a transparent pine-needle texture. `references/atlas-manifest.json` and `references/atlas-foliage-manifest.json` record file provenance without expiring download URLs. The two completed Atlas operations used 57 and 33 credits respectively (90 total). All actual game textures live in `game/textures/`. The user's explicit texture request extends the recipe's image-free default; asset modules still contain no network requests or imports. No external 3D meshes are used.

## Validation

```sh
npm run check
# With the preview server running:
npm run test:browser
```

Browser checks drive actual keyboard, pointer, and touch input; save screenshots and telemetry to `evidence/`. The route checks all three discoveries, a continuous walk from the courtyard up the eastern stairs to the bell, time toggle, photo view, journal persistence, relative URLs under `/veilbound/`, and touch movement. FPS is measured using real elapsed time and reported for the test machine only. Mobile tests emulate a touch viewport on the development machine; they are not measurements on physical phone hardware.

## Next stage

Continue environment art refinement across all four regions. Then author the protagonist, skeleton, animation blending, sword attachment, and training combat. The existing metre scale, hall clearance, ground-height function, and static collision rules are the initial character-controller contract. The current collision system is purpose-built for the authored region routes; it is not a general rigid-body engine.

## Environment detail pass

The second environment pass adds approximately 41,700 curved grass blades on desktop (about 20,800 in touch-width viewports), a shared GPU wind field for grass/ferns/pine canopies, an Atlas full-tree cutout for distant forests, and a reflective stream with five waterfall layers, animated foam, ballistic droplets and soft impact mist. The waterfall and pool sit to the east of the walkable stair route. Water ambience grows louder as the listener approaches it.

The dojo now contains individually edged tatami mats, overhead timber framing, six ribbed paper lanterns, practice-sword racks, straw targets, folded cloth, meditation cushions, sandals, a writing desk with brush and inkstone, an offering alcove, and an Atlas ink-pine scroll. Furniture has contact shading and the principal obstacles have collision checks. Interior ambient light transitions down as you enter, retaining the lanterns' warm light.

Garden and route details include ferns, moss, reed beds, river stones, a tea bench, a bamboo basin, raked sand, a training circle, physical trail signs, fence rails, continuous stair handrails, and bell-pavilion offerings. The destination controls expose six viewpoints, including a dedicated interior view. `V` opens the complete list; desktop shortcut buttons go directly to the interior, waterfall and garden.

Additional Atlas operations used **86 credits**: 48 for surfaces/art, 21 for the final forest cutout, and 17 for two earlier Atlas agent attempts that could not reserve the generation budget and produced no assets. Total project generation/accounting to date: **176 credits**. The generated tatami and plaster roughness maps were too glossy on local inspection, so those materials use diffuse roughness values while retaining the generated color and normal maps. Full-tree pale fringes are rejected in the render shader. Generation provenance is recorded in `references/atlas-detail-manifest.json` and `references/atlas-forest-manifest.json`.

Static architecture shadows are cached and rebuilt when lighting changes. Water reflections refresh when the camera moves and at a reduced rate while stationary. This pass uses actual geometry and shaders; screenshots in `evidence/` show the running scene. It remains a stylized real-time environment, without fluid simulation, physical tree branches, or a playable sword character.

Additional visual/animation checks:

```sh
node tools/detail-review.mjs
node tools/animation-test.mjs
```

## Four-region expansion

The sanctuary is now Chapter I of a four-region journey:

1. Cloudveil Sanctuary — the missing guardian's training grounds.
2. Whispering Thicket — dense bush, bamboo, moss, ancient trees and a hidden clearing.
3. Reedwater Crossing — a rainy canal town with bridges, boats, workshops and a ferry-yard arena.
4. The Folded Court — an original shifting architectural observatory with suspended galleries and a stable route to its heart.

Use **World map** or **M** to travel; **V** shows viewpoints within the current region. You can also walk to a marked region exit and press **E**. All regions are available for environment review. Each has three story traces and room reserved for future battles; characters and combat are not implemented yet.

Region builders live in `game/realms/`. The sanctuary's tree roots and cliff were rebuilt in this pass. New development uses the existing Atlas asset library; no new Atlas generations were available in this session. See `references/four-regions-design.md` for design sources, original creative direction and the element audit.

```sh
# With npm start running:
node tools/realms-review.mjs
node tools/journey-test.mjs
```

These checks exercise region loading, walking, map travel, physical chapter exits, clue access, the canal bridge, castle stairs, journal persistence and touch navigation. Evidence is saved under `evidence/realms/`.
