/**
 * 星尘遗迹 — WebAudio ambience + SFX (no external files)
 */
export function createAudio() {
  let ctx = null;
  let master = null;
  let padGain = null;
  let padNodes = [];
  let muted = false;
  let playing = false;
  let started = false;
  let lastFootstepAt = 0;

  const MASTER_VOL = 0.48;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_VOL;
    master.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
  }

  function setMuted(m) {
    muted = !!m;
    // Safe when ctx not yet created — mute flag remembered for ensure()
    if (master && ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(muted ? 0 : MASTER_VOL, now + 0.12);
    }
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function isMuted() {
    return muted;
  }

  /** Soft tone helper — sine/triangle with optional filter */
  function tone({ freq, type = 'sine', start, dur, peak = 0.12, attack = 0.02, release, detune = 0, filterFreq }) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    g.gain.value = 0.0001;
    if (filterFreq) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq;
      f.Q.value = 0.7;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(master);
    const t0 = start;
    const rel = release ?? Math.max(0.08, dur * 0.7);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    return { osc, g };
  }

  function startPad() {
    resume();
    if (!ctx || playing) return;
    playing = true;
    started = true;

    padGain = ctx.createGain();
    padGain.gain.value = 0.0001;
    padGain.connect(master);

    // Warm teal drone: A2 + soft fifth/octave stack, filtered + slow breath
    const voices = [
      { f: 110.0, type: 'sine', gain: 0.16, lfoHz: 0.07, lfoAmt: 1.8 },
      { f: 164.81, type: 'triangle', gain: 0.09, lfoHz: 0.11, lfoAmt: 2.2 },
      { f: 220.0, type: 'sine', gain: 0.055, lfoHz: 0.09, lfoAmt: 1.4 },
      { f: 261.63, type: 'sine', gain: 0.04, lfoHz: 0.13, lfoAmt: 2.8 },
      { f: 329.63, type: 'triangle', gain: 0.022, lfoHz: 0.05, lfoAmt: 1.1 },
    ];
    padNodes = [];

    // Shared lowpass — slow “breathing” cutoff for richer pad body
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 920;
    filter.Q.value = 0.55;
    filter.connect(padGain);

    const filterLfo = ctx.createOscillator();
    const filterLfoG = ctx.createGain();
    filterLfo.frequency.value = 0.045;
    filterLfoG.gain.value = 280;
    filterLfo.connect(filterLfoG);
    filterLfoG.connect(filter.frequency);
    filterLfo.start();
    padNodes.push({ osc: filterLfo, g: filterLfoG, extra: filter });

    voices.forEach((v, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = v.type;
      osc.frequency.value = v.f;
      // subtle stereo-ish width via opposite detune pairs on even voices
      if (i % 2 === 1) {
        const twin = ctx.createOscillator();
        const twinG = ctx.createGain();
        twin.type = v.type;
        twin.frequency.value = v.f;
        twin.detune.value = 6 + i;
        twinG.gain.value = v.gain * 0.45;
        twin.connect(twinG);
        twinG.connect(filter);
        twin.start();
        padNodes.push({ osc: twin, g: twinG });
      }
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = v.lfoHz;
      lfoG.gain.value = v.lfoAmt;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      g.gain.value = v.gain;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      lfo.start();
      padNodes.push({ osc, g, lfo });
    });

    // Very quiet filtered noise bed — distant mist
    try {
      const bufLen = Math.floor(ctx.sampleRate * 2);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.value = 480;
      nFilter.Q.value = 0.6;
      const nGain = ctx.createGain();
      nGain.gain.value = 0.018;
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(padGain);
      noise.start();
      padNodes.push({ osc: noise, g: nGain, extra: nFilter });
    } catch (_) { /* ignore */ }

    const now = ctx.currentTime;
    padGain.gain.cancelScheduledValues(now);
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.exponentialRampToValueAtTime(0.28, now + 2.6);
  }

  function stopPad() {
    if (!ctx || !padGain) {
      playing = false;
      return;
    }
    const now = ctx.currentTime;
    try {
      padGain.gain.cancelScheduledValues(now);
      padGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    } catch (_) { /* ignore */ }
    const nodes = padNodes.slice();
    const gainNode = padGain;
    padNodes = [];
    padGain = null;
    playing = false;
    setTimeout(() => {
      nodes.forEach(({ osc, lfo, extra }) => {
        try { osc.stop(); } catch (_) {}
        try { lfo && lfo.stop(); } catch (_) {}
        try { extra && extra.disconnect(); } catch (_) {}
      });
      try { gainNode.disconnect(); } catch (_) {}
    }, 900);
  }

  /**
   * Clear ascending chime on shard collect.
   * @param {number} [count] optional collected total after pickup (backward compatible).
   *   Near-full (8th / 9th) slightly raises pitch and adds a soft overtone shimmer.
   */
  function playCollect(count) {
    resume();
    if (!ctx) return;
    const now = ctx.currentTime;
    const nCount = typeof count === 'number' ? count : 0;
    const nearFull = nCount >= 8; // 8th or 9th shard
    const pitch = nearFull ? (nCount >= 9 ? 1.08 : 1.045) : 1;
    // Bright C–E–G–C sparkle; second layer for body
    const notes = [
      { f: 523.25, peak: 0.22, delay: 0 },
      { f: 659.25, peak: 0.2, delay: 0.065 },
      { f: 783.99, peak: 0.18, delay: 0.13 },
      { f: 1046.5, peak: 0.1, delay: 0.2 },
    ];
    notes.forEach((n) => {
      tone({
        freq: n.f * pitch,
        type: 'sine',
        start: now + n.delay,
        dur: 0.72,
        peak: n.peak,
        attack: 0.018,
        filterFreq: 4200,
      });
      // soft triangle underlayer
      tone({
        freq: n.f * pitch,
        type: 'triangle',
        start: now + n.delay,
        dur: 0.55,
        peak: n.peak * 0.35,
        attack: 0.02,
        detune: -4,
      });
    });
    // Near-full: quiet fifth / octave overtone veil
    if (nearFull) {
      const extra = [
        { f: 784 * pitch, peak: 0.06, delay: 0.04 },
        { f: 1175 * pitch, peak: 0.045, delay: 0.12 },
        { f: 1568 * pitch, peak: nCount >= 9 ? 0.05 : 0.03, delay: 0.2 },
      ];
      extra.forEach((n) => {
        tone({
          freq: n.f,
          type: 'sine',
          start: now + n.delay,
          dur: 0.85,
          peak: n.peak,
          attack: 0.03,
          filterFreq: 5200,
        });
      });
    }
  }

  /** Warm rising chord on win */
  function playWin() {
    resume();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Soft entrance arpeggio then sustained A-minor-ish / teal resolution
    const arp = [220, 261.63, 329.63, 392, 523.25];
    arp.forEach((f, i) => {
      tone({
        freq: f,
        type: i % 2 === 0 ? 'triangle' : 'sine',
        start: now + i * 0.08,
        dur: 1.1,
        peak: 0.14 - i * 0.012,
        attack: 0.04,
      });
    });
    const sustain = [
      { f: 174.61, peak: 0.16 },
      { f: 220, peak: 0.14 },
      { f: 261.63, peak: 0.12 },
      { f: 329.63, peak: 0.1 },
      { f: 440, peak: 0.09 },
      { f: 523.25, peak: 0.06 },
    ];
    sustain.forEach((n, i) => {
      tone({
        freq: n.f,
        type: i % 2 === 0 ? 'triangle' : 'sine',
        start: now + 0.35,
        dur: 3.1,
        peak: n.peak,
        attack: 0.35,
        filterFreq: 2800,
      });
      tone({
        freq: n.f * 2,
        type: 'sine',
        start: now + 0.55 + i * 0.03,
        dur: 2.4,
        peak: n.peak * 0.22,
        attack: 0.2,
      });
    });
  }

  function playClick() {
    resume();
    if (!ctx) return;
    const now = ctx.currentTime;
    tone({ freq: 880, type: 'sine', start: now, dur: 0.12, peak: 0.11, attack: 0.008 });
    tone({ freq: 1320, type: 'sine', start: now, dur: 0.08, peak: 0.04, attack: 0.006 });
  }

  /** Tiny blip when journal opens */
  function playJournalOpen() {
    resume();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(master);
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Tiny soft down-blip when journal closes */
  function playJournalClose() {
    resume();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.07);
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(master);
    g.gain.exponentialRampToValueAtTime(0.055, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /** Soft gold pulse near portal / pre-win — clearer fifth + sparkle */
  function playPortalPulse() {
    resume();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { f: 220, peak: 0.1, delay: 0, dur: 0.55 },
      { f: 330, peak: 0.11, delay: 0.05, dur: 0.5 },
      { f: 440, peak: 0.07, delay: 0.12, dur: 0.42 },
      { f: 660, peak: 0.045, delay: 0.2, dur: 0.35 },
    ];
    notes.forEach((n) => {
      tone({
        freq: n.f,
        type: 'sine',
        start: now + n.delay,
        dur: n.dur,
        peak: n.peak,
        attack: 0.028,
        filterFreq: 3200,
      });
    });
  }

  /**
   * Optional ultra-light footstep tick — filtered noise blip, throttled.
   * Safe no-op when muted / no ctx; does not disturb pad.
   */
  function playFootstep() {
    if (muted) return;
    resume();
    if (!ctx || !master) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - lastFootstepAt < 380) return;
    lastFootstepAt = nowMs;
    const now = ctx.currentTime;
    try {
      const dur = 0.055;
      const bufLen = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const env = 1 - i / bufLen;
        data[i] = (Math.random() * 2 - 1) * env * env;
      }
      const srcNode = ctx.createBufferSource();
      srcNode.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420 + Math.random() * 180;
      filter.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      srcNode.connect(filter);
      filter.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.028, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      srcNode.start(now);
      srcNode.stop(now + dur + 0.02);
    } catch (_) { /* ignore */ }
  }

  return {
    resume,
    startPad,
    stopPad,
    playCollect,
    playWin,
    playClick,
    playJournalOpen,
    playJournalClose,
    playPortalPulse,
    playFootstep,
    setMuted,
    toggleMute,
    isMuted,
    isStarted: () => started,
  };
}
