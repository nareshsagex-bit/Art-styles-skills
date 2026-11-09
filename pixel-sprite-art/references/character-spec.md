# Character spec for sprite-kit.js

A character is one plain object. `drawChar` reads it every frame, so you can change colours at runtime (for example, red eyes while charging: pass `{ eye: '#d8262a' }` in `opt`).

## The rig (native pixels, character facing right)

```
            hair spikes        about y -12 above head centre
   [ head 8x8 ]  hx-4..hx+3    centre (hx, hy) = (shoulder x + 1, shoulder y - 5)
   headband      rows hy-4, hy-3, plate at hx..hx+3
   [ torso 8x9 ]  rows 0..8 from the shoulder down, leans with the pose
   arms  2 px thick lines, shoulder to hand, 2x2 skin hand
   legs  3 px thick lines, hip to foot, 4x2 shoe, 1 px toe
   feet on the origin row; total height about 30 px
```

Paint order (back to front): `backGear`, back arm (shade colours), back leg, front leg, torso, `gear`, head, hair, headband, `post` hair, front arm. The back limbs use the `...S` shade colours, which gives depth without extra work.

## Fields

| Field | Required | Meaning |
|---|---|---|
| `skin`, `skinS` | yes | Skin base and shade |
| `hair`, `hairS`, `hairHi` | yes / yes / no | Hair base, shade, optional highlight streak |
| `style` | yes | `spiky`, `swept`, `short`, `long`, `bun`, `ponytail`, `bald` (add your own to `HAIR`) |
| `eye` | no | Iris colour. When present, it draws a bigger hero eye (white, iris, lid line); without it, a 1 px dark eye |
| `marks` | no | `[[dx, dy, colour], ...]` pixels relative to head centre: whiskers, scars, blush, a forehead mark |
| `mask` | no | Colour of a cloth mask over the lower face |
| `torso` + `pal` | one of | 9 strings × 8 characters plus a palette map (see below) |
| `top`, `topS`, `vest`, `collar` | one of | Simple torso: base, shade on the back two columns, optional vest pockets and collar |
| `sleeve`, `sleeveS` | yes | Arm colours (front, back) |
| `wrap` | no | A band on the forearm (arm guard) |
| `pants`, `pantsS` | yes | Leg colours |
| `legBand`, `cuff` | no | A stripe across the front leg near the knee, and a cuff above the shoe |
| `shoes`, `toes` | yes / no | Shoe colour; `toes: true` shows one skin pixel (sandals) |
| `band`, `plate`, `longTails` | no | Headband colour; `plate` is the metal colour (or `null` for plain cloth); long fluttering tails |
| `gear(hook)`, `backGear(hook)` | no | Accessory painters, in front of or behind the body |

`hook` is `{ g, px, line, shX, shY, hipX, hipY, t }`. Use `px(g, colour, x, y, w, h)` and `line(g, colour, x0, y0, x1, y1, thickness)`, positioned from the shoulder or hip. Use `t` for flutter, for example `Math.sin(t * 10) > 0 ? 1 : 0`.

## The torso map

Each row is 8 pixels; column 0 is the **back** (shade side), column 7 the **front**. A space is transparent. Example: a black-topped jacket with an orange panel and a zipper at column 5:

```js
torso: [
  'kkkkkkkk',   // 0 collar / shoulders
  'kkkkkzkk',   // 1 zipper starts
  'kKoooZok',   // 2 orange panel opens, zipper highlight Z
  'kOooozoo',   // 3 O = orange shade on the back edge
  'kOooozoo',   // 4
  'kOoooZok',   // 5
  'kkkkkzkk',   // 6 lower black band
  'kkkkkkkk',   // 7
  'OOoooooo'    // 8 waist, meets the pants
],
pal: { k: '#26242f', K: '#3c3a48', o: '#f57d22', O: '#c75714', z: '#aab4c0', Z: '#e9eef3' }
```

Rules that keep it readable:
- Put the **shade letter in column 0–1** of each colour block (light comes from the front and top).
- Use **at most 3 colours plus shades** in the torso. More turns into noise at 8 px wide.
- Show an opening (V-neck, open collar) as **skin pixels** in the front columns of rows 0–3.
- Draw a belt or sash as **two rows that alternate base and shade** (`'rRrRrRrR'`, `'RrRrRrRr'`), which reads as a twisted cloth.

## Turning a reference image into a spec

Use this when the user shows a character and says "make it like this":

1. **List the 4–6 identifying features** in order of how recognisable they are. For example: "spiky yellow hair, black-and-orange jacket with zipper, orange pants with a white knee band, blue eyes, cheek marks, long black headband tails".
2. **Map each feature to a field:** hair goes to `style`, `hair` and `hairS`; jacket blocks to the torso map; pants detail to `legBand` and `cuff`; eyes to `eye`; cheek marks to `marks`; the headband to `band` and `longTails`; a weapon or pouch to `gear` or `backGear`.
3. **Sample colours** from the reference, then pick the shade as the same hue, about 20% darker and slightly more saturated.
4. **Render, screenshot, compare** side by side with the reference. Fix the one feature that reads worst, and repeat. Two rounds are usually enough.
5. **Don't grow the sprite** to fit detail. If a feature doesn't fit in 30 px, exaggerate it (bigger hair spikes, a brighter accessory) or drop it.

## Adding a hair style

```js
kit.HAIR.mohawk = {
  front(g, c, hx, hy) {
    g.fillStyle = c.skinS; g.fillRect(hx - 4, hy - 6, 8, 2);           // shaved sides
    for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? c.hairS : c.hair; g.fillRect(hx - 1, hy - 7 - k, 3, 1); }
  }
};
```
`back` draws behind the face, `front` over the head, `post` after the headband. The face covers `hx-4..hx+3`, `hy-4..hy+3`.

## Adding a pose

```js
kit.POSES.bow = () => ({ lean: 3, crouch: 1, lf: [2, 0], lb: [-2, 0], af: [3, 6], ab: [2, 6] });
```
Feet are `[dx, lift]`, hands `[dx, dy]` from the shoulder, all for a right-facing character. Mirroring for `face = -1` is automatic. Keep feet on the ground (lift 0) unless the character is jumping, and move the whole sprite with a `z` offset for real jumps.
