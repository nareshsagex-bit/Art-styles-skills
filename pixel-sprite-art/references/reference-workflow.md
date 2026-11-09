# Building from a reference image

Use this every time the user gives a reference image and asks for it in this skill's style. The art style comes from the skill. The **content, composition, density and mood** come from the reference. Most misses happen because the main objects get built and the rest of the image is skipped.

Work through the five steps in order. Don't show the result to the user until step 4 passes.

---

## 0. Understand what the user wants out
The same reference can mean different deliverables. Read the request for these. Ask only about the ones that are genuinely unclear, and pick sensible defaults for the rest.

| Question | Typical answers |
|---|---|
| Fidelity | "Same as this image" (match layout and details closely) or "inspired by" (same idea, your own layout) |
| Medium | Still picture, looping animation, interactive (drag or zoom), a scene to record |
| Motion | What should move, and does it start on its own? (For recording, it must play automatically with no clicks) |
| Frame | Aspect ratio (portrait like the reference? full screen?) and how much of the window it fills |
| Extras | Sound, text or captions, UI (or a clean frame for recording) |

Default when unsure: match the reference closely, same aspect ratio, gentle looping motion that starts automatically, no UI.

## 1. Analyse the reference (write it down)
Look at the image and fill in a **reference brief** before writing any code. Be concrete: name colours, count things and give positions as fractions of the frame.

```
REFERENCE BRIEF
Subject / story:   one line: who is doing what, where
Camera:            angle (eye level / 3-4 top-down / side), lens (wide / close), framing
Composition:       where the main subject sits (e.g. centre, 45% from left), what fills each third
Layers (back→front):
  1 background:    e.g. night sky, brushy blue strokes, handwriting, gold specks
  2 far:           e.g. moon top-right (15% of width), small stars
  3 mid:           e.g. blue clouds left and right
  4 hero:          e.g. glowing paper plane + child, centre
  5 foreground:    e.g. warm lit clouds bottom-left and bottom-right
  6 atmosphere:    e.g. sparkles, glitter, dotted trails, lanterns, floating text
Inventory + counts: every distinct thing, with an approximate count
  e.g. big stars 12, tiny sparkles 80+, lanterns 3, words of handwriting 100+
Palette:           5-8 hex colours (sampled), plus the accent and glow colours
Light:             where light comes from, what glows, how dark the edges are
Texture / detail:  what makes it look "finished" (outlines, grain, strokes, rim light)
Motion ideas:      what would naturally move (drift, twinkle, flicker, bob, fly)
```

The **atmosphere layer and the counts** matter most. A reference that "has lots going on" usually owes most of that to small repeated details: text, sparkles, specks, particles. Write the counts down so you can match the density.

## 2. Map the brief to this skill
For each line in the brief, decide how it will be built:
- **Covered by the skill** (engine functions, example code): note which function.
- **Not covered:** write the custom code needed (glow sprites, particles, text overlays, a special shape). Say so in your notes. Never just drop an item because the skill lacks it.
- **Can't be done well:** pick the closest substitute and tell the user in step 5.

## 3. Build in layers, back to front
Build the layers in brief order: background, far, mid, hero, foreground, atmosphere, then motion. Get the composition (camera, framing, positions, sizes) right with the big shapes before adding detail.

## 4. Verify against the reference (at least two rounds)
1. Render it, take a screenshot at the same aspect ratio, and look at it next to the reference.
2. Go through the inventory and score each item: **present? right size? right place? right colour? right amount?**
3. Check the overall read: density (busy or calm, matching the reference), light (the same things glow, edges equally dark), palette and mood.
4. Fix the three biggest differences, then repeat. Stop when nothing important differs, or after about three rounds.
5. Check for errors in the console and that the motion starts on its own if it's for recording.

Common misses to look for:
- Missing atmosphere: text, sparkles, glitter, trails, particles.
- Wrong camera angle: the subject seen side-on when the reference shows it from above, behind or ¾.
- Flat lighting: no glow, no dark vignette, no shadows.
- Wrong scale: the hero is too big or too small, or the scene is cropped tighter or wider.
- Style drift: the result looks like the engine's default example instead of the reference.

## 5. Deliver
Tell the user, in plain words:
- what you built and where to open it
- what matches the reference closely
- anything that differs or was substituted, and why
- how to adjust the obvious things (zoom, speed, density)
