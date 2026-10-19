/*
 * Pickaxe bertingkat, mengikuti urutan tier ore (field `tier` di materials.js).
 *  - Pickaxe level L (0 = wooden) hanya bisa menambang ore dengan tier <= L + 2.
 *  - Ore tepat di tier L + 2 terasa lebih berat (lebih lambat, lihat HEAVY di player.js).
 *  - Resep: 5 wood + 20 ore (tier yang sama dengan pickaxe), dibuat di crafting bench (game/crafting.js).
 * Ubah kecepatan di POWER (pengali kecepatan gali per level).
 */
(function (M) {
  'use strict';
  const POWER = [1, 1.3, 1.6, 1.9, 2.25, 2.6, 3.0, 3.5, 4.0, 4.6];
  const ores = M.Materials.list.filter((d) => d && d.ore).sort((a, b) => a.tier - b.tier);
  const list = [{ key: 'wooden', name: 'Wooden Pickaxe', color: '#b98a55', ore: null }]
    .concat(ores.map((d) => ({ key: d.key, name: d.name + ' Pickaxe', color: d.color, ore: d.key })));
  M.Tools = {
    list: list,
    HEAVY: 1.8,                                   // ore di tier maksimum pickaxe: waktu gali x1.8
    power(i) { return POWER[Math.min(i, POWER.length - 1)]; }
  };
})(window.MTC = window.MTC || {});
