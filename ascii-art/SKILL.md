---
name: ascii-art
description: Draw characters, scenes, logos and text banners directly as ASCII art or Unicode block "terminal pixel art" (the chunky style of the Claude Code mascot), build animated colour ASCII art in the browser (dense, dithered, tinted text rendered live from a canvas scene, like a magenta and teal ASCII poster), and write image prompts that imitate ASCII art. Use when the user asks for ASCII art, text art, terminal art, block art, ANSI art, a CLI banner, a character "made of characters", or a colourful or animated ASCII version of a scene or image.
---

# ASCII Art & Terminal Block Art

Modes 1–3 are **drawn as text by Claude directly**, with no image model needed. Mode 4 is **code**: a web page that renders a live scene as colour ASCII. Pick the mode the user wants. Default to **Classic ASCII** for text answers, and to **Colour ASCII** when they want something colourful, animated, or "like this reference" for a dense, tinted ASCII image.

| Mode | Characters | Looks like | Best for |
|---|---|---|---|
| Classic ASCII | Keyboard only: `/ \ \| _ - ( ) o O . ' ^ ~ #` | Line drawing made of text | READMEs, code comments, any font |
| Shaded ASCII | Brightness ramp: ` .:-=+*#%@` | Greyscale picture made of text | Portraits, photos to text |
| Unicode block art | `█ ▀ ▄ ▌ ▐ ▘ ▝ ▖ ▗ ▛ ▜ ▙ ▟` | Chunky pixel sprite (Claude Code mascot style) | Mascots, logos, CLI splash screens |
| Colour ASCII (code) | Ink ramp ` .,:;-=+*xo%#@`, tinted per cell | Dense dithered poster made of coloured text, animated | Web pages, animated art, "make this colourful ASCII" |

## Rules for modes 1–3 (text answers)
1. **Always output inside a fenced code block**, because it needs a monospace font or the alignment breaks.
2. **Keep it narrow:** at most 40 columns for small art and 80 for banners, so it fits terminals and phones.
3. **Pad every line with spaces to the same width**, then re-check that each row lines up vertically with the rows above and below.
4. **Escape nothing:** inside a code block, `\` and `_` are safe.
5. **Silhouette first:** draw the outer shape, then add a few interior details (eyes, mouth, limbs). Less detail reads better.
6. **Use no tabs.** Use spaces only.

## Mode 1: Classic ASCII
Use slashes and pipes for limbs, `o O @` for heads and eyes, `_ -` for flat edges, and `( )` for round shapes.
```
   \o/
    |        ^..^__
   / \        \___ )~
              // \\
```

## Mode 2: Shaded ASCII
Map brightness to the ramp, dark to light: `@%#*+=-:. ` (reverse it for dark terminals). Each text cell is about twice as tall as it is wide, so use **2 columns per 1 row** to keep proportions round.
```
      .:-==-:.
    :*%@@@@@@%*:
   =@@@#*++*#@@@=
   %@@*  ..  *@@%
   =@@@#*++*#@@@=
    :*%@@@@@@%*:
      .:-==-:.
```

## Mode 3: Unicode block art (terminal pixel art)
This is the style of the Claude Code mascot. Each character cell holds a **2×2 grid of "pixels"**:
1. Sketch the sprite on a small pixel grid (8–16 pixels wide).
2. Take the pixels 2 columns × 2 rows at a time.
3. Replace each 2×2 group with the matching quadrant character:

| Filled pixels | Char | | Filled pixels | Char |
|---|---|---|---|---|
| none | (space) | | top-left only | `▘` |
| all four | `█` | | top-right only | `▝` |
| top row | `▀` | | bottom-left only | `▖` |
| bottom row | `▄` | | bottom-right only | `▗` |
| left column | `▌` | | all but bottom-right | `▛` |
| right column | `▐` | | all but bottom-left | `▜` |
| all but top-right | `▙` | | all but top-left | `▟` |
| top-left + bottom-right | `▚` | | top-right + bottom-left | `▞` |

