# Pixel sprite art: style checks for reference-based work

Use this with `reference-workflow.md`. It lists what the reference brief must capture for pixel scenes, the misses that came up in real sessions, and how to fix them. Recipes are in `scenes.md` and `character-spec.md`.

## What the brief must capture
- **Native resolution:** estimate the reference's real pixel size (often about 240×360 or 320×180 scaled up 3×). Match it rather than inventing detail.
- **Camera:** side view (fighting game) or top-down ¾ (room, town, gym). This decides which sprites to use.
- **Materials:** what walls, floors and rocks are made of, and how they're drawn (chunky stones? bricks? tiles?).
- **Light:** windows and beams, warm pools, how dark the edges are, the shadows.
- **Characters:** their view (back, front, side), 4–6 identity features each, and creatures.
- **Action and text:** what happens, and whether there are speech bubbles.

## Common misses (seen in real sessions)
| Miss | What it looked like | Fix |
|---|---|---|
| Side-view sprites in a top-down room | Thin fighters standing in a ¾ room | Draw ¾-view pixel-map sprites (back and front views) as in `examples/rock-gym/` |
| Wallpaper walls | Flat brick rows | Chunky outlined `stone()` blocks with a lit top and left, dark bottom and right, cut corners |
| Flat lighting | Evenly lit scene | Bake a warm pool where the action is and a dark vignette; add soft shadows and light beams with dust |
| Plain shapes | Boulders and creatures as circles | Faceted outlined stones and octagon segments with 3-tone facets |
| Unreadable text | A tiny bitmap font scaled up | Draw text on the full-resolution canvas with a pixel font |
| "Flat card" arena | Ground looks tilted with sliding people | Add a slab thickness, shaded walls and a ground pattern; keep crowds off the edges |
| Blurry edges | Smoothing on | `imageSmoothingEnabled = false`, integer offsets, no rotation inside sprites |

## Final self-check
- [ ] Native resolution and camera match the reference
- [ ] Characters use the right view; each has a closed outline and base-plus-shade colours
- [ ] Walls and floors use the reference's materials, with light and shadow
- [ ] A screenshot side by side looks like the same scene, not the skill's default example
- [ ] Hard pixels at every zoom; text readable; no console errors
