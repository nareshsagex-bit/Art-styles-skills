// One watercolour-style butterfly seen from the side: dark indigo wing edges with pale spots,
// pale cyan and lavender insides, dark veins. Drawn on a hidden canvas, shown as colour ASCII.
(() => {
  'use strict';
  // Portrait source, laid out in the reference's coordinates (about 560 x 720) and scaled down.
  const W = 420, H = 470, S = .64;
  const source = document.querySelector('#source');
  source.width = W; source.height = H;
  const g = source.getContext('2d', { willReadFrequently: true });

  // Palette tuned to the reference: lavender to deep indigo, pale cyan to blue.
  const THEME = {
    background: '#ffffff', speck: '#ebe5fa',
    warm: ['#ece6fc', '#d6c9f6', '#b8a3ee', '#987ee0', '#7a5fcc', '#5e45b0', '#47338e', '#31236a', '#1e1646'],
    // Pale cyan in the light steps, shifting to blue-violet and indigo in the dark ones.
    cool: ['#dcf7f9', '#b6eef2', '#8adfe8', '#7cc0e6', '#7b97de', '#6c74cf', '#5853b3', '#3e388e', '#241f5a'],
    gold: ['#efe6fc', '#d9c6f4', '#c0a2ea', '#a07ddc', '#8460c8', '#6748ad', '#4d348c', '#352569', '#211846'],
    box: { fill: '#ffffff', edge: '#5e45b0', text: '#1e1646', shoutFill: '#5e45b0', shoutEdge: '#d6c9f6', shoutText: '#ffffff' }
  };
  const ascii = AsciiRenderer.create({
    source, output: document.querySelector('#ascii'),
    cols: 120, size: .88, theme: THEME, coolScale: .9, specks: false
  });

  const HINGE = [215, 432]; // where the wings meet the body
  const INDIGO = '#231a55', VEIN = '#2f2568', SPOT = '#d8cff4';

  // ---------- Wing shapes (reference coordinates) ----------
  const backUpper = () => {
    g.beginPath();
    g.moveTo(200, 430);
    g.bezierCurveTo(140, 330, 112, 170, 128, 62);
    g.bezierCurveTo(138, 22, 178, 22, 216, 58);
    g.bezierCurveTo(258, 92, 292, 112, 304, 132);
    g.lineTo(240, 420);
    g.closePath();
  };
  const frontUpper = () => {
    g.beginPath();
    g.moveTo(214, 432);
    g.bezierCurveTo(228, 300, 258, 182, 330, 110);
    g.bezierCurveTo(382, 42, 452, 2, 492, 32);
    g.bezierCurveTo(542, 72, 546, 252, 520, 332);
    g.bezierCurveTo(482, 422, 330, 442, 214, 432);
    g.closePath();
  };
  const frontLower = () => {
    g.beginPath();
    g.moveTo(220, 442);
    g.bezierCurveTo(330, 420, 440, 430, 500, 482);
    g.bezierCurveTo(560, 542, 542, 652, 502, 692);
    g.bezierCurveTo(462, 722, 362, 642, 300, 582);
    g.bezierCurveTo(250, 542, 226, 492, 220, 442);
    g.closePath();
  };
  const backLower = () => {
    g.beginPath();
    g.moveTo(205, 450);
    g.bezierCurveTo(165, 520, 168, 602, 232, 626);
    g.bezierCurveTo(262, 566, 246, 500, 214, 452);
    g.closePath();
  };

  // A wing: soft watercolour gradient, dark edge wash, veins and pale spots.
  function paintWing(shape, grad, edge, veins, spots) {
    shape();
    g.fillStyle = grad;
    g.fill();
    g.save();
    shape(); g.clip();
    // Dark wash creeping in from the outer edge.
    g.lineWidth = edge.width; g.strokeStyle = INDIGO; g.globalAlpha = .92;
    shape(); g.stroke();
    g.globalAlpha = 1;
    g.lineCap = 'round';
    g.strokeStyle = VEIN; g.lineWidth = 4;
    for (const v of veins) {
      g.beginPath(); g.moveTo(v[0], v[1]);
      if (v.length === 6) g.quadraticCurveTo(v[2], v[3], v[4], v[5]); else g.lineTo(v[2], v[3]);
      g.stroke();
    }
    g.fillStyle = SPOT;
    for (const [x, y, rx, ry, a] of spots) { g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    g.lineWidth = 3; g.strokeStyle = INDIGO;
    shape(); g.stroke();
  }

  function drawButterfly(flap, bob) {
    g.clearRect(0, 0, W, H);
    g.save();
    g.translate(W / 2 - 300 * S + 10, H / 2 - 360 * S + bob);
    g.scale(S, S);

    // Wings flap by narrowing toward the body around the hinge.
    const wings = (fn, k) => {
      g.save();
      g.translate(HINGE[0], HINGE[1]);
      g.scale(k, 1);
      g.translate(-HINGE[0], -HINGE[1]);
      fn();
      g.restore();
    };

    // Back wings (behind the body), darker.
    wings(() => {
      const gb = g.createLinearGradient(150, 420, 220, 40);
      gb.addColorStop(0, '#9a86d8'); gb.addColorStop(.35, '#cfe6f2'); gb.addColorStop(.62, '#a89ae0'); gb.addColorStop(.85, '#3b2e7c'); gb.addColorStop(1, INDIGO);
      paintWing(backUpper, gb, { width: 40 },
        [[205, 420, 160, 250, 150, 110], [215, 415, 200, 250, 220, 100], [225, 410, 250, 280, 280, 140]],
        [[150, 90, 9, 14, -.3], [180, 60, 7, 11], [210, 78, 6, 10], [238, 104, 6, 9]]);
      const gl = g.createLinearGradient(200, 450, 230, 620);
      gl.addColorStop(0, '#5e45b0'); gl.addColorStop(1, INDIGO);
      backLower(); g.fillStyle = gl; g.fill();
    }, flap * .85);

    // Front lower wing.
    wings(() => {
      const gr = g.createRadialGradient(240, 470, 10, 330, 520, 270);
      gr.addColorStop(0, '#8a6fd8'); gr.addColorStop(.25, '#b9a8ee'); gr.addColorStop(.5, '#bfeef3'); gr.addColorStop(.72, '#c6b2ef'); gr.addColorStop(.9, '#4a3896'); gr.addColorStop(1, INDIGO);
      paintWing(frontLower, gr, { width: 34 },
        [[225, 448, 360, 455, 480, 500], [228, 455, 350, 500, 470, 580], [230, 462, 330, 540, 430, 650], [232, 470, 290, 540, 340, 610]],
        [[512, 520, 5, 7], [522, 560, 5, 7], [522, 600, 5, 7], [512, 640, 5, 7], [494, 674, 5, 7]]);
    }, flap);

    // Front upper wing: pale cyan near the body, deep indigo toward the top edge, pale spots.
    wings(() => {
      const gu = g.createLinearGradient(260, 430, 470, 40);
      gu.addColorStop(0, '#c9b9f0'); gu.addColorStop(.28, '#c4f1f4'); gu.addColorStop(.5, '#bcd0f3'); gu.addColorStop(.66, '#8f74d2'); gu.addColorStop(.8, '#3a2d7a'); gu.addColorStop(1, INDIGO);
      paintWing(frontUpper, gu, { width: 46 },
        [[220, 425, 300, 300, 360, 160], [222, 428, 340, 320, 430, 210], [225, 430, 380, 360, 490, 300], [228, 432, 360, 400, 500, 360], [240, 380, 300, 240]],
        [[356, 120, 12, 20, .5], [404, 96, 16, 22, .7], [452, 60, 12, 16, .2], [420, 140, 26, 14, -.3], [470, 120, 10, 14], [500, 160, 7, 10], [512, 210, 5, 9], [516, 250, 4, 8], [512, 285, 4, 7]]);
    }, flap);

    // Body, head and clubbed antennae.
    g.fillStyle = INDIGO;
    g.save(); g.translate(205, 520); g.rotate(-.42);
    g.beginPath(); g.ellipse(0, 0, 21, 96, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.beginPath(); g.ellipse(176, 432, 32, 26, -.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(142, 402, 19, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INDIGO; g.lineCap = 'round'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(140, 390); g.quadraticCurveTo(120, 320, 72, 248); g.stroke();
    g.beginPath(); g.moveTo(132, 396); g.quadraticCurveTo(92, 340, 26, 300); g.stroke();
    g.beginPath(); g.ellipse(70, 244, 9, 16, -.6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(24, 298, 9, 15, -1, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  let last = 0;
  function frame(ms) {
    const t = ms / 1000;
    if (ms - last >= 1000 / 20) {
      last = ms;
      // Slow, graceful flap: wings sweep between 45% and 100% width.
      const flap = .45 + .55 * (.5 + .5 * Math.cos(t * 2.6));
      drawButterfly(flap, Math.sin(t * 1.3) * 8);
      ascii.render();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
