## Purpose

Mendefinisikan persyaratan performa server untuk deployment Vercel dan query database, memastikan halaman laporan dirender cepat tanpa query waterfall yang dapat dihindari.

## Requirements

### Requirement: Deployment region co-located dengan database
Server SHALL dikonfigurasi untuk berjalan di region yang sama dengan database (Singapura / `sin1`) sehingga setiap database query memiliki latency jaringan di bawah 20ms (bukan >500ms lintas benua).

#### Scenario: Deploy ke Vercel setelah konfigurasi region
- **WHEN** `vercel.json` berisi `"regions": ["sin1"]` dan project di-push ke GitHub
- **THEN** Vercel menjalankan serverless function di region Singapura dan setiap query database selesai dalam <20ms latency jaringan (bukan ~560ms sebelumnya)

#### Scenario: Page load halaman laporan setelah pindah region
- **WHEN** pengguna membuka halaman detail laporan
- **THEN** halaman merespons dalam waktu total <800ms (dari sebelumnya 1.5–2.5 detik) pada koneksi warm start

### Requirement: Query paralel di halaman detail laporan
Halaman detail laporan (`/reports/[id]`) SHALL mengeksekusi query-query yang tidak saling bergantung secara paralel menggunakan `Promise.all`, bukan secara sekuensial.

#### Scenario: Load data non-bergantung setelah report ditemukan
- **WHEN** report ditemukan oleh query awal
- **THEN** sistem mengeksekusi `canEditReport`, `db.site.findUnique`, `getReportSectionStatusMap`, dan `db.reportStatusLog.findMany` secara paralel — bukan satu-per-satu

#### Scenario: Tidak ada perubahan data yang dikembalikan ke pengguna
- **WHEN** paralelisasi diterapkan
- **THEN** semua data yang ditampilkan pada halaman detail laporan tetap sama persis (tidak ada regresi data)

### Requirement: Deduplikasi query `getAccessibleSiteIds` per request
Fungsi `getAccessibleSiteIds` SHALL mengembalikan hasil yang di-cache dalam lingkup satu server request, sehingga pemanggilan berulang dalam request yang sama tidak menghasilkan query database tambahan.

#### Scenario: Dua pemanggilan `getAccessibleSiteIds` dalam satu request
- **WHEN** `getAccessibleSiteIds(user)` dipanggil lebih dari sekali dalam satu server request (misal di layout + di halaman)
- **THEN** query database ke tabel `site` hanya terjadi satu kali; pemanggilan berikutnya mendapatkan nilai yang sudah di-cache

#### Scenario: Request berbeda tidak berbagi cache
- **WHEN** dua request HTTP berbeda memanggil `getAccessibleSiteIds`
- **THEN** masing-masing request mendapatkan hasil yang segar dari database (tidak ada cross-request cache pollution)
