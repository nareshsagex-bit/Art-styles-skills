// BattleAudio: an upbeat looping battle theme plus punchy effects, all synthesised with
// Web Audio (no audio files). Browsers only allow sound after a tap/click/key, so call
// BattleAudio.start() from a user gesture.
//
//   BattleAudio.start();
//   BattleAudio.sfx('zap');   // call, throw, open, dash, hit, flameOn, flameOff, charge, zap, whoosh, clash, recall
//   BattleAudio.setEnabled(false);
(function (global) {
  'use strict';
  let ac = null, master = null, music = null, sfxBus = null, noiseBuf = null;
  let enabled = true, timer = null, nextStep = 0, step = 0, flame = null;
  const BPM = 150, SPS = 60 / BPM / 2;   // seconds per 8th-note step

  const F = n => {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (semi + (+m[3] + 1) * 12 - 69) / 12);
  };

  // 4 bars x 8 steps, A minor, driving and heroic. '-' holds, '.' rests.
  const LEAD = [
    'A4', '.', 'C5', 'E5', 'A5', '-', 'G5', 'E5',
    'F5', '-', 'E5', 'D5', 'E5', '-', '-', '.',
    'C5', '.', 'E5', 'G5', 'C6', '-', 'B5', 'G5',
    'A5', 'G5', 'F5', 'E5', 'D5', 'E5', 'G#5', '-'
  ];
  const BASS = ['A2', 'A2', 'F2', 'F2', 'C3', 'C3', 'E2', 'E2'];   // one per half bar
  const STAB = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['E3', 'G#3', 'B3']];

  function init() {
    if (ac) return;
    ac = new (global.AudioContext || global.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = enabled ? .85 : 0; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = .2; music.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = .55; sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(freq, t, dur, { type = 'square', vol = .3, bus = sfxBus, slide = 0, attack = .005, cut = 0 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = o;
    if (cut) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; o.connect(f); node = f; }
    node.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + .02);
  }
  function noise(t, dur, { vol = .2, bus = sfxBus, type = 'highpass', freq = 6000, to = 0, q = .7 } = {}) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random()); s.stop(t + dur + .02);
  }

  // ---------- Music ----------
  function scheduleStep(n, t) {
    const i = n % 32;
    const note = LEAD[i];
    if (note !== '.' && note !== '-') {
      let len = 1; while (LEAD[(i + len) % 32] === '-' && len < 4) len++;
      tone(F(note), t, len * SPS * .95, { type: 'square', vol: .16, bus: music, cut: 3200 });
      tone(F(note) / 2, t, len * SPS * .9, { type: 'triangle', vol: .1, bus: music });
    }
    // Galloping bass on every step.
    const b = BASS[Math.floor(i / 4)];
    tone(F(b) * (i % 2 ? 2 : 1), t, SPS * .8, { type: 'sawtooth', vol: .12, bus: music, cut: 900 });
    // Chord stab on the off-beats.
    if (i % 4 === 2) for (const c of STAB[Math.floor(i / 8)]) tone(F(c), t, SPS * .6, { type: 'square', vol: .045, bus: music, cut: 2200 });
    // Drums: kick on beats, snare on 2 and 4, hats on 8ths.
    if (i % 4 === 0) tone(140, t, .2, { type: 'sine', vol: .6, bus: music, slide: .3 });
    if (i % 8 === 4) { noise(t, .16, { vol: .22, bus: music, type: 'bandpass', freq: 2000, q: .8 }); tone(220, t, .08, { type: 'triangle', vol: .12, bus: music, slide: .5 }); }
    noise(t, .035, { vol: .05, bus: music });
  }
  function pump() {
    while (nextStep < ac.currentTime + .25) { scheduleStep(step, nextStep); step++; nextStep += SPS; }
  }

  // ---------- Effects ----------
  const SFX = {
    call: t => { tone(F('E5'), t, .07, { type: 'square', vol: .12 }); tone(F('A5'), t + .07, .1, { type: 'square', vol: .12 }); },
    throw: t => noise(t, .45, { vol: .25, type: 'bandpass', freq: 600, to: 2400, q: 1.4 }),
    open: t => { tone(320, t, .25, { type: 'sine', vol: .5, slide: 3.2 }); ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(F(n), t + .05 + i * .05, .3, { type: 'sine', vol: .14 })); noise(t, .2, { vol: .2 }); },
    dash: t => noise(t, .35, { vol: .3, type: 'bandpass', freq: 900, to: 5000, q: 2 }),
    hit: t => { tone(180, t, .18, { type: 'square', vol: .45, slide: .3 }); noise(t, .12, { vol: .4, type: 'lowpass', freq: 2500 }); },
    charge: t => { tone(200, t, .8, { type: 'sawtooth', vol: .12, slide: 6, cut: 3000 }); for (let i = 0; i < 6; i++) noise(t + i * .12, .05, { vol: .08, freq: 5000 }); },
    zap: t => {
      noise(t, .9, { vol: .55, type: 'bandpass', freq: 3000, to: 600, q: .6 });
      for (let i = 0; i < 8; i++) tone(800 + Math.random() * 1600, t + i * .04, .05, { type: 'square', vol: .12 });
      tone(90, t + .05, .7, { type: 'sine', vol: .5, slide: .5 });
    },
    whoosh: t => noise(t, .6, { vol: .32, type: 'bandpass', freq: 300, to: 3000, q: 1.6 }),
    clash: t => { tone(70, t, .9, { type: 'sine', vol: .8, slide: .4 }); noise(t, .6, { vol: .5, type: 'lowpass', freq: 3000, to: 200 }); tone(F('E6'), t, .5, { type: 'triangle', vol: .12, slide: .97 }); },
    recall: t => { tone(F('E5'), t, .3, { type: 'sine', vol: .2, slide: .5 }); noise(t, .3, { vol: .1 }); },
    flameOn: t => {
      if (flame) return;
      // A roaring loop: low-passed noise with a wobble, faded in.
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      s.buffer = noiseBuf; s.loop = true;
      f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 1.2;
      lfo.frequency.value = 9; lg.gain.value = 300; lfo.connect(lg); lg.connect(f.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55, t + .15);
      s.connect(f); f.connect(g); g.connect(sfxBus);
      s.start(t); lfo.start(t);
      flame = { s, lfo, g };
    },
    flameOff: t => {
      if (!flame) return;
      const f = flame; flame = null;
      f.g.gain.cancelScheduledValues(t); f.g.gain.setValueAtTime(f.g.gain.value, t); f.g.gain.linearRampToValueAtTime(0, t + .3);
      f.s.stop(t + .35); f.lfo.stop(t + .35);
    }
  };

  global.BattleAudio = {
    get started() { return !!timer; },
    get enabled() { return enabled; },
    start() {
      init();
      if (ac.state === 'suspended') ac.resume();
      if (timer) return;
      nextStep = ac.currentTime + .1; step = 0;
      timer = setInterval(pump, 60); pump();
    },
    setEnabled(on) { enabled = on; if (master) master.gain.setTargetAtTime(on ? .85 : 0, ac.currentTime, .05); },
    sfx(name) { if (ac && timer && SFX[name]) SFX[name](ac.currentTime + .01); }
  };
})(window);
