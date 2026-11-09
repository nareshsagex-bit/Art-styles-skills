/*
 * sprite-kit.js: draw chibi pixel-art characters entirely from code.
 * No image files. Works in any browser, no dependencies.
 *
 *   const kit = PixelSprite.create();
 *   kit.drawChar(ctx, spec, 'idle', timeSeconds, feetX, feetY, face);
 *
 * Draw into a small native-resolution canvas (for example 320x180) and scale it
 * up with imageSmoothingEnabled = false. A character is about 30 px tall.
 */
(function (root) {
  'use strict';

  // Sprite canvas size and the feet origin inside it.
  const CW = 44, CH = 52, OX = 22, OY = 48;
  const OUTLINE = '#1b1724';

  const mk = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return [c, g];
  };
  // Every draw call snaps to whole pixels. Never rotate or scale while drawing a sprite.
  const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  // A limb is a line of stamped t x t squares, which keeps edges hard (no anti-aliasing).
  function line(g, c, x0, y0, x1, y1, t = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    const o = Math.floor(t / 2);
    g.fillStyle = c;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n) - o, Math.round(y0 + (y1 - y0) * i / n) - o, t, t);
  }

  /*
   * Poses. All values are pixel offsets for a character facing RIGHT.
   *   lf / lb : front / back foot as [dx from hip, lift off the ground]
   *   af / ab : front / back hand as [dx, dy] from the shoulder
   *   lean    : shoulders shift forward (+) or back (-)
   *   crouch  : hips drop by this many pixels
   */
  const POSES = {
    idle: t => ({ crouch: Math.sin(t * 5) > 0 ? 1 : 0, lf: [3, 0], lb: [-3, 0], af: [5, 2], ab: [3, 4] }),
    run: t => {
      const s = Math.sin(t * 15), c = Math.cos(t * 15);
      return { lean: 3, crouch: 1, lf: [Math.round(s * 5) + 1, Math.max(0, c) * 3], lb: [Math.round(-s * 5) + 1, Math.max(0, -c) * 3], af: [-6, 3], ab: [-7, 1] };
    },
    dash: t => {
      const s = Math.sin(t * 20), c = Math.cos(t * 20);
      return { lean: 4, crouch: 2, lf: [Math.round(s * 6) + 1, Math.max(0, c) * 3], lb: [Math.round(-s * 6) + 1, Math.max(0, -c) * 3], af: [8, 3], ab: [-7, 1] };
    },
    punch: () => ({ lean: 2, crouch: 1, lf: [5, 0], lb: [-4, 0], af: [9, 0], ab: [0, 5] }),
    punch2: () => ({ lean: 2, crouch: 1, lf: [4, 0], lb: [-4, 0], af: [-1, 5], ab: [10, 1] }),
    kick: () => ({ lean: -2, lf: [9, 7], lb: [-1, 0], af: [-4, 2], ab: [3, 1] }),
    jump: () => ({ lf: [3, 4], lb: [-3, 6], af: [4, -4], ab: [-5, 0] }),
    throw: () => ({ lean: 1, lf: [4, 2], lb: [-4, 3], af: [8, -3], ab: [-4, 4] }),
    charge: () => ({ crouch: 2, lean: 1, lf: [6, 0], lb: [-5, 0], af: [8, 4], ab: [6, 6] }),
    hurt: () => ({ lean: -3, crouch: 1, lf: [5, 1], lb: [-2, 0], af: [-5, -3], ab: [-6, 0] }),
    watch: t => ({ crouch: Math.sin(t * 3) > .7 ? 1 : 0, lf: [2, 0], lb: [-2, 0], af: [3, 4], ab: [4, 3] }),
    cheer: () => ({ lf: [2, 0], lb: [-2, 0], af: [2, -9], ab: [-2, -8] }),
    wave: t => ({ lf: [2, 0], lb: [-2, 0], af: [Math.sin(t * 10) > 0 ? 3 : 1, -9], ab: [3, 4] })
  };

  /*
   * Hair styles. hx, hy is the centre of the head; the face spans hx-4..hx+3, hy-4..hy+3.
   *   back  : drawn before the face (masses behind the head)
   *   front : drawn over the top of the head
   *   post  : drawn last, after the headband (bangs that hang over it)
   */
  const HAIR = {
    spiky: {
      back(g, c, hx, hy) {
        px(g, c.hairS, hx - 7, hy - 6, 3, 4); px(g, c.hairS, hx - 9, hy - 7, 2, 2);
        px(g, c.hairS, hx - 8, hy - 2, 3, 2); px(g, c.hairS, hx - 10, hy - 3, 2, 1);
      },
      front(g, c, hx, hy) {
        px(g, c.hair, hx - 5, hy - 8, 10, 4); px(g, c.hair, hx - 6, hy - 6, 2, 5);
        for (const [ox, h] of [[-6, 3], [-3, 4], [0, 3], [3, 2]]) {
          for (let k = 0; k < h; k++) px(g, c.hair, hx + ox + Math.min(k, 1), hy - 9 - k, Math.max(1, 3 - k), 1);
        }
        px(g, c.hair, hx + 5, hy - 7, 2, 1); px(g, c.hair, hx + 6, hy - 8, 1, 1);
        px(g, c.hairS, hx - 5, hy - 5, 10, 1);
      },
      post(g, c, hx, hy) { px(g, c.hair, hx + 1, hy - 2, 1, 1); px(g, c.hair, hx + 3, hy - 2, 1, 1); }
    },
    swept: {
      back(g, c, hx, hy) {
        px(g, c.hairS, hx - 8, hy - 8, 5, 7); px(g, c.hairS, hx - 11, hy - 9, 4, 3); px(g, c.hairS, hx - 13, hy - 10, 2, 2);
        px(g, c.hairS, hx - 11, hy - 5, 4, 3); px(g, c.hairS, hx - 13, hy - 4, 2, 2); px(g, c.hair, hx - 9, hy - 8, 3, 2);
      },
      front(g, c, hx, hy) {
        px(g, c.hair, hx - 5, hy - 8, 9, 4); px(g, c.hair, hx - 6, hy - 7, 2, 6);
        px(g, c.hairHi || c.hair, hx - 3, hy - 7, 4, 1);
      },
      post(g, c, hx, hy) { px(g, c.hair, hx + 3, hy - 5, 2, 7); px(g, c.hair, hx + 2, hy - 4, 1, 3); px(g, c.hair, hx - 1, hy - 4, 2, 2); }
    },
    short: {
      front(g, c, hx, hy) { px(g, c.hair, hx - 5, hy - 8, 10, 3); px(g, c.hair, hx - 5, hy - 6, 2, 4); px(g, c.hairS, hx - 5, hy - 6, 9, 1); }
    },
    long: { back(g, c, hx, hy) { px(g, c.hairS, hx - 6, hy - 5, 3, 11); } },
    bald: {
      front(g, c, hx, hy) {
        px(g, c.skin, hx - 3, hy - 5, 7, 1);
        px(g, c.skinS, hx - 3, hy - 5, 2, 1);
        px(g, '#fff3e0', hx, hy - 4, 2, 1);
      }
    },
    bun: { back(g, c, hx, hy) { px(g, c.hairS, hx - 8, hy - 10, 4, 4); px(g, c.hair, hx - 7, hy - 10, 2, 1); } },
    ponytail: {
      back(g, c, hx, hy, t) {
        const w = Math.sin(t * 8) > 0 ? 1 : 0;
        px(g, c.hairS, hx - 7, hy - 7, 3, 3);
        px(g, c.hairS, hx - 9 - w, hy - 5, 3, 4);
        px(g, c.hairS, hx - 10 - w, hy - 1, 2, 6);
        px(g, c.band || c.hairS, hx - 7, hy - 6, 1, 2);
      }
    }
  };
  HAIR.long.front = HAIR.bun.front = HAIR.ponytail.front = HAIR.short.front;
  HAIR.ponytail.post = (g, c, hx, hy) => { px(g, c.hair, hx + 2, hy - 4, 3, 1); px(g, c.hair, hx + 3, hy - 3, 2, 2); };

  function create() {
    const [cc, cg] = mk(CW, CH); // sprite
    const [oc, og] = mk(CW, CH); // silhouette used for the outline

    /*
     * Draw one character. Returns the screen position of its front hand,
     * which is where you attach weapons and energy effects.
     *   g     : destination context (native-resolution canvas)
     *   c     : character spec (see references/character-spec.md)
     *   pose  : a key of POSES
     *   t     : time in seconds, drives idle bob, run cycle, cloth flutter
     *   sx,sy : feet position on the destination canvas
     *   face  : 1 faces right, -1 faces left (mirrored)
     *   opt   : { white: hit flash, talk: open mouth, eye: override eye colour }
     */
    function drawChar(g, c, pose, t, sx, sy, face = 1, opt = {}) {
      cg.clearRect(0, 0, CW, CH);
      const p = POSES[pose](t);
      const crouch = p.crouch || 0, lean = p.lean || 0;
      const hipX = OX, hipY = OY - 11 + crouch;
      const shX = hipX + lean, shY = hipY - 8;
      const hook = { g: cg, px, line, shX, shY, hipX, hipY, t };

      const leg = (x, f, back) => {
        const fx = x + f[0], fy = OY - 2 - f[1];
        line(cg, back ? c.pantsS : c.pants, x, hipY + 1, fx, fy - 1, 3);
        if (c.legBand && !back) px(cg, c.legBand, Math.round(x + (fx - x) * .55) - 1, Math.round(hipY + 1 + (fy - hipY - 2) * .55), 3, 1);
        if (c.cuff) px(cg, back ? c.pantsS : c.cuff, fx - 1, fy - 2, 3, 1);
        px(cg, c.shoes, fx - 1, fy, 4, 2);
        if (c.toes) px(cg, back ? c.skinS : c.skin, fx + 2, fy + 1, 1, 1);
      };
      const arm = (x, y, h, back) => {
        const hx = x + h[0], hy = y + h[1];
        line(cg, back ? c.sleeveS : c.sleeve, x, y, hx, hy, 2);
        if (c.wrap) line(cg, back ? c.sleeveS : c.wrap, x + h[0] * .6, y + h[1] * .6, x + h[0] * .8, y + h[1] * .8, 2);
        px(cg, back ? c.skinS : c.skin, hx - 1, hy - 1, 2, 2);
        return [hx, hy];
      };

      // Paint order, back to front: gear behind the body, back arm, legs, torso, head, front arm.
      c.backGear && c.backGear(hook);
      arm(shX - 2, shY + 1, p.ab, true);
      leg(hipX - 1, p.lb, true);
      leg(hipX + 1, p.lf, false);
      for (let r = 0; r < 9; r++) {
        const cx = Math.round(shX + (hipX - shX) * r / 8);
        if (c.torso) {
          const row = c.torso[r];
          for (let i = 0; i < 8; i++) if (row[i] !== ' ') px(cg, c.pal[row[i]], cx - 4 + i, shY + r);
        } else {
          px(cg, c.top, cx - 4, shY + r, 8, 1);
          px(cg, c.topS, cx - 4, shY + r, 2, 1);
          if (c.vest && (r === 4 || r === 6)) px(cg, c.topS, cx, shY + r, 3, 1);
        }
      }
      if (c.collar) px(cg, c.collar, shX - 2, shY - 1, 5, 2);
      c.gear && c.gear(hook);

      const hx = shX + 1, hy = shY - 5;
      const hs = HAIR[c.style] || HAIR.short;
      hs.back && hs.back(cg, c, hx, hy, t);
      px(cg, c.skin, hx - 4, hy - 4, 8, 8);
      px(cg, c.skin, hx - 3, hy + 4, 6, 1);
      px(cg, c.skinS, hx - 4, hy - 4, 2, 8);
      px(cg, c.skinS, hx - 2, hy, 1, 2);
      const eye = opt.eye || c.eye;
      if (eye) {
        px(cg, '#ffffff', hx + 1, hy - 1, 2, 2);
        px(cg, eye, hx + 2, hy - 1, 1, 2);
        px(cg, OUTLINE, hx + 1, hy - 2, 3, 1);
        px(cg, OUTLINE, hx - 1, hy - 1, 1, 2);
      } else {
        px(cg, OUTLINE, hx + 2, hy - 1, 1, 2);
        px(cg, OUTLINE, hx - 1, hy - 1, 1, 2);
      }
      for (const [dx, dy, col] of c.marks || []) px(cg, col, hx + dx, hy + dy);
      if (c.mask) px(cg, c.mask, hx - 4, hy + 1, 8, 4);
      else if (opt.talk) { px(cg, '#5a1f24', hx + 1, hy + 2, 2, 2); px(cg, '#d0606a', hx + 1, hy + 3); }
      else px(cg, c.skinS, hx + 1, hy + 2, 2, 1);
      hs.front(cg, c, hx, hy, t);
      if (c.band) {
        px(cg, c.band, hx - 5, hy - 4, 10, 2);
        if (c.plate !== null) {
          px(cg, c.plate || '#d4dce4', hx, hy - 4, 4, 2);
          px(cg, '#8a96a2', hx, hy - 3, 4, 1);
          px(cg, '#5b6672', hx + 1, hy - 4, 2, 1);
        }
        const segs = c.longTails ? 4 : 2;
        for (let k = 0; k < segs; k++) {
          const w = Math.round(Math.sin(t * 10 - k * 1.1) * (k * .5 + .5));
          px(cg, c.band, hx - 7 - k * 2, hy - 4 + k + w, 2, c.longTails ? 2 : 1);
        }
      }
      hs.post && hs.post(cg, c, hx, hy, t);
      const hand = arm(shX + 2, shY + 1, p.af, false);

      // Outline: tint a copy of the sprite dark and stamp it 1 px in four directions behind the sprite.
      og.clearRect(0, 0, CW, CH);
      og.drawImage(cc, 0, 0);
      og.globalCompositeOperation = 'source-in';
      og.fillStyle = OUTLINE;
      og.fillRect(0, 0, CW, CH);
      og.globalCompositeOperation = 'source-over';
      g.save();
      g.translate(Math.round(sx), Math.round(sy));
      if (face < 0) g.scale(-1, 1);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.drawImage(oc, dx - OX, dy - OY);
      g.drawImage(cc, -OX, -OY);
      if (opt.white) {
        og.globalCompositeOperation = 'source-in';
        og.fillStyle = '#ffffff';
        og.fillRect(0, 0, CW, CH);
        og.globalCompositeOperation = 'source-over';
        g.globalAlpha = .75;
        g.drawImage(oc, -OX, -OY);
        g.globalAlpha = 1;
      }
      g.restore();
      return [sx + face * (hand[0] - OX), sy + hand[1] - OY];
    }

    return { drawChar, POSES, HAIR, px, line, size: { w: CW, h: CH, originX: OX, originY: OY } };
  }

  // A varied background extra (crowd member, villager) from an index. Same index, same look.
  function extra(i) {
    const HAIRS = [['#3b2a22', '#24170f'], ['#8c4a2b', '#5e2f1a'], ['#d9d4cb', '#a8a296'], ['#5b3b72', '#3b2550'],
      ['#d36b86', '#a2475f'], ['#2f3d2f', '#1c261c'], ['#b5853f', '#82592a'], ['#1f2433', '#121521']];
    const SKINS = [['#f1c39a', '#cc9472'], ['#d9a57a', '#b07c58'], ['#b07a55', '#875a3c']];
    const STYLES = ['short', 'long', 'bun', 'spiky', 'short', 'ponytail'];
    const h = HAIRS[(i * 5) % HAIRS.length], s = SKINS[(i * 7) % 3];
    const plain = i % 5 === 4;
    return {
      skin: s[0], skinS: s[1], hair: h[0], hairS: h[1], style: STYLES[(i * 7) % STYLES.length],
      top: plain ? ['#a2563e', '#6b5a8e', '#4f8a8a'][i % 3] : '#56713f', topS: plain ? '#00000055' : '#3e5530',
      vest: !plain, collar: plain ? null : '#2c3450',
      sleeve: '#2c3450', sleeveS: '#1f2538', pants: '#2c3450', pantsS: '#1f2538', shoes: '#25304a',
      band: i % 4 === 3 ? null : '#2a3354', mask: i % 6 === 2 ? '#2c3450' : null
    };
  }

  root.PixelSprite = { create, extra, POSES, HAIR };
})(typeof window !== 'undefined' ? window : globalThis);
