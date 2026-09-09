## Why

Pengguna merasakan lag yang signifikan (1–2 detik) saat berpindah halaman dan antar tab laporan. Audit menunjukkan dua penyebab utama yang dapat diperbaiki tanpa mengubah arsitektur besar: (1) Vercel serverless function berjalan di region Washington DC (iad1) sementara database Neon ada di Singapura (ap-southeast-1), menyebabkan setiap query database menanggung latency round-trip ~560ms; dan (2) setiap request render halaman menjalankan beberapa database query secara berurutan padahal sebagian besar dapat diparalelkan.

## What Changes

- **Pindah Vercel deployment region ke Singapura (`sin1`)**: Menambahkan `vercel.json` dengan konfigurasi `regions: ["sin1"]` agar serverless function berjalan co-located dengan database Neon, memotong latency DB dari ~560ms menjadi ~10ms per query.
- **Paralelisasi query di `ReportDetailPage`**: Menggabungkan query yang saat ini berjalan sekuensial (`canEditReport`, `db.site.findUnique`, `getReportSectionStatusMap`, `db.reportStatusLog`) ke dalam `Promise.all` setelah data report pertama tersedia, memangkas waterfall query.
- **Deduplikasi `getAccessibleSiteIds` via `React.cache`**: Fungsi ini dipanggil berulang kali dalam satu request (di layout, di `canEditReport`, di halaman laporan). Membungkusnya dengan `React.cache()` memastikan hasil query hanya dihitung sekali per request.
- **Tambahkan `connection_limit` & `pool_timeout` pada DATABASE_URL**: Mengoptimalkan parameter koneksi Neon untuk serverless environment agar koneksi tidak mengantri berlebihan.

## Capabilities

### New Capabilities

- `server-performance`: Konfigurasi deployment region dan optimasi query parallelization untuk mempercepat server render.

### Modified Capabilities

<!-- None — perubahan ini bersifat infrastruktur dan optimasi internal, tidak mengubah perilaku yang terlihat oleh pengguna (kapabilitas yang ada tidak berubah kontraknya). -->

## Impact

- **Affected Files**:
  - `vercel.json` [NEW]: Konfigurasi region deployment Vercel.
  - `app/(app)/reports/[id]/page.tsx`: Paralelisasi query di `ReportDetailPage`.
  - `lib/report-service.ts`: Bungkus `getAccessibleSiteIds` dengan `React.cache`.
  - `.env.example`: Tambahkan parameter koneksi Neon yang direkomendasikan.
- **Dependencies**: Tidak ada paket baru. Menggunakan `React.cache` (sudah tersedia di React 19 yang sedang dipakai).
- **User Experience**: Estimasi pengurangan waktu load halaman laporan dari ~1.5–2.5 detik menjadi ~300–600ms; waktu pindah tab berkurang ~60%.
- **Deployment**: Setelah `vercel.json` di-push, Vercel akan rebuild dan redeploy otomatis ke region Singapura. Tidak ada downtime.
