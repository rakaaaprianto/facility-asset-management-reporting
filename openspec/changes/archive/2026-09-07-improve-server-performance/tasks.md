## 1. Konfigurasi Deployment Region Vercel

- [x] 1.1 Buat file `vercel.json` di root project dengan isi `{ "regions": ["sin1"] }` dan verifikasi file ada di root (`c:\Project\infomedia-monthly-report\vercel.json`) dengan konten valid JSON.
- [x] 1.2 Perbarui `.env.example`

## 2. Deduplikasi Query `getAccessibleSiteIds` via `React.cache`

- [x] 2.1 Di `lib/report-service.ts`, tambahkan `import { cache } from "react"` dan bungkus fungsi `getAccessibleSiteIds` dengan `cache(...)`.
- [x] 2.2 Verifikasi semua pemanggilan `getAccessibleSiteIds(user)` — signature tidak berubah, 6 caller tetap sama.

## 3. Paralelisasi Query di `ReportDetailPage`

- [x] 3.1 Di `app/(app)/reports/[id]/page.tsx`, paralelkan 5 query via `Promise.all` setelah `db.monthlyReport.findUnique()` selesai. TypeScript clean.
- [x] 3.2 Data dari `Promise.all` digunakan benar di semua JSX; `currentTabs`, `activeKey`, `filled` tetap ada. TypeScript clean.

## 4. Push & Verifikasi Deployment

- [x] 4.1 Commit semua perubahan dan push ke GitHub. Vercel auto-trigger build baru (commit c8b5d60).
- [ ] 4.2 Setelah deploy selesai, buka Vercel Dashboard → project → tab "Functions" dan verifikasi bahwa function region menampilkan `sin1` (Singapura), bukan `iad1` atau region lain.
- [ ] 4.3 Uji performa secara manual: buka halaman detail laporan yang terisi data (misal laporan Area 2 dengan 468 baris), pindah-pindah antar tab sheet, dan verifikasi waktu respons terasa lebih cepat dari sebelumnya (target <800ms per navigasi).