Example sprite (a small creature, 3 rows):
```
 ▐▛███▜▌
▝▜█████▛▘
  ▘▘ ▝▝
```
**Colour:** block art is usually one flat colour on a dark background. For a terminal, wrap it in an ANSI truecolor code, e.g. `\x1b[38;2;215;119;87m` … `\x1b[0m` for Claude's terracotta orange (`#D77757`).

## Text banners
For big text, build letters 5 rows tall with `█` blocks, or with classic `| _ / \` strokes. Keep a gap of 1 space between letters and make every letter the same height.
```
█▀▀ █   ▄▀█ █ █ █▀▄ █▀▀
█▄▄ █▄▄ █▀█ █▄█ █▄▀ ██▄
```

## Mode 4: Colour ASCII (rendered live from a canvas)
Use this for the dense, colourful, dithered ASCII look: every cell filled with a character whose **density** follows the picture's light and dark, tinted from a small set of **gradient palettes** (magenta / pink, teal, gold). Hand-placing characters can't get that detail, so draw the subject with ordinary canvas code and let the renderer convert it every frame.

1. **Copy `scripts/ascii-renderer.js`** next to the page. Read `references/colour-ascii.md` for the full method, tuning and pitfalls.
2. **Draw the scene on a hidden source canvas** (about 480×360) with plain canvas calls: paths, gradients, circles, sprites. Leave the background transparent. Give the subject strong, saturated colours and dark outlines. Saturation and contrast become density and colour.
3. **Create the renderer** and call it each frame, capped at about 20 fps:
   ```js
   const ascii = AsciiRenderer.create({ source, output, cols: 170, size: .5, theme: 'light' });
   function frame(ms) { drawScene(ms / 1000); ascii.render(); requestAnimationFrame(frame); }
   ```
   - `theme: 'light'` is ink on white: dark and saturated areas get dense, deep-coloured glyphs.
   - `theme: 'dark'` is a glowing poster on near-black: bright areas get dense, light glyphs.
   - `size` is the fraction of the window the art fills. `cols` is detail: 150–240, where more columns means smaller characters.
4. **Text on top:** `ascii.textBox(x, y, 'Hello!', { shout, placed })` draws a speech box made of characters, and `ascii.bigText(x, y, 'BOOM!')` draws a title. Share one `placed` array per frame so boxes never overlap.
5. **Check a screenshot.** The subject should be the most saturated, densest thing on screen. If it washes out, raise its saturation or darken its outline in the source drawing rather than tuning the renderer.

Two complete animated examples:
- `examples/butterfly/index.html`: a magenta-and-orange butterfly over swaying flowers, using the built-in light theme.
- `examples/watercolor-butterfly/index.html`: a single watercolour-style butterfly (dark indigo edges, pale cyan and lavender wings, veins) recreated from a reference image, with a **custom theme** whose palettes match that reference. Copy this one when the user says "make it like this picture".

## Image-prompt variant (ASCII look as a picture)
When the user wants an image that *looks like* ASCII art (for a poster or social post):
```
[SUBJECT] rendered as ASCII art, made entirely of monospace text characters,
green phosphor characters on black terminal screen, CRT scanlines, slight glow
```
Avoid: `smooth shading, photo, painted, gradients, blurry text`

## Self-check before answering (modes 1–3)
- Does every row have the same width, and do the vertical strokes line up?
- Does it read at a glance, even when squinting?
- Is it inside a code block, with no tabs?
- For block art: did you use only quadrant and block characters, never mixing in ASCII letters?

## Self-check for Colour ASCII (mode 4)
- Is the scene drawn by code on a hidden source canvas, with a transparent background?
- Is the subject the densest, most colourful area, with the background light (white theme) or dark (dark theme)?
- Are the characters still readable at the chosen `cols` and `size`?
- Did you look at a screenshot while it animates?
