# Voxel art: style checks for reference-based work

Use this with `reference-workflow.md`. It lists what the reference brief must capture for voxel scenes, the misses that came up in real sessions, and how to fix them.

## What the brief must capture
- **Voxel scale:** how many voxels tall the main character is (aim for 40–60). Big blocks read as Minecraft.
- **Base and framing:** the diorama shape (square slab, round island, room), how much of the frame it fills, and the background colour.
- **Light:** sun direction, what glows (fire, lamps, magic), and how dark the shadows and corners are.
- **Cast:** each character's colour blocks plus one silhouette feature (cap and spiky hair, long ears, cape, wings).
- **Action and UI:** what happens in what order, and any on-screen UI (HP, names, move banners, speech).

## Common misses (seen in real sessions)
| Miss | What it looked like | Fix |
|---|---|---|
| Minecraft look | Big blocks, grass/dirt/stone strata, a floating craggy island, flat face shading with dark rims | Use VoxelGL: one small voxel size (character about 50 voxels tall), flat clean colours, AO plus soft shadows, a pastel slab on a plain background |
| Washed-out image | Bloom on everything, pale haze | `bloomThreshold` above 1 so only `fx` cubes bloom; hemisphere light about .5, sun about 1.3 |
| Scene too small or too big | The diorama filled 30% of the frame, or the edges were cropped | Tune `size` and `span` in `VoxelGL.create`; the user may ask for "zoom out 30%", so expose one number |
| UI far from the action | HP cards stuck in the screen corners | Anchor UI to the characters with `vx.project()`, leaning outward so it never covers the creatures; put speech bubbles above the cards |
| Missing story beats | The battle started cold | Add an intro beat (send-out from a ball with a flash, the creature growing in) and a reset beat at the end of the loop |
| Wings or limbs look spiky | Wing frames poke straight up | Limit flap angles; keep the membrane wide at the base |
| Effects too thin | The lightning bolt barely visible | Fatter `fx` cubes (.3–.4), a point light on the effect, and a short screen flash |

## Final self-check
- [ ] Main characters are 40–60 voxels tall with one voxel size for all of them
- [ ] No strata, no rims, no colour noise; soft shadows and AO are visible
- [ ] Only effects glow; contrast is not washed out
- [ ] The diorama framing matches the reference (and the user's zoom wishes)
- [ ] UI sits beside the characters and covers nothing important
- [ ] Every beat of the action plays and loops cleanly; no console errors
