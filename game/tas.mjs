// Panel status jelajah dan menu Tas (equipment). Tampilan saja, aturan di progress.mjs.
import { DATA } from "../battle/data.mjs";
import { statAkhir, pasang, lepas, dipakaiOleh, xpKe, LEVEL_MAKS } from "./progress.mjs";
import { tingkat } from "../battle/engine.mjs";

const CSS = `
#hud { position: absolute; left: 0; right: 0; top: 0; padding: 0.55em; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; z-index: 3; color: #f4f4ff; }
#hud .st { background: rgba(14,16,40,0.62); border: 1px solid rgba(255,255,255,0.14); border-radius: 0.7em; padding: 0.4em 0.6em; width: 9.6em; backdrop-filter: blur(3px); }
#hud .ln { display: flex; justify-content: space-between; font-size: 0.66em; font-weight: 800; }
#hud .ln span:last-child { font-weight: 600; opacity: 0.85; }
#hud .bar, #tas .bar { height: 0.32em; border-radius: 99px; background: rgba(0,0,0,0.45); overflow: hidden; margin: 0.15em 0 0.3em; }
#hud .bar i, #tas .bar i { display: block; height: 100%; background: linear-gradient(90deg, #5be37d, #b9f56a); }
#hud .bar.k i { background: linear-gradient(90deg, #8a7bff, #c5a8ff); }
#tas .bar.x i { background: linear-gradient(90deg, #ffd76a, #ffb347); }
#hud button, #tas button { pointer-events: auto; font: inherit; font-weight: 800; color: #1d1830; border: 0; border-radius: 0.7em; padding: 0.55em 0.9em;
  background: linear-gradient(#fff3c9, #f2c95a); box-shadow: 0 0.2em 0 #a5781e; touch-action: manipulation; }
#hud .toast { position: absolute; left: 50%; top: 7.4em; transform: translateX(-50%); white-space: nowrap; font-size: 0.72em; padding: 0.45em 0.9em; border-radius: 99px;
  background: rgba(14,16,40,0.8); border: 1px solid rgba(255,215,106,0.5); transition: opacity 0.4s; }
#tas { position: absolute; inset: 0; z-index: 6; color: #f2f2ff; padding: 0.8em; box-sizing: border-box; display: flex; flex-direction: column; gap: 0.55em;
  background: linear-gradient(180deg, rgba(30,26,70,0.95), rgba(10,10,24,0.97)); user-select: none; -webkit-user-select: none; }
#tas * { box-sizing: border-box; }
#tas .top { display: flex; gap: 0.4em; align-items: center; }
#tas .top .tab { flex: 1; }
#tas .tab.off { background: linear-gradient(#e2e6ff, #a9b2e8); box-shadow: 0 0.2em 0 #5a6198; opacity: 0.7; }
#tas .box { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); border-radius: 0.8em; padding: 0.6em; }
#tas .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3em; text-align: center; font-size: 0.8em; }
#tas .grid b { display: block; font-size: 1.25em; }
#tas .up { color: #8ff5a8; } #tas .dn { color: #ff8fa8; }
#tas .slot { display: flex; align-items: center; gap: 0.6em; padding: 0.55em 0.6em; border-radius: 0.7em; background: rgba(255,255,255,0.06); margin-top: 0.35em; cursor: pointer; }
#tas .slot .k { width: 4.2em; font-size: 0.7em; opacity: 0.7; }
#tas .slot .v { flex: 1; }
#tas .nm { font-weight: 800; font-size: 0.85em; }
#tas .sub { font-size: 0.66em; opacity: 0.8; }
#tas .tier { font-size: 0.6em; padding: 0.05em 0.5em; border-radius: 99px; background: #556; margin-left: 0.3em; vertical-align: middle; }
#tas .tier.rare { background: #2a6ac9; }
#tas .slot.on { outline: 2px solid #ffd76a; }
#tas .list { flex: 1; overflow-y: auto; }
#tas .h { font-weight: 800; font-size: 0.85em; opacity: 0.8; }
`;

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const STAT = { hp: "HP", atk: "ATK", def: "DEF", spd: "SPD" };
const fmtMod = (it) => [
  ...Object.entries(it.plus || {}).map(([k, v]) => `<span class="up">${STAT[k]} +${v}</span>`),
  ...Object.entries(it.minus || {}).map(([k, v]) => `<span class="dn">${STAT[k]} -${v}</span>`),
  ...(it.efek ? [`<span>${DATA.efek[it.efek].nama}</span>`] : []),
].join(" ");
const itemLabel = (id) => { const it = DATA.equip[id]; return `<span class="nm">${it.nama}</span><span class="tier ${it.tier}">${DATA.tier[it.tier].nama} ILv ${it.ilv}</span>`; };

