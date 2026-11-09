---
name: needle-felt
description: Make characters, animals and scenes look like needle-felted wool figures (fuzzy, handmade, soft craft look). Two modes - build it live in code with the bundled FeltGL engine (Three.js shell fur, animated scenes, voices and quote bubbles) or write an image-generation prompt. Use when the user asks for felt, wool, fuzzy, needle felt, handmade-craft or "cute plush figure" versions of a character, animal or scene.
---

# Needle-Felted Wool

## What it looks like
- Figures made of compressed wool fibres: soft, fuzzy, slightly lumpy, rounded shapes
- Stray fibres at the edges, a matte surface, no hard lines or outlines
- Tiny handmade imperfections (uneven seams, small asymmetry)
- Muted natural wool colours, with props also made of felt
- Shot like a real craft photo: soft window light, often on a bed of wool roving

## When the user gives a reference image (do this first)
The skill gives the **style**; the reference decides the **content, layout, density and mood**. Before building anything, follow `references/reference-workflow.md`:
1. **Intent:** work out what the user wants out (match closely or just inspired, still or animated or interactive, auto-play for recording, aspect ratio, sound).
2. **Analyse:** write a reference brief: camera, composition, layers from back to front, an inventory with counts, palette, light, texture and motion ideas. Small repeated details (text, sparkles, particles) often make up most of the look, so count them.
3. **Map:** decide how each item is built with this skill. Write custom code for anything the skill doesn't cover rather than leaving it out.
4. **Build in layers, then verify:** compare a screenshot side by side with the reference, score every inventory item, fix the biggest differences, and repeat at least twice. Use `references/style-checks.md` for this style's common misses, their fixes and a final checklist.
5. **Deliver:** say what matches, what differs and why.

## Pick a mode
| The user wants | Mode |
|---|---|
| A web page, animation, "make it in code", "no PNG", something that moves or can be spun | **Mode 1: code (FeltGL)** |
| A still image from an image model | **Mode 2: image prompt** |

---

## Mode 1: build it in code (FeltGL)
Everything is built from simple shapes in code: never load images or 3D models.

Files in this skill:
- `scripts/felt-gl.js`: the engine. `FeltGL.create(scene)` gives `felt(geometry, colour, { len, density, aspect })`, which turns any Three.js geometry into fuzzy wool (instanced shell fur in one draw call), plus `blobShadow(w, d)`. `FeltGL.rovingTexture()` makes a pink wool-roving backdrop
- `scripts/felt-audio.js`: a ukulele-style music loop plus squeaky gibberish character voices and small sound effects, all synthesised (no recordings)
- `scripts/lofi-audio.js`: a mellow lo-fi hip-hop loop for calm, dreamy scenes: electric-piano chords, soft bass, swung dusty drums, a music-box melody, vinyl crackle and tape wobble (`LofiAudio.start()` after a tap, `LofiAudio.setEnabled(on)`)
- `references/felt-code.md`: how shell fur works, tuning fur length and fibre density, building characters from shapes, animation, quote bubbles, the **storybook-scene recipe** (painted backdrop, glow, sparkles, glitter, dotted trails, handwriting) and testing
- `references/reference-workflow.md`: how to analyse a reference image, build from it and check the result against it
- `examples/paper-plane-dream/`: a storybook illustration in felt, built from a reference. A child rides a glowing paper plane covered in handwriting through a night sky dense with felt stars, a crescent moon, warm and blue clouds, lanterns with light trails, twinkling sparkles, gold glitter, dotted constellations and floating words. Everything moves on its own, with lo-fi music on the first tap (H hides the button for recording). Use it as the template for illustration-style scenes
- `examples/felt-football/`: a felt football stadium (striped pitch, goals with nets, stands with a pom-pom crowd, banner) where eleven little yellow felt guys play. Strikers pass and shoot, the goalie dives, and a GOAL! celebration follows; a defender, referee, banana chase and fans fill the scene, with voices and quote bubbles

Steps:
1. Load Three.js r128 from the CDN, then `felt-gl.js` (and `felt-audio.js` for sound). Copy the `<script>` tags from the example.
2. `const F = FeltGL.create(scene)`, and set `scene.background = FeltGL.rovingTexture()` (or a plain felt colour).
3. Build each character from simple shapes (lathe capsule body, spheres, tori, tubes), each wrapped in `F.felt(...)`. Group the limbs on pivots (shoulder, hip) so they can swing.
4. Tune the wool so the fibres read at the size they appear on screen: about one fibre per screen pixel (see the reference). Give layered parts (clothes over a body) a slightly bigger radius than the part underneath, so its fibres don't poke through.
5. Animate in a loop: hops, waddles, waves, blinks, a mouth that opens while talking. Put a `blobShadow` under each figure.
6. For speech, draw quote bubbles on a 2D overlay canvas above the speaker (project the head position), and play a voice from `felt-audio.js` at the same moment.
7. For illustration-style scenes (a busy, dreamy picture rather than a few characters), add the atmosphere layers from the storybook-scene recipe. Felt is only the material; the look of a reference often comes mostly from glow, particles and painted detail around the felt objects.
8. Check it in a browser, zoom in on the fibres, and fix any parts where the fur looks smooth (density too high) or noisy (fur too long). If there's a reference image, compare side by side as described in `references/reference-workflow.md`.

---

## Mode 2: image prompt

### Prompt template
```
[SUBJECT] as a needle felted wool figure, fuzzy wool texture, visible stray fibres,
handmade craft, soft rounded shapes, macro photography, shallow depth of field,
soft natural window light, felt props, [BACKGROUND]
```

### Must include
- `needle felted`, `wool`, `fuzzy texture`
- `macro photography` and `shallow depth of field`, which make it read as a real object
- Felt versions of the background props

### Avoid (negative prompt)
`plastic, glossy, smooth, cgi, sharp edges, cartoon outlines, metal`

### Example
```
A girl with curly dark hair, yellow jacket and blue jeans, arms raised, jumping
with a white fluffy dog, needle felted wool figures, fuzzy texture, visible fibres,
felt clouds and felt sun on a sky-blue felt backdrop, macro photography,
shallow depth of field, soft window light
```

---

## Palette tips
Soft, slightly muted wool tones: cream, oatmeal, dusty blue, mustard yellow, rose pink. Avoid neon colours, which don't exist in natural wool.

## Keeping a character consistent
Keep the character's shape recipe and colours identical (capsule height, eye count, hair strands, overall colour). In prompts, say "felted yellow jacket" so the material carries over to every part of the figure.
