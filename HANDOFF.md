# Handoff: pick up here (2026-11-12, combat v2)

Read this first, then `CLAUDE.md` for setup, the code map and the recipe rules.

## Latest session (2026-11-12): action combat v2, built against the Hinokami Chronicles trailer

The user watched the first spar and said: the scabbards pass through the bodies, the camera is static behind the character, the sparring is "very mid", swords fly everywhere; they want an action fighting-game trailer feel (the Steam trailer at `~/Downloads/Demon Slayer -Kimetsu no Yaiba- The Hinokami Chronicles on Steam.mp4`, studied frame by frame: gameplay 22–50 s), extreme detail in the sword combat, defence and fighting beyond swords, and "flying screen animations". All of that is now in. Original content only (names, kanji, arts are ours).

| File | What it owns |
|---|---|
| `game/fighter-moves.js` | Every move. Sword cuts are **arcs** (`cutClip`): the blade sweeps in one plane from a wind-up direction `u` to an impact direction `i` and on through `follow` degrees; the edge always leads; hands extend at impact; hips, chest, feet and face run on the same clock (wind-up → accelerating strike → follow-through → recovery). Haru: kesa, kiriage, yoko, tsuki thrust, leaping karatake, launcher, air cut. Mitsuki: one-handed crescent, backhand, full spin, open-palm strike, flipping cleave, launcher, air cut. Plus front kick, spinning back kick / shoulder charge, sweep, throw + thrown, guard (mid/high, Mitsuki braces the back of her blade), parry, deflected, recoil, blade lock, guard break, side-steps, back-step, dash, roll, back-flip, jump/land, hit high/mid, stagger, knockdown, launched tumble, crash, KO, iaido draw, chiburi win, bow, and two special arts built from the cuts (`seqClip`). Body transform supports spins, flips and rolls about the waist. Calls `userData.updateGear(dt)` each frame. |
| `game/combat.js` | Fight rules. Hits are **contact**: the blade's swept segment (last frame → this frame) against two body capsules; feet/hands/shoulder spheres for kicks, palm and charge. Blades meeting in flight **clash**; two clashes in quick succession (or 22%) start a **blade lock** (mash F). Guard chips a guard meter; a guard pressed in the last 0.2 s is a **parry** (attacker deflected, slow-mo). Kicks/palm/charge **break guards**; throws ignore them. Launchers send the opponent airborne for a jump + air cut; air cuts spike down. Combo scaling, 5th consecutive hit always knocks down. AI reads attacks (parry/guard/side-step/meet the cut), punishes openings, mixes sword chains, kicks, throws, dashes, juggles and arts. Rounds: VS splash + iaido draw intro → fight → KO slow-mo → next round. `window.__DUEL__.force(who, what)` triggers `art`, `lock`, `clash`, `parry`, `grab`, `c1`, `kick`, `launcher`… for tests. |
| `game/duel-camera.js` | The camera director (built by a sub-agent). Side-on 3/4 two-shot by default (critically damped springs, side hysteresis, swings when blocked), plus cue shots: intro, hit punch, clash, lock close-up, parry orbit, launch low angle, down pull-back, dash tracking, kick-into-lens, 3-shot art sequence, KO orbit. In duels main.js hands the view camera to it and WASD moves relative to it. |
| `game/anime-fx.js` | Effects (built by a sub-agent): streak sparks, hit bursts with ink shards, clash X-flash fountains, dust, debris, shockwave domes, painted water/ember crescents for arts, afterimages; screen overlays: speed lines, 2–4 frame ink/invert impact frames, flashes, letterbox, live-portrait cut-ins with brush kanji, VS splash, callouts, hit counter. Layer 30 is reserved for portraits. `fx.update` runs after `renderer.render`. |
| `game/assets/fighter.js` | Scabbard rebuilt (sub-agent): curved lacquered saya through the obi, spring-driven around 69 skinned body proxies so it never intersects (≥1.5 cm clearance in every stress pose). `userData.sayaPoint('koiguchi'|'hilt'|'kojiri')`. |

Controls in a duel: F sword chain · G kick chain · E throw · Q guard (tap just before a hit = parry) · Space dash (direction from WASD: in = dash, away = back-step / back-flip while guarding, sideways = side-step) · C jump (F in the air = air cut) · S+F launcher · R special art when the gauge glows · K let both fighters fight on AI.

Tools: `node tools/duel-shot.mjs --region <id> --secs 14 --every .25 --out <dir> [--player 0] [--script "3:f,5.6:hero:art,7:x:lock"]` plays a real duel and saves frames + a state log; `node tools/clip-strip.mjs --who haru --clips c1,c5 --cams side` makes filmstrips of any move from the lab (`game/lab/index.html?clip=…&t=…`); labs: `lab/duel-cam.html`, `lab/fx.html`, `lab/gear.html`; `node tools/demo.mjs` runs a visible demo tour (five worlds, a duel in each).

Ideas not yet done: per-world opponents (the five Heralds) with their own move sets, sound, touch-tested pads, a proper hit-react variety per direction, real stroke-order kanji, sword sparks lighting the scene.

