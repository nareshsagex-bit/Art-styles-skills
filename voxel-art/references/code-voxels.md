# VoxelGL reference

## Page setup
Copy the `<head>` script tags from `examples/voxel-battle/index.html`:
- Three.js r128 (`three.min.js`, global `THREE`)
- Bloom: `CopyShader`, `LuminosityHighPassShader`, `GammaCorrectionShader`, `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass` (from `three@0.128.0/examples/js/`)
- `voxel-gl.js`, then your scene script

The stage is a full-window `<div>` with `position: relative`. VoxelGL adds the WebGL canvas and a 2D overlay canvas inside it.

## Create
```js
const vx = VoxelGL.create(stage, {
  background: '#f3ece3',   // solid pastel backdrop
  floor: -1,               // y of an invisible floor that shows only shadows (omit for none)
  size: .62, span: 12,     // a sphere of radius `span` fills `size` of the shorter screen side
  target: [0, 2.2, 0], yaw: .35, pitch: .42, fov: 28,
  hemi: .5, sun: 1.3,      // light levels: lower hemi = more contrast
  bloomStrength: .75, bloomThreshold: 1.02
});
```

## Models
```js
const m = VoxelGL.model();             // design units, like cells in a voxel editor
m.box(x0, y0, z0, x1, y1, z1, '#hex'); // inclusive cell box
m.set(x, y, z, '#hex');                // one cell
m.ball(cx, cy, cz, rx, ry, rz, '#hex');// ellipsoid (great for heads, bodies, bellies)
m.tube([x, y, z], [x, y, z], r0, r1, '#hex'); // tapered limb or tail
const mesh = vx.mesh(m, { unit: .27, voxel: .09, material: vx.material() });
```
- `unit` is the world size of a design cell; `voxel` is the world size of the rendered voxel. `unit / voxel` voxels per cell = detail: 3 makes balls read smooth.
- Later shapes overwrite earlier ones: paint the base, then belly, eyes and stripes on top.
- Build facing +x; mirror a group with `scale.x = -1` to face -x.
- Pose frames: build several models (wing angles, arm up/down, cape sway) as meshes in one `THREE.Group`, and show one at a time.
- Hurt flash: give each character its own `vx.material()` and pulse `material.emissive`.
- Grow/shrink (spawning from a ball, recall): scale the group from 0 to 1 with a small overshoot.

## Scene loop
```js
vx.start((t, dt, fx) => {
  // move groups, switch frames, spawn effects
  fx(x, y, z, '#ffd23a', .3, 1.8);     // centred glowing cube; glow > 1 blooms
  vx.fxLight.position.set(...); vx.fxLight.intensity = 3;   // light the scene from fire or lightning
  vx.view.shake = [dx, dy];            // camera shake
}, {
  sway: { base: .35, amp: .3, speed: .12 },   // camera rocks around a side view when idle
  overlay: (t, ctx) => { const [x, y] = vx.project(wx, wy, wz); /* draw UI */ }
});
```
- The user can drag to orbit. After 2.5 s idle, the camera eases back to the sway.
- Keep the timeline deterministic (a function of loop time), and fire one-off events when the time crosses a mark. Particles may be random.

## Effects recipes (see `examples/voxel-battle/battle.js`)
- **Fire breath**: spawn 10 cubes per frame from the mouth toward the target. Colour by age: pale yellow → orange → red → grey smoke. Cubes grow as they age. Add an orange `fxLight`.
- **Lightning**: a jagged polyline re-rolled every frame, filled with white plus yellow cubes, with small forks. Add a full-screen flash and a strong white-yellow light.
- **Impact**: a burst of sparks with gravity, plus two expanding rings of cubes and camera shake.
- **Speed streak**: white cubes along the last 10 positions.
- **Ball send-out**: the ball arcs from the hand while spinning, bursts into sparkles, then a white beam column appears while the creature grows.

## UI overlay
- HP cards float just above each trainer, leaning away from the field so they never cover the action.
- Speech bubbles sit above the cards. Move-name banners pop in at the top centre.
- Size everything by `ui = min(width, height) / 640`.

## Sound (`scripts/battle-audio.js`)
`BattleAudio.start()` on the first tap or key (browsers block sound before that). `BattleAudio.sfx(name)` plays an effect: `call`, `throw`, `open`, `dash`, `hit`, `flameOn`, `flameOff`, `charge`, `zap`, `whoosh`, `clash`, `recall`. `BattleAudio.setEnabled(false)` mutes. Fire cues from the same time marks as the visuals.

## Look checklist
- Characters 40–60 voxels tall, one voxel size for every character
- No per-voxel colour noise, no outlines, no grass/dirt/stone layers
- Pastel diorama slab on a plain background, with a soft shadow under it
- Only effects glow: keep `bloomThreshold` above 1 so normal colours never bloom
- Contrast: `hemi` about .5 and `sun` about 1.3. Raise `hemi` for a softer, flatter look

## Testing in a hidden browser
`requestAnimationFrame` pauses while the page is hidden. `VoxelGL.last.step(ms)` renders one frame by hand: pass `ms` values above `performance.now()`, 100 apart. The WebGL canvas is not kept between frames, so take screenshots right after stepping.
