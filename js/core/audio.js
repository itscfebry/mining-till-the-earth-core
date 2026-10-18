/* Efek suara (sintesis WebAudio, tanpa file aset). */
(function (M) {
  'use strict';
  let ctx = null, master = null, muted = false;

  function init() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : 0.9; }
  function isMuted() { return muted; }

  function crunch(intensity, duration, freq) {
    if (!ctx || muted) return;
    const now = ctx.currentTime, sr = ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 30) * (1 - t / duration);
      d[i] = ((Math.random() * 2 - 1) * 0.7 + Math.sin(2 * Math.PI * freq * t) * 0.4) * env * intensity;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(g); g.connect(master);
    src.start(now);
  }

  function tone(f0, f1, dur, type, vol, delay) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  M.Audio = {
    init: init, setMuted: setMuted, isMuted: isMuted,
    dig(h) {
      if (h < 0.3) crunch(0.4, 0.06, 180);
      else if (h < 0.6) crunch(0.55, 0.08, 140);
      else if (h < 1.0) crunch(0.7, 0.10, 110);
      else if (h < 1.6) crunch(0.85, 0.12, 85);
      else crunch(1.0, 0.15, 65);
    },
    ore(def) {
      crunch(0.7, 0.10, 600);
      tone(900, 1400, 0.18, 'triangle', 0.18);
      if (def && def.rare) {
        tone(1200, 1800, 0.2, 'sine', 0.15, 0.10);
        tone(1600, 2400, 0.3, 'sine', 0.12, 0.20);
      }
    },
    layer() { tone(220, 330, 0.3, 'triangle', 0.2); tone(330, 440, 0.4, 'triangle', 0.2, 0.15); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.35, 'triangle', 0.2, i * 0.15)); }
  };
})(window.MTC = window.MTC || {});
