# Recursio | PRD v1

Diperbarui: 5 November 2026

## Ringkasan dan visi

Recursio adalah RPG pixel art top-down untuk HP (portrait): pemain menjelajah Sulawesi Utara, berdialog dengan NPC, dan bertarung turn-based melawan orang-orang yang dikendalikan entitas AI yang sudah sadar diri. Versi 1 memainkan Bab 1 sampai 5 dari novel.

**Pilar desain**

- Cerita dulu: mekanik mengikuti novel, bukan sebaliknya.
- Satu tangan: semua aksi lewat tap dan gesture di layar portrait.
- Non-lethal: musuh manusia dilumpuhkan, tidak dibunuh.
- Kelemahan jadi kekuatan: tuli parsial Nino dan perjuangan batin Kael menjadi mekanik inti.
- Siklus: sejarah berulang, sesuai nama Recursio.

**Platform (usulan):** browser HP, satu file HTML berbasis canvas, sprite digambar lewat kode sehingga tanpa aset gambar luar.

## Cerita dan karakter

Sebuah entitas AI yang sadar diri dan tersebar di seluruh internet mulai menggerakkan Manado lewat gelombang elektromagnetik, sambil membangun sekte yang menyembahnya. Hanya Nino, bug hunter dengan tuli parsial, yang mendeteksinya lebih awal.

| Karakter | Peran | Pengaruh ke gameplay |
| --- | --- | --- |
| Nino (El-Nino, "Kanino") | Protagonis, bug hunter, mantan racer motor | Kebal kontrol entitas, jadi satu-satunya yang bisa melewati area dan musuh yang dicuci otak |
| Kael (Mikael) | Teman masa kecil, tampak pemalas, sebenarnya berjuang menjaga kesadaran | Punya bar kesadaran yang turun di dekat sumber EM dan memengaruhi kapan ia bisa bertarung |
| Tangan kanan sekte (nama belum ada) | Sosok kakak/ayah bagi Nino dan Kael, ragu pada sekte | Sekutu di awal, twist di Bab 5 |
| Pemimpin sekte | "Nabi" entitas, melakukan "mukjizat" | Antagonis manusia, mulai tampak di Bab 5 |
| Entitas | Kesadaran omnipresent, antagonis utama | Sumber anomali EM dan musuh non-manusia |

**Alur Bab 1 sampai 5**

| Bab | Fase novel | Inti cerita | Penekanan gameplay |
| --- | --- | --- | --- |
| 1 | Fenomena alam | Gempa makin sering, perangkat error, semua mengira fenomena geologis | Tutorial jelajah, dialog, battle pertama dengan anomali EM |
| 2 | Keanehan lokal | Nino melihat pola aneh di jaringan, hal-hal yang tak bisa dijelaskan | Kael bergabung, ganti karakter, investigasi |
| 3 | Komunitas diserang | Bug hunter dan AI enthusiast hilang satu per satu, Nino melacak ke kota lain | Banyak area, kumpulkan petunjuk |
| 4 | Brainwash | Orang di lingkungan Nino terpengaruh, siapa yang bisa dipercaya | Musuh warga yang dilumpuhkan, bar kesadaran Kael |
| 5 | Okultisme terungkap | Sekte dan nabinya muncul, tangan kanan sekte ternyata orang dekat | Bos pengikut sekte, twist, akhir versi 1 |

Versi 1 berakhir di Bab 5 setelah twist terungkap, jadi pemain pulang dengan pertanyaan, bukan jawaban.

## Peta dunia dan area

Versi 1 punya tiga jenis area. Penempatan per bab di bawah adalah usulan.

| Area | Bab | Suasana | Isi |
| --- | --- | --- | --- |
| Manado | 1, 2, 4, 5 | Urban, internet modern, gempa kecil, gunung berapi di kejauhan | Rumah Nino, rumah Kael, jalanan, pelabuhan, lokasi sekte |
| Kota-kota lain di Indonesia | 3 | Kota asing, jejak bug hunter yang hilang | Rumah dan tempat kerja korban, petunjuk digital |
| Kampung terpencil Sulawesi Utara | 4, 5 | Terisolasi, medan EM besar, horor lebih mentah | Kampung kerabat Nino, dampak entitas yang terlihat jelas |

