# TAHAP 2 — Analisis File Excel `Master_Data_Monthly_Report.xlsx`

> Sumber: `docs/references/Master_Data_Monthly_Report.xlsx` — **25 sheet**, diparse penuh dengan ExcelJS (header, tipe data, dropdown validation, formula).

## 1. Ringkasan Workbook

| # | Sheet | Tujuan | Baris data | Kategori |
|---|---|---|---|---|
| 00 | `00_MASTER` | Daftar nilai dropdown global | 43 | Master referensi |
| 01 | `01_PKS` | Monitoring berakhirnya kontrak PKS per site | 33 | Monitoring (master) |
| 02 | `02_RKAP_PROJECT` | Progres project/target RKAP | template kosong | Transaction |
| 03 | `03_MAINTENANCE` | Pekerjaan maintenance gedung | 19 | Transaction |
| 04 | `04_NEAR MISS_INCIDENT` | Catatan near-miss/insiden & kerusakan | 63 | Transaction |
| 05 | `05_LISTRIK` | Pemakaian & tagihan listrik bulanan | 5+total | Transaction |
| 06 | `06_SOLAR_GENSET` | Pemakaian solar genset mingguan | 7+total | Transaction |
| 07 | `07_BBM_KENDARAAN` | Pemakaian BBM kendaraan operasional | 8+total | Transaction |
| 08 | `08_PDAM` | Pemakaian air PDAM bulanan | 3+total | Transaction |
| 09 | `09_MATERIAL_REPLACEMENT` | Log penggantian material | 117 | Transaction |
| 10 | `10_UTILISASI_GEDUNG` | Snapshot utilisasi luas & seat bulanan | 21 | Transaction (snapshot) |
| 11 | `11_BOOKING` | Booking ruangan oleh customer | 13 | Transaction |
| 12 | `12_CHURN` | Risiko churn customer/layanan | 1 | Transaction |
| 13 | `13_KEAMANAN_KEBERSIHAN` | Headcount security/cleaning/ME | 14 | Transaction (snapshot) |
| 14 | `14_LAYANAN_AKTIF` | Layanan aktif per site: luas, seat, SDM | 113 | Master + snapshot |
| 15 | `15_JUMLAH KARYAWAN` | Jumlah karyawan per unit/site | 29 | Transaction (snapshot) |
| 16 | `16_OPEN_INVOICE` | Invoice belum dibayar + aging | template kosong | Transaction |
| 17 | `17_INVOICE_PROSES` | Invoice dalam proses pembayaran | template kosong | Transaction |
| 18 | `18_INVOICE_PAID` | Invoice sudah dibayar | template kosong | Transaction |
| 19 | `19_INCIDENT_PETTY_CASH` | Pengeluaran petty cash / cash advance | 2 | Transaction |
| 20 | `20_PENYERAPAN_RKAP_CAPEX_OPEX` | Realisasi vs budget RKAP/CAPEX/OPEX | template kosong | Transaction |
| 21 | `21_AB` | Pencatatan aset baru (Berita Acara) | template kosong | Master event |
| 22 | `22_NEW_CAPEX` | Usulan CAPEX baru | template kosong | Transaction |
| 23 | `23_MUTASI_CAPEX` | Mutasi/pindah asset antar lokasi | template kosong | Transaction |
| 24 | `24_INVENTORY` | Progres verifikasi inventaris asset | 18 | Transaction (snapshot) |

**Pola umum semua sheet transaction:** `No` (nomor urut), `Periode/Tanggal`, `Site/Gedung`, kolom data spesifik, `PIC`, `Status` (dropdown), `Tanggal Update`, `Keterangan`.

## 2. Sheet `00_MASTER` — Nilai Dropdown (sumber enum)

