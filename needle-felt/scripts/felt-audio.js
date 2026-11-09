// FeltAudio: a bouncy ukulele-style loop plus squeaky gibberish "voices" for the little
// felt guys, all synthesised with Web Audio (formant-filtered buzzes; no recordings).
//
//   FeltAudio.start();                 // from a tap / click / key
//   FeltAudio.voice('giggle', 1.1);    // beedo, whee, giggle, banana, yay, lala, bello, oops; second arg = pitch
//   FeltAudio.sfx('kick');             // kick, boing, pop
//   FeltAudio.setEnabled(false);
(function (global) {
  'use strict';
  let ac = null, master = null, music = null, vox = null, sfxBus = null, noiseBuf = null;
  let enabled = true, timer = null, next = 0, step = 0;
  const BPM = 112, S8 = 60 / BPM / 2;
  const hz = n => {
    const m = /^([A-G])(#?)(\d)$/.exec(n);
    return 440 * Math.pow(2, ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0) + (+m[3] + 1) * 12 - 69) / 12);
  };
  const CHORDS = [['C4', 'E4', 'G4', 'C5'], ['G3', 'D4', 'G4', 'B4'], ['A3', 'E4', 'A4', 'C5'], ['F3', 'C4', 'F4', 'A4']];
  const ROOTS = ['C3', 'G2', 'A2', 'F2'];
  const MEL = ['E5', '.', 'G5', '.', 'C6', 'B5', 'G5', '.', 'D5', '.', 'G5', '.', 'B5', 'A5', 'G5', '.',
    'C5', '.', 'E5', '.', 'A5', 'G5', 'E5', '.', 'F5', 'E5', 'D5', '.', 'C5', '.', '.', '.'];

  function init() {
    if (ac) return;
    ac = new (global.AudioContext || global.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = enabled ? .9 : 0; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = .16; music.connect(master);
    vox = ac.createGain(); vox.gain.value = .5; vox.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = .45; sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  // A plucked string: bright attack, fast decay (ukulele-ish).
  function pluck(f, t, vol = .2, dur = .5, bus = music) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f * 2.002;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(600, t + dur);
    const g2 = ac.createGain(); g2.gain.value = .12;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(bus);
    o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
  }
  function tone(f, t, dur, { type = 'sine', vol = .3, slide = 0, bus = sfxBus } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .02);
  }
  function shaker(t, vol) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 6500;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    s.connect(f); f.connect(g); g.connect(music); s.start(t, Math.random() * .5); s.stop(t + .06);
  }

  // ---------- Music: strummed chords, bass, little bell melody ----------
  function schedule(n, t) {
    const i = n % 32, bar = Math.floor(i / 8), ch = CHORDS[bar];
    const pattern = [1, 0, 1, 1, 0, 1, 1, 1];          // down . down up . up down up
    if (pattern[i % 8]) ch.forEach((nn, k) => pluck(hz(nn), t + k * .012 * (i % 2 ? -1 : 1) + (i % 2 ? .05 : 0), i % 2 ? .07 : .1, .45));
    if (i % 4 === 0) pluck(hz(ROOTS[bar]), t, .22, .5);
    if (i % 4 === 2) pluck(hz(ROOTS[bar]) * 1.5, t, .12, .35);
    shaker(t, i % 2 ? .04 : .07);
    const m = MEL[i];
    if (m !== '.') { tone(hz(m), t, .35, { type: 'sine', vol: .09, bus: music }); tone(hz(m) * 2, t, .2, { type: 'sine', vol: .03, bus: music }); }
  }
  function pump() { while (next < ac.currentTime + .25) { schedule(step, next); step++; next += S8; } }

  // ---------- Voices: buzz through two vowel formants, with vibrato and pitch glides ----------
  const VOWEL = { a: [950, 1500], e: [600, 2300], i: [420, 2800], o: [620, 1100], u: [420, 950] };
  function syllable(t, f0, dur, v, glide = 1, vol = .5) {
    const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * glide, t + dur);
    lfo.frequency.value = 8; lg.gain.value = f0 * .04; lfo.connect(lg); lg.connect(o.frequency);
    const [f1, f2] = VOWEL[v];
    const b1 = ac.createBiquadFilter(), b2 = ac.createBiquadFilter();
    b1.type = b2.type = 'bandpass'; b1.frequency.value = f1 * 1.3; b2.frequency.value = f2 * 1.25; b1.Q.value = 6; b2.Q.value = 8;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); g.connect(vox);
    o.start(t); lfo.start(t); o.stop(t + dur + .02); lfo.stop(t + dur + .02);
  }
  // Phrases: [vowel, pitch ratio, duration, glide, gap after]
  const PHRASES = {
    beedo: [['i', 1.25, .15, 1, .03], ['o', .95, .2, .9, 0]],
    bello: [['e', 1, .12, 1.05, .02], ['o', 1.18, .24, .85, 0]],
    whee: [['i', 1.1, .38, 1.6, 0]],
    giggle: [['e', 1.4, .06, .95, .04], ['e', 1.35, .06, .95, .04], ['e', 1.3, .06, .95, .04], ['e', 1.22, .07, .95, .04], ['i', 1.15, .1, .9, 0]],
    banana: [['a', 1, .1, 1, .02], ['a', 1.06, .1, 1, .02], ['a', 1.35, .26, 1.15, 0]],
    yay: [['a', 1.2, .4, 1.35, 0]],
    lala: [['a', 1, .13, 1, .03], ['a', 1.12, .13, 1, .03], ['a', 1.26, .2, 1.05, 0]],
    oops: [['u', 1.2, .14, .9, .02], ['o', .9, .22, .75, 0]]
  };
  function voice(name, pitch = 1) {
    if (!ac || !timer || !PHRASES[name]) return;
    let t = ac.currentTime + .01;
    const base = 430 * pitch;
    for (const [v, r, d, gl, gap] of PHRASES[name]) { syllable(t, base * r, d, v, gl); t += d + gap; }
  }
  const SFX = {
    kick: t => { tone(150, t, .14, { vol: .5, slide: .4 }); },
    boing: t => { tone(260, t, .3, { type: 'triangle', vol: .3, slide: 2 }); },
    pop: t => { tone(500, t, .1, { vol: .3, slide: 2.5 }); }
  };

  global.FeltAudio = {
    get started() { return !!timer; },
    get enabled() { return enabled; },
    start() {
      init();
      if (ac.state === 'suspended') ac.resume();
      if (timer) return;
      next = ac.currentTime + .1; step = 0; timer = setInterval(pump, 60); pump();
    },
    setEnabled(on) { enabled = on; if (master) master.gain.setTargetAtTime(on ? .9 : 0, ac.currentTime, .05); },
    voice,
    sfx(name) { if (ac && timer && SFX[name]) SFX[name](ac.currentTime + .01); }
  };
})(window);
