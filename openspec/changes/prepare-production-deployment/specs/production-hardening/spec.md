## Purpose

Mengamankan konfigurasi runtime dan deployment produksi sistem AMRS Infomedia, mencakup validasi kunci sesi kriptografis, pembersihan domain tunnel pengembangan dari konfigurasi server actions, dan panduan variabel lingkungan.

## ADDED Requirements

### Requirement: Production Session Secret Enforcement
Sistem SHALL mewajibkan string rahasia sesi yang kuat dan menolak nilai default pengembangan saat berjalan pada mode produksi (`NODE_ENV=production`).

#### Scenario: Menjalankan aplikasi dengan secret yang valid di produksi
- **WHEN** aplikasi berjalan dalam mode produksi dan `SESSION_SECRET` disetel dengan string acak berpanjang memadai
- **THEN** sistem menginisialisasi modul otentikasi sesi HMAC-SHA256 tanpa galat

#### Scenario: Menjalankan aplikasi dengan secret tidak aman di produksi
- **WHEN** aplikasi berjalan dalam mode produksi dan `SESSION_SECRET` kosong atau masih bernilai default pengembangan
- **THEN** sistem melempar eksepsi fatal saat startup untuk mencegah pemalsuan sesi

### Requirement: Server Actions Allowed Origins Hardening
Sistem SHALL membatasi origin Server Actions pada domain aplikasi yang sah dan menghapus izin untuk domain tunnel publik pengembangan.

#### Scenario: Eksekusi Server Actions dari origin resmi
- **WHEN** permintaan Server Action berasal dari domain aplikasi produksi yang terdaftar atau localhost (pengembangan)
- **THEN** permintaan dieksekusi dengan aman

#### Scenario: Pencegahan tunnel dev di lingkungan produksi
- **WHEN** aplikasi dibuild untuk produksi
- **THEN** konfigurasi `allowedOrigins` tidak lagi memuat wildcard tunnel seperti `*.trycloudflare.com` atau `*.pinggy.link`
