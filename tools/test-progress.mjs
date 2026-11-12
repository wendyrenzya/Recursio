// Uji progres: node tools/test-progress.mjs
import assert from "node:assert/strict";
import { DATA } from "../battle/data.mjs";
import { createBattle, overflowChance, statAt } from "../battle/engine.mjs";
import { newSave, xpKe, tambahXp, statAkhir, pasang, lepas, cekItem, pv, mv, partyBattle, selesaiBattle, istirahat, simpan, muat, dipakaiOleh } from "../game/progress.mjs";

const ok = (name, fn) => { fn(); console.log("lulus |", name); };
const memStore = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };

ok("level naik sesuai tabel Game System (XP 20L+10, stat dasar + pertumbuhan)", () => {
  const tabel = { 1: [40, 8, 4, 50, 6, 5], 2: [48, 10, 5, 60, 7, 7], 5: [72, 16, 8, 90, 10, 13], 10: [112, 26, 13, 140, 15, 23] };
  for (const [L, [nh, na, nd, kh, ka, kd]] of Object.entries(tabel)) {
    assert.deepEqual([statAt("nino", +L).hp, statAt("nino", +L).atk, statAt("nino", +L).def], [nh, na, nd]);
    assert.deepEqual([statAt("kael", +L).hp, statAt("kael", +L).atk, statAt("kael", +L).def], [kh, ka, kd]);
  }
  const s = newSave();
  assert.deepEqual(tambahXp(s, "nino", 29), []); assert.equal(s.party.nino.level, 1);
  assert.deepEqual(tambahXp(s, "nino", 1), ["Nino naik ke level 2"]); assert.equal(s.party.nino.xp, 0);
  tambahXp(s, "nino", 50 + 70); assert.equal(s.party.nino.level, 4);
  tambahXp(s, "nino", 99999); assert.equal(s.party.nino.level, 10); assert.equal(s.party.nino.xp, 0);
  assert.equal(xpKe(1), 30); assert.equal(xpKe(9), 190);
});

ok("naik level menambah HP saat ini sebesar kenaikan HP maksimum", () => {
  const s = newSave(); s.party.kael.hp = 20;
  tambahXp(s, "kael", 30); assert.equal(s.party.kael.hp, 30);
});

ok("semua item lulus anggaran PV dan MV", () => {
  for (const id of Object.keys(DATA.equip)) assert.deepEqual(cekItem(id), []);
  assert.deepEqual([pv("normal", 1), mv("normal", 1)], [6, 2]);
  assert.deepEqual([pv("normal", 5), mv("normal", 5), pv("rare", 8), mv("rare", 8)], [14, 4, 22, 7]);
});

ok("bonus bersih Rare ILv maksimum lebih besar dari Normal ILv 1", () => {
  assert.ok(pv("rare", 8) - mv("rare", 8) > pv("normal", 1) - mv("normal", 1));
  assert.ok(pv("rare", 8) - mv("rare", 8) > pv("normal", 5) - mv("normal", 5));
});

ok("bonus equipment masuk ke stat, plus dan minus", () => {
  const s = newSave();
  pasang(s, "nino", "topi_kardus");                 // DEF +1, HP -1
  pasang(s, "nino", "gelang_karet_nasi_kuning");    // ATK +1, HP +1, DEF -1, Overflow Ringan
  const a = statAkhir(s, "nino");
  assert.deepEqual(a.stats, { hp: 40, atk: 9, def: 4, spd: 7 });
  assert.deepEqual(a.efek, ["overflow_ringan"]);
  lepas(s, "nino", "topi"); assert.equal(statAkhir(s, "nino").stats.def, 3);
});

ok("satu item hanya dipakai satu karakter", () => {
  const s = newSave(); pasang(s, "nino", "topi_kardus"); pasang(s, "kael", "topi_kardus");
  assert.equal(s.equip.nino.topi, null); assert.equal(dipakaiOleh(s, "topi_kardus"), "kael");
});

ok("Overflow Ringan menurunkan peluang Overflow 5 persen", () => {
  const s = newSave(); pasang(s, "nino", "gelang_karet_nasi_kuning");
  const b = createBattle({ musuh: ["anomali_statis"], party: partyBattle(s) });
  assert.equal(overflowChance(b, 2, b.fighters[0]).toFixed(2), "0.10");
  assert.equal(overflowChance(b, 2, b.fighters[1]).toFixed(2), "0.15");
});

ok("hasil battle: HP dan kesadaran terbawa, pingsan pulih 25 persen, XP masuk", () => {
  const s = newSave();
  const b = createBattle({ musuh: ["anomali_statis", "anomali_statis"], party: partyBattle(s) });
  b.fighters[0].hp = 0; b.fighters[1].hp = 12; b.fighters[1].kesadaran = 40; b.items.kopi_kaleng = 1; b.over = "menang";
  const naik = selesaiBattle(s, b);
  assert.deepEqual([s.party.nino.hp, s.party.kael.hp, s.party.kael.kesadaran, s.item.kopi_kaleng], [10, 12, 40, 1]);
  assert.equal(s.party.nino.xp, 24); assert.deepEqual(naik, []);
  istirahat(s); assert.deepEqual([s.party.nino.hp, s.party.kael.hp, s.party.kael.kesadaran], [40, 50, 100]);
});

ok("data yang dimuat ulang sama dengan yang disimpan", () => {
  const st = memStore(), s = newSave();
  pasang(s, "kael", "kaos_oblong_pudar"); tambahXp(s, "kael", 45); s.pos = { tx: 4, ty: 18 }; s.flags.anomali_uji = true;
  assert.equal(simpan(s, st), true);
  assert.deepEqual(muat(st), s);
  assert.deepEqual(muat(memStore()), newSave());   // tanpa data: mulai baru
});

console.log("\nSemua uji lulus");
