export type FieldType = "text" | "textarea" | "number" | "money" | "date" | "select" | "ref" | "checkbox";
export type DynamicSource = "building" | "room" | "asset" | "site";
export type SectionField = {
  name: string; label: string; type: FieldType; required?: boolean;
  options?: readonly string[]; refCategory?: string; dynamic?: DynamicSource;
  colSpan?: number; step?: string; placeholder?: string; defaultValue?: string;
  contextFill?: boolean; computeFrom?: readonly string[];
  computeFormula?: "sum" | "divide_multiply" | "multiply" | "subtract"; // divide_multiply = (a/b)*100, multiply = a*b, subtract = a-b
};
export type SectionConfig = {
  key: string; title: string; description: string; model: string;
  fixedValues?: Record<string, unknown>; fields: SectionField[];
  uniqueScope?: string[]; summaryField?: string; special?: string;
  /** Jika true, section ini HANYA muncul di laporan area (isArea site) */
  areaOnly?: boolean;
  /** Jika true, section ini TIDAK muncul di laporan area — hanya untuk laporan site biasa */
  siteOnly?: boolean;
};

export const MASTER_STATUSES = [
  "ACTIVE",
  "NEAR_EXPIRED",
  "EXPIRED",
  "RENEWAL_PROCESS",
  "NOT_STARTED",
  "PROGRESS",
  "IN_PROGRESS",
  "IN_PROCESS",
  "DONE",
  "OVERDUE",
  "OPEN",
  "PAID",
  "CLOSED",
  "CANCELLED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "PROPOSED",
  "PROCUREMENT",
  "EXECUTED",
  "DRAFT",
] as const;

const WORK_STATUS = MASTER_STATUSES;
const UPDATE_STATUS = MASTER_STATUSES;

