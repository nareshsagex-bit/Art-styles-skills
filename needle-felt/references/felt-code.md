# FeltGL reference

## Page setup
```html
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script defer src="felt-audio.js"></script>   <!-- optional: music, voices, sfx -->
<script defer src="felt-gl.js"></script>
<script defer src="your-scene.js"></script>
```

## How the wool works (shell fur)
`F.felt(geometry, colour, opts)` returns one mesh that draws the geometry about 29 times in a single instanced call. Each copy (a "shell") is pushed out along the normals by `layer × len`. A fibre-noise texture decides which pixels of each shell survive, so fewer survive the further out the shell is. The surviving pixels stack into little strands, and the outermost ones become stray fibres at the silhouette. Lower layers are darkened (fake occlusion), and a rim term gives the soft fuzzy halo.

| Option | Meaning | Typical |
|---|---|---|
| `len` | fur length in world units | .03 (eyes, mouth) – .1 (body, clothes) |
| `density` | fibre texture repeats per UV unit | pick it so one texel is about one screen pixel |
| `aspect` | extra repeats along U (wide UV wraps like lathes and tori) | lathe body 2.4, torus 3–7 |

**Getting density right.** Fibre texel size on screen ≈ (part size in px) / (256 × density). Aim for about 1 px:
- Too high (for example 40 on a body): fibres are sub-pixel and average out, so the part looks like smooth plastic.
- Too low: big blotchy clumps.
- A body about 200 px wide works well around 3, eyes around 1.2, small spheres .5–1.

**Layered parts.** Clothes need a slightly larger radius than the body, plus their own fur (overalls at ×1.085 with `len` .1 over a body with `len` .075). Otherwise yellow fibres poke through the blue.

## Building characters from shapes
- **Capsule body:** `THREE.LatheGeometry` from a profile (a squashed bottom quarter circle, straight sides with extra points so overalls can be cut from it, and a round top).
- **Clothes:** filter the same profile below a height and scale it out a little; a front bib is a partial `CylinderGeometry`.
- **Goggles:** a torus rim, a flattened sphere eye and a small black sphere pupil, in a group turned to face along the surface normal. A strap is a torus arc that leaves a gap at the front.
- **Smile:** `TubeGeometry` along a curve hugging the face. An "open mouth" sphere is shown while talking.
- **Limbs:** a group on a pivot (shoulder or hip) with the limb and mitten or foot inside. Rotate the pivot to wave, kick or walk.
- **Hair:** a few thin dark tubes.
- **Props:** a felt ball, a banana tube with brown tips, felt flags, goal posts, pitch stripes as felt planes, and white felt line strips.

## Animation patterns (see `examples/felt-football/felt.js`)
- Keep one clock and fire one-off events when it crosses a time inside a repeating period (`crossed(period, at)`).
- Story beats: passes, a shot, the goalie dives the wrong way, a celebration, then reset. Background loops (a chase lap, fans bouncing, a crowd of pom-poms) run on their own periods.
- Hops are vertical offsets. The waddle is the feet pivots swinging in opposite phase. Blink by squashing the eye scale.y for 0.13 s every few seconds.
- The blob shadow shrinks while a figure is in the air.

## Voices and quote bubbles
`felt-audio.js`:
- `FeltAudio.start()` (after a tap)
- `FeltAudio.voice(name, pitch)`, where name is one of `beedo`, `bello`, `whee`, `giggle`, `banana`, `yay`, `lala`, `oops`
- `FeltAudio.sfx('kick' | 'boing' | 'pop')`
- `FeltAudio.setEnabled(on)`

Voices are sawtooth buzzes through two vowel-formant band-pass filters, with vibrato and pitch glides. Give each character its own pitch.

For quote bubbles, add a 2D canvas over the WebGL canvas. Each frame, project each speaker's head position with `vector.project(camera)` and draw a rounded bubble with a tail, popping it in and out over about 1.6 s. Big event text (like "GOAL!") goes centred at the top.

## Performance
Each felt part is one draw call. The example has about 11 characters × about 20 parts, plus the stadium and crowd: about 300 draw calls, 18–20 ms per frame in a hidden test window. Lower `layers` in `FeltGL.create(scene, { layers: 20 })` if needed.

## Testing in a hidden browser
`requestAnimationFrame` pauses in hidden tabs. The example exposes `window.feltStep(ms)` to render a frame by hand: pass increasing `ms` values above `performance.now()`.

## Storybook-scene recipe (illustrations, not just characters)
A dreamy illustration reads as "finished" because of layers around the felt objects. See `examples/paper-plane-dream/dream.js`.

| Layer | How |
|---|---|
| Painted backdrop | A canvas texture as `scene.background`: a gradient, then thousands of short curved brush dabs in 5–6 related colours following a swirl flow (`angle = sin(x*.006)*1.6 + cos(y*.008)*1.3`), lines of faint handwriting across the whole frame, gold specks and little four-point sparkles |
| Felt objects | Clouds as clusters of felt spheres (cool colours high up, warm cream ones low down as if lit from below), stars as bevelled `ExtrudeGeometry` stars, a crescent moon from a two-arc `Shape`, lanterns as small cylinders. Use `material.side = DoubleSide` for flat felt shapes |
| Glow | Additive `Sprite`s with a radial-gradient texture behind anything that shines (moon, stars, lanterns, the hero). Two stacked glows (a wide soft one and a small bright one) give a convincing warm halo |
| Text on objects | Handwriting drawn into a transparent canvas texture on a plane just in front of a cloud, or on the hero (same geometry, `polygonOffset`, slightly scaled up) |
| Sparkles | `Points` with an additive four-point sparkle texture, in 2–3 groups whose opacity pulses out of step |
| Glitter | 300+ tiny additive points drifting slowly upward, wrapping at the top |
| Dotted trails | Points sampled along a `CatmullRomCurve3` (constellations), or a chain that follows a moving object (light strings under lanterns) |
| Floating words | Text textures on planes that drift sideways and bob |
| Motion | The hero bobs and banks; clouds drift past and wrap; stars scale-pulse; lanterns rise and restart; a shooting star every few seconds; a slow camera drift with a `ZOOM` factor for framing |

Density guide: match the reference's counts. The paper-plane scene uses about 28 felt stars, 135 sparkles, 320 glitter points, 3 constellations, 4 lanterns with trails, 20 floating words, plus 900 painted specks and handwriting across the backdrop.
