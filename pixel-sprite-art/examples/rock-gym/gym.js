// Pixel rock gym (v2), following the pixel-sprite-art skill's rules: native low-res canvas,
// hard pixels, dark outlines, light from the top-left, shade colours for depth.
// A dim cave gym seen from above: walls of chunky rounded stones, stepped terraces, a dirt
// arena, faceted grey boulders, red-railed stairs and a raised office. Sunbeams pour through
// three windows. A young trainer (seen from behind) and his fire lizard face the gym leader
// and his giant rock snake; they trade Ember and Rock Throw in a loop.
(() => {
  'use strict';
  const VW = 240, VH = 360, SIZE = .94;
  const view = document.querySelector('canvas');
  const vctx = view.getContext('2d');
  const buf = document.createElement('canvas'); buf.width = VW; buf.height = VH;
  const bufCtx = buf.getContext('2d'); bufCtx.imageSmoothingEnabled = false;
  let g = bufCtx;
  const K = '#1b1310';                                   // outline colour

  // ---------- Pixel helpers ----------
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  function tone(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
  }
  // A sprite from a pixel map (rows centred), palette lookup, optional mirror.
  function sprite(map, pal, x, y, flip = false) {
    const W = Math.max(...map.map(r => r.length));
    map.forEach((row, j) => {
      const off = Math.floor((W - row.length) / 2);
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const cx = flip ? W - 1 - (i + off) : i + off;
        px(pal[ch], x + cx - Math.floor(W / 2), y + j);
      }
    });
  }

  // ---------- Chunky rounded stones (the look of the walls) ----------
  const BROWN = ['#6e4626', '#7a4e2c', '#5c3a20', '#845832', '#6a4a30'];
  const GREY = ['#7a7a82', '#85858d', '#6e6e77', '#8e8e96'];
  function stone(x, y, w, h, base) {
    x = Math.round(x); y = Math.round(y);
    px(K, x + 1, y, w - 2, h); px(K, x, y + 1, w, h - 2);                 // outline with cut corners
    px(base, x + 1, y + 1, w - 2, h - 2);
    px(tone(base, 1.28), x + 2, y + 1, w - 4, 1);                          // lit top
    px(tone(base, 1.14), x + 1, y + 2, 1, h - 4);                          // lit left
    px(tone(base, 1.14), x + 2, y + 2, w - 5, 1);
    px(tone(base, .72), x + 2, y + h - 2, w - 3, 1);                       // dark bottom
    px(tone(base, .8), x + w - 2, y + 2, 1, h - 4);                        // dark right
    if (w > 6 && rnd() < .5) px(tone(base, .82), x + 3 + Math.floor(rnd() * (w - 6)), y + 3, 1, 1);   // pit
  }
  // A wall of stones: rows of varied stones, slightly staggered, drawn back to front.
  function stoneWall(x0, y0, w, h, { pal = BROWN, sh = 10, dark = 0 } = {}) {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    px(K, x0, y0, w, h);
    for (let y = y0 - 2, row = 0; y < y0 + h; y += sh - 1, row++) {
      let x = x0 - (row % 2 ? 4 : 0) - 2;
      while (x < x0 + w) { const sw = 10 + Math.floor(rnd() * 6); stone(x, y + Math.floor(rnd() * 2), sw, sh + Math.floor(rnd() * 2), pick(pal)); x += sw - 1; }
    }
    if (dark) { g.fillStyle = `rgba(10,6,3,${dark})`; g.fillRect(x0, y0, w, h); }
    g.restore();
  }
  // The lit top edge of a terrace: a lip of stone tops over a thin shadow.
  function terraceLip(x, y, w) {
    px(K, x, y, w, 1);
    for (let xx = x; xx < x + w; xx += 6 + Math.floor(rnd() * 3)) { const c = pick(BROWN); px(tone(c, 1.35), xx, y + 1, 5, 2); px(tone(c, 1.1), xx, y + 3, 5, 1); }
  }
  function dirt(x0, y0, w, h, base = '#7d5636') {
    px(base, x0, y0, w, h);
    for (let i = 0; i < w * h / 6; i++) px(pick([tone(base, 1.1), tone(base, .9), tone(base, 1.18), tone(base, .82)]), x0 + rnd() * w, y0 + rnd() * h);
    for (let i = 0; i < w * h / 220; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * h; px(K, x, y + 1, 2, 1); px(tone(base, 1.4), x, y, 2, 1); }
  }
  // Faceted grey boulder cluster with a soft shadow.
  function boulder(x, y, s = 1) {
    shadow(x, y + 5 * s, 16 * s);
    const parts = [[-7, 0, 9, 8], [1, -2, 10, 9], [-3, -8, 9, 8], [5, -7, 7, 6], [7, 1, 7, 6]];
    for (const [dx, dy, w, h] of parts) stone(x + dx * s, y + dy * s, Math.round(w * s), Math.round(h * s), pick(GREY));
  }
  function shadow(x, y, w) { g.fillStyle = 'rgba(20,10,4,.42)'; g.beginPath(); g.ellipse(Math.round(x), Math.round(y), w / 2, w / 6, 0, 0, Math.PI * 2); g.fill(); }
  function tuft(x, y) { px(K, x - 2, y, 6, 1); px('#3e6b33', x, y - 3, 1, 3); px('#5a8a40', x - 1, y - 2, 1, 2); px('#6ea04a', x + 1, y - 4, 1, 4); px('#2f5227', x + 2, y - 2, 1, 2); }
  function stairs(x, y, w, n, step = 4) {
    px(K, x - 4, y - 3, w + 8, n * step + 4);
    for (let i = 0; i < n; i++) {
      px('#6c6c74', x, y + i * step, w, step - 1); px('#a2a2aa', x, y + i * step, w, 1); px('#3e3e46', x, y + i * step + step - 1, w, 1);
    }
    for (const sx of [x - 3, x + w]) { px('#a8382a', sx, y - 2, 3, n * step + 2); px('#e0604a', sx, y - 2, 1, n * step + 2); px('#5e1f16', sx + 2, y - 2, 1, n * step + 2); }
  }
  function diagStairs(x, y, n) {
    for (let i = 0; i < n; i++) { const xx = x + i * 3, yy = y + i * 4; px(K, xx - 1, yy - 1, 16, 5); px('#6c6c74', xx, yy, 14, 3); px('#a2a2aa', xx, yy, 14, 1); }
    for (let i = 0; i < n * 4; i++) { px('#a8382a', x - 3 + i * .75, y + i - 2, 2, 2); px('#a8382a', x + 15 + i * .75, y + i - 2, 2, 2); }
  }
  const box = (x, y, w, h, c) => { px(K, x - 1, y - 1, w + 2, h + 2); px(c, x, y, w, h); px(tone(c, 1.25), x, y, w, 1); px(tone(c, .75), x, y + h - 1, w, 1); };

  // ---------- Static background ----------
  const bg = document.createElement('canvas'); bg.width = VW; bg.height = VH;
  { const c = bg.getContext('2d'); c.imageSmoothingEnabled = false; g = c; drawStatic(c); g = bufCtx; }
  function drawStatic(c) {
    px('#0a0705', 0, 0, VW, VH);
    // Back wall of stones, fading into darkness at the top.
    stoneWall(0, 46, VW, 84);
    for (let y = 0; y < 60; y++) { c.fillStyle = `rgba(10,7,5,${Math.max(0, 1 - y / 60)})`; c.fillRect(0, 44 + y, VW, 1); }
    c.fillStyle = '#0a0705'; c.fillRect(0, 0, VW, 46);

    // ---- Office (raised, right) ----
    px(K, 117, 77, 123, 74);
    px('#d9c9a2', 120, 84, 120, 34);
    for (let x = 122; x < 240; x += 4) px('#cdbb92', x, 84, 1, 34);
    px('#bfae86', 120, 116, 120, 2);
    for (const x of [119, 152, 196, 235]) { px(K, x - 1, 81, 6, 38); px('#2f4a7a', x, 81, 4, 38); px('#4f70a8', x, 81, 1, 38); }
    px('#2f4a7a', 117, 77, 123, 6); px('#4f70a8', 117, 77, 123, 1); px('#1c2c4e', 117, 82, 123, 1);
    // Plank floor.
    px('#8e5c35', 118, 118, 122, 32);
    for (let y = 121; y < 150; y += 4) { px('#6a4126', 118, y, 122, 1); px('#a06c42', 118, y + 1, 122, 1); }
    for (let i = 0; i < 30; i++) px('#6a4126', 118 + Math.floor(rnd() * 120), 118 + 4 * Math.floor(rnd() * 8) + 1, 1, 3);
    // Bookshelves.
    for (let i = 0; i < 3; i++) {
      const x = 158 + i * 13;
      box(x, 95, 12, 23, '#3d5a4e');
      for (let r = 0; r < 3; r++) { px('#26392f', x + 1, 97 + r * 7, 10, 6); for (let b = 0; b < 5; b++) { const bc = pick(['#c94a3a', '#e0b23a', '#3a7ac9', '#5aa04a', '#e8e0c8', '#8a4ac9']); px(bc, x + 1 + b * 2, 98 + r * 7, 2, 5); px(tone(bc, 1.3), x + 1 + b * 2, 98 + r * 7, 1, 5); } }
    }
    box(204, 96, 15, 10, '#7a5230'); px('#6aaad6', 206, 98, 11, 6); px('#3e8a52', 206, 102, 11, 2); px('#f2ead0', 212, 99, 2, 1);
    box(226, 111, 8, 8, '#a35a30');
    for (let i = 0; i < 26; i++) { const x = 223 + rnd() * 13, y = 96 + rnd() * 15; px(K, x, y + 1, 2, 1); px(pick(['#3e8a3a', '#2e6a2c', '#5aa84a', '#6ec05a']), x, y, 2, 1); }
    // Rug and table.
    px(K, 167, 127, 48, 18); px('#2f6e4e', 168, 128, 46, 16); px('#3e8a62', 170, 130, 42, 12); px('#2f6e4e', 172, 132, 38, 8);
    box(176, 127, 28, 6, '#7a4626'); px(K, 178, 133, 2, 5); px(K, 200, 133, 2, 5); px('#5a3418', 178, 133, 1, 4); px('#5a3418', 200, 133, 1, 4);
    // Machine, desk + PC, water cooler, boxes.
    box(121, 103, 12, 22, '#3050a8'); px('#16244e', 123, 107, 8, 9); px('#a8d8f0', 124, 109, 3, 2); px('#e04a3a', 128, 109, 2, 2); px('#e0b23a', 123, 119, 8, 2);
    box(136, 114, 16, 3, '#7a4a2a'); px(K, 137, 117, 2, 7); px(K, 149, 117, 2, 7);
    box(139, 106, 9, 7, '#d9d9de'); px('#5a8ac9', 140, 107, 7, 4); px('#9ad0f0', 141, 107, 2, 1);
    box(153, 104, 7, 14, '#ececf2'); box(153, 96, 7, 7, '#5aa0e0'); px('#a8d4f4', 154, 97, 2, 3);
    box(150, 132, 8, 6, '#c49a5a'); box(160, 134, 7, 5, '#b88c4c');
    px(K, 117, 150, 123, 1); px('#5a3820', 118, 149, 122, 1);

    // ---- Upper-left terrace under the windows ----
    dirt(0, 128, 117, 24, '#6c482a');
    terraceLip(0, 128, 117);
    for (const [x, y] of [[14, 104], [40, 99], [68, 95]]) {
      px(K, x - 2, y - 2, 14, 12); px('#3a2414', x - 1, y - 1, 12, 10);
      px('#fff6d0', x, y, 10, 8); px('#ffe9a0', x, y + 5, 10, 3);
      px('#3a2414', x + 4, y, 1, 8); px('#3a2414', x, y + 3, 10, 1);
    }
    // ---- Tiers ----
    stoneWall(0, 152, VW, 15); terraceLip(0, 151, 117);
    dirt(0, 167, VW, 6, '#73502f'); terraceLip(0, 166, VW);
    stoneWall(0, 173, VW, 13);
    dirt(0, 186, VW, 126, '#80583a');
    // Shadow along the base of the tier wall.
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(20,10,4,${.32 - i * .05})`; c.fillRect(0, 186 + i, VW, 1); }
    // Side walls stepping into the arena.
    stoneWall(0, 186, 16, 126); stoneWall(224, 186, 16, 126);
    for (let i = 0; i < 6; i++) { stoneWall(16, 186 + i * 21, 6, 14); stoneWall(218, 186 + i * 21, 6, 14); }
    stoneWall(0, 312, VW, 15); terraceLip(0, 311, VW);
    dirt(0, 327, VW, 33, '#6c482a');
    // Stairs.
    stairs(110, 151, 18, 9);
    diagStairs(22, 222, 8);
    stairs(106, 312, 20, 6);
    // Boulders and grass.
    boulder(40, 142, .75); boulder(16, 146, .55); boulder(84, 146, .5);
    boulder(40, 206); boulder(198, 206, .8); boulder(196, 280, .9); boulder(150, 302, 1.05); boulder(34, 296, .7);
    boulder(210, 346, .8); boulder(56, 348, .6);
    for (const [x, y] of [[60, 212], [186, 220], [174, 296], [46, 276], [208, 256], [128, 304], [92, 346], [176, 350], [24, 340], [100, 146], [64, 150]]) tuft(x, y);

    // ---- Lighting baked into the background ----
    // Warm pool over the arena, darker edges and corners.
    const L = c.createRadialGradient(118, 250, 20, 118, 250, 170);
    L.addColorStop(0, 'rgba(255,200,130,.16)'); L.addColorStop(1, 'rgba(255,200,130,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = L; c.fillRect(0, 0, VW, VH);
    c.globalCompositeOperation = 'source-over';
    const D = c.createRadialGradient(125, 220, 90, 125, 230, 260);
    D.addColorStop(0, 'rgba(8,4,2,0)'); D.addColorStop(1, 'rgba(8,4,2,.62)');
    c.fillStyle = D; c.fillRect(0, 0, VW, VH);
  }

  // ---------- Characters (3/4 view, outlined) ----------
  // Trainer seen from behind: red cap, black hair, black tee, yellow backpack, jeans, red shoes.
  const TRAINER = [
    '..KKKKKKKK..',
    '.KRRRRRRRRK.',
    'KRRRRRRRRRRK',
    'KRRRRWWRRRRK',
    'KrRRRRRRRRrK',
    'KKrrrrrrrrKK',
    '.KHHHHHHHHK.',
    '.KHHHHHHHHK.',
    '..KhHHHHhK..',
    '..KsSSSSsK..',
    '.KKKsSSsKKK.',
    'KBBBKKKKBBBK',
    'KSBbYYYYYbBSK',
    'KSBbYyyyYbBSK',
    'KSBbYYYYYbBSK',
    'KsBbYyYyYbBsK',
    'KsKbYYYYYbKsK',
    '.KSKYyyyYKSK.',
    '.KSKBBBBBKSK.',
    '..KKBBBBBKK..',
    '...KJJJJJK...',
    '...KJJjJJK...',
    '...KJJKJJK...',
    '...KJjKjJK...',
    '...KJjKjJK...',
    '..KEEEKEEEK..',
    '..KeeeKeeeK..',
    '...KKK.KKK...'
  ];
  const TRAINER_PAL = { K, R: '#d6382c', r: '#9a2219', W: '#f2f2f2', H: '#2a1a12', h: '#1a100a', S: '#f4c8a0', s: '#d09a74', B: '#24242e', b: '#3c3c4a', Y: '#e8b83a', y: '#b08a20', J: '#3a5fb0', j: '#2a4688', E: '#cc3a2e', e: '#8a2219' };
  const TRAINER_POINT = TRAINER.map((r, i) => i === 12 ? 'KSBbYYYYYbBSSSK' : i === 13 ? 'KSBbYyyyYbBKKK.' : r);
  // Gym leader facing us: spiky brown hair, squinting eyes, orange vest, green shirt, olive trousers.
  const LEADER = [
    '.K.K.KK.K.K.',
    'KHKHKHHKHKHK',
    'KHHHHHHHHHHK',
    'KHhHHHHHHhHK',
    'KhSSSSSSSShK',
    '.KSSSSSSSSK.',
    '.KSkkSSkkSK.',
    '.KSSSssSSSK.',
    '..KSSkkSSK..',
    '...KKSSKK...',
    '.KOOOGGOOOK.',
    'KSOOOGGOOOSK',
    'KSOoOGGOoOSK',
    'KSOoOGGOoOSK',
    'KsOOOGGOOOsK',
    'KsKOOGGOOKsK',
    '.KKooooooKK.',
    '..KNNNNNNK..',
    '..KNNNnNNK..',
    '..KNNKKNNK..',
    '..KNnK.KnNK.',
    '..KNnK.KnNK.',
    '..KNnK.KnNK.',
    '.KXXXK.KXXXK',
    '.KKKK...KKKK'
  ];
  const LEADER_PAL = { K, H: '#6e4024', h: '#4a2a14', S: '#c98c5e', s: '#a06a42', k: '#2a1a12', O: '#de6c2a', o: '#a84a1a', G: '#5e9244', N: '#6e6e44', n: '#4a4a2e', X: '#3a2a1a' };
  const LEADER_POINT = LEADER.map((r, i) => i === 11 ? 'KSSSKOOGGOOOSK' : i === 12 ? '.KKKOoOGGOoOSK' : r);

  // Fire lizard, outlined.
  function lizard(x, y, t, hop = 0, open = false) {
    const P = (c, dx, dy, w = 1, h = 1) => px(c, x + dx, y + dy - hop, w, h);
    const O = '#ec762c', OD = '#b8521a', CR = '#f6d690';
    const f = Math.floor(t * 12) % 3;
    // Outline pass (one pixel bigger), then colour.
    P(K, -11, -11, 4, 9); P(K, -6, -12, 11, 13); P(K, -1, -19, 10, 10);
    P(OD, -10, -6, 3, 4); P(O, -9, -9, 2, 4);
    P('#ffd23a', -11, -14 - (f % 2), 3, 4); P('#ff8a1f', -12, -16 + (f === 1 ? 1 : 0), 2, 3); P('#fff3a0', -10, -12, 1, 2);
    P(O, -5, -11, 9, 10); P(OD, -5, -2, 9, 1); P(tone(O, 1.2), -5, -11, 9, 1); P(CR, 0, -8, 3, 5);
    P(O, -4, -1, 3, 2); P(O, 1, -1, 3, 2);
    P(O, 0, -18, 8, 8); P(tone(O, 1.22), 0, -18, 8, 1); P(OD, 0, -11, 8, 1); P(O, 7, -15, 2, 3);
    P('#fff', 3, -16, 2, 3); P('#18306a', 4, -16, 1, 3); P(K, 8, -13, 1, 1);
    if (open) { P(K, 5, -12, 4, 2); P('#d43a2e', 6, -12, 2, 1); }
    P(O, 3, -8, 3, 2); P(K, 6, -8, 1, 2);
  }
  // Giant rock snake: faceted boulder segments rising from a coil to a horned head.
  function rockSnake(x, y, t, lunge = 0, hurt = false) {
    const segs = [], N = 14;
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      const sx = x + 44 - k * 58 - Math.sin(k * 3.2 + t * 1.2) * 5 - lunge * k * k * 30;
      const sy = y - Math.sin(k * Math.PI * .9) * 62 + (1 - k) * 6 + lunge * k * k * 16 - k * 16;
      segs.push([sx, sy, Math.round(10 - k * 3)]);
    }
    shadow(x + 26, y + 10, 50);
    for (const [sx, sy, r] of segs) {
      const pal = hurt ? ['#ffffff', '#e8e8ee', '#d0d0d8'] : ['#b4b4bc', '#8a8a94', '#5c5c66'];
      const R = r;
      // Octagon with three facets and an outline.
      for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) {
        if (Math.abs(xx) + Math.abs(yy) > R * 1.45 || Math.abs(xx) > R || Math.abs(yy) > R) continue;
        const edge = Math.abs(xx) + Math.abs(yy) > R * 1.45 - 1.2 || Math.abs(xx) === R || Math.abs(yy) === R;
        const c = edge ? K : (xx + yy < -R * .35 ? pal[0] : xx + yy > R * .45 ? pal[2] : pal[1]);
        px(c, sx + xx, sy + yy);
      }
      px(tone(pal[1], .7), sx - 2, sy - 1, 3, 1);
    }
    const [hx, hy] = segs[N - 1];
    const S = 1.5, H = (c, dx, dy, w = 1, h = 1) => px(c, hx + dx * S, hy + dy * S, Math.ceil(w * S), Math.ceil(h * S));
    const hc = hurt ? '#ffffff' : '#9c9ca6';
    H(K, -13, -7, 18, 14); H(hc, -12, -6, 16, 12); H(hurt ? '#fff' : '#c4c4cc', -12, -6, 16, 2); H(tone(hc, .7), -12, 4, 16, 2);
    H(K, -17, -3, 6, 9); H(hc, -16, -2, 5, 7);
    H(K, -9, -3, 5, 3); H('#fff', -8, -2, 3, 1); H(K, -7, -2, 1, 1);
    H(K, -15, 3, 7, 1);
    H(K, -1, -13, 5, 8); H('#c4c4cc', 0, -12, 3, 7); H('#76767e', 2, -12, 1, 7);
    return [hx - 20, hy + 3];
  }

  // ---------- Light beams and dust ----------
  const WINDOWS = [[14, 104], [40, 99], [68, 95]];
  const dust = Array.from({ length: 60 }, () => ({ w: Math.floor(Math.random() * 3), k: Math.random(), s: .02 + Math.random() * .04, o: Math.random() * 6 }));
  function beams(t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    WINDOWS.forEach(([x, y], i) => {
      const a = .17 + .04 * Math.sin(t * 1.5 + i);
      const grd = g.createLinearGradient(x, y, x + 44, y + 84);
      grd.addColorStop(0, `rgba(255,232,160,${a * 1.8})`); grd.addColorStop(1, 'rgba(255,232,160,0)');
      g.fillStyle = grd;
      g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + 10, y); g.lineTo(x + 64, y + 72); g.lineTo(x + 34, y + 88); g.closePath(); g.fill();
      g.fillStyle = `rgba(255,214,140,${a * .9})`; g.fillRect(x + 36, y + 76, 24, 8); g.fillRect(x + 40, y + 74, 16, 12);
    });
    for (const d of dust) {
      const [wx, wy] = WINDOWS[d.w], k = (d.k + t * d.s) % 1;
      g.fillStyle = `rgba(255,240,190,${.6 * Math.sin(k * Math.PI)})`;
      g.fillRect(Math.round(wx + 6 + k * 46 + Math.sin(t + d.o) * 3), Math.round(wy + 6 + k * 70), 1, 1);
    }
    g.restore();
  }

  // ---------- Battle loop ----------
  const LOOP = 10;
  const T_POS = [110, 248], L_POS = [168, 222], LZ = [86, 276], SN = [176, 240];
  let clock = 0, prev = null;
  function frame(ms) {
    const now = ms / 1000, dt = prev === null ? 0 : Math.max(0, Math.min(.1, now - prev));
    prev = now; clock += dt;
    const t = clock, lt = t % LOOP;
    g = bufCtx;
    g.drawImage(bg, 0, 0);
    beams(t);
    const ember = lt > 1.5 && lt < 3.5, rock = lt > 5.5 && lt < 7.5;
    const snakeHurt = lt > 2.9 && lt < 3.4 && Math.sin(t * 40) > 0;
    const hop = rock && lt > 6.4 && lt < 7.2 ? Math.round(Math.sin((lt - 6.4) / .8 * Math.PI) * 8) : 0;
    const lunge = rock ? Math.sin(Math.min(1, (lt - 5.5) / .8) * Math.PI) * .8 : 0;
    const bob = k => (Math.sin(t * 4 + k) > .3 ? 1 : 0);

    const mouth = rockSnake(SN[0], SN[1], t, lunge, snakeHurt);
    shadow(L_POS[0], L_POS[1] + 25, 16);
    sprite(rock && lt < 6.2 ? LEADER_POINT : LEADER, LEADER_PAL, L_POS[0], L_POS[1] - bob(0));
    shadow(T_POS[0], T_POS[1] + 28, 16);
    sprite(ember && lt < 2.4 ? TRAINER_POINT : TRAINER, TRAINER_PAL, T_POS[0], T_POS[1] - bob(1.7));
    shadow(LZ[0], LZ[1] + 1, 18 - hop);
    lizard(LZ[0], LZ[1], t, hop + (lt > 1.5 && lt < 2 ? 1 : 0), ember);

    if (ember && lt > 2) {
      const from = [LZ[0] + 9, LZ[1] - 12], to = [SN[0] - 14, SN[1] - 52];
      for (let i = 0; i < 6; i++) {
        const k = ((lt - 2) * 1.4 + i * .17) % 1;
        const x = from[0] + (to[0] - from[0]) * k, y = from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 10;
        px(K, x - 2, y - 2, 5, 5); px('#ff8a1f', x - 1, y - 1, 3, 3); px('#ffd23a', x, y, 2, 2); px('#fff3a0', x, y, 1, 1);
      }
    }
    if (lt > 2.9 && lt < 3.4) for (let i = 0; i < 12; i++) { const a = i * .52 + t * 3; px(i % 2 ? '#ffd23a' : '#ff8a1f', SN[0] - 14 + Math.cos(a) * (lt - 2.9) * 44, SN[1] - 52 + Math.sin(a) * (lt - 2.9) * 32, 2, 2); }
    if (rock && lt > 6.0) {
      for (let i = 0; i < 3; i++) {
        const k = Math.min(1, (lt - 6.0 - i * .15) / .9);
        if (k <= 0) continue;
        const x = mouth[0] + (LZ[0] + 4 - mouth[0]) * k, y = mouth[1] + (LZ[1] - 4 - mouth[1]) * k - Math.sin(k * Math.PI) * 30;
        stone(x - 4, y - 3, 8, 7, GREY[i]);
        if (k >= 1) for (let j = 0; j < 6; j++) px('#b07c4c', LZ[0] + 4 + (j - 3) * 3, LZ[1] - 2 - (j % 2) * 3, 2, 1);
      }
    }
    present();
  }
  function present() {
    const dpr = devicePixelRatio || 1;
    if (view.width !== Math.round(innerWidth * dpr) || view.height !== Math.round(innerHeight * dpr)) { view.width = Math.round(innerWidth * dpr); view.height = Math.round(innerHeight * dpr); }
    const s = Math.max(1, Math.floor(Math.min(view.width / VW, view.height / VH) * SIZE * 2) / 2);
    vctx.imageSmoothingEnabled = false;
    vctx.fillStyle = '#0a0705'; vctx.fillRect(0, 0, view.width, view.height);
    vctx.drawImage(buf, Math.round((view.width - VW * s) / 2), Math.round((view.height - VH * s) / 2), VW * s, VH * s);
  }
  const loop = ms => { frame(ms); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.gymStep = frame;
})();
