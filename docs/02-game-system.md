# Recursio | Game System v1

Diperbarui: 5 November 2026, disesuaikan dengan Battle System v1 dan Equipment v1

## Asumsi

Pertanyaan terbuka di PRD dijawab sementara dengan asumsi di bawah. Semua angka di dokumen ini adalah titik awal untuk di-tuning saat playtest, bukan angka final.

- Ganti karakter bebas kapan saja saat jelajah. Di battle, Nino dan Kael selalu sama-sama ada di party.
- Dialog memakai bahasa Indonesia santai dengan sentuhan dialek Manado ringan.
- Tangan kanan sekte bernama Om Ferry dan pemimpin sekte bernama Nabi Zaviel (lihat PRD).
- Versi 1 berakhir tepat setelah twist di Bab 5.
- Level maksimum versi 1 adalah 10.

## Stat, level, dan XP

Empat stat: HP, ATK, DEF, SPD. Kecepatan (SPD) tetap per karakter di versi 1 supaya sederhana. Stat naik per level: stat = dasar + pertumbuhan x (level - 1). Stat akhir di battle adalah stat itu ditambah bonus dari equipment (lihat Equipment).

| Karakter | HP | ATK | DEF | SPD | Peran |
| --- | --- | --- | --- | --- | --- |
| Nino (level 1) | 40 | 8 | 4 | 7 | Penyerang, melemahkan dan membebaskan musuh |
| Kael (level 1) | 50 | 6 | 5 | 5 | Penahan, penyembuh |
| Pertumbuhan Nino per level | +8 | +2 | +1 | 0 | |
| Pertumbuhan Kael per level | +10 | +1 | +2 | 0 | |

XP untuk naik dari level L ke L+1 adalah 20 x L + 10. Seluruh party mendapat XP penuh dari setiap battle.

| Level | XP ke level berikut | Nino HP / ATK / DEF | Kael HP / ATK / DEF |
| --- | --- | --- | --- |
| 1 | 30 | 40 / 8 / 4 | 50 / 6 / 5 |
| 2 | 50 | 48 / 10 / 5 | 60 / 7 / 7 |
| 3 | 70 | 56 / 12 / 6 | 70 / 8 / 9 |
| 4 | 90 | 64 / 14 / 7 | 80 / 9 / 11 |
| 5 | 110 | 72 / 16 / 8 | 90 / 10 / 13 |
| 6 | 130 | 80 / 18 / 9 | 100 / 11 / 15 |
| 7 | 150 | 88 / 20 / 10 | 110 / 12 / 17 |
| 8 | 170 | 96 / 22 / 11 | 120 / 13 / 19 |
| 9 | 190 | 104 / 24 / 12 | 130 / 14 / 21 |
| 10 | maks | 112 / 26 / 13 | 140 / 15 / 23 |

Target level pemain saat masuk bab: Bab 1 level 1, Bab 2 level 3, Bab 3 level 4, Bab 4 level 6, Bab 5 level 8.

## Alur battle dan rumus

Battle berjalan per ronde. Semua petarung bergiliran dari SPD tertinggi ke terendah, dan jika SPD sama, party jalan lebih dulu.

1. Ronde dimulai, urutan giliran dihitung dari SPD.
2. Pada giliran party, pemain memilih perintah: Serang, Skill, Barang, Bertahan, atau Mundur.
3. Untuk perintah yang butuh target, pemain tap musuh atau sekutu.
4. Aksi dijalankan, lalu giliran berpindah ke petarung berikutnya.
5. Ronde berakhir saat semua petarung sudah jalan, lalu status dan EN diperbarui.

```latex
\text{damage} = \max\left(1,\ \operatorname{round}(ATK \times m \times v) - \left\lfloor \tfrac{DEF}{2} \right\rfloor\right)
```

m adalah pengali Stack (kedalaman 1 sampai 4, lihat Battle System) dikali pengali skill (Serang 1,0), v adalah variasi acak 0,9 sampai 1,1.

| Perintah | Efek |
| --- | --- |
| Serang | Damage dengan pengali skill 1,0, bisa di-Stack, tanpa biaya |
| Skill | Biaya EN, efek sesuai skill |
| Barang | Pakai satu item, memakai satu giliran |
| Bertahan | DEF dua kali lipat sampai giliran berikutnya, EN +2 |
| Mundur | Peluang berhasil 60 persen, tidak bisa dipakai saat melawan bos |

EN (energi skill) maksimum 10, mulai battle di 5, dan pulih 2 setiap giliran karakter itu.

**Menang:** semua musuh lumpuh atau dibebaskan. **Kalah:** semua anggota party pingsan, pemain kembali ke checkpoint terakhir tanpa kehilangan XP. Setelah battle, anggota yang pingsan pulih ke 25 persen HP.

## Skill, item, dan status

