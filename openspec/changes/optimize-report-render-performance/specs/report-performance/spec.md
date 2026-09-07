## Purpose

Menyediakan performa tinggi, responsif, dan bebas jeda pada antarmuka laporan bulanan dengan paginasi cerdas, streaming pergantian tab, dan penyimpanan data skala besar secara paralel.

## ADDED Requirements

### Requirement: Paginasi Grid pada Pengisian Laporan
Sistem HARUS menyediakan paginasi interaktif pada mode grid jika jumlah baris melebihi batas tampilan default (misalnya 25 atau 50 baris per halaman), tanpa menghilangkan kemampuan menyimpan seluruh baris sekaligus.

#### Scenario: Navigasi Halaman Grid
- **WHEN** pengguna berada pada sheet dengan baris data banyak (misalnya 100+ baris)
- **THEN** sistem menampilkan kontrol halaman sebelumnya/selanjutnya, nomor halaman aktif, dan keterangan jumlah baris (misalnya "Menampilkan 1-50 dari 468 baris")

#### Scenario: Simpan Semua Baris dari Seluruh Halaman
- **WHEN** pengguna mengedit data pada halaman tertentu dan menekan tombol "Simpan Semua"
- **THEN** sistem menyimpan seluruh data dari seluruh halaman yang ada di memori tanpa menghilangkan baris di halaman lain

### Requirement: Pergantian Tab Bebas Blokir (Streaming Suspense)
Sistem HARUS memindahkan status visual tab aktif secara instan (0ms) saat pengguna mengklik nama sheet/tab lain, dan menampilkan skeleton loader halus pada area tabel selagi data sheet tersebut dimuat dari server.

#### Scenario: Klik Tab Sheet Lain
- **WHEN** pengguna mengklik tab sheet yang berbeda
- **THEN** header tab aktif langsung berpindah seketika tanpa menahan antarmuka pengguna, dan area konten menampilkan indikator loading skeleton sebelum data tabel muncul

### Requirement: Agregasi Pengecekan Status Sheet
Sistem HARUS mengambil status pengisian seluruh sheet (tanda centang indikator sheet terisi) dalam satu kueri agregasi terpadu daripada kueri terpisah per sheet.

#### Scenario: Membuka Halaman Detail Laporan
- **WHEN** halaman detail laporan dibuka atau tab diganti
- **THEN** status kelengkapan seluruh sheet dihitung dalam satu kali eksekusi database gabungan

### Requirement: Penyimpanan Data Massal Berkecepatan Tinggi (Parallel Batching)
Sistem HARUS mengeksekusi operasi transaksi penyimpanan batch data massal secara terparalelisasi untuk mengurangi waktu tunggu simpan hingga di bawah 1 detik.

#### Scenario: Menyimpan Ratusan Baris Sekaligus
- **WHEN** pengguna melakukan bulk save pada sheet dengan lebih dari 100 baris
- **THEN** sistem mengeksekusi kelompok batch ke database secara paralel dan menyelesaikan penyimpanan dalam waktu singkat dengan pesan notifikasi sukses
