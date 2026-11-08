---
name: blueprint
description: Write image-generation prompts that render a subject as a technical blueprint (white linework on a blue grid, with measurements and annotations). Use when the user asks for blueprint, technical drawing, schematic, engineering sketch or "patent drawing" versions of a character, product or scene.
---

# Blueprint / Technical Drawing

## What it looks like
- White or pale cyan line drawing on deep blueprint blue
- Faint square grid in the background
- Dimension lines, arrows, measurements and handwritten-style labels
- Sometimes several views (front, side, detail callouts) on one sheet
- A title block in a corner, like an engineering drawing

## Prompt template
```
[SUBJECT] as a technical blueprint, white linework on blueprint blue background,
faint grid, dimension lines and arrows, measurement annotations,
labelled callouts, title block in the corner, engineering drawing,
[OPTIONAL: front and side views]
```

## Must include
- `blueprint`, `white linework`, `blue background`, `grid`
- `dimension lines` and `annotations`, which make it read as technical
- A title block or labels for authenticity

## Avoid (negative prompt)
`colour fills, shading, photo, 3d render, painterly, gradients`

## Palette tips
Two colours only: deep blue (#1E3A6E-ish) and white/pale cyan lines. Optionally add one red accent for highlighted callouts.

## Keeping a character consistent
Describe the same pose and outfit, then add funny "technical" labels that name features (`curly hair, 2x`, `yellow jacket, waterproof`, `good dog`). Labels are what make this style fun on social media.

## Example
```
A girl with curly hair in a jacket and jeans, arms raised, jumping with a
fluffy dog, technical blueprint, white linework on deep blue background,
faint grid, dimension lines, labelled callouts like "jump height" and "good dog",
title block reading "JOY-01" in the corner, engineering drawing
```
