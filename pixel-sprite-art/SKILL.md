---
name: pixel-sprite-art
description: Create retro 16-bit chibi pixel-art characters and scenes drawn entirely from code (HTML canvas / JavaScript, no image files), animated sprites and poses, fighting or JRPG-style pixel scenes with crowds, effects and speech bubbles, and image-generation prompts for pixel sprites and sprite sheets. Use when the user asks for pixel art, a pixel character or sprite, a 16-bit / SNES / GBA look, a pixel fight scene, a sprite sheet, or wants a character from a reference image recreated in pixel style. Route text glyph art to ascii-art and 3D cube art to voxel-art.
---

# Pixel Sprite Art

Two deliverables. Pick from the request, and default to **code-drawn** when the user is in a codebase, says "generate it from code", or wants something animated.

| Deliverable | When | Output |
|---|---|---|
| **Code-drawn sprites** (default) | Interactive page, game, animation, "draw it with code", "no images" | HTML/JS that paints every pixel at runtime with `scripts/sprite-kit.js` |
| **Image prompt** | The user wants a still picture from an image model | A prompt (see the end of this file) |

Never load character art from PNG files for a code-drawn request. Users notice, and it defeats the point.

## What makes it read as this style

This is **16-bit chibi pixel art**: small sprites, big heads, flat shading, a dark outline.

- **Size:** a character is about **30 px tall** at native resolution: legs about 10, torso 9, head 8 plus hair. Draw the scene on a small canvas (320×180 to 512×400) and scale it up with nearest-neighbour. Keep this size when the user asks for "more detail". Spend the pixels on clearer features rather than a bigger sprite.
- **Palette:** each material gets a **base colour plus one darker shade**. Light comes from the upper left, so the shade goes on the back side of every part. No gradients and no blending inside a sprite.
- **Outline:** a 1 px dark outline (`#1b1724`) around the whole silhouette, made by stamping a tinted copy of the sprite 1 px in four directions behind it.
- **Hard edges only:** snap every draw call to whole pixels. Never rotate or scale while drawing a sprite, because that anti-aliases. Draw limbs as lines of stamped squares (`line()` in the kit).
- **Readable at 30 px:** identity comes from 4–6 bold features: hair silhouette, outfit colour blocks, one accessory (headband, scarf, sash, sword), eye colour, face marks. Pick those first.

## Workflow: code-drawn character

1. **Copy `scripts/sprite-kit.js`** next to the user's page (or inline it). It gives you `PixelSprite.create().drawChar(ctx, spec, pose, t, feetX, feetY, face, opt)` plus 13 poses and 7 head styles.
2. **Write a character spec.** It's a plain object: skin, hair and style, an 8×9 torso map with a palette, sleeves, pants, shoes, headband, and optional `gear` hooks for accessories. The schema, the torso-map method and how to turn a reference image into a spec are in **`references/character-spec.md`**. Start from one of the three originals in `examples/characters.js`.
3. **Render at native resolution, then present.** Draw into an offscreen canvas, then scale it onto the visible canvas with `imageSmoothingEnabled = false`. Use an integer scale when you can.
4. **Animate** by passing time `t` (seconds) and switching `pose` per frame. `drawChar` returns the front hand position, which is where weapons and energy effects attach.
5. **Verify visually.** Open the page, take a screenshot and zoom in on each character. Check: outline closed, no blurry edges, features readable, facing direction right, nothing floating above or below the shadow.

`examples/demo.html` shows three original characters in eight poses plus a row of generated extras. Open it to see the target quality.

## Workflow: a whole scene

For a fight arena, a crowd, effects or dialogue, read **`references/scenes.md`**. It covers:
- a ¾ top-down floating arena (tiled stone disc, shaded walls, island with a rock underside) that reads as solid ground
- depth sorting, shadows and foot rings
- sparks, dust, rubble, shockwaves, an energy orb and lightning
- a beat-based fight director
- speech bubbles and impact words that stay readable.

Lessons that cost iterations last time:
- **Text:** never draw dialogue with a tiny bitmap font on the low-res canvas, because it becomes unreadable once scaled. Draw bubbles on the full-resolution output canvas with a pixel font such as "Press Start 2P", and lay them out so two bubbles never overlap.
- **Flat-card look:** a tilted ground plane with upright sprites looks like people sliding off a picture. Add a constant-thickness earth slab under the edges, shade walls light-left to dark-right, add a subtle grid or ring pattern on the ground, and keep crowds away from edges.
- **Crowds:** place extras on rings or edge lines with minimum spacing, exclusion zones (arena, trees) and a gap at the front. Generating a "full ring" packs in far too many.
- **Camera angle:** ground ellipses and island shapes share one squash ratio (about 0.62 for a ¾ view). Shadows, rings and particle spreads must use the same ratio.

## Originals vs. existing characters

The example characters are original. When the user asks for a known character as fan art, capture the recognisable features (hair silhouette, outfit colours, signature accessory, eye colour) through the same spec. Make it from code, and don't copy sprites from existing games.

## Image-prompt mode

When the user wants a still image from an image model, specify: character identity features, pose, view angle, native grid (48×48 or 64×64 per fighter), palette size, outline, lighting and background. Ask for square pixels and a nearest-neighbour upscale.

```
Two original martial artists meeting fists in a side-view retro 16-bit
fighting-game scene. One wears a teal jacket with a red scarf and white
spiky hair, the other a white shirt with a red sash and a black ponytail.
Chibi proportions, about 32 px tall each, bent knees and offset feet.
Square pixels, bold 1 px dark outlines, two flat shades per material, light
from the upper left. Transparent background, crisp nearest-neighbour upscale.
```
Avoid: `smooth shading, gradients, anti-aliasing, blur, painterly, 3D render, isolated noise pixels`.

## Self-check before you finish
- Is every character drawn by code, with no image files?
- Do the sprites have hard pixel edges at every zoom (no rotation, no smoothing)?
- Does every material have exactly a base and one shade, lit from the upper left, with a closed dark outline?
- Is each character recognisable from 4–6 features at about 30 px tall?
- Is the text drawn at screen resolution with no overlapping bubbles?
- Did you look at a screenshot, not just the code?
