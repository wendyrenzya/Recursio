// Uji aturan mesin battle: node tools/test-battle.mjs
import { createBattle, startRound, beginTurn, act, ulangi, dengar, byId, damage, tingkat, salip, bisaSalip, balapan, batasBalapan } from "../battle/engine.mjs";
import assert from "node:assert/strict";

const fixed = (...v) => { let i = 0; return () => v[i++ % v.length]; };
const mk = (musuh, rng = fixed(0.5), extra = {}) => createBattle({ bab: 1, musuh, rng, ...extra });
const ok = (name, fn) => { fn(); console.log("lulus |", name); };

ok("damage sesuai rumus (v = 1)", () => {
  const s = mk(["anomali_statis"]); const n = byId(s, "nino"), e = byId(s, "m0");
  assert.equal(damage(s, n, e, 1.5), Math.max(1, Math.round(8 * 1.5) - Math.floor(e.def / 2)));
});

ok("Ulangi: lolos di bawah peluang, Overflow di atasnya", () => {
  assert.deepEqual(ulangi(mk(["anomali_statis"], fixed(0.2)), 1), { ok: true, depth: 2 });
  assert.deepEqual(ulangi(mk(["anomali_statis"], fixed(0.1)), 1), { ok: false, depth: 2 });
});

ok("Overflow di kedalaman 4: aksi batal, Hang", () => {
  const s = mk(["anomali_statis"]); const n = byId(s, "nino"), e = byId(s, "m0"), hp = e.hp;
  act(s, n, { cmd: "serang", target: "m0", depth: 4, overflow: true });
  assert.equal(e.hp, hp); assert.equal(n.st.hang, true);
});

ok("Overflow skill: EN tetap terpakai", () => {
  const s = mk(["anomali_statis"]); const n = byId(s, "nino");
  act(s, n, { cmd: "skill", skill: "putus_sinyal", target: "m0", depth: 2, overflow: true });
  assert.equal(n.en, 1);
});

ok("Sela meruntuhkan stack musuh dan membuatnya Hang", () => {
  const s = mk(["anomali_statis"]); const e = byId(s, "m0"); e.depth = 2;
  act(s, byId(s, "nino"), { cmd: "serang", target: "m0", depth: 2 });
  assert.equal(e.depth, 1); assert.equal(e.st.hang, true);
});

ok("Serangan lebih dangkal tidak meruntuhkan stack", () => {
  const s = mk(["anomali_statis"]); const e = byId(s, "m0"); e.depth = 3;
  act(s, byId(s, "nino"), { cmd: "serang", target: "m0", depth: 2 });
  assert.equal(e.depth, 3);
});

ok("Musuh Mengisi lalu Lepas di kedalaman 3 dengan pengali x2,5", () => {
  const s = mk(["anomali_statis"]); const e = byId(s, "m0"); e.depth = 3;
  startRound(s); assert.equal(e.intent.act, "lepas");
  const t = byId(s, e.intent.target); t.hp = t.maxHp = 999; const hp = t.hp;
  act(s, e); assert.equal(e.depth, 1);
  assert.equal(hp - t.hp, Math.max(1, Math.round(e.atk * 2.5) - Math.floor(t.def / 2)));
});

ok("Retas memberi glitch Tukar di giliran berikutnya, Patch menghapus dan memberi kebal", () => {
  const s = mk(["anomali_statis"], fixed(0.1)); const e = byId(s, "m0");
  e.intent = { act: "retas", target: "nino" }; act(s, e);
  assert.equal(byId(s, "nino").st.retas, "tukar");
  act(s, byId(s, "nino"), { cmd: "skill", skill: "patch" });
  assert.equal(byId(s, "nino").st.retas, null); assert.equal(byId(s, "nino").st.kebalRetas, 2);
  e.intent = { act: "retas", target: "nino" }; act(s, e);
  assert.equal(byId(s, "nino").st.retas, null);
});