| Master | Nilai |
|---|---|
| Status | Active, Near Expired, Expired, Renewal Process, Not Started, Progress, Done, Overdue, Open, Closed, Cancelled, Approved, Rejected, Completed |
| Jenis | Project, RKAP, CAPEX, OPEX |
| Severity | Low, Medium, High, Critical |
| Probability | Low, Medium, High |
| Priority | Low, Medium, High, Critical |
| Satuan | Unit, Buah, Liter, m³, kWh, Set, Orang |
| Aspek | Security, Cleaning (+ ME dari validasi sheet 13) |
| Jenis PKS | Sewa Gedung, Cleaning, Security, Maintenance, Lainnya |

Dropdown inline lain yang ditemukan di sheet:
- `04`: Severity `Low,Medium,High,Critical`
- `11`: Status Booking `Booking,Deal,Used,On Progress`
- `13`: Aspek `Security,Cleaning,ME`
- `20`/`02`: Jenis `Project,RKAP,CAPEX,OPEX`
- `09`: Satuan `Unit,Buah,Liter,m³,kWh,Set,Orang`

## 3. Struktur Kolom Per Sheet (header + tipe)

### 01_PKS
`No:int` · `Site/Gedung:string` · `Tanggal Berakhir:date` · `Sisa Hari:FORMULA =MAX(C-TODAY(),0)` · `Status:FORMULA (Expired/Expiring Soon/Active)` · `Keterangan:string` · `PIC:string`
→ *Sisa Hari & Status adalah kolom turunan — tidak disimpan, dihitung saat read/export.*

### 02_RKAP_PROJECT
`No` · `Site/Project` · `Nama Project/Target` · `Jenis:enum(Project/RKAP/CAPEX/OPEX)` · `Target RKAP` · `Progress:number(%)` · `Due Date:date` · `Sisa Hari:formula` · `PIC` · `Status:enum-status` · `Keterangan`

### 03_MAINTENANCE
`Periode:date` · `Site/Gedung` · `Area:string(kota)` · `Jenis Pekerjaan:string` (nilai teramati: AC, Karpet, Atap, Tangga, Pagar, Genset, Lift, Pest Kontrol, Fire Alarm System, Fire Suppression, Toilet, Lady Bin) · `Detail Pekerjaan:text` · `Target Pelaksanaan:date` · `PIC` · `Vendor` · `Estimasi Biaya:decimal(Rp)` · `Status` · `Tanggal Selesai:date` · `Keterangan` (frekuensi: "1 Bulan 2 kali")

### 04_NEAR MISS_INCIDENT
`Tanggal:date` · `Site/Gedung` · `Lokasi:kota` · `Deskripsi Kejadian:text` · `Kategori:string` (Kejadian/Kerusakan, Kerusakan Gedung, Informasi Kerusakan Gedung, Lain-lain) · `Severity:enum(L/M/H/Critical)` · `Tindakan Awal` · `Root Cause` · `Corrective Action` · `PIC` · `Target Penyelesaian:date` · `Status` · `Tanggal Closed:date` · `Keterangan`

### 05_LISTRIK & 08_PDAM (bentuk identik)
`Periode:bulan(string!)` · `Site/Gedung` · `Meter ID/No. Meter:string` · `Pemakaian (kWh/m³):number` · `Nilai Tagihan:Rp number` · `Meter Awal:number` · `Meter Akhir:number` · `PIC` · `Tanggal Update:date` · `Keterangan` — plus baris TOTAL formula `=sum(...)`.

### 06_SOLAR_GENSET
`Periode:tanggal-mingguan(text)` · `Site/Gedung` · `Genset ID` · `Pemakaian Solar (L):decimal` · `Jam Operasi Genset:decimal` · `Jumlah Pengisian:decimal` · `Harga/Liter:Rp` · `Total Biaya:FORMULA =H*E` · `PIC` · `Tanggal Update` · `Keterangan` ("Sisa stock …")

