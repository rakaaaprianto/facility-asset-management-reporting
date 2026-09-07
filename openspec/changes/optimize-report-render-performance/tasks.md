## 1. Paginasi Grid & Optimasi DOM Client (SectionPanel)

- [x] 1.1 Tambahkan state paginasi (`page`, `pageSize`) dengan opsi limit (25, 50, 100, Semua) di `components/report/section-panel.tsx` dan verifikasi baris terpotong rapi sesuai halaman aktif.
- [x] 1.2 Buat kontrol navigasi halaman (tombol Prev, Next, indikator halaman, dan ringkasan "Menampilkan X-Y dari Z baris") di bawah tabel grid `SectionPanel` dan verifikasi interaksi berpindah halaman berjalan mulus.
- [x] 1.3 Pastikan fungsi `handleBulkSave` tetap memvalidasi dan mengirim seluruh data dalam array `gridRows` (bukan hanya halaman aktif) dan verifikasi data tersimpan utuh.
- [x] 1.4 Bungkus `GridRow` dengan `React.memo` dengan pembanding baris untuk mengisolasi render tiap sel, dan verifikasi pengetikan karakter bebas lag (60 FPS).
- [x] 1.5 Buat header tabel grid menjadi sticky (`sticky top-0 z-20`) di dalam container dengan `max-h` scroll agar nama kolom selalu terlihat saat scroll ke bawah.

## 2. Agregasi Query Database & Streaming Suspense (ReportDetailPage)

- [x] 2.1 Buat fungsi kueri agregasi `getReportSectionStatusMap` di `lib/report-service.ts` untuk menggantikan 11 kueri terpisah `hasSectionRows` dalam satu query SQL terpadu, dan verifikasi peta status centang terisi dengan akurat.
- [x] 2.2 Buat komponen skeleton loader `SectionTableSkeleton` untuk area konten tabel saat sheet sedang dimuat.
- [x] 2.3 Bungkus pemanggilan `SectionTab` pada `app/(app)/reports/[id]/page.tsx` dengan React `<Suspense>` menggunakan skeleton loader tersebut, dan verifikasi klik tab sheet berpindah instan tanpa jeda blokir navigasi.

## 3. Optimasi Kecepatan Simpan Massal (saveRowsBulk)

- [x] 3.1 Perbarui fungsi `saveRowsBulk` di `lib/report-actions.ts` untuk mengeksekusi chunk batch transaksi secara paralel (maksimal konkurensi 2-3 batch bersamaan menggunakan `Promise.all`), dan verifikasi waktu eksekusi berkurang drastis tanpa error pool database.
- [x] 3.2 Lakukan verifikasi menyeluruh pada sheet dengan data besar (Laporan Mobil Operasional 468 baris dan Kerusakan 194 baris) untuk memastikan waktu simpan dan pergantian tab berlangsung cepat dan stabil.
