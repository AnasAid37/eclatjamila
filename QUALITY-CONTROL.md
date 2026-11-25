# Visual and functional quality control

**Release tested 25 November 2026.** The shipping catalog contains 91 garments, 10 removable accessories and 55 recipes. This expansion contributes 60 garments, 10 accessories and 44 recipes. The four clothing categories each contain independently selectable, registered transparent layers.

## Tailoring and restyling revision

The Oxford, linen shirt and knit polo were each fitted with every new bottom. All 45 combinations were selected in Chromium, rendered using their actual garment and waistband layers and reviewed in close-up sheets. Three authored looks now use a tucked waist. Undo, redo, library restore, reload and direct-file/HTTP export were exercised with fitted garments. The measurements and fit sheets are in `qc/`.

- **Waist.** Individual shirt silhouettes were narrowed at their lower bodice while keeping sleeves and cuffs. Repeated inspection exposed inward-facing waistband pixels on several skirts and trousers. Five separate front edges now pass in front of the tucked shirt. The palazzo trousers use a matching material mask for the fitted front edge. Free-hanging shirts keep the original hem.
- **Boots.** The black leather and burgundy cigarette trousers taper inside the tall equestrian boot. Straight and wide trousers were checked over the boot. A second fitting pass removed a narrow patch of visible skin at the front rim of the shaft.
- **Ankles.** All 15 new shoes received a local transition from the original leg tones into each fitted foot. Before/after sheets show the same pixels at the same scale. The CSV records the mean absolute RGB step between adjacent interior samples across each splice. Across the 15 shoes, the mean sampled change went from 6.31 to 1.80 on a 0–255 scale.
- **Stylist.** Checked a one-time top anchor, dress anchor, accessory anchor, an additional locked garment and locked footwear. Checked that footwear-only changes preserve the other garments, color, accessories and fit. Confirmed that a newer manual selection takes priority over an in-flight restyle.

`screenshots/fitted-oxford.png` and `screenshots/riding-boots.png` are captures of the live studio. `qc/fitted-waists-1.jpg` through `qc/fitted-waists-3.jpg` cover the 45 shirt/bottom pairings. `qc/boot-shafts.jpg` compares four trouser cuts. The three `qc/ankle-joins` sheets compare all 15 splices with the preceding release.

## What was rendered and inspected

| Evidence | Coverage |
| --- | --- |
| Native composites | All 55 recipes were assembled at 1360 × 2048 using the same layer plan as the studio. Every new garment and accessory was also rendered on the character. |
| Visual review | All outfit compositions were reviewed together in sheets. Garment detail views and native-pixel samples were used to inspect shoulders, necklines, cuffs, waist seams, hips, hems, footwear and accessories. |
| Browser wardrobe | Selected all 55 recipe cards, checked their selected indicator and compared every live layer with its expected asset, vertical extent and stacking order. Selected every new garment and toggled every accessory on and off individually. |
| Additional fittings | Exercised 16 additional clothing/footwear combinations, nine combinations mixing original and expanded clothing, and four fitted-belt silhouettes. |
| Registration | For all 101 catalog items, checked the 1360 × 2048 raster, the real alpha-channel box against the catalog, and the thumbnail file. Checked every independent material mask against the actual garment alpha. |
| Thumbnail provenance | Generated all outfit cards from the registered garment and support layers, including accessories. Confirmed that the maintenance utility reproduces the studio’s 55 layer plans. |
| Identity | Compared visible pixels above reference row 349 against the supplied base. The face and upper hair region in the split torso source matched exactly. |

## Corrections made during fitting

- Reworked sleeve lengths and widths against the supplied arms. Added original hand overlays and removed garment-covered hand pixels from those overlays.
- Recut inner collars and the waistcoat opening. Added a covered-shoulder body plate after seeing skin outside the lapels of the blazer dress.
- Refit trouser crotches independently of overlapping flares. Corrected two compressed thigh transitions in the flared jeans and silk palazzo trousers.
- Regenerated footwear in the worn pose and separated the visible foot from the shoe. The renderer uses shoe-specific foot plates and hides the original sandal beneath new footwear.
- Limited recoloring to selected fabrics on 16 new garments. The original atlas is still supported. Hardware-rich, patterned and multicolor designs use their authored appearance. New standalone masks are intersected with the garment alpha.
- Fit the oxblood belt against four waist silhouettes. A selection outside those fits gets an explanation. Changing to another silhouette removes the belt.
- Repaired fractional CSS stacking, stale async selection, missing-asset rollback and save-time snapshots. Compared direct-file and local-HTTP downloads after implementing a lossless local export source.

## Browser verification

Tests ran in desktop headless Chromium **143.0.7499.0** on Linux at 1600 × 900. Screenshots in `screenshots/` were captured from that running application. The PNG card was downloaded by clicking the studio control in both local HTTP and direct-file sessions.

| Control or scenario | Observed outcome |
| --- | --- |
| Rapid changes | A burst across tops, bottoms and shoes committed the latest requested pieces, with one live layer per expected role. |
| Dress replacement | A dress removed both separates. Changing back to separates restored the remembered partner. |
| Stylist and locks | Locked garments retained their IDs and color. Locking all three clothing slots left the outfit in place. An uncurated locked pair received a compatible footwear alternative. |
| Recoloring | The chosen swatch appeared on the active garment. A separate pixel test of the original sweatshirt atlas sampled 1,688 protected fabric pixels with no changes exceeding two RGB levels, and 45,925 masked fabric pixels with a visible color change. |
| History and reset | Undo, redo, branching history, height/build scaling, frame switching and reset behaved as expected. |
| Favorites and library | Favorite filtering worked. A saved outfit restored the state present at the click, even after an immediate outfit change. Saved looks, favorites and the current outfit survived reload. |
| Missing and unavailable items | An intentionally missing PNG retained the previous complete outfit. Restoring the file reference allowed selection again. Unsupported cargo and tall-boot pairing produced a visible explanation. |
| Export | Both launch modes produced a 1600 × 2048 PNG of the same recolored outfit. Mean per-channel difference was under 0.18 on a 0–255 scale. |
| Loading | Normal HTTP and direct-file runs reported zero browser console errors. The missing-file test deliberately generated a failed request. |

The coat and cashmere examples in the captures show how the garments read at normal studio scale. The native garment PNGs are available for close inspection. `qc/wardrobe.csv` gives individual item bounds and mask references. `qc/looks.csv` lists the pieces in each recipe. The five numbered JPEG sheets cover all 55 recipe composites. The other two sheets show mixed-generation and fitted-belt checks.

## Limits

Review covered every predefined outfit and targeted full-resolution regions. The thousands of possible manual combinations were sampled. Thin straps, open footwear and relationships between older cutouts and new layers can still show softer edges or small ankle transitions at high zoom. Older pieces sometimes contain pre-existing skin or trim in their cutouts. New photographed garments have different amounts of source detail after registration to the common canvas.

The fitting remains two-dimensional and tied to the supplied front-facing pose. The posture, face and hair controls retain their original behavior. The scoring system uses local rules, authored outfit metadata and the displayed persona temperature. Mobile Safari, Firefox and physical phones were outside the tested browser set.
