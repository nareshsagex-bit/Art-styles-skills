---
name: pixel-sprite-art
description: Create 2D pixel sprites or write image-generation prompts for retro fighting-game characters, arcade combat poses, and pixel-art sprite sheets. Use for artwork built from colored square pixels. Route text glyph art and 3D cube art to their respective styles.
---

# Pixel Sprite Art

## Design the sprite

- For the retro fighting-game look, use a side-view or three-quarter combat pose, a clear silhouette, dark stepped outlines, and a compact palette. Use a few decisive color clusters for shadows and highlights. Keep faces and costume details readable at native size.
- Block in the pose before detailing. A fighting stance benefits from bent knees, a stable footing, and clear separation between the arms and torso. For two characters, make the direction of each attack and the point of contact clear.
- Pick a native grid for the requested detail. A 48×48 or 64×64 cell is a useful starting point for a single compact fighter. Keep the pixel size consistent across the composition and use a wider canvas for two fighters.
- Use hard edges and solid pixel clusters. Skip blur, gradients, smooth antialiasing, and isolated pixels that add noise. Preview at native size and upscale by an integer factor with nearest-neighbor sampling.

## Match the deliverable

- For a prompt, specify the character's identifying features, pose, viewing angle, pixel grid or intended detail level, palette, lighting, outline, and background. Use the reference for silhouette, pose, and pixel treatment when supplied.
- For a game-ready asset, build or refine the sprite on the actual target grid and export a transparent PNG. For a sprite sheet, keep frame cells the same size and align each frame to a consistent baseline and character origin. Preview the frames in sequence if animation is requested.

## Example prompt

```
Two original martial artists meeting fists in a side-view retro arcade
fighting-game scene. One wears a navy jacket and the other a rust-orange
training outfit. Bent knees and offset feet make both stances readable.
Draw them at a matching pixel scale with square pixels, bold dark stepped
outlines, and two or three flat shades per material. Keep the arms and
torsos distinct. Transparent background, crisp nearest-neighbor upscale.
```