### 07_BBM_KENDARAAN
`Periode:bulan` · `Site` · `No. Kendaraan:plat` · `Jenis Kendaraan` · `Jenis BBM` · `Pemakaian (L):decimal` · `Odometer Awal/Akhir:number` · `Total Jarak Tempuh:number` · `Total Biaya:Rp` · `PIC` · `Tanggal Update` · `Keterangan`

### 09_MATERIAL_REPLACEMENT
`Tanggal:date` · `Site/Gedung` · `Area` · `Material:string` (Lampu, Pintu, Flexible house, Jet Shower, Kran, Kabel, Parquet, Mobile Drawer) · `Spesifikasi` · `Qty:number` · `Satuan:enum(Satuan)` · `Kondisi Material Lama` (Mati/rusak) · `Alasan Penggantian` · `Estimasi Biaya:Rp` · `PIC` · `Status` · `Keterangan`

### 10_UTILISASI_GEDUNG
`Periode:bulan` · `Site/Gedung` · `Total Luas m²` · `Luas Terpakai m²` · `Luas Idle m²:formula(D-E)` · `Total Seat:formula(H+I)` · `Seat Terpakai` · `Seat Idle` · `Utilisasi (%):FORMULA =IFERROR(Terpakai/Total,0) format %` · `PIC` · `Tanggal Update` · `Keterangan` — plus baris total.

### 11_BOOKING
`Tanggal Booking:date` · `Site/Gedung` · *(kolom D tanpa header = nomor lantai)* · `Ruangan` · `Luas m²:decimal` · `Seat:int` · `Nama Pemesan:customer` · `Status Booking:enum(Booking/Deal/Used/On Progress)` · `PIC` · `Keterangan`

### 12_CHURN
`Periode` · `Site/Gedung` · `Customer/Unit` · `Layanan` · `Potensi Churn` · `Indikasi/Alasan` · `Dampak` · `Probability:enum(L/M/H)` · `Action Plan` · `PIC` · `Target Follow Up:date` · `Status` · `Keterangan`

### 13_KEAMANAN_KEBERSIHAN
`Periode` · `Site/Gedung` · `Aspek:enum(Security/Cleaning/ME)` · `Jumlah Danru:int` · `Jumlah Anggota:int` · `Jumlah:FORMULA =E+F` · `PIC` · `Keterangan`

### 14_LAYANAN_AKTIF
`Periode` · `Site/Gedung` · `Nama Layanan:text` (113 baris; contoh "CC BANK SUMUT lt. 1") · `Luas M²:decimal` ⚠️ 2 sel salah format date · `Total Seat:int` · `Used Seat:int` · `Idle Seat:int` · `Jumlah SDM:int` · `PIC` · `Tanggal Update` · `Keterangan`

### 15_JUMLAH KARYAWAN
`Periode` · `Site/Gedung` · `Unit` (CC Bank Sumut, Site Manager, CS/OB, Security, Teknisi, IT & Support, dst.) · `Jumlah Karyawan:int` · `Karyawan Aktif:int` · `Total` (kosong) · `PIC` · `Tanggal Update` · `Keterangan`

### 16_OPEN_INVOICE / 17_INVOICE_PROSES / 18_INVOICE_PAID
Inti sama: `No Invoice` · `Vendor` · `Site/Gedung` · `Jenis Layanan` · `Periode` · `Nilai Invoice:Rp`.
- 16: `Tanggal Invoice`, `Due Date`, `Aging (Hari):turunan`, `Status`, `Kendala`
- 17: `Tanggal Diterima`, `Tanggal Diproses`, `Lama Proses (Hari):turunan`
- 18: `Due Date`, `Tanggal Paid`, `Lama Pembayaran:turunan`
→ **Satu siklus hidup invoice** yang dipecah jadi 3 view by status.

### 19_INCIDENT_PETTY_CASH
`Tanggal:date` · `Site/Gedung` · `No. Transaksi` · `Jenis Pengeluaran:(Cash Advance|Reimburse)` · `Deskripsi:text` · `Nilai:Rp #,##0` · `Budget:Rp` · `Selisih:turunan` · `PIC` · `Status` · `Keterangan`

