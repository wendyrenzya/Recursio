# Aset gambar generate | Recursio

Tumbuhan, kolam, kebun, dan tekstur tanah memakai gambar hasil generate supaya tidak kaku. Rumah, lampu, dan karakter tetap 3D.

## Cara kirim

- Simpan setiap gambar di folder `assets/gen/` dengan nama file persis seperti tabel di bawah. Format PNG atau JPG (hasil Google Flow berupa JPG, cukup ganti akhiran nama menjadi .jpg, misalnya `tree_1.jpg`).
- Tepi keunguan sisa kompresi JPG di sekitar latar magenta dibersihkan saat dipasang.
- Ukuran minimal sisi terpendek 1024 piksel. Rasio mengikuti tabel; ukuran persisnya nanti dirapikan saat dipasang.
- Gambar dengan latar magenta (#FF00FF): latarnya dihapus otomatis saat dipasang. Kalau latarnya tidak rata atau ada bayangan di tanah, generate ulang.
- Semua gambar memakai gaya yang sama: lukisan latar anime, cahaya lembut dari kiri atas.

## Daftar aset

| File | Isi | Rasio | Latar | Dipakai untuk |
| --- | --- | --- | --- | --- |
| tree_1.png | Pohon ketapang | 2:3 tegak | Magenta | Pohon di peta dan hutan pinggir |
| tree_2.png | Pohon mangga | 2:3 tegak | Magenta | Pohon di peta dan hutan pinggir |
| tree_3.png | Pohon trembesi besar | 2:3 tegak | Magenta | Hutan pinggir |
| palm_1.png | Pohon kelapa tinggi melengkung | 2:3 tegak | Magenta | Palem |
| palm_2.png | Pohon kelapa pendek berbuah | 2:3 tegak | Magenta | Palem |
| bush_1.png | Semak puring dan perdu tropis | 4:3 mendatar | Magenta | Semak tepi peta |
| bush_2.png | Semak bugenvil berbunga merah muda | 4:3 mendatar | Magenta | Semak tepi peta dan pekarangan |
| flowers_1.png | Rumpun bunga liar kecil | 1:1 | Magenta | Hiasan di rumput |
| pond.png | Kolam alami dilihat dari atas | 5:4 mendatar | Magenta di luar tepi kolam | Kolam di selatan |
| garden.png | Kebun sayur pekarangan dilihat dari atas | 2:1 mendatar | Penuh, tanpa latar | Kebun di samping rumah Nino |
| grass.png | Tekstur rumput bersambung | 1:1 | Penuh, tanpa latar | Tanah rumput |
| asphalt.png | Tekstur aspal bersambung | 1:1 | Penuh, tanpa latar | Jalan |

## Prompt

Prompt ditulis dalam bahasa Inggris karena hasil generator gambar biasanya lebih patuh.

### tree_1.png

```
A single tropical ketapang tree (Terminalia catappa) with layered horizontal branches and a wide leafy canopy, seen from a high three-quarter angle about 45 degrees from above, the whole tree visible from the base of the trunk to the top of the canopy, centered, trunk base at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no grass, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, clean readable shapes, Studio Ghibli inspired, vibrant tropical greens, soft daylight from the upper left. Portrait 2:3, no text, no watermark.
```

### tree_2.png

```
A single mango tree with a dense rounded dark green canopy and a sturdy brown trunk, seen from a high three-quarter angle about 45 degrees from above, the whole tree visible from the base of the trunk to the top of the canopy, centered, trunk base at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no grass, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, clean readable shapes, Studio Ghibli inspired, vibrant tropical greens, soft daylight from the upper left. Portrait 2:3, no text, no watermark.
```

### tree_3.png

```
A single large rain tree (Samanea saman, trembesi) with a very wide umbrella shaped canopy and a thick trunk, seen from a high three-quarter angle about 45 degrees from above, the whole tree visible from the base of the trunk to the top of the canopy, centered, trunk base at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no grass, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, clean readable shapes, Studio Ghibli inspired, vibrant tropical greens, soft daylight from the upper left. Portrait 2:3, no text, no watermark.
```

### palm_1.png

```
A single tall coconut palm tree with a slender gently curved trunk with ring marks and a full crown of long drooping fronds, seen from a high three-quarter angle about 45 degrees from above, the whole palm visible from the base of the trunk to the top of the fronds, centered, trunk base at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no sand, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, clean readable shapes, Studio Ghibli inspired, vibrant tropical greens, soft daylight from the upper left. Portrait 2:3, no text, no watermark.
```

### palm_2.png

```
A single short young coconut palm tree with a straight thick trunk, a bushy crown of arching fronds and a cluster of green coconuts, seen from a high three-quarter angle about 45 degrees from above, the whole palm visible from the base of the trunk to the top of the fronds, centered, trunk base at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no sand, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, clean readable shapes, Studio Ghibli inspired, vibrant tropical greens, soft daylight from the upper left. Portrait 2:3, no text, no watermark.
```

### bush_1.png

```
A single rounded tropical shrub made of croton plants with red, yellow and green leaves mixed with leafy green bushes, seen from a high three-quarter angle about 45 degrees from above, the whole shrub visible, centered, base of the shrub at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no soil, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, clean readable shapes, Studio Ghibli inspired, soft daylight from the upper left. Landscape 4:3, no text, no watermark.
```

### bush_2.png

```
A single rounded bougainvillea shrub covered in bright pink flowers with green leaves, seen from a high three-quarter angle about 45 degrees from above, the whole shrub visible, centered, base of the shrub at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no soil, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, clean readable shapes, Studio Ghibli inspired, soft daylight from the upper left. Landscape 4:3, no text, no watermark.
```

### flowers_1.png

```
A small clump of wild flowers and grass tufts, little pink, white and yellow blossoms on short green stems, seen from a high three-quarter angle about 45 degrees from above, centered, base of the clump at the bottom center of the image. Isolated on a pure flat solid magenta background (#FF00FF), no ground, no soil, no cast shadow, no other objects. Stylized hand-painted anime background art, soft painterly shading, Studio Ghibli inspired, soft daylight from the upper left. Square 1:1, no text, no watermark.
```

### pond.png

```
Straight top-down orthographic view looking directly down at a small natural garden pond with a soft irregular rounded shape that fills most of the frame. Clear blue-green water with gentle ripples and soft sky reflections, a few lily pads with small pink water lilies, smooth grey river stones and short tufts of grass along the bank. Everything outside the outer edge of the bank is a pure flat solid magenta background (#FF00FF). No perspective, no horizon, no cast shadows on the magenta area. Stylized hand-painted anime background art, soft painterly shading, Studio Ghibli inspired, even soft daylight. Landscape 5:4, no text, no watermark.
```

### garden.png

```
Straight top-down orthographic view looking directly down at a small home vegetable garden that fills the entire frame edge to edge: two long raised beds of dark brown soil side by side with simple wooden edging, planted with rows of lettuce, small tomato plants with red tomatoes, and chili plants, a narrow soil path between the beds. No perspective, no horizon, no background, no border. Stylized hand-painted anime background art, soft painterly shading, Studio Ghibli inspired, even soft daylight. Landscape 2:1, no text, no watermark.
```

### grass.png

```
Seamless tileable texture, straight top-down orthographic view of a short green lawn, fine grass blades with subtle color variation and a few small clover patches, even soft lighting with no shadows from objects, no flowers, no stones, no paths, uniform density so it repeats without visible seams. Stylized hand-painted anime background art, soft painterly look, Studio Ghibli inspired, vibrant natural green. Square 1:1, no text, no watermark.
```

### asphalt.png

```
Seamless tileable texture, straight top-down orthographic view of a slightly worn dark grey asphalt road surface with fine aggregate and very subtle tonal variation, even soft lighting, no road markings, no lines, no large cracks, no puddles, uniform so it repeats without visible seams. Stylized hand-painted anime background art, soft painterly look, Studio Ghibli inspired. Square 1:1, no text, no watermark.
```
