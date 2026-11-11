// chars3d.js | karakter 3D Recursio dari model jadi buatan artis
// Model: contoh resmi VRoid Studio (pixiv), lisensi CC0 tertulis di metadata tiap file. Lihat models/LISENSI.md.
// Proporsi model dibiarkan asli. Yang dikerjakan di sini: memuat model, mewarnai ulang pakaian dan rambut,
// dan menggerakkan jalan, napas, serta kedip.
import * as THREE from "./lib/three.module.min.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";

// tint: warna pengali untuk bahan yang namanya mengandung kata kunci
// grey: bahan yang teksturnya diubah menjadi abu-abu terang (rambut beruban)
const CHARS = {
  nino: { name: "Nino", height: 1.6, tint: { Tops: "#ff8f2e" } },
  kael: { name: "Kael", height: 1.66 },
  ibu: { name: "Ibu Nino", height: 1.58 },
  nenek: { name: "Nenek Kael", height: 1.46, grey: ["Hair", "FaceBrow"], hunch: 0.2 },
};
export const CHAR_KEYS = Object.keys(CHARS);
export const charName = (key) => CHARS[key].name;

const loader = new GLTFLoader();

// salin tekstur ke kanvas dan ubah tiap piksel menjadi abu-abu terang, alfa dipertahankan
function greyTex(map) {
  const img = map.image, cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
  const c = cv.getContext("2d"); c.drawImage(img, 0, 0);
  const d = c.getImageData(0, 0, cv.width, cv.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255, v = 150 + 100 * Math.min(1, l * 1.6);
    p[i] = v * 0.97; p[i + 1] = v * 0.97; p[i + 2] = v;
  }
  c.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.flipY = map.flipY; t.colorSpace = map.colorSpace; t.wrapS = map.wrapS; t.wrapT = map.wrapT; t.channel = map.channel;
  return t;
}

export async function loadChar(key) {
  const o = CHARS[key], gltf = await loader.loadAsync(`./models/${key}.glb`), model = gltf.scene;
  const B = {}, done = new Set();
  model.traverse((n) => {
    if (n.isBone) B[n.name.replace("J_Bip_", "")] = n;
    if (!n.isMesh) return;
    n.frustumCulled = false; n.castShadow = true;
    const m = n.material;
    if (done.has(m)) return;
    done.add(m);
    for (const k in o.tint || {}) if (m.name.includes(k)) m.color.set(o.tint[k]);
    if ((o.grey || []).some((k) => m.name.includes(k)) && m.map) { m.map = greyTex(m.map); m.color.set("#ffffff"); }
  });
  const box = new THREE.Box3().setFromObject(model), s = o.height / (box.max.y - box.min.y);
  const root = new THREE.Group(), pivot = new THREE.Group();
  pivot.rotation.y = Math.PI;                       // model VRM menghadap -Z, permainan memakai +Z sebagai depan
  pivot.scale.setScalar(s); pivot.position.y = -box.min.y * s;
  pivot.add(model); root.add(pivot);

  // kedip: cari target morf "Blink" dari data VRM
  let blinkIdx = -1;
  const groups = gltf.parser.json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups || [];
  const bg = groups.find((g) => (g.presetName || "").toLowerCase() === "blink");
  if (bg && bg.binds?.[0]) blinkIdx = bg.binds[0].index;
  const faces = [];
  model.traverse((n) => { if (n.isMesh && n.morphTargetInfluences && blinkIdx >= 0 && blinkIdx < n.morphTargetInfluences.length) faces.push(n); });

  for (const k of ["L_UpperArm", "R_UpperArm"]) B[k].rotation.order = "XZY";   // turunkan lengan dulu, lalu ayun
  const hipY = B.C_Hips.position.y, hunch = o.hunch || 0;
  const st = { phase: 0, blink: 1 + Math.random() * 3, t: Math.random() * 10, walk: 0 };
  const STRIDE = 1.1 * (1 - hunch);
  // dist: jarak tempuh frame ini (satuan tile). moving: sedang berjalan.
  function update(dt, dist = 0, moving = false) {
    st.t += dt;
    st.walk += ((moving ? 1 : 0) - st.walk) * Math.min(1, dt * 10);
    st.phase += dist / STRIDE;
    const w = st.walk * (1 - hunch), p = st.phase * Math.PI * 2;
    for (const [sd, side] of [["L", 1], ["R", -1]]) {
      const ph = p + (side > 0 ? 0 : Math.PI), sw = Math.sin(ph);
      B[sd + "_UpperLeg"].rotation.x = (sw * 0.5 + 0.08) * w;
      B[sd + "_LowerLeg"].rotation.x = -(0.1 + Math.max(0, Math.cos(ph)) * 0.9) * w;       // lutut menekuk saat kaki diayun ke depan
      B[sd + "_Foot"].rotation.x = -sw * 0.15 * w;
      B[sd + "_UpperArm"].rotation.z = side * (1.3 + Math.sin(st.t * 1.6) * 0.012);
      B[sd + "_UpperArm"].rotation.x = -sw * 0.45 * w;
      B[sd + "_LowerArm"].rotation.y = -side * (0.12 + hunch + (0.2 + Math.max(0, -sw) * 0.35) * w);
    }
    B.C_Hips.position.y = hipY + (Math.abs(Math.sin(p)) * 0.02 - 0.015) * w;
    B.C_Hips.rotation.y = Math.sin(p) * 0.08 * w;
    B.C_Spine.rotation.x = -hunch - 0.05 * w + Math.sin(st.t * 1.6) * 0.012;                 // bungkuk, condong saat jalan, napas
    B.C_Neck.rotation.x = hunch * 0.7;
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
