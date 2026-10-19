/*
 * Pemuat tekstur PNG (8x8) lewat <img src>. Nama file = key material (lihat data/materials.js).
 *   assets/blocks/<key>.png  -> blok di dunia (grass, dirt, stone, ..., copper = blok ore di dunia)
 *   assets/ores/<key>.png    -> ITEM ore di inventori & di tangan (copper, tin, ..., osmium); boleh transparan
 * File yang tidak ada / gagal dimuat diabaikan: render js lama (render/textures.js) dipakai sebagai cadangan.
 */
(function (M) {
  'use strict';
  const DIRS = { block: 'assets/blocks/', ore: 'assets/ores/' };
  const Assets = {
    block: {}, ore: {},      // key -> HTMLImageElement (hanya yang berhasil dimuat)
    load() {
      return new Promise((resolve) => {
        const jobs = [];
        M.Materials.list.forEach((d) => { if (!d) return; jobs.push(['block', d.key]); if (d.ore) jobs.push(['ore', d.key]); });
        let left = jobs.length, done = false;
        const fin = () => { if (!done) { done = true; resolve(); } };
        if (!left) { fin(); return; }
        setTimeout(fin, 5000);          // pengaman: jangan menahan game terlalu lama
        jobs.forEach((j) => {
          const img = new Image();
          img.onload = () => { if (img.naturalWidth > 0) Assets[j[0]][j[1]] = img; if (--left === 0) fin(); };
          img.onerror = () => { if (--left === 0) fin(); };
          img.src = DIRS[j[0]] + j[1] + '.png';
        });
      });
    }
  };
  M.Assets = Assets;
})(window.MTC = window.MTC || {});
