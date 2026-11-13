// Isi Bab 1 | Fenomena alam. Draf dialog: ubah teks di sini, logika ada di index.html.
// Format baris: "Nama|teks". Nama kosong ("|teks") berarti narasi. Baris tanpa "|" diucapkan NPC yang diajak bicara.
export const BAB1 = {
  // tujuan per langkah cerita (save.cerita.langkah)
  tujuan: ["", "Bicara dengan Alisa di depan rumah", "Jemput Kael, bicara dengan Rin", "Hilangkan anomali di sekitar kompleks", "Cari sumber gangguan di selatan, dekat kolam", "Bab 1 selesai"],

  pembuka: [
    "|Manado, sore hari. Gempa kecil lagi, yang ketiga hari ini.",
    "|Lampu jalan berkedip. HP Nino bergetar sendiri, layarnya penuh garis.",
    "Nino|Tiga kali sehari... dan tiap kali, sinyal ikut kacau. Ini bukan gempa biasa.",
    "Nino|Kak Alisa pasti so di depan rumah. Tanya dia dulu.",
  ],

  alisa: {
    1: [
      "Nino, ngana rasa tadi? Gempa lagi. Kata berita cuma aktivitas gunung.",
      "Mar aneh, tiap gempa HP Kakak mati sendiri. TV tetangga juga.",
      "Ngana mau keliling periksa? Pakai ini dulu, jangan cuma kaos tipis.",
      "Ajak Kael. Dia dari tadi di rumah, tanya Tante Rin.",
    ],
    lain: [
      "So capek? Duduk dulu, Kakak buatkan teh.",
      "Kalau baju so kotor, bawa ke Kakak. Kakak cuci, gratis.",
    ],
  },
  rin: {
    1: [
      "Oh, Nino. Kael ada di dalam, main game terus dari tadi.",
      "So bicara dengan Alisa? Dia cari ngana tadi.",
    ],
    2: [
      "Nino! Mau ajak Kael keluar? Bagus, dia so tiga hari nyanda lihat matahari.",
      "Kael! Nino datang!",
      "Kael|Iyo, iyo... baru mau naik rank ini. Ada apa?",
      "Nino|Gempa tadi. Sinyal kacau tiap kali goyang. Kita mau periksa sekitar kompleks.",
      "Kael|...Ngana juga rasa? Tiap gempa, telinga kita berdenging. Kayak ada yang bisik.",
      "Ini sandal buat jalan. Tante pe anak itu kelihatan malas, mar dia kuat. Jaga dia, Nino.",
      "Kael|Oh, ini gelang karet dari nasi kuning tadi pagi. Katanya bawa hoki. Pakai jo.",
    ],
    lain: [
      "Kalau ada barang rusak, bawa ke Tante. Tante perbaiki.",
      "Hati-hati di jalan, kalian dua.",
    ],
  },

  sebelumBattle: [
    "Kael|Nino, lihat. Udara di situ... bergetar.",
    "Nino|Layar HP kita penuh statis. Ini sumbernya.",
    "Kael|Dia bisik-bisik. Kita bisa dengar apa yang dia mau buat, mar kepala kita sakit tiap dengar.",
    "Nino|Pelan-pelan. Serang, lalu Ulangi kalau berani. Kalau serakah, Overflow.",
  ],
  setelahAnomali: [
    "|Tanah bergoyang lebih keras. Semua lampu jalan padam sedetik.",
    "Kael|Itu... bukan dari bawah tanah. Bisikannya datang dari selatan.",
    "Nino|Dekat kolam. Sinyal di sana melonjak. Kalau capek, istirahat dulu di rumah.",
  ],
  sebelumBos: [
    "|Di tepi kolam, udara berdenyut seperti jantung.",
    "Kael|Yang ini besar. Dia cepat, Nino.",
    "Nino|Kita mantan pembalap. Kalau dia serobot giliran, kita adu start.",
    "|Balapan: tap GAS setelah lampu hijau. Jangan sebelum hijau.",
  ],
  penutup: [
    "|Lonjakan itu pecah menjadi derau, lalu sunyi. Lampu jalan menyala lagi.",
    "Kael|Hilang. Bisikannya juga.",
    "Nino|Besok berita bilang ini gempa vulkanik. Mar gempa nyanda meretas HP.",
    "Nino|Ada pola di sinyal tadi. Seperti... ada yang mengetik.",
    "|Bab 1 selesai | Bersambung ke Bab 2",
  ],

  hadiah: { alisa: ["topi_kardus", "kaos_oblong_pudar"], rin: ["sandal_jepit_biru", "gelang_karet_nasi_kuning"] },

  // titik anomali (langkah 3) dan bos (langkah 4)
  anomali: [
    { id: "a1", tx: 5, ty: 18, musuh: ["anomali_statis"] },
    { id: "a2", tx: 14, ty: 15, musuh: ["anomali_statis", "anomali_statis"] },
    { id: "a3", tx: 5, ty: 23, musuh: ["anomali_statis", "anomali_statis"] },
  ],
  bos: { id: "bos", tx: 10, ty: 27, musuh: ["lonjakan_sinyal"], bos: true },
};
