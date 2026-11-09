# World IV — The Midnight Express

Herald: the Stationmaster. Every clock on the line is held at 11:59. The anchor bell rides on the locomotive itself.

| Region | Module | Landmark | Battle ground |
| --- | --- | --- | --- |
| Hollowmoor Station | `game/realms/express/station.js` | Brick clock tower with copper roof (11:59), terminus platform, waiting engine with bronze bell | Forecourt, 24 × 16 m |
| The Sleeping Carriages | `game/realms/express/carriages.js` | Four connected cars: third class, dining, sleeper, baggage car with open doors | Baggage car, 2.6 × 14 m (cramped by design) |
| The Dawn Plain | `game/realms/express/dawn.js` | Halted express on an embankment in a sea of susuki, low sun, branch line toward the Quarter | Grass clearing, 26 × 24 m |

Shared kit: `rolling.js` contains the tender locomotive, the tender, clerestory carriages, ballasted track, GPU steam plumes (one Points draw per emitter), additive lamp halos, gas lamps, telegraph poles and canvas textures (brick, clock face, signage).

## Reference vocabulary (real-world types, not copied landmarks)
- Taisho-era Western-style brick stations: red brick with white stone bands, arched windows, a central clock tower, slate hipped roofs and a porte-cochère on cast-iron columns.
- Early 20th-century Japanese tender engines (no smoke deflectors): boiler bands, steam and sand domes, three coupled drivers, cab with an arched roof. The bell is a story device.
- Wooden clerestory carriages with open end platforms. Pullman-style open-section sleepers with curtained berths. Dining cars with linen tables and shaded lamps.
- Susuki (Japanese silver grass) plains at dawn, telegraph lines, a platelayers' hut and wayside Jizo statues.

## Technique notes
- Carriages: the train interior is static and baked into one body that rolls slightly at rail joints. The countryside is one 240 m tile, cloned four times and wrapped in `update()` at 17 m/s. Moonlight enters through the left-hand windows: glass never casts shadows, and the static shadow map is accurate because the interior does not move.
- Dawn grass in three layers. Near: full clumps instanced with the shared `windMaterial`. Mid: lite clumps. Far: about 14,000 painted alpha cards out to the hills, so no bare soil reads. Plumes use a separate material with an emissive silver-pink glow. The arena and path carry only low tufts.
- Dawn sky: a custom gradient dome (gold horizon around a low sun, blue-violet overhead, stratus streaks) replaces the shared daylight Sky; theme `sky:'none'`. Mist bands are distance-faded shader planes. Ridges are pre-hazed violet silhouettes with fog off.
- Station forecourt: canvas granite-sett paving and one low-resolution Reflector masked to puddles and damp patches, so the lamps and facades reflect. Buildings beside it are distinct Taisho types: a brick parcels warehouse, the timber KIRIYA inn and signboard-architecture (kanban-kenchiku) shops. The shared kit houses are no longer used.
- Station: a terminus layout. The tracks end at buffer stops behind the hall, so the train never intersects the building.

## Limitations
- Stylized geometry. The steam is a particle shader, not a simulation.
- The carriages' outside world is a repeating tile; at 240 m spacing the repeat is hard to notice but not unique.
- Train roofs are not walkable. The baggage-car battle ground is narrow by design.
