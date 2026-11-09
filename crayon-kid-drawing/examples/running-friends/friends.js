// Five friends running across a rectangle of grass, drawn like a 5-year-old's crayon picture.
// Four use the kit's configurable kid(); the round blue robot cat is a custom figure built
// from the kit's primitives (ell, line, fill, shape), to show how to add your own.
(() => {
  'use strict';
  const kit = CrayonKit.create(document.querySelector('canvas'), { W: 1180, H: 470, size: .9, paper: false });
  const { K, ell, line, fill, shape } = kit;

  const FRIENDS = [
    { // big kid: orange shirt with a yellow stripe, navy trousers, teal shoes
      seed: 1, x: 175, y: 380, scale: .9, body: 1.5, head: 1.06, phase: 2.1, brows: true, mouthSize: 1.15,
      hair: { style: 'short' }, top: { color: K.orange, edge: K.brown, stripe: K.yellow, collar: 'crew' },
      bottom: { type: 'pants', color: K.navy, edge: K.black }, shoes: { color: K.teal, edge: K.navy }
    },
    { // spiky-haired kid: green polo, brown shorts, yellow shoes
      seed: 2, x: 395, y: 408, scale: .82, body: .95, phase: .7, nose: 'pointy',
      hair: { style: 'spiky' }, top: { color: K.lime, edge: K.dgreen, collar: 'polo' },
      bottom: { type: 'shorts', color: K.brown, edge: K.black }, shoes: { color: K.yellow, edge: K.orange }
    },
    { // boy with round glasses: yellow shirt, white collar, blue shorts
      seed: 3, x: 610, y: 392, scale: .86, phase: 0, glasses: true,
      hair: { style: 'messy' }, top: { color: K.yellow, edge: K.orange, collar: 'v' },
      bottom: { type: 'shorts', color: K.blue, edge: K.navy }, shoes: { color: K.blue, edge: K.navy }
    },
    { // girl with pigtails: pink dress, sailor collar, red bow, pink shoes
      seed: 4, x: 825, y: 412, scale: .8, phase: 1.6,
      hair: { style: 'pigtails', tie: K.red }, top: { color: K.lightpink, edge: K.hotpink, collar: 'sailor', bow: K.red },
      bottom: { type: 'skirt', color: K.lightpink, edge: K.hotpink, stripe: K.white }, shoes: { color: K.hotpink, edge: K.red }
    }
  ];

  // Round blue robot cat: white face, red nose, whiskers, red collar with a bell, belly pocket.
  function robotCat(x, y, t, { scale: s = .85, phase = 3 } = {}) {
    const S = 9000, p = t * 9 + phase;
    const sw = Math.sin(p), bounce = Math.abs(Math.cos(p)) * 10 * s;
    const base = y - bounce;
    const P = (px, py) => [x + px * s, base + py * s];
    kit.shadow(x, y + 6 * s, 80 * s - bounce * 2, S);

    const arm = (side, ang, seed) => {
      const sh = P(side * 40, -112);
      const hand = [sh[0] + Math.sin(ang) * 44 * s, sh[1] + Math.cos(ang) * 44 * s];
      line([sh, hand], K.black, 18 * s, seed);
      line([sh, hand], K.blue, 12 * s, seed + 1);
      shape(ell(hand[0], hand[1], 14 * s, 14 * s, 14), K.white, K.black, seed + 2, 4);
    };
    const leg = (side, ang, seed) => {
      const hip = P(side * 20, -50);
      const foot = [hip[0] + Math.sin(ang) * 36 * s, hip[1] + Math.cos(ang) * 36 * s];
      line([hip, foot], K.black, 22 * s, seed);
      line([hip, foot], K.blue, 16 * s, seed + 1);
      shape(ell(foot[0] + 4 * s, foot[1] + 4 * s, 24 * s, 13 * s, 14), K.white, K.black, seed + 2, 4);
    };

    arm(-1, Math.PI * .5 + .9 - sw * .9, S + 10);
    leg(-1, -sw * .9, S + 20);
    // Red ball tail.
    line([P(48, -62), P(64, -70)], K.black, 4, S + 30);
    shape(ell(...P(68, -72), 9 * s, 9 * s, 10), K.red, K.black, S + 32, 3.5, { gap: 4, w: 5 });
    // Body, white belly, half-moon pocket.
    shape(ell(...P(0, -84), 52 * s, 50 * s, 24), K.blue, K.navy, S + 40, 5);
    shape(ell(...P(0, -80), 38 * s, 36 * s, 20), K.white, K.black, S + 42, 4, { gap: 6, w: 6 });
    const pc = P(0, -84);
    shape([[pc[0] - 24 * s, pc[1]], ...ell(pc[0], pc[1], 24 * s, 20 * s, 10, 0, Math.PI)], K.white, K.black, S + 44, 3.5, { gap: 5, w: 5 });
    leg(1, sw * .9, S + 50);
    arm(1, Math.PI * .5 - .9 + sw * .9, S + 60);

    // Head: big blue circle, white face.
    const hc = P(0, -186), R = 74 * s;
    shape(ell(hc[0], hc[1], R, R * .96, 28), K.blue, K.navy, S + 70, 5);
    shape(ell(hc[0], hc[1] + R * .2, R * .8, R * .7, 24), K.white, K.black, S + 72, 4, { gap: 6, w: 6 });
    // Big oval eyes with >< inside.
    for (const side of [-1, 1]) {
      const ec = [hc[0] + side * R * .22, hc[1] - R * .38];
      shape(ell(ec[0], ec[1], R * .22, R * .28, 16), K.white, K.black, S + 80 + side, 4, { gap: 5, w: 5 });
      const e = R * .1;
      line([[ec[0] - side * e, ec[1] - e], [ec[0] + side * e, ec[1]], [ec[0] - side * e, ec[1] + e]], K.black, 4.5, S + 84 + side);
    }
    // Red nose, nose line, whiskers.
    const n = [hc[0], hc[1] - R * .05];
    shape(ell(n[0], n[1], R * .12, R * .12, 12), K.red, K.black, S + 90, 3.5, { gap: 4, w: 5 });
    line([[n[0], n[1] + R * .12], [n[0], n[1] + R * .3]], K.black, 3.5, S + 92);
    for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) {
      line([[hc[0] + side * R * .32, hc[1] + R * .12 + i * R * .12], [hc[0] + side * R * .74, hc[1] + R * .06 + i * R * .2]], K.black, 3, S + 94 + side * 3 + i);
    }
    // Wide open smile with a tongue.
    const m = [hc[0], hc[1] + R * .3], mw = R * .52;
    shape([[m[0] - mw, m[1]], [m[0] + mw, m[1]], ...ell(m[0], m[1], mw, R * .42, 14, 0, Math.PI)], K.red, K.black, S + 100, 4.5, { gap: 5, w: 6 });
    fill(ell(m[0], m[1] + R * .28, mw * .5, R * .1, 10), K.pink, S + 102, { gap: 4, w: 5, angle: 0 });
    fill(ell(hc[0] - R * .52, hc[1] + R * .15, 10 * s, 6 * s, 10), K.pink, S + 104, { gap: 4, w: 4, angle: 0 });
    fill(ell(hc[0] + R * .52, hc[1] + R * .15, 10 * s, 6 * s, 10), K.pink, S + 106, { gap: 4, w: 4, angle: 0 });
    // Red collar with a yellow bell (drawn over the neck).
    const c = P(0, -128);
    shape([[c[0] - 46 * s, c[1] - 6 * s], [c[0] + 46 * s, c[1] - 6 * s], [c[0] + 44 * s, c[1] + 6 * s], [c[0] - 44 * s, c[1] + 6 * s]], K.red, K.black, S + 110, 3.5, { gap: 4, w: 5 });
    const b = [c[0], c[1] + 12 * s];
    shape(ell(b[0], b[1], 11 * s, 11 * s, 12), K.yellow, K.black, S + 112, 3.5, { gap: 4, w: 5 });
    line([[b[0] - 10 * s, b[1] - 2 * s], [b[0] + 10 * s, b[1] - 2 * s]], K.black, 3, S + 114);
    line([[b[0], b[1] + 2 * s], [b[0], b[1] + 9 * s]], K.black, 3, S + 116);
  }

  kit.start(t => {
    kit.field({ x: 40, y: 200, w: kit.W - 80, h: 230, t, tufts: 30 });
    const CAT = { cat: true, x: 1030, y: 386 };
    // Draw higher-up (further back) figures first.
    [...FRIENDS, CAT].sort((a, b) => a.y - b.y).forEach(f => f.cat ? robotCat(f.x, f.y, t) : kit.kid(f, f.x, f.y, t));
  });
})();
