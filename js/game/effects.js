/* Efek visual: partikel pecahan, teks melayang "+1 Platinum", guncangan layar. Satuan = blok. */
(function (M) {
  'use strict';
  const U = M.Utils, Mat = M.Materials;
  const GRAVITY = 14;
  let particles = [];
  let floaters = [];
  let shakeT = 0, shakeDur = 0, shakeMag = 0;

  const Effects = {
    get particles() { return particles; },
    get floaters() { return floaters; },
    clear() { particles = []; floaters = []; shakeT = 0; },

    breakBurst(col, row, def) {
      const base = def.ore ? Mat.byKey[def.host].color : def.color;
      const n = def.ore ? 14 : 8;
      for (let i = 0; i < n; i++) {
        const gem = def.ore && i % 2 === 0;
        particles.push({
          x: col + 0.5, y: row + 0.5,
          vx: (Math.random() - 0.5) * 6, vy: -1 - Math.random() * 4,
          life: 0.45 + Math.random() * 0.4, age: 0,
          size: 0.08 + Math.random() * 0.1,
          color: gem ? def.color : U.shade(base, (Math.random() - 0.5) * 40)
        });
      }
    },

    floatText(col, row, text, color, big) {
      floaters.push({ x: col + 0.5, y: row + 0.2, text: text, color: color, age: 0, life: big ? 1.5 : 1.2, big: !!big });
    },

    shake(mag, dur) { shakeMag = mag; shakeDur = dur; shakeT = dur; },
    // offset guncangan dalam satuan blok
    shakeOffset() {
      if (shakeT <= 0) return { x: 0, y: 0 };
      const k = shakeMag * (shakeT / shakeDur);
      return { x: (Math.random() - 0.5) * 2 * k, y: (Math.random() - 0.5) * 2 * k };
    },

    update(dt) {
      for (const p of particles) {
        p.age += dt;
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      particles = particles.filter((p) => p.age < p.life);
      for (const f of floaters) { f.age += dt; f.y -= 1.1 * dt; }
      floaters = floaters.filter((f) => f.age < f.life);
      if (shakeT > 0) shakeT -= dt;
    }
  };
  M.Effects = Effects;
})(window.MTC = window.MTC || {});
