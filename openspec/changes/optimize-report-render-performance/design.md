## Context

Lihat `proposal.md - Why` untuk latar belakang permasalahan performa render dan latensi.
Arsitektur saat ini menggunakan Next.js 16 App Router (RSC) dengan Neon serverless PostgreSQL via Prisma ORM 7 (`@prisma/adapter-neon`). Halaman laporan `ReportDetailPage` merender navigasi sheet berbasis URL query param (`?tab=...`), dengan grid pengisian interaktif di `SectionPanel`.

## Goals / Non-Goals

**Goals:**
- Mereduksi latensi navigasi perpindahan sheet dari 1.5 detik menjadi instan (sub-150ms).
- Mereduksi konsumsi memori dan elemen DOM browser pada sheet besar hingga 90% melalui paginasi cerdas di client.
- Mengoptimalkan responsivitas pengetikan (input latency) pada form grid menjadi lancar (60 FPS).
- Mempercepat waktu eksekusi simpan massal (bulk save) di database hingga sub-1 detik dengan batch transaksi paralel.

**Non-Goals:**
- Mengubah skema model database atau struktur relasi data.
- Mengubah tata letak atau field data pada form dan grid laporan.
- Mengganti arsitektur Prisma dengan raw SQL sepenuhnya (hanya menggunakan kueri agregasi terpadu untuk pengecekan status).

## Decisions

### 1. Client-Side Pagination pada Grid State
- **Keputusan**: Implementasikan paginasi di `SectionPanel` untuk membatasi jumlah baris yang dirender ke DOM (default 50 baris per halaman, dengan pemilih 25, 50, 100, Semua). State `gridRows` tetap menyimpan seluruh data di memori sehingga "Simpan Semua" tetap memproses seluruh baris.
- **Alternatif yang Dipertimbangkan**:
  - *Virtual scrolling (react-window/tanstack-virtual)*: Membutuhkan tinggi baris tetap (*fixed row height*), rumit untuk input yang membungkus teks (*auto-wrap*) atau dropdown.
  - *Server-side pagination*: Mengharuskan roundtrip ke server setiap ganti halaman dan mempersulit penyimpanan massal dalam satu sesi edit.

### 2. Single Aggregated Query untuk Status Centang Sheet
- **Keputusan**: Buat fungsi `getReportSectionStatusMap(reportId, isAreaReport)` yang menjalankan 1 query SQL terpadu untuk mengecek keberadaan data di seluruh tabel section yang relevan.
- **Alternatif yang Dipertimbangkan**:
  - *Menghapus centang hijau*: Menghilangkan petunjuk visual penting bagi PIC mengenai progress pengisian.
  - *Cache Redis/In-memory*: Berisiko menampilkan data stale jika ada edit dari sesi lain tanpa arsitektur invalidasi terpusat.

### 3. React Suspense Streaming pada Tab Sheet
- **Keputusan**: Pisahkan komponen tab menjadi Suspense boundary. Bagian header tab (navigasi) merespons seketika pada klik pengguna, sementara konten tabel dimuat melalui streaming dengan skeleton loader yang elegan.
- **Alternatif yang Dipertimbangkan**:
  - *Pindah ke client-side state*: Menyulitkan bookmarking, deep-linking langsung ke tab tertentu (`?tab=area-mobil`), dan reload browser.

### 4. Parallel Batch Chunking pada Bulk Save
- **Keputusan**: Pada `saveRowsBulk`, kelompokkan chunk menjadi wave berukuran 2-3 chunk paralel (`Promise.all`), mengurangi total roundtrip HTTP ke database Neon dari 10 kali menjadi 3 kali.
- **Alternatif yang Dipertimbangkan**:
  - *Jalankan semua 10 chunk serentak*: Berpotensi melebihi connection limit pool serverless Neon.

### 5. Memoization `GridRow` dengan `React.memo`
- **Keputusan**: Pisahkan `GridRow` menjadi komponen ter-memoize dengan pembanding baris (`prevRow === nextRow`), sehingga pengetikan pada baris ke-5 tidak memicu re-render pada baris ke-1 hingga 4 dan 6 hingga 50.

## Risks / Trade-offs

- **[Risk] State baris di halaman lain terlewat saat validasi simpan**:
  $\rightarrow$ *Mitigasi*: Fungsi `handleBulkSave` dan `saveRowsBulk` tetap memvalidasi seluruh elemen dalam array `gridRows` lengkap, bukan hanya baris yang sedang aktif ditampilkan di halaman paginasi.
- **[Risk] Neon connection pool exhaustion jika chunk paralel terlalu banyak**:
  $\rightarrow$ *Mitigasi*: Batasi konkurensi paralel maksimal 3 batch bersamaan menggunakan helper batch runner.
