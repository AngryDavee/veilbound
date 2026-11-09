# World II — The Ward of a Thousand Lamps

A Taisho-era capital at night after rain. Palette: red-brown brick, soot timber, wet blue-grey granite setts, amber gas light (#ffb868), vermilion temple lacquer (#b8321e), lantern red (#e8452a), against moonlit indigo (#050914 → #26304a). Distinct from the valley (green daylight) and the later snow/silk worlds.

| Region | Module | Landmark from spawn | Arena |
| --- | --- | --- | --- |
| Lamplight Avenue | `game/realms/city/avenue.js` | Brick arcades, tram rails, the Cloudpiercer on the skyline | Tram crossing, 22 × 20 m, lit by a hanging arc lamp |
| The Thunderbell Precinct | `game/realms/city/precinct.js` | Vermilion two-storey gate with a 3.9 m paper lantern | Raked-gravel incense court, 24 × 22 m |
| The Cloudpiercer | `game/realms/city/tower.js` | Lift house spire and red beacon; ridge of glowing threads to the north | Octagonal roof terrace, 24 × 24 m, 52 m above the city |

## Shared building kit (`citykit.js`, `temple.js`)

- Procedural canvas textures: brick (three variants), granite setts with a wet roughness map, signage and noren in Japanese with invented shop names, lantern paper, roof tiles, ema plaques, gravel.
- `glowField`: every halo in a region is one additive Points draw call, with distance fade. `streakField`: wet-ground reflections that always stretch toward the viewer (instanced, one draw call). `wireField`: telegraph and tram catenaries as a single LineSegments.
- Generators: Taisho brick commercial block (arched windows on front and sides, shopfronts, cornice, parapet, optional clock), timber machiya (koshi lattice, hisashi eave with rafters, slatted upper window, noren, kanban, paper lanterns), gas lamp, rickshaw, streetcar, octagonal observation tower, concave hip roofs with up-turned corners, bracket sets, pagoda, giant lantern, stone lantern.
- Static geometry is baked through `k.finish()` (bakeStatic). Measured at 34–64 draw calls and ≤ 0.2 M triangles per view, with ≤ 8 point lights per region and no shadow-casting point lights.

## Real-world vocabulary (reference only, nothing copied)

- Taisho brick-and-stone commercial streets with tram lines, gas lamps and telegraph poles.
- A temple approach lined with stalls, a gate housing a giant paper lantern, a five-storey pagoda, an incense burner, a bell tower (shōrō), ema racks, ginkgo trees in autumn, earthen walls with five white lines (sujibei).
- A twelve-storey octagonal brick observation tower with an electric lift, of the kind built in Tokyo before 1923. The terrace here is enlarged to make room for the arena.
- Names, layout, text and story are original. No franchise characters, logos or exact landmark replicas.

## Story hooks

The black-wrapped Thunderbell is the capital's anchor bell. The lamplighter's oil is stamped "Mistweave Ridge Cooperative". The northern view from the tower shows threads of light on a dark ridge, which leads into World III.

## Limitations

- Stylized real-time 3D. Buildings are façade-detailed boxes, not enterable interiors.
- Reflections are additive streaks, not screen-space reflections.
- The city below the tower is instanced boxes and glow points.
- The temple roofs use procedural tile texture rather than modelled tiles.
- There are no characters or crowds.
