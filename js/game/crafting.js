/* Crafting: resep hanya bisa dibuat dalam radius BUILD_RADIUS dari sebuah workbench. Tambah resep di sini. */
(function (M) {
  'use strict';
  const C = M.CONFIG, World = M.World, Inv = M.Inventory;

  // pickaxe: hanya level berikutnya yang bisa dibuat; 5 wood + 20 ore sesuai tier-nya
  const recipes = [{ out: 'workbench', n: 1, cost: { wood: 10 } }];
  M.Tools.list.forEach((t, i) => { if (i > 0) recipes.push({ tool: i, cost: { wood: 5, [t.ore]: 20 } }); });

  const Crafting = {
    recipes: recipes,
    nearBench() {
      const id = M.Materials.byKey.workbench.id, R = C.BUILD_RADIUS;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        if (Math.hypot(dx, dy) <= R && World.get(M.Player.col + dx, M.Player.row + dy) === id) return true;
      }
      return false;
    },
    can(rc) {
      if (rc.tool !== undefined && rc.tool !== M.Player.pick + 1) return false;
      return Crafting.nearBench() && Object.keys(rc.cost).every((k) => Inv.get(k) >= rc.cost[k]);
    },
    craft(rc) {
      if (!Crafting.can(rc)) return;
      Object.keys(rc.cost).forEach((k) => Inv.remove(k, rc.cost[k]));
      if (rc.tool !== undefined) { M.Player.pick = rc.tool; M.Events.emit('toolChanged'); }
      else Inv.add(rc.out, rc.n);
      M.Audio.layer();
    }
  };
  M.Crafting = Crafting;
})(window.MTC = window.MTC || {});
