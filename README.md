# ÉCLAT — Styling Studio

## Ouvrir le studio

Décompressez **tout** le ZIP, puis ouvrez **index.html** dans Chrome ou Edge sur ordinateur. Les vêtements, le décor, les polices et l’export PNG sont inclus dans le dossier. Pour utiliser une adresse locale stable et retrouver vos looks sauvegardés dans le même navigateur, lancez `python start.py` depuis ce dossier.

## Ajuster ou restyler une tenue

Dans **Style → Outfits**, porte une pièce puis ouvre sa catégorie. **Keep top · restyle** garde le haut et sa couleur et cherche une nouvelle combinaison. Le bouton s’adapte à la catégorie active. **Change shoes only** conserve les vêtements, leurs couleurs, les accessoires et la façon de porter le haut. Pour partir d’un accessoire, ouvre sa ligne dans le détail de la tenue et clique sur **Keep this piece · restyle**. Ces actions respectent les cadenas déjà actifs.

Le réglage **Waist → Loose / Tucked** apparaît pour la chemise Oxford bleu ciel, la chemise en lin olive et le polo vert lorsqu’ils sont portés avec un des quinze bas de la collection étendue. Les deux modes sont conservés à la sauvegarde et à l’export. Le pantalon en cuir noir et le pantalon bordeaux fuselé se glissent automatiquement dans les bottes cavalières.

## Launch

Extract the entire archive and double-click **index.html**. The desktop studio runs without an account, internet connection, package installation or build step. Keep the files and folders together. For a local web address, run `python start.py` with Python 3. The launcher opens the studio on this computer, normally at `http://127.0.0.1:8765/`. Press Ctrl+C in the terminal to stop it.

Saved outfits, favorites and locks live in the current browser profile. Keep using the same file path or local address to see the same library. Private browsing, moving the folder and switching between file and HTTP origins can give you a different library.

## Use the wardrobe

1. In **Style → Outfits**, select Tops, Bottoms, Dresses or Shoes to change one piece. Selecting a dress temporarily replaces both separates. Selecting a separate brings back its remembered partner.
2. Select **Looks** to wear a complete outfit. Its thumbnail uses the same clothing, accessories and layer order as the studio. Click a new piece to restyle it.
3. Choose **Occasion** and **Season**, then **Randomize ÉCLAT**. The stylist weighs fabric, silhouette, palette, formality, footwear, personality traits and the profile temperature. Lock the active category with its padlock to keep that slot and its chosen color. The temperature beside the profile is part of the supplied persona.
4. In **Accessories**, click a piece to wear it and click again to remove it. Necklaces and scarves share a neck position. Bags share a carrying position. The fitted oxblood belt works with the silk wrap blouse, crepe sheath, cashmere column and linen maxi. The studio replaces the active accessory in the same position.
5. Use the swatches below an eligible garment to change its fabric color. Select **Original** to restore it. Pieces with embroidery, hardware, contrasting fabric or multicolor footwear have deliberately limited color options.
6. Click the heart on a card to favorite it. The header heart filters the current category. **Save to library** stores the current outfit, colors, grade and body settings. The bag icon opens up to 40 saved looks. Undo and redo support up to 80 recent state snapshots in the current session.
7. The download arrow exports a **1600 × 2048 PNG** with the outfit, accessories, prices and selected colors. On first export directly from disk, the studio reads the bundled lossless image pack. The HTTP version reads the registered originals. Shareable look links require hosting the project at an address the recipient can reach.

## Collection

| Category | Existing | New | Total |
| --- | ---: | ---: | ---: |
| Tops | 9 | 18 | 27 |
| Bottoms | 9 | 15 | 24 |
| Dresses | 2 | 12 | 14 |
| Shoes | 11 | 15 | 26 |
| Accessories | 0 | 10 | 10 |
| Coordinated looks | 11 | 44 | 55 |

The 44 new looks have different clothing and footwear combinations. Examples include **Saint-Germain Saturday**, **Seoul Design Fair**, **The Editor’s Desk**, **Emerald Premiere** and **Velvet at the Opera**. Catalog prices are illustrative.

## Project files

| Path | Contents |
| --- | --- |
| `index.html`, `style.css`, `script.js`, `data.js` | Original studio layout, interactions, renderer and catalog |
| `assets/base.png`, `assets/base/` | Supplied character and registered head/torso, arm, hand, leg and foot support layers |
| `assets/tops/`, `assets/bottoms/`, `assets/dresses/`, `assets/shoes/`, `assets/accessories/` | Independent new transparent PNGs |
| `assets/fits/` | Fitted shirt, trouser and waistband variants for registered combinations |
| `assets/masks.png`, `assets/masks/` | Original 4 × 2 atlas and standalone selective masks |
| `assets/looks/`, `assets/thumbnails/` | Composited outfit previews and individual wardrobe cards |
| `assets/archive/`, `assets/fonts/` | Recovered original imagery and locally bundled fonts with licenses |
| `screenshots/`, `qc/`, `QUALITY-CONTROL.md` | Real browser captures, review sheets, per-item and per-look checks |
| `tools/rebuild-assets.py` | Optional thumbnail and offline-export rebuild for maintainers |

## Asset registration

The reference canvas is **1360 × 2048**. Each item uses a unique ID and an independent photographic PNG. `bb` stores its actual nontransparent extent as left, top, right-exclusive, bottom-exclusive. Shirt and dress records may specify sleeve and hand occlusion. Bottoms specify cut and visible leg height. Footwear may specify a foot underlay and boot height. Accessories specify a position group and draw order. The main stage, saved-look miniatures and export all use `layerList` in `script.js`.

When adding artwork, measure its alpha bounds, add the catalog record and item thumbnail, then add recipe records as desired. Run `python tools/rebuild-assets.py` to regenerate all look thumbnails and the local-file export bundles. This optional maintenance command uses Python with Pillow and Node.js. See **QUALITY-CONTROL.md** for the tested environments and fitting limits.
