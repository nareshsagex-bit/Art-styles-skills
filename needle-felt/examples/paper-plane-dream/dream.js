// "Paper Plane Dream" in needle felt, built with the needle-felt skill's FeltGL engine.
// A child rides a glowing paper airplane covered in handwriting through a felted night sky:
// fuzzy clouds (some lit warm from below), a crescent moon, twinkling stars, floating paper
// lanterns, drifting handwritten words and a shooting star. Everything moves on its own.
(() => {
  'use strict';
  const T = THREE;
  const stage = document.querySelector('#stage');
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  stage.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, .1, 300);
  const F = FeltGL.create(scene, { light: [-.3, .6, .75] });
  const felt = (geo, color, o) => { const m = F.felt(geo, color, o); m.material.side = T.DoubleSide; return m; };
  const WRITING = ['dreams', 'far away', 'goodnight', 'wish', 'little star', 'fly home', 'stories', 'tomorrow', 'once upon', 'the moon said'];

  // ---------- Felted night-sky backdrop: deep blue fibre strokes with faint handwriting ----------
  {
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1100;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, '#16284d'); bg.addColorStop(.55, '#1f3c6b'); bg.addColorStop(1, '#2d5584');
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    const cols = ['#2a4a7e', '#183160', '#35609a', '#1b3765', '#4a74a8', '#0f2147'];
    g.lineCap = 'round';
    for (let i = 0; i < 26000; i++) {
      const x = Math.random() * c.width, y = Math.random() * c.height, L = 5 + Math.random() * 12;
      const a = Math.sin(x * .006) * 1.6 + Math.cos(y * .008) * 1.3 + (Math.random() - .5) * 1.2;   // swirling, brushy flow
      g.strokeStyle = cols[i % cols.length]; g.globalAlpha = .15 + Math.random() * .35; g.lineWidth = 1.5 + Math.random() * 2.5;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .5) * L * .5, y + Math.sin(a + .5) * L * .5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    // Lines of handwriting across the whole sky, like a letter written on the night.
    g.globalAlpha = .28; g.fillStyle = '#0b1834';
    for (let y = 30; y < c.height; y += 46) {
      g.font = `${30 + Math.random() * 14}px "Caveat", "Segoe Script", cursive`;
      let x = -Math.random() * 200;
      while (x < c.width) { const w = WRITING[Math.floor(Math.random() * WRITING.length)]; g.fillText(w, x, y + Math.random() * 10); x += g.measureText(w).width + 18 + Math.random() * 40; }
    }
    g.globalAlpha = .22; g.fillStyle = '#0b1834';
    g.font = '42px "Caveat", "Segoe Script", cursive';
    for (let i = 0; i < 26; i++) g.fillText(WRITING[i % WRITING.length], Math.random() * c.width - 80, Math.random() * c.height);
    g.globalAlpha = 1;
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,214,120,${.3 + Math.random() * .6})`; g.beginPath(); g.arc(Math.random() * c.width, Math.random() * c.height, Math.random() * 2.2, 0, Math.PI * 2); g.fill(); }
    // Little four-point sparkles painted into the sky.
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * c.width, y = Math.random() * c.height * .85, r = 3 + Math.random() * 6;
      g.fillStyle = `rgba(255,224,140,${.5 + Math.random() * .5})`;
      g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * .25, y - r * .25); g.lineTo(x + r, y); g.lineTo(x + r * .25, y + r * .25); g.lineTo(x, y + r); g.lineTo(x - r * .25, y + r * .25); g.lineTo(x - r, y); g.lineTo(x - r * .25, y - r * .25); g.closePath(); g.fill();
    }
    scene.background = new T.CanvasTexture(c);
  }

  // ---------- Glow sprites (additive) for the moon, stars, lanterns and plane ----------
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,220,140,1)'); r.addColorStop(.4, 'rgba(255,200,110,.35)'); r.addColorStop(1, 'rgba(255,190,100,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); })();
  function glow(size, opacity = .7) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity }));
    s.scale.set(size, size, 1); return s;
  }

  // ---------- Moon ----------
  const moonG = new T.Group(); moonG.position.set(7.5, 7.5, -20); scene.add(moonG);
  {
    // Crescent: the outer arc round the left side, then an inner arc back (centre shifted right).
    const sh = new T.Shape();
    sh.absarc(0, 0, 2.2, Math.PI * .35, Math.PI * 1.65, false);
    const sx = 2.2 * Math.cos(Math.PI * .35), sy = 2.2 * Math.sin(Math.PI * .35), cx = 1.6, r2 = Math.hypot(cx - sx, sy);
    sh.absarc(cx, 0, r2, Math.atan2(-sy, sx - cx) + Math.PI * 2, Math.atan2(sy, sx - cx), true);
    const geo = new T.ExtrudeGeometry(sh, { depth: .6, bevelEnabled: true, bevelThickness: .35, bevelSize: .3, bevelSegments: 4, curveSegments: 40 });
    geo.center();
    const moon = felt(geo, '#f3d27a', { len: .09, density: .9 }); moon.rotation.z = Math.PI + .6; moonG.add(moon);
    moonG.add(glow(13, .55));
  }

  // ---------- Stars ----------
  function starGeo(r) {
    const s = new T.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const g = new T.ExtrudeGeometry(s, { depth: r * .25, bevelEnabled: true, bevelThickness: r * .18, bevelSize: r * .12, bevelSegments: 3 }); g.center(); return g;
  }
  const stars = [];
  const STARPOS = [[-6, 10, -24], [4, 12, -24], [9, 10.5, -22], [-13, 9, -22], [-16, 3, -18], [16, 8, -22], [3, 6.5, -14], [-5, 1, -12], [12, -3.5, -12], [-9, -2.5, -11], [6.5, 9.5, -16], [-2.5, 12.5, -26], [15, -1.5, -18], [-15, -4, -16], [-9, 7, -16], [-4, 8.5, -18], [2, 9, -20], [-11, 2.5, -15], [5.5, 3, -12], [12, 1.5, -16], [-7, 4.5, -12], [7.5, 7.8, -18], [-1.5, 5.5, -16], [10.5, -1, -13], [-12, -1, -14], [0, 11, -22], [-14, 6, -20], [14, 5, -20]];
  STARPOS.forEach(([x, y, z], i) => {
    const g = new T.Group(); g.position.set(x, y, z); scene.add(g);
    const r = .35 + (i % 3) * .14;
    g.add(felt(starGeo(r), '#f6cf5a', { len: .05, density: .5 }));
    const gl = glow(r * 6, .5); g.add(gl);
    stars.push({ g, gl, ph: Math.random() * 6, base: r });
  });

  // ---------- Clouds: fuzzy felt balls, the low ones lit warm from below ----------
  const CLOUD_COLS = { dark: ['#3f6597', '#4a72a5', '#35598a'], warm: ['#f1d9a4', '#e9c98a', '#dfe3e6'] };
  const clouds = [];
  function cloud(x, y, z, s, warm) {
    const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
    const puffs = [[0, 0, 0, 1.3], [1.5, -.2, .2, 1.05], [-1.5, -.25, .1, 1.0], [.7, .7, -.2, .9], [-.8, .55, -.1, .85], [2.6, -.45, 0, .7], [-2.6, -.5, .1, .65]];
    puffs.forEach(([px, py, pz, pr], i) => {
      const cols = warm ? CLOUD_COLS.warm : CLOUD_COLS.dark;
      const m = felt(new T.SphereGeometry(pr, 22, 14), cols[i % cols.length], { len: .14, density: 1.1 });
      m.position.set(px, py, pz); m.scale.y = .78; g.add(m);
    });
    if (warm) {
      g.add(glow(7, .35));
      const tc = document.createElement('canvas'); tc.width = 512; tc.height = 256;
      const tg = tc.getContext('2d'); tg.fillStyle = 'rgba(60,40,22,.8)';
      for (let r = 0; r < 6; r++) { tg.font = `${30 + Math.random() * 10}px "Caveat", "Segoe Script", cursive`; tg.fillText(WRITING.slice().sort(() => Math.random() - .5).slice(0, 3).join(' '), 10 + Math.random() * 40, 40 + r * 38); }
      const tm = new T.Mesh(new T.PlaneGeometry(5.2, 2.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(tc), transparent: true, depthWrite: false }));
      tm.position.set(0, -.2, 1.6); g.add(tm);
    }
    clouds.push({ g, speed: .5 + Math.random() * .4, x0: x });
    return g;
  }
  cloud(-8, -5, -8, 1.3, true); cloud(7, -5.5, -6, 1.4, true); cloud(-2, -7, -3, 1.1, true);
  cloud(-12, 1.5, -18, 1.4, false); cloud(10, 3.5, -22, 1.6, false); cloud(-3, 2.5, -24, 1.2, false); cloud(14, -2, -14, 1.1, false); cloud(-16, -3, -12, 1.2, false);

  // ---------- Paper lanterns floating up ----------
  const lanterns = [];
  for (let i = 0; i < 4; i++) {
    const g = new T.Group(); scene.add(g);
    g.add(felt(new T.CylinderGeometry(.32, .26, .7, 14), i % 2 ? '#f0a95a' : '#f5c46c', { len: .04, density: .5 }));
    g.add(glow(2.6, .55));
    lanterns.push({ g, x: -10 + i * 2.2, z: -13 - i * 1.5, ph: i * 2.7 });
  }

  // ---------- The paper airplane, written all over, with the child riding it ----------
  const plane = new T.Group(); plane.rotation.order = 'YXZ'; plane.scale.setScalar(1.45); scene.add(plane);
  {
    // Classic dart: two wings meeting along a centre fold, with a keel underneath.
    const N = [0, 0, 3.2], TL = [-2.1, .32, -2.2], TR = [2.1, .32, -2.2], C = [0, 0, -2.2], K = [0, -.85, -2.2], KN = [0, -.1, 2.6];
    const tri = (a, b, c) => [...a, ...b, ...c];
    const pos = [...tri(N, TL, C), ...tri(N, C, TR), ...tri(KN, C, K), ...tri(KN, K, C)];
    const uv = [.5, 1, 0, 0, .5, 0, .5, 1, .5, 0, 1, 0, .5, 1, .5, 0, .2, 0, .5, 1, .2, 0, .5, 0];
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    plane.add(felt(geo, '#efd9a8', { len: .035, density: 1.4 }));
    // Handwriting lines on the wings (a transparent overlay just above the felt).
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
    const g = c.getContext('2d'); g.fillStyle = 'rgba(60,40,25,.85)';
    g.font = '46px "Caveat", "Segoe Script", cursive';
    for (let row = 0; row < 18; row++) { let line = ''; while (line.length < 40) line += WRITING[Math.floor(Math.random() * WRITING.length)] + ' '; g.save(); g.translate(0, 60 + row * 54); g.rotate(-.02); g.fillText(line, 10 + (row % 3) * 20, 0); g.restore(); }
    const ink = new T.Mesh(geo, new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, side: T.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    ink.scale.setScalar(1.012); ink.position.y = .03; plane.add(ink);
    const warm = glow(11, .65); warm.position.set(0, -.4, 0); plane.add(warm);
    const warm2 = glow(6, .5); warm2.position.set(0, .4, 1); plane.add(warm2);
  }
  // The child, seen from behind, sitting near the back of the plane.
  const kid = new T.Group(); kid.position.set(.35, .45, -.9); kid.scale.setScalar(.62); plane.add(kid);
  const kidArm = new T.Group();
  {
    const body = felt(new T.SphereGeometry(.5, 20, 14), '#2c4f86', { len: .05, density: .7 }); body.scale.set(.9, 1.15, .8); body.position.y = .35; kid.add(body);
    const legs = felt(new T.SphereGeometry(.42, 16, 12), '#203a66', { len: .05, density: .6 }); legs.scale.set(.9, .45, 1.3); legs.position.set(0, -.15, .35); kid.add(legs);
    const head = felt(new T.SphereGeometry(.36, 20, 14), '#f2c9a0', { len: .04, density: .6 }); head.position.y = 1.15; kid.add(head);
    const hair = felt(new T.SphereGeometry(.39, 20, 14, 0, Math.PI * 2, 0, Math.PI * .62), '#6b3f25', { len: .07, density: .6 }); hair.position.y = 1.18; hair.rotation.x = -.35; kid.add(hair);
    kidArm.position.set(-.38, .65, .15); kid.add(kidArm);
    const arm = felt(new T.CylinderGeometry(.11, .1, .7, 10), '#2c4f86', { len: .04, density: .4 }); arm.position.set(0, -.3, .1); arm.rotation.x = .5; kidArm.add(arm);
    const hand = felt(new T.SphereGeometry(.11, 10, 8), '#f2c9a0', { len: .03, density: .3 }); hand.position.set(0, -.6, .28); kidArm.add(hand);
  }

  // ---------- Floating handwritten words ----------
  const words = [];
  [...WRITING, ...WRITING].forEach((w, i) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const g = c.getContext('2d'); g.fillStyle = 'rgba(14,26,52,.75)'; g.font = '64px "Caveat", "Segoe Script", cursive'; g.fillText(w, 12, 86);
    const m = new T.Mesh(new T.PlaneGeometry(4, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    scene.add(m);
    words.push({ m, x: -14 + (i * 5.3) % 28, y: -7 + (i * 2.9) % 18, z: -5 - (i % 4) * 4, ph: i });
  });

  // ---------- Shooting star ----------
  const shoot = new T.Group(); scene.add(shoot);
  shoot.add(felt(starGeo(.3), '#fff0b0', { len: .03, density: .4 })); shoot.add(glow(3, .8));
  const trailGeo = new T.BufferGeometry(); trailGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(2 * 3 * 12), 3));
  const trail = new T.LineSegments(trailGeo, new T.LineBasicMaterial({ color: '#ffe08a', transparent: true, opacity: .8 })); scene.add(trail);

  // ---------- Sparkles, glitter and dotted light trails ----------
  const sparkTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d');
    const r = q.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, 'rgba(255,236,170,1)'); r.addColorStop(.25, 'rgba(255,214,120,.6)'); r.addColorStop(1, 'rgba(255,200,100,0)');
    q.fillStyle = r; q.fillRect(0, 0, 64, 64);
    q.fillStyle = 'rgba(255,244,200,1)'; q.beginPath(); q.moveTo(32, 2); q.lineTo(35, 29); q.lineTo(62, 32); q.lineTo(35, 35); q.lineTo(32, 62); q.lineTo(29, 35); q.lineTo(2, 32); q.lineTo(29, 29); q.closePath(); q.fill();
    return new T.CanvasTexture(c);
  })();
  function pointsCloud(n, size, place) {
    const pos = new Float32Array(n * 3), geo = new T.BufferGeometry();
    for (let i = 0; i < n; i++) pos.set(place(i), i * 3);
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const mat = new T.PointsMaterial({ map: sparkTex, size, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
    const pts = new T.Points(geo, mat); scene.add(pts); return pts;
  }
  // Twinkling sparkles scattered through the sky (three groups that pulse out of step).
  const sparkGroups = [0, 1, 2].map(k => pointsCloud(45, .9 + k * .3, () => [(Math.random() - .5) * 40, -6 + Math.random() * 22, -10 - Math.random() * 16]));
  // Fine gold glitter drifting slowly upward.
  const glitter = pointsCloud(320, .25, () => [(Math.random() - .5) * 36, -8 + Math.random() * 22, -4 - Math.random() * 18]);
  // Dotted constellations: little chains of light curving across the sky.
  const CONST = [
    [[-6, 9.5, -20], [-3.5, 8.8, -20], [-1.5, 8, -20], [.5, 7, -20], [2.5, 6.3, -20]],
    [[-14, 7.5, -19], [-12.5, 6, -19], [-11.8, 4.2, -19], [-12.6, 2.4, -19]],
    [[8.5, 2, -15], [10, 3.2, -15], [11.8, 3.6, -15], [13, 5, -15]]
  ];
  const dots = [];
  CONST.forEach(chain => {
    const curve = new T.CatmullRomCurve3(chain.map(p => new T.Vector3(...p)));
    curve.getPoints(28).forEach((p, i) => dots.push([p.x, p.y, p.z, i]));
  });
  const constPts = pointsCloud(dots.length, .55, i => dots[i].slice(0, 3));
  // Strings of light trailing below each lantern.
  const TRAIL = 14;
  const lanternTrail = pointsCloud(lanterns.length * TRAIL, .45, () => [0, -99, 0]);

  // ---------- Camera & animation (fully automatic) ----------
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let prev = null, clock = 0;
  function frame(ms) {
    const now = ms / 1000, dt = prev === null ? 0 : Math.max(0, Math.min(.1, now - prev));
    prev = now; clock += dt;
    const t = clock;

    // The plane glides up and to the left, bobbing and banking gently.
    plane.position.set(Math.sin(t * .35) * .6, Math.sin(t * .8) * .35, 0);
    plane.rotation.set(-.16 + Math.sin(t * .8 + .6) * .05, -2.5 + Math.sin(t * .3) * .08, .1 + Math.sin(t * .55) * .1);
    kidArm.rotation.x = -.25 + Math.sin(t * 1.4) * .12;
    kid.rotation.y = Math.sin(t * .5) * .15;

    // Clouds drift past (the plane is flying forward) and wrap around.
    for (const c of clouds) {
      c.g.position.x -= c.speed * dt * 1.4;
      if (c.g.position.x < -24) c.g.position.x = 24;
      c.g.position.y += Math.sin(t * .4 + c.x0) * .002;
    }
    // Stars twinkle; the moon glows softly.
    for (const s of stars) { const k = .85 + .25 * Math.sin(t * 2 + s.ph); s.g.scale.setScalar(k); s.gl.material.opacity = .3 + .35 * (.5 + .5 * Math.sin(t * 2 + s.ph)); s.g.rotation.z = Math.sin(t * .6 + s.ph) * .2; }
    moonG.rotation.z = Math.sin(t * .3) * .06;
    // Lanterns float up and sway, then start again from below.
    for (const l of lanterns) {
      const k = ((t * .06 + l.ph / 10) % 1);
      l.g.position.set(l.x + Math.sin(t * .7 + l.ph) * .5, -6 + k * 18, l.z);
      l.g.children[1].material.opacity = .4 + .2 * Math.sin(t * 5 + l.ph);
    }
    // Handwritten words drift slowly sideways and bob.
    for (const w of words) { w.m.position.set(((w.x - t * .4 + 40) % 30) - 15, w.y + Math.sin(t * .5 + w.ph) * .3, w.z); w.m.rotation.z = Math.sin(t * .3 + w.ph) * .08; }
    // Sparkles pulse, glitter rises, constellations shimmer, lantern trails follow the lanterns.
    sparkGroups.forEach((sg, k) => { sg.material.opacity = .45 + .55 * (.5 + .5 * Math.sin(t * 1.7 + k * 2.1)); sg.rotation.z = Math.sin(t * .05 + k) * .02; });
    { const a = glitter.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) { a[i + 1] += dt * (.15 + (i % 7) * .03); a[i] += Math.sin(t + i) * dt * .05; if (a[i + 1] > 14) a[i + 1] = -8; } glitter.geometry.attributes.position.needsUpdate = true; }
    constPts.material.opacity = .6 + .4 * Math.sin(t * 2.3);
    { const a = lanternTrail.geometry.attributes.position.array;
      lanterns.forEach((l, li) => { for (let j = 0; j < TRAIL; j++) { const o = (li * TRAIL + j) * 3; a[o] = l.g.position.x + Math.sin(t * .7 + l.ph - j * .25) * .5 * (j / TRAIL) - j * .12; a[o + 1] = l.g.position.y - .5 - j * .32; a[o + 2] = l.z; } });
      lanternTrail.geometry.attributes.position.needsUpdate = true; }
    // A shooting star every 7 seconds.
    {
      const k = (t % 7) / 1.4, tp = trailGeo.attributes.position.array;
      if (k < 1) {
        const x = -14 + k * 20, y = 12 - k * 6, z = -20;
        shoot.visible = trail.visible = true; shoot.position.set(x, y, z);
        for (let i = 0; i < 12; i++) { const a = i / 12, b = (i + 1) / 12; tp.set([x - a * 5, y + a * 1.5, z, x - b * 5, y + b * 1.5, z], i * 6); }
        trailGeo.attributes.position.needsUpdate = true;
      } else { shoot.visible = trail.visible = false; }
    }

    // A slow, dreamy camera drift behind and to the right of the plane.
    // ZOOM pulls the camera straight back from what it looks at (1.3 = 30% further out).
    const ZOOM = 1.3, LOOK = [-.8, 1.2, -5];
    camera.position.set(
      LOOK[0] + (5.8 + Math.sin(t * .12) * 1.2) * ZOOM,
      LOOK[1] + (3.8 + Math.sin(t * .17) * .5) * ZOOM,
      LOOK[2] + (19.5 + Math.sin(t * .09) * .8) * ZOOM);
    camera.lookAt(...LOOK);
    renderer.render(scene, camera);
  }
  const loop = ms => { frame(ms); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.dreamStep = frame;   // tests: draw a frame by hand
})();
