# Veilbound development handoff

## What the user is building

An original anime-inspired sword adventure, visually informed by Demon Slayer, The Hinokami Chronicles, and Infinity Castle. The priority is rich, explorable Three.js environments. Character creation, rigging, sword animation and combat come after the environments. Do not substitute a static generated image for the playable world.

The first environment is Cloudveil Sanctuary: a Japanese mountain training courtyard, timber dojo, returning garden, waterfall and stream, eastern stair route, and upper bell pavilion. Its environmental story concerns a missing sibling/guardian and three clues. The user found the initial build too plain and requested greater realism across everything, particularly water, grass, wind in trees and the temple interior. Continue improving visual quality; the current build is a stylized prototype, not a finished photorealistic game.

## Run from a fresh clone

Use Node 24 (`nvm use` if available).

```sh
npm ci
npm run check
npm start
```

Open http://127.0.0.1:4186. No secrets, API keys, Atlas login, external asset downloads or sibling repositories are required to play. The `game/` directory is a standalone static HTTP app. Do not open `index.html` via `file://`. Google Fonts are optional and have local system-font fallbacks.

With the server running in a separate terminal:

```sh
npm run test:browser
node tools/detail-review.mjs
node tools/animation-test.mjs
```

Puppeteer installs a browser during normal dependency installation. If browser downloading was disabled, run `npx puppeteer browsers install chrome`. Linux runners may also need Chromium system libraries and working WebGL. The tests use port 4186; although the dev server supports `PORT`, the test URLs currently use that default port.

## Code map

- `game/main.js`: renderer, sky, lighting, input, first-person movement, journal, discovery interactions, audio, scenic camera transitions, telemetry.
- `game/environment.js`: core layout, mountains, scenery placements, clues, viewpoints, `canWalk` collision rules and `walkHeight` elevation.
- `game/detail-world.js`: furnished interior, terrain/river details, dense animated grass, ferns, forest billboards, waterfall layers, mist, droplets, foam, reflected water and shared wind shaders.
- `game/assets/`: import-free code geometry constructors. No downloaded 3D meshes.
- `game/textures/`: all actual generated textures and cutouts, checked in locally.
- `game/index.html`, `game/style.css`: menu, HUD, six destinations, touch joystick, journal and dialogs.
- `game/vendor/`: vendored Three.js 0.169.0 and its addons. The import map uses this copy. Updating npm's Three dependency alone does not update the running app.
- `tools/`: server, checks, candidate builder and real browser tests.
- `references/`: concepts, source references, Atlas provenance, visual decisions.
- `candidates/`: three construction candidates for each of six main asset types, plus original verifier sheets/reports.
- `evidence/`: actual screenshots, test reports and an earlier source snapshot. Older screenshots are historical evidence, not the current final appearance.

## Existing implementation and constraints

- Metres, +Y up, character eye height 1.68 m. Main dojo floor is raised 0.86 m; the bell pavilion platform is at 10.7 m.
- Controls: WASD/arrows, Shift run, drag look, E inspect, V destinations, P photo, J journal. Touch joystick and contextual buttons are implemented.
- Journal state persists in `localStorage` under `veilbound-cloudveil-notes`.
- Three clues and the entire stair route are reachable. Preserve these as geometry changes. Collision and ground height are explicitly authored, not inferred from render meshes.
- Static shadows are cached; lighting changes request a shadow update. Water reflection updates are throttled when the camera is stationary.
- Vegetation uses GPU vertex deformation. Distant trees use Atlas alpha cutouts on crossed planes. Water uses shaders and particles, not physical fluid simulation.
- Desktop has about 41,700 grass blades; narrow touch layouts have about 20,800. Profile actual frames before increasing density. Previous local scene samples ranged roughly 36–60 fps; this is not a hardware guarantee.
- The larger interior furniture has collision, but the scene is not backed by a general physics engine.
- `window.__READY__`, `window.__GAME__` and `window.__SCENE__` expose readiness/telemetry/scene inspection. Browser tests drive real controls to verify gameplay routes.

## 404 recipe and Atlas

The user explicitly requested the 404 game recipe and Atlas MCP image/texture generation. Upstream is https://github.com/404-Repo/404-game-recipe at commit `4effad311c5e137bca316257259fe5bffd6737de`. `assetlib.js`, `surfaces.js` and `rig.js` remain unchanged; their hashes are pinned in `tools/recipe-provenance.json`. `npm run check` verifies those hashes without a local upstream checkout. Respect `STYLE_LOCK.md` and the stock batching/asset-loading helpers.

