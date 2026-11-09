---
name: ukiyo-e
description: Make subjects and scenes look like Japanese ukiyo-e woodblock prints (flat colour, bold ink outlines, bokashi skies, washi paper). Two modes - build an explorable, animated 3D woodblock world in code with Three.js toon shaders (waves, ships, mountain, auto camera film for recording, koto music) or write an image-generation prompt. Use when the user asks for ukiyo-e, Japanese woodblock, Edo-period print or "Hokusai-like" versions of a character or scene.
---

# Ukiyo-e Woodblock Print

## What it looks like
- Flat areas of colour with no soft shading (the only gradients are bokashi skies)
- Bold, confident dark ink outlines (the "key block")
- Washi paper grain, woodgrain, and slight colour misregistration
- Stylised water: carved parallel wave lines, clawed foam, spray dots
- Traditional pigments, with a vertical title cartouche and a red seal in a corner

## When the user gives a reference image (do this first)
The skill gives the **style**; the reference decides the **content, layout, density and mood**. Before building anything, follow `references/reference-workflow.md`:
1. **Intent:** work out what the user wants out (match closely or just inspired, still or animated or interactive, auto-play for recording, aspect ratio, sound).
2. **Analyse:** write a reference brief: camera, composition, layers from back to front, an inventory with counts, palette, light, texture and motion ideas. Small repeated details (text, sparkles, particles) often make up most of the look, so count them.
3. **Map:** decide how each item is built with this skill. Write custom code for anything the skill doesn't cover rather than leaving it out.
4. **Build in layers, then verify:** compare a screenshot side by side with the reference, score every inventory item, fix the biggest differences, and repeat at least twice.
5. **Deliver:** say what matches, what differs and why.

## Pick a mode
| The user wants | Mode |
|---|---|
| A web page, animation, something to explore or record, "make it 3D", "no PNG" | **Mode 1: code (3D woodblock world)** |
| A still image from an image model | **Mode 2: image prompt** |

---

## Mode 1: build it in code (Three.js, woodblock toon style)
Everything is built from code: no images or 3D models.

Files in this skill:
- `examples/sea-3d/`: an explorable 3D ukiyo-e sea. It has:
  - a toon-shaded ocean with carved water lines and foam crests that streams past the ships
  - three tall ships (dark hull, gunports, three masts, billowing square sails, rigging, pennants) holding course for a snow-capped mountain, each with a crew of 10 and a foam wake
  - a bokashi sky printed in flat steps, birds, and washi paper multiplied over the view
  - view arrows, drag and zoom, an automatic tour, and a scripted 30-second camera film that plays on load (R replays it, H hides the controls)
- `scripts/ukiyo-audio.js`: a koto-and-bamboo-flute loop in a Japanese "in" scale, printing sounds (paper, block knock, baren swish, stamp), ambience (waves, wind, rain, night) and a crane call, all synthesised
- `references/woodblock-3d.md`: the shader recipes (flat bands, outline rim, carved lines, foam, sky steps), the paper overlay, building ships and crews from primitives, the flowing-sea trick, camera views and the film system

Steps:
1. Load Three.js r128 from the CDN, plus `ukiyo-audio.js` if you want sound. Copy the page structure from `examples/sea-3d/index.html`: a full-window stage, then HTML overlays for paper, vignette, frame, title cartouche and seal.
2. Use the toon shaders from the example (`toon()` for solid objects, the ocean shader for water, the stepped sky dome). Use only 2–3 flat colour bands per material, plus a dark rim for outlines.
3. Build scene objects from primitives (lathe, extrude, boxes, cylinders, custom swept surfaces). Characters and crews are small groups of capsules and spheres with hats and headbands.
4. For motion without looping jumps, keep ships in place and make the water pattern flow past (`FLOW`), with wakes behind the sterns.
5. Add views relative to the hero object, an automatic tour, and a scripted film (time-keyed camera path on a Catmull-Rom curve) so the user can record without touching the mouse.
6. Check in a browser: each view, the film at a few timestamps, and no console errors.

**Look rules:** no smooth gradients on objects, no glossy highlights, no bloom. Use Prussian blue, indigo, vermilion, ochre and sumi black on off-white paper. Keep the paper texture and printed border over everything.

---

## Mode 2: image prompt

### Prompt template
```
[SUBJECT], ukiyo-e woodblock print, Edo period style, flat colours,
bold black ink outlines, bokashi gradient sky, stylised swirling clouds,
washi paper texture, slight print misregistration, traditional pigments
```

### Must include
- `ukiyo-e woodblock print`, `flat colours`, `ink outlines`
- `washi paper texture`, which gives it the printed feel
- Stylised natural elements (waves, clouds, wind lines)

### Avoid (negative prompt)
`3d render, photorealistic, glossy, airbrushed, digital gradient shading, anime cel shading`

### Example
```
A girl with curly dark hair in a yellow jacket and blue jeans, arms raised,
leaping with a white fluffy dog, ukiyo-e woodblock print, flat colours,
bold black ink outlines, swirling stylised clouds, red sun disc,
bokashi blue gradient sky, washi paper texture
```

---

## Palette tips
Prussian blue, indigo, vermilion red, ochre yellow, sumi black, and an off-white paper colour.

## Keeping a character consistent
Keep the modern clothing in the description ("yellow jacket, jeans"). Modern subjects in a traditional print style look striking, so don't swap them for kimono unless asked.
