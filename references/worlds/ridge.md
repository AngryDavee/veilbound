# World III — Mistweave Ridge

Full-moon night on a silk-farming ridge. Palette: cool blue-silver moonlight, pale-gold silk glow, warm amber shoji. This deliberately avoids the warm lamp-light of the capital and the red of the Keep.

| Region | Module | Landmark | Future battle ground |
| --- | --- | --- | --- |
| The Silkfarm Hamlet | `game/realms/ridge/hamlet.js` | Six steep (60°) thatched farmhouses, and the lit gable of the last farmhouse with threads streaming uphill | Threshing yard, 22 × 20 m, centred at the origin |
| The Threadbound Ravine | `game/realms/ridge/ravine.js` | 30 m cedar gorge, sagging rope bridge, 33 m western falls in a recessed headwall notch | Gorge shelf, 20 × 14 m at (0, −17) |
| The Cocoon Hollow | `game/realms/ridge/hollow.js` | Ancient camphor: 6.4 m bole, 8 buttress roots, 5 giant limbs, about 460 glowing cocoons | Root circle, 22 × 18 m at (0, 3) |

Shared pieces live in `game/realms/ridge/common.js`:

- Procedural thatch (map + bump, courses, eave moss), cut-thatch edge, board siding and shoji paper glow.
- `gasshoHouse()` — the farmhouse kit: thick double thatch slabs, layered eave skirt, ridge riders, gable A-frame rafters, three attic window levels, rain hoods, firewood stacks and tray racks.
- `threadField()` — merged additive tubes with travelling beads; halos fade near the camera.
- `moonWater()` — paddies, puddles, channels and the river. It reflects the night sky and the moon without a render pass.
- `mistLayers()`, `glowPoints()` (clamped point size), `waterfallSheet()`, `farRidges()`, `distantForest()`, `instanceProto()`, `grassField()` and `cocoons()`.

## Real-world vocabulary (not copied landmarks)

- **Gassho-zukuri farmhouses.** Their steep thatch and multi-storey attics were used for sericulture (silkworm rearing). This informs the hamlet's houses, tray racks, mulberry rows and loom.
- **Hillside rice terraces with dry-stone walls, and hasa drying racks.** These inform the eastern slope.
- **Suspension footbridges over cedar gorges, and silk-wrapped roadside hokora.** These inform the ravine.
- **Sacred trees ringed with shimenawa straw rope and shide paper.** These inform the camphor.

No Demon Slayer characters, logos, maps or spider imagery are used. The threads are silk, and the antagonist is the Weaver.

## Review pass (coordinator feedback)

- **Cocoons:** three shapes — elongated, plump, and torn open with a jagged lip and a glowing interior. They hang singly or in bunches tied to a shared knot. Silk-fibre map + bump, a warm inner glow with a fresnel falloff and a cool silver rim. Cocoons, threads and halos sway together in the shared wind time. Density is thinned near the stair.
- **Camphor:** twisted, burled 6.6 m bole. Eight long snaking buttress fins plus half-buried surface roots. Six heavy, low-spreading limbs carry epiphyte ferns and moss pads. The three-strand shimenawa (0.5 m strands) follows the bole, with deep shide and tassels. Ten moon shafts, a cool fill light on the bole, and drifting motes.
- **Ravine:** tilted strata with ledge lips, banded vertex colour, moss and ferns on the ledges, and a silver moonlit rim. Two denser mist sheets plus soft mist glow on the gorge floor. The bridge rebuild has twisted three-strand handrails at deck height + 1.05 m (they no longer cross the eye line), slatted lashed planks on stringers, vertical ties and a diagonal net.
- **Sky blotches:** these were near-black foliage silhouettes. Cedar foliage and the distant forest now carry a faint emissive, so they read as dark green against the sky.

## Navigation

All clue, spawn, exit, return and arena points pass `tools/region-shot.mjs`: they are walkable, their heights are correct, and real W-key movement works.

The bridge is walkable along a 1.24 m deck that follows the rope sag. The ravine's north trail rises 2 m. The hollow's buttress roots are collision fins, and the route to the exit passes through the east root gap. The hamlet's bamboo fences, mill wheel, racks, loom and lanterns all block movement.

## Limits

- Water uses shaders, not simulation.
- Cliff faces are displaced ribbons with vertex-colour moss, not sculpted meshes.
- Cocoons are instanced ovoids with a procedural silk texture.
- Region scenes are night-only, and `setEvening` is a no-op.
- No Atlas generation was used. All textures come from the existing local library or are canvas-procedural.
