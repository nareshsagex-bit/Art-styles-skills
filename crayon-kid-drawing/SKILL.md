---
name: crayon-kid-drawing
description: Make a subject look like a child's crayon drawing (wobbly lines, waxy texture, scribbly fills outside the lines, naive proportions on paper). Two modes - draw it live in code on an HTML canvas with the bundled CrayonKit engine (no images needed), or write an image-generation prompt. Use when the user asks for crayon, kid's drawing, child-like, naive art, "drawn by a 5-year-old" or fridge-drawing versions of a character or scene.
---

# Crayon / Kid Drawing

## What it looks like
- Wobbly, uneven lines with little gaps where the wax skipped the paper
- Scribbly back-and-forth colour fills that go outside the lines
- Waxy crayon texture with paper grain showing through
- Naive proportions: big head, tube limbs, simple `><` or dot eyes, huge open smile, blush
- Classic motifs (optional): corner sun with rays, sky strip on top, a strip or rectangle of grass
- Off-white paper, sometimes creased or taped up

## Pick a mode
| The user wants | Mode |
|---|---|
| A web page, animation, "make it in code", "no PNG", something that moves | **Mode 1: code (CrayonKit)** |
| A still image from an image model | **Mode 2: image prompt** |

---

## Mode 1: draw it in code (CrayonKit)
Everything is drawn on a canvas from code. Never load PNG/JPG sprites.

Files in this skill:
- `scripts/crayon-kit.js`: the engine (crayon line, scribble fill, paper, scene pieces, configurable kid figure, animation loop)
- `scripts/story-audio.js`: a synthesised kids' tune plus sound effects (pop, sparkle, kick, whoosh, boing, oops, cheer, propeller whirr), no audio files
- `references/code-drawing.md`: API, the kid `spec` options, how to build a custom character, tuning tips
- `examples/running-friends/`: five characters running across a rectangle of grass (four via `kid()`, one custom robot cat built from primitives)
- `examples/park-story/`: a seven-page animated picture story ("The Lost Ball") with captions, speech bubbles, poses, props, background music, sound cues, page dots, tap-to-turn and a fly-away ending with propeller hats. Use it as the template when the user wants a story, comic or sequence instead of a single picture

Steps:
1. Copy `scripts/crayon-kit.js` next to your page and load it with `<script defer>`. Load the Gaegu font from Google Fonts for kid handwriting.
2. Make a full-window `<canvas>` on a white page. Create the kit: `const kit = CrayonKit.create(canvas, { W, H, size: .9 })`. Pick W/H to fit the content tightly (no big empty paper).
3. Call `kit.start(t => { ... })` and draw back to front: ground (`field`, plus `skyStrip`/`sun` if wanted), then figures sorted by feet `y`, then text.
4. Turn each reference character into a `kid()` spec. Identity comes from **colours + one silhouette feature** (hair style, glasses, pointy nose, pigtails, body width). For non-human characters, write a custom function with `ell`/`line`/`fill`/`shape` (see the robot cat in the example).
5. For a story: write a `PAGES` list (caption, duration, a function of page progress `u` that returns who is where and in which pose), move people with an eased `mv(u, from, to, u0, u1)`, and add bubbles with `kit.bubble()`. Copy the clock, controls and page dots from `examples/park-story/story.js`. For sound, load `scripts/story-audio.js`, start it on the first tap (browsers block sound until then), give each page `cues: [[u, 'sfxName']]`, and add a mute button.
6. Open it in a browser, screenshot, zoom in on each figure and fix overlaps before finishing. If the browser pane is hidden, animation frames pause: call `CrayonKit.last.step(ms)` to draw frames by hand, and open a story at a page with `#3` in the URL.

Rules that keep it looking like a kid drew it:
- Use `shape(points, fill, outline)` for every part: scribble fill first, wobbly outline on top.
- Only crayon-box colours (`kit.K`). No gradients, shading, blur or clean vector strokes.
- Keep the "boil" on (lines re-roll about 6 times a second) so it feels hand-drawn even when still.
- Give every stroke its own seed number, so lines differ but stay stable between boils.
- Big heads (about 40% of height), stubby bodies, `><` happy eyes, giant red open mouth.

---

## Mode 2: image prompt

### Prompt template
```
[SUBJECT] drawn by a 5-year-old child, crayon drawing, wobbly lines,
scribbly waxy colour fill outside the lines, naive proportions,
sun with rays in the corner, blue sky strip at the top, green grass strip,
white paper texture, [OPTIONAL: taped on a fridge]
```

### Must include
- `crayon drawing`, `child's drawing` or `drawn by a 5-year-old`
- `wobbly lines` and `colouring outside the lines`
- Classic kid motifs (corner sun, sky strip, grass strip), unless the user wants a bare scene

### Avoid (negative prompt)
`professional, clean lines, accurate anatomy, shading, 3d, digital, polished`

### Example
```
A girl with curly brown hair, yellow jacket and blue jeans, arms up, jumping
with a white fluffy dog, drawn by a 5-year-old child, crayon drawing,
wobbly lines, scribbly waxy fill outside the lines, big smiley faces,
yellow sun with rays in the corner, blue sky strip, green grass,
white paper texture
```

---

## Palette
Basic crayon-box colours only: red, yellow, orange, blue, sky, navy, green, lime, brown, pink, black. Bright and pure, never blended.

## Keeping a character consistent
In kid-drawing style, colours carry identity: keep each character's colour set identical everywhere (e.g. yellow shirt + blue shorts + round glasses). Add one silhouette feature per character so a group stays readable.
