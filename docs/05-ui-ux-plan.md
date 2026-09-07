# TAHAP 5 — UI/UX Plan

> Branding: logo `public/logo/infomedia_logo.webp` di login, sidebar, topbar, dan header export Excel. Komponen: Shadcn UI + Tailwind, chart: Recharts.

## 1. Sitemap Aplikasi

```
/login                          (auth)
/                               → redirect ke /dashboard
/dashboard                      Ringkasan compliance + KPI
/reports                        Daftar laporan (scoped per role)
/reports/[reportId]             Detail laporan — tab 16 section:
   ├─ /utilisasi      (10_UTILISASI_GEDUNG)
   ├─ /layanan-aktif  (14_LAYANAN_AKTIF)
   ├─ /karyawan       (15_JUMLAH KARYAWAN)
   ├─ /pks            (01_PKS monitoring)
   ├─ /maintenance    (03_MAINTENANCE)
   ├─ /incident       (04_NEAR MISS_INCIDENT)
   ├─ /booking        (11_BOOKING)
   ├─ /keamanan       (13_KEAMANAN_KEBERSIHAN)
   ├─ /utilitas       (05_LISTRIK, 08_PDAM, 06_SOLAR_GENSET, 07_BBM)
   ├─ /material       (09_MATERIAL_REPLACEMENT)
   ├─ /invoice        (16–18_INVOICE: tab Open/Proses/Paid)
   ├─ /petty-cash     (19_INCIDENT_PETTY_CASH)
   ├─ /rkap           (02_RKAP_PROJECT, 20_PENYERAPAN)
   ├─ /aset           (21_AB, 22_NEW_CAPEX, 23_MUTASI_CAPEX, 24_INVENTORY)
   └─ /churn          (12_CHURN)
/monitoring                     Matriks compliance antar site (Admin+)
/approvals                      Antrian review laporan (Admin+)
/master-data/sites|buildings|services|users|ref-options
/audit-logs                     (Super Admin)
/settings                       Profil & password (semua role)
/api/reports/[reportId]/export  Download XLSX identik template
```

## 2. Struktur Menu per Role

### PIC (Site Manager / Admin Site)
```
Dashboard        → KPI site sendiri bulan berjalan
Laporan Saya     → daftar laporan site yang di-assign
  └ Buat/Isi     → 16 section + upload attachment
  └ Submit / Revisi
Monitoring Site  → status laporan site sendiri (riwayat)
Pengaturan       → profil, ganti password
```

### ADMIN (HQ Asset Management)
Semua menu PIC **kecuali** isi laporan orang lain, plus:
```
Dashboard Nasional → KPI seluruh site + grafik trend
Monitoring         → matriks site × bulan (Submitted/Draft/Late/Missing)
Approvals          → review, request revision, approve
Master Data        → Sites, Buildings, Services, Ref Options
Users              → kelola PIC & assignment site (read-only role)
Export             → gabungan multi-site, satu workbook multi-sheet
```

### SUPER_ADMIN
Semua menu ADMIN, plus:
```
Users & Roles    → CRUD user, ubah role, permission matrix
Audit Logs       → jejak semua aktivitas (filter entitas/aktor/tanggal)
Settings         → parameter sistem (batas file, arsip log)
```

## 3. Wireframe

### Login
```
┌──────────────────────────────────────────────┐
│              (background brand)              │
│         [LOGO infomedia_logo.webp]           │
│   Infomedia Monthly Asset Management         │
│   Reporting System                           │
│  ┌────────────────────────────┐              │
│  │ Email                      │              │
│  │ Password            [👁]   │              │
│  │ [        Masuk          ]  │              │
│  │ Lupa password?             │              │
│  └────────────────────────────┘              │
└──────────────────────────────────────────────┘
```

### Dashboard (Admin)
```
┌─[logo]── Infomedia AMRS ──────────── [user ▾]─┐
│ Sidebar │  Dashboard · Agustus 2026           │
│         │ ┌────┐┌────┐┌────┐┌────┐            │
│ Dash    │ │%Sub││Appr││Late││Idle│ ← KPI card │
│ Monitor │ └────┘└────┘└────┘└────┘            │
│ Reports │ ┌───────────────┐┌──────────────┐   │
│ Approve │ │ Compliance by ││ Trend Utilis │   │
│ Master  │ │ Region (bar)  ││ Seat (line)  │   │
│ Audit   │ └───────────────┘└──────────────┘   │
│         │ ┌──────────────────────────────┐    │
│         │ │ ⚠ PKS jatuh tempo ≤30 hari   │    │
│         │ └──────────────────────────────┘    │
└─────────┴─────────────────────────────────────┘
```

### Monitoring (matriks compliance)
```
┌────────────┬─────┬─────┬─────┬─────┬─────────┐
│ Site       │ Mei │ Jun │ Jul │ Agu │ Action  │
├────────────┼─────┼─────┼─────┼─────┼─────────┤
│ BSD        │ 🟢  │ 🟢  │ 🟢  │ 🟡D │ Remind  │
│ Gatsu      │ 🔴  │ 🟢  │ 🟢  │ ⚪— │ Nudge   │
│ Tendean    │ 🟢  │ 🟡R │ 🟢  │ 🟡D │ Review  │
└────────────┴─────┴─────┴─────┴─────┴─────────┘
🟢 Approved 🟡 Submitted/Needs Revision 🔴 Late ⚪ Missing  D=Draft R=Revision
Filter: Region | Bulan | Status   [Export XLSX]
```

### Form Report (per section — pola seragam)
```
┌ Tab section: [Utilisasi][Layanan][Invoice]… ──────┐
│ Site: BSD  Periode: Agustus 2026   Status: DRAFT │
│ ┌────────────────────────────────────────────┐   │
│ │ + Tambah Baris                             │   │
│ │ ┌──────────────────────────────────────┐   │   │
│ │ │ Building ▾ | Luas | Used | Idle | %* │   │   │
│ │ │ Gatsu-1    | 698  | 229  | 28 | 89.1%│   │   │
│ │ └──────────────────────────────────────┘   │   │
│ │  (*kolom turunan read-only)                │   │
│ └────────────────────────────────────────────┘   │
│ Attachment: [📎 lampiran.pdf ×]                   │
│ [Simpan Draft]              [Submit for Review]  │
└───────────────────────────────────────────────────┘
Validasi inline react-hook-form + zod; autosave draft.
```

### Export Report
```
┌ Pilih: Site ☑BSD ☑Gatsu  Bulan: Jul 2026 ────────┐
│ Sheet: ☑ semua  / pilih (16 sheet sesuai Excel)  │
│ [Download .xlsx]  → stream ExcelJS               │
└───────────────────────────────────────────────────┘
Output: header logo + judul, kolom & urutan = template,
formula asli untuk baris TOTAL & kolom turunan.
```

## 4. Prinsip UX

1. **Form mengikuti mental model Excel**: tabel grid editable + tambah baris; bukan form panjang per field.
2. **Kolom turunan selalu read-only** dengan tanda `*` + tooltip "dihitung otomatis".
3. **Status warna konsisten** lintas halaman (Draft abu, Submitted kuning, Approved hijau, Revision merah).
4. Mobile-friendly minimal (PIC kadang input dari HP): tabel scroll horizontal, form prioritas.
