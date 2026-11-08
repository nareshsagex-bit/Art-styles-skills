---
name: ascii-art
description: Draw characters, scenes, logos and text banners directly as ASCII art or Unicode block "terminal pixel art" (the chunky style of the Claude Code mascot), and write image prompts that imitate ASCII art. Use when the user asks for ASCII art, text art, terminal art, block art, ANSI art, a CLI banner, or a character "made of characters".
---

# ASCII Art & Terminal Block Art

This style is **drawn as text by Claude directly**, with no image model needed. There are three modes. Pick the one the user wants, or default to **Classic ASCII**.

| Mode | Characters | Looks like | Best for |
|---|---|---|---|
| Classic ASCII | Keyboard only: `/ \ \| _ - ( ) o O . ' ^ ~ #` | Line drawing made of text | READMEs, code comments, any font |
| Shaded ASCII | Brightness ramp: ` .:-=+*#%@` | Greyscale picture made of text | Portraits, photos to text |
| Unicode block art | `█ ▀ ▄ ▌ ▐ ▘ ▝ ▖ ▗ ▛ ▜ ▙ ▟` | Chunky pixel sprite (Claude Code mascot style) | Mascots, logos, CLI splash screens |

## Rules for every mode
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

## Image-prompt variant (ASCII look as a picture)
When the user wants an image that *looks like* ASCII art (for a poster or social post):
```
[SUBJECT] rendered as ASCII art, made entirely of monospace text characters,
green phosphor characters on black terminal screen, CRT scanlines, slight glow
```
Avoid: `smooth shading, photo, painted, gradients, blurry text`

## Self-check before answering
- Does every row have the same width, and do the vertical strokes line up?
- Does it read at a glance, even when squinting?
- Is it inside a code block, with no tabs?
- For block art: did you use only quadrant and block characters, never mixing in ASCII letters?
