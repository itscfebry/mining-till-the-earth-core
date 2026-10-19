/* Meletakkan item (bayangan + validasi radius) dan mengambil objek non-solid (workbench). */
(function (M) {
  'use strict';
  const C = M.CONFIG, World = M.World, Mat = M.Materials, Inv = M.Inventory, S = C.SURFACE_ROW;

  const Build = {
    // definisi item terpilih jika bisa diletakkan (bukan ore) dan game sedang jalan
    held() {
      const k = Inv.selected;
      if (!k || M.Game.state !== 'playing') return null;
      const d = Mat.byKey[k];
      return d.ore || d.unbreakable ? null : d;
    },
    active() { return !!Build.held(); },
    inRange(c, r) { return Math.hypot(c - M.Player.col, r - M.Player.row) <= C.BUILD_RADIUS; },

    canPlace(c, r, def) {
      if (c < 1 || c > World.cols - 2 || r < S - 1 - C.BUILD_HEIGHT || r >= World.rows - 1) return false;
      if (World.get(c, r) !== 0 || !Build.inRange(c, r)) return false;
      if (r < S && World.treeAny(c)) return false;
      if (def.solid === false) return World.isSolid(c, r + 1);          // objek berdiri di atas tanah
      if (c === M.Player.col && r === M.Player.row) return false;
      // blok harus menempel pada blok solid (tidak melayang)
      return World.isSolid(c - 1, r) || World.isSolid(c + 1, r) || World.isSolid(c, r - 1) || World.isSolid(c, r + 1);
    },

    placeAt(x, y) {
      const def = Build.held(); if (!def) return;
      const p = M.Renderer.cellAt(x, y);
      if (!Build.canPlace(p.c, p.r, def)) return;
      World.set(p.c, p.r, def.id);
      Inv.remove(def.key, 1);
      M.Audio.dig(0.3);
      M.Effects.breakBurst(p.c, p.r, def);
      M.Events.emit('worldChanged');
    },

    pickupAt(x, y) {
      if (M.Game.state !== 'playing') return;
      const p = M.Renderer.cellAt(x, y);
      const def = Mat.get(World.get(p.c, p.r));
      if (!def || def.solid !== false || !Build.inRange(p.c, p.r)) return;
      World.clear(p.c, p.r);
      Inv.add(def.key, 1);
      M.Events.emit('worldChanged');
    }
  };
  M.Build = Build;
})(window.MTC = window.MTC || {});
