// UkiyoAudio: a calm koto-and-flute loop in a Japanese "in" scale, woodblock printing sounds
// (block knock, baren swish, seal stamp, paper slide) and per-print ambience (waves, spring
// wind, rain, snowy night), all synthesised with Web Audio.
//
//   UkiyoAudio.start();               // from a tap / click / key
//   UkiyoAudio.sfx('swish', 1.2);     // paper, knock, swish (duration), stamp
//   UkiyoAudio.ambience('rain');      // waves, wind, rain, night, or null to stop
//   UkiyoAudio.setEnabled(false);
(function (global) {
  'use strict';
  let ac = null, master = null, music = null, sfxBus = null, amb = null, noiseBuf = null;
  let enabled = true, timer = null, next = 0, step = 0, ambNodes = null;
  const BEAT = .42;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // In scale on D: D Eb G A Bb.
  const SCALE = [50, 51, 55, 57, 58, 62, 63, 67, 69, 70, 74];
  const PHRASE = [5, -1, 7, 8, -1, 7, 5, -1, 4, -1, 3, 4, 5, -1, -1, -1, 8, -1, 9, 8, -1, 7, 8, -1, 5, -1, 4, 3, 2, -1, -1, -1];

  function init() {
    if (ac) return;
    ac = new (global.AudioContext || global.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = enabled ? .9 : 0; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = .22; music.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = .5; sfxBus.connect(master);
    amb = ac.createGain(); amb.gain.value = .3; amb.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const noiseSrc = (loop = false) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = loop; return s; };

  // Koto pluck: bright attack, long ringing decay.
  function koto(m, t, vol = .25) {
    const f = hz(m);
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = 'triangle'; o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f * 1.003;
    const g2 = ac.createGain(); g2.gain.value = .08;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 1.2);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(music);
    o1.start(t); o2.start(t); o1.stop(t + 2.7); o2.stop(t + 2.7);
  }
  // Breathy bamboo flute.
  function flute(m, t, dur) {
    const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = hz(m);
    lfo.frequency.value = 5; lg.gain.value = hz(m) * .012; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .35); g.gain.setValueAtTime(.12, t + dur - .5); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(music);
    const n = noiseSrc(), bp = ac.createBiquadFilter(), ng = ac.createGain();
    bp.type = 'bandpass'; bp.frequency.value = hz(m) * 2; bp.Q.value = 4;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(.05, t + .3); ng.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(bp); bp.connect(ng); ng.connect(music);
    o.start(t); lfo.start(t); n.start(t, Math.random()); o.stop(t + dur); lfo.stop(t + dur); n.stop(t + dur);
  }
  function drone(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = hz(38);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + 1.5); g.gain.linearRampToValueAtTime(0, t + BEAT * 8);
    o.connect(g); g.connect(music); o.start(t); o.stop(t + BEAT * 8 + .1);
  }
  function schedule(n, t) {
    const i = n % 32, p = PHRASE[i];
    if (p >= 0) { koto(SCALE[p], t, .22); if (i % 8 === 0) koto(SCALE[p] - 12, t, .14); }
    if (i % 8 === 0) drone(t);
    if (n % 64 === 16) flute(SCALE[8], t, BEAT * 6);
    if (n % 64 === 48) flute(SCALE[7], t, BEAT * 5);
  }
  function pump() { while (next < ac.currentTime + .3) { schedule(step, next); step++; next += BEAT; } }

  // ---------- Printing sounds ----------
  function burst(t, dur, { vol = .3, type = 'bandpass', f = 1000, to = 0, q = 1 } = {}) {
    const s = noiseSrc(), fl = ac.createBiquadFilter(), g = ac.createGain();
    fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + dur + .02);
  }
  function thump(t, f, vol, dur) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .5, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + .02);
  }
  const SFX = {
    paper: t => burst(t, .7, { vol: .18, f: 1500, to: 5000, q: .6 }),
    knock: t => { thump(t, 160, .7, .25); burst(t, .08, { vol: .3, f: 2200, q: 2 }); },
    stamp: t => { thump(t, 110, .8, .3); burst(t, .06, { vol: .25, f: 900, q: 1 }); },
    // The baren rubbing in rows: soft papery swishes, one per sweep.
    swish: (t, dur = 1.2) => { const rows = 3; for (let i = 0; i < rows; i++) burst(t + i * dur / rows, dur / rows * .95, { vol: .16, f: 700 + i * 150, to: 1800, q: .8 }); }
  };

  // ---------- Ambience ----------
  function stopAmb() {
    if (!ambNodes) return;
    const t = ac.currentTime;
    for (const n of ambNodes) { try { n.g && n.g.gain.setTargetAtTime(0, t, .4); n.s.stop(t + 1.5); n.l && n.l.stop(t + 1.5); } catch (e) { /* already stopped */ } }
    ambNodes = null;
  }
  function loopNoise({ type, f, q = .7, vol, lfoRate = 0, lfoDepth = 0 }) {
    const s = noiseSrc(true), fl = ac.createBiquadFilter(), g = ac.createGain();
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.value = 0; g.gain.setTargetAtTime(vol, ac.currentTime, .8);
    s.connect(fl); fl.connect(g); g.connect(amb); s.start();
    let l = null;
    if (lfoRate) { l = ac.createOscillator(); const lg = ac.createGain(); l.frequency.value = lfoRate; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(g.gain); l.start(); }
    return { s, g, l };
  }
  const AMB = {
    waves: () => [loopNoise({ type: 'lowpass', f: 600, vol: .5, lfoRate: .12, lfoDepth: .35 }), loopNoise({ type: 'bandpass', f: 2500, q: .5, vol: .08, lfoRate: .12, lfoDepth: .06 })],
    wind: () => [loopNoise({ type: 'bandpass', f: 500, q: 1.2, vol: .25, lfoRate: .08, lfoDepth: .18 })],
    rain: () => [loopNoise({ type: 'highpass', f: 3000, vol: .22 }), loopNoise({ type: 'lowpass', f: 400, vol: .2 })],
    night: () => [loopNoise({ type: 'bandpass', f: 350, q: 1.5, vol: .15, lfoRate: .05, lfoDepth: .1 })]
  };

  global.UkiyoAudio = {
    get started() { return !!timer; },
    get enabled() { return enabled; },
    start() {
      init();
      if (ac.state === 'suspended') ac.resume();
      if (timer) return;
      next = ac.currentTime + .1; step = 0; timer = setInterval(pump, 80); pump();
    },
    setEnabled(on) { enabled = on; if (master) master.gain.setTargetAtTime(on ? .9 : 0, ac.currentTime, .05); },
    sfx(name, arg) { if (ac && timer && SFX[name]) SFX[name](ac.currentTime + .01, arg); },
    ambience(name) { if (!ac || !timer) return; stopAmb(); if (name && AMB[name]) ambNodes = AMB[name](); },
    // A soft crane call for the snowy night print.
    crane() {
      if (!ac || !timer) return;
      const t = ac.currentTime + .01;
      for (let i = 0; i < 2; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(900, t + i * .22); o.frequency.exponentialRampToValueAtTime(650, t + i * .22 + .18); g.gain.setValueAtTime(0, t + i * .22); g.gain.linearRampToValueAtTime(.08, t + i * .22 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + i * .22 + .2); o.connect(g); g.connect(amb); o.start(t + i * .22); o.stop(t + i * .22 + .22); }
    }
  };
})(window);
