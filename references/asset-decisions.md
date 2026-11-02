# Asset selection

Reference: Atlas `sanctuary-object-reference.png`; style and real dimensions: `../STYLE_LOCK.md`.

The three construction arms use primitive assembly, profile sweeps, and detailed carpentry/organic decomposition. All 18 candidates were passed through the unmodified 404 verifier, which creates front, side, back, side, and three-quarter renders. All 18 passed its structural checks. This is not a claim that all 18 look equally good.

| Asset | Choice | Visual reason |
| --- | --- | --- |
| Training hall | craft | Curved roof with visible seams, rafters, entrance canopy, veranda, and open interior. Primitive arm loses roof character; profile arm lacks the same joinery. |
| Gate | craft | Layered tile ends and bracketing remain readable from side and rear. |
| Stone lantern | profile | Concave swept shaft follows the reference better than the stepped craft shaft. |
| Pine | craft, refined at runtime | Asymmetric branching and canopy distribution. The profile arm shows hollow/disconnected rings despite passing structural checks and is rejected. Initial rounded canopy requires foliage refinement. |
| Rocks | craft | Irregular rock faces and moss masses; profile arm looks too manufactured. |
| Bell pavilion | craft | Repeated roof tiles, open supporting frame, suspended bell and striker. |

The 404 verifier self-test was run and caught all deliberately broken fixtures. Production rendering uses the stock loader's batching; raw candidate mesh counts do not equal in-game draw counts.

## First visual review

The initial real browser frame is `evidence/01-first-title.png`. It exposed oversized foreground canopy intrusion, overly smooth green mountain slopes, and rounded foliage. Changes: reposition the title view and foreground trees; use a ridged maximum-height terrain envelope instead of summing overlapping mountains; add slope-dependent stone/forest coloration and Atlas rock surface detail; reduce distant tree segment counts; generate a dedicated Atlas pine cutout for the next foliage pass.

Generated concept art is stored only in `references/`; it is not displayed as the playable environment. The browser frames in `evidence/` are the actual Three.js scene.

## Foliage and landscape refinement

Atlas produced an actual 2048 x 2048 RGBA pine bough with alpha range 0–255 and 2,652,316 fully transparent pixels. Crossed planes replace each selected pine's rounded leaf masses at runtime, retaining its code-built trunk and branches. Distant pines reduce branch tube segments and cluster counts; no mesh decimation is used. Forest density increases around the sanctuary while retaining instancing.

The terrain now includes enclosing southern ridges, a finer heightfield, slope-dependent stone coloration, and Atlas rock maps. The hall has a modest warm interior fill. The first 4.2-million-triangle view was reduced to about 1.2 million in the final test route while adding more forest trees. These are local renderer measurements, not universal performance claims.

## Second environment pass

Review evidence: `evidence/detail-interior.png`, `evidence/water-motion-a.png`, and `evidence/wind-motion-a.png` are actual rendered frames. Before images remain in `evidence/v1/`; the first source snapshot is `evidence/pre-detail-source.tar.gz`.

- Replaced static thin grass and still canopies with a shared world-space wind shader and curved tapered grass blades. Added individually folded fern leaflets, flower petals, reeds and ground moss.
- Rejected a trial forest of simple conical trees after viewing the real frame. The final distant trees use an Atlas full-tree cutout on crossed planes; local byte inspection confirms RGBA, 1200 × 896, alpha 0–255. A shader rejects bright fringe pixels without altering the source file.
- Replaced the single waterfall plane with five turbulent layers, animated foam and splash particles, a wider textured rock face and a planar-reflected stream. Moved the falls and pool east so the stair route remains clear. Reduced water's normal amplitude and reflectance after the first review looked metallic.
- Furnished the training hall and added warm local lighting, ceiling framing, surface detail, contact shading and collision around the larger furnishings. Generated tatami/plaster roughness maps measured mean values around 64/255 and 52/255 respectively, producing too much shine; these two surfaces use fixed diffuse roughness while retaining their Atlas color and normal maps.
- Added a physically visible eastern stone trail, railings and signs, plus direct destination buttons and an interior viewpoint to make the full environment discoverable.
- Cached static shadows and throttled stationary water reflection updates after the first heavy pass measured 25–35 fps. Subsequent desktop scene reviews measured roughly 36–52 fps; the full route check measured approximately 49–60 fps at its sampled locations. These are local headless-browser samples, not hardware guarantees or physical-phone benchmarks.
- Animation checks compare unchanged camera positions, changing water uniforms and droplet positions, actual compiled canopy/grass wind shaders, and before/after rendered frames. Pixel differences are recorded in `evidence/motion-pixel-report.json`. Full exploration, all clues, stair ascent, time toggle, journal persistence, photo mode and touch movement passed with no browser errors or missing assets.

Remaining rendering limits: stylized authored geometry, billboard trees at distance, shader/particle water rather than fluid simulation, and static cached tree shadows. No claim of photorealism or universal frame rate.
