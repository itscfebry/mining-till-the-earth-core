/*
 * Lapisan bumi berdasarkan kedalaman (meter).
 *  blocks: [[materialKey, bobot]]   -> isi dasar lapisan
 *  ores:   [[materialKey, peluang]] -> peluang per blok (0.03 = 3%)
 *  color:  warna di gauge kedalaman & dinding gua; wall: warna dinding (opsional)
 * Dua lapisan boleh bernama sama (banner hanya muncul saat nama berganti).
 */
(function (M) {
  'use strict';
  const D = M.CONFIG.CORE_DEPTH;
  const upperOres = [['copper', 0.045], ['tin', 0.035], ['iron', 0.025]];

  const list = [
    { id: 'surface', name: 'Permukaan',    from: 0,   to: 0,     color: '#4a8b3a', wall: '#7d5b3a', blocks: [['grass', 1]], ores: [] },
    { id: 'topsoil', name: 'Tanah',        from: 1,   to: 20,    color: '#7d5b3a', blocks: [['dirt', 1]], ores: [['copper', 0.03], ['tin', 0.015]] },
    { id: 'upper1',  name: 'Batuan Atas',  from: 21,  to: 60,    color: '#7c7c82', blocks: [['dirt', 0.45], ['stone', 0.40], ['hardenedStone', 0.15]], ores: upperOres },
    { id: 'upper2',  name: 'Batuan Atas',  from: 61,  to: 150,   color: '#7c7c82', blocks: [['dirt', 0.20], ['stone', 0.52], ['hardenedStone', 0.28]], ores: upperOres },
    { id: 'granite', name: 'Batuan Keras', from: 151, to: 300,   color: '#5b5560', blocks: [['granite', 0.5], ['basalt', 0.5]],
      ores: [['tin', 0.035], ['iron', 0.03], ['tungsten', 0.025], ['platinum', 0.009]] },
    { id: 'deep',    name: 'Perut Bumi',   from: 301, to: D - 1, color: '#3e4152', blocks: [['deepstone', 0.6], ['blackstone', 0.4]],
      ores: [['iron', 0.025], ['platinum', 0.017], ['titanium', 0.007]] },
    { id: 'core',    name: 'Inti Bumi',    from: D,   to: D,     color: '#c2410c', wall: '#7c2d12', blocks: [['core', 1]], ores: [] }
  ];

  M.Layers = {
    list: list,
    byId(id) { return list.find((l) => l.id === id); },
    at(depth) {
      for (let i = 0; i < list.length; i++) if (depth <= list[i].to) return list[i];
      return list[list.length - 1];
    }
  };
})(window.MTC = window.MTC || {});