For further upstream geometry verification, clone that pinned recipe separately and follow its harness documentation. Existing verifier reports are included here. Review `tools/build-candidates.mjs` before running it: it rewrites the candidate files. Production asset selection is a separate step, and the current scene includes later refinements.

Atlas project ID: `99be6c26-c788-4658-b1bd-46e66650ef55`. Project files are already in this repo. Future generation requires an authenticated Atlas connection; never put credentials or temporary signed download URLs in Git. Provenance and completed credit accounting are in the Atlas manifests and README. Some generated roughness maps produced overly glossy straw/plaster and were intentionally overridden in the material code.

## How to continue

Start the app and inspect every destination, including the dedicated temple interior and waterfall. Read `references/asset-decisions.md` before changing established choices. Make improvements in the real scene, inspect rendered screenshots and motion, and keep the routes usable. Preserve source/reference attribution and licenses. The user has not asked for deployment, public hosting or character/combat implementation yet.


## Latest expansion: four regions

The sanctuary and all its viewpoints are ONE location. The user explicitly requested three additional story-linked environments, battle grounds, and a more realistic element pass. A follow-up specified that the second location should be bush/forest. The implemented order is Sanctuary → Whispering Thicket → Reedwater Crossing → The Folded Court.

Read `game/realms/story.js` for chapter metadata, arena sizes and nine additional clues; `forest.js`, `village.js` and `castle.js` build separate regions using `kit.js`. `main.js` lazy-loads and caches region roots, hides inactive ones, updates atmosphere, and switches collision/height functions with the active world. Never retain sanctuary collision rules in a new region. `M` opens the world map, `V` opens local viewpoints, and contextual exits support walking through the story. Twelve journal traces share the existing persistence key. Existing three-clue saves remain valid.

Roots in both pine assets are now continuous ridged meshes, with a lower-resolution distant variant. The sanctuary cliff is now one eroded mesh. The thicket includes extensive ground cover and bamboo. The castle's moving architecture is decorative; its platforms, bridges and stair route stay fixed. No character/combat work has been started.

Run `node tools/realms-review.mjs` and `node tools/journey-test.mjs` with the server running, in addition to `npm run check`. Read `references/four-regions-design.md` for the art audit and reference sources. No new Atlas generation occurred during this expansion because the image-generation connection was unavailable; all existing textures remain local and usable.


## Campaign expansion: seven worlds (2026-11-09)

The user clarified that the four regions above are ONE world, the Valley of Silent Bells. Every remaining world has to be built to complete the story and the game environments **before** character design or combat. Read `references/campaign-design.md` for the story spine, world table and research sources.

- Worlds: I Valley (4 regions) · II Ward of a Thousand Lamps (`realms/city/`) · III Mistweave Ridge (`realms/ridge/`) · IV Midnight Express (`realms/express/`) · V Floating Quarter (`realms/quarter/`) · VI Ember Springs (`realms/springs/`) · VII Endless Keep (`realms/keep/`, 4 regions). 23 regions and 69 journal traces in total.
- `realms/campaign.js` is the registry. It chains exits through every region; the last one leads home to the sanctuary. Each world's `story.js` owns its text, spawn/exit/return points, arenas and `theme` lighting.
- Region module contract: `export async function create(root,renderer,progress,{camera,scene})` returns `{discoveries, views, canWalk, walkHeight, update(t,dt,camera), setEvening, texturesLoaded, grassBlades, trunks?, dispose?, locationAt?}`. Valley modules keep their legacy `createForest`/`createVillage`/`createCastle` names through the `factory` field.
- Shared night sky and precipitation live in `realms/atmosphere.js`. `main.js` keeps at most 4 non-sanctuary regions resident and disposes the rest.
- Inspect any region: `PORT=4190 node tools/serve.mjs`, then `node tools/region-shot.mjs --port 4190 --region <id> --views`. `tools/map-shot.mjs` captures the map. `npm run test:regions` walks all 23 regions; `test:journey` now expects the Folded Court exit to lead into World II.
- Per-world design notes are in `references/worlds/`, and screenshots are in `evidence/worlds/`.
