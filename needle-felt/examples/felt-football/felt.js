// Needle-felt playground, drawn entirely from code with Three.js. Every part is a simple shape
// rendered with instanced "shell fur" (about 30 slightly inflated copies drawn in one call,
// thinned out by a fibre-noise texture), so it reads as fuzzy, matted wool. Five little
// yellow felt guys play a football match in a felt stadium: passes, a shot, a diving goalie,
// a goal celebration and a banana chase, with squeaky gibberish voices and quote bubbles.
(() => {
  'use strict';
  const T = THREE;
  const stage = document.querySelector('#stage');
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  stage.appendChild(renderer.domElement);
  const ui = document.createElement('canvas');
  ui.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  stage.style.position = 'relative';
  stage.appendChild(ui);
  const uctx = ui.getContext('2d');
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, .1, 200);
  const SIZE = .96;                      // share of the shorter screen side the scene fills
  const TARGET = new T.Vector3(0, .5, -.9), RADIUS = 8.4;

  // Felt rendering (fibre texture, shell-fur shader, blob shadows) lives in felt-gl.js.
  const F = FeltGL.create(scene);
  const felt = F.felt, blobShadow = F.blobShadow;
  scene.background = FeltGL.rovingTexture();

  const crowd = []; let crowdCheer = 0;
  // ---------- Felt football stadium ----------
  const FX = 7.5, FZ = 4.6;                           // half size of the pitch
  {
    // Mowed stripes of green felt.
    const N = 10, sw = FX * 2 / N;
    for (let i = 0; i < N; i++) {
      const g = new T.PlaneGeometry(sw, FZ * 2); g.rotateX(-Math.PI / 2);
      const m = felt(g, i % 2 ? '#5fb24c' : '#6fc35a', { len: .07, density: 1.1, aspect: .45 });
      m.position.set(-FX + sw * (i + .5), 0, 0); scene.add(m);
    }
    // A darker felt border all round.
    const border = new T.PlaneGeometry(FX * 2 + 2.4, FZ * 2 + 2.4); border.rotateX(-Math.PI / 2);
    const bm = felt(border, '#4e9a40', { len: .06, density: 4, aspect: 1.3 }); bm.position.y = -.03; scene.add(bm);
    // White felt lines.
    const W = '#f7f3ea', lineW = .12;
    const strip = (x, z, w, d) => { const g = new T.BoxGeometry(w, .03, d); const m = felt(g, W, { len: .025, density: Math.max(w, d) * .4, aspect: 1 }); m.position.set(x, .05, z); scene.add(m); };
    strip(0, -FZ, FX * 2, lineW); strip(0, FZ, FX * 2, lineW); strip(-FX, 0, lineW, FZ * 2); strip(FX, 0, lineW, FZ * 2);
    strip(0, 0, lineW, FZ * 2);
    for (const s of [-1, 1]) {           // penalty boxes
      strip(s * (FX - 1.6), 0, lineW, 4.4); strip(s * (FX - .8), -2.2, 1.6, lineW); strip(s * (FX - .8), 2.2, 1.6, lineW);
    }
    const ring = new T.TorusGeometry(1.5, .06, 6, 64); ring.rotateX(Math.PI / 2);
    const rm = felt(ring, W, { len: .025, density: .6, aspect: 6 }); rm.position.y = .05; scene.add(rm);
    const spot = felt(new T.CylinderGeometry(.12, .12, .03, 16), W, { len: .02, density: .2 }); spot.position.y = .05; scene.add(spot);
    // Goals: white felt posts and crossbar, a soft string net.
    const netMat = new T.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55 });
    for (const s of [-1, 1]) {
      const gx = s * FX, H = 1.5, HW = 1.5, D = .9;
      const post = (x, z) => { const m = felt(new T.CylinderGeometry(.08, .08, H, 12), W, { len: .03, density: .4, aspect: .2 }); m.position.set(x, H / 2, z); scene.add(m); };
      post(gx, -HW); post(gx, HW);
      const bar = felt(new T.CylinderGeometry(.08, .08, HW * 2, 12), W, { len: .03, density: .4, aspect: .2 });
      bar.rotation.x = Math.PI / 2; bar.position.set(gx, H, 0); scene.add(bar);
      const pts = [];
      const bx = gx + s * D;
      for (let i = 0; i <= 10; i++) { const z = -HW + i * HW * .2; pts.push(gx, H, z, bx, H * .55, z, bx, H * .55, z, bx, 0, z); }
      for (let j = 0; j <= 6; j++) { const y = j * H / 6, xx = y > H * .55 ? gx + s * D * (H - y) / (H * .45) : bx; pts.push(xx, y, -HW, xx, y, HW); }
      for (const z of [-HW, HW]) for (let j = 0; j <= 4; j++) { const f = j / 4; pts.push(gx + s * D * f, H - H * .45 * f, z, gx + s * D * f, 0, z); }
      const ng = new T.BufferGeometry(); ng.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
      scene.add(new T.LineSegments(ng, netMat));
    }
    // Corner flags.
    for (const [x, z] of [[-FX, -FZ], [FX, -FZ], [-FX, FZ], [FX, FZ]]) {
      const pole = felt(new T.CylinderGeometry(.03, .03, 1, 8), '#f4f1ea', { len: .02, density: .2 }); pole.position.set(x, .5, z); scene.add(pole);
      const flag = felt(new T.PlaneGeometry(.4, .28), '#e2453c', { len: .025, density: .3 }); flag.position.set(x + .2, .86, z); scene.add(flag);
    }
    // Stands behind the far touchline: three felt tiers with a fuzzy pom-pom crowd.
    for (let r = 0; r < 3; r++) {
      const g = new T.BoxGeometry(FX * 2 + 2, .55, .9);
      const m = felt(g, ['#7d8db8', '#6c7ca8', '#5d6c97'][r], { len: .05, density: 2.2, aspect: 4 });
      m.position.set(0, .28 + r * .55, -FZ - 1.7 - r * .9); m.scale.y = 1 + r * 2; m.position.y = (.55 * (1 + r * 2)) / 2;
      scene.add(m);
    }
    const crowdCols = ['#f2df5a', '#e2453c', '#3f7fd4', '#ffffff', '#f29cc2', '#7fd18b', '#f5a142'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 15; i++) {
      const p = felt(new T.SphereGeometry(.24, 14, 10), crowdCols[(i * 3 + r * 2) % crowdCols.length], { len: .06, density: .8 });
      const y = .55 * (1 + r * 2) + .22;
      p.position.set(-FX + .4 + i * (FX * 2 - .8) / 14 + (r % 2) * .25, y, -FZ - 1.7 - r * .9);
      p.userData.y = y;
      scene.add(p); crowd.push(p);
    }
    // Banner on the stands, in fuzzy letters.
    const bc = document.createElement('canvas'); bc.width = 1024; bc.height = 128;
    const g2 = bc.getContext('2d');
    g2.fillStyle = '#3f7fd4'; g2.fillRect(0, 0, 1024, 128);
    for (let i = 0; i < 4000; i++) { g2.fillStyle = `rgba(255,255,255,${Math.random() * .06})`; g2.fillRect(Math.random() * 1024, Math.random() * 128, 2, 2); }
    g2.font = '600 66px Fredoka, "Arial Rounded MT Bold", sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.lineWidth = 10; g2.strokeStyle = '#1f3f7a'; g2.strokeText('BELLO CUP  ★  BANANA FC', 512, 68);
    g2.fillStyle = '#f2df5a'; g2.fillText('BELLO CUP  ★  BANANA FC', 512, 68);
    const banner = new T.Mesh(new T.PlaneGeometry(9, 1.1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(bc) }));
    banner.position.set(0, 3.35, -FZ - 2.95); scene.add(banner);
  }

  // ---------- A felt buddy ----------
  // opts: s (half length of the straight body: taller guys have more), eyes (1|2), hair ('none'|'sprout'|'spiky'|'comb'), pitch (voice)
  const QUOTES = { beedo: 'Bee-do!', bello: 'Bello!', whee: 'Wheee!', giggle: 'Hehehe!', banana: 'BANANA!', yay: 'Yaaay!', lala: 'La la la~', oops: 'Oopsie!' };
  const YEL = '#f2df5a', BLUE = '#3f7fd4', BLACK = '#221c1b', GREY = '#8d949a', WHITE = '#f4f1ea';
  function buddy({ s = .55, eyes = 1, hair = 'none', pitch = 1, scale = .5 }) {
    const root = new T.Group(), fig = new T.Group();
    root.add(fig);
    scene.add(root);
    // Body (capsule lathe): flatter bottom, round top.
    const prof = [];
    for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + i / 14 * Math.PI / 2; prof.push(new T.Vector2(Math.max(.001, Math.cos(a)), -s + Math.sin(a) * .55)); }
    for (let i = 1; i < 12; i++) prof.push(new T.Vector2(1, -s + i * 2 * s / 12));
    for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI / 2; prof.push(new T.Vector2(Math.max(.001, Math.cos(a)), s + Math.sin(a))); }
    const asp = 2.4 * (1.6 / (1.6 + s));
    fig.add(felt(new T.LatheGeometry(prof, 64), YEL, { len: .075, density: 3.2 + s, aspect: asp }));
    // Overalls: lower shell + bib.
    const pantsTop = -s + .6;
    fig.add(felt(new T.LatheGeometry(prof.filter(p => p.y <= pantsTop).map(p => new T.Vector2(p.x * 1.085 + .001, p.y * 1.01)), 64), BLUE, { len: .1, density: 2.4, aspect: 2.6 }));
    const bibH = .36 + (s - .55) * .5;
    const bib = felt(new T.CylinderGeometry(1.085, 1.085, bibH, 36, 1, true, -Math.PI * .28, Math.PI * .56), BLUE, { len: .09, density: 1.6, aspect: 3.2 });
    bib.position.y = pantsTop + bibH / 2 - .04;
    fig.add(bib);
    // Goggles.
    const EYE_Y = s + .43, HR = Math.sqrt(1 - (EYE_Y - s) ** 2);
    const strapGeo = new T.TorusGeometry(HR + .03, .075, 10, 72, Math.PI * 2 - (eyes === 2 ? 2.3 : 1.5));
    strapGeo.rotateZ(Math.PI / 2 + (eyes === 2 ? 1.15 : .75)); strapGeo.rotateX(Math.PI / 2);
    const strap = felt(strapGeo, '#2b2523', { len: .045, density: 1, aspect: 7 });
    strap.position.y = EYE_Y; fig.add(strap);
    const eyeParts = [];
    const xs = eyes === 2 ? [-.3, .3] : [0];
    const er = eyes === 2 ? .27 : .38;
    for (const x of xs) {
      const z = Math.sqrt(HR * HR - x * x), yaw = Math.atan2(x, z);
      const g = new T.Group(); g.position.set(x, EYE_Y, z); g.rotation.y = yaw; fig.add(g);
      const rim = felt(new T.TorusGeometry(er, er * .34, 14, 40), GREY, { len: .05, density: .8, aspect: 3 }); rim.position.z = .02; g.add(rim);
      const w = felt(new T.SphereGeometry(er * .82, 28, 14), WHITE, { len: .045, density: 1.2 }); w.position.z = .06; w.scale.z = .32; g.add(w);
      const p = felt(new T.SphereGeometry(er * .32, 18, 10), BLACK, { len: .025, density: .5 }); p.position.z = .16; p.scale.z = .5; g.add(p);
      eyeParts.push(w, p);
    }
    // Mouth: a smile, plus an open "O" mouth shown while talking.
    const smilePts = [];
    for (let i = 0; i <= 16; i++) { const x = -.3 + i / 16 * .6; smilePts.push(new T.Vector3(x, s - .11 + .55 * x * x, Math.sqrt(Math.max(0, 1 - x * x)) + .07)); }
    const smile = felt(new T.TubeGeometry(new T.CatmullRomCurve3(smilePts), 24, .03, 8), '#241e1c', { len: .025, density: .5, aspect: 4 });
    fig.add(smile);
    const open = felt(new T.SphereGeometry(.15, 18, 12), '#3a1612', { len: .02, density: .5 });
    open.position.set(0, s - .08, 1.02); open.scale.set(1.2, .9, .3); open.visible = false; fig.add(open);
    // Hair: a few black strands.
    const hairMat = new T.MeshBasicMaterial({ color: '#1d1817' });
    const topY = s + 1;
    const strands = { sprout: [[-.12, .2], [-.05, .35], [.04, .4], [.12, .25], [0, .3]], spiky: [[-.3, .22], [-.18, .3], [-.06, .34], [.06, .34], [.18, .3], [.3, .22]], comb: [[-.25, .18], [-.15, .2], [-.05, .22], [.05, .22], [.15, .2], [.25, .18]] }[hair] || [];
    for (const [x, h] of strands) {
      const lean = hair === 'comb' ? (x < 0 ? -.25 : .25) : x * .8;
      const c = new T.QuadraticBezierCurve3(new T.Vector3(x, topY - .02 - Math.abs(x) * .3, 0), new T.Vector3(x + lean * .4, topY + h * .7, 0), new T.Vector3(x + lean, topY + h, .02));
      fig.add(new T.Mesh(new T.TubeGeometry(c, 8, .018, 5), hairMat));
    }
    // Arms: pivot at the shoulder; yellow arm + black mitten.
    const shoulderY = pantsTop + .45 + (s - .55) * .3;
    const arms = [-1, 1].map(side => {
      const piv = new T.Group(); piv.position.set(side * .93, shoulderY, .05); fig.add(piv);
      const a = felt(new T.SphereGeometry(.3, 22, 14), YEL, { len: .085, density: 1.3 }); a.position.y = -.3; a.scale.set(.72, 1.25, .78); piv.add(a);
      const h = felt(new T.SphereGeometry(.19, 20, 12), BLACK, { len: .07, density: 1 }); h.position.set(0, -.66, .05); piv.add(h);
      return piv;
    });
    // Feet: pivot at the hip.
    const feet = [-1, 1].map(side => {
      const piv = new T.Group(); piv.position.set(side * .36, -s - .42, .1); fig.add(piv);
      const f = felt(new T.SphereGeometry(.3, 20, 12), BLACK, { len: .08, density: 1.3 }); f.position.set(0, -.16, .08); f.scale.set(1, .55, 1.3); piv.add(f);
      return piv;
    });
    const lift = (s + .74) * scale;                // raise so the feet just touch the floor
    root.scale.setScalar(scale);
    const shadow = blobShadow(2.6 * scale, 1.9 * scale);
    let talkUntil = 0;
    return {
      root, fig, arms, feet, eyeParts, smile, open, pitch, lift, shadow, s, scale,
      quote: '', quoteAt: -9,
      say(name, now, text) { talkUntil = now + .55; this.quote = text || QUOTES[name] || ''; this.quoteAt = now; if (window.FeltAudio) FeltAudio.voice(name, pitch); },
      update(now) { const talking = now < talkUntil; open.visible = talking && Math.sin(now * 30) > -.3; smile.visible = !talking; },
      place(x, z, yaw, hop = 0) {
        root.position.set(x, lift + hop, z); root.rotation.y = yaw;
        shadow.position.set(x, .07, z + .1); const k = 1 - Math.min(.5, hop * .5); shadow.scale.set(k, k, 1);
      }
    };
  }

  // ---------- Props ----------
  const ballG = new T.Group(); scene.add(ballG);
  ballG.add(felt(new T.SphereGeometry(.17, 20, 14), '#e2453c', { len: .04, density: .9 }));
  const ballShadow = blobShadow(.5, .36);
  function banana() {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const a = -.9 + i / 12 * 1.8; pts.push(new T.Vector3(Math.sin(a) * .45, -Math.cos(a) * .45 + .45, 0)); }
    const g = new T.Group();
    g.add(felt(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, .09, 10), '#f5d23c', { len: .04, density: .6, aspect: 4 }));
    for (const e of [pts[0], pts[pts.length - 1]]) { const tip = felt(new T.SphereGeometry(.07, 10, 8), '#5b3b1c', { len: .02, density: .4 }); tip.position.copy(e); g.add(tip); }
    return g;
  }

  // ---------- Cast ----------
  const kicker1 = buddy({ s: .95, eyes: 2, hair: 'sprout', pitch: 1.0 });   // tall, two eyes
  const kicker2 = buddy({ s: .55, eyes: 1, hair: 'comb', pitch: 1.2 });     // short, one eye
  const runner = buddy({ s: .4, eyes: 2, hair: 'none', pitch: 1.35 });      // tiny, holding the banana
  const chaser = buddy({ s: .8, eyes: 1, hair: 'spiky', pitch: .9 });       // chasing it
  const goalie = buddy({ s: .65, eyes: 2, hair: 'spiky', pitch: 1.12 });    // goalkeeper
  const defender = buddy({ s: .7, eyes: 1, hair: 'sprout', pitch: 1.05 });  // tries to block
  const ref = buddy({ s: .6, eyes: 2, hair: 'comb', pitch: .95 });          // referee, follows play
  const fans = [buddy({ s: .45, eyes: 2, hair: 'sprout', pitch: 1.3 }), buddy({ s: .75, eyes: 1, hair: 'none', pitch: .92 }),
    buddy({ s: .55, eyes: 2, hair: 'spiky', pitch: 1.18 }), buddy({ s: .4, eyes: 1, hair: 'comb', pitch: 1.4 })];
  const ALL = [kicker1, kicker2, runner, chaser, goalie, defender, ref, ...fans];
  const nana = banana(); nana.scale.setScalar(.9);
  runner.arms[1].add(nana); nana.position.set(.05, -.75, .2); nana.rotation.z = .5;

  // ---------- Choreography: a little football match ----------
  // Two strikers pass the ball, the third pass becomes a shot, the goalie dives the wrong
  // way, everyone celebrates; meanwhile the tiny guy runs laps with a banana and gets chased.
  const K1 = [-3.4, 1.0], K2 = [1.6, .2];            // strikers
  const GOAL_X = FX, GOALIE = [FX - 1.1, 0];
  const LAP = { c: [-1.2, -3.1], rx: 4.8, rz: .9 };  // banana chase lap (back of the pitch)
  const PASS = 1.6, SHOT = 1.1, PARTY = 2.4;
  const CYCLE = PASS * 3 + SHOT + PARTY;
  let clock = 0, prevClock = 0;

  function setArms(b, l, r) { b.arms[0].rotation.set(l[0], 0, l[1]); b.arms[1].rotation.set(r[0], 0, r[1]); }
  function walkLegs(b, ph, amp = .6) { b.feet[0].rotation.x = Math.sin(ph) * amp; b.feet[1].rotation.x = -Math.sin(ph) * amp; }
  const crossed = (period, at) => { const a = prevClock % period, b = clock % period; return b >= a ? (a < at && b >= at) : (at >= a || at < b); };
  const yawTo = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
  let goalFlash = 0;

  function play(dt) {
    prevClock = clock; clock += dt;
    const t = clock, c = t % CYCLE;
    const passing = c < PASS * 3, shooting = !passing && c < PASS * 3 + SHOT, party = c >= PASS * 3 + SHOT;
    const partyK = party ? Math.sin((c - PASS * 3 - SHOT) / PARTY * Math.PI) : 0;

    // --- Ball ---
    let bx, by, bz, kicker = null, kickK = 0;
    if (passing) {
      const n = Math.floor(c / PASS), k = (c % PASS) / PASS;
      const from = n % 2 ? K2 : K1, to = n % 2 ? K1 : K2;
      const f = [from[0] + (to[0] > from[0] ? .45 : -.45), from[1] + .3], g = [to[0] + (to[0] > from[0] ? -.45 : .45), to[1] + .3];
      bx = f[0] + (g[0] - f[0]) * k; bz = f[1] + (g[1] - f[1]) * k; by = .22 + Math.sin(k * Math.PI) * 1.1;
      kicker = n % 2 ? kicker2 : kicker1; kickK = Math.max(0, 1 - k * 5);
      if (crossed(CYCLE, n * PASS + .02)) {
        if (window.FeltAudio) FeltAudio.sfx('kick');
        if (n === 0) kicker1.say('bello', clock, 'Bello! Pass!');
        if (n === 1) kicker2.say('beedo', clock, 'Bee-do!');
      }
    } else if (shooting) {
      const k = (c - PASS * 3) / SHOT;
      const f = [K2[0] + .45, K2[1] + .3], g = [GOAL_X + .7, .8];
      bx = f[0] + (g[0] - f[0]) * k; bz = f[1] + (g[1] - f[1]) * k; by = .3 + Math.sin(k * Math.PI * .8) * 1.5;
      kicker = kicker2; kickK = Math.max(0, 1 - k * 4);
      if (crossed(CYCLE, PASS * 3 + .02)) { if (window.FeltAudio) FeltAudio.sfx('kick'); kicker2.say('whee', clock, 'SHOOOT!'); }
    } else {
      // In the net, then it pops back to the first striker for the next round.
      const k = (c - PASS * 3 - SHOT) / PARTY;
      bx = GOAL_X + .7; bz = .8; by = .2 + Math.abs(Math.sin(k * 9)) * .3 * (1 - k);
      if (k > .92) { bx = K1[0] + .45; bz = K1[1] + .3; by = .2; }
    }
    if (crossed(CYCLE, PASS * 3 + SHOT)) {
      goalFlash = 1;
      if (window.FeltAudio) FeltAudio.sfx('boing');
      [kicker1, kicker2, runner, chaser, ...fans].forEach((b, i) => setTimeout(() => b.say(i % 2 ? 'yay' : 'whee', clock, ['GOOOAL!', 'Yaaay!', 'Whee!', 'Banana!', 'Wooo!', 'Bello!', 'Yay yay!', 'Hehehe!'][i]), 80 + i * 110));
      setTimeout(() => defender.say('oops', clock, 'Nooo!'), 500);
      setTimeout(() => ref.say('beedo', clock, 'Bee-doo! Goal!'), 900);
      crowdCheer = 1.6;
    }
    ballG.position.set(bx, by, bz);
    ballG.rotation.z -= dt * 9;
    ballShadow.position.set(bx, .07, bz + .1); const bs = 1 - Math.min(.6, by * .3); ballShadow.scale.set(bs, bs, 1);

    // --- Strikers ---
    for (const [b, home] of [[kicker1, K1], [kicker2, K2]]) {
      const mine = kicker === b, kk = mine ? kickK : 0;
      const look = yawTo(home, [bx, bz]);
      const hop = party ? Math.abs(partyK) * .7 * Math.abs(Math.sin(t * 7)) + .1 : kk * .25 + Math.abs(Math.sin(t * 6)) * .04;
      b.place(home[0], home[1], party ? Math.sin(t * 3) * .6 : look, hop);
      b.feet[0].rotation.x = 0; b.feet[1].rotation.x = -kk * 1.2;
      if (party) { setArms(b, [-.2, -2.6], [-.2, 2.6 + Math.sin(t * 14) * .2]); walkLegs(b, t * 14, .4); }
      else setArms(b, [-.5, -.35 - kk * .6], [-.5, .35 + kk * .6]);
    }

    // --- Goalie: sways and claps, dives the wrong way on the shot, then cheers anyway ---
    let gz = Math.sin(t * 2.4) * .8, gtilt = 0, gy = 0;
    if (shooting) { const k = (c - PASS * 3) / SHOT; gz = Math.sin(t * 2.4) * .8 * (1 - k) - k * 1.8; gtilt = -k * 1.1; gy = Math.sin(k * Math.PI) * .5; }
    if (party) { const k = (c - PASS * 3 - SHOT) / PARTY; gz = -1.8 * (1 - Math.min(1, k * 3)); gtilt = -1.1 * (1 - Math.min(1, k * 3)); gy = k > .35 ? Math.abs(Math.sin(t * 7)) * .4 : 0; }
    goalie.place(GOALIE[0], GOALIE[1] + gz, -Math.PI / 2, gy);
    goalie.fig.rotation.z = gtilt;
    if (passing) { const clap = Math.abs(Math.sin(t * 6)); setArms(goalie, [-1.2, -.6 + clap * .5], [-1.2, .6 - clap * .5]); walkLegs(goalie, t * 5, .25); }
    else if (shooting) setArms(goalie, [-.3, -2.4], [-.3, 2.4]);
    else setArms(goalie, [-.2, -2.4 - Math.sin(t * 12) * .2], [-.2, 2.4 + Math.sin(t * 12) * .2]);
    if (crossed(CYCLE, PASS * 3 + SHOT + .7)) goalie.say('oops', clock, 'Oopsie...');
    if (passing && crossed(CYCLE, 2.4)) goalie.say('lala', clock, 'La la la~');

    // --- Banana chase lap ---
    const th = t * .75;
    const lap = a => [LAP.c[0] + Math.cos(a) * LAP.rx, LAP.c[1] + Math.sin(a) * LAP.rz];
    const r1 = lap(th), r0 = lap(th - .05), c1 = lap(th - .75), c0 = lap(th - .8);
    runner.place(r1[0], r1[1], yawTo(r0, r1), Math.abs(Math.sin(t * 10)) * .18);
    chaser.place(c1[0], c1[1], yawTo(c0, c1), Math.abs(Math.sin(t * 9 + 1)) * .14);
    walkLegs(runner, t * 20, .7); walkLegs(chaser, t * 18, .6);
    setArms(runner, [-.6 + Math.sin(t * 20) * .5, -.3], [-.3, 2.5 + Math.sin(t * 8) * .3]);
    setArms(chaser, [-1.4 + Math.sin(t * 18) * .3, -.2], [-1.4 - Math.sin(t * 18) * .3, .2]);
    if (crossed(6.1, .5)) chaser.say('banana', clock, 'BA-NA-NA!!');
    if (crossed(6.1, 2.4)) runner.say('giggle', clock, 'Hehehe!');
    if (crossed(6.1, 4.3)) chaser.say('bello', clock, 'Gimme!');

    // --- Defender: shuffles to stay in line with the ball, leaps at the shot ---
    {
      const dz = Math.max(-2, Math.min(2, bz * .7)), jump = shooting ? Math.sin(((c - PASS * 3) / SHOT) * Math.PI) * .7 : 0;
      defender.place(4.4, dz, yawTo([4.4, dz], [bx, bz]), jump + Math.abs(Math.sin(t * 8)) * .05);
      walkLegs(defender, t * 12, .35);
      if (shooting) setArms(defender, [-.2, -2.5], [-.2, 2.5]);
      else if (party) setArms(defender, [-.4, -.3], [-.4, .3]);
      else setArms(defender, [-.6, -.9], [-.6, .9]);
    }
    // --- Referee jogs along the near touchline, keeping up with the ball ---
    {
      const rx = Math.max(-6, Math.min(6, bx - 1)), rz = 2.9;
      ref.place(rx, rz, party ? 0 : yawTo([rx, rz], [bx, bz]), Math.abs(Math.sin(t * 11)) * .08);
      walkLegs(ref, t * 16, .5);
      if (party) setArms(ref, [-.3, -.3], [-.2, 2.7]);   // arm up: goal given
      else setArms(ref, [-.7 + Math.sin(t * 16) * .4, -.25], [-.7 - Math.sin(t * 16) * .4, .25]);
    }
    // --- Fans in front of the stands: always bouncing, wild after a goal ---
    fans.forEach((f, i) => {
      const x = -5.2 + i * 3.4, wild = party ? 1 : .35;
      f.place(x, -FZ - .55, Math.sin(t * .8 + i) * .4, Math.abs(Math.sin(t * (6 + i) + i)) * .35 * wild);
      setArms(f, [-.2, -1.4 - Math.sin(t * (8 + i)) * 1.1 * wild], [-.2, 1.4 + Math.sin(t * (8 + i) + 1) * 1.1 * wild]);
      if (crossed(7.3, 1 + i * 1.7) && !party) f.say(['lala', 'bello', 'whee', 'giggle'][i], clock, ['Go go go!', 'Bello!', 'Wooo!', 'Hehehe!'][i]);
    });

    // --- Crowd pom-poms bounce, harder after a goal ---
    crowdCheer = Math.max(0, crowdCheer - dt * .6);
    crowd.forEach((p, i) => {
      const amp = .06 + crowdCheer * .35;
      p.position.y = p.userData.y + Math.abs(Math.sin(t * (4 + (i % 5)) + i)) * amp;
    });
    goalFlash = Math.max(0, goalFlash - dt * .5);

    ALL.forEach((b, i) => {
      const blink = ((t + i * 1.3) % 4.2) < .13 ? .12 : 1;
      b.eyeParts.forEach(e => { e.scale.y = blink; });
      b.update(clock);
    });
  }

  // ---------- Camera, drag to look around ----------
  let yaw = 0, spin = 0, dragging = false, lastX = 0, idle = 99;
  const el = renderer.domElement;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => { if (!dragging) return; spin = (e.clientX - lastX) * .006; yaw += spin; lastX = e.clientX; idle = 0; });
  addEventListener('pointerup', () => { dragging = false; });
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    el.style.cssText = 'display:block;width:100%;height:100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const dpr = Math.min(2, devicePixelRatio || 1); ui.width = Math.round(w * dpr); ui.height = Math.round(h * dpr);
  }
  // Fun quote bubbles above whoever is talking, plus a big GOAL! when one goes in.
  const pv = new T.Vector3();
  function overlay() {
    const W = ui.width, H = ui.height, u = Math.max(1, Math.min(W, H) / 640);
    uctx.clearRect(0, 0, W, H);
    for (const b of ALL) {
      const age = clock - b.quoteAt;
      if (!b.quote || age > 1.6) continue;
      pv.set(b.root.position.x, b.root.position.y + (b.s + 1.6) * b.scale, b.root.position.z).project(camera);
      const sx = (pv.x * .5 + .5) * W, sy = (-pv.y * .5 + .5) * H;
      const pop = Math.min(1, age / .12) * (age > 1.35 ? Math.max(0, (1.6 - age) / .25) : 1);
      const fs = 21 * u;
      uctx.font = `600 ${fs}px Fredoka, "Arial Rounded MT Bold", sans-serif`;
      const w = uctx.measureText(b.quote).width + fs * 1.3, h = fs * 1.8;
      const bx = Math.max(6, Math.min(W - w - 6, sx - w / 2)), by = sy - h - fs * .7;
      uctx.save();
      uctx.translate(sx, sy); uctx.scale(pop, pop); uctx.translate(-sx, -sy);
      uctx.shadowColor = 'rgba(90,20,20,.25)'; uctx.shadowBlur = 8 * u; uctx.shadowOffsetY = 3 * u;
      uctx.fillStyle = '#fffaf2';
      uctx.beginPath(); uctx.roundRect(bx, by, w, h, h / 2); uctx.fill();
      uctx.beginPath(); uctx.moveTo(sx - fs * .4, by + h - 1); uctx.lineTo(sx, sy - fs * .1); uctx.lineTo(sx + fs * .4, by + h - 1); uctx.closePath(); uctx.fill();
      uctx.shadowColor = 'transparent';
      uctx.fillStyle = '#7a2e28'; uctx.textAlign = 'center'; uctx.textBaseline = 'middle';
      uctx.fillText(b.quote, bx + w / 2, by + h / 2 + fs * .04);
      uctx.restore();
    }
    if (goalFlash > 0) {
      const k = 1 - goalFlash, fs = 92 * u * (1 + .25 * Math.max(0, 1 - k * 4));
      uctx.save();
      uctx.globalAlpha = Math.min(1, goalFlash * 2.5);
      uctx.font = `600 ${fs}px Fredoka, "Arial Rounded MT Bold", sans-serif`;
      uctx.textAlign = 'center'; uctx.textBaseline = 'middle'; uctx.lineJoin = 'round';
      uctx.lineWidth = fs * .16; uctx.strokeStyle = '#1f3f7a'; uctx.strokeText('GOAL!', W / 2, H * .2);
      uctx.fillStyle = '#f2df5a'; uctx.fillText('GOAL!', W / 2, H * .2);
      uctx.restore();
    }
  }
  function placeCamera() {
    const fovV = camera.fov * Math.PI / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
    const d = RADIUS / SIZE / Math.tan(Math.min(fovV, fovH) / 2);
    const pitch = .52;
    camera.position.set(TARGET.x + Math.sin(yaw) * Math.cos(pitch) * d, TARGET.y + Math.sin(pitch) * d, TARGET.z + Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(TARGET);
  }
  addEventListener('resize', resize);
  resize();

  let prev = null;
  function frame(ms) {
    const t = ms / 1000, dt = prev === null ? 0 : Math.max(0, Math.min(.1, t - prev));
    prev = t;
    if (!dragging) { idle += dt; spin *= .93; yaw += spin; if (idle > 2.5) yaw += (Math.sin(t * .15) * .25 - yaw) * Math.min(1, dt * .8); }
    play(dt);
    placeCamera();
    renderer.render(scene, camera);
    overlay();
  }
  const loop = ms => { frame(ms); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.feltStep = frame;   // lets tests draw a frame by hand
})();
