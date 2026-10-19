/* Konfigurasi global game. Ubah angka di sini untuk tuning cepat. */
(function (M) {
  'use strict';
  const CONFIG = {
    TILE_MIN: 26,         // ukuran blok minimum di layar (px CSS)
    TILE_MAX: 44,         // ukuran blok maksimum
    WORLD_COLS: 32,       // lebar dunia (blok); kolom paling kiri/kanan = bedrock
    SURFACE_ROW: 140,     // baris pertama tanah (di atasnya langit; harus >= BUILD_HEIGHT)
    BUILD_HEIGHT: 128,    // batas bangun ke atas dari permukaan (blok)
    TREE_REGROW: 120,     // detik sapling tumbuh jadi pohon lagi
    CORE_DEPTH: 900,      // kedalaman inti bumi (meter = blok). Sampai sini = menang
    ORE_MIN_DEPTH: 4,     // ore baru muncul mulai kedalaman ini
    ORE_SEED_SCALE: 0.7,  // pengali peluang ore (karena ore membentuk urat)
    VEIN_CHANCE: 0.3,     // peluang urat ore melebar ke blok tetangga
    CAVES: 60,            // jumlah gua kecil
    MOVE_INTERVAL: 0.11,  // detik per langkah saat tombol ditahan
    BREAK_COOLDOWN: 0.05, // jeda singkat setelah blok pecah
    PICK_POWER: 1,        // pengali kecepatan gali (untuk upgrade pickaxe nanti)
    BUILD_RADIUS: 6,      // jangkauan meletakkan item & memakai crafting bench (blok)
    SEED: null,           // isi angka agar dunia selalu sama
    SAVE_KEY: 'mtc.save.v1'
  };
  CONFIG.WORLD_ROWS = CONFIG.SURFACE_ROW + CONFIG.CORE_DEPTH + 1;
  CONFIG.MIN_ROW = CONFIG.SURFACE_ROW - 1;       // pemain berdiri di atas rumput
  CONFIG.SPAWN_COL = Math.floor(CONFIG.WORLD_COLS / 2);
  M.CONFIG = CONFIG;
})(window.MTC = window.MTC || {});
