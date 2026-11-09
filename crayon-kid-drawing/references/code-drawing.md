# CrayonKit reference

```js
const kit = CrayonKit.create(canvas, {
  W: 1180, H: 470,     // paper size in drawing units
  size: .9,            // share of the window the paper fills
  boil: 6,             // line re-rolls per second (0 = still)
  paper: true,         // false = draw straight on the page (no sheet, shadow or tape)
  fps: 30, tape: true, background: '#ffffff', colors: { /* override or add crayons */ }
});
kit.start(t => { /* draw the scene; t = seconds */ });
```

## Primitives
| Call | Does |
|---|---|
| `ell(cx, cy, rx, ry, n, a0, a1)` | Points on an ellipse or arc |
| `line(pts, color, width, seed, closed)` | Waxy wobbly crayon stroke |
| `fill(pts, color, seed, {gap, angle, w, over})` | Scribbled hatch fill. `over` > 1 spills outside the lines; `angle` sets hatch direction; `gap`/`w` set density |
| `shape(pts, fill, outline, seed, outlineWidth, fillOpts)` | Fill, then outline (either colour may be `null`) |
| `text(str, x, y, {color, size, angle})` | Kid handwriting (Gaegu) |

Seeds: give every stroke a different integer. Outlines use `seed + 1`, so step seeds by 2 or more.

## Scene pieces
| Call | Does |
|---|---|
| `field({x, y, w, h, t, speed, tufts, flowers})` | Outlined rectangle of grass; tufts scroll left at `speed` to suggest running. Returns the rect |
| `skyStrip({bottom, t, clouds})` | Scribbled sky strip across the top with drifting outlined clouds |
| `sun({x, y, r, t, face})` | Corner sun with turning rays |
| `cloud(x, y, scale, seed)` | One outlined cloud |
| `shadow(x, y, w, seed)` | Scribbled shadow under a figure |

## `kid(spec, x, y, t)`
`x, y` is the point between the feet. Returns `{ head, R }` so you can add props to the head.

| Key | Values |
|---|---|
| `seed` | Unique per character (shifts every stroke seed) |
| `scale` | Overall size (1 is about 280 units tall) |
| `body` | Torso width factor: 1.5 = big kid, .95 = skinny |
| `head` | Head size factor |
| `run`, `speed`, `phase` | Running cycle on/off, speed, and offset so a group is not in sync |
| `skin` | Skin crayon |
| `hair` | `{ style: 'messy' \| 'spiky' \| 'short' \| 'pigtails' \| 'bald', color, tie }` |
| `glasses`, `brows`, `blush` | Round glasses, angled brows, pink cheeks (on by default) |
| `nose` | `'pointy'` sticks out sideways |
| `mouth`, `mouthSize` | `'open'` (default, with tongue) or `'smile'` |
| `top` | `{ color, edge, collar: 'none' \| 'v' \| 'polo' \| 'sailor' \| 'crew', stripe, bow }` |
| `bottom` | `{ type: 'shorts' \| 'pants' \| 'skirt', color, edge, stripe }` |
| `socks`, `shoes` | Sock crayon (or `null`), `{ color, edge }` |

## Poses: `kid(spec, x, y, t, pose)`
The fifth argument says what the character is doing right now, so one spec can act out a whole story.

| Key | Values |
|---|---|
| `action` | `'run'` (default), `'walk'`, `'stand'`, `'wave'`, `'cheer'`, `'jump'`, `'point'`, `'kick'`, `'fly'` |
| `eyes` | `'happy'` (><, default), `'dot'`, `'closed'` (^^), `'wide'` |
| `mouth` | `'open'` (default), `'smile'`, `'o'` (surprised), `'frown'`, `'grin'` |
| `sweat` | Falling sweat drop |
| `hold` | Front hand raised to hold a prop (the return value gives `hand`) |
| `kick` | 0..1 kick amount with `action: 'kick'` |
| `rise` | Lift off the ground in units; the shadow stays behind and shrinks |
| `copter` | Propeller hat on the head (also `kit.copter(x, y, scale, t)` for custom figures) |

`kid()` returns `{ head, R, hand, lift }`: use `head`/`R` to place speech bubbles and `hand` to attach props.

## Speech bubbles
`bubble(text, x, y, tailX, tailY, { size, color, seed })` draws a wobbly white oval with a tail pointing at the speaker.

## Stories (several pages)
See `examples/park-story/story.js`:
- `PAGES = [{ caption, dur, scroll, cast: (u, t) => ({ me: { x, pose }, ball, bubbles }) }]`, where `u` is 0..1 progress through the page.
- `mv(u, a, b, u0, u1)` eases a value from `a` to `b` between `u0` and `u1`: entrances, exits, ball arcs.
- A story clock adds the frame time, picks the page, fades in from white on each turn, and loops at the end.
- Tap / → turns the page, ← goes back; dots show the page number; `#n` in the URL opens page n.
- `scroll` on a page moves the grass tufts so standing characters look like they are running along.

## Sound: `scripts/story-audio.js`
```js
StoryAudio.start();             // call from a tap/click/key handler
StoryAudio.sfx('kick');         // page, pop, sparkle, kick, bigKick, whoosh, boing, oops, cheer, copterOn, copterOff
StoryAudio.setEnabled(false);   // mute button
```
The music is a looping 8-bar C-major tune: triangle melody, square bass, synth kick, clap and hats. In a story, give each page `cues: [[u, name]]` and fire a cue when page progress passes `u` (see `cues()` in `story.js`). Stop looping sounds such as `copterOn` when the page changes.

## Testing with a hidden browser
`requestAnimationFrame` stops while the page is hidden. `CrayonKit.last.step(ms)` draws one frame by hand. Pass increasing `ms` values, 100 apart.

## Custom characters (animals, robots, mascots)
Copy the pattern of the robot cat in `examples/running-friends/friends.js`:
1. `const P = (px, py) => [x + px * s, base + py * s]`, with `base = y - bounce` for a bob.
2. Call `kit.shadow()` first.
3. Draw back limbs, body, front limbs, head, then face details, each with `shape()`.
4. Swing limbs with `Math.sin(t * 9 + phase)` and bounce with `Math.abs(Math.cos(...))`.

## Tuning
- Paper looks empty: shrink `W`/`H` to the content.
- Fill too flat: lower `gap` or raise `w`. Too messy: bring `over` toward 1.0.
- Slow on big canvases: fewer `fill()` calls (each draws a hatch plus grain), or lower `fps`.
- Groups: sort figures by feet `y` before drawing so nearer ones overlap farther ones.
