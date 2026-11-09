# Pixel scenes: arena, depth, effects, dialogue

These are patterns from a working build: a floating ¾ top-down arena where two fighters spar while a crowd watches. Everything is drawn by code. Copy the snippets and adapt them.

## Canvas setup

```js
const W = 448, H = 320;            // world, in native pixels
const VW = 512, VH = 404;          // view = world + margin (sky, island underside)
const WX = 32, WY = 6;             // where the world sits inside the view
// Layers: stage (static, drawn once), decal (persistent marks: cracks, rubble), view (per frame)
function present() {               // scale view onto the real canvas
  const s = Math.min(screen.width / VW, screen.height / VH) * .9;   // .9 leaves white space around
  out.imageSmoothingEnabled = false;
  out.drawImage(view, ox, oy, VW * s, VH * s);
  // then draw text at this resolution (see Dialogue)
}
```
Draw anything static (sky, island, arena, trees, fence) **once** into `stage`. Per frame, draw stage, decal, then the dynamic things.

## Pixel primitives

```js
// Crisp filled ellipse: one fillRect per row, no anti-aliasing.
function pEllipse(g, c, cx, cy, rx, ry) {
  g.fillStyle = c; ry = Math.max(1, Math.round(ry));
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + .5)) ** 2)));
    if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
}
// 1 px ring: plot points around the ellipse.
function pRing(g, c, cx, cy, rx, ry) { /* n = rx * 5 points, fillRect 1x1 each */ }
```
Use a seeded random (`Math.imul(1664525, seed) + 1013904223`) for anything in the static stage, so it looks the same every load.

## The ¾ camera

One squash ratio rules the ground plane. With `ry / rx ≈ 0.62` you get a high ¾ view (round, deep), and with `≈ 0.4` a low, flatter view. Use the **same ratio** for:
- the island and arena ellipses
- shadows under characters (`pEllipse(x, y, 8, 4)`) and colour foot rings (`pRing(x, y, 10, 6)`)
- shockwave rings, crater shapes, and the `vy` spread of particles (`vy = sin(a) * speed * ratio`)
- distance checks (`hypot(dx, dy / ratio)`).

Mixing ratios is what makes a scene look "2D and sloppy".

## A round floating island

```js
const ISL = { cx: 224, cy: 170, A: 220, B: 142 };          // B / A = ratio
const isoD = (x, y) => Math.hypot((x - ISL.cx) / ISL.A, (y - ISL.cy) / ISL.B);
```
1. **Underside first, column by column.** For each x, take the rim point `top = cy + B * sqrt(1 - nx²)`. Below it paint, in order:
   - 3 px of dark grass lip
   - 15 px of earth, a **constant thickness** with a dark line at the top and two darker strata rows
   - rock down to a depth that tapers to a point: `22 + 60 * u^1.4` plus a little noise.

   Blend the colours from a lit left palette to a shaded right palette by `nx`, and finish with a dark bottom pixel.
2. **Roots and vines:** short wavy 1 px lines hanging from the earth band.
3. **Grass top**, pixel by pixel inside `isoD <= 1`:
   - three greens picked at random
   - soft concentric "mowing" rings: `floor(isoD * 10) & 1` picks a slightly lighter set
   - a bright rim where the pixel above is outside, a dark rim where the pixel below is outside
   - tufts and a few flower pixels.
4. Float it: translate the world by `round(sin(T * 1.1) * 2)` pixels each frame. Add a few tiny rocks bobbing beside it.

A square island works the same way with a diamond test (`|dx|/A + |dy|/B <= 1`) and two flat side faces (left lit, right shaded).

## The stone arena

```js
const P = { x: 224, y: 166, rx: 130, ry: 82, d: 18 };   // d = wall height
```
- **Wall:** for each x across the arena, draw `d` pixels down from the front rim. Interpolate the colour from light (left) to dark (right) in three depth bands. Add a 1 px light lip at the top and mortar lines at d = 6 and 12, with vertical seams offset per band.
- **Tiled top** via `getImageData` and per-pixel work. Convert to normalised polar coordinates, then:
  - Pick a **ring** from a band list (`[0, .15, .32, .5, .68, .84, .935, 1]`) and a **sector** (`6 + ring * 6` per ring, offset half a tile on odd rings).
  - Colour by a hash of (ring, sector) from 4 stone tones.
  - Draw a seam where the right or lower neighbour is in a different tile, and a highlight where the left or upper neighbour is.
  - Add ±5 noise, a darker outer rim, and a coloured centre circle.
