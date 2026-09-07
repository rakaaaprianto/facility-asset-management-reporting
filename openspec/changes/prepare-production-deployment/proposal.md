## Why

Sistem AMRS Infomedia saat ini menyimpan file lampiran (attachment) langsung ke filesystem lokal server (`process.cwd()/storage/uploads`). Jika aplikasi dideploy ke Vercel (serverless platform), filesystem bersifat ephemeral (sementara dan read-only), sehingga file yang diunggah akan hilang seketika saat instance serverless mendaur ulang atau cold-start.

Untuk rilis produksi tahap pertama di Vercel (periode uji coba 1 bulan) sebelum opsi migrasi ke server perusahaan / VPS mandiri, sistem membutuhkan penyimpanan objek cloud yang kompatibel S3 (Cloudflare R2 — gratis tanpa biaya egress bandwidth) yang diabstraksikan melalui storage driver fleksibel (`STORAGE_DRIVER=r2` vs `STORAGE_DRIVER=local`), pembersihan konfigurasi origin tunnel, dan pengamanan kredensial.

## What Changes

- **Penyedia Object Storage Cloud S3/R2**: Mengintegrasikan `@aws-sdk/client-s3` untuk mengunggah, mengunduh, dan menghapus lampiran ke bucket Cloudflare R2 secara streaming/buffer.
- **Abstraksi Multi-Storage Driver**: Menyediakan abstraction layer (`lib/storage.ts`) sehingga aplikasi dapat berganti antara Cloudflare R2 dan penyimpanan lokal (`local`) hanya dengan mengubah nilai environment variable tanpa menyentuh kode aplikasi ataupun skema database.
- **Pembersihan Origin & Header Produksi**: Menghapus domain tunnel pengembangan (`*.trycloudflare.com`, `*.pinggy.link`, `*.loca.lt`) dari `allowedOrigins` di `next.config.ts`, serta mendukung domain produksi Vercel / kustom domain perusahaan.
- **Resolusi Turbopack Filesystem Tracing**: Memperbaiki pola `path.join(process.cwd(), ...)` pada penanganan file lokal agar Turbopack tidak melakukan tracing seluruh repositori ke server output bundle.
- **Template & Hardening Environment Variable**: Menyediakan file `.env.example` yang rapi dan memvalidasi `SESSION_SECRET` pada mode produksi.

## Capabilities

### New Capabilities
- `cloud-storage-provider`: Layanan penyimpanan file objek berbasis Cloudflare R2 / S3 yang mendukung upload, download berizin (signed URL / secure streaming proxy), dan delete lampiran.
- `production-hardening`: Hardening konfigurasi runtime produksi (Next.js server actions origin, session key enforcement, dan environment variable management).

### Modified Capabilities
<!-- Tidak ada perubahan requirement pada kapabilitas spesifikasi sebelumnya -->

## Impact

- **Affected Code**:
  - `lib/storage.ts` (baru): Abstraction layer upload/download/delete.
  - `lib/attachment-actions.ts`: Menggunakan `storageService` alih-alih `fs/promises` langsung.
  - `app/api/attachments/[id]/route.ts`: Mengalirkan buffer/stream dari storage service.
  - `next.config.ts`: Pembersihan `allowedOrigins`.
  - `.env.example`: Dokumentasi variabel konfigurasi R2 dan secret.
- **Dependencies**: Penambahan paket `@aws-sdk/client-s3` (standar industri untuk S3 & Cloudflare R2).
- **Zero Database Migration**: Tabel `Attachment` tetap menggunakan kolom `storageKey` tanpa memerlukan perubahan skema Prisma.