export const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const SECTIONS: SectionConfig[] = [
  {
    key: "utilisasi", title: "Utilisasi Gedung", description: "Luas, kursi, utilisasi % per gedung (sheet 10).",
    model: "buildingUtilization", summaryField: "gedungName",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "totalAreaM2", label: "Total Luas Ruangan (m²)", type: "number", step: "0.01" },
      { name: "usedAreaM2", label: "Luas Ruangan Terpakai (m²)", type: "number", step: "0.01" },
      { name: "idleAreaM2", label: "Luas Ruangan Idle (m²)", type: "number", step: "0.01" },
      { name: "totalSeats", label: "Total Seat", type: "number" },
      { name: "usedSeats", label: "Seat Terpakai", type: "number" },
      { name: "idleSeats", label: "Seat Idle", type: "number" },
      { name: "utilitasPct", label: "Utilisasi Ruangan (%)", type: "number", step: "0.01", computeFrom: ["usedAreaM2", "totalAreaM2"], computeFormula: "divide_multiply" },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "layanan-aktif", title: "Layanan Aktif", description: "Daftar layanan/jasa di gedung (sheet 14).",
    model: "activeServiceEntry",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "serviceName", label: "Nama Layanan", type: "text", required: true },
      { name: "areaM2", label: "Luas (m²)", type: "number", step: "0.01" },
      { name: "totalSeats", label: "Total Seat", type: "number" },
      { name: "usedSeats", label: "Used Seat", type: "number" },
      { name: "idleSeats", label: "Idle Seat", type: "number" },
      { name: "staffCount", label: "Jumlah SDM", type: "number" },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "karyawan", title: "Jumlah Karyawan", description: "Headcount per unit kerja (sheet 15).",
    model: "employeeCountEntry",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "unitName", label: "Unit", type: "text", required: true },
      { name: "totalCount", label: "Total", type: "number", required: true },
      { name: "activeCount", label: "Karyawan Aktif", type: "number" },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "maintenance", title: "Maintenance", description: "Pekerjaan pemeliharaan gedung (sheet 03).",
    model: "maintenanceWork",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "workDate", label: "Tanggal Kerja", type: "date" },
      { name: "areaName", label: "Ruangan", type: "text" },
      { name: "workCategory", label: "Jenis Pekerjaan", type: "text", placeholder: "cth: AC / Genset / Sipil" },
      { name: "detail", label: "Detail Pekerjaan", type: "textarea", colSpan: 2 },
      { name: "plannedDate", label: "Target Pelaksanaan", type: "date" },
      { name: "vendorName", label: "Vendor", type: "text" },
      { name: "estimatedCost", label: "Estimasi Biaya", type: "money", required: true },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS },
      { name: "completedAt", label: "Tanggal Selesai", type: "date" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "incident", title: "Near Miss / Incident", description: "Pencatatan insiden atau temuan (sheet 04).",
    model: "nearMissIncident",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "occurredAt", label: "Tanggal", type: "date" },
      { name: "locationDesc", label: "Lokasi", type: "text" },
      { name: "description", label: "Deskripsi Kejadian", type: "textarea", colSpan: 2 },
      { name: "category", label: "Kategori", type: "text", placeholder: "cth: K3 / Fasilitas / IT" },
      { name: "severity", label: "Severity", type: "select", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const },
      { name: "initialAction", label: "Tindakan Awal", type: "textarea", colSpan: 2 },
      { name: "rootCause", label: "Root Cause", type: "textarea", colSpan: 2 },
      { name: "correctiveAction", label: "Corrective Action", type: "textarea", colSpan: 2 },
      { name: "targetResolutionDate", label: "Target Penyelesaian", type: "date" },
      { name: "closedAt", label: "Tanggal Closed", type: "date" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "booking", title: "Booking Ruangan", description: "Pemesanan ruang rapat / meeting (sheet 11).",
    model: "roomBooking",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "bookingDate", label: "Tanggal Booking", type: "date" },
      { name: "roomLabel", label: "Ruangan", type: "text", required: true },
      { name: "floorLabel", label: "Lantai", type: "text" },
      { name: "areaM2", label: "Luas (m²)", type: "number", step: "0.01" },
      { name: "seats", label: "Jumlah Seat", type: "number" },
      { name: "bookerName", label: "Nama Pemesan", type: "text", required: true },
      { name: "bookingStatus", label: "Status Booking", type: "select", options: ["BOOKING", "DEAL", "USED", "ON_PROGRESS"] as const, defaultValue: "BOOKING" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "keamanan", title: "Keamanan, Kebersihan, Driver & ME", description: "Headcount supervisor & anggota per aspek (sheet 13).",
    model: "securityHeadcount", summaryField: "aspect",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "aspect", label: "Aspek", type: "select", options: ["SECURITY", "CLEANING", "DRIVER", "ME"] as const },
      { name: "supervisorCount", label: "Jumlah Danru", type: "number" },
      { name: "memberCount", label: "Jumlah Anggota", type: "number" },
      { name: "totalCount", label: "Jumlah", type: "number", computeFrom: ["supervisorCount", "memberCount"] },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "listrik", title: "Pemakaian Listrik", description: "Rekap pemakaian & tagihan listrik bulanan (sheet 05).",
    model: "utilityUsage", fixedValues: { type: "ELECTRICITY" }, summaryField: "type",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "meterNo", label: "Meter ID", type: "text" },
      { name: "usageValue", label: "Pemakaian (kWh)", type: "number", step: "0.01", required: true },
      { name: "billAmount", label: "Nilai Tagihan", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "pdam", title: "Pemakaian PDAM", description: "Rekap pemakaian & tagihan air PDAM bulanan (sheet 08).",
    model: "utilityUsage", fixedValues: { type: "WATER" }, summaryField: "type",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "meterNo", label: "No. Meter", type: "text" },
      { name: "usageValue", label: "Pemakaian (m³)", type: "number", step: "0.01", required: true },
      { name: "billAmount", label: "Nilai Tagihan", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "mandatory-gedung", title: "Mandatory Gedung", description: "Rekapitulasi mandatory beban gedung & PKS (sheet 09).",
    model: "buildingMandatoryEntry",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Nama Gedung", type: "text", placeholder: "cth: Fatmawati", required: true },
      { name: "jenisBeban", label: "Jenis Beban", type: "text", placeholder: "cth: Sewa Gedung / Service Charge", required: true },
      { name: "statusPks", label: "Status PKS", type: "text", placeholder: "cth: ACTIVE / PROSES / EXPIRED" },
      { name: "docRef", label: "Referensi Dokumen", type: "text", placeholder: "cth: No. PKS / Surat" },
      { name: "activePeriod", label: "Masa Aktif PKS", type: "text", placeholder: "cth: 01 Jan 2026 - 31 Des 2026" },
      { name: "accrueValue", label: "Jumlah Nilai Accrue", type: "money" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "genset", title: "Solar Genset", description: "Pemakaian solar untuk genset (sheet 06).",
    model: "gensetUsage",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "gensetCode", label: "Genset ID", type: "text" },
      { name: "usageLiters", label: "Pemakaian Solar (L)", type: "number", step: "0.01", required: true },
      { name: "operatingHours", label: "Jam Operasi Genset", type: "number", step: "0.01" },
      { name: "refillQty", label: "Jumlah Pengisian (L)", type: "number", step: "0.01" },
      { name: "pricePerLiter", label: "Harga/Liter", type: "money" },
      { name: "totalBiaya", label: "Total Biaya", type: "money" },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "bbm", title: "BBM Kendaraan", description: "Laporan penggunaan BBM kendaraan dinas sesuai form operasional.",
    model: "vehicleFuelUsage",
    summaryField: "nopol",
    fields: [
      { name: "tgl", label: "TGL", type: "date", required: true, placeholder: "YYYY-MM-DD" },
      { name: "nama", label: "Nama", type: "text", placeholder: "Nama Driver" },
      { name: "nopol", label: "Nopol", type: "text", required: true, placeholder: "cth: B 2501 PIM" },
      { name: "area", label: "Area", type: "text", placeholder: "cth: AREA 2" },
      { name: "tujuan", label: "Tujuan", type: "text", placeholder: "cth: Stenby / Kemenlu, Fatma" },
      { name: "dept", label: "Dept", type: "text", placeholder: "cth: Corporate / Sales / PM" },
      { name: "datang", label: "Datang", type: "text", placeholder: "08:00" },
      { name: "pergi", label: "Pergi", type: "text", placeholder: "09:45" },
      { name: "pulang", label: "Pulang", type: "text", placeholder: "17:03" },
      { name: "jamKerjaMenit", label: "Jam Kerja (menit)", type: "number", defaultValue: "540" },
      { name: "durasiPerjalananMenit", label: "Durasi Perjalanan (menit)", type: "number", step: "0.01" },
      { name: "efektifKerjaJam", label: "Efektif Kerja (jam)", type: "number", step: "0.01" },
      { name: "durasiPerjalananJam", label: "Durasi Perjalanan (jam)", type: "number", step: "0.01" },
      { name: "lamaA", label: "Lama A", type: "text", placeholder: "cth: 7 Jam 18 Menit" },
      { name: "pic", label: "P I C", type: "text", placeholder: "cth: Dedicated Telkom" },
      { name: "kmAwal", label: "KM awal", type: "number", step: "0.01" },
      { name: "kmAkhir", label: "KM akhir", type: "number", step: "0.01" },
      { name: "jarakTempuh", label: "Jarak Tempuh", type: "number", step: "0.01", computeFrom: ["kmAkhir", "kmAwal"], computeFormula: "subtract" },
      { name: "jenisBbm", label: "Jenis BBM", type: "text", placeholder: "cth: PERTALITE / DEXLITE" },
      { name: "pengisianLiter", label: "Pengisian (Liter)", type: "number", step: "0.01" },
      { name: "hargaBbm", label: "Harga BBM", type: "money" },
      { name: "totalBbm", label: "Total BBM", type: "money", computeFrom: ["pengisianLiter", "hargaBbm"], computeFormula: "multiply" },
      { name: "penumpang", label: "Penumpang", type: "text", placeholder: "cth: 4 Orang" },
      { name: "keterangan", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "material", title: "Material Replacement", description: "Penggantian material gedung (sheet 09).",
    model: "materialReplacement",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "replacedAt", label: "Tanggal", type: "date" },
      { name: "areaName", label: "Ruangan", type: "text" },
      { name: "materialName", label: "Material", type: "text" },
      { name: "specification", label: "Spesifikasi", type: "text" },
      { name: "qty", label: "Qty", type: "number" },
      { name: "unit", label: "Satuan", type: "text", placeholder: "cth: Unit / Pcs / Box / Roll" },
      { name: "oldCondition", label: "Kondisi Material Lama", type: "text" },
      { name: "reason", label: "Alasan Penggantian", type: "textarea", colSpan: 2 },
      { name: "estimatedCost", label: "Estimasi Biaya", type: "money" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "open-invoice", title: "Open Invoice", description: "Invoice vendor belum dibayar / open (sheet 16).",
    model: "invoice", fixedValues: { sheetKey: "open-invoice" }, summaryField: "invoiceNo",
    fields: [
      { name: "no", label: "No.", type: "number" },
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "invoiceNo", label: "No Invoice", type: "text" },
      { name: "vendorName", label: "Vendor", type: "text" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "serviceType", label: "Jenis Layanan", type: "text" },
      { name: "invoicePeriod", label: "Periode Invoice", type: "text" },
      { name: "invoiceDate", label: "Tanggal Invoice", type: "date" },
      { name: "dueDate", label: "Due Date", type: "date" },
      { name: "amount", label: "Nilai Invoice", type: "money", required: true },
      { name: "agingDays", label: "Aging (Hari)", type: "number" },
      { name: "status", label: "Status", type: "select", options: UPDATE_STATUS, defaultValue: "OPEN" },
      { name: "issueNotes", label: "Kendala", type: "textarea", colSpan: 2 },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "invoice-proses", title: "Invoice Proses", description: "Invoice vendor dalam proses pembayaran (sheet 17).",
    model: "invoice", fixedValues: { sheetKey: "invoice-proses" }, summaryField: "invoiceNo",
    fields: [
      { name: "no", label: "No.", type: "number" },
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "invoiceNo", label: "No Invoice", type: "text" },
      { name: "vendorName", label: "Vendor", type: "text" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "serviceType", label: "Jenis Layanan", type: "text" },
      { name: "invoicePeriod", label: "Periode", type: "text" },
      { name: "amount", label: "Nilai Invoice", type: "money", required: true },
      { name: "receivedAt", label: "Tanggal Diterima", type: "date" },
      { name: "processedAt", label: "Tanggal Diproses", type: "date" },
      { name: "processDurationDays", label: "Lama Proses (Hari)", type: "number" },
      { name: "status", label: "Status", type: "select", options: UPDATE_STATUS, defaultValue: "IN_PROCESS" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "invoice-paid", title: "Invoice Paid", description: "Invoice vendor sudah dibayar (sheet 18).",
    model: "invoice", fixedValues: { sheetKey: "invoice-paid" }, summaryField: "invoiceNo",
    fields: [
      { name: "no", label: "No.", type: "number" },
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "invoiceNo", label: "No Invoice", type: "text" },
      { name: "vendorName", label: "Vendor", type: "text" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "serviceType", label: "Jenis Layanan", type: "text" },
      { name: "invoicePeriod", label: "Periode", type: "text" },
      { name: "amount", label: "Nilai Invoice", type: "money", required: true },
      { name: "dueDate", label: "Due Date", type: "date" },
      { name: "paidAt", label: "Tanggal Paid", type: "date" },
      { name: "paymentDurationDays", label: "Lama Pembayaran", type: "number" },
      { name: "status", label: "Status", type: "select", options: UPDATE_STATUS, defaultValue: "PAID" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "petty-cash", title: "Incident Petty Cash", description: "Pengeluaran kas kecil (sheet 19).",
    model: "pettyCashExpense",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "spentAt", label: "Tanggal", type: "date" },
      { name: "transactionNo", label: "No. Transaksi", type: "text" },
      { name: "expenseType", label: "Jenis Pengeluaran", type: "text", placeholder: "cth: Reimburse / Cash Advance / Operasional" },
      { name: "description", label: "Deskripsi", type: "textarea", colSpan: 2 },
      { name: "amount", label: "Nilai", type: "money" },
      { name: "budgetAmount", label: "Budget", type: "money" },
      { name: "selisih", label: "Selisih", type: "money" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "rkap-project", title: "Target RKAP", description: "Target RKAP / Project (sheet 02).",
    model: "rkapProjectEntry",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "title", label: "Program / Nama Project", type: "text", required: true },
      { name: "portfolio", label: "Portofolio", type: "text", placeholder: "cth: Enterprise / Consumer" },
      { name: "jenis", label: "Jenis", type: "select", options: ["CAPEX", "OPEX"] as const, required: true },
      { name: "newOrCo", label: "New/CO", type: "text", placeholder: "cth: New / CO" },
      { name: "capexValue", label: "Nilai Capex", type: "money" },
      { name: "jib", label: "JIB", type: "text", placeholder: "cth: JIB / Justifikasi" },
      { name: "realizationValue", label: "Nilai Realisasi", type: "money" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "penyerapan", title: "Penyerapan Anggaran", description: "Realisasi RKAP/CAPEX/OPEX (sheet 20).",
    model: "budgetAbsorption",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "jenis", label: "Jenis", type: "select", options: ["CAPEX", "OPEX"] as const, required: true },
      { name: "categoryName", label: "Kategori", type: "text" },
      { name: "rkapBudget", label: "Total Anggaran (Rp)", type: "money", required: true },
      { name: "realization", label: "Realisasi (Rp)", type: "money" },
      { name: "sisaBudget", label: "Sisa Budget", type: "money" },
      { name: "targetAbsorptionPct", label: "Target Penyerapan (%)", type: "number", step: "0.01" },
      { name: "penyerapanPct", label: "Penyerapan (%)", type: "number", step: "0.01", computeFrom: ["realization", "rkapBudget"], computeFormula: "divide_multiply" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS, defaultValue: "OPEN" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "aset-ab", title: "AB (Asset Balance)", description: "Asset balance nilai per kategori (sheet 21).",
    model: "newCapexProposal", fixedValues: { category: "AB_BALANCE" },
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "capexName", label: "Jenis Asset Balance", type: "select", options: ["Acquis Value", "Depreciation", "Book Value"] as const },
      { name: "estimatedValue", label: "Nilai", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "capex-baru", title: "Capex Baru", description: "Usulan pengadaan aset baru (sheet 22).",
    model: "newCapexProposal", fixedValues: { category: "CAPEX_BARU" },
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "capexName", label: "Nama Capex", type: "text" },
      { name: "estimatedValue", label: "Nilai", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "mutasi-aset", title: "Mutasi CAPEX", description: "Mutasi CAPEX per periode (sheet 23).",
    model: "assetMutation",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "assetTagInput", label: "Nama", type: "text" },
      { name: "valueAtMutation", label: "Nilai", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "inventory", title: "Inventory / Verifikasi Aset", description: "Rekapitulasi verifikasi aset fisik (sheet 24).",
    model: "inventoryVerification",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "serviceName", label: "Nama Layanan", type: "text" },
      { name: "totalAssets", label: "Total Asset", type: "number" },
      { name: "checkedAssets", label: "Asset Sudah Dicek", type: "number" },
      { name: "matchedAssets", label: "Asset Sesuai", type: "number" },
      { name: "assetUnchecked", label: "Asset Belum Dicek", type: "number" },
      { name: "unmatchedAssets", label: "Asset Tidak Sesuai", type: "number" },
      { name: "progressPct", label: "Progres (%)", type: "number", step: "0.1" },
      { name: "findings", label: "Temuan", type: "textarea", colSpan: 2 },
      { name: "checkedAt", label: "Tanggal Update", type: "date" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS, defaultValue: "OPEN" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "churn", title: "Churn Risk", description: "Pelacakan risko churn pelanggan (sheet 12).",
    model: "churnRisk",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "customerName", label: "Customer/Unit", type: "text" },
      { name: "serviceName", label: "Layanan", type: "text" },
      { name: "potentialDesc", label: "Potensi Churn", type: "text" },
      { name: "indication", label: "Indikasi/Alasan", type: "textarea", colSpan: 2 },
      { name: "impact", label: "Dampak", type: "text" },
      { name: "probability", label: "Probability", type: "select", options: ["LOW", "MEDIUM", "HIGH"] as const },
      { name: "actionPlan", label: "Action Plan", type: "textarea", colSpan: 2 },
      { name: "targetFollowUpDate", label: "Target Follow Up", type: "date" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
];

export function getSection(key: string, _isW1: boolean = false): SectionConfig | undefined {
  return SECTIONS.find((s) => s.key === key) || AREA_SECTIONS.find((s) => s.key === key);
}

export type SheetGroup = {
  key: string;
  title: string;
  badgeTitle?: string;
  sectionKeys: string[];
};

/**
 * 3 Sheet Utama untuk laporan WILAYAH 1 (Medan / Area 1) sesuai file Excel referensi
 * "1. REPORT FAM AREA-1 AGUSTUS 2026.xlsx":
 * 1. ALERT (Status PKS, Due Date Project, Maintenance Terjadwal, Perawatan Insiden, Near Miss)
 * 2. Consume & Cost (Biaya Listrik, PDAM, Solar Genset)
 * 3. Status & Utilisasi gedung (Utilisasi, Booking, Churn, Keamanan/ME, Layanan Aktif, Karyawan, Invoice & Financial)
 */
export const WILAYAH1_SHEETS: SheetGroup[] = [
  {
    key: "alert",
    title: "ALERT",
    badgeTitle: "I. ALERT",
    sectionKeys: [
      "mandatory-gedung", // 1. STATUS PKS
      "rkap-project",     // 2. DUE DATE PROJECK
      "maintenance",      // 3. PEKERJAAN MAINTENANCE TERJADWAL+1
      "material",         // 4. PERAWATAN BY INSIDEN
      "incident",         // 5. NEAR MISS & INCIDENT
    ],
  },
  {
    key: "consume-cost",
    title: "Consume & Cost",
    badgeTitle: "II. CONSUME & COST",
    sectionKeys: [
      "listrik",          // Biaya Listrik
      "pdam",             // Pemakaian PDAM
      "genset",           // Solar Genset
    ],
  },
  {
    key: "status-utilisasi",
    title: "Status & Utilisasi gedung",
    badgeTitle: "III. STATUS & UTILISASI GEDUNG",
    sectionKeys: [
      "utilisasi",        // 1. UTILISASI GEDUNG
      "booking",          // 2. Booking status
      "churn",            // 3. Churn possibility
      "keamanan",         // 4. KEAMANAN, KEBERSIHAN, ME
      "layanan-aktif",    // 5. LAYANAN AKTIF & JUMLAH SDM
      "karyawan",         // 6. JUMLAH KARYAWAN
    ],
  },
  {
    key: "invoice-financial",
    title: "Invoice & Finansial",
    badgeTitle: "IV. INVOICE & FINANSIAL",
    sectionKeys: [
      "open-invoice",     // Open Invoice
      "invoice-proses",   // Invoice Proses
      "invoice-paid",     // Invoice Paid
      "petty-cash",       // Incident Petty Cash
      "penyerapan",       // Target RKAP
    ],
  },
];

/**
 * Konfigurasi sections khusus untuk laporan WILAYAH 1 (Area 1 / Gatsu Medan).
 * Kolom-kolom disesuaikan secara presisi 100% sesuai dengan Excel referensi Area 1.
 */
export const WILAYAH1_SECTIONS: SectionConfig[] = [
  // ==========================================
  // SHEET I: ALERT
  // ==========================================
  {
    key: "mandatory-gedung",
    title: "1. STATUS PKS",
    description: "Status dan masa aktif PKS mitra (Sheet I. ALERT - 1. STATUS PKS).",
    model: "buildingMandatoryEntry",
    summaryField: "docRef",
    fields: [
      { name: "docRef", label: "NOMOR PKS", type: "text", required: true, placeholder: "cth: 003/IN/MITRA/LEGL-COPR/25 / NON PKS" },
      { name: "jenisBeban", label: "NAMA PKS", type: "text", required: true, placeholder: "cth: Penyediaan Air Mineral / SERVICE LIFT" },
      { name: "activePeriod", label: "MASA AKTIF PKS", type: "text", placeholder: "cth: 31 Des '27 / ONE TIME CAS" },
      { name: "mitra", label: "MITRA", type: "text", placeholder: "cth: PT. SINAR SOSRO GUNUNG SLAMET / TEKNISI" },
      { name: "lokasiMitra", label: "LOKASI MITRA", type: "text", placeholder: "cth: MEDAN / JAKARTA" },
    ],
  },
  {
    key: "rkap-project",
    title: "2. DUE DATE PROJECK",
    description: "Progress dan target project (Sheet I. ALERT - 2. DUE DATE PROJECK).",
    model: "rkapProjectEntry",
    summaryField: "title",
    fields: [
      { name: "title", label: "URAIAN PROJECK", type: "text", required: true, placeholder: "cth: INVENTARISIR ASET GATSU" },
      { name: "targetDesc", label: "TARGET", type: "text", placeholder: "cth: Q3 2026 (30 SEPT '26) / 31 DES 2026" },
      { name: "statusSaatIni", label: "STATUS SAAT INI", type: "text", placeholder: "cth: CC MESTIKA / DRAFT JIB / DONE" },
      { name: "actionField", label: "ACTION", type: "text", placeholder: "cth: DONE / ON PROSES / PENGISIAN OLEH MASING MASING SITE" },
      { name: "notes", label: "KETERANGAN", type: "textarea", placeholder: "cth: BA SDH DI TTD / ON PROSES TTD BA" },
    ],
  },
  {
    key: "maintenance",
    title: "3. PEKERJAAN MAINTENANCE TERJADWAL+1",
    description: "Jadwal dan realisasi maintenance rutin oleh mitra (Sheet I. ALERT - 3. PEKERJAAN MAINTENANCE TERJADWAL+1).",
    model: "maintenanceWork",
    summaryField: "workCategory",
    fields: [
      { name: "workCategory", label: "MAINTENANCE BY MITRA", type: "text", required: true, placeholder: "cth: SERVICE AC RUTIN" },
      { name: "frekuensi", label: "FREKUENSI", type: "text", placeholder: "cth: Per 4 Bulan / Per 3 Bulan / 1X PER Bulan" },
      { name: "jadwalRutin", label: "JADWAL", type: "text", placeholder: "cth: APRIL, AGUS, DES" },
      { name: "realisasiCurrent", label: "REALISASI", type: "text", placeholder: "cth: 1-31 AGUS '26 / 30 AGUS '26" },
      { name: "rencanaNext", label: "RENCANA (+1 BULAN)", type: "text", placeholder: "cth: tdk ada jadwal / akhir september" },
    ],
  },
  {
    key: "material",
    title: "4. PERAWATAN BY INSIDEN",
    description: "Catatan perbaikan mandiri & minor bulanan (Sheet I. ALERT - 4. PERAWATAN BY INSIDEN).",
    model: "materialReplacement",
    summaryField: "materialName",
    fields: [
      { name: "materialName", label: "MAINTENANCE MANDIRI", type: "text", required: true, placeholder: "cth: Penggantian Bola Lampu" },
      { name: "qty", label: "JUMLAH PERBAIKAN", type: "number", required: true, defaultValue: "1" },
    ],
  },
  {
    key: "incident",
    title: "5. NEAR MISS & INCIDENT",
    description: "Insiden, near miss, atau potensi bahaya (Sheet I. ALERT - 4. NEAR MISS & INCIDENT).",
    model: "nearMissIncident",
    summaryField: "description",
    fields: [
      { name: "tanggalKejadian", label: "TANGGAL KEJADIAN", type: "text", placeholder: "cth: NIHIL atau YYYY-MM-DD" },
      { name: "description", label: "URAIAN KEJADIAN", type: "textarea", required: true, placeholder: "cth: NIHIL" },
      { name: "category", label: "KATAGORI", type: "text", placeholder: "cth: NIHIL / K3 / Fasilitas" },
    ],
  },

  // ==========================================
  // SHEET II: CONSUME & COST
  // ==========================================
  {
    key: "listrik",
    title: "Biaya Listrik",
    description: "Rekap pemakaian kWh & tagihan listrik bulanan (Sheet Consume & Cost).",
    model: "utilityUsage",
    fixedValues: { type: "ELECTRICITY" },
    summaryField: "type",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "meterNo", label: "Meter ID", type: "text" },
      { name: "usageValue", label: "Pemakaian (kWh)", type: "number", step: "0.01", required: true },
      { name: "billAmount", label: "Nilai Tagihan (Rp)", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea", placeholder: "cth: sampai tanggal 4 sept belum terbit" },
    ],
  },
  {
    key: "pdam",
    title: "Pemakaian PDAM",
    description: "Rekap pemakaian air PDAM bulanan (Sheet Consume & Cost).",
    model: "utilityUsage",
    fixedValues: { type: "WATER" },
    summaryField: "type",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "meterNo", label: "No. Meter / Gol Tarif", type: "text", placeholder: "cth: Gol tarif N.3 (m3)" },
      { name: "usageValue", label: "Pemakaian (m³)", type: "number", step: "0.01", required: true },
      { name: "billAmount", label: "Nilai Tagihan (Rp)", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "genset",
    title: "Solar Genset",
    description: "Pemakaian dan stok solar genset (Sheet Consume & Cost).",
    model: "gensetUsage",
    summaryField: "gedungName",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "usageLiters", label: "Pemakaian Solar (Liter)", type: "number", step: "0.01", required: true },
      { name: "refillQty", label: "Stock / Pembelian Solar (Liter)", type: "number", step: "0.01" },
      { name: "operatingHours", label: "Jam Operasi Genset", type: "number", step: "0.01" },
      { name: "totalBiaya", label: "Total Biaya (Rp)", type: "money" },
      { name: "notes", label: "Keterangan", type: "textarea", placeholder: "cth: beli 170 liter saat black out dan badai, total jam hidup genset 24 jam" },
    ],
  },

  // ==========================================
  // SHEET III: STATUS & UTILISASI GEDUNG
  // ==========================================
  {
    key: "utilisasi",
    title: "1. UTILISASI GEDUNG",
    description: "Luas, kursi, utilisasi % per gedung (Sheet Status & Utilisasi - 1. UTILISASI GEDUNG).",
    model: "buildingUtilization",
    summaryField: "gedungName",
    fields: [
      { name: "gedungName", label: "Site", type: "text", required: true, placeholder: "cth: Gatsu Medan" },
      { name: "statusGedung", label: "Status Gedung", type: "text", placeholder: "cth: Milik Sendiri / Sewa" },
      { name: "jumlahLayanan", label: "Jumlah Layanan", type: "number", placeholder: "cth: 5" },
      { name: "usedAreaM2", label: "Luas R.Layanan", type: "number", step: "0.01", placeholder: "cth: 661" },
      { name: "totalSeats", label: "Total Seat layanan", type: "number", placeholder: "cth: 257" },
      { name: "usedSeats", label: "Used Seat", type: "number", placeholder: "cth: 229" },
      { name: "idleSeats", label: "Seat Idle", type: "number", placeholder: "cth: 28" },
      { name: "utilitasPct", label: "Occupancy", type: "number", step: "0.01", computeFrom: ["usedSeats", "totalSeats"], computeFormula: "divide_multiply" },
    ],
  },
  {
    key: "booking",
    title: "2. Booking status",
    description: "Pemesanan ruang rapat / meeting (Sheet Status & Utilisasi - 2. Booking status).",
    model: "roomBooking",
    summaryField: "roomLabel",
    fields: [
      { name: "roomLabel", label: "Ruangan", type: "text", required: true, placeholder: "cth: NIHIL / Ruang Meeting Lt. 1" },
      { name: "floorLabel", label: "Lantai", type: "text" },
      { name: "seats", label: "Jumlah Seat", type: "number" },
      { name: "bookerName", label: "Nama Pemesan", type: "text", placeholder: "cth: NIHIL" },
      { name: "bookingStatus", label: "Status", type: "select", options: ["BOOKING", "DEAL", "USED", "ON_PROGRESS"] as const, defaultValue: "BOOKING" },
      { name: "notes", label: "Keterangan", type: "textarea", placeholder: "cth: NIHIL" },
    ],
  },
  {
    key: "churn",
    title: "3. Churn possibility",
    description: "Pelacakan risiko churn penyewa / tenant (Sheet Status & Utilisasi - 3. Churn possibility).",
    model: "churnRisk",
    summaryField: "customerName",
    fields: [
      { name: "customerName", label: "Customer/Tenant", type: "text", required: true, placeholder: "cth: NIHIL" },
      { name: "potentialDesc", label: "Potensi Churn", type: "text", placeholder: "cth: NIHIL" },
      { name: "probability", label: "Probability", type: "select", options: ["LOW", "MEDIUM", "HIGH"] as const },
      { name: "actionPlan", label: "Action Plan", type: "textarea" },
      { name: "notes", label: "Keterangan", type: "textarea", placeholder: "cth: NIHIL" },
    ],
  },
  {
    key: "keamanan",
    title: "4. KEAMANAN, KEBERSIHAN, ME",
    description: "Headcount supervisor & anggota alih daya (Sheet Status & Utilisasi - 4. KEAMANAN, KEBERSIHAN, ME).",
    model: "securityHeadcount",
    summaryField: "aspect",
    fields: [
      { name: "aspect", label: "Jasa", type: "select", options: ["SECURITY", "CLEANING", "DRIVER", "ME"] as const, required: true },
      { name: "supervisorCount", label: "Danru/UL", type: "number", defaultValue: "0" },
      { name: "memberCount", label: "Anggota", type: "number", defaultValue: "0" },
      { name: "mitraName", label: "Mitra", type: "text", placeholder: "cth: GSD" },
    ],
  },
  {
    key: "layanan-aktif",
    title: "5. LAYANAN AKTIF & JUMLAH SDM",
    description: "Layanan aktif, luas, seat, dan jumlah SDM (Sheet Status & Utilisasi - 5. LAYANAN AKTIF & JUMLAH SDM).",
    model: "activeServiceEntry",
    summaryField: "serviceName",
    fields: [
      { name: "serviceName", label: "LAYANAN (USER)", type: "text", required: true, placeholder: "cth: CC BANK SUMUT lt. 1" },
      { name: "areaM2", label: "Luas (M2)", type: "number", step: "0.01" },
      { name: "totalSeats", label: "Total Seat", type: "number" },
      { name: "usedSeats", label: "Used (seat)", type: "number" },
      { name: "idleSeats", label: "Idle (seat)", type: "number" },
      { name: "staffCount", label: "Jumlah SDM", type: "number" },
    ],
  },
  {
    key: "karyawan",
    title: "6. JUMLAH KARYAWAN",
    description: "Headcount karyawan per layanan per bulan (Sheet Status & Utilisasi - 6. JUMLAH KARYAWAN).",
    model: "employeeCountEntry",
    summaryField: "unitName",
    fields: [
      { name: "unitName", label: "Layanan/Support", type: "text", required: true, placeholder: "cth: CC Bank Sumut" },
      { name: "activeCount", label: "Jumlah Karyawan", type: "number", required: true, placeholder: "cth: 11" },
    ],
  },
  {
    key: "open-invoice",
    title: "Open Invoice",
    description: "Invoice vendor belum dibayar / open (sheet 16).",
    model: "invoice",
    fixedValues: { sheetKey: "open-invoice" },
    summaryField: "invoiceNo",
    fields: [
      { name: "no", label: "No.", type: "number" },
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "invoiceNo", label: "No Invoice", type: "text" },
      { name: "vendorName", label: "Vendor", type: "text" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "serviceType", label: "Jenis Layanan", type: "text" },
      { name: "invoicePeriod", label: "Periode Invoice", type: "text" },
      { name: "invoiceDate", label: "Tanggal Invoice", type: "date" },
      { name: "dueDate", label: "Due Date", type: "date" },
      { name: "amount", label: "Nilai Invoice", type: "money", required: true },
      { name: "agingDays", label: "Aging (Hari)", type: "number" },
      { name: "status", label: "Status", type: "select", options: UPDATE_STATUS, defaultValue: "OPEN" },
      { name: "issueNotes", label: "Kendala", type: "textarea", colSpan: 2 },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "invoice-proses",
    title: "Invoice Proses",
    description: "Invoice vendor dalam proses pembayaran (sheet 17).",
    model: "invoice",
    fixedValues: { sheetKey: "invoice-proses" },
    summaryField: "invoiceNo",
    fields: [
      { name: "no", label: "No.", type: "number" },
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "invoiceNo", label: "No Invoice", type: "text" },
      { name: "vendorName", label: "Vendor", type: "text" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "serviceType", label: "Jenis Layanan", type: "text" },
      { name: "invoicePeriod", label: "Periode", type: "text" },
      { name: "amount", label: "Nilai Invoice", type: "money", required: true },
      { name: "receivedAt", label: "Tanggal Diterima", type: "date" },
      { name: "processedAt", label: "Tanggal Diproses", type: "date" },
      { name: "processDurationDays", label: "Lama Proses (Hari)", type: "number" },
      { name: "status", label: "Status", type: "select", options: UPDATE_STATUS, defaultValue: "IN_PROCESS" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "invoice-paid",
    title: "Invoice Paid",
    description: "Invoice vendor sudah dibayar (sheet 18).",
    model: "invoice",
    fixedValues: { sheetKey: "invoice-paid" },
    summaryField: "invoiceNo",
    fields: [
      { name: "no", label: "No.", type: "number" },
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "invoiceNo", label: "No Invoice", type: "text" },
      { name: "vendorName", label: "Vendor", type: "text" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "serviceType", label: "Jenis Layanan", type: "text" },
      { name: "invoicePeriod", label: "Periode", type: "text" },
      { name: "amount", label: "Nilai Invoice", type: "money", required: true },
      { name: "dueDate", label: "Due Date", type: "date" },
      { name: "paidAt", label: "Tanggal Paid", type: "date" },
      { name: "paymentDurationDays", label: "Lama Pembayaran", type: "number" },
      { name: "status", label: "Status", type: "select", options: UPDATE_STATUS, defaultValue: "PAID" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "petty-cash",
    title: "Incident Petty Cash",
    description: "Pengeluaran kas kecil (sheet 19).",
    model: "pettyCashExpense",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "spentAt", label: "Tanggal", type: "date" },
      { name: "transactionNo", label: "No. Transaksi", type: "text" },
      { name: "expenseType", label: "Jenis Pengeluaran", type: "text", placeholder: "cth: Reimburse / Cash Advance / Operasional" },
      { name: "description", label: "Deskripsi", type: "textarea", colSpan: 2 },
      { name: "amount", label: "Nilai", type: "money" },
      { name: "budgetAmount", label: "Budget", type: "money" },
      { name: "selisih", label: "Selisih", type: "money" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "penyerapan",
    title: "Target RKAP",
    description: "Realisasi RKAP/CAPEX/OPEX (sheet 20).",
    model: "budgetAbsorption",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 1" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Gatsu Medan" },
      { name: "jenis", label: "Jenis", type: "select", options: ["CAPEX", "OPEX"] as const, required: true },
      { name: "categoryName", label: "Kategori", type: "text" },
      { name: "rkapBudget", label: "Total Anggaran (Rp)", type: "money", required: true },
      { name: "realization", label: "Realisasi (Rp)", type: "money" },
      { name: "sisaBudget", label: "Sisa Budget", type: "money" },
      { name: "targetAbsorptionPct", label: "Target Penyerapan (%)", type: "number", step: "0.01" },
      { name: "penyerapanPct", label: "Penyerapan (%)", type: "number", step: "0.01", computeFrom: ["realization", "rkapBudget"], computeFormula: "divide_multiply" },
      { name: "status", label: "Status", type: "select", options: WORK_STATUS, defaultValue: "OPEN" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
];

export const WILAYAH1_SECTION_KEYS: string[] = WILAYAH1_SECTIONS.map((s) => s.key);

/**
 * Kembalikan sections khusus untuk laporan WILAYAH 1 (Medan/Area 1),
 * diurutkan sesuai struktur Excel referensi "1. REPORT FAM AREA-1".
 */
export function getSectionsForWilayah1(): SectionConfig[] {
  return SECTIONS.filter((s) => !s.areaOnly);
}

/**
  * Deteksi apakah laporan atau site termasuk Wilayah 1 (Dinonaktifkan agar 1 format seragam untuk semua area).
  */
export function isWilayah1(_regionName?: string | null, _siteCode?: string | null): boolean {
  return false;
}

/** Semua sections khusus untuk laporan Area 1 & 2 (dari Excel Area 2 reference) */
export const AREA_SECTIONS: SectionConfig[] = [
  {
    key: "area-layanan",
    title: "Laporan Layanan (Luas, Seat, SDM)",
    description: "Laporan layanan per divisi per gedung — sheet 'all area 2'.",
    model: "areaLayananEntry",
    areaOnly: true,
    summaryField: "gedungName",
    fields: [
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "areaWilayah", label: "Area Wilayah", type: "text", placeholder: "cth: AREA 2" },
      { name: "gedungName", label: "Gedung", type: "text", required: true, placeholder: "cth: Fatmawati" },
      { name: "divisi", label: "Divisi", type: "text", placeholder: "cth: DEVISI GENERAL AFFAIR" },
      { name: "layanan", label: "Layanan", type: "text", placeholder: "cth: Security / ME / CS" },
      { name: "klien", label: "Klien", type: "text", placeholder: "cth: Dept. Facility" },
      { name: "luasM2", label: "Luas (m\u00B2)", type: "number", step: "0.01" },
      { name: "jumlahSeat", label: "Jml Seat", type: "number" },
      { name: "jumlahSdm", label: "Jml SDM", type: "number" },
      { name: "lantai", label: "Lantai", type: "text" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "area-idle-seat",
    title: "Summary Idle Seat",
    description: "Ringkasan seat/ruangan idle per site — sheet 'Summary Idle Seat'.",
    model: "areaIdleSeatEntry",
    areaOnly: true,
    summaryField: "gedungName",
    fields: [
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "areaWilayah", label: "Area Wilayah", type: "text" },
      { name: "gedungName", label: "Gedung/Site", type: "text", required: true },
      { name: "layananName", label: "Nama Layanan", type: "text", placeholder: "cth: Eks SILOAM" },
      { name: "luasM2", label: "Luas (m\u00B2)", type: "number", step: "0.01" },
      { name: "jumlahSeat", label: "Jumlah Seat", type: "number" },
      { name: "lantai", label: "Lantai", type: "text" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "area-sdm-fam",
    title: "Jumlah SDM Support FAM",
    description: "Headcount tenaga kerja (Security, Driver, ME, Mail Boy, CS) per gedung — sheet 'Jmh SDM Suport Fam'.",
    model: "areaSdmEntry",
    areaOnly: true,
    summaryField: "gedungName",
    fields: [
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "areaWilayah", label: "Area Wilayah", type: "text" },
      { name: "gedungName", label: "Area Gedung", type: "text", required: true, placeholder: "cth: Fatmawati" },
      { name: "jumlahSecurity", label: "Security", type: "number", defaultValue: "0" },
      { name: "jumlahDriver", label: "Driver", type: "number", defaultValue: "0" },
      { name: "jumlahMe", label: "ME", type: "number", defaultValue: "0" },
      { name: "jumlahMailBoy", label: "Mail Boy", type: "number", defaultValue: "0" },
      { name: "jumlahCs", label: "Cleaning Service", type: "number", defaultValue: "0" },
      { name: "totalTenaga", label: "Total", type: "number", computeFrom: ["jumlahSecurity", "jumlahDriver", "jumlahMe", "jumlahMailBoy", "jumlahCs"] },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "area-kerusakan",
    title: "Kerusakan Sarana Kerja",
    description: "Form laporan kerusakan harian per gedung — sheet 'Kerusakan Sarana kerja'.",
    model: "areaMaintenanceEntry",
    areaOnly: true,
    fields: [
      { name: "tglKerja", label: "Tanggal", type: "date", required: true },
      { name: "gedungName", label: "Gedung", type: "text", required: true },
      { name: "lantai", label: "Lantai", type: "text" },
      { name: "jenisKerusakan", label: "Jenis Kerusakan", type: "textarea", colSpan: 2, required: true },
      { name: "dikerjakanFam", label: "FAM", type: "text" },
      { name: "dikerjakanLayanan", label: "Layanan", type: "text" },
      { name: "dikerjakanBmGedung", label: "BM Gedung", type: "text" },
      { name: "dikerjakanVendor", label: "Vendor", type: "text" },
      { name: "tglSelesai", label: "Tgl Selesai", type: "date" },
      { name: "material", label: "Material", type: "text" },
      { name: "jumlahMaterial", label: "Jml Material", type: "number", step: "0.01" },
      { name: "satuan", label: "Satuan", type: "text", placeholder: "cth: Pcs / Box" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "area-mobil",
    title: "Laporan Mobil Operasional",
    description: "Log harian kendaraan dinas per area — sheet 'Lap. Mobil Opr'.",
    model: "areaVehicleLogEntry",
    areaOnly: true,
    fields: [
      { name: "tglLog", label: "Tanggal", type: "date", required: true },
      { name: "gedungName", label: "Gedung/Area", type: "text", placeholder: "cth: Jakarta - Fatmawati" },
      { name: "namaDriver", label: "Nama Driver", type: "text", required: true },
      { name: "nopol", label: "No. Polisi", type: "text", required: true },
      { name: "tujuan", label: "Tujuan", type: "text" },
      { name: "dept", label: "Dept", type: "text" },
      { name: "jamDatang", label: "Jam Datang", type: "text", placeholder: "HH:MM" },
      { name: "jamPergi", label: "Jam Pergi", type: "text", placeholder: "HH:MM" },
      { name: "jamPulang", label: "Jam Pulang", type: "text", placeholder: "HH:MM" },
      { name: "jamKerjaMenit", label: "Jam Kerja (menit)", type: "number" },
      { name: "durasiMenit", label: "Durasi Perjalanan (menit)", type: "number" },
      { name: "kmAwal", label: "KM Awal", type: "number" },
      { name: "kmAkhir", label: "KM Akhir", type: "number" },
      { name: "jarakKm", label: "Jarak Tempuh (km)", type: "number", step: "0.01" },
      { name: "jenisBbm", label: "Jenis BBM", type: "text", placeholder: "cth: Bio Solar / Pertalite" },
      { name: "literBbm", label: "Pengisian (Liter)", type: "number", step: "0.01" },
      { name: "penumpang", label: "Penumpang", type: "text" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "area-mandatory-cost",
    title: "Biaya Mandatory per Gedung",
    description: "Rekapitulasi biaya mandatory per gedung (sheet Biaya Mandatory).",
    model: "areaMandatoryCostEntry",
    areaOnly: true,
    summaryField: "gedungName",
    fields: [
      { name: "gedungName", label: "Gedung/site", type: "text", required: true, placeholder: "cth: Fatmawati" },
      { name: "komponen", label: "Komponen", type: "text", required: true, placeholder: "cth: Sewa Gedung / Service Charge / Listrik" },
      { name: "totalAmount", label: "Total (Rp)", type: "money", required: true },
      { name: "statusPks", label: "Status PKS", type: "select", options: ["Active", "Non Active"] as const, defaultValue: "Active" },
      { name: "masaAktifPks", label: "Masa Aktif PKS", type: "text", placeholder: "cth: 01 Jan 2026 - 31 Des 2026" },
      { name: "notes", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "listrik",
    title: "Pemakaian Listrik",
    description: "Rekap pemakaian & tagihan listrik bulanan (sheet 05).",
    model: "utilityUsage",
    fixedValues: { type: "ELECTRICITY" },
    summaryField: "gedungName",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "meterNo", label: "Meter ID", type: "text" },
      { name: "usageValue", label: "Pemakaian (kWh)", type: "number", step: "0.01", required: true },
      { name: "billAmount", label: "Nilai Tagihan", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "genset",
    title: "Solar Genset",
    description: "Pemakaian solar untuk genset (sheet 06).",
    model: "gensetUsage",
    summaryField: "gedungName",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "gensetCode", label: "Genset ID", type: "text" },
      { name: "usageLiters", label: "Pemakaian Solar (L)", type: "number", step: "0.01", required: true },
      { name: "operatingHours", label: "Jam Operasi Genset", type: "number", step: "0.01" },
      { name: "refillQty", label: "Jumlah Pengisian (L)", type: "number", step: "0.01" },
      { name: "pricePerLiter", label: "Harga/Liter", type: "money" },
      { name: "totalBiaya", label: "Total Biaya", type: "money" },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "bbm",
    title: "BBM Kendaraan",
    description: "Laporan penggunaan BBM kendaraan dinas sesuai form operasional.",
    model: "vehicleFuelUsage",
    summaryField: "nopol",
    fields: [
      { name: "tgl", label: "TGL", type: "date", required: true, placeholder: "YYYY-MM-DD" },
      { name: "nama", label: "Nama", type: "text", placeholder: "Nama Driver" },
      { name: "nopol", label: "Nopol", type: "text", required: true, placeholder: "cth: B 2501 PIM" },
      { name: "area", label: "Area", type: "text", placeholder: "cth: AREA 2" },
      { name: "tujuan", label: "Tujuan", type: "text", placeholder: "cth: Stenby / Kemenlu, Fatma" },
      { name: "dept", label: "Dept", type: "text", placeholder: "cth: Corporate / Sales / PM" },
      { name: "datang", label: "Datang", type: "text", placeholder: "08:00" },
      { name: "pergi", label: "Pergi", type: "text", placeholder: "09:45" },
      { name: "pulang", label: "Pulang", type: "text", placeholder: "17:03" },
      { name: "jamKerjaMenit", label: "Jam Kerja (menit)", type: "number", defaultValue: "540" },
      { name: "durasiPerjalananMenit", label: "Durasi Perjalanan (menit)", type: "number", step: "0.01" },
      { name: "efektifKerjaJam", label: "Efektif Kerja (jam)", type: "number", step: "0.01" },
      { name: "durasiPerjalananJam", label: "Durasi Perjalanan (jam)", type: "number", step: "0.01" },
      { name: "lamaA", label: "Lama A", type: "text", placeholder: "cth: 7 Jam 18 Menit" },
      { name: "pic", label: "P I C", type: "text", placeholder: "cth: Dedicated Telkom" },
      { name: "kmAwal", label: "KM awal", type: "number", step: "0.01" },
      { name: "kmAkhir", label: "KM akhir", type: "number", step: "0.01" },
      { name: "jarakTempuh", label: "Jarak Tempuh", type: "number", step: "0.01", computeFrom: ["kmAkhir", "kmAwal"], computeFormula: "subtract" },
      { name: "jenisBbm", label: "Jenis BBM", type: "text", placeholder: "cth: PERTALITE / DEXLITE" },
      { name: "pengisianLiter", label: "Pengisian (Liter)", type: "number", step: "0.01" },
      { name: "hargaBbm", label: "Harga BBM", type: "money" },
      { name: "totalBbm", label: "Total BBM", type: "money", computeFrom: ["pengisianLiter", "hargaBbm"], computeFormula: "multiply" },
      { name: "penumpang", label: "Penumpang", type: "text", placeholder: "cth: 4 Orang" },
      { name: "keterangan", label: "Keterangan", type: "textarea" },
    ],
  },
  {
    key: "pdam",
    title: "Pemakaian PDAM",
    description: "Rekap pemakaian & tagihan air PDAM bulanan (sheet 08).",
    model: "utilityUsage",
    fixedValues: { type: "WATER" },
    summaryField: "gedungName",
    fields: [
      { name: "areaWilayah", label: "Area", type: "text", placeholder: "cth: Area 2" },
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "gedungName", label: "Site/Gedung", type: "text", placeholder: "cth: Fatmawati" },
      { name: "meterNo", label: "No. Meter", type: "text" },
      { name: "usageValue", label: "Pemakaian (m³)", type: "number", step: "0.01", required: true },
      { name: "billAmount", label: "Nilai Tagihan", type: "money", required: true },
      { name: "notes", label: "Keterangan", type: "textarea" },
      { name: "updatedAt", label: "Tanggal Update", type: "date", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    key: "area-air-minum",
    title: "Pemakaian Air Minum (Galon)",
    description: "Rincian BA rekon air minum (galon) per site — sheet 'Pemakaian Air Minum'.",
    model: "areaWaterConsumptionEntry",
    areaOnly: true,
    summaryField: "siteName",
    fields: [
      { name: "periodeLabel", label: "Periode", type: "text", placeholder: "cth: Agustus 2026" },
      { name: "areaWilayah", label: "Area Wilayah", type: "text" },
      { name: "siteName", label: "Site", type: "text", required: true, placeholder: "cth: Fatmawati" },
      { name: "permintaanGalon", label: "Permintaan (Galon)", type: "number" },
      { name: "realisasiGalon", label: "Realisasi (Galon)", type: "number" },
      { name: "hargaSatuan", label: "Harga Satuan (Rp)", type: "money" },
      { name: "totalPerBulan", label: "Total/Bulan (Rp)", type: "money", computeFrom: ["permintaanGalon", "hargaSatuan"], computeFormula: "multiply" },
      { name: "totalRealisasi", label: "Total Realisasi (Rp)", type: "money", computeFrom: ["realisasiGalon", "hargaSatuan"], computeFormula: "multiply" },
      { name: "keterangan", label: "Keterangan Lokasi", type: "text", placeholder: "cth: FATMAWATI / KEMENKES" },
      { name: "notes", label: "Catatan", type: "textarea" },
    ],
  },
];

/**
 * Kembalikan sections yang sesuai berdasarkan tipe laporan.
 * isAreaReport = true untuk laporan yang site-nya bertanda isArea=true.
 */
export function getSectionsForReport(_isAreaReport?: boolean): SectionConfig[] {
  return SECTIONS.filter((s) => !s.areaOnly);
}

/** Fields that don't exist in the DB schema (truly virtual) — silently skipped on save. */
export const CONTEXT_VIRTUAL_FIELDS = new Set([
  "no",
  /**
   * updatedAt is a Prisma @updatedAt field — auto-managed by Prisma on every save.
   * Prisma v5+ rejects explicit updates to @updatedAt fields → causes "Invalid model.create() invocation".
   * We keep it as a display-only field in the form/grid (shows the last save time) but skip it on write.
   */
  "updatedAt",
]);
