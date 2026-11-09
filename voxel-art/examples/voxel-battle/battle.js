// Voxel battle, MagicaVoxel style: a pastel diorama stadium where a cap-wearing young
// trainer and his yellow electric mouse face the caped champion and his orange fire dragon.
// Rendered with Three.js: small voxels, ambient occlusion, soft shadows and bloom.
(() => {
  'use strict';
  const vx = VoxelGL.create(document.querySelector('#stage'), {
    background: '#f3ece3', floor: -1, size: .62, span: 12, fov: 28, target: [0, 2.2, 0], yaw: .35, pitch: .42
  });
  const T = vx.THREE;
  const M = () => VoxelGL.model();

  // ======================= Diorama stadium =======================
  // Built in 0.2-world-unit voxels (design cell = voxel). y = 4 is the field surface layer.
  {
    const A = M();
    const sand = '#efe0c6', sandDark = '#d8c3a2', sandMid = '#e6d4b6', rim = '#f1ebe1';
    A.box(-68, -5, -40, 67, 3, 39, sand);
    A.box(-68, -5, -40, 67, -4, 39, sandDark);
    A.box(-68, 0, -40, 67, 0, 39, sandMid);
    A.box(-68, 4, -40, 67, 4, 39, rim);
    // Mowed stripes.
    for (let x = -55, i = 0; x <= 54; x += 10, i++) A.box(x, 4, -30, Math.min(54, x + 9), 4, 29, i % 2 ? '#8fd694' : '#7ccb84');
    const L = '#fbfaf4';
    A.box(-55, 4, -30, 54, 4, -30, L); A.box(-55, 4, 29, 54, 4, 29, L);
    A.box(-55, 4, -30, -55, 4, 29, L); A.box(54, 4, -30, 54, 4, 29, L);
    A.box(0, 4, -30, 0, 4, 29, L);
    for (let i = -14; i <= 14; i++) for (let k = -14; k <= 14; k++) {
      const d = Math.hypot(i + .5, k + .5);
      if (Math.abs(d - 12) < .7) A.set(i, 4, k, L);
    }
    for (const sx of [-1, 1]) {        // trainer boxes
      const x0 = sx < 0 ? -55 : 40, x1 = sx < 0 ? -40 : 54;
      A.box(x0, 4, -12, x1, 4, -12, L); A.box(x0, 4, 11, x1, 4, 11, L);
      A.box(sx < 0 ? -40 : 40, 4, -12, sx < 0 ? -40 : 40, 4, 11, L);
    }
    // Low wall around the edge: soft red on one side, soft blue on the other, white posts.
    const wall = (x, z) => {
      const post = (Math.abs(x) + Math.abs(z)) % 12 === 0;
      A.box(x, 5, z, x, 7, z, post ? '#ffffff' : x < 0 ? '#f07a6e' : '#6f9ff0');
    };
    for (let x = -68; x <= 67; x++) for (const z of [-40, -39, 38, 39]) wall(x, z);
    for (let z = -40; z <= 39; z++) for (const x of [-68, -67, 66, 67]) wall(x, z);
    // Corner towers with pennants.
    for (const [x, z] of [[-68, -40], [65, -40], [-68, 37], [65, 37]]) {
      A.box(x, 5, z, x + 2, 13, z + 2, '#ffffff');
      A.box(x, 14, z, x + 2, 15, z + 2, x < 0 ? '#f07a6e' : '#6f9ff0');
    }
    // Little bushes on the rim.
    for (const [x, z] of [[-62, -35], [-62, 34], [61, -35], [61, 34], [-30, -36], [30, 35]]) {
      A.ball(x, 7, z, 3, 2.6, 3, '#7fc77a'); A.ball(x + 1, 8.4, z - 1, 2, 1.8, 2, '#93d68c');
    }
    const arena = vx.mesh(A, { unit: .2, voxel: .2 });
    arena.position.y = 0;   // voxel y = 4 spans world .8 .. 1.0, so the field top sits at y = 1
    vx.scene.add(arena);
  }

  // ======================= Characters =======================
  // --- Young trainer: red-and-white cap, spiky black hair, blue vest, jeans, green gloves ---
  function trainerA(point) {
    const m = M(), skin = '#ffcfa3';
    for (const z of [-2, 1]) { m.box(-1, 0, z, 2, 0, z + 1, '#2a2622'); m.box(-1, 1, z, 1, 1, z + 1, '#e0483c'); m.box(-1, 2, z, 1, 6, z + 1, '#3a5fb0'); }
    m.box(-1, 5, -1, 1, 6, 0, '#3a5fb0');
    m.box(-1, 7, -2, 1, 11, 2, '#2f6fd8');                  // vest
    m.box(1, 8, 0, 1, 11, 0, '#2a2622'); m.box(1, 11, -1, 1, 11, 1, '#2a2622');   // black tee showing
    m.box(-1, 7, -2, 1, 7, 2, '#2a2622');                   // belt
    for (const z of [-3, 3]) {                              // arms
      const pointing = point && z === 3;
      if (pointing) { m.box(0, 10, z, 1, 11, z, '#2a2622'); m.box(2, 10, z, 4, 11, z, skin); m.box(5, 10, z, 5, 11, z, '#3fa34d'); }
      else { m.box(0, 10, z, 0, 11, z, '#2a2622'); m.box(0, 8, z, 0, 9, z, skin); m.box(0, 7, z, 0, 7, z, '#3fa34d'); }
    }
    m.box(-2, 12, -2, 2, 15, 2, skin);                      // head
    m.box(-2, 12, -2, -2, 16, 2, '#1e1c1a');                // hair at the back
    for (const [x, y, z] of [[-3, 13, -1], [-3, 14, 1], [-3, 15, 0], [-3, 12, 0], [-2, 12, -3], [-2, 12, 3], [-1, 15, -3], [-1, 15, 3], [0, 14, -3], [0, 14, 3]]) m.set(x, y, z, '#1e1c1a');
    m.box(-1, 14, -2, 1, 15, -2, '#1e1c1a'); m.box(-1, 14, 2, 1, 15, 2, '#1e1c1a');   // sideburns
    m.set(2, 14, -1, '#1e1c1a'); m.set(2, 14, 1, '#1e1c1a');   // eyes
    m.set(2, 12, 0, '#b8483c');                             // mouth
    m.box(-2, 16, -2, 2, 17, 2, '#e0483c');                 // cap
    m.box(1, 16, -2, 2, 17, 2, '#ffffff');
    m.set(2, 16, 0, '#3fa34d'); m.set(2, 17, 0, '#3fa34d');
    m.box(3, 16, -2, 4, 16, 2, '#e0483c');                  // brim
    return m;
  }

  // --- Champion: long purple hair, black-and-white cap with patches, white top, red cape ---
  function trainerB(point, wave = 0) {
    const m = M(), skin = '#f2c49a';
    for (const z of [-2, 1]) { m.box(-1, 0, z, 2, 0, z + 1, '#ffffff'); m.box(-1, 1, z, 1, 1, z + 1, '#e0483c'); m.box(-1, 2, z, 1, 5, z + 1, '#26232a'); }
    m.box(-1, 5, -2, 1, 7, 2, '#26232a');                   // shorts
    m.box(-1, 6, -2, 1, 6, 2, '#ffffff');
    m.box(-1, 8, -2, 1, 11, 2, '#f4f2ee');                  // top
    m.box(-1, 8, -2, 1, 11, -2, '#26232a'); m.box(-1, 8, 2, 1, 11, 2, '#26232a');
    m.box(1, 9, 0, 1, 10, 0, '#e8b23a');                    // gold emblem
    for (const z of [-3, 3]) {
      const pointing = point && z === 3;
      if (pointing) { m.box(0, 10, z, 1, 11, z, '#f4f2ee'); m.box(2, 10, z, 4, 11, z, skin); m.box(5, 10, z, 5, 11, z, '#26232a'); }
      else { m.box(0, 10, z, 0, 11, z, '#f4f2ee'); m.box(0, 8, z, 0, 9, z, skin); m.box(0, 7, z, 0, 7, z, '#26232a'); }
    }
    // Cape: behind the body, the hem sways backward.
    for (let y = 3; y <= 12; y++) {
      const back = -2 - Math.round((12 - y) * .18 * (1 + wave));
      for (let z = -4; z <= 4; z++) {
        const logo = (y === 8 || y === 9) && Math.abs(z) <= 1;
        m.set(back, y, z, logo ? '#e8b23a' : (y + z) % 5 === 0 ? '#c4302a' : '#e0483c');
      }
    }
    m.box(-2, 12, -2, 2, 15, 2, skin);                      // head
    m.set(2, 14, -1, '#e8b23a'); m.set(2, 14, 1, '#e8b23a');  // golden eyes
    m.set(2, 13, -1, '#3a2a55'); m.set(2, 12, 0, '#3a2a55'); m.set(2, 13, 1, '#3a2a55');  // beard line
    m.box(-2, 7, -2, -3, 16, 2, '#4a2f7a');                 // long purple hair down the back
    m.box(-1, 14, -2, 1, 15, -2, '#4a2f7a'); m.box(-1, 14, 2, 1, 15, 2, '#4a2f7a');
    m.box(-2, 16, -2, 2, 17, 2, '#26232a');                 // cap
    m.box(1, 16, -2, 2, 17, 2, '#ffffff');
    for (const [x, y, z, c] of [[2, 16, -1, '#e0483c'], [2, 17, 1, '#3f7be0'], [0, 17, 2, '#e8b23a'], [-1, 17, -2, '#3fa34d']]) m.set(x, y, z, c);
    m.box(3, 16, -2, 4, 16, 2, '#26232a');
    return m;
  }

  // --- Yellow electric mouse: long black-tipped ears, red cheeks, zig-zag tail ---
  function mouse(cheekGlow = false) {
    const m = M(), Y = '#ffd83a', B = '#a0612b';
    m.ball(0, 4.5, 0, 3, 3.6, 2.8, Y);
    m.ball(.4, 9.6, 0, 3.4, 3, 3.1, Y);
    for (const s of [-1, 1]) {
      for (let k = 0; k <= 6; k++) {
        const x = Math.round(-k * .25), y = 12 + k, z = Math.round(s * (1.4 + k * .45));
        const c = k >= 5 ? '#1e1c1a' : Y;
        m.set(x, y, z, c); m.set(x - 1, y, z, c);
        if (k < 4) m.set(x, y, z - s, c);
      }
      m.box(1, 5, s * 3, 2, 5, s * 3, Y);                   // little arms
      m.box(0, 0, s > 0 ? 1 : -2, 2, 0, s > 0 ? 2 : -1, Y); // feet
      m.set(3, 10, s, '#1e1c1a'); m.set(3, 11, s, '#1e1c1a');   // eyes
      m.set(3, 11, s, '#ffffff');
      m.set(3, 8, s * 2, cheekGlow ? '#fff07a' : '#e8402c'); m.set(2, 8, s * 3, cheekGlow ? '#fff07a' : '#e8402c');
    }
    m.set(4, 9, 0, '#1e1c1a');                              // nose
    m.set(3, 8, 0, '#8a3a2a');                              // mouth
    m.box(-3, 4, -1, -3, 4, 1, B); m.box(-3, 6, -1, -3, 6, 1, B);   // back stripes
    const tail = [[-3, 3], [-4, 3], [-4, 4], [-5, 5], [-5, 6], [-4, 7], [-5, 8], [-6, 8], [-7, 9], [-7, 10], [-6, 11], [-7, 12], [-8, 12], [-9, 13], [-9, 14], [-8, 14], [-8, 15]];
    tail.forEach(([x, y], i) => {
      const c = i < 2 ? B : Y;
      m.set(x, y, 0, c);
      if (i > 8) { m.set(x, y, -1, c); m.set(x, y, 1, c); }
    });
    return m;
  }

  // --- Orange fire dragon: cream belly, horns, teal wings (flap frames), flame-tipped tail ---
  const O = '#f08a30', CR = '#f6d58c', TEAL = '#2f8fa0';
  function dragonBody(mouthOpen = false) {
    const m = M();
    for (const s of [-1, 1]) {
      m.ball(0, 3, s * 2.6, 2.1, 3, 1.7, O);                // legs
      m.box(1, 0, s * 2 - 1, 3, 0, s * 2 + 1, O);
      for (const dz of [-1, 0, 1]) m.set(4, 0, s * 2 + dz, '#ffffff');   // claws
      m.ball(3.2, 10.5, s * 3.2, 1, 1.7, 1, O);            // arms
      m.set(4, 9, s * 3, '#ffffff');
    }
    m.ball(0, 8.5, 0, 3.7, 4.9, 3.3, O);                    // body
    m.ball(2, 8, 0, 2.2, 4, 2.4, CR);                       // belly (only the front shows)
    m.ball(1.6, 13.5, 0, 1.7, 2.6, 1.6, O);                 // neck
    m.box(3, 12, -1, 3, 14, 1, CR);
    m.ball(2.8, 16.6, 0, 2.5, 2, 2, O);                     // head
    m.box(4, 15, -1, 6, 16, 1, O);                          // snout
    if (mouthOpen) { m.box(5, 15, -1, 6, 15, 1, '#c0302a'); m.box(4, 14, -1, 6, 14, 1, O); }
    m.set(6, 16, -1, '#1e1c1a'); m.set(6, 16, 1, '#1e1c1a');   // nostrils
    for (const s of [-1, 1]) {
      m.set(4, 17, s * 2, '#ffffff'); m.set(4, 17, s * 1, '#1b3a8a');   // eyes
      m.box(0, 18, s, -1, 19, s, O); m.set(-2, 19, s, O);   // horns
    }
    // Tail sweeping back and up.
    m.tube([-3, 6, 0], [-6, 4.5, 0], 1.7, 1.4, O);
    m.tube([-6, 4.5, 0], [-9, 6, 0], 1.4, 1, O);
    m.tube([-9, 6, 0], [-9.8, 8.5, 0], 1, .7, O);
    return m;
  }
  const TAIL_TIP = [-10, 9.5, 0];
  const MOUTH = [7, 15.5, 0];
  function dragonWing(f) {
    // f: -1 (down) .. 1 (up). Each wing is a swept, scalloped membrane with an orange bone edge.
    const m = M();
    for (const s of [-1, 1]) {
      for (let d = 0; d <= 10; d++) {
        const top = 1 + d * 1.0, bot = Math.max(-.5, d * .55 - 1 + (d > 6 ? (d - 6) * 1.25 : 0) + (d % 3 === 2 ? .8 : 0));
        const bend = f * d * .65;
        const x = -1 - Math.round(d * .2);
        const z = s * (3 + d);
        for (let y = Math.round(bot); y <= Math.round(top); y++) {
          const edge = y === Math.round(top) || d === 0;
          m.set(x, Math.round(12 + y + bend), z, edge ? O : TEAL);
          m.set(x - 1, Math.round(12 + y + bend), z, edge ? O : '#26707e');
        }
      }
    }
    return m;
  }


  // ======================= Effects (particles) =======================
  let parts = [];
  function burst(p, n, colors, speed = 4, life = .6, size = .22, up = 2) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      const v = speed * (.4 + Math.random() * .6);
      parts.push({ x: p[0], y: p[1], z: p[2], vx: Math.cos(a) * Math.cos(b) * v, vy: Math.sin(b) * v + up, vz: Math.sin(a) * Math.cos(b) * v,
        life, max: life, colors, size: size * (.6 + Math.random() * .7), g: 6 });
    }
  }
  function flame(from, to) {
    for (let i = 0; i < 5; i++) {
      const T = .45 + Math.random() * .15;
      parts.push({ x: from[0], y: from[1], z: from[2],
        vx: (to[0] - from[0]) / T + (Math.random() - .5) * 2, vy: (to[1] - from[1]) / T + (Math.random() - .5) * 2, vz: (to[2] - from[2]) / T + (Math.random() - .5) * 2.4,
        life: T + .15, max: T + .15, colors: ['#fff6b0', '#ffd23a', '#ff9a2a', '#f05a1f', '#c8381a', '#8a8580'], size: .22 + Math.random() * .22, g: -1, grow: 1.3 });
    }
  }
  function stepParts(dt, cube) {
    parts = parts.filter(p => (p.life -= dt) > 0);
    for (const p of parts) {
      p.vy -= p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 1 && p.g > 0) { p.y = 1; p.vy *= -.3; p.vx *= .6; p.vz *= .6; }
      const age = 1 - p.life / p.max;
      const c = p.colors[Math.min(p.colors.length - 1, Math.floor(age * p.colors.length))];
      const s = p.size * (p.grow ? 1 + age * p.grow : 1 - age * .5);
      cube(p.x - s / 2, p.y - s / 2, p.z - s / 2, c, s, 1.35);
    }
  }
  // Lightning: a jagged chain of bright cubes from a to b, re-rolled every frame.
  function bolt(a, b, cube, jag = .9) {
    const N = 9, pts = [a];
    for (let i = 1; i < N; i++) {
      const t = i / N;
      pts.push([a[0] + (b[0] - a[0]) * t + (Math.random() - .5) * jag * .5, a[1] + (b[1] - a[1]) * t + (Math.random() - .5) * jag * 2, a[2] + (b[2] - a[2]) * t + (Math.random() - .5) * jag * 2]);
    }
    pts.push(b);
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], L = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), n = Math.ceil(L / .22);
      for (let k = 0; k < n; k++) {
        const t = k / n, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, z = p[2] + (q[2] - p[2]) * t;
        cube(x - .2, y - .2, z - .2, '#ffffff', .4, 1.5);
        if (k % 2 === 0) cube(x - .3, y - .1, z - .3, '#ffe94a', .26, 1.5);
      }
      if (i % 3 === 1) {   // a small fork
        const fk = [p[0] + (Math.random() - .5) * 1.5, p[1] - .6 - Math.random(), p[2] + (Math.random() - .5) * 1.5];
        for (let k = 0; k < 5; k++) { const t = k / 5; cube(p[0] + (fk[0] - p[0]) * t - .1, p[1] + (fk[1] - p[1]) * t - .1, p[2] + (fk[2] - p[2]) * t - .1, '#fff59a', .2, 1.5); }
      }
    }
  }
  function ring(c, r, cube, color = '#ffffff') {
    const n = Math.max(12, Math.round(r * 7));
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; cube(c[0] + Math.cos(a) * r - .15, c[1], c[2] + Math.sin(a) * r - .15, color, .3, 1.4); }
  }

  // ======================= Battle director =======================
  const LOOP = 16;                 // battle length
  const INTRO = 3.8;               // poke ball send-out before the battle
  const CYCLE = INTRO + LOOP;
  const INTRO_CALLS = [[0, 1.7, 'a', 'Pikachu, I choose you!'], [1.6, 3.4, 'b', 'Go, Charizard!']];
  const THROWS = { a: [.35, 1.15], b: [1.75, 2.55] };   // [throw, open] times
  const A_POS = [-10.2, 1, -.6], B_POS = [10.2, 1, -.6];
  const M_HOME = [-4.6, 1, 0], D_HOME = [4.4, 1.6, 0];
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const CALLS = [
    [0, 1.8, 'a', 'Pikachu, Quick Attack!'],
    [3.2, 5.0, 'b', 'Charizard, Flamethrower!'],
    [6.6, 8.4, 'a', 'Pikachu, Thunderbolt!'],
    [10, 11.4, 'b', 'Charizard, use Fly!'],
    [11.5, 12.8, 'a', 'Iron Tail!'],
    [13.7, 15.6, 'b', "Let's have a champion time!"]
  ];
  const EVENTS = [
    [1.4, 'hit'], [7.8, 'zap'], [12.4, 'clash'], [5.0, 'scorch']
  ];
  let clock = 0, prevT = null, flash = 0, shake = 0;
  const MOVES = [
    [.6, 1.9, 'QUICK ATTACK', '#ffffff', '#6b7280'],
    [3.9, 5.7, 'FLAMETHROWER', '#ffb02e', '#b8351a'],
    [7.6, 8.9, 'THUNDERBOLT', '#ffe94a', '#a07a00'],
    [10.4, 11.8, 'FLY', '#bfe3ff', '#2f6fb0'],
    [11.9, 13, 'IRON TAIL', '#e6ebf2', '#5a6676']
  ];
  // Health over the loop: [time, mouse hp, dragon hp].
  const HP = [[0, 1, 1], [1.4, 1, .82], [5.2, .9, .82], [7.9, .9, .48], [12.4, .66, .3], [15.8, .66, .3]];
  const hpAt = (lt, i) => {
    let a = HP[0];
    for (const h of HP) { if (h[0] <= lt) a = h; }
    const nx = HP[HP.indexOf(a) + 1];
    if (!nx) return a[i];
    const k = Math.min(1, (lt - a[0]) / .5);    // drain over half a second
    const prev = HP[Math.max(0, HP.indexOf(a) - 1)];
    return a === HP[0] ? a[i] : prev[i] + (a[i] - prev[i]) * k;
  };
  const shownHP = [1, 1];

  function state(lt, t) {
    // Mouse position and pose.
    let mx = M_HOME[0], my = M_HOME[1] + Math.abs(Math.sin(t * 4)) * .15, glow = false, streak = false;
    // Dragon position.
    let dx = D_HOME[0], dy = D_HOME[1] + Math.sin(t * 3) * .3, mouthOpen = false, flapSpeed = 6, hurt = 0;

    // A: quick attack dash, hit, flip back.
    if (lt < 3.2) {
      const go = seg(lt, .6, 1.4), back = seg(lt, 1.4, 2.3);
      if (lt < 1.4) { mx = lerp(M_HOME[0], D_HOME[0] - 2.2, ease(go)); my += Math.sin(go * Math.PI) * .6; streak = go > 0 && go < 1; }
      else { mx = lerp(D_HOME[0] - 2.2, M_HOME[0], ease(back)); my += Math.sin(back * Math.PI) * 3; }
      if (lt > 1.4 && lt < 2.2) { dx += (1 - seg(lt, 1.4, 2.2)) * 1.3; hurt = 1 - seg(lt, 1.4, 2.2); }
    }
    // B: flamethrower; the mouse jumps out of the way.
    if (lt >= 3.2 && lt < 6.6) {
      mouthOpen = lt > 3.9 && lt < 5.7;
      const j = seg(lt, 4.4, 5.4);
      my += Math.sin(j * Math.PI) * 3.4; mx -= Math.sin(j * Math.PI) * 1.6;
    }
    // C: thunderbolt charge, then the bolt hits the dragon.
    if (lt >= 6.6 && lt < 10) {
      glow = lt > 7 && lt < 8.7;
      if (lt > 7.8 && lt < 9.2) { hurt = 1 - seg(lt, 7.8, 9.2); dx += Math.sin(t * 60) * .25 * hurt; }
    }
    // D: dragon flies up and dives; the mouse leaps in with Iron Tail; they clash mid-field.
    if (lt >= 10 && lt < 13.6) {
      const up = seg(lt, 10.4, 11.8), dive = seg(lt, 11.8, 12.4), ret = seg(lt, 12.4, 13.4);
      flapSpeed = 11;
      if (lt < 11.8) { dy = lerp(D_HOME[1], 9, ease(up)); dx = lerp(D_HOME[0], 3, ease(up)); }
      else if (lt < 12.4) { dy = lerp(9, 2.4, dive * dive); dx = lerp(3, 1.4, dive); }
      else { dy = lerp(3.4, D_HOME[1], ease(ret)); dx = lerp(2, D_HOME[0], ease(ret)); }
      const leap = seg(lt, 11.9, 12.4);
      if (lt < 12.4) { mx = lerp(M_HOME[0], -1.2, ease(leap)); my += Math.sin(leap * Math.PI * .5) * 3; }
      else { mx = lerp(-2, M_HOME[0], ease(ret)); my += (1 - ret) * 3 * (1 - ret); }
    }
    return { mx, my, glow, streak, dx, dy, mouthOpen, flapSpeed, hurt };
  }

  // ======================= Meshes =======================
  const VOX = .09;   // one voxel size for every character, so they read as one style
  const UH = .27, UM = .21, UD = .34;   // world size of a design cell: humans, mouse, dragon
  // A character = group of variant meshes; show(i) picks one.
  function character(models, unit) {
    const g = new T.Group(), mat = vx.material();
    const meshes = models.map(m => { const me = vx.mesh(m, { unit, voxel: VOX, material: mat }); me.visible = false; g.add(me); return me; });
    meshes[0].visible = true;
    vx.scene.add(g);
    let cur = 0;
    return {
      g, mat,
      show(i) { if (i !== cur) { meshes[cur].visible = false; meshes[i].visible = true; cur = i; } },
      at(x, y, z, flip, sc = 1) { g.visible = sc > .01; g.position.set(x, y, z); g.scale.set((flip ? -1 : 1) * sc, sc, sc); },
      hurt(on) { mat.emissive.setRGB(on ? .35 : 0, on ? .35 : 0, on ? .35 : 0); }
    };
  }
  const ash = character([trainerA(false), trainerA(true)], UH);
  const leon = character([0, 1, 2].flatMap(w => [trainerB(false, w * .5), trainerB(true, w * .5)]), UH);
  const pika = character([mouse(false), mouse(true)], UM);
  const zard = character([dragonBody(false), dragonBody(true)], UD);
  const wings = character(Array.from({ length: 7 }, (_, i) => dragonWing(-1 + i / 3)), UD);
  wings.mat = zard.mat;
  wings.g.children.forEach(m => { m.material = zard.mat; });

  // Poke ball: red top, white bottom, black band, white button (design cell = voxel).
  function pokeball() {
    const m = M(), R = 4;
    for (let i = -R; i < R; i++) for (let j = -R; j < R; j++) for (let k = -R; k < R; k++) {
      const x = i + .5, y = j + .5, z = k + .5;
      if (x * x + y * y + z * z > R * R) continue;
      let c = y > .6 ? '#e8423a' : '#f6f4f0';
      if (Math.abs(y) <= .6) c = '#2a2622';
      if (x > 2.4 && Math.abs(y) < 1.4 && Math.abs(z) < 1.4) c = Math.abs(y) < .7 && Math.abs(z) < .7 ? '#ffffff' : '#2a2622';
      m.set(i, j, k, c);
    }
    const me = vx.mesh(m, { unit: .07, voxel: .07 });
    me.geometry.translate(0, 0, 0);
    const g = new T.Group(); g.add(me); g.visible = false; vx.scene.add(g);
    return g;
  }
  const balls = { a: pokeball(), b: pokeball() };

  // Effects use centre-positioned glowing cubes; this keeps the older min-corner calls working.
  let fxFn = null;
  const cube = (x, y, z, c, s = 1, k = 1) => fxFn(x + s / 2, y + s / 2, z + s / 2, c, s, k * 1.3);

  let trail = [];
  vx.start((t, dt, fx) => {
    fxFn = fx;
    const beforeRaw = clock % CYCLE;
    clock += dt;
    const raw = clock % CYCLE, lt = raw - INTRO, before = beforeRaw - INTRO;
    const crossed = at => (before < at && lt >= at) || (raw < beforeRaw && at >= before);
    const crossedRaw = at => (beforeRaw < at && raw >= at) || (raw < beforeRaw && at >= beforeRaw);
    const S = state(lt < 0 ? -1 : lt, t);
    // Grow out of the ball / shrink back at the very end of the cycle.
    const grow = (open) => { const k = Math.max(0, Math.min(1, (raw - open) / .45)); return k <= 0 ? 0 : k < 1 ? ease(k) * (1 + .15 * Math.sin(k * Math.PI)) : 1; };
    const recall = raw > CYCLE - .5 ? Math.max(0, (CYCLE - raw) / .5) : 1;
    const pikaScale = Math.min(grow(THROWS.a[1]), recall), zardScale = Math.min(grow(THROWS.b[1]), recall);

    // Poke balls arc from each trainer's hand to the creature's spot, then burst open.
    for (const who of ['a', 'b']) {
      const [t0, t1] = THROWS[who], g = balls[who];
      const from = who === 'a' ? [A_POS[0] + 1.4, A_POS[1] + 3, A_POS[2] + .8] : [B_POS[0] - 1.4, B_POS[1] + 3, B_POS[2] + .8];
      const to = who === 'a' ? [M_HOME[0], 1.3, 0] : [D_HOME[0] - 1, 1.3, 0];
      if (raw >= t0 && raw < t1) {
        const k = (raw - t0) / (t1 - t0);
        g.visible = true;
        g.position.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(k * Math.PI) * 2.6, from[2] + (to[2] - from[2]) * k);
        g.rotation.z = (who === 'a' ? -1 : 1) * k * 14;
      } else g.visible = false;
      if (crossedRaw(t1)) {
        burst([to[0], to[1] + .4, to[2]], 40, ['#ffffff', '#fff3c4', '#ffd6d2', '#ffffff'], 6, .6, .14, 2);
        flash = Math.max(flash, .35);
        shake = Math.max(shake, .2);
      }
      // A white beam column while the creature materialises.
      if (raw >= t1 && raw < t1 + .45) {
        const k = (raw - t1) / .45;
        for (let i = 0; i < 14; i++) fx(to[0] + (Math.random() - .5) * .8, to[1] + Math.random() * 3 * (1 - k * .4), to[2] + (Math.random() - .5) * .8, '#ffffff', .12 + Math.random() * .1, 2.2);
      }
    }
    // Recall flash at the end.
    // Sound cues (raw cycle seconds; battle moves are offset by the intro).
    const A = window.BattleAudio;
    if (A) {
      const B = x => x + INTRO;
      const CUES = [[0, 'call'], [THROWS.a[0], 'throw'], [THROWS.a[1], 'open'], [1.6, 'call'], [THROWS.b[0], 'throw'], [THROWS.b[1], 'open'],
        [B(0), 'call'], [B(.6), 'dash'], [B(1.4), 'hit'], [B(3.2), 'call'], [B(3.9), 'flameOn'], [B(5.7), 'flameOff'],
        [B(6.6), 'call'], [B(7), 'charge'], [B(7.8), 'zap'], [B(10), 'call'], [B(10.4), 'whoosh'], [B(11.5), 'call'], [B(11.8), 'whoosh'],
        [B(12.4), 'clash'], [B(13.7), 'call'], [CYCLE - .5, 'recall']];
      for (const [at, name] of CUES) if (crossedRaw(at)) A.sfx(name);
    }
    if (crossedRaw(CYCLE - .5)) { burst([M_HOME[0], 2, 0], 20, ['#ff6a5a', '#ffffff'], 4, .5, .12, 1); burst([D_HOME[0], 3, 0], 24, ['#ff6a5a', '#ffffff'], 4, .5, .12, 1); }
    const mouthW = [S.dx - MOUTH[0] * UD, S.dy + MOUTH[1] * UD, MOUTH[2] * UD];
    const mouseHead = [S.mx + 1 * UM, S.my + 10 * UM, 0];
    const dragonChest = [S.dx - 1.5 * UD, S.dy + 9 * UD, 0];

    if (crossed(1.4)) { burst([S.dx - 1.5, S.dy + 2.4, 0], 30, ['#ffffff', '#fff59a', '#ffd23a'], 6, .5, .16); shake = .35; }
    if (crossed(7.8)) { flash = 1; shake = .5; }
    if (crossed(12.4)) { flash = .8; shake = .6; burst([-.6, 3.2, 0], 50, ['#ffffff', '#d8e6ff', '#9fb6d8'], 8, .6, .18, 1); }
    if (lt > 7.8 && lt < 8.8 && Math.random() < .6) burst(dragonChest, 3, ['#ffffff', '#fff59a'], 5, .35, .12);
    if (lt > 7 && lt < 7.8 && Math.random() < .8) burst([S.mx + .3, S.my + 1.4, 0], 2, ['#fff59a', '#ffffff'], 3, .3, .1, 1);
    if (S.mouthOpen) {
      flame(mouthW, [M_HOME[0] + .5, 1.2, 0]); flame(mouthW, [M_HOME[0] + .5, 1.2, 0]);
      if (Math.random() < .6) burst([M_HOME[0] + .5, 1.3, 0], 2, ['#ffd23a', '#ff9a2a', '#8a8580'], 3, .5, .2, 2);
    }

    // Trainers.
    const calling = who => CALLS.some(([a, b, w]) => w === who && lt >= a && lt < b) || INTRO_CALLS.some(([a, b, w]) => w === who && raw >= a && raw < b);
    ash.show(calling('a') ? 1 : 0); ash.at(A_POS[0], A_POS[1], A_POS[2], false);
    const cw = Math.floor((Math.sin(t * 2.2) * .5 + .5) * 2.99);
    leon.show(cw * 2 + (calling('b') ? 1 : 0)); leon.at(B_POS[0], B_POS[1], B_POS[2], true);

    // Mouse + speed streak.
    if (S.streak) trail.push([S.mx, S.my]); else trail = [];
    trail = trail.slice(-10);
    trail.forEach(([x, y], i) => fx(x, y + .9, 0, '#ffffff', .5 * (i + 1) / trail.length, 1.6));
    pika.show(S.glow ? 1 : 0); pika.at(S.mx, S.my, -.1, false, pikaScale);
    if (S.glow) for (let i = 0; i < 3; i++) fx(S.mx + 1 * UM * 3, S.my + 8 * UM + Math.random() * .2, (i - 1) * .4, '#fff07a', .12, 2.2);
    if (lt >= 11.9 && lt < 12.5) ring([S.mx - 1.2, S.my + 2, 0], .6 + Math.sin(t * 30) * .1, cube, '#dfe8f4');

    // Dragon.
    const f = Math.sin(t * S.flapSpeed);
    zard.show(S.mouthOpen ? 1 : 0); zard.at(S.dx, S.dy, 0, true, zardScale);
    wings.show(Math.round((f + 1) * 3)); wings.at(S.dx, S.dy, 0, true, zardScale);
    const hurtBlink = S.hurt > 0 && Math.sin(t * 40) > 0;
    zard.hurt(hurtBlink);
    const tip = [S.dx - TAIL_TIP[0] * UD - UD, S.dy + TAIL_TIP[1] * UD, 0];
    for (let i = 0; i < (zardScale > .5 ? 10 : 0); i++) {
      const h = (t * 3 + i / 10) % 1, s = .42 * (1 - h);
      fx(tip[0] + Math.sin(t * 9 + i) * .14, tip[1] + h * 1.1, tip[2] + Math.cos(t * 7 + i) * .14, ['#fff6b0', '#ffd23a', '#ff8a1f', '#f05a1f'][i % 4], s, 1.8);
    }

    if (lt > 7.8 && lt < 8.7) bolt([mouseHead[0] + .3, mouseHead[1] + .6, 0], dragonChest, cube, 1.2);
    if (lt > 12.4 && lt < 13.2) { const k = seg(lt, 12.4, 13.2); ring([-.6, 3.2, 0], .5 + k * 5, cube); ring([-.6, 1.1, 0], .5 + k * 7, cube, '#e8eef8'); }
    stepParts(dt, cube);

    // Effect light: fire glows orange, lightning white-yellow, the clash cool white.
    const L = vx.fxLight;
    L.intensity = 0;
    if (S.mouthOpen) { L.color.set('#ff8a2a'); L.position.set(mouthW[0] - 2, mouthW[1] - 1, 0); L.intensity = 2.4 + Math.random() * .6; }
    if (S.glow) { L.color.set('#fff2a0'); L.position.set(S.mx + .4, S.my + 1.6, .6); L.intensity = 1.4 + Math.random(); }
    if (lt > 7.8 && lt < 8.7) { L.color.set('#fff6c8'); L.position.set((mouseHead[0] + dragonChest[0]) / 2, 3.5, .8); L.intensity = 4 + Math.random() * 2; }
    if (lt > 12.4 && lt < 13) { L.color.set('#e4eeff'); L.position.set(-.6, 3.4, 1); L.intensity = 5 * (1 - seg(lt, 12.4, 13)); }

    shake = Math.max(0, shake - dt * 1.2);
    flash = Math.max(0, flash - dt * 2.2);
    vx.view.shake = [(Math.random() - .5) * shake * .6, (Math.random() - .5) * shake * .6];
  }, {
    sway: { base: .35, amp: .3, speed: .12 },
    overlay: (t, ctx) => {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const ui = Math.max(1, Math.min(W, H) / 640);
      if (flash > 0) { ctx.fillStyle = `rgba(255,252,225,${flash * .55})`; ctx.fillRect(0, 0, W, H); }
      const raw = clock % CYCLE, lt = raw - INTRO;

      // Speech bubbles.
      for (const [a, b, who, text] of [...CALLS.map(c => [c[0] + INTRO, c[1] + INTRO, c[2], c[3]]), ...INTRO_CALLS]) {
        if (raw < a || raw >= b) continue;
        const P = who === 'a' ? A_POS : B_POS;
        const [sx, sy0] = vx.project(P[0], P[1] + 5.3, P[2]);
        const sy = sy0 - 64 * ui;   // sit above the HP card
        const fs = 17 * ui;
        ctx.font = `${fs}px "Lilita One", "Arial Black", sans-serif`;
        const w = ctx.measureText(text).width + fs * 1.3, h = fs * 1.8;
        const pop = Math.min(1, (raw - a) / .15);
        const bx = Math.max(8, Math.min(W - w - 8, sx - w / 2)), by = sy - h - fs * .6;
        ctx.save();
        ctx.translate(bx + w / 2, by + h / 2); ctx.scale(pop, pop); ctx.translate(-(bx + w / 2), -(by + h / 2));
        ctx.shadowColor = 'rgba(60,40,20,.18)'; ctx.shadowBlur = 10 * ui; ctx.shadowOffsetY = 3 * ui;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(bx, by, w, h, h * .45); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx - fs * .45, by + h - 1); ctx.lineTo(sx, by + h + fs * .65); ctx.lineTo(sx + fs * .45, by + h - 1); ctx.closePath(); ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = who === 'a' ? '#2f6fd8' : '#e0483c';
        ctx.beginPath(); ctx.roundRect(bx, by, 6 * ui, h, [h * .45, 0, 0, h * .45]); ctx.fill();
        ctx.fillStyle = '#2a2f3d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + w / 2 + 3 * ui, by + h / 2 + fs * .05);
        ctx.restore();
      }

      // HP panels.
      // HP card floats just above each trainer's head.
      // Cards lean outward (away from the field) so they never cover the creatures.
      const panel = (P, name, trainer, hp, accent, side) => {
        const [ax, ay] = vx.project(P[0], P[1] + 5.3, P[2]);
        const pw = 190 * ui, ph = 54 * ui;
        const px = Math.max(8, Math.min(W - pw - 8, side < 0 ? ax - pw + 40 * ui : ax - 40 * ui)), py = ay - ph - 8 * ui;
        ctx.save();
        ctx.shadowColor = 'rgba(60,40,20,.16)'; ctx.shadowBlur = 14 * ui; ctx.shadowOffsetY = 4 * ui;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 16 * ui); ctx.fill();
        ctx.restore();
        ctx.fillStyle = accent; ctx.beginPath(); ctx.roundRect(px, py, 7 * ui, ph, [16 * ui, 0, 0, 16 * ui]); ctx.fill();
        ctx.fillStyle = '#2a2f3d'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        ctx.font = `${17 * ui}px "Lilita One", "Arial Black", sans-serif`;
        ctx.fillText(name, px + 16 * ui, py + 23 * ui);
        ctx.font = `${12 * ui}px "Lilita One", "Arial Black", sans-serif`; ctx.fillStyle = '#9aa0ab'; ctx.textAlign = 'right';
        ctx.fillText(trainer, px + pw - 14 * ui, py + 22 * ui);
        const bx = px + 16 * ui, by = py + 32 * ui, bw = pw - 30 * ui, bh = 10 * ui;
        ctx.fillStyle = '#eef0f3'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();
        ctx.fillStyle = hp > .5 ? '#4cc96a' : hp > .25 ? '#f5b80b' : '#ef5a4a';
        ctx.beginPath(); ctx.roundRect(bx, by, Math.max(bh, bw * hp), bh, bh / 2); ctx.fill();
      };
      shownHP[0] += (hpAt(lt, 1) - shownHP[0]) * .2;
      shownHP[1] += (hpAt(lt, 2) - shownHP[1]) * .2;
      if (lt < .1) { shownHP[0] = 1; shownHP[1] = 1; }
      const showCards = raw > THROWS.a[1];
      if (showCards) panel(A_POS, 'PIKACHU', 'ASH', shownHP[0], '#2f6fd8', -1);
      if (raw > THROWS.b[1]) panel(B_POS, 'CHARIZARD', 'LEON', shownHP[1], '#e0483c', 1);

      // Move banner.
      for (const [a, b, name, fill, stroke] of MOVES) {
        if (lt < a || lt >= b) continue;
        const k = Math.min(1, (lt - a) / .18), out = Math.min(1, (b - lt) / .2);
        const fs = 46 * ui * (1.3 - .3 * k);
        ctx.save();
        ctx.globalAlpha = Math.min(k, out);
        ctx.font = `${fs}px "Lilita One", "Arial Black", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.lineWidth = fs * .22; ctx.strokeStyle = stroke;
        ctx.strokeText(name, W / 2, 120 * ui); ctx.fillStyle = fill; ctx.fillText(name, W / 2, 120 * ui);
        ctx.restore();
      }
    }
  });
})();
