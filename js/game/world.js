/*
 * Dunia: grid blok (typed array), generator berbasis seed, dan akses blok.
 * Baris 0..SURFACE_ROW-1 = langit (udara). Kolom paling kiri/kanan = bedrock.
 */
(function (M) {
  'use strict';
  const C = M.CONFIG, Mat = M.Materials, U = M.Utils, L = M.Layers;
  const COLS = C.WORLD_COLS, ROWS = C.WORLD_ROWS, S = C.SURFACE_ROW;
  const tiles = new Uint8Array(COLS * ROWS);
  const damage = new Float32Array(COLS * ROWS);
  const variant = new Uint8Array(COLS * ROWS);
  const BEDROCK = Mat.byKey.bedrock.id;

  function inBounds(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS; }

  function placeVein(c, r, id, layer, rnd) {
    let cc = c, rr = r;
    const put = (x, y) => {
      const i = y * COLS + x;
      if (tiles[i] !== BEDROCK && tiles[i] !== Mat.byKey.core.id) tiles[i] = id;
    };
    put(cc, rr);
    for (let k = 0; k < 3; k++) {
      if (rnd() >= C.VEIN_CHANCE) break;
      const dir = (rnd() * 4) | 0;
      cc += dir === 0 ? -1 : dir === 1 ? 1 : 0;
      rr += dir === 2 ? -1 : dir === 3 ? 1 : 0;
      if (cc < 1 || cc > COLS - 2 || rr < S + C.ORE_MIN_DEPTH || rr >= ROWS - 1) break;
      if (L.at(rr - S) !== layer) break;
      put(cc, rr);
    }
  }

  const World = {
    cols: COLS, rows: ROWS, seed: 0, trees: [],

    depthOf(r) { return Math.max(0, r - S); },
    layerAt(r) { return L.at(World.depthOf(r)); },
    inBounds: inBounds,
    // Di luar dunia dianggap bedrock (solid & tak bisa digali)
    get(c, r) { return inBounds(c, r) ? tiles[r * COLS + c] : BEDROCK; },
    isSolid(c, r) { const id = World.get(c, r); return id !== 0 && Mat.list[id].solid !== false; },
    set(c, r, id) { const i = r * COLS + c; tiles[i] = id; damage[i] = 0; },
    treeAt(c) { return World.trees.find((t) => t.c === c && !t.chopped) || null; },   // pohon dewasa
    treeAny(c) { return World.trees.find((t) => t.c === c) || null; },                // termasuk sapling
    // pohon ditebang -> tersisa sapling yang tumbuh lagi setelah TREE_REGROW detik
    removeTree(t) { t.chopped = true; t.growT = 0; damage[(S - 1) * COLS + t.c] = 0; },
    updateTrees(dt) {
      for (const t of World.trees) {
        if (!t.chopped) continue;
        t.growT += dt;
        if (t.growT >= C.TREE_REGROW) { t.chopped = false; t.h = 3 + ((Math.random() * 2) | 0); damage[(S - 1) * COLS + t.c] = 0; }
      }
    },
    variantAt(c, r) { return variant[r * COLS + c]; },
    damageAt(c, r) { return damage[r * COLS + c]; },
    addDamage(c, r, amount) { const i = r * COLS + c; damage[i] += amount; return damage[i]; },
    clear(c, r) { const i = r * COLS + c; tiles[i] = 0; damage[i] = 0; },

    generate(seed) {
      World.seed = seed;
      const rnd = U.mulberry32(seed);
      tiles.fill(0); damage.fill(0);
      for (let i = 0; i < variant.length; i++) variant[i] = (rnd() * 4) | 0;

      // 1) blok dasar per lapisan
      for (let r = S; r < ROWS; r++) {
        const layer = L.at(r - S);
        for (let c = 0; c < COLS; c++) {
          const key = (c === 0 || c === COLS - 1) ? 'bedrock' : U.pickWeighted(layer.blocks, rnd);
          tiles[r * COLS + c] = Mat.byKey[key].id;
        }
      }
      // 2) ore (membentuk urat kecil)
      for (let r = S + C.ORE_MIN_DEPTH; r < ROWS - 1; r++) {
        const layer = L.at(r - S);
        if (!layer.ores.length) continue;
        for (let c = 1; c < COLS - 1; c++) {
          for (const o of layer.ores) {
            if (rnd() < o[1] * C.ORE_SEED_SCALE) { placeVein(c, r, Mat.byKey[o[0]].id, layer, rnd); break; }
          }
        }
      }
      // 3) gua kecil (membuka ore & memberi variasi)
      for (let n = 0; n < C.CAVES; n++) {
        const cy = S + 25 + rnd() * (C.CORE_DEPTH - 60);
        const cx = 3 + rnd() * (COLS - 6);
        const rx = 1 + rnd() * 2.5, ry = 1 + rnd() * 1.5;
        for (let r = Math.floor(cy - ry - 1); r <= Math.ceil(cy + ry + 1); r++) {
          for (let c = Math.floor(cx - rx - 1); c <= Math.ceil(cx + rx + 1); c++) {
            if (c < 1 || c > COLS - 2 || r < S + 5 || r >= ROWS - 2) continue;
            const e = ((c - cx) / rx) * ((c - cx) / rx) + ((r - cy) / ry) * ((r - cy) / ry);
            if (e < 1 && rnd() > 0.12) tiles[r * COLS + c] = 0;
          }
        }
      }
      // 4) pohon di permukaan (bisa ditebang; jauh dari titik spawn)
      World.trees = [];
      let last = -9;
      for (let c = 2; c < COLS - 2; c++) {
        if (Math.abs(c - C.SPAWN_COL) <= 3 || c - last < 4) continue;
        if (rnd() < 0.5) { World.trees.push({ c: c, h: 3 + ((rnd() * 2) | 0) }); last = c; }
      }
      if (World.trees.length < 3) World.trees = [{ c: 5, h: 3 }, { c: 11, h: 4 }, { c: 24, h: 3 }];
      // 5) crafting bench awal tepat di tengah dunia
      tiles[(S - 1) * COLS + C.SPAWN_COL] = Mat.byKey.workbench.id;
    }
  };
  M.World = World;
})(window.MTC = window.MTC || {});
