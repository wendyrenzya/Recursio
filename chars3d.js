// chars3d.js | karakter 3D Recursio dari model jadi buatan artis
// Model: contoh resmi VRoid Studio (pixiv), lisensi CC0 tertulis di metadata tiap file. Lihat models/LISENSI.md.
// Proporsi model dibiarkan asli. Yang dikerjakan di sini: memuat model, mewarnai ulang pakaian dan rambut,
// dan menggerakkan jalan, napas, serta kedip.
import * as THREE from "./lib/three.module.min.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import { MeshoptDecoder } from "./lib/meshopt_decoder.module.js";
import { mergeGeometries } from "./lib/BufferGeometryUtils.js";

// tint: warna pengali untuk bahan yang namanya mengandung kata kunci
// grey: bahan yang teksturnya diubah menjadi abu-abu terang (rambut beruban)
// morph: nomor target morf wajah dari file VRM asli (data VRM hilang saat file diperkecil)
// face: ekspresi tetap (nama morf: bobot); glasses: kacamata bulat; bun: sanggul (y tinggi dari mata, size, warna)
const M10 = { blink: 10, eyeJoy: 13, mthFun: 29, brwSorrow: 6 }, M12 = { blink: 12, eyeJoy: 15, mthFun: 25, brwSorrow: 8 };
const CHARS = {
  nino: { name: "Nino", height: 1.6, tint: { Tops: "#f06a1c" }, morph: M10 },
  kael: { name: "Kael", height: 1.66, morph: M10 },
  alisa: { name: "Alisa", height: 1.6, morph: M12, tint: { Tops: "#d6c2ae", Shoes: "#8a6a58", EyeIris: "#a07c5c" },
    face: { eyeJoy: 0.2, mthFun: 0.3 } },
  rin: { name: "Rin", height: 1.46, grey: ["Hair", "FaceBrow"], hunch: 0.2, morph: M12, tint: { Tops: "#c8aa94" },
    face: { eyeJoy: 1, mthFun: 0.5, brwSorrow: 0.35 }, glasses: true,
    head: { cx: 0, sx: 0.0946, ey: 1.313, h: 0.0843, fz: 0.0974, back: -0.112 },
    bun: { y: 1.15, size: 0.5, base: "#cfd1da", light: "rgba(255,255,255,0.35)", dark: "rgba(120,124,140,0.3)", pin: true } },
};
export const CHAR_KEYS = Object.keys(CHARS);
export const charName = (key) => CHARS[key].name;

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);   // geometri model dikompres meshopt

// atribut hasil kompresi bisa berbeda jenis angka antarpotongan; samakan ke Float32 agar bisa digabung
function toFloat(geo) {
  const g = new THREE.BufferGeometry();
  g.setIndex(geo.index);
  for (const name in geo.attributes) {
    const a = geo.attributes[name], out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let j = 0; j < a.itemSize; j++) out[i * a.itemSize + j] = a.getComponent(i, j);
    g.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize));
  }
  return g;
}

// satukan potongan mesh tanpa morf yang memakai bahan sama, supaya satu bahan cukup satu panggilan gambar
function mergeByMaterial(model) {
  const groups = new Map();
  model.traverse((n) => {
    if (!n.isSkinnedMesh || n.geometry.morphAttributes.position) return;
    const k = n.parent.uuid + n.material.uuid;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(n);
  });
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const g = mergeGeometries(list.map((m) => toFloat(m.geometry)));
    if (!g) continue;
    list[0].geometry = g;
    for (const m of list.slice(1)) m.removeFromParent();
  }
}

// salin tekstur ke kanvas dan ubah tiap piksel menjadi abu-abu terang, alfa dipertahankan
function greyTex(map) {
  const img = map.image, cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
  const c = cv.getContext("2d"); c.drawImage(img, 0, 0);
  const d = c.getImageData(0, 0, cv.width, cv.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255, v = 110 + 120 * Math.min(1, l * 1.5);
    p[i] = v * 0.97; p[i + 1] = v * 0.97; p[i + 2] = v;
  }
  c.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.flipY = map.flipY; t.colorSpace = map.colorSpace; t.wrapS = map.wrapS; t.wrapT = map.wrapT; t.channel = map.channel;
  return t;
}

