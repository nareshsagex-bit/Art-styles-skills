// LofiAudio: a mellow lo-fi hip-hop loop, synthesised with Web Audio (no recordings).
// Warm electric-piano chords with tremolo through a low-pass filter, a soft round bass,
// dusty swung drums (thumpy kick, brushed snare, quiet hats), a gentle music-box melody,
// vinyl crackle and tape wobble. 74 bpm, jazzy ii-V-I style progression.
//
//   LofiAudio.start();            // from a tap / click / key (browsers block sound before that)
//   LofiAudio.setEnabled(false);  // mute
(function (global) {
  'use strict';
  let ac = null, master = null, bus = null, keysF = null, noiseBuf = null, wow = null;
  let enabled = true, timer = null, next = 0, step = 0;
  const BPM = 74, S16 = 60 / BPM / 4;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // Fmaj9 - Em7 - Dm9 - G13sus (each two bars), voiced warm and close.
  const CHORDS = [[53, 57, 60, 64, 67], [52, 55, 59, 62, 66], [50, 53, 57, 60, 64], [43, 53, 57, 60, 65]];
  const BASS = [41, 40, 38, 43];
  // A sparse music-box melody over 8 bars (16ths; -1 = rest).
  const MEL = [
    76, -1, -1, -1, 74, -1, 72, -1, -1, -1, 69, -1, -1, -1, -1, -1,
    -1, -1, 71, -1, 72, -1, -1, -1, 74, -1, -1, -1, -1, -1, -1, -1,
    72, -1, -1, -1, 69, -1, 67, -1, -1, -1, 65, -1, -1, -1, 64, -1,
    -1, -1, -1, -1, 65, -1, 67, -1, 69, -1, -1, -1, -1, -1, -1, -1
  ];

  function init() {
    if (ac) return;
    ac = new (global.AudioContext || global.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = enabled ? .8 : 0;
    // Gentle "tape" tone: everything through a warm low-pass and soft compression.
    const tone = ac.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5200;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(tone); tone.connect(comp); comp.connect(ac.destination);
    bus = ac.createGain(); bus.gain.value = .9; bus.connect(master);
    keysF = ac.createBiquadFilter(); keysF.type = 'lowpass'; keysF.frequency.value = 1500; keysF.Q.value = .5; keysF.connect(bus);
    // Tape wobble: a slow LFO that every oscillator's detune follows.
    wow = ac.createOscillator(); wow.frequency.value = .45;
    const wowGain = ac.createGain(); wowGain.gain.value = 9; wow.connect(wowGain); wow.start();
    wow.out = wowGain;
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    vinyl();
  }
  // Vinyl crackle: soft hiss plus random pops.
  function vinyl() {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = .4;
    const g = ac.createGain(); g.gain.value = .018;
    s.connect(f); f.connect(g); g.connect(master); s.start();
    const c = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), cd = c.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = Math.random() < .0006 ? (Math.random() * 2 - 1) * .8 : 0;
    const cs = ac.createBufferSource(); cs.buffer = c; cs.loop = true;
    const cg = ac.createGain(); cg.gain.value = .25; cs.connect(cg); cg.connect(master); cs.start();
  }
  const osc = (type, f, t) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; wow.out.connect(o.detune); o.start(t); return o; };

  // Electric-piano note: sine + soft overtone with tremolo, slow decay.
  function keys(m, t, dur, vol = .07) {
    const g = ac.createGain(), trem = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(vol * .35, t + dur * .6); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    lfo.frequency.value = 4.2; lg.gain.value = .25; lfo.connect(lg); lg.connect(trem.gain); trem.gain.value = .8;
    const a = osc('sine', hz(m), t), b = osc('triangle', hz(m) * 2, t), bg = ac.createGain(); bg.gain.value = .12;
    a.connect(g); b.connect(bg); bg.connect(g); g.connect(trem); trem.connect(keysF);
    lfo.start(t); a.stop(t + dur + .05); b.stop(t + dur + .05); lfo.stop(t + dur + .05);
  }
  function bass(m, t, dur) {
    const g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    const o = osc('triangle', hz(m), t); o.connect(f); f.connect(g); g.connect(bus); o.stop(t + dur + .05);
  }
  function bell(m, t) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.045, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
    const o = osc('sine', hz(m), t), o2 = osc('sine', hz(m) * 3.01, t), g2 = ac.createGain(); g2.gain.value = .15;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus); o.stop(t + 1.7); o2.stop(t + 1.7);
  }
  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + .18);
    g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + .35);
  }
  function noiseHit(t, dur, vol, type, freq, q = .7) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random()); s.stop(t + dur + .02);
  }

  function schedule(n, t) {
    const i = n % 128, bar = Math.floor(i / 16), s = i % 16;
    const swing = s % 2 ? S16 * .18 : 0;            // lazy swung 16ths
    const tt = t + swing;
    const ch = CHORDS[Math.floor(bar / 2) % 4];
    // Chords: a long pad on the downbeat of each two-bar chord, a softer re-strike mid-way.
    if (s === 0 && bar % 2 === 0) ch.forEach((m, k) => keys(m, tt + k * .012, S16 * 30, .055));
    if (s === 10 && bar % 2 === 1) ch.slice(1).forEach((m, k) => keys(m + 12, tt + k * .02, S16 * 6, .025));
    if (s === 0 && bar % 2 === 0) bass(BASS[Math.floor(bar / 2) % 4], tt, S16 * 14);
    if (s === 10 && bar % 2 === 1) bass(BASS[Math.floor(bar / 2) % 4] + 7, tt, S16 * 4);
    // Drums: kick on 1 and the "and" of 3, snare on 2 and 4, quiet hats on 8ths.
    if (s === 0 || s === 10) kick(tt);
    if (s === 4 || s === 12) { noiseHit(tt, .22, .16, 'bandpass', 1800, .6); noiseHit(tt, .08, .06, 'lowpass', 600); }
    if (s % 2 === 0) noiseHit(tt, .05, s % 4 === 2 ? .045 : .025, 'highpass', 7000);
    const m = MEL[i % 64];
    if (m > 0 && n >= 64) bell(m, tt);              // the melody comes in on the second pass
  }
  function pump() { while (next < ac.currentTime + .3) { schedule(step, next); step++; next += S16; } }

  global.LofiAudio = {
    get started() { return !!timer; },
    get enabled() { return enabled; },
    start() {
      init();
      if (ac.state === 'suspended') ac.resume();
      if (timer) return;
      next = ac.currentTime + .15; step = 0; timer = setInterval(pump, 70); pump();
    },
    setEnabled(on) { enabled = on; if (master) master.gain.setTargetAtTime(on ? .8 : 0, ac.currentTime, .1); }
  };
})(window);
