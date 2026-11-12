# Recursio | PRD v1

Diperbarui: 5 November 2026, disesuaikan dengan Battle System v1 dan Equipment v1

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
| Om Ferry (tangan kanan sekte) | Sosok kakak/ayah bagi Nino dan Kael, ragu pada sekte | Sekutu di awal, twist di Bab 5 |
| Nabi Zaviel (pemimpin sekte) | "Nabi" entitas, melakukan "mukjizat" | Antagonis manusia, mulai tampak di Bab 5 |
| Entitas | Kesadaran omnipresent, antagonis utama | Sumber anomali EM dan musuh non-manusia |
| Alisa | NPC, kakak perempuan Nino (belum ada di kerangka novel). Hubungannya terlihat dari dialog, nama yang tampil hanya Alisa | Job Cuci: mencuci equipment, gratis |
| Rin | NPC, ibu Kael (belum ada di kerangka novel). Hubungannya terlihat dari dialog, nama yang tampil hanya Rin | Job Perbaiki dan Upgrade equipment |

**Alur Bab 1 sampai 5**

| Bab | Fase novel | Inti cerita | Penekanan gameplay |
| --- | --- | --- | --- |
| 1 | Fenomena alam | Gempa makin sering, perangkat error, semua mengira fenomena geologis | Tutorial jelajah, dialog, battle pertama dengan anomali EM, Kael sudah ikut di party |
| 2 | Keanehan lokal | Nino melihat pola aneh di jaringan, hal-hal yang tak bisa dijelaskan | Rahasia perjuangan Kael terungkap, ganti karakter, investigasi |
| 3 | Komunitas diserang | Bug hunter dan AI enthusiast hilang satu per satu, Nino melacak ke kota lain | Banyak area, kumpulkan petunjuk |
| 4 | Brainwash | Orang di lingkungan Nino terpengaruh, siapa yang bisa dipercaya | Musuh warga yang dilumpuhkan, bar kesadaran Kael |
| 5 | Okultisme terungkap | Sekte dan nabinya muncul, tangan kanan sekte ternyata orang dekat | Bos pengikut sekte, twist, akhir versi 1 |

Versi 1 berakhir di Bab 5 setelah twist terungkap, jadi pemain pulang dengan pertanyaan, bukan jawaban.

## Peta dunia dan area

Versi 1 punya tiga jenis area. Penempatan per bab di bawah adalah usulan.

| Area | Bab | Suasana | Isi |
| --- | --- | --- | --- |
| Manado | 1, 2, 4, 5 | Urban, internet modern, gempa kecil, gunung berapi di kejauhan | Rumah Nino, rumah Kael, jalanan, pelabuhan, lokasi sekte |
| Makassar, Surabaya, dan Jakarta | 3 | Kota asing, jejak bug hunter yang hilang | Rumah dan tempat kerja korban, petunjuk digital |
| Kampung Tumou Dalam (fiktif, pedalaman Sulawesi Utara) | 4, 5 | Terisolasi, medan EM besar, horor lebih mentah | Kampung kerabat Nino, dampak entitas yang terlihat jelas |

Kampung Tumou Dalam sengaja fiktif agar bebas dikarang. Bab 3 berjalan berurutan: Makassar, Surabaya, lalu Jakarta, satu korban bug hunter per kota. Detail Manado harus akurat: budaya, bahasa, dan geografinya.

## Core loop

Satu putaran berlangsung beberapa menit dan berulang di setiap bab:

1. Jelajah map dan cari petunjuk.
2. Bicara dengan NPC, dialog mendorong cerita.
3. Temui anomali EM atau orang yang dikendalikan, battle turn-based dimulai.
4. Lumpuhkan musuh, dapat XP dan item.
5. Rawat equipment: cuci, perbaiki, atau upgrade lewat NPC job.
6. Naik level, lalu lanjut ke tujuan cerita berikutnya.
7. Selesaikan tujuan utama untuk membuka bab berikutnya.

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
| Jelajah | Ganti equipment | Buka menu, lalu tap slot dan item |
| Dialog | Lanjut teks | Tap kotak dialog |
| Battle | Pilih perintah | Tap tombol perintah |
| Battle | Pilih target | Tap musuh |
| Battle | Menumpuk aksi | Tap Ulangi atau Selesai |
| Battle | Dengar bisikan musuh | Tap Dengar |
| Battle | Retas Layar | Tap tombol asli, swipe notifikasi ke samping |
| Battle bos | Balapan | Tap tombol besar saat lampu hijau |
| Battle bos | Salip | Geser kartu Nino ke slot bos |
| Battle sekte | Kartu Bukti | Tap kartu Bukti |

Target sentuh minimal 44 piksel agar tidak salah tap.

## Sistem battle, level, dan HP

Battle turn-based dan non-lethal. Intinya adalah Stack, dengan empat mekanik pendukung: Retas Layar, Dua Telinga, Race Condition, dan Bukti (rincian di Battle System). Angka detail ada di Game System, dan item di dokumen Equipment.

| Elemen | Aturan awal (usulan) |
| --- | --- |
| Party | Nino dan Kael, keduanya bisa dimainkan dan bergantian giliran dengan musuh |
| HP | HP habis berarti pingsan atau lumpuh, bukan mati |
| Musuh manusia | Warga yang dicuci otak dan pengikut sekte, dilumpuhkan lalu sadar atau mundur |
| Musuh non-manusia | Anomali EM dari entitas, termasuk satu bos per bab |
| Nino | Kebal status kontrol dari entitas, bisa melewati area ber-EM tinggi |
| Kael | Punya bar kesadaran yang turun di dekat sumber EM, saat rendah aksinya terbatas |
| Level | XP dari battle dan cerita, naik level menaikkan HP dan kemampuan |
| Equipment | 4 slot per karakter, 5 tier, tiap item punya plus dan minus, perlu dicuci dan diperbaiki |

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
| Jelajah, dialog NPC, battle turn-based non-lethal dengan Stack dan empat mekanik pendukung | Quest sampingan yang kompleks |
| Level dan HP | Ekonomi uang |
| Simpan otomatis di perangkat | Akun online dan cloud save |
| Inventory sederhana, equipment 4 slot, tier Normal sampai Mythical, cuci, perbaiki, upgrade (bertahap per bab) | Perbaikan dan upgrade item Mythical |

**Pertanyaan terbuka**

- [x] Tangan kanan sekte bernama Om Ferry, pemimpin sekte bernama Nabi Zaviel (nama karangan, tidak mengikat novel).
- [x] Kampung Tumou Dalam (fiktif) untuk Bab 4 dan 5. Bab 3 di Makassar, Surabaya, dan Jakarta.
- [x] Ganti karakter bebas kapan saja saat jelajah. Di battle, keduanya selalu ada di party.
- [x] Dialog memakai bahasa Indonesia santai dengan sentuhan dialek Manado ringan.
- [x] Versi 1 berakhir tepat setelah twist di Bab 5.
- [x] Alisa (kakak Nino), Rin (ibu Kael), dan nenek Nino diperkenalkan khusus untuk game dulu. Nama dan latar mereka tidak mengikat novel.
- [x] Kael ada di party sejak Bab 1. Bab 2 menonjolkan rahasia perjuangan kesadarannya.

Dokumen turunan di folder yang sama: Game System (angka dan data), Battle System (mekanik battle), dan Equipment (item dan perawatannya).