// Aksesori kepala: kacamata bulat dan sanggul ditempel ke tulang kepala.
// Ukuran kepala o.head diukur sekali dari model sebelum dikompres (posisi titik model terkompres tidak bisa dibaca akurat):
// cx tengah wajah, sx setengah lebar wajah, ey tinggi mata, h jarak mata ke dagu, fz depan wajah di mata, back belakang rambut.
function addHeadExtras(B, o) {
  const { cx, sx, ey, h, fz, back } = o.head;
  // kacamata bulat di depan mata
  const frame = new THREE.MeshStandardMaterial({ color: "#7a5236", roughness: 0.4, metalness: 0.3 });
  if (o.glasses) {
  const glasses = new THREE.Group(), R = 0.32 * sx;
  for (const s of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.022 * sx, 8, 32), frame);
    ring.position.set(cx + s * 0.47 * sx, ey - 0.03 * h, fz); glasses.add(ring);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03 * sx, 0.03 * sx, 0.9 * sx), frame);
    arm.position.set(cx + s * (0.47 * sx + R), ey - 0.03 * h, fz - 0.45 * sx); glasses.add(arm);
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * sx, 0.02 * sx, 0.94 * sx - 2 * R, 8), frame);
  bridge.rotation.z = Math.PI / 2; bridge.position.set(cx, ey + 0.05 * h, fz); glasses.add(bridge);
  B.C_Head.attach(glasses);                     // tanpa induk: posisi dunia dipakai langsung saat ditempel
  }
  if (!o.bun) return;

  // sanggul: menempel di permukaan rambut belakang pada ketinggian o.bun.y (kelipatan jarak mata ke dagu)
  const ob = o.bun, by = ey + ob.y * h;
  const r = ob.size * sx, cv = document.createElement("canvas");                // tekstur helai rambut perak
  cv.width = 128; cv.height = 64;
  const c = cv.getContext("2d");
  c.fillStyle = ob.base; c.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 90; i++) { c.fillStyle = i % 2 ? ob.light : ob.dark; c.fillRect(Math.random() * 128, 0, 1 + Math.random() * 2, 64); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = 2;
  const silver = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const bun = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), silver);
  ball.scale.set(1.1, 0.95, 0.85); ball.castShadow = true; bun.add(ball);
  const wrap = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, r * 0.2, 10, 24), silver);   // lilitan rambut di pangkal sanggul
  wrap.position.z = r * 0.45; bun.add(wrap);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * r, 0.03 * r, 3 * r, 8), new THREE.MeshStandardMaterial({ color: "#c9a040", roughness: 0.35, metalness: 0.6 }));
  pin.rotation.z = 1.2; if (ob.pin) bun.add(pin);                                         // tusuk konde
  bun.position.set(cx, by - 0.3 * r, back + 0.65 * r);           // sedikit tertanam di rambut supaya tidak mengambang
  B.C_Head.attach(bun);
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
  mergeByMaterial(model);
  const box = new THREE.Box3().setFromObject(model), s = o.height / (box.max.y - box.min.y);
  const root = new THREE.Group(), pivot = new THREE.Group();
  pivot.rotation.y = Math.PI;                       // model VRM menghadap -Z, permainan memakai +Z sebagai depan
  pivot.scale.setScalar(s); pivot.position.y = -box.min.y * s;
  pivot.add(model); root.add(pivot);

  // wajah: semua potongan mesh yang punya target morf
  const faces = [], mo = o.morph;
  model.traverse((n) => { if (n.isMesh && n.morphTargetInfluences && n.morphTargetInfluences.length > mo.blink) faces.push(n); });
  const setFace = (closed) => {
    for (const f of faces) {
      const w = f.morphTargetInfluences;
      for (const k in o.face || {}) w[mo[k]] = o.face[k] * (k === "eyeJoy" && closed ? 0 : 1);
      w[mo.blink] = closed ? 1 : 0;
    }
  };
  if (o.glasses || o.bun) { root.updateMatrixWorld(true); addHeadExtras(B, o); }

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
    setFace(closed);
    if (st.blink < 0) st.blink = 2.2 + Math.random() * 3;
  }
  update(0);
  return { root, update, key };
}
