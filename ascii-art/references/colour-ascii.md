# Colour ASCII: the method

This is the technique behind the dense, tinted ASCII look: a picture made entirely of text characters, where each character's **density** carries light and shadow and its **colour** comes from a small gradient palette. It runs live in the browser, so it can animate.

## Pipeline

```
scene code ──► hidden source canvas (≈480×360, transparent background)
                  │  every frame
                  ▼
   split into a grid of text cells (cols × rows, rows follow the font's aspect)
                  │  per cell: average the non-empty pixels
                  ▼
   colour ─► lum, saturation, hue
                  │
   ink = f(lum, sat) + Bayer dither ──► character from the ink ramp
   hue + sat ──► palette (warm / cool / gold) ──► colour from ink
                  ▼
   batch characters by colour ──► fillText on the output canvas
                  ▼
   text boxes and titles drawn last, in characters too
```

`scripts/ascii-renderer.js` implements all of it. This page explains the choices, so you can tune it or rebuild it in another stack.

## 1. Grid

- **Columns** set the detail. Use 150–240; at the same size, more columns means smaller characters.
- **Rows** follow from the source aspect and the font's width-to-height ratio (measure `'M'` at 100 px; about 0.55 for Consolas). Use `rows = H / (W / cols / ratio)`, so circles stay round.
- **Size** on screen is a fraction of the window (`size: .5`). The font size is the largest that fits `cols × rows` into that fraction.
- Refit on `resize` **and** whenever `canvas.width !== clientWidth × devicePixelRatio`, because browser zoom changes the DPR without always firing `resize`.

## 2. Sampling

- For each cell, average the pixels it covers. Skip pixels with alpha < 128, and skip pure white when the scene is drawn on white.
- If fewer than 35% of a cell's pixels are filled, it's **background**. Optionally add faint drifting specks (`.` `:` at about 4% density) for a printed-noise texture.

## 3. Ink: how much character goes in a cell

Ink runs from 0 (nothing) to 1 (the densest glyph) and indexes the ramp ` .,:;-=+*xo%#@`.

| Theme | Base | Formula |
|---|---|---|
| Light (white background) | darkness `1 − lum` | `ink = (1−lum)^0.9 × 0.75 + sat × 0.2 + 0.1`, then contrast `(ink − .5) × 1.1 + .5` |
| Dark (near-black background) | brightness `lum` | `ink = lum^1.3 × 0.88 + sat × 0.42`, then contrast `× 1.25` |

- **Saturation adds ink.** That's what makes the subject (bright costume, wings, flags) pop over pale or grey surroundings. Without it, a colourful subject on a light background washes out.
- **The exponent lifts mid tones.** Pale stone or skin still gets some characters instead of vanishing.
- **Dither:** add `(Bayer2x2[r&1][c&1] − 0.375) × 0.14` before picking. This breaks up flat areas into the checkered texture of a dithered print.

## 4. Colour: which palette, which step

Compute the hue from the average RGB:
- **cool** (teal) when `sat > .18` and the hue is 75°–265°: greens, cyans, blues
- **gold** when `sat > .4` and the hue is 18°–75°: oranges, yellows
- **warm** (magenta/pink) otherwise: reds, purples, skin, greys.

Each palette has 9 steps from the least ink to the most ink. Pick step `round(ink × 8)`, and use at least step 1 so specks stay visible. For the white theme the steps run light tint → deep tone. For the dark theme they run deep tone → glowing near-white.

Use `coolScale` (about 0.72–0.8) to multiply ink in teal areas, so big green regions (grass, leaves) don't overpower the subject.

**Matching a reference picture:** pass a custom `theme` object (same shape as `THEMES.light`) whose `warm`, `cool` and `gold` ramps use the reference's own colours. For example, the watercolour butterfly uses lavender to deep indigo for `warm`, and pale cyan shifting to blue-violet and indigo for `cool`, so that both hue families end in the same dark edge colour. Turn `specks` off for a clean paper look.

## 5. Drawing fast

- Batch characters by colour (`Map<colour, [c, r, glyph, ...]>`), then set `fillStyle` once per colour and `fillText` each glyph. That's about 30 colours instead of 30,000 style changes.
- Cap the redraw at about 20 fps. The source scene can update every frame, and the text only needs to keep up visually.
- Use a bold monospace font (`700`, Cascadia Mono / Consolas / Courier New).

## 6. Text on top

Dialogue and titles are characters too:
- **Speech box:**
  ```
  +----------+
  | HELLO!   |
  +----------+
     /
  ```
  Draw it over a solid fill so it reads over the dense art. A shout uses `*====*`, `! !` and the shout colours.
- **Layout:** place the main characters' boxes first. If a box overlaps one already placed, slide it to its speaker's side, then stack it upward.
- **Titles and impact words:** a large font size (about 2.4× the cell), stroked with the background colour and filled with a deep palette step.

## 7. Designing the source scene

The renderer can only show what the source gives it:
- Give the subject **saturated colour and dark outlines**. Fill backgrounds with pale or low-saturation colour, or leave them transparent.
- Use **big shapes with gradients** (wings, petals, a stone disc). Fine 1-pixel detail disappears into a single cell.
- Keep the subject at least **60 columns wide**, or about 25% of the source width.
- Animate in the source (flap, sway, drift, particles). The text follows for free.

## Pitfalls seen in practice

| Symptom | Cause | Fix |
|---|---|---|
| The subject is a white blob on a dark background | Bright, low-saturation area at full ink | Raise the luminance exponent (1.3–1.9) so greys drop to mid tones |
| Everything is pale on a white background | Ink came only from darkness | Add a saturation term and a small lift (`+0.1`) |
| A vivid subject turns into one flat dark blob | Saturation pushed ink to the maximum | Keep the saturation weight low (about 0.2 on white), so colours sit in the middle palette steps |
| Grass or leaves dominate | Large teal area | `coolScale` 0.72 |
| The scene drifts off-centre after zooming | DPR changed without a resize | Refit when the canvas size no longer matches `client × DPR` |
| The tab freezes when testing | Driving thousands of frames in one script while the page is hidden | Test with the page visible, or step only a few frames at a time |