| Karakter | Skill | EN | Efek |
| --- | --- | --- | --- |
| Nino | Pindai | 2 | DEF satu musuh turun 3 selama 3 giliran |
| Nino | Putus Sinyal | 4 | Damage dengan pengali skill 1,5, dan 2,0 ke anomali EM. Musuh manusia berstatus Terkendali dengan HP di bawah 30 persen langsung dibebaskan |
| Nino | Patch | 2 | Hapus semua glitch Retas Layar dari layar party dan kebal Retas selama 2 giliran. Tidak bisa di-Stack |
| Nino | Salip | 3 | Hanya battle bos, sekali per ronde, tidak memakai giliran. Geser kartu Nino ke slot kartu bos untuk memicu Balapan |
| Kael | Jangkar | 3 | Pulihkan HP satu sekutu sebesar 20 + 2 x level |
| Kael | Tahan Diri | 2 | Pulihkan Kesadaran Kael sebesar 25 |
| Kael | Dengar | 0 (Kesadaran 15) | Sekali per ronde, tidak memakai giliran. Menampilkan aksi berikutnya semua musuh sampai akhir ronde |

Putus Sinyal tidak mempan pada pengikut sekte, karena mereka patuh lewat iman, bukan lewat kontrol paksa entitas. Ini membuat Bab 5 terasa berbeda dari bab sebelumnya.

| Item | Efek |
| --- | --- |
| Kopi Kaleng | Pulihkan 30 HP satu sekutu |
| Baterai | Pulihkan 5 EN satu karakter |
| Headset Gaming | Pulihkan 30 Kesadaran Kael |
| Benang | Bahan perbaikan dan upgrade equipment, didapat dari jelajah dan drop musuh, tidak dipakai di battle |
| Kain Perca | Bahan upgrade equipment, didapat dari jelajah dan drop musuh, tidak dipakai di battle |
| Benang Emas | Bahan untuk menaikkan tier job Nenek Kael ke Epic, ditemukan di Bab 3 |

| Status | Berlaku untuk | Arti |
| --- | --- | --- |
| Terkendali | Musuh manusia | Dicuci otak entitas, bisa dibebaskan dengan Putus Sinyal |
| Goyah | Kael | Kesadaran rendah, lihat bagian bar kesadaran |
| Pingsan | Party | HP habis, tidak bisa beraksi sampai battle selesai |
| Lumpuh | Musuh manusia | HP habis, tidak bisa beraksi, tidak mati |
| DEF turun | Musuh | Efek Pindai, 3 giliran |
| Hang | Semua petarung | Melewatkan giliran berikutnya, akibat Overflow di kedalaman 4 atau stack yang runtuh karena Sela |
| Ragu | Pengikut sekte | Iman habis, berhenti bertarung |

## Bar kesadaran Kael

Kesadaran Kael bernilai 0 sampai 100 dan hanya berlaku untuknya, karena Nino kebal. Bar ini membuat pemain memilih kapan membawa Kael ke area berbahaya dan kapan membiarkannya beristirahat.

| Kesadaran | Tingkat | Efek pada Kael |
| --- | --- | --- |
| 51 sampai 100 | Stabil | Normal |
| 21 sampai 50 | Goyah | ATK turun 25 persen, peluang 20 persen melewatkan giliran |
| 1 sampai 20 | Kritis | Hanya bisa Bertahan, Tahan Diri, atau Barang |
| 0 | Diambil alih | Dua giliran menyerang sekutu dengan m = 0,5, lalu pulih ke 30 |

| Sumber | Perubahan |
| --- | --- |
| Jelajah di zona EM sedang | turun 1 setiap 5 langkah |
| Jelajah di zona EM tinggi | turun 1 setiap 2 langkah |
| Battle, tiap giliran Kael saat anomali EM masih hidup | turun 5 |
| Terkena serangan EM | turun 10 |
| Memakai skill Dengar | turun 15 |
| Istirahat di titik aman (rumah, tempat main game) | pulih penuh |
| Skill Tahan Diri atau item Headset Gaming | naik 25 atau 30 |

Game yang dimainkan Kael di titik aman menjadi jangkar kesadarannya, sesuai cerita novel.

## Musuh dan bos per bab

Nama masih placeholder. Pengikut sekte di Bab 5 tidak berstatus Terkendali, jadi Putus Sinyal tidak bisa dipakai melawan mereka, karena tidak ada sinyal yang bisa diputus. Pengikut sekte tidak punya HP: mereka dikalahkan lewat bar Iman dengan Serang dan kartu Bukti (lihat Battle System).

