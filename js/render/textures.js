/*
 * Tekstur blok pixel-art dibuat lewat kode (tanpa file gambar), di-cache per ukuran tile.
 * Tile = grid 8x8 "piksel" besar. Ore = blok host + gugus bintik berwarna.
 */
(function (M) {
  'use strict';
  const U = M.Utils, Mat = M.Materials, Layers = M.Layers;
  const VARIANTS = 4;
  const Tx = { T: 0, VARIANTS: VARIANTS, tiles: {}, walls: {}, cracks: [] };

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return { c: c, x: x };
  }

  function paintTile(x, T, def, rnd) {
    const g = 8;
    const e = (i) => Math.round(i * T / g);
    const cell = (i, j, col) => { x.fillStyle = col; x.fillRect(e(i), e(j), e(i + 1) - e(i), e(j + 1) - e(j)); };
    const rc = () => 1 + ((rnd() * 6) | 0);

    if (def.style === 'bench') {            // objek transparan: meja kerja
      for (let j = 5; j < 8; j++) { cell(1, j, '#5a3a1c'); cell(6, j, '#5a3a1c'); }
      for (let i = 0; i < 8; i++) { cell(i, 3, '#c78d4f'); cell(i, 4, def.color); }
      cell(2, 2, '#9aa0b2'); cell(3, 2, '#8b6b4b'); cell(5, 2, '#c9d1d9');
      return;
    }

    const baseDef = def.ore ? Mat.byKey[def.host] : (def.style === 'grass' ? Mat.byKey.dirt : def);
    const vr = baseDef.variance * 255;
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) cell(i, j, U.shade(baseDef.color, (rnd() - 0.5) * vr));

    if (def.style === 'grass') {
      for (let j = 0; j < 3; j++) for (let i = 0; i < g; i++) cell(i, j, U.shade(def.color, (rnd() - 0.5) * 30 + (j === 0 ? 18 : 0)));
      for (let i = 0; i < g; i++) if (rnd() < 0.55) cell(i, 3, U.shade(def.color, -12));
    } else if (def.style === 'planks') {
      for (let j = 2; j < g; j += 3) for (let i = 0; i < g; i++) cell(i, j, U.shade(def.color, -34));
      for (let k = 0; k < 3; k++) cell(rc(), (rnd() * 8) | 0, U.shade(def.color, -20));
    } else if (def.style === 'magma') {
      for (let k = 0; k < 14; k++) cell(rc(), rc(), '#5a1a05');
      for (let k = 0; k < 9; k++) cell((rnd() * 8) | 0, (rnd() * 8) | 0, '#f97316');
      for (let k = 0; k < 5; k++) cell((rnd() * 8) | 0, (rnd() * 8) | 0, '#fcd34d');
    } else if (def.key === 'bedrock') {
      for (let k = 0; k < 10; k++) cell((rnd() * 8) | 0, (rnd() * 8) | 0, '#25262e');
    } else if (def.ore && def.style === 'crystal') {   // kristal berfaset: sisi terang, tengah, gelap + kilap putih
      const crystal = (ci, cj) => {
        cell(ci, cj, U.mix(def.color, '#ffffff', 0.85)); cell(ci + 1, cj, U.mix(def.color, '#ffffff', 0.4));
        cell(ci, cj + 1, def.color); cell(ci + 1, cj + 1, U.shade(def.color, -50));
      };
      for (let k = 0; k < 3; k++) crystal(1 + ((rnd() * 5) | 0), 1 + ((rnd() * 5) | 0));
      cell(1 + ((rnd() * 6) | 0), 1 + ((rnd() * 6) | 0), '#ffffff');
      if (def.gloss) for (let k = 0; k < 4; k++) cell(rc(), rc(), k % 2 ? '#ffffff' : '#c8fbff');
    } else if (def.ore && def.style === 'metal') {      // lempeng logam abu-abu mengilap
      for (let k = 0; k < 3; k++) {
        const ci = 1 + ((rnd() * 4) | 0), cj = 1 + ((rnd() * 4) | 0);
        for (let i = 0; i < 3; i++) {
          cell(ci + i, cj, U.mix(def.color, '#ffffff', 0.55));
          cell(ci + i, cj + 1, def.color);
          cell(ci + i, cj + 2, U.shade(def.color, -55));
        }
        cell(ci + 2, cj, '#ffffff');
      }
    } else if (def.ore) {
      const n = 3 + ((rnd() * 2) | 0);
      for (let k = 0; k < n; k++) {
        const ci = rc(), cj = rc();
        cell(ci, cj, def.color);
        const dx = rnd() < 0.5 ? 1 : -1, dy = rnd() < 0.5 ? 1 : -1;
        const ni = U.clamp(ci + dx, 1, 6), nj = U.clamp(cj + (rnd() < 0.5 ? dy : 0), 1, 6);
        cell(ni, nj, U.shade(def.color, -28));
        if (rnd() < 0.7) cell(ci, cj, U.mix(def.color, '#ffffff', 0.6));
        cell(ci, cj, def.color);
        if (rnd() < 0.8) cell(ci, cj, U.mix(def.color, '#ffffff', 0.35));
      }
    } else {
      for (let k = 0; k < 4; k++) cell(rc(), rc(), U.shade(baseDef.color, -26));
      for (let k = 0; k < 2; k++) cell(rc(), rc(), U.shade(baseDef.color, 20));
    }

    // bevel supaya blok terbaca sebagai kotak
    const bw = Math.max(1, Math.round(T / 24));
    x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(0, 0, T, bw); x.fillRect(0, 0, bw, T);
    x.fillStyle = 'rgba(0,0,0,0.32)'; x.fillRect(0, T - bw, T, bw); x.fillRect(T - bw, 0, bw, T);
  }

  function paintWall(x, T, layer, rnd) {
    const g = 8, e = (i) => Math.round(i * T / g);
    const base = layer.wall || layer.color;
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) {
      x.fillStyle = U.shade(U.mix(base, '#000000', 0.5), (rnd() - 0.5) * 14);
      x.fillRect(e(i), e(j), e(i + 1) - e(i), e(j + 1) - e(j));
    }
    x.fillStyle = 'rgba(0,0,0,0.18)';
    for (let k = 0; k < 5; k++) { const i = (rnd() * 8) | 0, j = (rnd() * 8) | 0; x.fillRect(e(i), e(j), e(i + 1) - e(i), e(j + 1) - e(j)); }
  }

  Tx.build = function (T) {
    Tx.T = T;
    Tx.tiles = {}; Tx.walls = {}; Tx.cracks = [];
    Mat.list.forEach((def) => {
      if (!def) return;
      const arr = [];
      for (let v = 0; v < VARIANTS; v++) {
        const o = mk(T, T);
        paintTile(o.x, T, def, U.mulberry32(def.id * 977 + v * 31 + 1));
        arr.push(o.c);
      }
      Tx.tiles[def.id] = arr;
    });
    Layers.list.forEach((layer, li) => {
      const arr = [];
      for (let v = 0; v < VARIANTS; v++) {
        const o = mk(T, T);
        paintWall(o.x, T, layer, U.mulberry32(li * 131 + v * 17 + 5));
        arr.push(o.c);
      }
      Tx.walls[layer.id] = arr;
    });
    const segs = [
      [[0.5, 0.1], [0.45, 0.35], [0.55, 0.5]],
      [[0.55, 0.5], [0.8, 0.6], [0.9, 0.9]],
      [[0.45, 0.35], [0.15, 0.45], [0.1, 0.7]],
      [[0.55, 0.5], [0.4, 0.8], [0.5, 0.95]]
    ];
    for (let s = 0; s < 4; s++) {
      const o = mk(T, T);
      o.x.strokeStyle = 'rgba(0,0,0,0.7)';
      o.x.lineWidth = Math.max(1, T / 14);
      o.x.lineCap = 'square';
      for (let k = 0; k <= s; k++) {
        o.x.beginPath();
        segs[k].forEach((p, i) => (i ? o.x.lineTo(p[0] * T, p[1] * T) : o.x.moveTo(p[0] * T, p[1] * T)));
        o.x.stroke();
      }
      Tx.cracks.push(o.c);
    }
  };

  Tx.tile = (id, v) => Tx.tiles[id][v % VARIANTS];
  Tx.wall = (layerId, v) => Tx.walls[layerId][v % VARIANTS];
  Tx.crack = (stage) => Tx.cracks[U.clamp(stage, 0, 3)];

  // Ikon kecil 16x16 untuk sidebar (ditampilkan membesar dengan CSS pixelated)
  Tx.icon = function (key) {
    const def = Mat.byKey[key];
    const o = mk(16, 16);
    paintTile(o.x, 16, def, U.mulberry32(def.id * 977 + 1));
    return o.c;
  };

  // Ikon pickaxe 16x16 untuk resep crafting: gagang kayu + kepala berwarna tier
  Tx.toolIcon = function (tool) {
    const o = mk(16, 16), x = o.x;
    x.fillStyle = '#8b6b4b';
    for (let i = 0; i < 10; i++) x.fillRect(3 + i, 13 - i, 2, 2);
    [[4, 5], [6, 3], [8, 2], [10, 3], [12, 5], [13, 7]].forEach((p, i) => {
      x.fillStyle = i < 3 ? U.mix(tool.color, '#ffffff', 0.3) : tool.color;
      x.fillRect(p[0], p[1], 3, 3);
    });
    return o.c;
  };

  M.Textures = Tx;
})(window.MTC = window.MTC || {});
