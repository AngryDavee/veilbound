# Veilbound campaign — seven worlds

The four original regions (Sanctuary, Whispering Thicket, Reedwater Crossing, Folded Court) are **one world**: the Valley of Silent Bells. The campaign continues through six more worlds before character design and combat begin. Each world has its own biome, palette, lighting, landmark, three clues per region and a future battle ground in every region.

## Story spine

Bronze **anchor bells** hold the Veil between the waking world and the Underfold. Veil Wardens keep the bells. The **Nightwright**, once a Keeper of the Fold, builds the **Endless Keep** from places his five **Heralds** fold away. Each Herald silences one anchor bell.

At the end of the Valley, your sibling is holding the Folded Court's heart. They can only let go once the five severed bells ring again. You go out into the world, ring each bell, and follow the Heralds' trail. When the fifth bell rings, the Nightwright can no longer hold the world from outside, so he pulls it in. The finale takes place inside his Keep. You reunite with your sibling at the Meridian, the first fold, and the exit leads home to the sanctuary.

| World | Name | Herald | Regions | Anchor bell | Palette / light |
| --- | --- | --- | --- | --- | --- |
| I | The Valley of Silent Bells | — | Sanctuary · Whispering Thicket · Reedwater Crossing · Folded Court | Sanctuary bell (silent) | Morning greens, rain blue, void violet |
| II | The Ward of a Thousand Lamps | The Lamplighter | Lamplight Avenue · Thunderbell Precinct · The Cloudpiercer | Temple bell wrapped in black | Wet brick, gaslight amber, night blue |
| III | Mistweave Ridge | The Weaver | Silkfarm Hamlet · Threadbound Ravine · Cocoon Hollow | Bell bound in camphor roots | Moon silver, mist, pale-gold threads |
| IV | The Midnight Express | The Stationmaster | Hollowmoor Station · Sleeping Carriages · Dawn Plain | Locomotive departure bell | Soot, brass, oxblood → peach dawn |
| V | The Floating Quarter | The Mask Dancer | Willow Gate · Avenue of Blossoms · Burning Rooftops | Fire-watch tower bell (stolen) | Lacquer red, violet night → fire orange |
| VI | Ember Springs | The Rust Warden | Gaslamp Bridges · Forge Terraces · Steam Basin | The last bell the smiths cast | Snow white, slate blue, ember orange |
| VII | The Endless Keep | The Nightwright | Falling Halls · Inverted Corridors · Stacked Atrium · Nightwright's Meridian | All five, echoing | Red/black lacquer, warm shoji, void |

Exits chain all 23 regions in order (`game/realms/campaign.js`). The Meridian leads home to the sanctuary.

## Reference research (visual vocabulary only)

These sources inform how the game is structured and what its architecture and atmosphere look like. They are not asset sources. Names, maps, characters and story are original.

- **Hinokami Chronicles structure:** story chapters move between explorable areas and arena encounters. The first game runs through the Mugen Train arc ([Siliconera](https://www.siliconera.com/demon-slayer-the-hinokami-chronicles-story-mode-storyboard-shown/), [Nintendo World Report](https://www.nintendoworldreport.com/review/60664/demon-slayer-kimetsu-no-yaiba-the-hinokami-chronicles-switch-review)). The sequel adds the Entertainment District, Swordsmith Village and Hashira Training arcs, with dense crowded districts and vertical village set pieces ([Game8](https://game8.co/articles/reviews/demon-slayer-kimetsu-no-yaiba-the-hinokami-chronicles-2-gameplay-and-story), [Anitrendz](https://www.anitrendz.com/news/2025/05/21/demon-slayer-the-hinokami-chronicles-2-previews-swordsmith-village-arc-with-new-trailer)). Veilbound takes the same rhythm: each world has explorable regions and each region has a battle ground.
- **Infinity Castle:** the castle is endless hallways, staircases and lamp-lit rooms, with gravity that ignores walls and ceilings. ufotable's director of photography describes 3D capacity growing from about 100 × 100 m, to about 2 km² by the Swordsmith Village arc, to an "almost infinite" space for the film, along with spinning, shifting camera vantage points ([Popverse — Yūichi Terao](https://www.thepopverse.com/movies-demon-slayer-kimetsu-no-yaiba-yuichi-terao-interview-making-the-infinity-castle-feel-infinite), [Hypebeast — Oscars making-of](https://hypebeast.com/2026/1/oscars-ufotable-demon-slayer-kimetsu-no-yaiba-infinity-castle-anime-film-behind-the-scenes-making-of-short-film)). In Veilbound this becomes instanced, repeating architecture that fades into fog and rooms rotated onto walls and ceilings, while every walkable route stays fixed.
- **Real places associated with the series' settings:** Asakusa's temple streets, a Taisho-era capital, wisteria on Fujikasane, the Yoshiwara pleasure quarter (moat, single gate, repeated fires), Ginzan Onsen's Taisho wooden inns along a river with gas lamps and bridges, and a tiered ryokan (Ookawaso) often linked to the Infinity Castle. Most of these links are fan or travel claims, not official confirmations ([Tabimania](https://tabimaniajapan.com/culture/explore-7-real-locations-that-inspired-demon-slayer), [Looper](https://www.looper.com/769423/the-real-life-inspiration-behind-demon-slayer-entertainment-arc-districts-final-fight), [JW Web Magazine](https://jw-webmagazine.com/tips/demon-slayer-kimetsu-no-yaiba-characters-hometowns), [Japan Kuru](https://www.japankuru.com/en/aaa/e3119.html), [Powderhounds — Ginzan Onsen](https://www.powderhounds.com/Japan/Honshu/Ginzan-Onsen.aspx)). Veilbound uses these architecture types: brick observation towers, temple gates with giant lanterns, gassho thatch with silkworm attics, Taisho stations, licensed-quarter gates and fire-watch towers, onsen inns, and tatara furnaces. It does not use the series' versions of these places.

## Framework

- `game/realms/campaign.js` is the registry: worlds, region order, clues and exit chaining. Each world's `game/realms/<world>/story.js` owns that world's text, spawn and exits, arenas and lighting theme.
- `theme` fields: `sky` (`day` | `night` | `none`), `background`, `fog`, `density`, `sun`, `power`, `sunPos`, `skySun`, `turbidity`, `ambient`, `hemiSky`, `hemiGround`, `exposure`, `env`, `label`. `main.js` applies them on every region change.
- Region modules export `create(root, renderer, progress, {camera, scene})`. The return contract is in CLAUDE.md.
- `game/realms/atmosphere.js` provides `nightSky()`, which builds the gradient dome, stars, moon and clouds, and `precipitation()`, for rain, snow, petals and embers.
- Memory: the sanctuary stays resident, and other regions are cached least-recently-used (4 at most). Evicted regions are disposed.
- Tools: `tools/region-shot.mjs` loads any region on any port and writes screenshots plus a navigation and performance report. `tools/map-shot.mjs` captures the world map.