// opts.onChange(): dipanggil setelah save berubah (untuk disimpan). opts.onOpen(open): menu dibuka atau ditutup.
export function createHud(host, save, opts = {}) {
  if (!document.getElementById("tasCss")) { const st = el("style"); st.id = "tasCss"; st.textContent = CSS; document.head.appendChild(st); }
  const hud = el("div"); hud.id = "hud";
  const st = el("div", "st"), btn = el("button", "", "Tas"), toastEl = el("div", "toast");
  toastEl.style.opacity = 0;
  hud.append(st, btn, toastEl);
  host.appendChild(hud);
  let lastHtml = "", toastT = 0;

  function refresh() {
    const n = save.party.nino, k = save.party.kael, nm = statAkhir(save, "nino").stats.hp, km = statAkhir(save, "kael").stats.hp;
    const lv = { stabil: "Stabil", goyah: "Goyah", kritis: "Kritis", diambil: "Diambil alih" }[tingkat(k.kesadaran)];
    const html = `<div class="ln"><span>Nino Lv ${n.level}</span><span>${n.hp}/${nm}</span></div><div class="bar"><i style="width:${100 * n.hp / nm}%"></i></div>
      <div class="ln"><span>Kael Lv ${k.level}</span><span>${k.hp}/${km}</span></div><div class="bar"><i style="width:${100 * k.hp / km}%"></i></div>
      <div class="ln"><span>Kesadaran</span><span>${lv} ${k.kesadaran}</span></div><div class="bar k"><i style="width:${k.kesadaran}%"></i></div>`;
    if (html !== lastHtml) { st.innerHTML = html; lastHtml = html; }
  }

  function toast(msg) {
    toastEl.textContent = msg; toastEl.style.opacity = 1;
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.style.opacity = 0; }, 2600);
  }

  function openTas() {
    opts.onOpen?.(true);
    const root = el("div"); root.id = "tas";
    host.appendChild(root);
    let who = "nino", slotSel = null;
    const close = () => { root.remove(); refresh(); opts.onOpen?.(false); };
    const tap = (e, fn) => e.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); ev.preventDefault(); fn(); });

    function draw() {
      root.innerHTML = "";
      const top = el("div", "top");
      for (const k of ["nino", "kael"]) { const b = el("button", "tab" + (k === who ? "" : " off"), DATA.karakter[k].nama); b.dataset.k = k; tap(b, () => { who = k; slotSel = null; draw(); }); top.appendChild(b); }
      const tutup = el("button", "", "Tutup"); tap(tutup, close); top.appendChild(tutup);
      root.appendChild(top);

      const p = save.party[who], a = statAkhir(save, who);
      const info = el("div", "box");
      const xpTxt = p.level >= LEVEL_MAKS ? "Level maksimum" : `XP ${p.xp}/${xpKe(p.level)}`;
      info.innerHTML = `<div class="ln" style="display:flex;justify-content:space-between"><span class="nm">Level ${p.level}</span><span class="sub">${xpTxt}</span></div>
        <div class="bar x"><i style="width:${p.level >= LEVEL_MAKS ? 100 : 100 * p.xp / xpKe(p.level)}%"></i></div>
        <div class="grid stats">${Object.keys(STAT).map((k) => `<div>${STAT[k]}<b>${a.stats[k]}</b>${a.bonus[k] ? `<span class="${a.bonus[k] > 0 ? "up" : "dn"}">${a.bonus[k] > 0 ? "+" : ""}${a.bonus[k]}</span>` : "&nbsp;"}</div>`).join("")}</div>`;
      root.appendChild(info);

      const slots = el("div", "box");
      for (const [slot, nama] of Object.entries(DATA.slot)) {
        const id = save.equip[who][slot];
        const r = el("div", "slot" + (slot === slotSel ? " on" : ""), `<span class="k">${nama}</span><span class="v">${id ? itemLabel(id) + `<div class="sub">${fmtMod(DATA.equip[id])}</div>` : '<span class="sub">Kosong</span>'}</span>`);
        r.dataset.slot = slot;
        tap(r, () => { slotSel = slotSel === slot ? null : slot; draw(); });
        slots.appendChild(r);
      }
      root.appendChild(slots);

      if (slotSel) {
        const list = el("div", "box list");
        list.appendChild(el("div", "h", `Pilih ${DATA.slot[slotSel].toLowerCase()}`));
        const pakai = save.equip[who][slotSel];
        if (pakai) { const r = el("div", "slot", `<span class="v"><span class="nm">Lepas</span></span>`); r.dataset.item = ""; tap(r, () => { lepas(save, who, slotSel); slotSel = null; opts.onChange?.(); draw(); }); list.appendChild(r); }
        const owned = save.itemMiliki.filter((m) => DATA.equip[m.id].slot === slotSel && m.id !== pakai);
        if (!owned.length && !pakai) list.appendChild(el("div", "sub", "Belum punya item untuk slot ini"));
        for (const m of owned) {
          const lain = dipakaiOleh(save, m.id);
          const r = el("div", "slot", `<span class="v">${itemLabel(m.id)}<div class="sub">${fmtMod(DATA.equip[m.id])}${lain ? ` | dipakai ${DATA.karakter[lain].nama}` : ""}</div></span>`);
          r.dataset.item = m.id;
          tap(r, () => { pasang(save, who, m.id); slotSel = null; opts.onChange?.(); draw(); });
          list.appendChild(r);
        }
        root.appendChild(list);
      }
    }
    draw();
  }

  tap(btn, openTas);
  function tap(e, fn) { e.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); ev.preventDefault(); fn(); }); }
  refresh();
  return { refresh, toast, openTas, el: hud };
}
