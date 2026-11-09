// "The Lost Ball": a six-page crayon picture story, drawn and animated entirely in code.
// Pages play on their own; tap / click or press → to turn the page, ← to go back.
// Four characters use the kit's kid() with poses; the robot cat is a custom figure.
(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  const kit = CrayonKit.create(canvas, { W: 1180, H: 620, size: .4, paper: false });
  const { K, W, H, ell, line, fill, shape } = kit;

  // ---------- Cast ----------
  const CAST = {
    big: { // big kid: orange shirt with a yellow stripe, navy trousers, teal shoes
      seed: 1, y: 470, scale: .92, body: 1.55, head: 1.08, phase: 2.1, brows: true, mouthSize: 1.15,
      hair: { style: 'short' }, top: { color: K.orange, edge: K.brown, stripe: K.yellow, collar: 'crew' },
      bottom: { type: 'pants', color: K.navy, edge: K.black }, shoes: { color: K.teal, edge: K.navy }
    },
    spiky: { // spiky-haired kid: green polo, brown shorts, yellow shoes, pointy nose
      seed: 2, y: 494, scale: .82, body: .92, phase: .7, nose: 'pointy',
      hair: { style: 'spiky' }, top: { color: K.lime, edge: K.dgreen, collar: 'polo' },
      bottom: { type: 'shorts', color: K.brown, edge: K.black }, shoes: { color: K.yellow, edge: K.orange }
    },
    me: { // the storyteller: round glasses, yellow shirt, white collar, blue shorts
      seed: 3, y: 482, scale: .86, phase: 0, glasses: true,
      hair: { style: 'messy' }, top: { color: K.yellow, edge: K.orange, collar: 'v' },
      bottom: { type: 'shorts', color: K.blue, edge: K.navy }, shoes: { color: K.blue, edge: K.navy }
    },
    girl: { // pigtails, pink dress, sailor collar, red bow, pink shoes
      seed: 4, y: 498, scale: .8, phase: 1.6,
      hair: { style: 'pigtails', tie: K.red }, top: { color: K.lightpink, edge: K.hotpink, collar: 'sailor', bow: K.red },
      bottom: { type: 'skirt', color: K.lightpink, edge: K.hotpink, stripe: K.white }, shoes: { color: K.hotpink, edge: K.red }
    },
    cat: { cat: true, y: 476, scale: .86, phase: 3 }
  };

  // ---------- Robot cat (custom figure from primitives) ----------
  // pose.action: 'stand'|'walk'|'run'|'wave'|'cheer'|'reach'; eyes: 'happy'|'dot'|'wide'; mouth: 'open'|'smile'|'o'
  function robotCat(x, y, t, spec, pose = {}) {
    const s = spec.scale, S = 9000, p = t * 9 + spec.phase, action = pose.action || 'stand';
    let lift = 0, legs = [-.08, .08], arms = [-.55, .55];
    if (action === 'walk' || action === 'run') {
      const k = action === 'run' ? 1 : .5, sw = Math.sin(action === 'run' ? p : p * .55);
      lift = Math.abs(Math.cos(action === 'run' ? p : p * .55)) * (action === 'run' ? 10 : 4);
      legs = [-sw * .9 * k, sw * .9 * k];
      arms = [-.9 - sw * .6 * k, .9 - sw * .6 * k];
    } else if (action === 'wave') arms = [-.55, 2.6 + Math.sin(t * 10) * .35];
    else if (action === 'cheer') { lift = Math.abs(Math.sin(p * .6)) * 22; arms = [-2.5 + Math.sin(p * 1.4) * .15, 2.5 - Math.sin(p * 1.4) * .15]; }
    else if (action === 'reach') arms = [-.55, -1.1 + Math.sin(t * 8) * .15];
    else if (action === 'fly') { const f = Math.sin(t * 4 + spec.phase); lift = 4 + f * 4; legs = [-.3 + f * .2, .3 - f * .2]; arms = [-1.9 + f * .25, 1.9 - f * .25]; }
    const rise = pose.rise || 0;
    const base = y - lift * s - rise;
    const P = (px, py) => [x + px * s, base + py * s];
    const shW = (80 * s - lift * s * 1.4) * Math.max(0, 1 - rise / 260);
    if (shW > 6) kit.shadow(x, y + 6 * s, shW, S);

    const arm = (side, ang, seed) => {
      const sh = P(side * 40, -112);
      const hand = [sh[0] + Math.sin(ang) * 44 * s, sh[1] + Math.cos(ang) * 44 * s];
      line([sh, hand], K.black, 19 * s, seed);
      line([sh, hand], K.blue, 13 * s, seed + 1);
      shape(ell(hand[0], hand[1], 15 * s, 15 * s, 14), K.white, K.black, seed + 2, 4);
      return hand;
    };
    const leg = (side, ang, seed) => {
      const hip = P(side * 20, -50);
      const foot = [hip[0] + Math.sin(ang) * 36 * s, hip[1] + Math.cos(ang) * 36 * s];
      line([hip, foot], K.black, 23 * s, seed);
      line([hip, foot], K.blue, 17 * s, seed + 1);
      shape(ell(foot[0] + side * 4 * s, foot[1] + 4 * s, 25 * s, 13 * s, 14), K.white, K.black, seed + 2, 4);
    };

    arm(-1, arms[0], S + 10);
    leg(-1, legs[0], S + 20);
    // Red ball tail.
    line([P(48, -62), P(64, -70)], K.black, 4, S + 30);
    shape(ell(...P(68, -72), 9 * s, 9 * s, 10), K.red, K.black, S + 32, 3.5, { gap: 4, w: 5 });
    // Round body, white belly, half-moon pocket.
    shape(ell(...P(0, -84), 52 * s, 50 * s, 24), K.blue, K.navy, S + 40, 5);
    shape(ell(...P(0, -80), 38 * s, 36 * s, 20), K.white, K.black, S + 42, 4, { gap: 6, w: 6 });
    const pc = P(0, -84);
    shape([[pc[0] - 25 * s, pc[1]], [pc[0] + 25 * s, pc[1]], ...ell(pc[0], pc[1], 25 * s, 21 * s, 10, 0, Math.PI)], K.white, K.black, S + 44, 3.5, { gap: 5, w: 5 });
    leg(1, legs[1], S + 50);
    const hand = arm(1, arms[1], S + 60);

    // Big blue head with a wide white face.
    const hc = P(0, -188), R = 76 * s;
    shape(ell(hc[0], hc[1], R, R * .96, 28), K.blue, K.navy, S + 70, 5);
    shape(ell(hc[0], hc[1] + R * .18, R * .82, R * .72, 24), K.white, K.black, S + 72, 4, { gap: 6, w: 6 });
    // Tall oval eyes touching in the middle.
    const eyes = pose.eyes || 'happy';
    for (const side of [-1, 1]) {
      const ec = [hc[0] + side * R * .19, hc[1] - R * .36];
      shape(ell(ec[0], ec[1], R * .19, R * .26, 16), K.white, K.black, S + 80 + side, 4, { gap: 5, w: 5 });
      const e = R * .09;
      if (eyes === 'happy') line([[ec[0] - side * e, ec[1] - e], [ec[0] + side * e, ec[1]], [ec[0] - side * e, ec[1] + e]], K.black, 4.5, S + 84 + side);
      else shape(ell(ec[0] - side * R * .05, ec[1] + R * .04, R * (eyes === 'wide' ? .05 : .065), R * (eyes === 'wide' ? .07 : .09), 8), K.black, null, S + 84 + side, 3, { gap: 3, w: 4 });
    }
    // Red nose with a shine, nose line, whiskers.
    const n = [hc[0], hc[1] - R * .06];
    shape(ell(n[0], n[1], R * .13, R * .13, 12), K.red, K.black, S + 90, 3.5, { gap: 4, w: 5 });
    fill(ell(n[0] - R * .04, n[1] - R * .04, R * .035, R * .035, 6), K.white, S + 91, { gap: 2, w: 3, over: 1 });
    line([[n[0], n[1] + R * .13], [n[0], n[1] + R * .34]], K.black, 3.5, S + 92);
    for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) {
      line([[hc[0] + side * R * .3, hc[1] + R * .1 + i * R * .11], [hc[0] + side * R * .76, hc[1] + R * .04 + i * R * .2]], K.black, 3, S + 94 + side * 3 + i);
    }
    // Mouth.
    const m = [hc[0], hc[1] + R * .34], mw = R * .52, mouth = pose.mouth || 'open';
    if (mouth === 'open') {
      shape([[m[0] - mw, m[1]], [m[0] + mw, m[1]], ...ell(m[0], m[1], mw, R * .4, 14, 0, Math.PI)], K.red, K.black, S + 100, 4.5, { gap: 5, w: 6 });
      fill(ell(m[0], m[1] + R * .27, mw * .5, R * .1, 10), K.pink, S + 102, { gap: 4, w: 5, angle: 0 });
    } else if (mouth === 'o') {
      shape(ell(m[0], m[1] + R * .12, R * .14, R * .16, 12), K.red, K.black, S + 100, 4, { gap: 4, w: 5 });
    } else {
      line(ell(m[0], m[1] - R * .05, mw * .9, R * .3, 12, .15, Math.PI - .15), K.black, 4, S + 100);
    }
    fill(ell(hc[0] - R * .52, hc[1] + R * .18, 10 * s, 6 * s, 10), K.pink, S + 104, { gap: 4, w: 4, angle: 0 });
    fill(ell(hc[0] + R * .52, hc[1] + R * .18, 10 * s, 6 * s, 10), K.pink, S + 106, { gap: 4, w: 4, angle: 0 });
    // Red collar and a golden bell under the chin.
    const c = P(0, -120);
    shape([[c[0] - 46 * s, c[1] - 6 * s], [c[0] + 46 * s, c[1] - 6 * s], [c[0] + 44 * s, c[1] + 6 * s], [c[0] - 44 * s, c[1] + 6 * s]], K.red, K.black, S + 110, 3.5, { gap: 4, w: 5 });
    const b = [c[0], c[1] + 13 * s];
    shape(ell(b[0], b[1], 11 * s, 11 * s, 12), K.yellow, K.black, S + 112, 3.5, { gap: 4, w: 5 });
    line([[b[0] - 10 * s, b[1] - 2 * s], [b[0] + 10 * s, b[1] - 2 * s]], K.black, 3, S + 114);
    line([[b[0], b[1] + 2 * s], [b[0], b[1] + 9 * s]], K.black, 3, S + 116);
    if (pose.copter) kit.copter(hc[0], hc[1] - R * .98, s * 1.1, t, S + 120);
    return { head: hc, R, hand, pocket: pc };
  }

  // ---------- Props ----------
  function ball(x, y, r = 16, seed = 7000) {
    shape(ell(x, y, r, r, 14), K.red, K.black, seed, 4, { gap: 4, w: 5 });
    shape([...ell(x, y, r, r, 8, Math.PI * .15, Math.PI * .85)], K.white, null, seed + 2, 3, { gap: 3, w: 4, over: 1 });
    line([[x - r, y], [x + r, y]], K.black, 3, seed + 4);
  }
  function sparkle(x, y, r, seed) {
    line([[x - r, y], [x + r, y]], K.yellow, 5, seed);
    line([[x, y - r], [x, y + r]], K.yellow, 5, seed + 2);
    line([[x - r * .6, y - r * .6], [x + r * .6, y + r * .6]], K.orange, 3, seed + 4);
  }
  function heart(x, y, r, color, seed) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = i / 24 * Math.PI * 2;
      pts.push([x + 16 * Math.sin(a) ** 3 * r / 16, y - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * r / 16]);
    }
    shape(pts, color, K.red, seed, 3.5, { gap: 4, w: 5 });
  }

  // ---------- Helpers ----------
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const mv = (u, a, b, u0, u1) => a + (b - a) * ease(clamp((u - u0) / (u1 - u0)));
  const between = (u, a, b) => u >= a && u < b;
  const HOME = { big: 200, spiky: 380, me: 570, girl: 770, cat: 965 };

  // ---------- The pages ----------
  // Each page: caption, duration (s), and a function returning the cast for progress u (0..1).
  const PAGES = [
    {
      caption: "This is me. Oh no... I'm late again!", dur: 6,
      cues: [[.5, 'boing'], [.55, 'oops']],
      cast: u => {
        const arrived = u > .5;
        return {
          me: { x: mv(u, -120, 560, 0, .5), pose: arrived ? { action: 'stand', eyes: 'wide', mouth: 'o', sweat: true } : { action: 'run' } },
          bubbles: arrived ? [['me', "I'M LATE!!"]] : []
        };
      }
    },
    {
      caption: 'But my robot cat has a magic pocket...', dur: 6.5,
      cues: [[.4, 'page'], [.55, 'pop'], [.58, 'sparkle'], [.62, 'boing']],
      cast: u => {
        const out = u > .55;
        return {
          me: { x: 420, pose: out ? { action: 'jump', eyes: 'happy', mouth: 'open' } : { action: 'stand', eyes: 'dot', mouth: 'smile' } },
          cat: { x: mv(u, 1320, 730, 0, .4), pose: u < .4 ? { action: 'walk', eyes: 'dot', mouth: 'smile' } : u < .55 ? { action: 'reach', eyes: 'dot', mouth: 'smile' } : { action: 'wave', eyes: 'happy', mouth: 'open' } },
          ball: out ? { from: 'pocket', k: ease(clamp((u - .55) / .2)) } : null,
          bubbles: out ? [['cat', 'TA-DA!']] : []
        };
      }
    },
    {
      caption: '...and my friends come to play!', dur: 7,
      cues: [[.72, 'sparkle'], [.8, 'boing']],
      cast: u => {
        const here = u > .72;
        const walkOr = (done, p) => done ? (here ? { action: 'wave', ...p } : { action: 'stand', ...p }) : { action: 'walk', eyes: 'dot', mouth: 'smile' };
        return {
          me: { x: mv(u, 420, HOME.me, 0, .4), pose: walkOr(u > .4, { eyes: 'happy', mouth: 'open' }) },
          cat: { x: mv(u, 730, HOME.cat, .05, .45), pose: u < .45 ? { action: 'walk', eyes: 'dot', mouth: 'smile' } : { action: here ? 'wave' : 'stand', eyes: 'happy', mouth: 'open' } },
          big: { x: mv(u, -220, HOME.big, 0, .6), pose: walkOr(u > .6, { eyes: 'happy', mouth: 'grin' }) },
          spiky: { x: mv(u, -420, HOME.spiky, .05, .7), pose: walkOr(u > .7, { eyes: 'happy', mouth: 'open' }) },
          girl: { x: mv(u, 1420, HOME.girl, .1, .7), pose: walkOr(u > .7, { eyes: 'closed', mouth: 'open' }) },
          ball: { x: 660, y: 500 },
          bubbles: here ? [['girl', 'HELLO!'], ['big', "LET'S PLAY!"]] : []
        };
      }
    },
    {
      caption: 'We kick the ball around... then he kicks it TOO hard!', dur: 7,
      cues: [[.01, 'kick'], [.16, 'kick'], [.32, 'kick'], [.55, 'bigKick'], [.57, 'whoosh'], [.64, 'oops']],
      cast: u => {
        // Ball hops: me -> spiky -> girl -> big, then the big kick sends it flying off the page.
        const hops = [[660, 0], [420, .16], [800, .32], [250, .48]];
        let b, kicker = null;
        if (u < .48) {
          let i = 0; while (i < hops.length - 2 && u >= hops[i + 1][1]) i++;
          const [x0, u0] = hops[i], [x1, u1] = hops[i + 1], k = clamp((u - u0) / (u1 - u0));
          b = { x: x0 + (x1 - x0) * k, y: 500 - Math.sin(k * Math.PI) * 120 };
          kicker = ['me', 'spiky', 'girl'][i];
          if (k > .3) kicker = null;
        } else if (u < .56) {
          b = { x: 250, y: 500 }; kicker = 'big';
        } else {
          const k = clamp((u - .56) / .2);
          b = { x: 250 + k * 1050, y: 500 - Math.sin(k * Math.PI * .6) * 560 - k * 40, trail: true };
          if (k >= 1) b = null;
        }
        const gone = u > .56;
        const look = gone ? { action: 'stand', eyes: 'wide', mouth: 'o' } : { action: 'stand', eyes: 'happy', mouth: 'open' };
        const kick = (who, p) => kicker === who ? { action: 'kick', kick: who === 'big' ? clamp((u - .48) / .08) : .8, eyes: 'happy', mouth: 'open' } : p;
        return {
          me: { x: HOME.me, pose: kick('me', look) },
          spiky: { x: HOME.spiky, pose: kick('spiky', look) },
          girl: { x: HOME.girl, pose: kick('girl', look) },
          big: { x: HOME.big, pose: kick('big', gone ? { action: 'stand', eyes: 'closed', mouth: 'grin', sweat: true } : look) },
          cat: { x: HOME.cat, pose: gone ? { action: 'stand', eyes: 'wide', mouth: 'o' } : { action: 'stand', eyes: 'happy', mouth: 'smile' } },
          ball: b,
          bubbles: gone && u > .62 ? [['big', 'OOPS!'], ['cat', 'OH NO!']] : []
        };
      }
    },
    {
      caption: 'So we ALL run to find it!', dur: 6.5, scroll: 170,
      cues: [[.02, 'whoosh'], [.7, 'sparkle']],
      cast: (u, t) => {
        const run = who => ({ x: HOME[who] + Math.sin(t * 1.3 + CAST[who].seed) * 18, pose: { action: 'run', eyes: who === 'me' && u > .7 ? 'wide' : 'happy', mouth: 'open' } });
        return {
          me: run('me'), spiky: run('spiky'), girl: run('girl'), big: run('big'),
          cat: { ...run('cat'), pose: { action: 'run', eyes: 'happy', mouth: 'open' } },
          ball: u > .5 ? { x: mv(u, 1260, 1080, .5, .85), y: 505, spin: true } : null,
          bubbles: u > .7 ? [['me', 'THERE IT IS!']] : []
        };
      }
    },
    {
      caption: 'We found it! Best friends forever.', dur: 6,
      cues: [[0, 'cheer'], [.4, 'sparkle']],
      cast: u => {
        const cheer = (eyes, mouth) => ({ action: 'cheer', eyes, mouth });
        return {
          me: { x: HOME.me, pose: { action: 'stand', eyes: 'happy', mouth: 'open', hold: true } },
          spiky: { x: HOME.spiky, pose: cheer('happy', 'open') },
          girl: { x: HOME.girl, pose: cheer('closed', 'open') },
          big: { x: HOME.big, pose: cheer('happy', 'grin') },
          cat: { x: HOME.cat, pose: { action: 'cheer', eyes: 'happy', mouth: 'open' } },
          ball: { held: 'me' },
          hearts: true
        };
      }
    },
    {
      caption: 'My robot cat gives us all head-copters... and we fly home!', dur: 13, end: true,
      // Copter hand-out: the cat's own first, then one each, flying out of the pocket onto heads.
      gives: [['cat', .04, .11], ['me', .13, .2], ['girl', .21, .28], ['spiky', .29, .36], ['big', .37, .44]],
      // Lift-off: the cat goes first, everyone else follows right behind (small gaps).
      lift: { cat: .5, me: .54, girl: .575, spiky: .6, big: .625 },
      cues: [[.04, 'pop'], [.11, 'sparkle'], [.13, 'pop'], [.2, 'sparkle'], [.21, 'pop'], [.28, 'sparkle'], [.29, 'pop'], [.36, 'sparkle'],
        [.37, 'pop'], [.44, 'sparkle'], [.47, 'copterOn'], [.5, 'whoosh'], [.54, 'boing'], [.6, 'boing'], [.8, 'cheer'], [.98, 'copterOff']],
      cast(u, t) {
        const page = this;
        const got = who => { const g = page.gives.find(x => x[0] === who); return u >= g[2]; };
        const fly = (who, eyes, mouth) => {
          const k = clamp((u - page.lift[who]) / .3);
          const rise = ease(k) * 760;
          const drift = (Math.sin(t * 1.6 + who.length) * 14 + (HOME[who] - 580) * .2) * k;
          const before = got(who)
            ? { action: u > .45 ? 'jump' : 'cheer', eyes: 'happy', mouth: 'open' }
            : { action: 'stand', eyes: 'dot', mouth: 'smile' };
          return {
            x: HOME[who] + drift,
            pose: k > 0 ? { action: 'fly', eyes, mouth, copter: true, rise } : { ...before, copter: got(who) }
          };
        };
        const cat = fly('cat', 'happy', 'open');
        if (u < .45 && cat.pose.action !== 'fly') cat.pose = { action: 'reach', eyes: 'happy', mouth: 'open', copter: got('cat') };
        const me = fly('me', 'happy', 'open');
        me.pose.hold = true;
        // Copters in the air between the pocket and a head.
        const flying = page.gives.filter(([, a, b]) => u >= a && u < b).map(([who, a, b]) => ({ who, k: (u - a) / (b - a) }));
        let bubbles = [];
        if (u > .12 && u < .44) bubbles = [['cat', 'HERE YOU GO!']];
        else if (u > .45 && u < .53) bubbles = [['cat', "LET'S GO!"]];
        else if (u > .56 && u < .66) bubbles = [['me', 'WHEEE!']];
        return {
          me, cat, spiky: fly('spiky', 'happy', 'open'), girl: fly('girl', 'closed', 'open'), big: fly('big', 'happy', 'grin'),
          ball: { held: 'me' }, clouds: u > .5, flying, bubbles
        };
      }
    }
  ];
  const STARTS = [];
  { let acc = 0; for (const p of PAGES) { STARTS.push(acc); acc += p.dur; } }
  const TOTAL = STARTS[STARTS.length - 1] + PAGES[PAGES.length - 1].dur;

  // ---------- Story clock and controls ----------
  let storyT = 0, lastMs = null, scroll = 0, prevPage = -1, prevU = 0;
  const audio = window.StoryAudio;
  // Fire each page's sound cues as its progress passes them.
  function cues(i, u) {
    if (!audio) return;
    if (i !== prevPage) {
      audio.sfx('copterOff');
      audio.sfx('page');
      prevU = -1;
    }
    for (const [at, name] of PAGES[i].cues || []) if (prevU < at && u >= at) audio.sfx(name);
    prevPage = i; prevU = u;
  }
  const pageAt = st => { let i = 0; while (i < PAGES.length - 1 && st >= STARTS[i + 1]) i++; return i; };
  function turn(dir) {
    const i = pageAt(storyT);
    const next = i + dir;
    storyT = next >= PAGES.length ? 0 : STARTS[Math.max(0, next)];
  }
  // Open on a given page with #1 .. #6 in the URL.
  { const n = parseInt(location.hash.slice(1), 10); if (n >= 1 && n <= PAGES.length) storyT = STARTS[n - 1]; }
  // Browsers need a tap before playing sound: the first tap turns the sound on,
  // later taps turn the page. The button mutes and unmutes.
  const btn = document.querySelector('#sound');
  const showBtn = () => { if (btn) btn.textContent = audio && audio.started && audio.enabled ? '♪ sound on' : '♪ sound off'; };
  function startSound() {
    if (audio && !audio.started) { audio.start(); prevPage = -1; showBtn(); return true; }
    return false;
  }
  if (btn) btn.addEventListener('click', e => {
    e.stopPropagation();
    if (!startSound()) audio.setEnabled(!audio.enabled);
    showBtn();
  });
  canvas.addEventListener('click', () => { if (!startSound()) turn(1); });
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ') { if (!startSound()) turn(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') turn(-1);
  });

  // ---------- Draw ----------
  kit.start(t => {
    const ms = t * 1000, dt = lastMs === null ? 0 : Math.min(.1, (ms - lastMs) / 1000);
    lastMs = ms;
    storyT += dt;
    if (storyT >= TOTAL) storyT = 0;
    const i = pageAt(storyT), page = PAGES[i], lt = storyT - STARTS[i], u = clamp(lt / page.dur);
    scroll += dt * (page.scroll || 0);
    cues(i, u);

    kit.field({ x: 40, y: 320, w: W - 80, h: 230, t: scroll, speed: 1, tufts: 30 });
    // On the flying page, clouds slide down past everyone so they look like they rise into the sky.
    if (page.lift && u > .5) {
      for (let j = 0; j < 4; j++) {
        const cy = ((u - .5) * 1100 + j * 120) % 420 - 120;   // stay above the grass
        kit.cloud(160 + j * 290 + (j % 2) * 60, cy, .8, 60 + j * 7);
      }
    }

    const sc = page.cast(u, t);
    const drawn = {};
    const names = Object.keys(CAST).filter(n => sc[n]).sort((a, b) => CAST[a].y - CAST[b].y);
    // A ball on the ground is drawn before the cast so feet go in front of it.
    const b = sc.ball;
    if (b && b.y >= 495 && !b.from && !b.held) ball(b.x + (b.spin ? Math.sin(t * 20) : 0), b.y);
    for (const n of names) {
      const c = sc[n], spec = CAST[n];
      drawn[n] = spec.cat ? robotCat(c.x, spec.y, t, spec, c.pose) : kit.kid(spec, c.x, spec.y, t, c.pose);
    }
    if (b) {
      if (b.from === 'pocket') {
        const pk = drawn.cat.pocket, k = b.k;
        const bx = pk[0], by = pk[1] - k * 150;
        ball(bx, by, 16 * (.5 + k * .5));
        for (let j = 0; j < 4; j++) {
          const a = j / 4 * Math.PI * 2 + t * 2;
          sparkle(bx + Math.cos(a) * 40, by + Math.sin(a) * 34, 7 + 3 * Math.sin(t * 8 + j), 7100 + j * 10);
        }
      } else if (b.held) {
        const h = drawn[b.held].hand;
        ball(h[0], h[1] - 24, 17);
      } else if (b.y < 495) {
        if (b.trail) for (let j = 1; j <= 3; j++) line([[b.x - j * 26, b.y + j * 16], [b.x - j * 26 - 18, b.y + j * 16 + 10]], K.grey, 3, 7200 + j);
        ball(b.x, b.y);
      }
    }
    // Head-copters flying in an arc from the cat's pocket onto each head, trailing sparkles.
    for (const { who, k } of sc.flying || []) {
      const from = drawn.cat.pocket, d = drawn[who];
      const to = [d.head[0], d.head[1] - d.R * (who === 'spiky' ? 1.3 : 1.0)];
      const e = ease(k);
      const cx = from[0] + (to[0] - from[0]) * e;
      const cy = from[1] + (to[1] - from[1]) * e - Math.sin(e * Math.PI) * (who === 'cat' ? 110 : 170);
      kit.copter(cx, cy, .9 + .2 * k, t, 7600);
      sparkle(cx - 26, cy + 18, 6 + 2 * Math.sin(t * 9), 7620);
      sparkle(cx + 24, cy + 30, 5 + 2 * Math.cos(t * 9), 7630);
    }
    if (sc.hearts) {
      for (let j = 0; j < 9; j++) {
        const hx = 120 + j * 120 + Math.sin(t * 2 + j) * 16;
        const hy = 300 - ((t * 45 + j * 70) % 260);
        heart(hx, hy, 12 + (j % 3) * 4, [K.red, K.pink, K.hotpink][j % 3], 7300 + j * 6);
      }
    }
    // Speech bubbles above the speaker's head, nudged inside the page.
    for (const [who, str] of sc.bubbles || []) {
      const d = drawn[who];
      if (!d) continue;
      const bx = Math.max(110, Math.min(W - 110, d.head[0] + (who === 'cat' ? -40 : 30)));
      const by = d.head[1] - d.R - (sc[who].pose && sc[who].pose.copter ? 82 : 52);
      kit.bubble(str, bx, by, d.head[0] + 6, d.head[1] - d.R * 1.02, { size: 30, seed: 8000 + who.length * 40 });
    }

    // Caption, page dots, hint.
    kit.text(page.caption, W / 2, 70, { color: K.navy, size: 44, align: 'center' });
    if (page.end && u > .9) kit.text('THE END', W / 2, 150, { color: K.red, size: 64, align: 'center', angle: -.04 });
    for (let j = 0; j < PAGES.length; j++) {
      const c = [W / 2 + (j - (PAGES.length - 1) / 2) * 36, H - 30];
      shape(ell(c[0], c[1], 9, 9, 10), j <= i ? K.navy : null, K.navy, 7500 + j * 4, 3, { gap: 3, w: 4 });
    }
    const hint = audio && !audio.started ? 'tap to turn on the sound' : page.end ? 'tap to read again' : 'tap for the next page';
    kit.text(hint, W - 50, H - 22, { color: K.grey, size: 22, align: 'right' });

    // Page turn: a quick fade in from white.
    if (lt < .35) {
      kit.ctx.fillStyle = `rgba(255,255,255,${1 - lt / .35})`;
      kit.ctx.fillRect(0, 0, W, H);
    }
  });
})();