## Latest session (2026-11-12): painted-anime pass tried and REJECTED

The user tried a painted/cel-shaded look (ink outlines, Kuwahara paint filter, rim light, bloom, per-world grade, hand-painted Atlas materials) and said: "I don't like this cell shading or painting shading thing. Revert to the previous build."

- The game code was reverted to commit `5d0da92`. Do **not** reintroduce ink outlines, paint/Kuwahara filters or cel shading.
- The six paid Atlas painted material sets (55 credits) are archived, not loaded, in `references/painted-pilot/` with their provenance in `manifest.json`.
- Character work is now unblocked: the user asked for **two code-built characters (404 recipe, no imported models), "pushed to the limits", fluid anime humans, not boxy, not built like a skeleton, who spar in different locations**. Reference for the fights: the Hinokami Chronicles Steam trailer (camera, effects, anime characters). The user chose: code-built (not Atlas 3D), third-person camera.

## Latest session (2026-11-12): the fighters

**Haru** (player, Apprentice Warden, teal haori, two-handed style) and **Mitsuki** (Bell Warden, crimson haori, silver ponytail, one-handed style). Both original.

- `game/assets/fighter.js` (Path B, import-free): each body is ONE signed-distance-field sculpt (rounded cones/ellipsoids smooth-blended, carved hems/cuffs, pleats), polygonized with surface nets into one continuous skinned mesh. Skin weights come from how much each sculpted form contributes to a vertex. Colour borders (haori hem zigzag, open front V, lapels, belt) are cut exactly into the mesh, so they stay crisp. Separate finer grids for head and hands (seams hidden under collar/cuffs). Hair = tapered flattened locks hugging the skull from a crown whorl; Mitsuki's ponytail, the sleeve bags and the coat tail are spring bones. Face = canvas-painted anime eyes/brows/mouth, redrawn for blinks and expressions. Two-tone toon shading + rim light + inverted-hull ink outline **on the characters only** (the world keeps its normal look; the user rejected cel/paint post on the world). ~110k triangles and ~1 s build per fighter.
- `game/fighter-moves.js`: poses in fighter root space, two-bone IK for arms and legs, **sword-led attacks** (grip position + blade direction + edge are keyed; the arms solve to follow), procedural walk/run/battle-run, combo slash1→slash2→slash3→finisher, guard, dash, hit, knockdown, win, bow.
- `game/combat.js`: spar logic, AI, hit detection (reach + arc), guard/dash, hit-stop, camera shake, slash trails, sparks, impact star, shock ring, blob shadows, duel HUD.
- `game/main.js`: third-person `viewCam` follows Haru (the logical `camera` is still the player eye, so every existing test and route works unchanged). In any region's battle ground press **E** to spar. Controls: F/click strike (chain), Q/right-click guard, Space dash, R art when the gauge glows, K let both fight on their own. Leaving the battle ground ends the spar. `window.__DUEL__` = start/stop/auto/state.
- Lab: `game/lab/index.html?cam=front|side|back|face|face2|three&clip=slash1&t=.22` and `node tools/fighter-shot.mjs` for stills; `node tools/duel-test.mjs --regions sanctuary,city-avenue` plays a real spar and saves frames to `evidence/duel/`.

Ideas not yet done: per-world opponents (Heralds), more moves per character, touch-tested pads, building fighters in a worker to shave load time.

## Previous state (2026-11-10)


### Where things stand

- All seven worlds are built: 23 regions and 69 journal traces. The story chain runs from the sanctuary through every world and back home. Commit `d6d51d6` on `main`.
- Every check passes:
  - `npm run check`
  - `npm run test:regions` (all 23 regions)
  - `npm run test:journey`
  - `npm run test:browser`
  - `npm run test:chain` (stands at every exit and confirms the next region loads, all the way home)
- **Still on hold until the user says go:** character design, combat and the protagonist. Each region already has an empty `arena` set aside for a future battle.
- Story outline: `references/campaign-design.md`. Notes and known limits for each world: `references/worlds/*.md`.

### How the user works

- **Act, don't instruct.** Never give the user steps or commands to run. Do the work, check it with screenshots and tests, then report the result in plain language.
- Use original content only. Demon Slayer, Infinity Castle and Hinokami Chronicles are visual references. Their names, maps and characters stay out of the game.
- Commit or push only when the user asks. Never put Atlas credentials or signed URLs in the repo.

### The conversation left off here: visual quality

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

### Inspecting a region

```
PORT=4190 node tools/serve.mjs
node tools/region-shot.mjs --port 4190 --region <id> --views
node tools/map-shot.mjs --port 4190 --out evidence/worlds/world-map.png
```

`region-shot.mjs` also reports draws, triangles, fps, portal walkability and clue placement. Window hooks for scripted checks: `__READY__`, `__START__`, `__GO__`, `__VIEW__`, `__PLACE__`, `__GAME__`, `__SCENE__.getRegion()`.