- **Dirt ring** around the wall (two ellipses plus speckles), a **fence** of posts and two rails along the back half, and **banner poles** on the back rim.

## Depth sorting

Per frame, in this order:
1. stage, then decal
2. extras behind the arena (`y < P.y`), sorted by y
3. dust and ground rings
4. shadows and foot rings
5. projectiles
6. fighters sorted by y, each followed by its hand effect
7. sparks and rocks
8. extras in front, sorted by y.

Jumping is a separate `z`: draw the sprite at `y - z`, and keep the shadow at `y`, shrinking it as z grows.

## Crowds

```js
for (const [k, step] of [[.86, 24], [.76, 30]]) {        // two rings, as a fraction of the island
  // sample points on the ring every `step` px; skip if
  //   inside the arena + margin, within 30 px of a tree, within 22 px of another extra,
  //   or in the front arc (angle 1.15..2.0 rad) so the arena stays visible
}
```
Extras face the centre. They cheer (arms up, a 0–3 px hop) while a `hype` value is high, and stand watching otherwise. `PixelSprite.extra(i)` gives varied, deterministic looks.

## Effects (all pixels)

| Effect | Recipe |
|---|---|
| Hit spark | 6–30 particles, short streak from position to position − velocity × 0.03, plus a white flash ellipse with a cross |
| Dust | Small ellipses, alpha fades, size grows, velocity damped each frame |
| Rubble | Particles with gravity that bounce once, then stamp a pixel onto the decal layer and die |
| Shockwave | Expanding `pRing` at ground level, alpha fades |
| Crater | Onto the decal: three nested ellipses, a light rim, random-walk cracks clipped to the arena |
| Energy orb | Glow ellipse at 35% alpha, then base, mid and core ellipses; 5 white pixels orbit at `T * 18` |
| Lightning | 3–9 jagged 3-segment bolts from the hand, a 2 px blue under a 1 px white line, regenerated every frame |
| Screen shake | Translate the world by `round(random(-1..1) * shake)`, with `shake *= 0.02^dt` |
| Flash | Full-view white rectangle at `flash * 0.85` alpha, fading out over about 0.5 s |

## Fight director

A list of **beats**, each with `dur`, `next`, optional `enter()`, `update(dt)` and `exit()`:

`circle → rush → clash → knock → shuriken → aerial → charge → final → boom → recover → circle`

- **circle:** strafe around the midpoint.
- **rush:** run at each other; switch to clash when close.
- **clash:** random punch, kick and punch2 every 0.1 s, with sparks.
- **knock:** the loser slides back.
- **shuriken:** both jump back and throw; projectiles collide in mid-air or stick in the floor.
- **aerial:** a jump-and-meet with a big spark.
- **charge:** both power up.
- **final:** a dash.
- **boom:** flash, shake, rubble and crater.

Characters carry `x, y, z, vx, vy, vz, face, pose, hurt`. Physics applies gravity in the air and friction on the ground, and clamps characters inside the arena ellipse. Clear the decal every few loops.

## Dialogue that stays readable

- Load "Press Start 2P" (Google Fonts) and call `document.fonts.load('12px "Press Start 2P"')`.
- Draw bubbles **after** `present()` scales the view, on the full-resolution canvas. Convert world to screen with `ox + (WX + x) * s` and `oy + (WY + bob + y - z) * s`.
- Size: `fs = max(10, s * 4.8)` for normal lines, `s * 5.4` for shouts. Use padding `0.7 * fs` and a chamfered dark border `max(2, s * .9)` thick, with a tail pointing at the speaker.
- Shouts (move names, "NAME!!") get a yellow fill and red text, a 1 px jitter, and burst ticks.
- **Layout:** place the fighters' bubbles first, then the extras'. If a bubble overlaps one already placed, slide it to its speaker's side, then stack it upward.
- Impact words ("BAM!", "KA-BOOM!"): large font, thick dark stroke, yellow fill, drifting up as they fade.
- Open the speaker's mouth (`opt.talk`) while their bubble is up.

## Verify

Screenshot at least two moments: a quiet one and a peak effect. Check: text readable, no overlaps, nobody standing on an edge, consistent squash, crisp pixels when zoomed, no console errors.
