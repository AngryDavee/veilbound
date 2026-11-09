# World V — The Floating Quarter

A walled night pleasure quarter on a river. It is built from the architecture and atmosphere of Edo- and Taisho-era licensed quarters: a moat, a single great gate, a looking-back willow, a central avenue planted with cherry trees, lattice-fronted teahouses and a fire-watch tower. There are no characters, crests, maps or landmarks from any franchise. Names, signage and layout are original. The signboards use generic Japanese words (月見, 夜桜, 柳屋 and similar) painted onto a canvas atlas.

| Region | Module | Landmark from spawn | Arena (kept clear) |
| --- | --- | --- | --- |
| The Willow Gate | `game/realms/quarter/gate.js` | Great timber gate with a 浮世門 plaque in a long plaster wall; the fire tower above the roofs | Gate plaza, x ±11, z −29…−11 |
| The Avenue of Blossoms | `game/realms/quarter/avenue.js` | A fenced cherry row, lantern strings, and a red fire glow at the far gate | Blossom crossing, x ±9, z ±12 |
| The Burning Rooftops | `game/realms/quarter/rooftops.js` | Scorched fire-watch tower with a paper bell, over a sea of burning roofs | Ridge-tile plaza, x ±12, z ±11 |

## Palette
- Lacquer red: #c0402e. Lattice: #9a2a1e.
- Black timber: #2c2522. Cream paper glow: #ffa75a. Kawara tile: #3a3e46.
- Sky: magenta-violet, from #0a0616 at the top to #3c2444 at the horizon.
- The rooftops region switches to an orange-red smoke sky with #ff6a20 firelight.

## Construction (`qkit.js`)
- A collector turns every box into one `InstancedMesh` per material, and every other shape into one merged mesh per material. Each region stays at 40–160 draw calls even with dozens of teahouses.
- Teahouses: red koshi lattice over glowing paper, entrance noren, and a hisashi pent roof with visible rafters. Upper floors have a balcony with a lacquer railing and shoji, a gabled roof with a canvas-painted kawara tile and bump texture, onigawara ridge ends, plaster gables, and vertical and horizontal signboards.
- Chochin lanterns are lathe meshes with painted ribs. Every lamp also gets a GPU halo through `glowPoints`, which draws all halos in a single call.
- Fire and smoke are Y-locked billboard shaders with fbm noise. Falling petals and rising embers are GPU motes that wrap around the camera. A second set of petals stays frozen around the great cherry, which is the clue.
- The willow has about 460 animated strands with alpha-tested leaf strips, and about 180 paper fortunes tied into the same swaying geometry.
- The moat uses three's `Water` reflector, so lantern reflections are real. It has stone-block ishigaki walls and an arched lacquer bridge with bronze giboshi finials.

## Limitations
- Teahouse interiors are emissive planes, not furnished rooms. Cherry canopies are crossed alpha cards.
- Fire is shader animation only. Nothing spreads, and nothing burns away.
- The flat rooftop plaza is a designed battle space: a tiled terrace over a large merchant building, not a sloped roof.
- Japanese signboard glyphs depend on a CJK system font. Without one, they fall back to the browser default.
