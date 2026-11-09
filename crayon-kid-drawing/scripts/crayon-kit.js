// CrayonKit: draw a child's crayon picture entirely from code, on an HTML canvas.
// Wobbly waxy lines, scribbled fills that go outside the lines, paper grain, "boiling"
// re-drawn lines, plus kid-drawing scene pieces (corner sun, sky strip, clouds, a grass
// field) and a configurable running/standing kid figure.
//
//   const kit = CrayonKit.create(canvas, { W: 1180, H: 660, size: .9 });
//   kit.start(t => { kit.skyStrip({ t }); kit.sun({ t }); kit.field({ t }); kit.kid(spec, x, y, t); });
//
// All coordinates are paper units (0..W, 0..H). The kit scales the paper to the window.
(function (global) {
  'use strict';

  // Crayon-box colours: bright and pure, never blended.
  const COLORS = {
    paper: '#fbf8f1', black: '#2a2622', brown: '#7a4a2a', red: '#e0352b', pink: '#f28ba0',
    hotpink: '#e8507a', lightpink: '#f7a8c4', orange: '#f5891f', yellow: '#ffd21f',
    peach: '#f9c9a0', blue: '#2f7fe0', sky: '#5cb6f2', navy: '#1f4fa8', teal: '#1f9aa8',
    green: '#47b33c', lime: '#8cc63f', dgreen: '#2f8a2c', white: '#ffffff', grey: '#9a948a'
  };

  // Small seeded RNG (mulberry32).
  function rng(seed) {
    let s = seed | 0;
    return () => {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function create(canvas, opts = {}) {
    const W = opts.W || 900, H = opts.H || 640;
    const SIZE = opts.size || .88;            // share of the window the paper fills
    const BOIL_RATE = opts.boil ?? 6;          // line re-rolls per second (0 = still)
    const FPS = opts.fps || 30;
    const K = Object.assign({}, COLORS, opts.colors);
    const ctx = canvas.getContext('2d');
    let BOIL = 0;
    // Each stroke has a fixed seed; BOIL re-rolls all of them a few times a second.
    const wob = seed => rng(seed * 7919 + BOIL * 104729);

    // ---------- Paper: off-white sheet with grain and a crease (drawn once) ----------
    const paper = document.createElement('canvas');
    paper.width = W; paper.height = H;
    const grain = document.createElement('canvas');
    grain.width = W; grain.height = H;
    {
      const p = paper.getContext('2d'), r = rng(42);
      p.fillStyle = K.paper; p.fillRect(0, 0, W, H);
      for (let i = 0; i < W * H / 65; i++) {
        p.fillStyle = r() < .5 ? 'rgba(120,100,70,.06)' : 'rgba(255,255,255,.7)';
        p.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
      }
      p.strokeStyle = 'rgba(120,100,70,.08)'; p.lineWidth = 2;
      p.beginPath(); p.moveTo(W * .62, 0); p.lineTo(W * .58, H); p.stroke();
      // Paper-coloured specks laid over every fill, so the grain shows through the wax.
      const gr = grain.getContext('2d');
      for (let i = 0; i < W * H / 22; i++) {
        gr.fillStyle = `rgba(251,248,241,${.35 + r() * .5})`;
        gr.fillRect(r() * W, r() * H, 1 + r() * 1.6, 1 + r() * 1.6);
      }
    }

    // ---------- View ----------
    let view = { s: 1, ox: 0, oy: 0 };
    const applyView = () => ctx.setTransform(view.s, 0, 0, view.s, view.ox, view.oy);
    function fit() {
      const dpr = devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const s = Math.min(canvas.width * SIZE / W, canvas.height * SIZE / H);
      view = { s, ox: (canvas.width - W * s) / 2, oy: (canvas.height - H * s) / 2 };
    }

    // ---------- Primitives ----------
    // Points on an ellipse (or an arc of one).
    const ell = (cx, cy, rx, ry, n = 22, a0 = 0, a1 = Math.PI * 2) =>
      Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

    // A waxy crayon line: resample, wobble, then stamp grainy flecks with random skips.
    function line(pts, color, w = 5, seed = 1, closed = false) {
      const r = wob(seed);
      const list = closed ? [...pts, pts[0]] : pts;
      const P = [];
      for (let i = 0; i < list.length - 1; i++) {
        const [ax, ay] = list[i], [bx, by] = list[i + 1];
        const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / 5));
        const nx = -(by - ay) / (len || 1), ny = (bx - ax) / (len || 1);
        for (let k = 0; k < n; k++) {
          const t = k / n, j = (r() - .5) * w * .45 + Math.sin((P.length + seed) * .35) * w * .35;
          P.push([ax + (bx - ax) * t + nx * j, ay + (by - ay) * t + ny * j]);
        }
      }
      P.push(list[list.length - 1]);
      ctx.fillStyle = color;
      for (let i = 0; i < P.length - 1; i++) {
        const [ax, ay] = P[i], [bx, by] = P[i + 1];
        const steps = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / (w * .3)));
        for (let k = 0; k < steps; k++) {
          const x = ax + (bx - ax) * k / steps, y = ay + (by - ay) * k / steps;
          for (let d = 0; d < 2; d++) {
            if (r() < .14) continue;                     // the wax skipped the paper here
            ctx.globalAlpha = .55 + r() * .4;
            const s = w * (.32 + r() * .32);
            ctx.fillRect(x + (r() - .5) * w * .6 - s / 2, y + (r() - .5) * w * .6 - s / 2, s, s);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // A scribbled fill: back-and-forth hatching clipped to the shape grown a little and nudged,
    // so the colour spills outside the lines, then paper grain on top.
    function fill(pts, color, seed = 1, { gap = 7, angle = -.55, w = 7, over = 1.06 } = {}) {
      const r = wob(seed + 500);
      let cx = 0, cy = 0;
      for (const [x, y] of pts) { cx += x; cy += y; }
      cx /= pts.length; cy /= pts.length;
      const R = Math.max(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy))) * over + 6;
      const dx = (r() - .5) * 6, dy = (r() - .5) * 6;
      ctx.save();
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const px = cx + (x - cx) * over + dx, py = cy + (y - cy) * over + dy;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.closePath();
      ctx.clip();
      ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha = .78;
      ctx.beginPath();
      let dir = 1;
      for (let y = -R; y <= R; y += gap) {
        const x0 = -R * dir, x1 = R * dir;
        if (y === -R) ctx.moveTo(x0, y + (r() - .5) * 3);
        ctx.lineTo(x1, y + (r() - .5) * 4);
        ctx.lineTo(x1, y + gap * .5);
        dir = -dir;
      }
      ctx.stroke();
      // A few heavier strokes across, like pressing harder.
      ctx.globalAlpha = .35;
      ctx.lineWidth = w * .6;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const y = (r() - .5) * 2 * R; ctx.moveTo(-R, y); ctx.lineTo(R, y + (r() - .5) * 20); }
      ctx.stroke();
      ctx.globalAlpha = 1;
      applyView();
      // Grain only over the shape's box (much cheaper than the whole sheet).
      const bx = Math.max(0, Math.floor(cx - R)), by = Math.max(0, Math.floor(cy - R));
      const bw = Math.min(W, Math.ceil(cx + R)) - bx, bh = Math.min(H, Math.ceil(cy + R)) - by;
      if (bw > 0 && bh > 0) ctx.drawImage(grain, bx, by, bw, bh, bx, by, bw, bh);
      ctx.restore();
    }
    // Fill + outline in one call. Either colour may be null.
    const shape = (pts, fillColor, edge, seed, ew = 4.5, opt) => {
      if (fillColor) fill(pts, fillColor, seed, opt);
      if (edge) line(pts, edge, ew, seed + 1, true);
    };
    // Kid handwriting.
    function text(str, x, y, { color = K.red, size = 46, angle = 0, align = 'left', font = 'Gaegu, "Comic Sans MS", cursive' } = {}) {
      ctx.save();
      ctx.font = `700 ${size}px ${font}`;
      ctx.fillStyle = color; ctx.textAlign = align;
      ctx.translate(x, y); ctx.rotate(angle);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    }

    // ---------- Scene pieces ----------
    // Corner sun with turning rays and a smile.
    function sun({ x = 105, y = 95, r = 48, t = 0, face = true } = {}) {
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + t * .25;
        line([[x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2], [x + Math.cos(a) * r * 1.85, y + Math.sin(a) * r * 1.85]], K.orange, 6, 40 + i);
      }
      shape(ell(x, y, r, r), K.yellow, K.orange, 30, 5);
      if (!face) return;
      line([[x - r * .33, y - r * .17], [x - r * .29, y - r * .04]], K.black, 5, 33);
      line([[x + r * .29, y - r * .17], [x + r * .33, y - r * .04]], K.black, 5, 34);
      line(ell(x, y + r * .12, r * .42, r * .3, 10, .3, Math.PI - .3), K.black, 4, 35);
    }
    // A bumpy outlined cloud (kids outline clouds rather than fill them).
    function cloud(x, y, s = 1, seed = 60, color = K.blue) {
      const pts = [];
      const bumps = [[-60, 6, 26], [-30, -16, 30], [8, -24, 34], [44, -10, 28], [66, 8, 22]];
      for (const [bx, by, br] of bumps) pts.push(...ell(x + bx * s, y + by * s, br * s, br * s * .9, 8, Math.PI * .85, Math.PI * 2.15));
      pts.push([x + 70 * s, y + 24 * s], [x - 66 * s, y + 24 * s]);
      shape(pts, null, color, seed, 4);
    }
    // The classic sky: a scribbled blue strip across the top, with drifting clouds.
    function skyStrip({ bottom = 160, t = 0, clouds = 3, color = K.sky } = {}) {
      const edge = [];
      for (let x = 0; x <= W; x += 30) edge.push([x, bottom + Math.sin(x * .02) * 10]);
      fill([[0, 0], [W, 0], ...edge.reverse()], color, 10, { gap: 8, angle: -.2, w: 8 });
      for (let i = 0; i < clouds; i++) {
        const span = W + 260;
        const cx = ((i * span / clouds + t * (14 + i * 4)) % span) - 130;
        cloud(cx, bottom - 10 + (i % 3) * 45, .9 - (i % 3) * .12, 60 + i * 7);
      }
    }
    // A rectangle of grass (how kids draw "the ground"), with tufts that can scroll
    // left to suggest running. Returns the rectangle so figures can be placed on it.
    function field({ x = 30, y = 400, w = W - 60, h = H - 430, t = 0, speed = 150, tufts = 26, color = K.green, edge = K.dgreen, flowers = 0 } = {}) {
      const rect = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      fill(rect, color, 20, { gap: 8, angle: .25, w: 9, over: 1.0 });
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      for (let i = 0; i < tufts; i++) {
        const tx = x + (((i * 97 - t * speed) % (w + 40)) + w + 40) % (w + 40) - 20;
        const ty = y + 30 + (i * 53 % Math.max(1, h - 50));
        line([[tx - 8, ty], [tx - 4, ty - 14], [tx, ty], [tx + 4, ty - 16], [tx + 8, ty]], edge, 4, 200 + i);
      }
      for (let i = 0; i < flowers; i++) {
        const fx = x + (((i * 233 + 60 - t * speed) % (w + 40)) + w + 40) % (w + 40) - 20;
        const fy = y + 40 + (i * 71 % Math.max(1, h - 60));
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; shape(ell(fx + Math.cos(a) * 7, fy + Math.sin(a) * 7, 5, 5, 8), K.pink, null, 260 + i * 9 + k, 3, { gap: 3, w: 3 }); }
        shape(ell(fx, fy, 4, 4, 8), K.yellow, null, 250 + i, 3, { gap: 3, w: 3 });
      }
      ctx.restore();
      line(rect, edge, 6, 21, true);
      return { x, y, w, h };
    }
    // Scribbled shadow under a figure.
    const shadow = (x, y, w, seed = 300) => fill(ell(x, y, w, w * .17, 16), K.dgreen, seed, { gap: 6, angle: 0, w: 6 });
    // Tape on the top corners of the sheet (drawn outside the clip).
    function tape() {
      ctx.fillStyle = 'rgba(232, 214, 170, .7)';
      for (const [x, y, a] of [[60, -6, -.5], [W - 60, -6, .5]]) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-46, -14, 92, 28); ctx.restore();
      }
    }

    // ---------- The kid figure ----------
    // spec (the character, all optional):
    //   seed, scale, body (torso width factor), head (head size factor), phase, speed
    //   skin, hair: { style: 'messy'|'spiky'|'short'|'pigtails'|'bald', color, tie }
    //   glasses, brows, nose: 'none'|'pointy', blush, mouthSize
    //   top: { color, edge, collar: 'none'|'v'|'polo'|'sailor'|'crew', stripe, bow }
    //   bottom: { type: 'shorts'|'pants'|'skirt', color, edge, stripe }
    //   socks, shoes: { color, edge }
    // pose (what they are doing right now, all optional):
    //   action: 'run'|'walk'|'stand'|'wave'|'cheer'|'jump'|'point'|'kick'|'fly'
    //   rise: lift off the ground (units), copter: propeller hat on the head
    //   eyes: 'happy' (><) | 'dot' | 'closed' (^^) | 'wide'
    //   mouth: 'open' | 'smile' | 'o' | 'frown' | 'grin'
    //   sweat: true, hold: true (front hand raised to hold a prop), kick: 0..1 (with action 'kick')
    function kid(spec, x, y, t, pose = {}) {
      const S = spec.seed ? spec.seed * 1000 : 0;
      const s = spec.scale || 1, bw = spec.body || 1, hs = spec.head || 1;
      const skin = spec.skin || K.peach;
      const hair = Object.assign({ style: 'messy', color: K.black }, spec.hair);
      const top = Object.assign({ color: K.yellow, edge: K.orange, collar: 'v' }, spec.top);
      const bot = Object.assign({ type: 'shorts', color: K.blue, edge: K.navy }, spec.bottom);
      const shoes = Object.assign({ color: K.blue, edge: K.navy }, spec.shoes);
      const socks = spec.socks === undefined ? K.white : spec.socks;
      const action = pose.action || (spec.run === false ? 'stand' : 'run');
      const p = t * (spec.speed || 9) + (spec.phase || 0);
      const lw = 1 + (bw - 1) * .5;            // chunkier limbs on wider bodies

      // Limb angles (0 = straight down, + = toward screen right) and body lift per action.
      let sw = 0, lift = 0, legs, arms;
      const still = [[-.1, 0], [.1, 0]];
      const down = [[-.32, .25], [.32, -.25]];
      if (action === 'run') {
        sw = Math.sin(p); lift = Math.abs(Math.cos(p)) * 10;
        legs = [[-sw * 1.05, -sw > 0 ? .15 : 1.1], [sw * 1.05, sw > 0 ? .15 : 1.1]];
        arms = [[Math.PI * .5 - sw * 1.2 + .5, 1.2], [Math.PI * .5 + sw * 1.2 - .5, 1.2]];
      } else if (action === 'walk') {
        sw = Math.sin(p * .55) * .5; lift = Math.abs(Math.cos(p * .55)) * 4;
        legs = [[-sw, sw < 0 ? 0 : .5], [sw, sw < 0 ? .5 : 0]];
        arms = [[-.3 + sw * .8, .3], [.3 + sw * .8, -.3]];
      } else if (action === 'jump' || action === 'cheer') {
        const j = Math.abs(Math.sin(p * .6));
        lift = j * (action === 'jump' ? 40 : 22);
        legs = j > .3 ? [[-.5, .9], [.5, -.9]] : still;
        const wig = Math.sin(p * 1.4) * .15;
        arms = [[-2.6 + wig, -.25], [2.6 - wig, .25]];
      } else if (action === 'wave') {
        legs = still;
        arms = [down[0], [2.5, .45 + Math.sin(t * 10) * .45]];
      } else if (action === 'point') {
        legs = still;
        arms = [down[0], [1.75, 0]];
      } else if (action === 'kick') {
        const k = pose.kick ?? Math.max(0, Math.sin(p * .5));
        legs = [[-.05, 0], [.2 + k * 1.1, k * -.2]];
        arms = [[-1.4, -.5], [1.2, .4]];
      } else if (action === 'fly') {
        // Floating: legs dangle and kick slowly, arms spread out like wings.
        const f = Math.sin(t * 4 + (spec.phase || 0));
        lift = 4 + f * 4;
        legs = [[-.25 + f * .2, .5], [.25 - f * .2, -.5]];
        arms = [[-1.9 + f * .25, -.3], [1.9 - f * .25, .3]];
      } else {
        legs = still; arms = down;
      }
      if (pose.hold) arms[1] = [2.7, .5];
      const rise = (pose.rise || 0);
      const bounce = lift * s;
      const base = y - bounce - rise;
      const P = (px, py) => [x + px * s, base + py * s];

      // The shadow stays on the ground and shrinks away as the figure rises.
      const shW = ((62 + 18 * bw) * s - Math.min(40, bounce) * 1.4) * Math.max(0, 1 - rise / 260);
      if (shW > 6) shadow(x, y + 6 * s, shW, S + 300);

      const leg = (side, ang, bend, seed) => {
        const hip = P(side * 10 * bw, -92);
        const knee = [hip[0] + Math.sin(ang) * 38 * s, hip[1] + Math.cos(ang) * 38 * s];
        const fa = ang - bend;
        const foot = [knee[0] + Math.sin(fa) * 36 * s, knee[1] + Math.cos(fa) * 36 * s];
        const pts = [hip, knee, foot];
        line(pts, K.black, 16 * s * lw, seed);
        if (bot.type === 'pants') {
          const ankle = [knee[0] + (foot[0] - knee[0]) * .75, knee[1] + (foot[1] - knee[1]) * .75];
          line([hip, knee, ankle], bot.color, 11 * s * lw, seed + 1);
          if (socks) line([ankle, foot], socks, 11 * s * lw, seed + 2);
        } else {
          line(pts, skin, 10 * s * lw, seed + 1);
          const sock = [knee[0] + (foot[0] - knee[0]) * .5, knee[1] + (foot[1] - knee[1]) * .5];
          if (socks) line([sock, foot], socks, 11 * s * lw, seed + 2);
        }
        const toe = side < 0 && Math.abs(ang) < .2 ? -1 : 1;   // standing back foot points left
        const fx = foot[0] + toe * 10 * s, fy = foot[1] + 4 * s;
        shape(ell(fx, fy, 22 * s * lw, 12 * s, 14), shoes.color, shoes.edge, seed + 3, 4);
        line([[fx - 18 * s * lw, fy + 8 * s], [fx + 20 * s * lw, fy + 8 * s]], K.grey, 4, seed + 4);
      };
      let handFront = null;
      const arm = (side, ang, bend, seed) => {
        const sh = P(side * 36 * bw, -150);
        const el = [sh[0] + Math.sin(ang) * 34 * s, sh[1] + Math.cos(ang) * 34 * s];
        const hand = [el[0] + Math.sin(ang + bend) * 28 * s, el[1] + Math.cos(ang + bend) * 28 * s];
        line([sh, el, hand], K.black, 14 * s * lw, seed);
        line([sh, el, hand], skin, 8.5 * s * lw, seed + 1);
        shape(ell(hand[0], hand[1], 11 * s * lw, 10 * s * lw, 12), skin, K.black, seed + 2, 4);
        if (side > 0) handFront = hand;
      };

      // Back limbs, then body, then front limbs, then head.
      arm(-1, arms[0][0], arms[0][1], S + 400);
      leg(-1, legs[0][0], legs[0][1], S + 420);
      const B = (px, py) => P(px * bw, py);
      if (bot.type === 'skirt') {
        const hem = [B(-50, -74), B(50, -74)];
        shape([B(-30, -118), B(30, -118), hem[1], hem[0]], bot.color, bot.edge, S + 440, 4.5);
        if (bot.stripe) line([[hem[0][0] + 6, hem[0][1] - 8 * s], [hem[1][0] - 6, hem[1][1] - 8 * s]], bot.stripe, 4, S + 444);
        // Pleats.
        for (const k of [-.45, 0, .45]) line([B(k * 34, -110), B(k * 58, -78)], bot.edge, 2.5, S + 446 + k * 10);
      } else {
        const legGap = bot.type === 'pants' ? -90 : -80;
        shape([B(-32, -112), B(32, -112), B(36, legGap - 2), B(6, legGap), B(0, -92), B(-6, legGap), B(-36, legGap - 2)], bot.color, bot.edge, S + 440, 4.5);
      }
      const torso = [B(-34, -168), B(34, -168), B(48, -150), B(38, -138), B(36, -108), B(-36, -108), B(-38, -138), B(-48, -150)];
      shape(torso, top.color, top.edge, S + 460, 4.5);
      if (top.stripe) {
        const band = [B(-37, -134), B(37, -134), B(37, -121), B(-37, -121)];
        fill(band, top.stripe, S + 464, { gap: 5, w: 6, angle: 0, over: 1 });
      }
      if (top.collar === 'v') {
        shape([B(-17, -169), B(-1, -169), B(-6, -153)], K.white, K.grey, S + 470, 3.5, { gap: 4, w: 5 });
        shape([B(1, -169), B(17, -169), B(6, -153)], K.white, K.grey, S + 472, 3.5, { gap: 4, w: 5 });
      }
      if (top.collar === 'polo') {
        shape([B(-18, -170), B(-1, -169), B(-7, -152)], K.white, K.grey, S + 470, 3.5, { gap: 4, w: 4 });
        shape([B(1, -169), B(18, -170), B(7, -152)], K.white, K.grey, S + 472, 3.5, { gap: 4, w: 4 });
        line([B(0, -153), B(0, -136)], top.edge, 3.5, S + 474);
        shape(ell(...B(0, -146), 2.5 * s, 2.5 * s, 6), K.white, null, S + 475, 2, { gap: 2, w: 3 });
      }
      if (top.collar === 'sailor') shape([B(-26, -169), B(26, -169), B(18, -150), B(0, -143), B(-18, -150)], K.white, K.grey, S + 470, 3.5, { gap: 4, w: 5 });
      if (top.collar === 'crew') line(ell(...P(0, -168), 16 * s * bw, 7 * s, 10, 0, Math.PI), top.stripe || K.white, 5, S + 470);
      if (top.bow) {
        const c = B(0, -147);
        shape([c, [c[0] - 14 * s, c[1] - 8 * s], [c[0] - 14 * s, c[1] + 8 * s]], top.bow, top.bow, S + 476, 3, { gap: 3, w: 4 });
        shape([c, [c[0] + 14 * s, c[1] - 8 * s], [c[0] + 14 * s, c[1] + 8 * s]], top.bow, top.bow, S + 478, 3, { gap: 3, w: 4 });
        line([c, [c[0] - 6 * s, c[1] + 16 * s]], top.bow, 3.5, S + 479);
        line([c, [c[0] + 6 * s, c[1] + 16 * s]], top.bow, 3.5, S + 481);
      }
      leg(1, legs[1][0], legs[1][1], S + 480);
      arm(1, arms[1][0], arms[1][1], S + 500);

      // Head.
      const hc = P(4, -222 - (hs - 1) * 30), R = 60 * s * hs;
      if (hair.style === 'pigtails') {
        // Low bunches that stick out and droop at each side.
        for (const side of [-1, 1]) {
          const px = hc[0] + side * R * 1.08, py = hc[1] + R * .42;
          shape([[hc[0] + side * R * .8, hc[1] + R * .02], [px + side * R * .34, py - R * .06], [px + side * R * .22, py + R * .38], [px - side * R * .08, py + R * .3]], hair.color, hair.color, S + 510 + side, 4, { gap: 5, w: 7 });
          shape(ell(hc[0] + side * R * .9, hc[1] + R * .12, 6.5 * s, 6.5 * s, 8), hair.tie || K.red, K.black, S + 514 + side, 2.5, { gap: 3, w: 4 });
        }
      }
      shape(ell(hc[0] - R * .98, hc[1] + 6 * s, 10 * s, 14 * s, 10), skin, K.black, S + 520, 4);
      shape(ell(hc[0] + R * .98, hc[1] + 6 * s, 10 * s, 14 * s, 10), skin, K.black, S + 522, 4);
      shape(ell(hc[0], hc[1], R, R * .95, 26), skin, K.black, S + 524, 5);
      drawHair(hair, hc, R, s, S);
      if (pose.copter) copter(hc[0], hc[1] - R * (hair.style === 'spiky' ? 1.3 : 1.0), s * hs, t, S + 590);
      if (spec.blush !== false) {
        fill(ell(hc[0] - R * .62, hc[1] + R * .28, 12 * s, 7 * s, 10), K.pink, S + 540, { gap: 4, w: 4, angle: 0 });
        fill(ell(hc[0] + R * .68, hc[1] + R * .28, 12 * s, 7 * s, 10), K.pink, S + 542, { gap: 4, w: 4, angle: 0 });
      }
      // Eyes (inside round glasses if worn).
      const L = [hc[0] - R * .34, hc[1] - R * .08], Rt = [hc[0] + R * .38, hc[1] - R * .08], gr = R * .36;
      if (spec.glasses) {
        shape(ell(L[0], L[1], gr, gr, 18), K.white, K.black, S + 550, 4.5, { gap: 6, w: 6 });
        shape(ell(Rt[0], Rt[1], gr, gr, 18), K.white, K.black, S + 552, 4.5, { gap: 6, w: 6 });
        line([[L[0] + gr, L[1]], [Rt[0] - gr, Rt[1]]], K.black, 4, S + 554);
      }
      const e = 9 * s * hs, eyes = pose.eyes || 'happy';
      if (eyes === 'happy') {
        line([[L[0] - e, L[1] - e], [L[0] + e * .9, L[1]], [L[0] - e, L[1] + e]], K.black, 5, S + 556);
        line([[Rt[0] + e, Rt[1] - e], [Rt[0] - e * .9, Rt[1]], [Rt[0] + e, Rt[1] + e]], K.black, 5, S + 558);
      } else if (eyes === 'closed') {
        line(ell(L[0], L[1] + e * .4, e, e * .8, 8, Math.PI * 1.1, Math.PI * 1.9), K.black, 5, S + 556);
        line(ell(Rt[0], Rt[1] + e * .4, e, e * .8, 8, Math.PI * 1.1, Math.PI * 1.9), K.black, 5, S + 558);
      } else {
        const er = eyes === 'wide' ? e * .75 : e * .5;
        for (const [c, sd] of [[L, 556], [Rt, 558]]) {
          if (eyes === 'wide' && !spec.glasses) shape(ell(c[0], c[1], er * 1.7, er * 1.9, 12), K.white, K.black, S + sd + 100, 3, { gap: 3, w: 4 });
          shape(ell(c[0], c[1], er, er * 1.25, 10), K.black, null, S + sd, 3, { gap: 3, w: 4 });
        }
      }
      if (spec.brows) {
        line([[L[0] - e * 1.6, L[1] - e * 2.4], [L[0] + e * 1.2, L[1] - e * 1.6]], K.black, 7, S + 557);
        line([[Rt[0] + e * 1.6, Rt[1] - e * 2.4], [Rt[0] - e * 1.2, Rt[1] - e * 1.6]], K.black, 7, S + 559);
      }
      if (spec.nose === 'pointy') {
        const n = [hc[0] - R * .7, hc[1] + R * .2];
        shape([[n[0] + 4 * s, n[1] - 9 * s], [n[0] - R * .6, n[1] + 4 * s], [n[0] + 2 * s, n[1] + 12 * s]], skin, K.black, S + 560, 4, { gap: 4, w: 5 });
      }
      const m = [hc[0] + 4 * s, hc[1] + R * .42], mr = 26 * s * (spec.mouthSize || 1) * hs;
      const mouth = pose.mouth || 'open';
      if (mouth === 'smile') {
        line(ell(m[0], m[1] - 10 * s, mr * .7, mr * .45, 10, .2, Math.PI - .2), K.black, 4.5, S + 562);
      } else if (mouth === 'frown') {
        line(ell(m[0], m[1] + 4 * s, mr * .55, mr * .35, 10, Math.PI + .3, Math.PI * 2 - .3), K.black, 4.5, S + 562);
      } else if (mouth === 'o') {
        shape(ell(m[0], m[1], mr * .32, mr * .42, 12), K.red, K.black, S + 562, 4, { gap: 4, w: 5 });
      } else {
        const big = mouth === 'grin' ? .75 : 1;
        const mouthPts = [[m[0] - mr, m[1] - 6 * s], [m[0] + mr, m[1] - 6 * s], ...ell(m[0], m[1] - 6 * s, mr, mr * big, 12, 0, Math.PI)];
        shape(mouthPts, K.red, K.black, S + 562, 4.5, { gap: 5, w: 6 });
        if (mouth === 'grin') line([[m[0] - mr * .85, m[1] - 1 * s], [m[0] + mr * .85, m[1] - 1 * s]], K.white, 5, S + 566);
        else fill(ell(m[0], m[1] - 6 * s + mr * .62, mr * .54, mr * .27, 10), K.pink, S + 564, { gap: 4, w: 5, angle: 0 });
      }
      if (pose.sweat) {
        const d = [hc[0] + R * 1.05, hc[1] - R * .55 + ((t * 40) % 20) * s];
        shape([[d[0], d[1] - 14 * s], [d[0] + 8 * s, d[1] + 2 * s], ...ell(d[0], d[1] + 3 * s, 8 * s, 8 * s, 8, 0, Math.PI), [d[0] - 8 * s, d[1] + 2 * s]], K.sky, K.blue, S + 570, 3, { gap: 3, w: 4 });
      }
      return { head: hc, R, hand: handFront, lift: bounce };
    }

    // A little propeller hat stuck on top of a head at (x, y): yellow stem, spinning blades.
    function copter(x, y, s, t, seed = 590) {
      const spin = Math.cos(t * 38);
      shape([[x - 7 * s, y + 4 * s], [x + 7 * s, y + 4 * s], [x + 5 * s, y - 8 * s], [x - 5 * s, y - 8 * s]], K.yellow, K.orange, seed, 3, { gap: 3, w: 4 });
      line([[x, y - 8 * s], [x, y - 24 * s]], K.orange, 5 * s, seed + 2);
      const bw = 44 * s * Math.abs(spin) + 6 * s;
      shape(ell(x, y - 26 * s, bw, 6 * s, 14), K.yellow, K.orange, seed + 4, 3.5, { gap: 3, w: 4 });
      // Motion swish lines either side.
      line(ell(x, y - 26 * s, 50 * s, 12 * s, 8, Math.PI * 1.15, Math.PI * 1.45), K.grey, 2.5, seed + 6);
      line(ell(x, y - 26 * s, 50 * s, 12 * s, 8, Math.PI * 1.55, Math.PI * 1.85), K.grey, 2.5, seed + 8);
    }

    function drawHair(hair, hc, R, s, S) {
      const c = hair.color;
      if (hair.style === 'bald') return;
      if (hair.style === 'spiky') {
        // Big spikes swept up and back to the right, like a fin.
        const pts = [[hc[0] - R * 1.0, hc[1] - R * .05]];
        const N = 5;
        for (let i = 0; i < N; i++) {
          const a0 = Math.PI * (1.0 + i / N * .95), a1 = Math.PI * (1.0 + (i + 1) / N * .95);
          const tipA = (a0 + a1) / 2 + .35;
          const len = 1.45 + (i === 2 ? .25 : i === 1 || i === 3 ? .12 : 0);
          pts.push([hc[0] + Math.cos(tipA) * R * len, hc[1] + Math.sin(tipA) * R * len]);
          pts.push([hc[0] + Math.cos(a1) * R * 1.02, hc[1] + Math.sin(a1) * R * .98]);
        }
        pts.push([hc[0] + R * 1.25, hc[1] - R * .1], [hc[0] + R * .95, hc[1] + R * .05]);
        for (let i = 0; i <= 6; i++) pts.push([hc[0] + R * .9 - i * R * .32, hc[1] - R * (i % 2 ? .32 : .46)]);
        shape(pts, c, c, S + 530, 4, { gap: 5, w: 7 });
        return;
      }
      if (hair.style === 'short') {
        const pts = [...ell(hc[0], hc[1] - 4 * s, R * 1.04, R * 1.0, 18, Math.PI * .97, Math.PI * 2.03)];
        for (let i = 0; i <= 10; i++) pts.push([hc[0] + R * 1.0 - i * R * .2, hc[1] - R * (i % 2 ? .4 : .52)]);
        shape(pts, c, c, S + 530, 4, { gap: 5, w: 7 });
        return;
      }
      if (hair.style === 'pigtails') {
        const pts = [...ell(hc[0], hc[1] - 2 * s, R * 1.07, R * 1.02, 20, Math.PI * .9, Math.PI * 2.1)];
        // Rounded bangs across the forehead, parted a little off-centre.
        for (let i = 0; i <= 4; i++) pts.push(...ell(hc[0] + R * .8 - i * R * .4, hc[1] - R * .44, R * .2, R * .15, 5, 0, Math.PI));
        shape(pts, c, c, S + 530, 4, { gap: 5, w: 7 });
        return;
      }
      // 'messy': cap, spiky fringe and one strand sticking up.
      const pts = [...ell(hc[0], hc[1] - 4 * s, R * 1.02, R * .98, 18, Math.PI * 1.02, Math.PI * 1.98)];
      for (let i = 0; i <= 8; i++) { const hx = hc[0] + R - i * R * .25; pts.push([hx, hc[1] - R * (i % 2 ? .3 : .45)]); }
      shape(pts, c, c, S + 530, 4, { gap: 5, w: 7 });
      line([[hc[0] + R * .1, hc[1] - R * .95], [hc[0] + R * .25, hc[1] - R * 1.28], [hc[0] + R * .5, hc[1] - R * 1.22]], c, 5, S + 534);
    }

    // A speech bubble: wobbly white oval with a tail pointing at (tx, ty), text in kid writing.
    function bubble(str, x, y, tx, ty, { size = 30, color = K.black, seed = 800 } = {}) {
      ctx.save();
      ctx.font = `700 ${size}px Gaegu, "Comic Sans MS", cursive`;
      const w = ctx.measureText(str).width / 2 + 26, h = size * .95;
      ctx.restore();
      const pts = ell(x, y, w, h, 24);
      const a = Math.atan2(ty - y, tx - x);
      const b1 = [x + Math.cos(a - .25) * w * .9, y + Math.sin(a - .25) * h * .9];
      const b2 = [x + Math.cos(a + .25) * w * .9, y + Math.sin(a + .25) * h * .9];
      shape([b1, [tx, ty], b2], K.white, K.black, seed + 2, 4, { gap: 4, w: 6, over: 1 });
      shape(pts, K.white, K.black, seed, 4.5, { gap: 4, w: 6, over: 1 });
      text(str, x, y + size * .32, { color, size, align: 'center' });
    }

    // ---------- Loop ----------
    // draw(t) is called inside the paper clip at FPS; tape is added on top.
    function start(draw) {
      fit();
      addEventListener('resize', fit);
      let last = 0;
      function frame(ms) {
        const dpr = devicePixelRatio || 1;
        if (canvas.width !== Math.round(canvas.clientWidth * dpr) || canvas.height !== Math.round(canvas.clientHeight * dpr)) fit();
        if (ms - last >= 1000 / FPS) {
          last = ms;
          const t = ms / 1000;
          BOIL = BOIL_RATE ? Math.floor(t * BOIL_RATE) : 0;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = opts.background || '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          applyView();
          if (opts.paper !== false) {
            ctx.fillStyle = 'rgba(0,0,0,.08)';
            ctx.fillRect(8, 10, W, H);
            ctx.drawImage(paper, 0, 0);
          }
          ctx.save();
          ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
          draw(t);
          ctx.restore();
          if (opts.tape !== false && opts.paper !== false) tape();
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      api.step = frame;       // lets tests draw a frame by hand: kit.step(ms)
    }

    const api = { W, H, K, ctx, rng, wob, ell, line, fill, shape, text, sun, cloud, skyStrip, field, shadow, tape, kid, copter, bubble, start };
    global.CrayonKit.last = api;
    return api;
  }

  global.CrayonKit = { create, COLORS, rng };
})(window);
