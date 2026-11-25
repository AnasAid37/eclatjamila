# ÉCLAT — Wardrobe expansion

## Tailoring and one-click restyling · 25 November 2026

- Added **Keep this piece · restyle** for garments and accessories, and **Change shoes only**. Both use the existing stylist, respect persistent locks and can be undone. Keeping a top retains its current waist fit and chosen color. Each restyle applies once.
- Fitted three alternate shirt silhouettes against all 15 bottoms of the expanded wardrobe. Five waistbands have separate front edges to show the shirt inside the photographed opening. Three authored looks now use a tucked fit.
- Matched the upper edge of all 15 foot underlays to the light and shading on the existing legs. Refitted the two slim trousers inside the equestrian boot shafts and separated the visible leather rim from skin pixels.
- Updated outfit thumbnails, direct-file export assets, live browser screenshots, fit comparison sheets and per-combination testing records.

## Initial expansion · 25 November 2026

### Collection and art direction

Added 18 tops, 15 bottoms, 12 dresses, 15 pairs of shoes and ten removable accessories. The 44 new coordinated looks use distinct top/bottom/dress and footwear combinations. The original 31 garments and 11 looks remain accessible. Individual thumbnails and all 55 outfit thumbnails are bundled assets.

Generated separate garment studies against the original reference, then fitted the extracted materials on the 1360 × 2048 canvas. Additional footwear studies used a close reference of the original feet. The studio uses separate foot support for open footwear, original hand pixels and sleeve-specific occlusion. The split body foundation corrects the original leggings and colored matte visible behind new clothing. The original supplied base is retained for legacy scenes.

### Styling and rendering

Replaced blind selection with a scored wardrobe search that starts with coordinated recipes and can find alternatives around locked pieces. Added occasion and season inputs inside the existing wardrobe. Added clear feedback for the inherited sweatpant/sweatshirt and suit-trouser/blazer combinations, and for cargo ankle ties with tall boots.

The stage preloads required assets before changing the outfit. Versioned requests discard stale selections during rapid changes. The renderer supports garment-dependent layer order, separate hand and foot plates, alpha-derived transition extents, standalone masks and the original atlas. Recoloring in the PNG renderer preserves the garment’s alpha.

### Studio interactions and delivery

Added functioning accessories to the existing sidebar, favorite toggles to cards and a persistent favorites filter. Saved looks capture the state at click time. Undo/redo and reset restore entire outfit snapshots. The avatar, photo filters, framing, body controls, garment details, prices, download card and original glass panels remain part of the studio.

Recovered the studio background and original remote assets. Bundled fonts, asset thumbnails, a direct-file PNG export pack and an optional Python launcher. Added actual browser screenshots and traceable garment and outfit QA inventories.