ok("Kesadaran Kael turun 5 per giliran saat anomali EM hidup", () => {
  const s = mk(["anomali_statis"]); s.queue = ["kael"];
  beginTurn(s); assert.equal(byId(s, "kael").kesadaran, 95);
});

ok("Dengar: biaya 15, menampilkan rencana musuh, sekali per ronde", () => {
  const s = mk(["anomali_statis"]); startRound(s);
  const r = dengar(s); assert.equal(byId(s, "kael").kesadaran, 85);
  assert.equal(r[0].act, byId(s, "m0").intent.act); assert.equal(dengar(s), null);
});

ok("Dengar tidak bisa dipakai saat Kael diambil alih", () => {
  const s = mk(["anomali_statis"]); byId(s, "kael").kesadaran = 0; startRound(s);
  assert.equal(dengar(s), null);
});

ok("Kesadaran 0: Kael menyerang sekutu dua giliran, lalu pulih ke 30", () => {
  const s = mk(["anomali_statis"]); const k = byId(s, "kael"), n = byId(s, "nino");
  k.kesadaran = 5; s.queue = ["kael"]; const t = beginTurn(s);
  assert.equal(tingkat(k.kesadaran), "diambil"); assert.equal(t.auto, true);
  const hp = n.hp; act(s, k); assert.ok(n.hp < hp);
  act(s, k); assert.equal(k.kesadaran, 30);
});

ok("Putus Sinyal membebaskan manusia Terkendali di bawah 30 persen HP", () => {
  const s = mk(["warga_terkendali"]); const e = byId(s, "m0"); e.hp = Math.round(e.maxHp * 0.32);
  byId(s, "nino").atk = 3;
  act(s, byId(s, "nino"), { cmd: "skill", skill: "putus_sinyal", target: "m0", depth: 1 });
  assert.equal(e.bebas, true); assert.equal(s.over, "menang");
});

ok("Bos beraksi dua kali per ronde dan tidak bisa ditinggal Mundur", () => {
  const s = mk(["lonjakan_sinyal"]); const q = startRound(s);
  assert.equal(q.filter((id) => id === "m0").length, 2);
  act(s, byId(s, "nino"), { cmd: "mundur" }); assert.equal(s.over, null);
});

ok("Serbu: Balapan saat giliran Nino. Menang membatalkan aksi bos di slot itu", () => {
  const s = mk(["lonjakan_sinyal"], fixed(0.1)); startRound(s);
  assert.equal(s.serbu, true);
  const t = beginTurn(s); assert.equal(t.actor.key, "nino"); assert.equal(t.balapan, "serbu");
  assert.equal(balapan(s, true), true);
  assert.equal(s.queue.filter((id) => id === "m0").length, 1);   // sisa satu aksi bos (aksi kedua)
});

ok("Kalah Balapan: bos beraksi saat itu juga, giliran Nino batal", () => {
  const s = mk(["lonjakan_sinyal"], fixed(0.1)); startRound(s); beginTurn(s);
  const hp = s.fighters.filter((f) => f.side === "party").reduce((a, f) => a + f.hp, 0);
  assert.equal(balapan(s, false), false);
  assert.ok(s.fighters.filter((f) => f.side === "party").reduce((a, f) => a + f.hp, 0) < hp);
});

ok("Salip: EN 3, sekali per ronde, hanya di battle bos", () => {
  const s = mk(["lonjakan_sinyal"], fixed(0.9)); startRound(s); beginTurn(s);
  assert.equal(s.serbu, false); assert.equal(bisaSalip(s), true);
  assert.equal(salip(s), true); assert.equal(byId(s, "nino").en, 4); assert.equal(salip(s), false);
  const n = mk(["anomali_statis"], fixed(0.9)); startRound(n); beginTurn(n);
  assert.equal(bisaSalip(n), false);
  assert.equal(batasBalapan(s), 700);
});

console.log("\nSemua uji lulus");
