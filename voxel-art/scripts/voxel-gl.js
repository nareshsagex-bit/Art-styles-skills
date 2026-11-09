// VoxelGL: MagicaVoxel-style voxel rendering in the browser with Three.js (r128, global THREE).
// Small voxels, clean flat colours, per-vertex ambient occlusion, soft cast shadows, a
// shadow-catching floor, bloom on glowing effects, and an orbit camera that sways.
//
//   const vx = VoxelGL.create(document.querySelector('#stage'), { background: '#f3ece3' });
//   const m = VoxelGL.model(); m.ball(0, 4, 0, 3, 3, 3, '#ffd83a'); m.box(-1, 0, -1, 1, 1, 1, '#333');
//   const mesh = vx.mesh(m, { unit: .2, voxel: .07 });   // design unit size, voxel size (world)
//   vx.start((t, dt, fx) => { fx(x, y, z, '#fff', .3, 2); });  // fx = glowing effect cube
(function (global) {
  'use strict';
  const T = global.THREE;

  const lin = hex => new T.Color(hex).convertSRGBToLinear();

  // ---------- Model: shapes in design units, rasterised to voxels later ----------
  function model() {
    const shapes = [];
    const m = {
      shapes,
      box(x0, y0, z0, x1, y1, z1, c) {      // inclusive design cells, like a voxel editor
        shapes.push({ t: 'box', a: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], b: [Math.max(x0, x1) + 1, Math.max(y0, y1) + 1, Math.max(z0, z1) + 1], c });
        return m;
      },
      set(x, y, z, c) { return m.box(x, y, z, x, y, z, c); },
      ball(cx, cy, cz, rx, ry, rz, c) { shapes.push({ t: 'ball', p: [cx, cy, cz], r: [rx, ry, rz], c }); return m; },
      tube(a, b, ra, rb, c, steps = 10) {
        for (let i = 0; i <= steps; i++) {
          const k = i / steps, r = ra + (rb - ra) * k;
          m.ball(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, r, r, r, c);
        }
        return m;
      }
    };
    return m;
  }

  // Rasterise shapes at `res` voxels per design unit -> Map(key -> linear colour).
  const KEY = (i, j, k) => ((i + 1024) * 2048 + (j + 1024)) * 2048 + (k + 1024);
  function rasterise(mdl, res) {
    const cells = new Map(), cols = new Map();
    const col = c => { if (!cols.has(c)) cols.set(c, lin(c)); return cols.get(c); };
    for (const s of mdl.shapes) {
      const c = col(s.c);
      if (s.t === 'box') {
        for (let i = Math.round(s.a[0] * res); i < Math.round(s.b[0] * res); i++)
          for (let j = Math.round(s.a[1] * res); j < Math.round(s.b[1] * res); j++)
            for (let k = Math.round(s.a[2] * res); k < Math.round(s.b[2] * res); k++) cells.set(KEY(i, j, k), c);
      } else {
        const [cx, cy, cz] = s.p, [rx, ry, rz] = s.r;
        for (let i = Math.floor((cx - rx) * res); i <= Math.ceil((cx + rx) * res); i++)
          for (let j = Math.floor((cy - ry) * res); j <= Math.ceil((cy + ry) * res); j++)
            for (let k = Math.floor((cz - rz) * res); k <= Math.ceil((cz + rz) * res); k++) {
              const x = (i + .5) / res, y = (j + .5) / res, z = (k + .5) / res;
              if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1) cells.set(KEY(i, j, k), c);
            }
      }
    }
    return cells;
  }

  // Faces: normal, tangent u, tangent v (u x v = n, so corners wind counter-clockwise).
  const DIRS = [
    { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] }, { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0] }, { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0] }
  ];
  const AO = [.48, .68, .84, 1];

  // Build one BufferGeometry of the visible faces, with per-vertex ambient occlusion.
  function geometry(cells, size) {
    const pos = [], nor = [], colr = [], idx = [];
    const solid = (i, j, k) => cells.has(KEY(i, j, k));
    for (const [key, c] of cells) {
      const k = key % 2048 - 1024, j = Math.floor(key / 2048) % 2048 - 1024, i = Math.floor(key / 2048 / 2048) - 1024;
      for (const D of DIRS) {
        const [nx, ny, nz] = D.n;
        if (solid(i + nx, j + ny, k + nz)) continue;
        const ox = i + (nx > 0 ? 1 : 0), oy = j + (ny > 0 ? 1 : 0), oz = k + (nz > 0 ? 1 : 0);
        const base = pos.length / 3, ao = [];
        for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
          pos.push((ox + D.u[0] * a + D.v[0] * b) * size, (oy + D.u[1] * a + D.v[1] * b) * size, (oz + D.u[2] * a + D.v[2] * b) * size);
          nor.push(nx, ny, nz);
          const su = a ? 1 : -1, sv = b ? 1 : -1;
          const fx = i + nx, fy = j + ny, fz = k + nz;
          const s1 = solid(fx + D.u[0] * su, fy + D.u[1] * su, fz + D.u[2] * su);
          const s2 = solid(fx + D.v[0] * sv, fy + D.v[1] * sv, fz + D.v[2] * sv);
          const cr = solid(fx + D.u[0] * su + D.v[0] * sv, fy + D.u[1] * su + D.v[1] * sv, fz + D.u[2] * su + D.v[2] * sv);
          const o = s1 && s2 ? 0 : 3 - (s1 + s2 + cr);
          ao.push(o);
          const f = AO[o];
          colr.push(c.r * f, c.g * f, c.b * f);
        }
        // Flip the diagonal so occlusion gradients don't show a crease.
        if (ao[0] + ao[2] > ao[1] + ao[3]) idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        else idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(colr, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }

  function create(container, opts = {}) {
    const W = () => container.clientWidth, H = () => container.clientHeight;
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    // 2D overlay canvas for UI text.
    const ui = document.createElement('canvas');
    ui.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    container.appendChild(ui);
    const uctx = ui.getContext('2d');

    const scene = new T.Scene();
    scene.background = lin(opts.background || '#f3ece3');
    const camera = new T.PerspectiveCamera(opts.fov || 28, 1, .5, 400);

    // Light: soft sky fill + warm sun with soft shadows.
    scene.add(new T.HemisphereLight(lin('#fff8ee'), lin('#b9c4d8'), opts.hemi ?? .5));
    const sun = new T.DirectionalLight(lin('#fff4e2'), opts.sun ?? 1.3);
    sun.position.set(-14, 26, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80;
    sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; sun.shadow.radius = 4;
    scene.add(sun);
    // A light that effects can borrow (fire, lightning).
    const fxLight = new T.PointLight(0xffffff, 0, 14, 2);
    scene.add(fxLight);

    // Floor that only shows shadows, so the diorama sits on the background.
    if (opts.floor !== undefined) {
      const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: .16 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = opts.floor; floor.receiveShadow = true;
      scene.add(floor);
    }

    // Post: render -> bloom (only very bright things glow) -> gamma.
    let composer = null;
    if (T.EffectComposer && opts.bloom !== false) {
      composer = new T.EffectComposer(renderer);
      composer.addPass(new T.RenderPass(scene, camera));
      composer.addPass(new T.UnrealBloomPass(new T.Vector2(256, 256), opts.bloomStrength ?? .75, .35, opts.bloomThreshold ?? 1.02));
      composer.addPass(new T.ShaderPass(T.GammaCorrectionShader));
    } else {
      renderer.outputEncoding = T.sRGBEncoding;
    }

    const view = { yaw: opts.yaw ?? .4, pitch: opts.pitch ?? .5, target: new T.Vector3(...(opts.target || [0, 2, 0])), size: opts.size || .6, span: opts.span || 15, shake: [0, 0] };
    function resize() {
      const w = W(), h = H();
      renderer.setSize(w, h, false);
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
      if (composer) composer.setSize(w, h);
      const dpr = Math.min(2, devicePixelRatio || 1);
      ui.width = Math.round(w * dpr); ui.height = Math.round(h * dpr);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function placeCamera() {
      // Distance so a sphere of radius `span` fills `size` of the shorter screen side.
      const fovV = camera.fov * Math.PI / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
      const d = view.span / view.size / Math.tan(Math.min(fovV, fovH) / 2);
      const t = view.target;
      camera.position.set(t.x + Math.sin(view.yaw) * Math.cos(view.pitch) * d, t.y + Math.sin(view.pitch) * d, t.z + Math.cos(view.yaw) * Math.cos(view.pitch) * d);
      camera.lookAt(t);
      if (view.shake[0] || view.shake[1]) {
        camera.position.x += view.shake[0]; camera.position.y += view.shake[1];
      }
    }

    // Drag to orbit; when idle the camera eases back to a gently rocking view.
    let dragging = false, lx = 0, ly = 0, idle = 99;
    const el = renderer.domElement;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      if (!dragging) return;
      view.yaw -= (e.clientX - lx) * .006; view.pitch = Math.max(.12, Math.min(1.3, view.pitch + (e.clientY - ly) * .004));
      lx = e.clientX; ly = e.clientY; idle = 0;
    });
    const up = () => { dragging = false; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

    // ---------- Meshes ----------
    const materials = [];
    function mesh(mdl, { unit = 1, voxel = .1, material = null } = {}) {
      const res = unit / voxel;
      const g = geometry(rasterise(mdl, res), voxel);
      const mat = material || new T.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0 });
      const me = new T.Mesh(g, mat);
      me.castShadow = true; me.receiveShadow = true;
      return me;
    }
    const material = () => { const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0 }); materials.push(m); return m; };

    // ---------- Glowing effect cubes (instanced, bloom-bright) ----------
    const MAX = opts.maxFx || 2500;
    const fxMesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ toneMapped: false }), MAX);
    fxMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    fxMesh.frustumCulled = false;
    const tmp = new T.Object3D(), tc = new T.Color();
    for (let i = 0; i < MAX; i++) fxMesh.setColorAt(i, tc.setRGB(1, 1, 1));
    scene.add(fxMesh);
    let fxN = 0;
    // fx(x, y, z, colour, size, glow): glow > 1 pushes the colour past white so bloom catches it.
    function fx(x, y, z, color, s = .2, glow = 1) {
      if (fxN >= MAX) return;
      tmp.position.set(x, y, z); tmp.scale.set(s, s, s); tmp.updateMatrix();
      fxMesh.setMatrixAt(fxN, tmp.matrix);
      tc.set(color).convertSRGBToLinear().multiplyScalar(glow);
      fxMesh.setColorAt(fxN, tc);
      fxN++;
    }

    // World point -> overlay pixel coordinates.
    const pv = new T.Vector3();
    function project(x, y, z) {
      pv.set(x, y, z).project(camera);
      return [(pv.x * .5 + .5) * ui.width, (-pv.y * .5 + .5) * ui.height];
    }

    let update = null, overlay = null, sway = null, prev = null;
    function frame(ms) {
      const t = ms / 1000, dt = prev === null ? 0 : Math.max(0, Math.min(.1, t - prev));
      prev = t;
      if (renderer.domElement.width !== Math.round(W() * renderer.getPixelRatio())) resize();
      if (!dragging) {
        idle += dt;
        if (sway && idle > 2.5) view.yaw += (sway.base + Math.sin(t * sway.speed) * sway.amp - view.yaw) * Math.min(1, dt * .8);
      }
      fxN = 0;
      if (update) update(t, dt, fx);
      fxMesh.count = fxN;
      fxMesh.instanceMatrix.needsUpdate = true;
      if (fxMesh.instanceColor) fxMesh.instanceColor.needsUpdate = true;
      placeCamera();
      if (composer) composer.render(); else renderer.render(scene, camera);
      uctx.setTransform(1, 0, 0, 1, 0, 0);
      uctx.clearRect(0, 0, ui.width, ui.height);
      if (overlay) overlay(t, uctx);
    }
    function start(fn, o = {}) {
      update = fn; overlay = o.overlay || null; sway = o.sway || null;
      resize();
      addEventListener('resize', resize);
      const loop = ms => { frame(ms); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    const api = { THREE: T, scene, camera, renderer, view, sun, fxLight, mesh, material, fx, project, start, step: frame, ui, uctx };
    global.VoxelGL.last = api;
    return api;
  }

  global.VoxelGL = { create, model };
})(window);
