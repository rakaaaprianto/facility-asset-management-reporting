## Context

Lihat `proposal.md` untuk latar belakang masalah ephemerality filesystem serverless di Vercel dan kebutuhan portabilitas penyimpanan ke server perusahaan / VPS mandiri.

Aplikasi Next.js 16 saat ini mengelola berkas lampiran laporan melalui `lib/attachment-actions.ts` dan menyajikan berkas via `app/api/attachments/[id]/route.ts`. Metadata berkas tersimpan pada model Prisma `Attachment` dengan kolom `storageKey`.

## Goals / Non-Goals

**Goals:**
- **Abstraksi Storage Driver Tunggal**: Membungkus interaksi upload/download/delete dalam interface `StorageService` seragam.
- **Dukungan Cloudflare R2**: Menggunakan `@aws-sdk/client-s3` dengan endpoint R2 tanpa biaya bandwidth egress.
- **Portabilitas Nol Biaya Migrasi**: Menjamin kemudahan beralih antara Cloudflare R2 dan filesystem lokal/on-premise hanya via file `.env` tanpa migrasi skema database.
- **Hardening Produksi**: Mengamankan `next.config.ts` dan variabel sesi produksi.

**Non-Goals:**
- Mengubah alur bisnis atau hak akses lampiran (otorisasi PIC site tetap berlaku di route API dan server action).
- Mengubah struktur tabel database `Attachment` (kolom `storageKey` tetap digunakan sebagai key pengenal objek).

## Decisions

### 1. Pola Driver Abstraksi Penyimpanan (`StorageDriver`)
* **Keputusan**: Buat modul `lib/storage.ts` yang mengekspos fungsi terpadu:
  - `uploadFile(key: string, bytes: Buffer, mimeType: string): Promise<string>`
  - `downloadFile(key: string): Promise<Buffer>`
  - `deleteFile(key: string): Promise<void>`
* **Mekanisme Seleksi Driver**:
  ```
  STORAGE_DRIVER === "r2"  ──>  R2StorageDriver (@aws-sdk/client-s3)
  STORAGE_DRIVER === "local" ──>  LocalStorageDriver (node:fs/promises dengan Turbopack fix)
  ```
* **Alasan**: Jika hari ini dideploy di Vercel menggunakan R2, dan kelak 1 bulan lagi dipindahkan ke server lokal perusahaan atau VPS, pengembang cukup mengganti `STORAGE_DRIVER=local` atau mengarahkan endpoint S3 ke server MinIO internal kantor tanpa perlu menulis ulang kode.
* **Alternatif yang Dipertimbangkan**:
  - *Vercel Blob*: Terlalu mengunci vendor (vendor lock-in) dan ada biaya per request/bandwidth jika melewati batas gratis.
  - *AWS S3*: Ada biaya transfer data keluar (egress) yang cukup mahal jika banyak unduhan. R2 memiliki **$0 egress fees**.

### 2. Kredensial & Konfigurasi Cloudflare R2
* **Keputusan**: Variabel lingkungan yang digunakan:
  - `STORAGE_DRIVER`: `"r2"` | `"local"` (default: `"local"`)
  - `R2_ACCOUNT_ID`: ID akun Cloudflare pengguna
  - `R2_ACCESS_KEY_ID`: S3 Access Key ID dari dashboard Cloudflare R2
  - `R2_SECRET_ACCESS_KEY`: S3 Secret Access Key dari dashboard Cloudflare R2
  - `R2_BUCKET_NAME`: Nama bucket (misal: `amrs-infomedia-attachments`)
* **Alasan**: Kompatibel 100% dengan SDK standar AWS `@aws-sdk/client-s3`, sehingga endpoint otomatis diatur ke `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`.

### 3. Pembersihan `allowedOrigins` di `next.config.ts`
* **Keputusan**: Ganti daftar tunnel pengujian statis (`*.trycloudflare.com`, `*.pinggy.link`, `*.loca.lt`) dengan konfigurasi yang membaca variabel lingkungan atau hanya mendaftarkan origin resmi:
  - `localhost:3000` (mode development)
  - `*.vercel.app` dan domain kustom perusahaan (jika ada).
* **Alasan**: Mencegah Server Action error `Invalid Server Actions request: Origin does not match allowedOrigins` saat user mengakses via URL Vercel.

## Risks / Trade-offs

| Risiko | Mitigasi |
|---|---|
| Kredensial R2 salah diatur di Vercel | Sistem memvalidasi variabel R2 saat `STORAGE_DRIVER=r2`. Jika tidak lengkap, sistem memberikan pesan galat konfigurasi yang jelas di log server. |
| Limit gratis Cloudflare R2 terlampaui | Free tier R2 memberikan 10 GB kapasitas dan 1.000.000 operasi tulis per bulan. Untuk kebutuhan laporan bulanan AMRS (ratusan file PDF/Excel per bulan), kuota ini sangat berlebih dan aman dari biaya. |
| File lama tersimpan di lokal saat migrasi ke cloud | Berkas lama yang ada di disk lokal dapat disinkronkan ke R2 menggunakan utilitas resmi gratis seperti `rclone` atau script migrasi mandiri. |