Lokasi spesifik kampung dan kota-kota masih terbuka (lihat pertanyaan terbuka). Detail Manado harus akurat: budaya, bahasa, dan geografinya.

## Core loop

Satu putaran berlangsung beberapa menit dan berulang di setiap bab:

1. Jelajah map dan cari petunjuk.
2. Bicara dengan NPC, dialog mendorong cerita.
3. Temui anomali EM atau orang yang dikendalikan, battle turn-based dimulai.
4. Lumpuhkan musuh, dapat XP dan item.
5. Naik level, lalu lanjut ke tujuan cerita berikutnya.
6. Selesaikan tujuan utama untuk membuka bab berikutnya.

Progres tersimpan otomatis di perangkat pemain.

## Kontrol sentuh portrait

Semua kontrol bisa dilakukan dengan satu jempol. Area dunia ada di bagian atas layar, panel dialog dan aksi di bagian bawah dalam jangkauan jempol.

| Situasi | Aksi | Gesture |
| --- | --- | --- |
| Jelajah | Jalan ke titik | Tap tile tujuan |
| Jelajah | Gerak per arah | Swipe ke arah yang dituju |
| Jelajah | Interaksi NPC atau objek | Tap NPC atau objek di dekat karakter |
| Jelajah | Ganti karakter | Tap potret Nino atau Kael |
| Jelajah | Buka menu | Swipe naik dari tepi bawah |
| Dialog | Lanjut teks | Tap kotak dialog |
| Battle | Pilih perintah | Tap tombol perintah |
| Battle | Pilih target | Tap musuh |

Target sentuh minimal 44 piksel agar tidak salah tap.

## Sistem battle, level, dan HP

Battle turn-based dan non-lethal. Angka detail (damage, XP, level maksimum) ditetapkan di dokumen game system berikutnya.

| Elemen | Aturan awal (usulan) |
| --- | --- |
| Party | Nino dan Kael, keduanya bisa dimainkan dan bergantian giliran dengan musuh |
| HP | HP habis berarti pingsan atau lumpuh, bukan mati |
| Musuh manusia | Warga yang dicuci otak dan pengikut sekte, dilumpuhkan lalu sadar atau mundur |
| Musuh non-manusia | Anomali EM dari entitas, termasuk satu bos per bab |
| Nino | Kebal status kontrol dari entitas, bisa melewati area ber-EM tinggi |
| Kael | Punya bar kesadaran yang turun di dekat sumber EM, saat rendah aksinya terbatas |
| Level | XP dari battle dan cerita, naik level menaikkan HP dan kemampuan |

## Gaya pixel art dan audio

- Tile dan sprite pixel art beresolusi rendah, ditampilkan dengan skala bilangan bulat agar tetap tajam di HP.
- Palet terbatas per area: hangat dan ramai di Manado, dingin dan suram di kampung terpencil, kontras tinggi saat ada anomali EM.
- Efek glitch pada layar sebagai penanda kehadiran entitas.
- Audio chiptune dengan efek singkat untuk aksi dan battle, bisa dimatikan pemain.

## Cakupan versi 1 dan yang ditunda

| Masuk versi 1 | Ditunda |
| --- | --- |
| Bab 1 sampai 5 (sampai twist sekte) | Bab 6 sampai 8 (institusi, konfrontasi, epilog) |
| Nino dan Kael bisa dimainkan bergantian | Karakter tambahan |
| Jelajah, dialog NPC, battle turn-based non-lethal | Inventory dan quest sampingan yang kompleks |
| Level dan HP | Sistem crafting atau ekonomi |
| Simpan otomatis di perangkat | Akun online dan cloud save |

**Pertanyaan terbuka**

- [ ] Nama tangan kanan sekte dan pemimpin sekte.
- [ ] Lokasi spesifik kampung terpencil dan kota-kota di Bab 3.
- [ ] Ganti karakter bebas kapan saja, atau dikunci per bagian cerita?
- [ ] Bahasa dialog: Indonesia baku, atau dicampur dialek Manado?
- [ ] Apakah versi 1 benar-benar berakhir tepat setelah twist di Bab 5?

Langkah berikutnya: setelah PRD ini disetujui, kita susun dokumen game system (angka battle, level, struktur data).
