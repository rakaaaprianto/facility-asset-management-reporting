## Context

Aplikasi berjalan di Vercel (serverless) dengan database Neon Postgres di `ap-southeast-1` (Singapura). Vercel secara default mendeploy serverless function ke region terdekat dari si pembuat project (kemungkinan besar `iad1`, Washington DC). Setiap query database menanggung latency ~560ms (round-trip cross-continental). Ini adalah penyebab terbesar lag yang dirasakan pengguna saat membuka halaman laporan. Selain itu, `ReportDetailPage` menjalankan 6–7 query secara sekuensial; sebagian besar tidak saling bergantung dan bisa dieksekusi paralel.

## Goals / Non-Goals

**Goals:**
- Pindahkan serverless function Vercel ke region Singapura (`sin1`) agar co-located dengan database
- Paralelkan query yang tidak saling bergantung di `ReportDetailPage`
- Cegah duplikasi query `getAccessibleSiteIds` dalam satu server request menggunakan `React.cache`
- Tambahkan parameter koneksi Neon yang optimal untuk serverless (`pool_timeout`, `connection_limit`)

**Non-Goals:**
- Tidak mengubah navigasi tab menjadi client-side fetch (terlalu besar perubahan arsitektur, ditunda)
- Tidak menambahkan Redis/in-memory cache eksternal
- Tidak mengubah struktur schema database atau model Prisma

## Decisions

### 1. `vercel.json` dengan `regions: ["sin1"]`

**Keputusan**: Menambahkan file `vercel.json` di root project dengan:
```json
{
  "regions": ["sin1"]
}
```

**Alasan**: Ini adalah cara resmi Vercel untuk mengatur deployment region per-project. Vercel membaca file ini saat build. Tidak ada perubahan kode runtime yang dibutuhkan.

**Alternatif yang dipertimbangkan**:
- Ganti region via Vercel Dashboard (Settings → Functions) → Tidak ada opsi ini di UI dashboard untuk project yang sudah ada di free tier; `vercel.json` lebih reliable dan version-controlled.
- Pindah database ke region US → Tidak disarankan karena pengguna ada di Indonesia; database Singapura lebih dekat ke pengguna akhir.

---

### 2. Paralelisasi query di `ReportDetailPage` menggunakan `Promise.all`

**Saat ini (sekuensial)**:
```
db.monthlyReport.findUnique()          ← perlu dulu untuk validasi
  → getAccessibleSiteIds()             ← perlu siteId dari report
    → canEditReport()                  ← memanggil DB sendiri untuk report yang sama
      → db.site.findUnique()           ← perlu report.siteId
        → getReportSectionStatusMap()  ← perlu report.id
        → db.reportStatusLog.findMany  ← perlu report.id
```

**Setelah optimasi**:
```
db.monthlyReport.findUnique()                       ← 1 query sequential (dibutuhkan semua)
  ↓ (semua berikut ini start bersamaan)
  ├── getAccessibleSiteIds()                        ← paralel
  ├── canEditReport()  ← refactor: terima report sebagai param, tanpa re-query
  ├── db.site.findUnique({ id: report.siteId })     ← paralel
  ├── getReportSectionStatusMap(id)                 ← paralel
  └── db.reportStatusLog.findMany()                 ← paralel
```

**Keputusan**: `canEditReport` akan direfactor untuk menerima object `report` yang sudah ada sebagai parameter opsional, menghindari re-query database untuk report yang sama. Atau, cukup ekstrak logika validasi ke fungsi helper yang tidak menyentuh DB jika report sudah diketahui.

**Alternatif**: Biarkan `canEditReport` memanggil DB sendiri, tapi jalankan semua dalam `Promise.all` — lebih simpel dan tidak perlu mengubah signature fungsi. Ini yang dipilih untuk meminimalkan perubahan.

---

### 3. `React.cache` untuk `getAccessibleSiteIds`

**Keputusan**: Bungkus `getAccessibleSiteIds` dengan `React.cache()` di `lib/report-service.ts`:

```ts
import { cache } from "react";

export const getAccessibleSiteIds = cache(async (user: SessionUser): Promise<string[]> => {
  // ... existing logic
});
```

**Alasan**: `React.cache` menyediakan per-request memoization yang otomatis reset antar request. Fungsi ini dipanggil di `AppLayout` (oleh `requireUser`) dan di halaman laporan, sehingga tanpa cache ada 2+ query identik per page load.

**Alternatif**: `unstable_cache` dari Next.js — lebih kompleks, perlu key dan revalidation config. `React.cache` lebih tepat untuk per-request deduplication tanpa cross-request sharing.

---

### 4. Parameter koneksi Neon untuk serverless

Tambahkan ke `DATABASE_URL` (atau konfigurasi adapter):
```
?pool_timeout=10&connection_limit=1
```

**Alasan**: Serverless function hidup singkat; terlalu banyak koneksi simultan bisa menyebabkan antrian di Neon. `connection_limit=1` per function instance adalah best practice Prisma + serverless.

## Risks / Trade-offs

- **[Risk] Vercel region `sin1` bisa saja punya sedikit lebih banyak cold start jika traffic rendah** → Mitigasi: dampak cold start tetap ada tapi total durasi lebih pendek karena latency DB berkurang drastis.
- **[Risk] `Promise.all` yang gagal satu saja akan reject semua** → Mitigasi: `canEditReport` dan `getReportSectionStatusMap` sudah mengembalikan nilai default yang aman (`{ok: false}` dan empty map); gunakan `Promise.allSettled` jika diperlukan, atau biarkan error propagate ke Next.js error boundary (behavior saat ini sudah begitu).
- **[Risk] `React.cache` hanya berlaku di Server Components** → Fungsi ini sudah `"server-only"`, tidak ada risiko dipanggil dari client.

## Migration Plan

1. Tambahkan `vercel.json` → push ke GitHub → Vercel auto-redeploy ke `sin1`
2. Update `lib/report-service.ts` dengan `React.cache`
3. Refactor `ReportDetailPage` dengan `Promise.all`
4. Update `DATABASE_URL` di Vercel Environment Variables (atau `.env.example` untuk dokumentasi)
5. Verifikasi di Vercel dashboard: Functions → region `sin1` ✓

**Rollback**: Hapus `regions` dari `vercel.json` dan push lagi → Vercel kembali ke region default.
