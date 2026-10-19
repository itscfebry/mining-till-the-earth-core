/* Inventori hasil tambang + item terpilih (selected). Semua perubahan diumumkan lewat event. */
(function (M) {
  'use strict';
  const Inventory = {
    counts: {},
    oreTotal: 0,
    selected: null,
    reset() {
      Inventory.counts = {};
      Inventory.oreTotal = 0;
      Inventory.selected = null;
      M.Events.emit('inventoryReset');
      M.Events.emit('selected', null);
    },
    get(key) { return Inventory.counts[key] || 0; },
    add(key, n) {
      const def = M.Materials.byKey[key];
      Inventory.counts[key] = Inventory.get(key) + n;
      if (def.ore) Inventory.oreTotal += n;
      M.Events.emit('inventory', { key: key, def: def, count: Inventory.counts[key], delta: n, oreTotal: Inventory.oreTotal });
    },
    remove(key, n) {
      const def = M.Materials.byKey[key];
      Inventory.counts[key] = Math.max(0, Inventory.get(key) - n);
      if (def.ore) Inventory.oreTotal = Math.max(0, Inventory.oreTotal - n);
      M.Events.emit('inventory', { key: key, def: def, count: Inventory.counts[key], delta: -n, oreTotal: Inventory.oreTotal });
      if (Inventory.selected === key && !Inventory.counts[key]) Inventory.select(null);
    },
    // klik item yang sama lagi = batal pilih
    select(key) {
      if (key && (!Inventory.get(key) || Inventory.selected === key)) key = null;
      Inventory.selected = key;
      M.Events.emit('selected', key);
    }
  };
  M.Inventory = Inventory;
})(window.MTC = window.MTC || {});
