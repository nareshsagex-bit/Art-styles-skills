/*
 * ascii-renderer.js: turn any live <canvas> drawing into dense, colour-shaded ASCII art.
 * No dependencies. Draw your scene (shapes, gradients, sprites) onto a source canvas,
 * and this paints it as tinted text characters onto an output canvas every frame.
 *
 *   const ascii = AsciiRenderer.create({ source, output, cols: 170, theme: 'light' });
 *   function frame() { drawMyScene(); ascii.render(); ascii.textBox(...); requestAnimationFrame(frame); }
 *
 * Empty source pixels (transparent, or pure white when skipWhite is true) become background.
 */
(function (root) {
  'use strict';

  const FONT = '"Cascadia Mono", Consolas, "Courier New", monospace';
  // Character ramp from least ink to most ink.
  const RAMP = ' .,:;-=+*xo%#@';
  const BAYER = [[0, .5], [.75, .25]];

  // Gradient maps, ordered from least ink to most ink.
  const THEMES = {
    // Ink on white paper: light tint -> deep tone.
    light: {
      background: '#ffffff', speck: '#f6d3e2',
      warm: ['#ffd6e6', '#ffb0cb', '#f783ab', '#e3558c', '#c7366f', '#a02358', '#741645', '#4a0d30', '#2a061c'],
      cool: ['#c8f2ec', '#94e3d8', '#5ecbbd', '#2fae9f', '#1a8f84', '#127068', '#0d5250', '#0a3a3c', '#06242a'],
      gold: ['#ffe9b8', '#ffd27a', '#ffb547', '#f29424', '#d97316', '#b5560f', '#8a3e0c', '#5e2a0a', '#3a1906'],
      box: { fill: '#ffffff', edge: '#c7366f', text: '#2a061c', shoutFill: '#c7366f', shoutEdge: '#ffd6e6', shoutText: '#ffffff' }
    },
    // Light on a dark screen: deep tone -> glowing highlight (the "dithered poster" look).
    dark: {
      background: '#12081a', speck: '#2b1336',
      warm: ['#3b0d3e', '#62154f', '#8e2160', '#bb3473', '#e3558c', '#ff84ab', '#ffbfd5', '#ffe3ee', '#fff0f6'],
      cool: ['#0d3341', '#115060', '#167273', '#20998f', '#36c0b3', '#76e0d3', '#a8efe5', '#c0f6ee', '#f2fffc'],
      gold: ['#4a2410', '#7a3a14', '#a8561a', '#d27a22', '#f2a03a', '#ffc766', '#ffd894', '#ffe3a6', '#fff7e6'],
      box: { fill: '#1d0b25', edge: '#e3558c', text: '#fff0f6', shoutFill: '#bb3473', shoutEdge: '#ffbfd5', shoutText: '#ffffff' }
    }
  };

  function hueOf(R, G, B, mx, mn) {
    if (mx === mn) return 0;
    let h;
    if (mx === R) h = 60 * (((G - B) / (mx - mn)) % 6);
    else if (mx === G) h = 60 * ((B - R) / (mx - mn) + 2);
    else h = 60 * ((R - G) / (mx - mn) + 4);
    return h < 0 ? h + 360 : h;
  }

  /*
   * options:
   *   source     canvas to read (required)
   *   output     canvas to draw text on (required); it is sized to the window
   *   cols       text columns across the source (default 170); rows follow the aspect ratio
   *   size       fraction of the window the art fills (default .5)
   *   theme      'light' (white background) or 'dark', or a custom theme object like THEMES.light
   *   skipWhite  treat pure white source pixels as empty (default true)
   *   specks     faint drifting background specks (default true)
   *   coolScale  ink multiplier for teal areas, < 1 keeps foliage/grass light (default .8)
   */
  function create(opt) {
    const src = opt.source, out = opt.output;
    const sctx = src.getContext('2d', { willReadFrequently: true });
    const g = out.getContext('2d');
    const cols = opt.cols || 170, size = opt.size || .5;
    const theme = typeof opt.theme === 'object' ? opt.theme : THEMES[opt.theme || 'light'];
    const light = theme === THEMES.light || theme.background === '#ffffff';
    const skipWhite = opt.skipWhite !== false, specks = opt.specks !== false;
    const coolScale = opt.coolScale ?? .8;
    let rows = 0, fs = 10, cw = 6, ch = 10, ox = 0, oy = 0, ratio = .55, frameNo = 0;

    function fit() {
      const dpr = devicePixelRatio || 1;
      out.width = Math.round(out.clientWidth * dpr || innerWidth * dpr);
      out.height = Math.round(out.clientHeight * dpr || innerHeight * dpr);
      g.font = `700 100px ${FONT}`;
      ratio = g.measureText('M').width / 100;
      rows = Math.round(src.height / (src.width / cols / ratio));
      fs = Math.min(out.width * size / (cols * ratio), out.height * size / rows);
      cw = fs * ratio; ch = fs;
      ox = Math.round((out.width - cols * cw) / 2);
      oy = Math.round((out.height - rows * ch) / 2);
    }
    fit();
    addEventListener('resize', fit);
    if (document.fonts) document.fonts.ready.then(fit);

    const hash = (a, b) => ((Math.imul(a * 73856093 ^ b * 19349663, 2654435761) >>> 0) % 1000) / 1000;

    function render() {
      const dpr = devicePixelRatio || 1;
      if (out.width !== Math.round(out.clientWidth * dpr) || out.height !== Math.round(out.clientHeight * dpr)) fit();
      frameNo++;
      const W = src.width, H = src.height, data = sctx.getImageData(0, 0, W, H).data;
      const batches = new Map();
      const add = (col, c, r, glyph) => { let b = batches.get(col); if (!b) batches.set(col, b = []); b.push(c, r, glyph); };
      const sx = W / cols, sy = H / rows;
      for (let r = 0; r < rows; r++) {
        const y0 = Math.floor(r * sy), y1 = Math.max(y0 + 1, Math.floor((r + 1) * sy));
        for (let c = 0; c < cols; c++) {
          const x0 = Math.floor(c * sx), x1 = Math.max(x0 + 1, Math.floor((c + 1) * sx));
          let R = 0, G = 0, B = 0, n = 0, tot = 0;
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
            const i = (y * W + x) * 4;
            tot++;
            if (data[i + 3] < 128) continue;
            if (skipWhite && data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) continue;
            R += data[i]; G += data[i + 1]; B += data[i + 2]; n++;
          }
          if (n < tot * .35) {
            if (specks && hash(c + (frameNo >> 4), r) < .04) add(theme.speck, c, r, hash(c, r) < .5 ? '.' : ':');
            continue;
          }
          R /= n; G /= n; B /= n;
          const mx = Math.max(R, G, B), mn = Math.min(R, G, B), sat = mx ? (mx - mn) / mx : 0;
          const lum = (.299 * R + .587 * G + .114 * B) / 255;
          // Ink amount: darkness (white theme) or brightness (dark theme), lifted in the
          // mid tones, plus extra for saturated colours so the subject is the focus.
          const base = light ? 1 - lum : lum;
          let ink = light
            ? Math.pow(base, .9) * .75 + sat * .2 + .1   // vivid colours land in the middle steps and keep their hue
            : Math.pow(base, 1.3) * .88 + sat * .42;
          ink = (ink - .5) * (light ? 1.1 : 1.25) + .5;
          ink = Math.min(1, Math.max(0, ink + (BAYER[r & 1][c & 1] - .375) * .14));
          const hue = hueOf(R, G, B, mx, mn);
          const pal = sat > .18 && hue >= 75 && hue < 265 ? theme.cool : sat > .4 && hue >= 18 && hue < 75 ? theme.gold : theme.warm;
          if (pal === theme.cool) ink *= coolScale;
          const k = Math.max(1, Math.round(ink * (pal.length - 1)));
          add(pal[k], c, r, RAMP[1 + Math.round(ink * (RAMP.length - 2))]);
        }
      }
      g.fillStyle = theme.background;
      g.fillRect(0, 0, out.width, out.height);
      g.font = `700 ${fs}px ${FONT}`;
      g.textBaseline = 'top';
      for (const [col, b] of batches) {
        g.fillStyle = col;
        for (let i = 0; i < b.length; i += 3) g.fillText(b[i + 2], ox + b[i] * cw, oy + b[i + 1] * ch);
      }
    }

    // Source pixel -> text cell (column, row).
    const toCell = (x, y) => [x / (src.width / cols), y / (src.height / rows)];

    function textAt(c, r, s, col) {
      g.font = `700 ${fs}px ${FONT}`;
      g.textBaseline = 'top';
      g.fillStyle = col;
      for (let i = 0; i < s.length; i++) if (s[i] !== ' ') g.fillText(s[i], ox + (c + i) * cw, oy + r * ch);
    }

    /*
     * A speech or caption box drawn in text characters, placed above (x, y) in source pixels.
     * Pass the same `placed` array for all boxes in a frame and they will never overlap.
     */
    function textBox(x, y, text, { shout = false, lift = 5, placed = [] } = {}) {
      const [sc, sr] = toCell(x, y);
      const label = ` ${text.toUpperCase()} `, w = label.length + 2, h = 3;
      let bc = Math.round(Math.max(1, Math.min(cols - w - 1, sc - w / 2)));
      let br = Math.round(sr - lift - h);
      const hit = () => placed.find(p => bc < p.c + p.w + 1 && bc + w + 1 > p.c && br < p.r + p.h + 1 && br + h + 1 > p.r);
      let p = hit();
      if (p) {
        bc = Math.round(Math.max(1, Math.min(cols - w - 1, sc < p.sc ? p.c - w - 1 : p.c + p.w + 1)));
        for (let k = 0; (p = hit()) && k < 4; k++) br = p.r - h - 1;
      }
      br = Math.max(0, br);
      placed.push({ c: bc, r: br, w, h, sc });
      const s = theme.box;
      g.fillStyle = shout ? s.shoutFill : s.fill;
      g.fillRect(ox + bc * cw, oy + br * ch, w * cw, h * ch);
      const edge = shout ? s.shoutEdge : s.edge, bar = (shout ? '=' : '-').repeat(w - 2), corner = shout ? '*' : '+';
      textAt(bc, br, corner + bar + corner, edge);
      textAt(bc, br + 1, shout ? '!' : '|', edge);
      textAt(bc + 1, br + 1, label, shout ? s.shoutText : s.text);
      textAt(bc + w - 1, br + 1, shout ? '!' : '|', edge);
      textAt(bc, br + 2, corner + bar + corner, edge);
      const tc = Math.max(bc + 2, Math.min(bc + w - 3, Math.round(sc)));
      textAt(tc, br + 3, tc >= sc ? '/' : '\\', edge);
    }

    // Large title or impact word, centred on (x, y) in source pixels.
    function bigText(x, y, text, { scale = 2.4, fill, stroke } = {}) {
      const [c, r] = toCell(x, y);
      g.font = `700 ${fs * scale}px ${FONT}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = Math.max(2, fs * .35);
      g.strokeStyle = stroke || theme.background;
      g.strokeText(text, ox + c * cw, oy + r * ch);
      g.fillStyle = fill || theme.warm[5];
      g.fillText(text, ox + c * cw, oy + r * ch);
      g.textAlign = 'left'; g.textBaseline = 'top';
    }

    return { render, textBox, bigText, textAt, toCell, fit, get rows() { return rows; }, cols };
  }

  root.AsciiRenderer = { create, THEMES, RAMP };
})(typeof window !== 'undefined' ? window : globalThis);
