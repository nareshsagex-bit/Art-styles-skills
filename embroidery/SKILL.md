---
name: embroidery
description: Write image-generation prompts that render a subject as embroidery or cross-stitch (stitched thread on fabric, often in a hoop). Use when the user asks for embroidery, cross-stitch, stitched patch, needlework, sewn or "thread art" versions of a character or scene.
---

# Embroidery / Cross-Stitch

## What it looks like
- The image is made of thread: satin stitch for filled areas, backstitch for outlines
- Visible fabric weave behind and between stitches (linen or cotton)
- Slight sheen on the thread and directional stitch texture
- Often in a wooden embroidery hoop, shot from above
- Cross-stitch variant: a grid of tiny X stitches, like pixel art in thread

## Prompt template
```
[SUBJECT] as hand embroidery on linen fabric, satin stitch fills,
backstitch outlines, visible thread texture and sheen, fabric weave,
wooden embroidery hoop, top-down photo, soft natural light
```
Cross-stitch variant:
```
[SUBJECT] as a cross-stitch pattern, tiny X stitches on aida cloth,
pixel-like grid, embroidery floss, wooden hoop, top-down photo
```

## Must include
- `embroidery` (or `cross-stitch`), `thread texture`, `fabric`
- `embroidery hoop` and `top-down photo`, which sell it as a real object
- The stitch type, which changes the look a lot

## Avoid (negative prompt)
`printed, painted, digital, glossy, 3d render, smooth gradients`

## Palette tips
Use thread-like solid colours with no gradients: golden yellow, cornflower blue, white, brown. Natural linen beige works well as the base fabric.

## Keeping a character consistent
Keep the same description and simple pose. Thread can't hold tiny details, so focus on silhouette and colour blocks (yellow jacket, white dog).

## Example
```
A girl with curly dark hair, yellow jacket and blue jeans, arms raised, jumping
with a white fluffy dog, hand embroidery on natural linen, satin stitch fills,
backstitch outlines, stitched clouds and golden sun, visible thread sheen,
wooden embroidery hoop, top-down photo
```
