---
name: voxel-art
description: Make subjects, characters and scenes as voxel art (3D built from small cubes, MagicaVoxel-style dioramas). Two modes - build it live in code with the bundled VoxelGL engine (Three.js, soft shadows, ambient occlusion, bloom, animation, sound) or write an image-generation prompt. Use when the user asks for voxel, cube, blocky 3D, isometric block, MagicaVoxel or "3D pixel art" versions of a character, scene or product.
---

# Voxel Art

## What it looks like (and what it is not)
Good voxel art is the **MagicaVoxel diorama look**, not the Minecraft look:

| Do (MagicaVoxel) | Avoid (reads as Minecraft) |
|---|---|
| Small voxels: a character is 40–60 voxels tall, so curves read round | Big blocks: a whole character only 15–20 cubes tall |
| Clean flat colours per region, pastel/harmonious palette | Random per-block colour noise, block "textures" |
| Soft light: cast shadows, ambient occlusion in creases, glowing emissives | Flat face shading with dark outlines on every block |
| A neat diorama slab (square or round) on a plain pastel background | Grass/dirt/stone layered ground, floating craggy rock islands |
| Gentle isometric or high 3/4 camera | Eye-level game camera |

## Pick a mode
| The user wants | Mode |
|---|---|
| A web page, animation, "make it in code", "no PNG", something that moves or can be spun | **Mode 1: code (VoxelGL)** |
| A still image from an image model | **Mode 2: image prompt** |

---

## Mode 1: build it in code (VoxelGL)
Everything is built from code: never load PNG/OBJ/VOX files.

Files in this skill:
- `scripts/voxel-gl.js`: the engine. Shape-based voxel models (box, ball, tube) rasterised at any voxel size, meshing with per-vertex ambient occlusion, soft shadows, shadow-catching floor, bloom for glowing effect cubes, an effect light, an orbit camera that sways, and a 2D overlay for UI text
- `scripts/battle-audio.js`: synthesised looping battle music plus sound effects (no audio files)
- `references/code-voxels.md`: API, model-building tips, the look checklist, animation and testing tips
- `examples/voxel-battle/`: a pastel diorama stadium with two trainers and two creatures. It opens with a ball send-out, then a 16-second move loop (dash, fire breath, lightning, fly and clash), with HP cards, move banners, speech bubbles, camera shake and sound

Steps:
1. Copy `scripts/voxel-gl.js` next to your page. Load Three.js r128 and the bloom post-processing scripts from the CDN (copy the `<script>` tags from `examples/voxel-battle/index.html`).
2. Create the renderer: `const vx = VoxelGL.create(stageDiv, { background, floor, size, span, target, yaw, pitch })`.
3. Build models with `VoxelGL.model()` in "design units" (like cells in a voxel editor), then turn them into meshes with `vx.mesh(model, { unit, voxel })`. Use **one voxel size for every character**, so the whole scene reads as one style.
4. Put pose variants (arm up/down, wing frames, mouth open) in a group and switch which one is visible. Move groups each frame in `vx.start((t, dt, fx) => { ... })`.
5. Draw effects (fire, sparks, lightning, beams) with `fx(x, y, z, colour, size, glow)`. A glow above 1 makes the cube bloom.
6. Draw UI (HP cards, banners, bubbles) in the `overlay(t, ctx)` callback. Place it next to things with `vx.project(x, y, z)`.
7. Check the result in a browser: screenshot it, compare against the look table above, then fix framing and contrast.

---

## Mode 2: image prompt

### Prompt template
```
[SUBJECT], voxel art, built from small cubes, isometric view, MagicaVoxel render,
soft global illumination, ambient occlusion, limited flat colour palette,
small diorama base, clean pastel background, [MOOD/LIGHTING]
```

### Must include
- `voxel art`, `small cubes`, `isometric`
- A render hint (`MagicaVoxel render`, `octane render`) for the soft-lit look
- A simple background, so the cube silhouette stays readable

### Avoid (negative prompt)
`minecraft, smooth surfaces, realistic skin, high-poly, photo, noisy textures, lego studs, blurry`

### Example
```
A girl with curly dark hair, yellow jacket and blue jeans, arms raised, jumping
beside a white fluffy dog, voxel art, built from small cubes, isometric view,
MagicaVoxel render, soft global illumination, small round grass diorama base,
pastel cream background, cheerful
```

---

## Palette tips
5–8 flat colours per character. Use a warm cream or pastel background, saturated colours for the main subjects, and soft pastels for the base. Keep the brightest, glowing colours for effects only, so bloom picks them out.

## Keeping a character consistent
Keep the same colour blocks and the same silhouette feature everywhere (cap + spiky hair, long ears with black tips, cape). Voxel art reduces everything to colour blocks, so describe clothing colours plainly.
