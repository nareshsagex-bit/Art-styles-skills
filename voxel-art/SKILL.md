---
name: voxel-art
description: Write image-generation prompts that render a subject or character as voxel art (3D scenes built from small cubes, like a 3D pixel game). Use when the user asks for voxel, cube, blocky 3D, isometric block or "3D pixel art" versions of a character, scene or product.
---

# Voxel Art

## What it looks like
- Everything is built from equal-sized cubes, like a 3D pixel grid
- Usually an isometric or slightly high camera angle with a small floating "diorama" base
- Soft global illumination, gentle ambient occlusion in the gaps between cubes
- Flat-coloured cubes, little or no texture, a limited palette
- Chunky, simplified proportions (big head, short limbs)

## Prompt template
```
[SUBJECT], voxel art, built from small cubes, isometric view, MagicaVoxel render,
soft global illumination, ambient occlusion, limited flat colour palette,
small floating diorama base, clean pastel background, [MOOD/LIGHTING]
```

## Must include
- `voxel art`, `cubes`, `isometric`
- A render engine hint (`MagicaVoxel render`, `octane render`) for the soft-lit look
- A simple background so the cube silhouette stays readable

## Avoid (negative prompt)
`smooth surfaces, realistic skin, high-poly, photo, noisy textures, lego studs, blurry`

## Palette tips
5–8 flat colours. Pastel sky blue background, saturated colour for the main subject, and white/light grey for clouds and ground.

## Keeping a character consistent
Repeat the same character description word for word (hair, clothes, colours, pose) and change only the style keywords. Describe the clothing colours plainly ("yellow jacket, blue jeans") because voxel art reduces everything to colour blocks.

## Example
```
A girl with curly dark hair, yellow jacket and blue jeans, arms raised, jumping
beside a white fluffy dog, voxel art, built from small cubes, isometric view,
MagicaVoxel render, soft global illumination, floating island of grass cubes,
voxel clouds, bright blue sky, cheerful
```
