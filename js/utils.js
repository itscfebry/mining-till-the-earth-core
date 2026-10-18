/* Helper umum + event bus sederhana. */
(function (M) {
  'use strict';
  const Utils = {
    clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
    // RNG deterministik (dunia bisa diulang dengan seed yang sama)
    mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    // list = [[key, weight], ...]
    pickWeighted(list, rnd) {
      let total = 0;
      for (const e of list) total += e[1];
      let r = rnd() * total;
      for (const e of list) { r -= e[1]; if (r < 0) return e[0]; }
      return list[list.length - 1][0];
    },
    hexToRgb(hex) {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    rgb(r, g, b) { return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; },
    shade(hex, amt) {
      const c = Utils.hexToRgb(hex);
      const f = (v) => Utils.clamp(v + amt, 0, 255);
      return Utils.rgb(f(c[0]), f(c[1]), f(c[2]));
    },
    mix(hexA, hexB, t) {
      const a = Utils.hexToRgb(hexA), b = Utils.hexToRgb(hexB);
      return Utils.rgb(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
    },
    formatTime(sec) {
      const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }
  };

  /* Event bus: modul saling bicara lewat event, bukan saling memanggil.
     Event: depth, layer, inventory, inventoryReset, blockBroken, moved */
  const handlers = {};
  M.Events = {
    on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); },
    emit(name, data) { (handlers[name] || []).forEach((fn) => fn(data)); }
  };
  M.Utils = Utils;
})(window.MTC = window.MTC || {});
