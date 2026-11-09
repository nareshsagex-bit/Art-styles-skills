// StoryAudio: a cheerful looping kids' tune plus playful sound effects, all synthesised with
// Web Audio (no audio files). Browsers only allow sound after a tap/click/key, so call
// StoryAudio.start() from a user gesture.
//
//   StoryAudio.start();            // begin music (from a click handler)
//   StoryAudio.sfx('kick');        // pop, sparkle, kick, bigKick, whoosh, boing, oops, cheer, page, copterOn, copterOff
//   StoryAudio.setEnabled(false);  // mute / unmute everything
(function (global) {
  'use strict';
  let ac = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let enabled = true, timer = null, nextBeat = 0, beat = 0, copter = null;
  const BPM = 124, SPB = 60 / BPM;   // seconds per beat

  const NOTE = n => {
    const m = /^([A-G])(#?)(\d)$/.exec(n);
    const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (semi + (+m[3] + 1) * 12 - 69) / 12);
  };

  // 8 bars (32 beats): [note, beats]. A bouncy C-major playground tune.
  const MELODY = [
    ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
    ['F5', 1], ['A5', 1], ['G5', 2],
    ['E5', 1], ['G5', 1], ['C6', 1], ['G5', 1],
    ['A5', .5], ['G5', .5], ['F5', 1], ['E5', 2],
    ['D5', 1], ['F5', 1], ['A5', 1], ['F5', 1],
    ['G5', 1], ['E5', 1], ['C5', 2],
    ['D5', .5], ['E5', .5], ['F5', 1], ['E5', 1], ['D5', 1],
    ['C5', 3], [null, 1]
  ];
  const CHORDS = ['C3', 'F3', 'C3', 'F3', 'D3', 'C3', 'G2', 'C3'];   // one per bar
  const FIFTH = { C3: 'G3', F3: 'C4', D3: 'A3', G2: 'D3' };
  const MEL_AT = [];   // beat offset -> [note, beats]
  { let b = 0; for (const n of MELODY) { MEL_AT.push([b, n]); b += n[1]; } }

  function init() {
    if (ac) return;
    ac = new (global.AudioContext || global.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = enabled ? .9 : 0; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = .22; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = .5; sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // One enveloped oscillator note.
  function tone(freq, t, dur, { type = 'triangle', vol = .3, bus = sfxBus, slide = 0, attack = .01 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + .02);
  }
  // Filtered noise burst (hats, whooshes, claps).
  function noise(t, dur, { vol = .2, bus = sfxBus, type = 'highpass', freq = 6000, to = 0, q = .7 } = {}) {
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf;
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * .5); src.stop(t + dur + .02);
  }

  // ---------- Music scheduler ----------
  function scheduleBeat(b, t) {
    const inLoop = b % 32, bar = Math.floor(inLoop / 4), inBar = inLoop % 4;
    // Melody notes starting within this beat (handles half-beat notes).
    for (const [at, [n, len]] of MEL_AT) {
      if (at >= inLoop && at < inLoop + 1 && n) {
        const tt = t + (at - inLoop) * SPB;
        tone(NOTE(n), tt, len * SPB * .9, { type: 'triangle', vol: .32, bus: musicBus });
        tone(NOTE(n) * 2, tt, len * SPB * .5, { type: 'sine', vol: .06, bus: musicBus });
      }
    }
    // Bouncy bass: root, fifth, root, fifth.
    const root = CHORDS[bar];
    tone(NOTE(inBar % 2 ? FIFTH[root] : root), t, SPB * .7, { type: 'square', vol: .1, bus: musicBus });
    // Drums: kick on 1 and 3, clap on 2 and 4, soft hats on the eighths.
    if (inBar % 2 === 0) tone(120, t, .18, { type: 'sine', vol: .5, bus: musicBus, slide: .35 });
    else noise(t, .12, { vol: .12, bus: musicBus, type: 'bandpass', freq: 1800, q: 1 });
    noise(t, .04, { vol: .05, bus: musicBus });
    noise(t + SPB / 2, .04, { vol: .035, bus: musicBus });
  }
  function pump() {
    while (nextBeat < ac.currentTime + .25) {
      scheduleBeat(beat, nextBeat);
      beat++; nextBeat += SPB;
    }
  }

  // ---------- Sound effects ----------
  const SFX = {
    page: t => tone(NOTE('G5'), t, .12, { type: 'sine', vol: .18 }),
    pop: t => { tone(300, t, .14, { type: 'sine', vol: .5, slide: 3 }); noise(t, .05, { vol: .15 }); },
    sparkle: t => ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(NOTE(n), t + i * .06, .25, { type: 'sine', vol: .16 })),
    kick: t => { tone(160, t, .12, { type: 'sine', vol: .6, slide: .4 }); noise(t, .05, { vol: .15, type: 'lowpass', freq: 1200 }); },
    bigKick: t => { tone(110, t, .3, { type: 'sine', vol: .8, slide: .3 }); noise(t, .12, { vol: .3, type: 'lowpass', freq: 900 }); },
    whoosh: t => noise(t, .7, { vol: .3, type: 'bandpass', freq: 400, to: 4000, q: 1.5 }),
    boing: t => tone(220, t, .35, { type: 'triangle', vol: .35, slide: 2.2 }),
    oops: t => { tone(NOTE('E5'), t, .2, { type: 'square', vol: .1 }); tone(NOTE('C5'), t + .18, .2, { type: 'square', vol: .1 }); tone(NOTE('A4'), t + .36, .4, { type: 'square', vol: .1, slide: .8 }); },
    cheer: t => {
      ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(NOTE(n), t + i * .08, .5, { type: 'triangle', vol: .2 }));
      for (let i = 0; i < 6; i++) noise(t + .1 + i * .07, .08, { vol: .08, type: 'bandpass', freq: 1500 + i * 200, q: 1 });
    },
    copterOn: t => {
      if (copter) return;
      // A soft buzzing whirr: sawtooth through a lowpass, wobbled by a fast LFO.
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      const lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 95;
      f.type = 'lowpass'; f.frequency.value = 700;
      lfo.frequency.value = 22; lg.gain.value = .05;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .4);
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(f); f.connect(g); g.connect(sfxBus);
      o.start(t); lfo.start(t);
      copter = { o, lfo, g };
    },
    copterOff: t => {
      if (!copter) return;
      const c = copter; copter = null;
      c.g.gain.cancelScheduledValues(t);
      c.g.gain.setValueAtTime(c.g.gain.value, t);
      c.g.gain.linearRampToValueAtTime(0, t + .5);
      c.o.stop(t + .55); c.lfo.stop(t + .55);
    }
  };

  global.StoryAudio = {
    get started() { return !!timer; },
    get enabled() { return enabled; },
    start() {
      init();
      if (ac.state === 'suspended') ac.resume();
      if (timer) return;
      nextBeat = ac.currentTime + .1; beat = 0;
      timer = setInterval(pump, 60);
      pump();
    },
    setEnabled(on) {
      enabled = on;
      if (master) master.gain.setTargetAtTime(on ? .9 : 0, ac.currentTime, .05);
    },
    sfx(name) {
      if (!ac || !timer || !SFX[name]) return;
      SFX[name](ac.currentTime + .01);
    }
  };
})(window);
