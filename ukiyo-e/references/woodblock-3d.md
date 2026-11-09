# 3D woodblock world: recipes

Everything below is in `examples/sea-3d/sea.js`.

## Page structure
- `#stage`: the WebGL canvas, full window.
- HTML overlays (`pointer-events: none`):
  - `#paper`: a canvas-made washi and woodgrain texture, `mix-blend-mode: multiply`
  - `#vignette`: a radial aged edge
  - `#frame`: the printed border
  - `#title` and `#seal`: the vertical cartouche (`writing-mode: vertical-rl`) and the red seal
- Controls: arrows, the view label with dots, a hint, a sound button.
  - `body.clean` hides them; toggle with H, or open the page with `?clean`.

## Shaders
**Toon with outline rim** (`toon(lit, shade, { rim, snow, planks })`):
- Two flat bands: `dot(n, sun) > .15 ? lit : shade`.
- Outline: `abs(dot(n, view)) < rim` gives the key colour. This draws ink at every silhouette with no extra geometry.
- `planks`: dark seams where `fract(y * planks) < .09`, for wooden hulls.
- `snow`: a jagged snow cap above `snow.x + sin(angle * 9) * snow.y`.

**Ocean:**
- Height from a sum of four sines, done in both GLSL and JS (`heightAt`), so floating objects match the water.
- Normals by finite difference. Three colour bands from `dot(n, sun)`.
- Carved lines: `fract(h * 1.6 + x * .015)` near .5 gives a thin lighter line.
- Foam where height passes a wavy threshold, with a dark key edge just at the boundary.
- Fades to the horizon colour with distance.
- Flowing sea: sample the pattern at `p.xz - flow * t` (and the same in `heightAt`), so ships appear to sail while staying put.

**Sky:** a back-faced sphere. Mix horizon cream → grey-blue → slate by `dir.y`, add a pink band at the horizon, then quantise (`floor(c * 18) / 18`) so it looks printed in flat steps, like bokashi.

**Sprites:** foam claws and spray dots are canvas textures (cream fill with a key-colour outline) on instanced planes or `Points` with `alphaTest`.

## Building with primitives
- **Mountain:** a `LatheGeometry` with a concave profile, using the toon `snow` option.
- **Tall ship:**
  - Hull: a custom swept surface. Its half-width follows `sin(pi u)^.45`, the sheer line rises at the stern and bow, and the keel deepens mid-ship.
  - Deck and stern castle: boxes.
  - Trim and gunports: thin boxes.
  - Bowsprit: an angled cylinder.
  - Masts: cylinders, with yards and crow's nests.
  - Sails: bent `PlaneGeometry` (bulge `(1 - x²)(1 - .6y²)`), which "breathe" by scaling z.
  - Jibs: `ShapeGeometry` triangles.
  - Rigging: `LineSegments`.
  - Pennants: planes whose vertices wave each frame.
- **Crew:** a cylinder body, a sphere head, a straw cone, cap or headband, and arm pivots. Animation kinds: `haul`, `coil`, `gaze`, `wave`, `helm`, `point`.
- **Wake:** foam dots in the ship's frame (peeling off the bow, spreading behind the stern), placed at `heightAt + .25`.
- **Floating:** set the y position from `heightAt`, pitch from the height difference bow-to-centre, and roll from side-to-centre.

## Camera
- **Orbit:** yaw, pitch and distance around a target. Drag to orbit, the wheel zooms, and the camera never goes below `heightAt + 3`.
- **Views:** defined relative to the hero's heading (`rel` yaw from the bow, look-ahead `fwd`, look-at height `up`). The arrows and ← → glide between them with eased interpolation.
- **Automatic tour:** the next view every 9 s. Any user input pauses it for 12 s.
- **Film (for recording):**
  - Keys are `[time, rel, pitch, dist, fwd, up]`.
  - The camera (yaw, pitch, dist) and the look target each follow a centripetal `CatmullRomCurve3`.
  - `filmU(t)` maps time to the curve so each key lands on its timestamp, with easing.
  - The film plays on load with the controls hidden, then holds the final shot. R replays it; user input stops it.

## Sound (`scripts/ukiyo-audio.js`)
- `UkiyoAudio.start()` after a tap; `UkiyoAudio.ambience('waves' | 'wind' | 'rain' | 'night' | null)`.
- `UkiyoAudio.sfx('paper' | 'knock' | 'swish' | 'stamp', duration)`, `UkiyoAudio.crane()`, `UkiyoAudio.setEnabled(on)`.
- The music is koto plucks and a breathy flute in the D "in" scale (D, E♭, G, A, B♭), over a soft drone.

## Testing in a hidden browser
`requestAnimationFrame` pauses in hidden tabs. The example exposes `window.seaStep(ms)` to render one frame by hand: pass increasing `ms` values above `performance.now()`, 100 apart.
