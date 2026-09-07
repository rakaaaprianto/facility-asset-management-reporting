## 1. Storage Abstraction & Cloudflare R2 Integration

- [x] 1.1 Pasang paket `@aws-sdk/client-s3` pada project (`npm install @aws-sdk/client-s3`) dan verifikasi entri terdaftar di `package.json`.
- [x] 1.2 Buat modul abstraksi penyimpanan `lib/storage.ts` yang menyediakan fungsi `uploadFile`, `downloadFile`, dan `deleteFile` dengan dukungan driver `r2` dan `local`.

## 2. Refactoring Alur Lampiran (Attachment Workflow)

- [x] 2.1 Perbarui `lib/attachment-actions.ts` untuk menggunakan `uploadFile` dan `deleteFile` dari `lib/storage.ts`, serta menghilangkan dependensi langsung pada path disk lokal server.
- [x] 2.2 Perbarui `app/api/attachments/[id]/route.ts` untuk menyajikan berkas melalui `downloadFile` dari `lib/storage.ts` dengan tetap mempertahankan validasi otorisasi PIC site.

## 3. Hardening Konfigurasi Runtime & Produksi

- [x] 3.1 Perbarui `next.config.ts` untuk membersihkan domain tunnel pengujian statis dan menambahkan dukungan origin produksi Vercel (`*.vercel.app`) secara dinamis.
- [x] 3.2 Buat file template [`.env.example`](file:///c:/Project/infomedia-monthly-report/.env.example) yang mendokumentasikan seluruh variabel lingkungan yang dibutuhkan (DB pooler, session secret, R2 credentials, email).
- [x] 3.3 Jalankan `npm run typecheck` dan `npm run build` untuk memvalidasi bahwa aplikasi lolos kompilasi produksi tanpa peringatan tracing Turbopack.
