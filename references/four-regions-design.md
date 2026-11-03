# Four regions — design and art review

The sanctuary, temple, garden and waterfall form **one location**. The expansion adds three independently built regions, not additional camera views of the sanctuary.

| Chapter | Region | Story purpose | Future battle ground |
| --- | --- | --- | --- |
| I | Cloudveil Sanctuary | The guardian's disappearance; an unfinished letter and silent bell | 18 × 18 m training court |
| II | Whispering Thicket | Follow the sibling's ribbon markers and learn that the bells are anchors | 26 × 26 m clearing in dense bush/forest |
| III | Reedwater Crossing | Recover the fourth tuning weight from the missing ferry shipment | 22 × 18 m ferry yard; bridges are traversal spaces |
| IV | The Folded Court | Find the guardian's work at a mechanism that stabilizes the valley | 26 × 26 m Meridian Ring; separate elevated final platform |

The user's follow-up explicitly changed the second environment to bush. The thicket now precedes the canal town. It includes bamboo, cedar trunks with continuous root flares, moss, low foliage, wind-driven grass, a brook and an overgrown pilgrim gate. The reference to a bell foundry is expressed through the town's workshop and cargo, rather than replacing the bush with another settlement.

## Reference vocabulary

These are visual research sources, not asset sources:

- [SEGA's Hinokami Chronicles manual](https://demonslayer-hinokami.sega.com/manual/console/index.html?lang=us&page=index): story exploration and arena encounters inform the broad gameplay structure. No characters, logos, music, ripped assets or exact game maps are used.
- [Hachiman-bori Canal — Japan National Tourism Organization](https://www.japan.travel/en/spot/10/): canal-side storehouses, merchant architecture and layered waterside spaces inform Reedwater's town layout.
- [Kumano Hongu Taisha — Tanabe City Kumano Tourism Bureau](https://www.tb-kumano.jp/en/kumano-kodo/world-heritage/kumano-hongu-taisha/): a forest approach, large cedars and restrained timber structures inform the thicket's atmosphere.
- [Kosan-ji — Kyoto Travel](https://kyoto.travel/en/destinations/kosanji-temple/): moss, cedar trunks, filtered light and forest architecture inform ground-cover and lighting decisions.

The finale uses the broad idea of impossible Japanese-inspired architecture. Its original organizing idea is a radial observatory: orbital galleries act as counterweights around a brass astrolabe. Its story, map, names, mechanism, routes and arena arrangement are newly authored. This is a creative distinction, not a legal guarantee.

## Asset audit

- **Tree roots:** replaced six straight cylindrical spokes with a single continuous, ridged trunk mesh. Five irregular buttresses flare near the soil and taper upward. Distant trees use a lower construction resolution; no imported mesh or decimation is involved.
- **Existing waterfall cliff:** replaced the stacked-boulder tower with one eroded rock mass; preserved water layers, mist, droplets and the separate stair route.
- **Stone surfaces:** reduced the earlier whitening of stone props; wet stone retains moderate roughness.
- **Vegetation:** retained the existing Atlas needle cutout and authored wind, with new dense ground cover and bamboo in the thicket. Removed a randomly placed tree that blocked the first spawn during browser review.
- **Architecture:** retained the sanctuary's existing detailed dojo and fixtures; created original merchant houses, arched bridges, workshop props, awnings, boats and lanterns for the town.
- **Finale:** suspended galleries turn slowly around stable playable platforms. Added connected orbital walkways after the first review looked like disconnected floating buildings.
- **Navigation and story:** a four-region map, per-region views, twelve journal traces, contextual region exits and visible future battle-ground labels replace the misleading description of six sanctuary views as six locations.

## Generation and rendering constraints

Atlas's generation tools were not exposed during this expansion. Plugin discovery returned MongoDB Atlas, which is unrelated. The build reuses the Atlas files already committed to the project; **no new Atlas generation or charges were made**. New scenery is code-built geometry and shaders.

This remains a stylized real-time environment. Tree foliage at distance uses cutouts; the water is shader/particle animation, not fluid simulation. Decorative moving castle galleries are not traversable. Collision is authored explicitly for the stable route; no combat, characters or character rigs are implemented in this phase.


## Validation

`npm run check`, `npm run test:regions`, `npm run test:journey` and `npm run test:browser` passed during this expansion. Browser checks covered real movement in all four regions, chapter exits, nine new clue positions, a walk across the canal and up the castle stairs, the three original sanctuary discoveries, journal persistence, lighting/photo controls and emulated touch navigation. No JavaScript errors or missing local resources were reported. A final backdrop-only forest pass added staggered trees beyond the navigable boundary; region rendering and movement were rechecked afterward.

Actual rendered screenshots and JSON reports are in `evidence/realms/`; original sanctuary regression evidence is in `evidence/`. Frame-rate samples describe this development machine, not physical-phone performance. Mobile tests use browser emulation. The environment art remains stylized and open to further refinement.