### 20_PENYERAPAN_RKAP_CAPEX_OPEX
`Periode` · `Site/Gedung` · `Jenis:enum(Project/RKAP/CAPEX/OPEX)` · `Kategori` · `Budget RKAP:Rp` · `Realisasi:Rp` · `Sisa Budget:turunan` · `Penyerapan (%):turunan` · `Target Penyerapan (%):input` · `Variance (%):turunan` · `PIC` · `Status` · `Keterangan`

### 21_AB (Aset Baru)
`Tanggal` · `Site/Gedung` · `Asset Tag` · `Nama Asset` · `Kategori` · `Merk` · `Model` · `Serial Number` · `Qty` · `Nilai Asset:Rp` · `Sumber` · `PIC` · `Status` · `Keterangan`

### 22_NEW_CAPEX
`Tahun:int` · `Site/Gedung` · `Nama Capex` · `Kategori` · `Justifikasi:text` · `Qty` · `Estimasi Nilai:Rp` · `Budget RKAP:Rp` · `Vendor` · `Target Pengadaan:date` · `PIC` · `Status` · `Keterangan`

### 23_MUTASI_CAPEX
`Tanggal` · `Asset Tag` · `Nama Asset` · `Site Asal` · `Lokasi Asal` · `Site Tujuan` · `Lokasi Tujuan` · `Nilai Asset:Rp` · `Alasan Mutasi` · `PIC` · `Status` · `Tanggal Efektif:date` · `Keterangan`

### 24_INVENTORY
`Periode:(Q1 - Q3 label)` · `Site/Gedung` · `Layanan` · `Total Asset` · `Asset Sudah Dicek` · `Asset Belum Dicek` · `Asset Sesuai` · `Asset Tidak Sesuai` · `Progress (%):int` · `Temuan` · `PIC` · `Status` · `Tanggal Update` · `Keterangan` (+kolom P tersembunyi "16 Verifikasi")

## 4. Temuan Penting (Data Quality → Keputusan Desain)

1. **`Site/Gedung` free-text & inkonsisten**: `Gatsu`, `Gatsu Medan`, `graha intan`, `Yogyakarta graha intan`, `HO Fatmawati`, `OPMC-BSD` vs `OPMC Bogor`, `Sri Ratu` vs `Sri Ratu Semarang`. → Wajib tabel master **Site** dengan FK; nama lama dipetakan lewat migrasi seed.
2. **`PIC` free-text & gabungan**: `fam 5` vs `FAM 5`, `All SIte Manager` (typo), `All Site Manager/Huda`, `JAMAL-RANIA`. → PIC menjadi **User** sungguhan + assignment ke site; kolom PIC pada section merujuk `userId`.
3. **Kolom turunan via formula** (`Sisa Hari`, `Status PKS`, `Utilisasi`, `Aging`, `Total`, `Selisih`, `Variance`) → dihitung ulang di service layer, bukan input user.
4. **`Periode` campur aduk**: string bulan (`"Juli"`, `"jan"`), tanggal (`06-January-26`), label kuartal (`Q1 - Q3`). → Dinormalisasi menjadi `(periodYear, periodMonth)` di level report; label bebas hanya untuk inventory scope.
5. **Tipe data rusak di sumber**: `Luas M²` ada 2 sel berisi date; `No` kadang formula. → Validasi ketat Zod saat input.
6. **3 sheet invoice = 1 entitas** `Invoice` dengan status lifecycle + kolom tanggal progresif; export memecah lagi ke 3 sheet agar isinya identik dengan Excel.
7. **Baris TOTAL formula** di beberapa sheet → direproduksi saat export (ExcelJS menulis formula asli), bukan disimpan di DB.
8. **00_MASTER = konfigurasi referensi dinamis** → tabel `RefOption(category, value)` agar admin bisa menambah opsi tanpa deploy.
