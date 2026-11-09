// A 3D, explorable ukiyo-e sea built with Three.js (r128). Everything is drawn in a woodblock
// style with custom toon shaders: flat Prussian-blue colour bands, carved water lines, dark
// outline rims, cream foam claws and spray dots, a graded bokashi sky, a snow-capped mountain,
// three-masted tall ships, birds, and washi paper over the view.
// Three tall ships with billowing dark sails ride the swell; drag, zoom or use the arrows to explore.
(() => {
  'use strict';
  const T = THREE;
  const stage = document.querySelector('#stage');
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  stage.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(42, 1, .5, 2000);
  const SUN = new T.Vector3(-.4, .55, .7).normalize();
  const col = h => new T.Color(h);
  const PAL = { key: col('#17233d'), deep: col('#1d3866'), mid: col('#33629a'), light: col('#86abc9'), pale: col('#c9d8df'), foam: col('#f6eedb'), cream: col('#efe2c4'), pink: col('#e2aa8c'), sky: col('#4f6584') };
  const HORIZON = col('#e9dcc0');

  // ---------- Water height (shared by the shader and the boats) ----------
  const WAVES = [[1, .2, .08, 1.6, .9], [.6, 1, .13, .9, 1.3], [-.4, 1, .22, .4, 1.8], [1, -.5, .35, .2, 2.2]].map(([x, z, k, a, s]) => { const l = Math.hypot(x, z); return [x / l, z / l, k, a, s]; });
  const FUJI = [620, -80];
  const HEAD = Math.atan2(FUJI[0] - 14, FUJI[1] + 10);               // the fleet's heading: straight for the mountain
  const FLOW = [-Math.sin(HEAD) * 4.5, -Math.cos(HEAD) * 4.5];        // so the sea streams past the hulls
  function heightAt(x, z, t) { x -= FLOW[0] * t; z -= FLOW[1] * t; let h = 0; for (const [dx, dz, k, a, s] of WAVES) h += a * Math.sin(k * (dx * x + dz * z) + s * t); return h; }
  const waveGLSL = `
    float waveH(vec2 p, float t) {
      float h = 0.0;
      ${WAVES.map(([dx, dz, k, a, s]) => `h += ${a.toFixed(3)} * sin(${k.toFixed(3)} * dot(vec2(${dx.toFixed(4)}, ${dz.toFixed(4)}), p) + ${s.toFixed(3)} * t);`).join('\n      ')}
      return h;
    }`;

  // ---------- Sky ----------
  scene.add(new T.Mesh(new T.SphereGeometry(900, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false,
    uniforms: { top: { value: PAL.sky }, mid: { value: col('#8d97a2') }, low: { value: HORIZON }, pink: { value: PAL.pink } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top, mid, low, pink; varying vec3 vD;
      void main(){
        float y = vD.y;
        vec3 c = mix(low, mid, smoothstep(.06, .3, y));
        c = mix(c, top, smoothstep(.3, .62, y));
        c = mix(c, pink, (1.0 - smoothstep(.0, .09, abs(y - .03))) * .45);
        c = floor(c * 18.0) / 18.0;
        gl_FragColor = vec4(c, 1.0);
      }`
  })));

  // ---------- Ocean ----------
  const ocean = new T.Mesh(new T.PlaneGeometry(800, 800, 380, 380).rotateX(-Math.PI / 2), new T.ShaderMaterial({
    uniforms: { t: { value: 0 }, flow: { value: new T.Vector2(0, 0) }, sun: { value: SUN }, deep: { value: PAL.deep }, mid: { value: PAL.mid }, light: { value: PAL.light }, foam: { value: PAL.foam }, key: { value: PAL.key }, horizon: { value: HORIZON } },
    vertexShader: `uniform float t; uniform vec2 flow; varying vec3 vW; varying float vH; varying vec3 vN; varying vec2 vQ;
      ${waveGLSL}
      void main(){
        vec3 p = position;
        float fade = 1.0 - smoothstep(120.0, 380.0, length(p.xz));
        vec2 q = p.xz - flow * t; vQ = q;
        float h = waveH(q, t) * fade;
        float e = .8;
        float hx = waveH(q + vec2(e, 0.0), t) * fade, hz = waveH(q + vec2(0.0, e), t) * fade;
        vN = normalize(vec3(h - hx, e, h - hz));
        p.y += h; vH = h;
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform vec3 sun, deep, mid, light, foam, key, horizon; uniform float t;
      varying vec3 vW; varying float vH; varying vec3 vN; varying vec2 vQ;
      void main(){
        float d = dot(vN, sun);
        vec3 c = d > .82 ? light : d > .62 ? mid : deep;
        float lines = abs(fract(vH * 1.6 + vQ.x * .015) - .5);
        c = mix(c, light, (1.0 - smoothstep(.02, .06, lines)) * .55);
        float n = (sin(vQ.x * .31) + sin(vQ.y * .37 + vQ.x * .11)) * .22 + .2;
        float f = vH - 2.6 - n;
        if (f > 0.0) c = foam;
        if (abs(f) < .07) c = key;
        float dist = length(vW.xz - cameraPosition.xz);
        c = mix(c, horizon, smoothstep(150.0, 650.0, dist));
        gl_FragColor = vec4(c, 1.0);
      }`
  }));
  scene.add(ocean);

  // ---------- Toon material with an outline rim ----------
  // opts.planks draws dark plank seams (for wooden hulls); opts.snow a jagged snow cap.
  function toon(lit, shade, { rim = .22, snow = null, planks = 0 } = {}) {
    return new T.ShaderMaterial({
      side: T.DoubleSide,
      uniforms: { lit: { value: col(lit) }, shade: { value: col(shade) }, key: { value: PAL.key }, sun: { value: SUN }, foam: { value: PAL.foam }, rim: { value: rim }, planks: { value: planks }, snow: { value: snow ? new T.Vector2(...snow) : new T.Vector2(1e9, 0) } },
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vL;
        void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 lit, shade, key, sun, foam; uniform float rim, planks; uniform vec2 snow;
        varying vec3 vN; varying vec3 vV; varying vec3 vL;
        void main(){
          vec3 n = normalize(vN); if (dot(n, vV) < 0.0) n = -n;
          vec3 c = dot(n, sun) > .15 ? lit : shade;
          float a = atan(vL.z, vL.x);
          if (vL.y > snow.x + sin(a * 9.0) * snow.y + sin(a * 23.0) * snow.y * .4) c = foam;
          if (planks > 0.0 && fract(vL.y * planks) < .09) c = mix(c, key, .7);
          if (abs(dot(n, normalize(vV))) < rim) c = key;
          gl_FragColor = vec4(c, 1.0);
        }`
    });
  }

  // ---------- The mountain ----------
  {
    const prof = [[1, 0], [.62, .14], [.36, .34], [.2, .56], [.12, .78], [.08, .92], [0, .96]].map(([r, y]) => new T.Vector2(r * 90, y * 70));
    const m = new T.Mesh(new T.LatheGeometry(prof, 64), toon('#4a6990', '#2f4a70', { rim: .12, snow: [50, 3.5] }));
    m.position.set(620, -2, -80);
    scene.add(m);
  }

  // ---------- Woodblock sprites: foam claw and spray dot ----------
  function sprite(draw, w = 128, h = 128) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const clawTex = sprite((g, w, h) => {
    g.translate(w * .25, h * .55); g.scale(w / 2.2, h / 2.2);
    g.beginPath(); g.moveTo(-.5, 0); g.quadraticCurveTo(-.2, -.9, .5, -.6); g.quadraticCurveTo(1.3, -.2, 1.2, .55); g.quadraticCurveTo(.8, .1, .1, .35); g.closePath();
    g.fillStyle = '#f6eedb'; g.fill(); g.lineWidth = .09; g.strokeStyle = '#17233d'; g.lineJoin = 'round'; g.stroke();
  });
  const dotTex = sprite((g, w) => { g.beginPath(); g.arc(w / 2, w / 2, w * .36, 0, Math.PI * 2); g.fillStyle = '#f6eedb'; g.fill(); g.lineWidth = w * .1; g.strokeStyle = '#17233d'; g.stroke(); }, 64, 64);
  const clawMat = new T.MeshBasicMaterial({ map: clawTex, alphaTest: .5, side: T.DoubleSide });
  const dotMat = new T.PointsMaterial({ map: dotTex, size: 1.1, alphaTest: .5, sizeAttenuation: true });

  // ---------- Tall ships (three-masted, square-rigged) ----------
  // Dark hull with a raised stern castle and gunports, a bowsprit, three masts with yards
  // and billowing dark square sails, jibs, rigging lines, crow's nests and waving pennants.
  const SHIP = {
    hull: toon('#2b2a33', '#1b1a22', { rim: .16, planks: 1.6 }), trim: toon('#8a6a3a', '#5e4524', { rim: .3 }),
    wood: toon('#3a2e26', '#251d18', { rim: .3 }), sail: toon('#2e3446', '#1d2130', { rim: .12 }), sailLight: toon('#3a4258', '#262c3d', { rim: .12 }),
    flag: toon('#1e1c22', '#141218', { rim: .2 }), port: toon('#c9a75e', '#9c7c3a', { rim: .4 })
  };
  function shipHull(len, beam) {
    const N = 44, M = 12, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;                                                     // 0 stern .. 1 bow
      const half = beam * Math.pow(Math.sin(Math.PI * Math.min(.999, .08 + u * .92)), .45) * (u < .15 ? .85 + u : 1);
      const sheer = 3.2 + 3.4 * Math.pow(1 - u, 5) + 2.2 * Math.pow(u, 6);  // high stern, rising bow
      const keel = -2.2 * Math.pow(Math.sin(Math.PI * u), .35);
      for (let j = 0; j <= M; j++) {
        const a = Math.PI * j / M, sn = Math.sin(a);
        const x = -Math.cos(a) * half * (1 - .25 * sn * sn * 0);
        const y = sheer + (keel - sheer) * Math.pow(sn, .7);
        pos.push(x * (1 - .18 * sn), y, (u - .5) * len);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  // A square sail: a bent, billowing quad between two yards.
  function sailGeo(w, h, bulge) {
    const g = new T.PlaneGeometry(w, h, 10, 8), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2);
      p.setZ(i, bulge * (1 - x * x) * (1 - y * y * .6));
      p.setX(i, p.getX(i) * (1 - .12 * (y + 1) / 2));                      // narrower at the top
    }
    g.computeVertexNormals();
    return g;
  }
  function makeShip(len = 30) {
    const ship = new T.Group(), beam = len * .14;
    ship.add(new T.Mesh(shipHull(len, beam), SHIP.hull));
    // Deck, stern castle, rails and a gold stripe with gunports.
    const deck = new T.Mesh(new T.BoxGeometry(beam * 1.5, .25, len * .86), SHIP.wood); deck.position.set(0, 3.1, 0); ship.add(deck);
    const castle = new T.Mesh(new T.BoxGeometry(beam * 1.55, 2.4, len * .2), SHIP.hull); castle.position.set(0, 4.6, -len * .38); ship.add(castle);
    const cTop = new T.Mesh(new T.BoxGeometry(beam * 1.6, .25, len * .22), SHIP.trim); cTop.position.set(0, 5.9, -len * .38); ship.add(cTop);
    const fore = new T.Mesh(new T.BoxGeometry(beam * 1.2, 1.2, len * .12), SHIP.hull); fore.position.set(0, 4.0, len * .36); ship.add(fore);
    for (const side of [-1, 1]) {
      const stripe = new T.Mesh(new T.BoxGeometry(.12, .22, len * .8), SHIP.trim); stripe.position.set(side * beam * .98, 2.6, 0); ship.add(stripe);
      for (let i = 0; i < 9; i++) { const pt = new T.Mesh(new T.BoxGeometry(.15, .55, .7), SHIP.port); pt.position.set(side * beam * .97, 1.7, -len * .32 + i * len * .08); ship.add(pt); }
      const rail = new T.Mesh(new T.BoxGeometry(.18, .6, len * .78), SHIP.wood); rail.position.set(side * beam * .78, 3.5, 0); ship.add(rail);
    }
    // Stern lanterns.
    for (const s of [-1, 1]) { const l = new T.Mesh(new T.SphereGeometry(.35, 10, 8), SHIP.port); l.position.set(s * beam * .6, 6.6, -len * .48); ship.add(l); }
    // Bowsprit.
    const bow = new T.Mesh(new T.CylinderGeometry(.18, .28, len * .42, 8), SHIP.wood);
    bow.rotation.x = Math.PI / 2 - .32; bow.position.set(0, 6.2, len * .62); ship.add(bow);
    // Masts with yards, sails and crow's nests.
    const masts = [{ z: len * .22, h: 24, sails: 4 }, { z: -len * .02, h: 28, sails: 4 }, { z: -len * .27, h: 20, sails: 3 }];
    const sails = [], flags = [], tops = [];
    masts.forEach((m, mi) => {
      const mast = new T.Mesh(new T.CylinderGeometry(.2, .38, m.h, 8), SHIP.wood); mast.position.set(0, 3 + m.h / 2, m.z); ship.add(mast);
      tops.push(new T.Vector3(0, 3 + m.h, m.z));
      const nest = new T.Mesh(new T.CylinderGeometry(1.0, .8, .6, 12), SHIP.wood); nest.position.set(0, 3 + m.h * .62, m.z); ship.add(nest);
      for (let k = 0; k < m.sails; k++) {
        const y0 = 6 + k * (m.h - 5) / m.sails, hS = (m.h - 6) / m.sails * .92, w = (beam * 2.6) * (1 - k * .14);
        const yard = new T.Mesh(new T.CylinderGeometry(.12, .12, w * 1.12, 6), SHIP.wood); yard.rotation.z = Math.PI / 2; yard.position.set(0, y0 + hS, m.z + .2); ship.add(yard);
        const sail = new T.Mesh(sailGeo(w, hS, 1.4 - k * .15), k % 2 ? SHIP.sailLight : SHIP.sail);
        sail.position.set(0, y0 + hS / 2, m.z + .35); ship.add(sail);
        sails.push({ mesh: sail, ph: mi * 1.3 + k * .7 });
      }
      // Pennant at the top.
      const fg = new T.PlaneGeometry(3.2, .8, 8, 1); fg.translate(1.6, 0, 0); fg.rotateY(Math.PI / 2);
      const flag = new T.Mesh(fg, SHIP.flag); flag.position.set(0, 3 + m.h + .5, m.z); ship.add(flag);
      flags.push({ mesh: flag, base: fg.attributes.position.array.slice(), ph: mi });
    });
    // Jib sails between the bowsprit and the foremast.
    for (let k = 0; k < 2; k++) {
      const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(0, 12 - k * 3); s.lineTo(-(len * .32 - k * 2.2), 0); s.closePath();
      const jg = new T.ShapeGeometry(s); jg.rotateY(-Math.PI / 2);
      const jib = new T.Mesh(jg, SHIP.sailLight); jib.position.set(0, 7 + k * 1.2, len * .24 + 1); ship.add(jib);
    }
    // Rigging: shrouds from mast tops down to the rails, stays between mast tops and to the bowsprit.
    const pts = [];
    const bowTip = new T.Vector3(0, 6.2 + Math.sin(.32) * len * .21, len * .62 + Math.cos(.32) * len * .21);
    tops.forEach(tp => {
      for (const side of [-1, 1]) for (let i = -2; i <= 2; i++) pts.push(tp.x, tp.y - 1, tp.z, side * beam * .9, 3.6, tp.z + i * .9);
    });
    pts.push(...tops[0].toArray(), ...bowTip.toArray(), ...tops[1].toArray(), ...tops[0].toArray(), ...tops[2].toArray(), ...tops[1].toArray());
    pts.push(...tops[2].toArray(), 0, 6.5, -len * .5);
    const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    ship.add(new T.LineSegments(rg, new T.LineBasicMaterial({ color: PAL.key })));
    scene.add(ship);
    // Crew: deck hands hauling lines, two at the bow gazing ahead, a helmsman at the wheel,
    // the captain pointing at the mountain, and a lookout up in the fore crow's nest.
    const CREW = { coat: toon('#2a4a7c', '#1d3866', { rim: .3 }), coat2: toon('#7a4a2e', '#55321e', { rim: .3 }), skin: toon('#e8c79a', '#c9a676', { rim: .3 }),
      hat: toon('#d8b878', '#b39250', { rim: .3 }), cap: toon('#1e1c1a', '#141210', { rim: .3 }), band: toon('#f6eedb', '#d9cfb8', { rim: .35 }) };
    const crew = [];
    function person(x, y, z, { coat = CREW.coat, hat = 'straw', facing = 0, kind = 'haul', ph = 0 } = {}) {
      const p = new T.Group(); p.position.set(x, y, z); p.rotation.y = facing; ship.add(p);
      const body = new T.Mesh(new T.CylinderGeometry(.32, .42, 1.35, 10), coat); body.position.y = .68; p.add(body);
      const legs = new T.Mesh(new T.CylinderGeometry(.3, .3, .5, 8), CREW.cap); legs.position.y = .05; p.add(legs);
      const head = new T.Group(); head.position.y = 1.62; p.add(head);
      head.add(new T.Mesh(new T.SphereGeometry(.27, 12, 10), CREW.skin));
      if (hat === 'straw') { const h = new T.Mesh(new T.ConeGeometry(.6, .35, 14), CREW.hat); h.position.y = .3; head.add(h); }
      else if (hat === 'cap') { const h = new T.Mesh(new T.CylinderGeometry(.3, .32, .32, 12), CREW.cap); h.position.y = .25; head.add(h); const b = new T.Mesh(new T.CylinderGeometry(.55, .55, .05, 16), CREW.cap); b.position.y = .12; head.add(b); }
      else { const h = new T.Mesh(new T.SphereGeometry(.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * .5), CREW.cap); head.add(h); const band = new T.Mesh(new T.TorusGeometry(.27, .04, 6, 16), CREW.band); band.rotation.x = Math.PI / 2; band.position.y = .05; head.add(band); }
      const arms = [-1, 1].map(sd => { const a = new T.Group(); a.position.set(sd * .4, 1.25, 0); p.add(a); const m = new T.Mesh(new T.CylinderGeometry(.08, .08, .8, 6), coat); m.position.y = -.38; a.add(m); return a; });
      crew.push({ p, body, head, arms, kind, ph });
      return p;
    }
    const deckY = 3.25, castleY = 5.95;
    person(beam * .4, deckY, -len * .05, { kind: 'haul', ph: 0, facing: -1.2 });
    person(-beam * .4, deckY, len * .02, { kind: 'haul', ph: 1.2, facing: 1.2, hat: 'band' });
    person(beam * .35, deckY, len * .12, { kind: 'haul', ph: 2.1, facing: -1.3, coat: CREW.coat2 });
    person(-beam * .3, deckY, -len * .15, { kind: 'coil', ph: .6, hat: 'band', coat: CREW.coat2 });
    person(.6, 4.6, len * .38, { kind: 'gaze', ph: .3 });
    person(-.6, 4.6, len * .36, { kind: 'wave', ph: 1.7, hat: 'band' });
    person(0, castleY, -len * .44, { kind: 'helm', coat: CREW.coat2 });
    const wheel = new T.Mesh(new T.TorusGeometry(.75, .07, 6, 16), CREW.coat2); wheel.position.set(0, castleY + 1.15, -len * .4); ship.add(wheel);
    person(beam * .6, castleY, -len * .34, { kind: 'point', hat: 'cap' });
    person(0, 3 + 24 * .62 + .3, len * .22 + .1, { kind: 'point', hat: 'band', ph: .9 });
    return { g: ship, sails, flags, crew, len };
  }
  const boats = [
    { ...makeShip(30), x: 14, z: -10, scale: .9, ph: 0 },
    { ...makeShip(30), x: -40, z: 30, scale: .6, ph: 1.4 },
    { ...makeShip(30), x: 10, z: -70, scale: .5, ph: 2.3 }
  ];
  boats.forEach(b => {
    b.g.scale.setScalar(b.scale);
    b.yaw = Math.atan2(FUJI[0] - b.x, FUJI[1] - b.z);
    // Wake: foam dots peeling off the bow and spreading behind the stern.
    const N = 160, pos = new Float32Array(N * 3), geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ map: dotTex, size: 1.1 * b.scale + .3, alphaTest: .5, sizeAttenuation: true }));
    pts.frustumCulled = false; scene.add(pts);
    b.wake = { pos, geo, seeds: Array.from({ length: N }, (_, i) => ({ a: Math.random(), side: i % 2 ? 1 : -1, j: Math.random() })) };
  });

  // ---------- Birds ----------
  const birdGeo = new T.BufferGeometry();
  birdGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(5 * 4 * 3), 3));
  scene.add(new T.LineSegments(birdGeo, new T.LineBasicMaterial({ color: PAL.key })));

  // ---------- Paper overlay ----------
  {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 240; i++) {
      const y0 = Math.random() * 1024, amp = 2 + Math.random() * 6, f = .003 + Math.random() * .006, ph = Math.random() * 6;
      g.strokeStyle = `rgba(90,70,40,${.03 + Math.random() * .05})`; g.lineWidth = .6 + Math.random() * 1.4;
      g.beginPath(); for (let x = 0; x <= 1024; x += 12) g.lineTo(x, y0 + Math.sin(x * f + ph) * amp); g.stroke();
    }
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * 1024, y = Math.random() * 1024, a = Math.random() * Math.PI, L = 4 + Math.random() * 18;
      g.strokeStyle = `rgba(120,95,60,${.05 + Math.random() * .08})`; g.lineWidth = .5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    document.querySelector('#paper').style.backgroundImage = `url(${c.toDataURL()})`;
  }

  // ---------- Camera: viewpoints (arrows), drag to orbit, scroll to zoom ----------
  // Views are relative to the flagship's heading: yaw is measured from her bow.
  const VIEWS = [
    { name: 'Sailing for the mountain', jp: '富士へ', rel: Math.PI + .28, pitch: .13, dist: 64, fwd: 14, up: 8 },
    { name: 'The tall ship', jp: '大船', rel: .8, pitch: .07, dist: 62, fwd: 0, up: 10 },
    { name: 'Alongside', jp: '舷側', rel: Math.PI / 2 + .15, pitch: .05, dist: 56, fwd: 0, up: 9 },
    { name: 'Off the bow', jp: '舳先', rel: .05, pitch: .06, dist: 50, fwd: 0, up: 11 },
    { name: 'The fleet from above', jp: '鳥の目', rel: Math.PI + .7, pitch: .72, dist: 140, fwd: -15, up: 0 }
  ].map(v => ({ ...v, yaw: HEAD + v.rel }));
  const viewTarget = v => { const f = boats[0]; return [f.x + Math.sin(HEAD) * v.fwd, v.up, f.z + Math.cos(HEAD) * v.fwd]; };
  VIEWS.forEach(v => { v.target = viewTarget(v); });
  const TOUR = 9;            // seconds per view in the automatic tour
  let autoAt = 0, pauseUntil = 0, clock = 0;
  // ---------- A scripted 30-second film: plays on load (and on R), one smooth unbroken camera move ----------
  // Keys: time, yaw from the bow, pitch, distance, look-ahead along the heading, look-at height.
  const FILM = [
    [0, -.6, .45, 130, 10, 2],          // high establishing shot of the fleet
    [5, .05, .05, 50, 0, 11],           // swoop down to the bow
    [11, .8, .08, 58, 0, 10],           // round to the classic three-quarter view
    [17, Math.PI / 2 + .15, .06, 52, 0, 9],   // alongside the crew
    [23, 2.5, .1, 62, 6, 9],            // over the stern quarter
    [30, Math.PI + .25, .2, 85, 18, 8]  // rise behind her as she sails for the mountain
  ];
  const FILM_LEN = 30;
  const filmCam = new T.CatmullRomCurve3(FILM.map(k => new T.Vector3(HEAD + k[1], k[2], k[3])), false, 'centripetal');
  const filmLook = new T.CatmullRomCurve3(FILM.map(k => new T.Vector3(k[4], k[5], 0)), false, 'centripetal');
  let filmStart = 0, filming = true;
  // Map time to the curve so each key lands on its timestamp.
  function filmU(ft) {
    let i = 0; while (i < FILM.length - 2 && ft > FILM[i + 1][0]) i++;
    const a = FILM[i][0], b = FILM[i + 1][0], k = Math.max(0, Math.min(1, (ft - a) / (b - a)));
    return (i + k * k * (3 - 2 * k)) / (FILM.length - 1);
  }
  function playFilm() { filmStart = clock; filming = true; document.body.classList.add('clean'); }
  addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') playFilm(); });
  let view = 0, dragging = false, lx = 0, ly = 0, idle = 99, vy = 0;
  const target = new T.Vector3(...VIEWS[0].target), goalTarget = target.clone();
  const cam = { yaw: VIEWS[0].yaw, pitch: VIEWS[0].pitch, dist: VIEWS[0].dist };
  const goal = { ...cam };
  const label = document.querySelector('#viewName'), dots = document.querySelector('#viewDots');
  function showView(i) {
    view = (i + VIEWS.length) % VIEWS.length;
    const v = VIEWS[view];
    let y = v.yaw; while (y - cam.yaw > Math.PI) y -= Math.PI * 2; while (y - cam.yaw < -Math.PI) y += Math.PI * 2;
    Object.assign(goal, { yaw: y, pitch: v.pitch, dist: v.dist }); goalTarget.set(...v.target);
    idle = 99; autoAt = clock;
    if (label) label.textContent = `${v.name}  ·  ${v.jp}`;
    if (dots) dots.innerHTML = VIEWS.map((_, k) => `<i class="${k === view ? 'on' : ''}"></i>`).join('');
  }
  document.querySelector('#prev')?.addEventListener('click', e => { e.stopPropagation(); filming = false; pauseUntil = clock + 12; showView(view - 1); });
  document.querySelector('#next')?.addEventListener('click', e => { e.stopPropagation(); filming = false; pauseUntil = clock + 12; showView(view + 1); });
  addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { pauseUntil = clock + 12; showView(view - 1); } if (e.key === 'ArrowRight') { pauseUntil = clock + 12; showView(view + 1); } });
  showView(0);
  playFilm();
  const el = renderer.domElement;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; vy = 0; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!dragging) return;
    vy = -(e.clientX - lx) * .005; cam.yaw += vy;
    cam.pitch = Math.max(.02, Math.min(.95, cam.pitch + (e.clientY - ly) * .003));
    lx = e.clientX; ly = e.clientY; idle = 0; pauseUntil = clock + 12; filming = false;
  });
  addEventListener('pointerup', () => { dragging = false; });
  el.addEventListener('wheel', e => { e.preventDefault(); cam.dist = Math.max(24, Math.min(170, cam.dist * (1 + Math.sign(e.deltaY) * .08))); goal.dist = cam.dist; idle = 0; }, { passive: false });
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); el.style.cssText = 'display:block;width:100%;height:100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------- Animate ----------
  let prev = null;
  function frame(ms) {
    const now = ms / 1000, dt = prev === null ? 0 : Math.max(0, Math.min(.1, now - prev));
    prev = now; clock += dt;
    const t = clock;
    ocean.material.uniforms.t.value = t;
    ocean.material.uniforms.flow.value.set(FLOW[0], FLOW[1]);

    // Ships ride the swell: they pitch and roll with the water; sails breathe and pennants wave.
    for (const b of boats) {
      const L = 14 * b.scale, h = heightAt(b.x, b.z, t), hb = heightAt(b.x + Math.sin(b.yaw) * L, b.z + Math.cos(b.yaw) * L, t), hs = heightAt(b.x + Math.cos(b.yaw) * 4, b.z - Math.sin(b.yaw) * 4, t);
      b.g.position.set(b.x, h - 1.6 * b.scale, b.z);
      b.g.rotation.set(0, b.yaw, 0);
      // Wake behind the ship (in the ship's frame, then placed on the water).
      { const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw), sx = Math.cos(b.yaw), sz = -Math.sin(b.yaw), W = b.wake;
        W.seeds.forEach((sd, i) => {
          const a = (t * .45 + sd.a) % 1, back = -b.len * .45 * b.scale - a * 40 * b.scale + (sd.j < .25 ? b.len * .95 * b.scale : 0);
          const side = sd.side * (b.len * .07 + a * 9) * b.scale + (sd.j - .5) * 1.2;
          const x = b.x + fx * back + sx * side, z = b.z + fz * back + sz * side;
          W.pos[i * 3] = x; W.pos[i * 3 + 1] = heightAt(x, z, t) + .25; W.pos[i * 3 + 2] = z;
        });
        W.geo.attributes.position.needsUpdate = true; }
      // Crew animation.
      for (const c of b.crew) {
        const s = Math.sin(t * 2.2 + c.ph);
        if (c.kind === 'haul') { c.body.rotation.x = .25 + s * .25; c.arms.forEach(a => { a.rotation.x = -1.4 + s * .5; }); }
        else if (c.kind === 'coil') { c.body.rotation.x = .5; c.arms.forEach((a, k) => { a.rotation.x = -1.1 + Math.sin(t * 4 + k * 3) * .4; }); }
        else if (c.kind === 'gaze') { c.head.rotation.y = Math.sin(t * .5 + c.ph) * .3; c.arms[1].rotation.x = -2.2; c.arms[1].rotation.z = .4; }
        else if (c.kind === 'wave') { c.arms[1].rotation.z = 2.6 + Math.sin(t * 6) * .35; }
        else if (c.kind === 'helm') { c.arms.forEach(a => { a.rotation.x = -1.3; }); c.body.rotation.z = Math.sin(t * .8) * .06; }
        else if (c.kind === 'point') { c.arms[1].rotation.x = -1.75 + Math.sin(t * 1.5 + c.ph) * .08; c.arms[0].rotation.x = -.1; }
      }
      b.g.rotateX(-(hb - h) * .06); b.g.rotateZ((hs - h) * .08 + Math.sin(t * .7 + b.ph) * .03);
      for (const s of b.sails) s.mesh.scale.z = 1 + Math.sin(t * 1.4 + s.ph + b.ph) * .18;
      for (const f of b.flags) {
        const arr = f.mesh.geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) { const along = f.base[i + 2]; arr[i] = f.base[i] + Math.sin(t * 6 + along * 1.8 + f.ph) * .25 * along / 3.2; }
        f.mesh.geometry.attributes.position.needsUpdate = true;
      }
    }
    // Birds.
    const bp = birdGeo.attributes.position.array;
    for (let i = 0; i < 5; i++) {
      const a = t * .12 + i * .5, x = Math.cos(a) * (60 + i * 6), z = -60 + Math.sin(a) * 40, y = 55 + i * 3, f = Math.sin(t * 6 + i) * 1.2;
      bp.set([x - 2.2, y + f, z, x, y, z, x, y, z, x + 2.2, y + f, z], i * 12);
    }
    birdGeo.attributes.position.needsUpdate = true;

    // Camera: the 30 s film first; afterwards it holds on the last shot (or tours if the user asks).
    if (filming) {
      const ft = clock - filmStart, u = filmU(Math.min(FILM_LEN, ft));
      const c = filmCam.getPoint(u), l = filmLook.getPoint(u), f = boats[0];
      cam.yaw = c.x; cam.pitch = c.y; cam.dist = c.z;
      target.set(f.x + Math.sin(HEAD) * l.x, l.y, f.z + Math.cos(HEAD) * l.x);
      if (ft >= FILM_LEN) {
        filming = false; pauseUntil = 1e9;             // hold the final shot, gently drifting
        Object.assign(goal, { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist }); goalTarget.copy(target);
      }
      idle = 99;
    } else if (!dragging && clock > pauseUntil && clock - autoAt > TOUR) showView(view + 1);
    if (!dragging && !filming) {
      idle += dt; vy *= .92; cam.yaw += vy;
      if (idle > 2.5) {
        const k = Math.min(1, dt * .7);
        cam.yaw += (goal.yaw + Math.sin(t * .09) * .18 - cam.yaw) * k;
        cam.pitch += (goal.pitch - cam.pitch) * k;
        cam.dist += (goal.dist - cam.dist) * k;
        target.lerp(goalTarget, k);
      }
    }
    camera.position.set(target.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist, target.y + Math.sin(cam.pitch) * cam.dist, target.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist);
    const floor = heightAt(camera.position.x, camera.position.z, t) + 3;
    if (camera.position.y < floor) camera.position.y = floor;
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  const loop = ms => { frame(ms); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.seaStep = frame;   // tests: draw a frame by hand
})();