| Bab | Musuh | Tipe | HP | ATK | DEF | SPD | XP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Anomali Statis | Anomali EM | 20 | 7 | 2 | 4 | 12 |
| 1 | Lonjakan Sinyal (bos) | Anomali EM | 60 | 9 | 3 | 5 | 40 |
| 2 | Anomali Berdengung | Anomali EM | 35 | 11 | 4 | 6 | 20 |
| 2 | Warga Terkendali | Manusia | 45 | 10 | 3 | 5 | 18 |
| 2 | Gema Jaringan (bos) | Anomali EM | 110 | 13 | 5 | 6 | 60 |
| 3 | Anomali Siaran | Anomali EM | 55 | 15 | 6 | 7 | 28 |
| 3 | Peretas Terkendali | Manusia | 70 | 14 | 5 | 7 | 30 |
| 3 | Rekan yang Hilang (bos) | Manusia | 180 | 17 | 8 | 7 | 90 |
| 4 | Warga Terkendali Kuat | Manusia | 90 | 19 | 8 | 7 | 40 |
| 4 | Anomali Pusaran | Anomali EM | 100 | 22 | 10 | 9 | 45 |
| 4 | Orang Dekat Terkendali (bos) | Manusia | 280 | 24 | 12 | 8 | 140 |
| 5 | Pengikut Sekte | Manusia, beriman | Iman 100 | 26 | 14 | 8 | 55 |
| 5 | Pengawal Nabi (bos) | Manusia, beriman | Iman 200 | 28 | 15 | 10 | 200 |

Semua bos manusia dilumpuhkan atau dibebaskan, tidak dibunuh. Angka di tabel diuji dengan simulasi pada tahap build.

## Struktur data

Semua angka di atas disimpan sebagai data, bukan ditulis di dalam kode, supaya tuning tidak perlu mengubah logika game. Bentuk awalnya:

```json
{
  "karakter": {
    "id": "nino",
    "base": { "hp": 40, "atk": 8, "def": 4, "spd": 7 },
    "growth": { "hp": 8, "atk": 2, "def": 1 },
    "skills": ["pindai", "putus_sinyal"]
  },
  "musuh": {
    "id": "anomali_statis",
    "tipe": "em",
    "hp": 20, "atk": 7, "def": 2, "spd": 4,
    "xp": 12, "bos": false, "bisaDibebaskan": false
  },
  "skill": {
    "id": "putus_sinyal",
    "en": 4, "mult": 1.5,
    "multPerTipe": { "em": 2.0 },
    "bebasiDiBawahHpPersen": 30
  },
  "save": {
    "bab": 1,
    "area": "manado_rumah_nino",
    "party": {
      "nino": { "level": 1, "xp": 0, "hp": 40, "en": 5 },
      "kael": { "level": 1, "xp": 0, "hp": 50, "kesadaran": 100 }
    },
    "item": { "kopi_kaleng": 0, "baterai": 0, "headset_gaming": 0 },
    "bahan": { "benang": 0, "kain_perca": 0, "benang_emas": 0 },
    "equip": {
      "nino": { "topi": null, "baju": null, "gelang": null, "sepatu": null },
      "kael": { "topi": null, "baju": null, "gelang": null, "sepatu": null }
    },
    "itemMiliki": [],
    "pekerjaanNpc": []
  }
}
```

Bentuk data item, `itemMiliki`, dan `pekerjaanNpc` dirinci di Equipment.

## Urutan build dan verifikasi

Saya usul membangun Bab 1 sampai tuntas dulu sebagai irisan vertikal, baru Bab 2 sampai 5. Dengan begitu masalah kontrol dan keseimbangan ketahuan lebih awal.

1. **Kerangka:** canvas portrait, tile map, tap-to-move, kamera. Lulus jika karakter berjalan ke tile yang di-tap di layar 360 x 640 dan tidak menembus tembok.
2. **Dialog dan NPC:** Lulus jika tap NPC membuka dialog dan tap kotak dialog melanjutkannya sampai selesai.
3. **Mesin battle dari data:** mulai dari Stack, Retas Layar, dan Dengar. Balapan dan Bukti menyusul sesuai bab. Lulus jika simulasi 1.000 battle per bab dengan party di level target menang 70 sampai 90 persen untuk musuh biasa dan 50 sampai 70 persen untuk bos.
4. **Level, XP, bar kesadaran, equipment dasar, simpan:** equipment dasar berarti 4 slot, tier Normal dan Rare, plus dan minus. Lulus jika level naik sesuai tabel, bonus equipment masuk ke stat, dan data yang dimuat ulang sama dengan yang disimpan.
5. **Bab 1 lengkap:** Lulus jika pemain bisa memainkan dari awal sampai mengalahkan Lonjakan Sinyal di HP.
6. **Bab 2 sampai 5:** satu bab per tahap, tiap bab diuji dengan cara yang sama. Equipment menyusul per bab sesuai tabel di Equipment: cuci dan perbaikan di Bab 2, Epic di Bab 3, Legendary di Bab 4, Mythical di Bab 5.

PRD, dokumen ini, Battle System, dan Equipment sudah disetujui. Pertanyaan terbuka di PRD dan Equipment perlu dijawab sebelum konten bab terkait dibuat.
