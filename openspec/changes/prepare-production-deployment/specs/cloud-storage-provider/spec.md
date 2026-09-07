## Purpose

Menyediakan abstraksi penyimpanan berkas objek (cloud object storage) yang kompatibel S3 (Cloudflare R2) dengan fallback ke penyimpanan disk lokal untuk mengamankan lampiran laporan dari kehilangan akibat sifat ephemeral pada platform deployment serverless.

## ADDED Requirements

### Requirement: Multi-Driver Object Storage
Sistem SHALL mendukung pemilihan driver penyimpanan berkas melalui variabel lingkungan `STORAGE_DRIVER` (`r2` atau `local`).

#### Scenario: Mengunggah file saat driver r2 aktif
- **WHEN** pengguna yang terotorisasi mengunggah berkas lampiran laporan dan `STORAGE_DRIVER=r2`
- **THEN** sistem menyimpan berkas ke bucket Cloudflare R2 menggunakan S3 API dan mencatat metadata di tabel database dengan status berhasil

#### Scenario: Mengunggah file saat driver local aktif
- **WHEN** pengguna mengunggah berkas lampiran laporan dan `STORAGE_DRIVER=local`
- **THEN** sistem menyimpan berkas ke folder penyimpanan lokal persistent di server

### Requirement: Secure Attachment Retrieval
Sistem SHALL menyajikan berkas lampiran hanya kepada pengguna yang memiliki hak akses terhadap site/laporan terkait, baik saat menggunakan driver cloud maupun lokal.

#### Scenario: Unduhan lampiran oleh PIC yang sah
- **WHEN** pengguna dengan hak akses terhadap site laporan mengunduh berkas melalui endpoint `/api/attachments/[id]`
- **THEN** sistem menyajikan konten berkas dengan header keamanan `Content-Disposition: attachment` dan `X-Content-Type-Options: nosniff`

#### Scenario: Akses lampiran ditolak untuk pengguna tanpa izin
- **WHEN** pengguna mencoba mengunduh lampiran dari site yang tidak ditugaskan kepadanya
- **THEN** sistem merespons dengan status HTTP 403 Forbidden tanpa menyajikan konten berkas

### Requirement: Attachment Deletion
Sistem SHALL menghapus objek dari target penyimpanan (R2 bucket atau filesystem lokal) saat lampiran dihapus dari sistem.

#### Scenario: Penghapusan berkas lampiran
- **WHEN** pengguna menghapus lampiran pada laporan berstatus draft
- **THEN** sistem menghapus objek dari bucket R2 / filesystem lokal dan menghapus entitas lampiran dari database
