/*
 * Daftar blok & ore. Mau tambah material/ore baru? Cukup panggil register().
 *  - ore:true  -> dirender sebagai blok 'host' + bintik warna 'color'
 *  - drop      -> key material yang masuk inventori (default: dirinya sendiri)
 *  - rare:true -> suara & guncangan layar spesial saat ditambang
 *  - unbreakable:true -> tidak bisa digali
 * Setelah register, masukkan ke lapisan di data/layers.js agar muncul di dunia.
 */
(function (M) {
  'use strict';
  const list = [null]; // id 0 = udara
  const byKey = {};

  function register(def) {
    if (byKey[def.key]) throw new Error('Material sudah terdaftar: ' + def.key);
    def.id = list.length;
    def.name = def.name || def.key;
    if (def.variance === undefined) def.variance = 0.12;
    list.push(def);
    byKey[def.key] = def;
    return def;
  }

  M.Materials = { AIR: 0, list: list, byKey: byKey, register: register, get: (id) => list[id] || null };

  // ---- blok biasa ----
  register({ key: 'grass',         name: 'Grass',      hardness: 0.18, color: '#4a8b3a', variance: 0.10, style: 'grass', drop: 'dirt' });
  register({ key: 'dirt',          name: 'Dirt',       hardness: 0.22, color: '#7d5b3a', variance: 0.14 });
  register({ key: 'stone',         name: 'Stone',      hardness: 0.35, color: '#7c7c82', variance: 0.12 });
  register({ key: 'hardenedStone', name: 'Hard Stone', hardness: 0.65, color: '#5a5b64', variance: 0.10, drop: 'stone' });
  register({ key: 'granite',       name: 'Granite',    hardness: 0.90, color: '#5b5560', variance: 0.12 });
  register({ key: 'basalt',        name: 'Basalt',     hardness: 1.20, color: '#383844', variance: 0.12 });
  register({ key: 'deepstone',     name: 'Deepstone',  hardness: 1.70, color: '#3e4152', variance: 0.10 });
  register({ key: 'blackstone',    name: 'Blackstone', hardness: 2.30, color: '#242733', variance: 0.10 });
  register({ key: 'core',          name: 'Core Rock',  hardness: 2.50, color: '#c2410c', variance: 0.10, style: 'magma' });
  register({ key: 'bedrock',       name: 'Bedrock',    hardness: Infinity, color: '#16171c', variance: 0.08, unbreakable: true });

  // ---- ore ----
  register({ key: 'copper',   name: 'Copper',   ore: true, host: 'stone',      hardness: 0.70, color: '#e08a40', glow: '#ffa24a' });
  register({ key: 'tin',      name: 'Tin',      ore: true, host: 'stone',      hardness: 0.75, color: '#c3ccd6', glow: '#e3ebf3' });
  register({ key: 'iron',     name: 'Iron',     ore: true, host: 'stone',      hardness: 0.95, color: '#c99d74', glow: '#e8bf95' });
  register({ key: 'tungsten', name: 'Tungsten', ore: true, host: 'granite',    hardness: 1.40, color: '#7fa2cc', glow: '#9cc0ea' });
  register({ key: 'platinum', name: 'Platinum', ore: true, host: 'basalt',     hardness: 1.90, color: '#e4f3ff', glow: '#bfe6ff', rare: true });
  register({ key: 'titanium', name: 'Titanium', ore: true, host: 'blackstone', hardness: 3.00, color: '#8ea8ff', glow: '#a9bdff', rare: true });
})(window.MTC = window.MTC || {});
