# ASCII art: style checks for reference-based work

Use this with `reference-workflow.md`. It lists what the reference brief must capture for colour-ASCII scenes, the misses that came up in real sessions, and how to fix them.

## What the brief must capture
- **The subject's silhouette and size:** one bold subject, or a scene. Bigger, bolder subjects read better as text.
- **Background:** dark terminal or white page. That changes the ink formula.
- **Palette:** the 2–3 hue families in the reference (for example lavender/indigo and cyan/blue).
- **Density:** the number of columns, and whether glyphs fill the whole frame or only the subject.
- **Motion:** what moves (wings flapping, the subject bobbing).

## Common misses (seen in real sessions)
| Miss | What it looked like | Fix |
|---|---|---|
| Blob of one colour | The subject turned into a flat plum or white mass | Light theme ink: `(1-lum)^.9*.75 + sat*.2 + .1`, then contrast ×1.1. Lower the saturation weight; tune the luminance exponent on dark themes |
| Too many subjects | Several butterflies and flowers when the reference had one | Match the subject count from the brief; remove extras |
| Too faint or small | A thin, pale subject | Scale the source drawing up, thicker strokes, darker edges in the source canvas |
| Wrong palette | Generic colours | Write a custom `THEME` with ramps sampled from the reference (warm, cool and gold ramps) |
| Grid drifts when zoomed | Characters misaligned after a browser zoom | Refit whenever the canvas size no longer equals the client size × DPR |
| Specks clutter a white page | Noise around the subject | `specks: false` and `skipWhite: true` |

## Final self-check
- [ ] Subject count, size and silhouette match the reference
- [ ] Hue families match; no single-colour blobs
- [ ] Background matches (light or dark), with the right ink formula
- [ ] Motion is smooth; the grid stays aligned after resizing
