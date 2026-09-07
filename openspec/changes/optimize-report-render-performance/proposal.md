## Why

Laporan bulanan khususnya laporan Area 2 memiliki ratusan baris data per sheet (misal Mobil Operasional 468 baris, Layanan 240 baris, Kerusakan 194 baris, Air Minum 131 baris). Pada skala data ini, pengguna mengalami penurunan performa yang signifikan:
1. **Pindah Sheet/Tab Terasa Lambat (Ada Loading 1-2 detik)**: Server mengeksekusi 18+ query database terpisah (termasuk 11 query `hasSectionRows` berulang) pada setiap klik tab tanpa React Suspense streaming.
2. **Ketik dan Render Tabel Berat (DOM Overload)**: Browser merender seluruh 8.400+ input form control secara serentak tanpa paginasi, memicu freeze main thread dan lag saat input karakter.
3. **Penyimpanan Bulk Data Memakan Waktu (3-5 detik)**: Batch transaksi dieksekusi sekuensial dan `revalidatePath` memaksa eksekusi ulang 18+ query halaman sebelum merespons user.

Optimasi performa ini krusial agar pengisian dan navigasi laporan bulanan berlangsung instan, responsif (60 FPS), dan efisien.

## What Changes

- **Agregasi Query Status Sheet (1 Query Pengganti 11 Query)**: Menggabungkan pengecekan keberadaan data 11 sheet laporan menjadi satu query agregasi tunggal di PostgreSQL, memangkas latensi koneksi database.
- **Paginasi Grid Cerdas (Client-side Pagination)**: Menambahkan paginasi (25, 50, 100 baris per halaman, atau Tampilkan Semua) pada grid input di `SectionPanel`, menurunkan beban elemen DOM dari 8.400 elemen menjadi ~500 elemen tanpa mengurangi kemampuan menyimpan semua data sekaligus.
- **React Suspense & Skeleton Streaming pada Tab Sheet**: Membungkus komponen konten sheet (`SectionTab`) dengan Suspense boundary sehingga pergantian header tab terjadi instan (0ms) dengan skeleton loader halus saat data dimuat.
- **Paralelisasi Batch Transaction pada Bulk Save**: Mengeksekusi chunk penyimpanan database secara paralel (`Promise.all`) daripada sekuensial, memangkas durasi simpan murni database hingga 60%.
- **Memoization Komponen GridRow (`React.memo`)**: Mengisolasi re-render pada baris yang diedit saja, mencegah re-render tabel penuh saat pengguna mengetik.

## Capabilities

### New Capabilities
- `report-performance`: Optimasi performa render grid dengan paginasi, streaming pergantian tab dengan React Suspense, dan paralelisasi penyimpanan bulk data pada laporan bulanan.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Components**:
  - `app/(app)/reports/[id]/page.tsx`: Agregasi query status sheet, Suspense boundary untuk tab streaming.
  - `components/report/section-panel.tsx`: Kontrol paginasi (prev, next, selector limit), memoized row render.
  - `lib/report-service.ts`: Fungsi `getReportSectionStatusMap()` terpadu.
  - `lib/report-actions.ts`: Paralelisasi chunk bulk save dan revalidasi terfokus.
- **Dependencies**: Tidak ada penambahan library baru; memanfaatkan fitur bawaan React 19, Next.js 16, dan Prisma batch queries.
- **User Experience**: Navigasi tab instan, pengetikan form responsif 60 FPS, waktu simpan bulk berkurang dari ~4 detik menjadi <1 detik.
