// chars3d.js | karakter 3D chibi Recursio dari model jadi buatan artis
// Model: contoh resmi VRoid Studio (pixiv), lisensi CC0 tertulis di metadata tiap file. Lihat models/LISENSI.md.
// Yang dikerjakan di sini: memuat model, mengubah proporsi ke chibi lewat skala tulang, mewarnai ulang pakaian,
// dan menggerakkan jalan, napas, serta kedip.
import * as THREE from "./lib/three.module.min.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";

// tint: warna pengali untuk bahan yang namanya mengandung kata kunci
const CHARS = {
  nino: { name: "Nino", height: 1.5, tint: { Tops: "#ff8f2e" } },
  kael: { name: "Kael", height: 1.55 },
  ibu: { name: "Ibu Nino", height: 1.6 },
  nenek: { name: "Nenek Kael", height: 1.42 },
};
export const CHAR_KEYS = Object.keys(CHARS);
export const charName = (key) => CHARS[key].name;

// proporsi chibi: kepala besar, badan dan kaki pendek, tangan dan kaki sedikit dibesarkan lagi
// skala per sumbu supaya anggota badan memendek tanpa menjadi kurus; tangan, kaki, dan kepala mengimbangi skala induknya
const HEAD = 2.0, LEG = 0.5, ARM = 0.62, SPINE = [1.08, 0.8, 1.08];
const CHIBI = {
  C_Spine: SPINE, C_Head: [HEAD / SPINE[0], HEAD / SPINE[1], HEAD / SPINE[2]],
  L_UpperLeg: [1.05, LEG, 1.05], R_UpperLeg: [1.05, LEG, 1.05], L_Foot: [1.1, 1.1 / LEG, 1.1], R_Foot: [1.1, 1.1 / LEG, 1.1],
  L_UpperArm: [ARM, 1, 1], R_UpperArm: [ARM, 1, 1], L_Hand: [1.15 / ARM, 1.15, 1.15], R_Hand: [1.15 / ARM, 1.15, 1.15],
};
const loader = new GLTFLoader();

export async function loadChar(key) {
  const o = CHARS[key], gltf = await loader.loadAsync(`./models/${key}.glb`), model = gltf.scene;
  const B = {};
  model.traverse((n) => {
    if (n.isBone) B[n.name.replace("J_Bip_", "")] = n;
    if (n.isMesh) {
      n.frustumCulled = false; n.castShadow = true;
      for (const k in o.tint || {}) if (n.material.name.includes(k)) n.material.color.set(o.tint[k]);
    }
  });
  // tinggi asli, lalu proporsi chibi
  model.updateMatrixWorld(true);
  const wy = (b) => b.getWorldPosition(new THREE.Vector3()).y;
  const top0 = new THREE.Box3().setFromObject(model).max.y, headY0 = wy(B.C_Head);
  for (const k in CHIBI) B[k].scale.set(...CHIBI[k]);
  model.updateMatrixWorld(true);
  const floor = Math.min(wy(B.L_ToeBase), wy(B.R_ToeBase)) - 0.03, top = wy(B.C_Head) + (top0 - headY0) * HEAD;
  const s = o.height / (top - floor);
  const root = new THREE.Group(), pivot = new THREE.Group();
  pivot.rotation.y = Math.PI;                       // model VRM menghadap -Z, permainan memakai +Z sebagai depan
  pivot.scale.setScalar(s); pivot.position.y = -floor * s;
  pivot.add(model); root.add(pivot);

  // kedip: cari target morf "Blink" dari data VRM
  let blinkIdx = -1;
  const groups = gltf.parser.json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups || [];
  const bg = groups.find((g) => (g.presetName || "").toLowerCase() === "blink");
  if (bg && bg.binds?.[0]) blinkIdx = bg.binds[0].index;
  const faces = [];
  model.traverse((n) => { if (n.isMesh && n.morphTargetInfluences && blinkIdx >= 0 && blinkIdx < n.morphTargetInfluences.length) faces.push(n); });

  for (const k of ["L_UpperArm", "R_UpperArm"]) B[k].rotation.order = "XZY";   // turunkan lengan dulu, lalu ayun
  const hipY = B.C_Hips.position.y;
  const st = { phase: 0, blink: 1 + Math.random() * 3, t: Math.random() * 10, walk: 0 };
  const STRIDE = 0.9;
  // dist: jarak tempuh frame ini (satuan tile). moving: sedang berjalan.
  function update(dt, dist = 0, moving = false) {
    st.t += dt;
    st.walk += ((moving ? 1 : 0) - st.walk) * Math.min(1, dt * 10);
    st.phase += dist / STRIDE;
    const w = st.walk, p = st.phase * Math.PI * 2;
    for (const [sd, side] of [["L", 1], ["R", -1]]) {
      const ph = p + (side > 0 ? 0 : Math.PI), sw = Math.sin(ph);
      B[sd + "_UpperLeg"].rotation.x = sw * 0.7 * w;
      B[sd + "_LowerLeg"].rotation.x = -(0.08 + Math.max(0, Math.cos(ph)) * 0.45) * w;     // lutut menekuk sedikit saat kaki diayun ke depan
      B[sd + "_Foot"].rotation.x = -sw * 0.2 * w;
      B[sd + "_UpperArm"].rotation.z = side * (1.3 + Math.sin(st.t * 1.6) * 0.012);
      B[sd + "_UpperArm"].rotation.x = -sw * 0.5 * w;
      B[sd + "_LowerArm"].rotation.y = -side * (0.1 + (0.12 + Math.max(0, -sw) * 0.3) * w);
    }
    B.C_Hips.position.y = hipY + (Math.abs(Math.sin(p)) * 0.018 - 0.012) * w;
    B.C_Hips.rotation.y = Math.sin(p) * 0.08 * w;
    B.C_Spine.rotation.x = -0.07 * w + Math.sin(st.t * 1.6) * 0.012;                          // condong saat jalan, napas saat diam
    B.C_Head.rotation.z = Math.sin(st.t * 0.7) * 0.03 * (1 - w);
    B.C_Head.rotation.y = -B.C_Hips.rotation.y;
    st.blink -= dt;
    const closed = st.blink < 0.12 ? 1 : 0;
    for (const f of faces) f.morphTargetInfluences[blinkIdx] = closed;
    if (st.blink < 0) st.blink = 2.2 + Math.random() * 3;
  }
  update(0);
  return { root, update, key };
}
