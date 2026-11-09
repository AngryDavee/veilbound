# World VI — Ember Springs

A snowbound Taisho-era hot-spring village of swordsmiths at night. Palette: snow white and slate blue under a cool moon, against amber shoji windows, gas-lamp gold and ember-orange forge light. Every roof, ledge, rail and lamp cap carries snow; steam is the main atmospheric layer (fog is kept light so the mountains read).

## Regions

| Region | Module | Landmark from spawn | Battle ground |
| --- | --- | --- | --- |
| The Gaslamp Bridges | `game/realms/springs/bridges.js` | Five-storey Great Inn at the head of the river street; its ground floor is the gateway north | Inn square, 20 × 18 m |
| The Forge Terraces | `game/realms/springs/forge.js` | Stepped terraces and the master's forge, chimney smoke; tatara shed and waterwheel open up as you leave the lane | Casting floor, 22 × 20 m |
| The Steam Basin | `game/realms/springs/basin.js` | Rope-hung gate framing the half-submerged bronze bell and the waterfall | Steam shelf, 26 × 22 m |

- **Bridges:** a stone-walled hot river with drain spouts, capstones and railings; 13 multi-storey inns with balconies, pent roofs with icicles, lit lattice fronts, noren and signboards; three walkable arched footbridges; lantern strings across the river; 17 gas lamps; a plaza with a roofed foot bath, stone lanterns and a signed gate; the culvert where the river emerges under the square; the Great Inn with a lookout and curved entrance canopy, plus a lane and stair toward the forges.
- **Forge:** open-fronted smithies (hearth, hood, bellows, anvil, quench trough, rusting sword racks, charcoal sacks); a tall earth-floored tatara hall around a long, low clay box furnace (~3.3 m × 1.5 m × 1.25 m) burning along its open top, with ten glowing tuyere holes and bamboo pipes per long side, box bellows with treadle boards on both sides driven by a line shaft from the waterwheel, slag runoff into pits, and charcoal and iron-sand heaps; an overshot waterwheel turning on a trestle flume, with a tailrace; casting pits with a chain-hoist gantry and the split bell mould; two stone terraces with retaining walls and railed stairs.
- **Basin:** a stepping-stone cedar path, stone lanterns, a bathers' shelter, a flagstone shelf, a jetty with steps into the pool, and a black-boulder rim capped with snow. The last bell is a bonshō: a near-cylindrical aged-bronze body with green-brown patina and verdigris streaks, horizontal and vertical bands, boss-stud grids in the four upper panels, two lotus striking seats and an abstracted dragon-head loop. It hangs in a heavy four-post timber frame with knee braces and a snow roof, with a log striker hung on ropes. Its only warm glow is at the waterline. Two waterfall sheets, dense spring steam, and a lamplit shoji door glowing through the water by the east-ledge exit.

## Real-world vocabulary (reference, not copied)

- Ginzan-Onsen-type river streets: Taisho-to-early-Showa wooden ryokan lining both banks, gas lamps and many footbridges (see the Ginzan Onsen sources in the campaign research).
- Japanese tatara iron smelting (clay furnace, bellows, iron sand and charcoal); overshot waterwheels; bell casting in clay moulds; rotenburo (rock-ringed open-air baths).
- No Demon Slayer characters, names, logos, music or exact maps. The village, its names, signage and layout are original. Signboards use generic words (湯, 宿, 鍛冶, 酒, 炭, 刀, 茶屋, 燈) and an invented name, ほむら湯温泉.

## Implementation notes

- `springs/common.js` holds the world kit: snow-laden roofs and pents (rafter ends, snow lips, icicles); the inn builder (with a through-passage option); the smithy builder; gas and stone lanterns; layered drooping firs (pine-foliage cutout bough cards with snow clumps along each bough, three irregular instanced prototypes, crossed-card silhouettes for distant trees); boulders whose snow caps are derived from their own top surface; smooth snow drifts along walls and kerbs; trodden slush decals; slope-coloured terrain and a mountain ring; and shaders for hot water (ripples, fresnel, moon glint, under-water glow spots), falling water, steam and lamp glows (fog-aware, one draw call each).
- Static geometry is baked with `k.finish()`. Measured from the region screenshots: about 40–60 draw calls and up to 1.7–2.1 M triangles (mostly fir boughs), and 6–8 point lights per region, none of them shadowed. Headless capture reported 60 fps; that is not a hardware guarantee.
- Collision and height are authored explicitly: the footbridge arches and both terrace stairs use `walkHeight` ramps. All three regions passed `tools/region-shot.mjs`: clues and portals reachable, real key movement, no console errors and no missing files.

## Limitations

- Water, steam and snowfall are shader and particle effects, not simulations. Interiors are not enterable (the Great Inn passage and the tatara shed are the walkable exceptions).
- Under-water refraction is faked with transparency plus a glow spot.
- No new Atlas generation: the connection was unavailable, so the build reuses the existing Atlas textures and canvas textures generated at load time.
