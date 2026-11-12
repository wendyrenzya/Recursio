// Progres pemain: level, XP, equipment, kesadaran, dan simpan di perangkat. Logika murni, tanpa DOM.
import { DATA } from "../battle/data.mjs";
import { statAt } from "../battle/engine.mjs";

export const LEVEL_MAKS = 10;
export const SAVE_KEY = "recursio.save.v1";
const KEYS = ["nino", "kael"];

export const xpKe = (level) => 20 * level + 10;   // XP untuk naik dari level ini ke berikutnya

export function newSave() {
  return {
    versi: 1, bab: 1, area: "manado_rumah_nino", pos: { tx: 9, ty: 3 },
    party: {
      nino: { level: 1, xp: 0, hp: statAt("nino", 1).hp },
      kael: { level: 1, xp: 0, hp: statAt("kael", 1).hp, kesadaran: DATA.kesadaran.max },
    },
    item: { kopi_kaleng: 2, baterai: 1, headset_gaming: 1 },
    bahan: { benang: 0, kain_perca: 0, benang_emas: 0 },
    equip: { nino: { topi: null, baju: null, gelang: null, sepatu: null }, kael: { topi: null, baju: null, gelang: null, sepatu: null } },
    // Sementara: item awal di tas sampai peti Bab 1 dibuat.
    itemMiliki: Object.keys(DATA.equip).map((id) => ({ id, ilv: DATA.equip[id].ilv, kotor: 0, umur: DATA.tier[DATA.equip[id].tier].umur })),
    pekerjaanNpc: [],
    flags: {},
  };
}

// ---------------------------------------------------------------- equipment
export const pv = (tier, ilv) => Math.floor((4 + 2 * ilv) * DATA.tier[tier].pv);
export const mv = (tier, ilv) => Math.ceil(pv(tier, ilv) * DATA.tier[tier].minus);
const cost = (o = {}) => Object.entries(o).reduce((a, [k, v]) => a + DATA.biayaPoin[k] * v, 0);

// Aturan anggaran Equipment v1. Hasil: daftar pelanggaran, kosong berarti sah.
export function cekItem(id) {
  const it = DATA.equip[id], t = DATA.tier[it.tier], err = [];
  if (!t) return [`${id}: tier ${it.tier} belum aktif`];
  const efek = it.efek ? DATA.efek[it.efek] : null;
  if (efek && !t.efek.includes(efek.kelas)) err.push(`${id}: efek ${efek.kelas} tidak boleh di tier ${it.tier}`);
  if (it.ilv > t.ilvMaks) err.push(`${id}: ILv di atas maksimum tier`);
  const plus = cost(it.plus) + (efek ? DATA.biayaPoin[efek.kelas] : 0);
  if (plus > pv(it.tier, it.ilv)) err.push(`${id}: plus ${plus} melebihi PV ${pv(it.tier, it.ilv)}`);
  if (cost(it.minus) < mv(it.tier, it.ilv)) err.push(`${id}: minus ${cost(it.minus)} di bawah MV ${mv(it.tier, it.ilv)}`);
  for (const k of Object.keys(it.plus || {})) if (it.minus?.[k]) err.push(`${id}: ${k} plus dan minus sekaligus`);
  return err;
}

export const dipakaiOleh = (save, id) => KEYS.find((k) => Object.values(save.equip[k]).includes(id)) || null;

// Pasang item ke slot-nya. Item yang dipakai karakter lain dilepas dari sana dulu.
export function pasang(save, key, id) {
  const slot = DATA.equip[id].slot, lain = dipakaiOleh(save, id);
  if (lain) { save.equip[lain][slot] = null; batasiHp(save, lain); }
  save.equip[key][slot] = id;
  batasiHp(save, key);
}
export const lepas = (save, key, slot) => { save.equip[key][slot] = null; batasiHp(save, key); };
const batasiHp = (save, key) => { const p = save.party[key]; p.hp = Math.min(p.hp, statAkhir(save, key).stats.hp); };

// Stat akhir = stat level + plus - minus semua gear. SPD dari gear dibatasi -3 sampai +3.
export function statAkhir(save, key) {
  const st = statAt(key, save.party[key].level), add = { hp: 0, atk: 0, def: 0, spd: 0 }, efek = [];
  for (const id of Object.values(save.equip[key])) {
    if (!id) continue;
    const it = DATA.equip[id];
    for (const [k, v] of Object.entries(it.plus || {})) add[k] += v;
    for (const [k, v] of Object.entries(it.minus || {})) add[k] -= v;
    if (it.efek) efek.push(it.efek);
  }
  add.spd = Math.max(-3, Math.min(3, add.spd));
  return { stats: { hp: Math.max(1, st.hp + add.hp), atk: Math.max(1, st.atk + add.atk), def: Math.max(0, st.def + add.def), spd: Math.max(1, st.spd + add.spd) }, efek, bonus: add };
}

// ---------------------------------------------------------------- battle
// Data party untuk createBattle. EN selalu mulai dari nilai awal battle.
export function partyBattle(save) {
  const o = {};
  for (const k of KEYS) {
    const { stats, efek } = statAkhir(save, k), p = save.party[k];
    o[k] = { level: p.level, stats, efek, hp: Math.min(p.hp, stats.hp), kesadaran: p.kesadaran };
  }
  return o;
}

// Tulis hasil battle ke save. Menang memberi XP ke seluruh party. Hasil: daftar teks naik level.
export function selesaiBattle(save, s) {
  const naik = [];
  for (const f of s.fighters.filter((x) => x.side === "party")) {
    const p = save.party[f.key];
    p.hp = f.hp > 0 ? f.hp : Math.max(1, Math.ceil(f.maxHp * 0.25));   // pingsan pulih ke 25 persen
    if (f.key === "kael") p.kesadaran = f.kesadaran;
  }
  for (const [id, n] of Object.entries(s.items)) save.item[id] = n;
  if (s.over === "menang") {
    const xp = s.fighters.filter((x) => x.side === "musuh").reduce((a, e) => a + e.xp, 0);
    for (const k of KEYS) naik.push(...tambahXp(save, k, xp));
  }
  return naik;
}

export function tambahXp(save, key, xp) {
  const p = save.party[key], naik = [];
  if (p.level >= LEVEL_MAKS) return naik;
  p.xp += xp;
  while (p.level < LEVEL_MAKS && p.xp >= xpKe(p.level)) {
    const sebelum = statAkhir(save, key).stats.hp;
    p.xp -= xpKe(p.level); p.level++;
    p.hp += statAkhir(save, key).stats.hp - sebelum;            // HP tambahan langsung terisi
    naik.push(`${DATA.karakter[key].nama} naik ke level ${p.level}`);
  }
  if (p.level >= LEVEL_MAKS) p.xp = 0;
  return naik;
}

// Istirahat di titik aman: HP dan kesadaran penuh.
export function istirahat(save) {
  for (const k of KEYS) save.party[k].hp = statAkhir(save, k).stats.hp;
  save.party.kael.kesadaran = DATA.kesadaran.max;
}

export function ubahKesadaran(save, n) {
  const p = save.party.kael;
  p.kesadaran = Math.max(0, Math.min(DATA.kesadaran.max, p.kesadaran + n));
}

// ---------------------------------------------------------------- simpan
export function simpan(save, store = globalThis.localStorage) {
  try { store.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
export function muat(store = globalThis.localStorage) {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (raw) { const o = JSON.parse(raw); if (o?.versi === 1) return o; }
  } catch { /* penyimpanan tidak tersedia, mulai baru */ }
  return newSave();
}
