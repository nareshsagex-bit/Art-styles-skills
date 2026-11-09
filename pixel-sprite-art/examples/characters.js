/*
 * Three original example characters for sprite-kit.js.
 * Copy one, then change the palette, torso map, hair and gear to make your own.
 */
(function (root) {
  // Ninja: teal jacket with a black upper band and zipper, red scarf, white spiky hair.
  const KAZE = {
    name: 'Kaze',
    skin: '#f6c9a0', skinS: '#d29574', hair: '#eef2f6', hairS: '#aab6c4', style: 'spiky', eye: '#3fae8f',
    torso: ['kkkkkkkk', 'kkkkkzkk', 'kTtttZtk', 'kTttttzt', 'kTttttzt', 'kTtttZtk', 'kkkkkzkk', 'kkkkkkkk', 'TTtttttt'],
    pal: { k: '#26242f', t: '#2a9d8f', T: '#1e7268', z: '#aab4c0', Z: '#e9eef3' },
    sleeve: '#2a2833', sleeveS: '#1a1922', pants: '#2a9d8f', pantsS: '#1e7268', legBand: '#f4f1ea', cuff: '#23877b',
    shoes: '#22212b', toes: true, band: '#1f1f2b', longTails: true,
    marks: [[3, 1, '#c97c5c']],
    gear({ g, px, shX, shY, t }) {
      const w = Math.sin(t * 11) > 0 ? 1 : 0;
      px(g, '#d33a3a', shX - 3, shY - 1, 7, 2);
      px(g, '#a8262b', shX - 3, shY, 2, 1);
      px(g, '#d33a3a', shX - 6, shY + w, 3, 2);
      px(g, '#d33a3a', shX - 9, shY + 1 - w, 3, 1);
    }
  };

  // Swordswoman: white shirt, red sash with a bow, black trousers, ponytail, sword on her back.
  const RIN = {
    name: 'Rin',
    skin: '#f4d6b8', skinS: '#caa182', hair: '#2b2236', hairS: '#17121f', style: 'ponytail', eye: '#7a3b2e', band: '#c0392b', plate: null,
    torso: ['Wwwwwsww', 'Wwwwsssw', 'Wwwwwssw', 'Wwwwwwsw', 'Wwwwwwww', 'rRrRrRrR', 'RrRrRrRr', 'nnnnnnnn', 'Nnnnnnnn'],
    pal: { w: '#f1f2f5', W: '#c6cad4', s: '#f4d6b8', r: '#d0453a', R: '#9c2a24', n: '#2a2830', N: '#18171d' },
    sleeve: '#f1f2f5', sleeveS: '#c6cad4', wrap: '#2a2830', pants: '#2a2830', pantsS: '#18171d',
    shoes: '#1f1d24', toes: true,
    backGear({ g, px, line, shX, shY, hipX, hipY }) {
      line(g, '#3a2f3a', shX - 3, shY + 1, hipX - 8, hipY + 4, 2);
      line(g, '#d9dbe4', shX - 3, shY + 1, shX - 1, shY - 4, 1);
      px(g, '#c9a24a', shX - 4, shY, 3, 1);
    },
    gear({ g, px, hipX, hipY, t }) {
      const w = Math.sin(t * 9) > 0 ? 1 : 0;
      px(g, '#d0453a', hipX - 6, hipY - 4, 2, 2);
      px(g, '#9c2a24', hipX - 7 - w, hipY - 2, 1, 3);
      px(g, '#d0453a', hipX - 5, hipY - 2, 1, 3);
    }
  };

  // Monk: saffron robe with a brown belt, bald head with a soft shine, prayer beads.
  const TOMO = {
    name: 'Tomo',
    skin: '#d9a57a', skinS: '#b07c58', hair: '#d9a57a', hairS: '#b07c58', style: 'bald', eye: '#3a2a20',
    torso: ['oooooOoo', 'ooooOOoo', 'OoooOooo', 'Oooooooo', 'Oooooooo', 'bbbbbbbb', 'Oooooooo', 'Oooooooo', 'OOoooooo'],
    pal: { o: '#f2a33a', O: '#c97a1c', b: '#6b4426' },
    sleeve: '#f2a33a', sleeveS: '#c97a1c', pants: '#f2a33a', pantsS: '#c97a1c', shoes: '#6b4426', toes: true,
    marks: [[-2, -3, '#7a3b2e'], [-1, -3, '#7a3b2e'], [-2, -2, '#7a3b2e'], [-1, -2, '#7a3b2e']],
    gear({ g, px, shX, shY }) {
      for (let i = 0; i < 4; i++) px(g, i % 2 ? '#7a2e2e' : '#a8463e', shX - 1 + i, shY + 1 + (i % 2), 1, 1);
    }
  };

  root.EXAMPLE_CHARACTERS = { KAZE, RIN, TOMO };
})(typeof window !== 'undefined' ? window : globalThis);
