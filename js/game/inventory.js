/* Inventori hasil tambang. Semua perubahan diumumkan lewat event. */
(function (M) {
  'use strict';
  const Inventory = {
    counts: {},
    oreTotal: 0,
    reset() {
      Inventory.counts = {};
      Inventory.oreTotal = 0;
      M.Events.emit('inventoryReset');
    },
    get(key) { return Inventory.counts[key] || 0; },
    add(key, n) {
      const def = M.Materials.byKey[key];
      Inventory.counts[key] = Inventory.get(key) + n;
      if (def.ore) Inventory.oreTotal += n;
      M.Events.emit('inventory', { key: key, def: def, count: Inventory.counts[key], delta: n, oreTotal: Inventory.oreTotal });
    }
  };
  M.Inventory = Inventory;
})(window.MTC = window.MTC || {});
