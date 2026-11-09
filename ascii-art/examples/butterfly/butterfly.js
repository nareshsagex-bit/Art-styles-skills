// A flapping butterfly over swaying flowers, drawn on a hidden canvas and shown as colour ASCII.
(() => {
  'use strict';
  const W = 480, H = 360;
  const source = document.querySelector('#source');
  source.width = W; source.height = H;
  const g = source.getContext('2d', { willReadFrequently: true });
  const ascii = AsciiRenderer.create({
    source, output: document.querySelector('#ascii'),
    cols: 170, size: .5, theme: document.body.dataset.theme || 'light', coolScale: .75
  });

  // ---------- Butterfly ----------
  // Wing shapes for the right side (x > 0), in units where the wingspan is about 230.
  function upperWing() {
    g.beginPath();
    g.moveTo(2, -4);
    g.bezierCurveTo(26, -70, 98, -86, 116, -52);
    g.bezierCurveTo(126, -30, 100, -2, 6, 4);
    g.closePath();
  }
  function lowerWing() {
    g.beginPath();
    g.moveTo(4, 2);
    g.bezierCurveTo(72, 4, 100, 42, 80, 74);
    g.bezierCurveTo(60, 98, 22, 66, 3, 14);
    g.closePath();
  }
  function wing(shape, colors, spots, eye) {
    shape();
    const grad = g.createRadialGradient(0, 0, 6, 0, 0, 120);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(.5, colors[1]);
    grad.addColorStop(.82, colors[2]);
    g.fillStyle = grad;
    g.fill();
    // Dark border band along the edge, with pale spots in it.
    g.save();
    shape(); g.clip();
    g.lineWidth = 16; g.strokeStyle = '#1e0b1c';
    shape(); g.stroke();
    // Veins radiating from the body.
    g.lineWidth = 2.2; g.strokeStyle = '#2a0f22';
    for (const [x, y] of spots.veins) { g.beginPath(); g.moveTo(3, 2); g.quadraticCurveTo(x * .5, y * .4, x, y); g.stroke(); }
    g.fillStyle = '#fff4dc';
    for (const [x, y, r] of spots.dots) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    if (eye) {
      const [x, y] = eye;
      for (const [r, c] of [[12, '#1e0b1c'], [9, '#ffc23a'], [5.5, '#1aa6a0'], [2.2, '#ffffff']]) {
        g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();
    g.lineWidth = 2.5; g.strokeStyle = '#140612';
    shape(); g.stroke();
  }
  const UP_SPOTS = {
    veins: [[60, -62], [92, -58], [108, -36], [96, -12], [60, -2]],
    dots: [[44, -64, 3], [70, -74, 3.4], [96, -70, 3.2], [114, -48, 3], [112, -26, 2.6], [92, -8, 2.4]]
  };
  const LO_SPOTS = {
    veins: [[70, 18], [86, 46], [70, 74], [40, 66]],
    dots: [[84, 32, 2.8], [88, 56, 3], [72, 80, 3], [48, 80, 2.6]]
  };

  function butterfly(x, y, scale, flap, tilt, colors) {
    g.save();
    g.translate(x, y);
    g.rotate(tilt);
    g.scale(scale, scale);
    // Wings fold toward the body as |cos| shrinks; each side is mirrored.
    for (const side of [-1, 1]) {
      g.save();
      g.scale(side * flap, 1);
      wing(lowerWing, colors.lower, LO_SPOTS, [54, 44]);
      wing(upperWing, colors.upper, UP_SPOTS, null);
      g.restore();
    }
    // Body, head and antennae.
    g.fillStyle = '#24101e';
    g.beginPath(); g.ellipse(0, 10, 6, 44, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a1830';
    for (let k = -20; k < 46; k += 9) { g.beginPath(); g.ellipse(0, k, 5, 2.5, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#24101e';
    g.beginPath(); g.arc(0, -38, 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#24101e'; g.lineWidth = 2.4;
    for (const side of [-1, 1]) {
      g.beginPath(); g.moveTo(side * 3, -44); g.quadraticCurveTo(side * 10, -78, side * 26, -88); g.stroke();
      g.beginPath(); g.arc(side * 26, -88, 4, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  const BIG = { upper: ['#7a1a5c', '#e3408a', '#ff9a3c'], lower: ['#7a1a5c', '#d8357f', '#ffb84a'] };
  const SMALL = { upper: ['#0f5a6a', '#1aa6a0', '#7fe0d0'], lower: ['#0f5a6a', '#20958f', '#a8f0e2'] };

  // ---------- Flowers ----------
  const FLOWERS = [[70, 330, 52, '#f2548f'], [150, 342, 40, '#ffb547'], [330, 338, 46, '#c7366f'], [410, 330, 56, '#ff7aa8'], [240, 350, 30, '#f29424']];
  function flower(x, base, h, color, t, i) {
    const sway = Math.sin(t * 1.3 + i) * 6;
    const tx = x + sway, ty = base - h;
    g.strokeStyle = '#2f7a3a'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x, base + 20); g.quadraticCurveTo(x + sway * .3, base - h * .5, tx, ty); g.stroke();
    g.fillStyle = '#3f9a48';
    g.beginPath(); g.ellipse(x + sway * .25 + 10, base - h * .35, 12, 5, -.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x + sway * .2 - 10, base - h * .2, 11, 4.5, .5, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2 + t * .3;
      g.fillStyle = color;
      g.beginPath(); g.ellipse(tx + Math.cos(a) * 13, ty + Math.sin(a) * 9, 10, 6, a, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#5a2a0a'; g.beginPath(); g.arc(tx, ty, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffc23a'; g.beginPath(); g.arc(tx - 1.5, ty - 1.5, 4, 0, Math.PI * 2); g.fill();
  }

  // ---------- Pollen sparkles ----------
  const pollen = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 2 + Math.random() * 2.5, v: 8 + Math.random() * 14, p: Math.random() * 6 }));

  function drawScene(t) {
    g.clearRect(0, 0, W, H);
    for (const p of pollen) {
      p.y -= p.v / 20; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      g.fillStyle = Math.sin(t * 3 + p.p) > 0 ? '#ffc23a' : '#ff7aa8';
      g.beginPath(); g.arc(p.x + Math.sin(t + p.p) * 6, p.y, p.s, 0, Math.PI * 2); g.fill();
    }
    FLOWERS.forEach(([x, b, h, c], i) => flower(x, b, h, c, t, i));
    // Small teal butterfly circling.
    const sa = t * .9;
    butterfly(240 + Math.cos(sa) * 170, 120 + Math.sin(sa * 2) * 40, .38, .25 + .75 * Math.abs(Math.cos(t * 7)), Math.cos(sa) * .3, SMALL);
    // Main butterfly drifting in a gentle figure eight.
    const x = 240 + Math.sin(t * .6) * 55, y = 160 + Math.sin(t * 1.2) * 22;
    butterfly(x, y, .95, .22 + .78 * Math.abs(Math.cos(t * 3.2)), Math.sin(t * .6) * .12, BIG);
    return [x, y];
  }

  let last = 0;
  function frame(ms) {
    const t = ms / 1000;
    if (ms - last >= 1000 / 20) {
      last = ms;
      const [x, y] = drawScene(t);
      ascii.render();
      // A short caption now and then, drawn in characters.
      if (Math.sin(t * .5) > .6) ascii.textBox(x, y - 70, 'flutter by!', { lift: 2, placed: [] });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
