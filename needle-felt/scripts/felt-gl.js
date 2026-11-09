// FeltGL: needle-felt (fuzzy wool) rendering for Three.js r128 (global THREE).
// Any geometry becomes felt with instanced "shell fur": the base surface plus ~28 slightly
// inflated copies drawn in one call, thinned out by a fibre-noise texture so the outer layers
// turn into stray fibres. Deep layers are darker, the silhouette gets a soft fuzzy halo.
//
//   const F = FeltGL.create(scene);
//   scene.background = FeltGL.rovingTexture();          // pink wool roving backdrop
//   scene.add(F.felt(new THREE.SphereGeometry(1, 32, 16), '#f2df5a', { len: .08, density: 2 }));
//   const shadow = F.blobShadow(2, 1.4);                 // soft contact shadow on the floor
(function (global) {
  'use strict';
  const T = global.THREE;
  function create(scene, opts = {}) {
  // ---------- Textures ----------
  function fibreTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = v; img.data[i + 1] = Math.random() * 255; img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 256, y = Math.random() * 256, a = Math.random() * Math.PI * 2, L = 3 + Math.random() * 9;
      g.strokeStyle = `rgba(${200 + Math.random() * 55},${Math.random() * 255},${200 + Math.random() * 55},.8)`; g.lineWidth = .6 + Math.random() * .8;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * L * .5, y + Math.sin(a + .6) * L * .5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function rovingTexture() {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 1000;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(700, 450, 100, 700, 500, 900);
    bg.addColorStop(0, '#ef9a8f'); bg.addColorStop(1, '#d9736b');
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    const cols = ['#f6b3a9', '#e8877d', '#d66a62', '#fbc7bf', '#c95c55', '#f2a093'];
    g.lineCap = 'round';
    for (let i = 0; i < 14000; i++) {
      let x = Math.random() * c.width, y = Math.random() * c.height;
      const len = 20 + Math.random() * 90;
      g.strokeStyle = cols[i % cols.length]; g.globalAlpha = .05 + Math.random() * .16; g.lineWidth = .6 + Math.random() * 2.2;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        const a = Math.sin(x * .004 + y * .002) * 2.2 + Math.cos(y * .005) * 1.4 + (Math.random() - .5) * .5;
        x += Math.cos(a) * len / 6; y += Math.sin(a) * len / 6; g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    const v = g.createRadialGradient(700, 500, 300, 700, 500, 900);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,20,20,.28)');
    g.fillStyle = v; g.fillRect(0, 0, c.width, c.height);
    return new T.CanvasTexture(c);
  }
  const FIBRE = fibreTexture();

  // ---------- Instanced shell-fur material ----------
  const LIGHT = new T.Vector3(...(opts.light || [-.5, .75, .65])).normalize();
  const LAYERS = opts.layers || 28;
  const vert = `
    attribute float layer;
    uniform float furLen;
    varying vec2 vUv; varying vec3 vN; varying vec3 vView; varying float vLayer;
    void main() {
      vUv = uv; vLayer = layer;
      vec3 n = normalize(normal);
      vec4 wp = modelMatrix * vec4(position + n * furLen * layer, 1.0);
      wp.y -= .6 * layer * layer * furLen;            // tips sag a little
      vN = normalize(mat3(modelMatrix) * n);
      vView = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const frag = `
    uniform vec3 color, lightDir;
    uniform float density, aspect;
    uniform sampler2D fibre;
    varying vec2 vUv; varying vec3 vN; varying vec3 vView; varying float vLayer;
    void main() {
      vec2 uv = vUv * vec2(density * aspect, density);
      vec4 f = texture2D(fibre, uv), f2 = texture2D(fibre, uv * .31 + .37);
      float h = f.r * .7 + f2.r * .3;
      if (vLayer > 0.0 && h < vLayer * 1.02) discard;
      float d = dot(vN, lightDir);
      float wrap = max(d * .5 + .5, 0.0), diff = max(d, 0.0);
      float ao = mix(.5, 1.05, vLayer);
      float rim = pow(1.0 - max(dot(vN, vView), 0.0), 2.2);
      vec3 c = color * (.32 + .45 * wrap + .35 * diff) * ao;
      c += color * rim * .45 * (.4 + vLayer);
      c *= .88 + .24 * f2.g;
      gl_FragColor = vec4(c, 1.0);
    }`;
  const layerAttr = new T.InstancedBufferAttribute(new Float32Array(LAYERS + 1).map((_, i) => i / LAYERS), 1);
  const matCache = new Map();
  function feltMat(color, len, density, aspect) {
    const k = [color, len, density, aspect].join();
    if (!matCache.has(k)) matCache.set(k, new T.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: {
      furLen: { value: len }, color: { value: new T.Color(color) }, lightDir: { value: LIGHT }, density: { value: density }, aspect: { value: aspect }, fibre: { value: FIBRE } } }));
    return matCache.get(k);
  }
  // One fuzzy part = one instanced draw call (base surface + all shells).
  function felt(geo, color, { len = .05, density = 1, aspect = 1 } = {}) {
    const ig = new T.InstancedBufferGeometry().copy(geo);
    ig.setAttribute('layer', layerAttr);
    ig.instanceCount = LAYERS + 1;
    const m = new T.Mesh(ig, feltMat(color, len, density, aspect));
    m.frustumCulled = false;
    return m;
  }
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(60,10,10,.55)'); gr.addColorStop(1, 'rgba(60,10,10,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  })();
  function blobShadow(w, d) {
    const s = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.y = .005;
    scene.add(s);
    return s;
  }

    return { felt, blobShadow, material: feltMat, fibre: FIBRE, layers: LAYERS };
  }
  function rovingTexture() {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 1000;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(700, 450, 100, 700, 500, 900);
    bg.addColorStop(0, '#ef9a8f'); bg.addColorStop(1, '#d9736b');
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    const cols = ['#f6b3a9', '#e8877d', '#d66a62', '#fbc7bf', '#c95c55', '#f2a093'];
    g.lineCap = 'round';
    for (let i = 0; i < 14000; i++) {
      let x = Math.random() * c.width, y = Math.random() * c.height;
      const len = 20 + Math.random() * 90;
      g.strokeStyle = cols[i % cols.length]; g.globalAlpha = .05 + Math.random() * .16; g.lineWidth = .6 + Math.random() * 2.2;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        const a = Math.sin(x * .004 + y * .002) * 2.2 + Math.cos(y * .005) * 1.4 + (Math.random() - .5) * .5;
        x += Math.cos(a) * len / 6; y += Math.sin(a) * len / 6; g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    const v = g.createRadialGradient(700, 500, 300, 700, 500, 900);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,20,20,.28)');
    g.fillStyle = v; g.fillRect(0, 0, c.width, c.height);
    return new T.CanvasTexture(c);
  }

  global.FeltGL = { create, rovingTexture };
})(window);
