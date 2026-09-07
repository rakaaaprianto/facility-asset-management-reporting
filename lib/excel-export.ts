import "server-only";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { SECTIONS, AREA_SECTIONS, MONTH_NAMES_ID, getSection, getSectionsForWilayah1, isWilayah1 } from "@/lib/section-config";
import { loadSectionRows } from "@/lib/report-service";
import type { SessionUser } from "@/lib/auth";

const BRAND_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE31E2D" },
};
const LIGHT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFE0E1" },
};
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFB0BEC5" } },
  left: { style: "thin", color: { argb: "FFB0BEC5" } },
  bottom: { style: "thin", color: { argb: "FFB0BEC5" } },
  right: { style: "thin", color: { argb: "FFB0BEC5" } },
};

type CellValue = string | number | Date | null;

function money(ws: ExcelJS.Worksheet, col: number, rowIndex: number) {
  ws.getCell(rowIndex, col).numFmt = '#,##0';
}

function serializeValue(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (typeof v === "object" && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  if (v instanceof Date) {
    const iso = v.toISOString();
    return iso.slice(0, 10);
  }
  if (typeof v === "object") return String(v);
  return v;
}

async function fetchSectionData(sectionKey: string, reportId: string, isW1: boolean = false) {
  const section = getSection(sectionKey, isW1)!;
  if (!section) return [];
  if (section.special === "aset-ab") return loadAsetAb(reportId);
  const rows = await loadSectionRows(sectionKey, reportId);
  return rows.map((r) => r as Record<string, unknown>);
}

async function loadAsetAb(reportId: string) {
  const acqs = await db.assetAcquisition.findMany({
    where: { report: { id: reportId } },
    include: {
      asset: true,
      report: { include: { site: { include: { region: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  return acqs.map((a, idx) => ({
    no: idx + 1,
    areaWilayah: a.areaWilayah || a.report?.site?.region?.name || "",
    periodeLabel: a.periodeLabel || (a.report ? `${MONTH_NAMES_ID[a.report.periodMonth - 1]} ${a.report.periodYear}` : ""),
    gedungName: a.gedungName || a.report?.site?.name || "",
    name: a.asset?.name,
    assetTag: a.asset?.assetTag,
    category: a.asset?.category,
    brand: a.asset?.brand,
    model: a.asset?.model,
    serialNumber: a.asset?.serialNumber,
    quantity: a.quantity ?? 1,
    acquiredValue: a.acquiredValue ? Number(a.acquiredValue) : null,
    source: a.source,
    assetStatus: a.asset?.status,
    currentLocation: a.asset?.currentLocation,
    notes: a.notes,
  })) as Record<string, unknown>[];
}

async function fetchBatchSectionData(
  sectionKey: string,
  reportIds: string[]
): Promise<Map<string, Record<string, unknown>[]>> {
  const section = SECTIONS.find((s) => s.key === sectionKey)!;
  const map = new Map<string, Record<string, unknown>[]>();
  if (reportIds.length === 0) return map;

  if (section.special === "aset-ab") {
    const acqs = await db.assetAcquisition.findMany({
      where: { reportId: { in: reportIds } },
      include: {
        asset: true,
        report: { include: { site: { include: { region: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const a of acqs) {
      if (!map.has(a.reportId)) map.set(a.reportId, []);
      const currentList = map.get(a.reportId)!;
      currentList.push({
        no: currentList.length + 1,
        areaWilayah: a.areaWilayah || a.report?.site?.region?.name || "",
        periodeLabel: a.periodeLabel || (a.report ? `${MONTH_NAMES_ID[a.report.periodMonth - 1]} ${a.report.periodYear}` : ""),
        gedungName: a.gedungName || a.report?.site?.name || "",
        name: a.asset?.name,
        assetTag: a.asset?.assetTag,
        category: a.asset?.category,
        brand: a.asset?.brand,
        model: a.asset?.model,
        serialNumber: a.asset?.serialNumber,
        quantity: a.quantity ?? 1,
        acquiredValue: a.acquiredValue ? Number(a.acquiredValue) : null,
        source: a.source,
        assetStatus: a.asset?.status,
        currentLocation: a.asset?.currentLocation,
        notes: a.notes,
      });
    }
    return map;
  }

  const model = (
    db as unknown as Record<
      string,
      {
        findMany(args: {
          where: Record<string, unknown>;
          orderBy?: Record<string, string>;
        }): Promise<Array<Record<string, unknown> & { id: string; reportId: string }>>;
      }
    >
  )[section.model];
  if (!model) return map;

  const fixed = section.fixedValues ?? {};
  let whereClause: Record<string, unknown> = { reportId: { in: reportIds }, ...fixed };
  if (section.model === "invoice" && fixed.sheetKey) {
    if (fixed.sheetKey === "open-invoice") {
      whereClause = {
        reportId: { in: reportIds },
        OR: [
          { sheetKey: "open-invoice" },
          { sheetKey: null, status: { notIn: ["IN_PROCESS", "PAID"] } },
        ],
      };
    } else if (fixed.sheetKey === "invoice-proses") {
      whereClause = {
        reportId: { in: reportIds },
        OR: [
          { sheetKey: "invoice-proses" },
          { sheetKey: null, status: "IN_PROCESS" },
        ],
      };
    } else if (fixed.sheetKey === "invoice-paid") {
      whereClause = {
        reportId: { in: reportIds },
        OR: [
          { sheetKey: "invoice-paid" },
          { sheetKey: null, status: "PAID" },
        ],
      };
    }
  }

  const raw = await model.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });

  for (const r of raw) {
    if (!map.has(r.reportId)) map.set(r.reportId, []);
    const rowObj: Record<string, unknown> = { id: r.id };
    for (const [k, v] of Object.entries(r)) {
      if (k === "id") continue;
      rowObj[k] = serializeValue(v);
    }
    map.get(r.reportId)!.push(rowObj);
  }
  return map;
}

function cellOut(fieldType: string, raw: unknown): CellValue {
  if (raw == null || raw === "") return null;
  if (fieldType === "date") return new Date(String(raw));
  if (fieldType === "money" || fieldType === "number") return Number(raw);
  if (typeof raw === "object") return String(raw);
  return String(raw);
}

async function exportWilayah1Workbook(
  wb: ExcelJS.Workbook,
  report: { id: string; siteId: string; periodYear: number; periodMonth: number; site: { code: string; name: string } },
  periodLabel: string,
  gedungLabel: string
) {
  const reportId = report.id;

  const addTableSectionHeader = (ws: ExcelJS.Worksheet, title: string) => {
    const row = ws.addRow([title]);
    row.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
    row.height = 22;
    return row;
  };

  const addTableColumnsHeader = (ws: ExcelJS.Worksheet, headers: string[]) => {
    const row = ws.addRow(headers);
    row.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = BRAND_FILL;
      c.border = BORDER;
      c.alignment = { vertical: "middle", wrapText: true };
    });
    row.height = 24;
    return row;
  };

  // ==========================================
  // 1. SHEET: ALERT
  // ==========================================
  const wsAlert = wb.addWorksheet("ALERT");

  const titleRow = wsAlert.addRow(["I.", "ALERT"]);
  titleRow.font = { bold: true, size: 14 };
  wsAlert.addRow([]);

  // 1. STATUS PKS
  addTableSectionHeader(wsAlert, "1. STATUS PKS");
  addTableColumnsHeader(wsAlert, ["NOMOR PKS", "NAMA PKS", "MASA AKTIF PKS", "MITRA", "LOKASI MITRA"]);
  const pksRows = await fetchSectionData("mandatory-gedung", reportId, true);
  for (const r of pksRows) {
    const row = wsAlert.addRow([r.docRef, r.jenisBeban, r.activePeriod, r.mitra, r.lokasiMitra]);
    row.eachCell((c) => (c.border = BORDER));
  }
  wsAlert.addRow([]);

  // 2. DUE DATE PROJECK
  addTableSectionHeader(wsAlert, "2. DUE DATE PROJECK");
  addTableColumnsHeader(wsAlert, ["URAIAN PROJECK", "TARGET", "STATUS SAAT INI", "ACTION", "KETERANGAN"]);
  const dueRows = await fetchSectionData("rkap-project", reportId, true);
  for (const r of dueRows) {
    const row = wsAlert.addRow([r.title, r.targetDesc, r.statusSaatIni, r.actionField, r.notes]);
    row.eachCell((c) => (c.border = BORDER));
  }
  wsAlert.addRow([]);

  // 3. PEKERJAAN MAINTENANCE TERJADWAL+1
  addTableSectionHeader(wsAlert, "3. PEKERJAAN MAINTENANCE TERJADWAL+1");
  addTableColumnsHeader(wsAlert, ["MAINTENANCE BY MITRA", "FREKUENSI", "JADWAL", "REALISASI", "RENCANA (+1 BULAN)"]);
  const maintRows = await fetchSectionData("maintenance", reportId, true);
  for (const r of maintRows) {
    const row = wsAlert.addRow([r.workCategory, r.frekuensi, r.jadwalRutin, r.realisasiCurrent, r.rencanaNext]);
    row.eachCell((c) => (c.border = BORDER));
  }
  wsAlert.addRow([]);

  // 4. PERAWATAN BY INSIDEN
  addTableSectionHeader(wsAlert, "4. PERAWATAN BY INSIDEN");
  addTableColumnsHeader(wsAlert, ["MAINTENANCE MANDIRI", "JUMLAH PERBAIKAN"]);
  const matRows = await fetchSectionData("material", reportId, true);
  let totalPerbaikan = 0;
  for (const r of matRows) {
    const qty = Number(r.qty) || 0;
    totalPerbaikan += qty;
    const row = wsAlert.addRow([r.materialName, qty]);
    row.eachCell((c) => (c.border = BORDER));
  }
  if (matRows.length > 0) {
    const totRow = wsAlert.addRow(["TOTAL", totalPerbaikan]);
    totRow.font = { bold: true };
    totRow.eachCell((c) => (c.border = BORDER));
  }
  wsAlert.addRow([]);

  // 5. NEAR MISS & INCIDENT
  addTableSectionHeader(wsAlert, "4. NEAR MISS & INCIDENT");
  addTableColumnsHeader(wsAlert, ["TANGGAL KEJADIAN", "URAIAN KEJADIAN", "KATAGORI"]);
  const incRows = await fetchSectionData("incident", reportId, true);
  if (incRows.length === 0) {
    const row = wsAlert.addRow(["NIHIL", "NIHIL", "NIHIL"]);
    row.eachCell((c) => (c.border = BORDER));
  } else {
    for (const r of incRows) {
      const row = wsAlert.addRow([r.tanggalKejadian || "NIHIL", r.description || "NIHIL", r.category || "NIHIL"]);
      row.eachCell((c) => (c.border = BORDER));
    }
  }

  [35, 45, 25, 30, 25, 20].forEach((w, i) => {
    wsAlert.getColumn(i + 1).width = w;
  });

  // ==========================================
  // 2. SHEET: Consume & Cost
  // ==========================================
  const wsConsume = wb.addWorksheet("Consume & Cost");
  const cTitle = wsConsume.addRow(["CONSUME & COST"]);
  cTitle.font = { bold: true, size: 14 };
  wsConsume.addRow([]);

  addTableSectionHeader(wsConsume, "1. PEMAKAIAN LISTRIK");
  addTableColumnsHeader(wsConsume, ["Area", "Periode", "Site/Gedung", "Meter ID", "Pemakaian (kWh)", "Nilai Tagihan (Rp)", "Keterangan"]);
  const listrikRows = await fetchSectionData("listrik", reportId, true);
  for (const r of listrikRows) {
    const row = wsConsume.addRow([r.areaWilayah || "Area 1", r.periodeLabel || periodLabel, r.gedungName || gedungLabel, r.meterNo, Number(r.usageValue) || 0, Number(r.billAmount) || 0, r.notes]);
    row.eachCell((c) => (c.border = BORDER));
    wsConsume.getCell(row.number, 5).numFmt = "#,##0.00";
    wsConsume.getCell(row.number, 6).numFmt = "#,##0";
  }
  wsConsume.addRow([]);

  addTableSectionHeader(wsConsume, "2. PEMAKAIAN PDAM");
  addTableColumnsHeader(wsConsume, ["Area", "Periode", "Site/Gedung", "No. Meter / Gol Tarif", "Pemakaian (m³)", "Nilai Tagihan (Rp)", "Keterangan"]);
  const pdamRows = await fetchSectionData("pdam", reportId, true);
  for (const r of pdamRows) {
    const row = wsConsume.addRow([r.areaWilayah || "Area 1", r.periodeLabel || periodLabel, r.gedungName || gedungLabel, r.meterNo, Number(r.usageValue) || 0, Number(r.billAmount) || 0, r.notes]);
    row.eachCell((c) => (c.border = BORDER));
    wsConsume.getCell(row.number, 5).numFmt = "#,##0.00";
    wsConsume.getCell(row.number, 6).numFmt = "#,##0";
  }
  wsConsume.addRow([]);

  addTableSectionHeader(wsConsume, "3. SOLAR GENSET");
  addTableColumnsHeader(wsConsume, ["Area", "Periode", "Site/Gedung", "Pemakaian Solar (Liter)", "Stock / Refill (Liter)", "Jam Operasi", "Total Biaya (Rp)", "Keterangan"]);
  const gensetRows = await fetchSectionData("genset", reportId, true);
  for (const r of gensetRows) {
    const row = wsConsume.addRow([r.areaWilayah || "Area 1", r.periodeLabel || periodLabel, r.gedungName || gedungLabel, Number(r.usageLiters) || 0, Number(r.refillQty) || 0, Number(r.operatingHours) || 0, Number(r.totalBiaya) || 0, r.notes]);
    row.eachCell((c) => (c.border = BORDER));
    wsConsume.getCell(row.number, 4).numFmt = "#,##0.00";
    wsConsume.getCell(row.number, 5).numFmt = "#,##0.00";
    wsConsume.getCell(row.number, 7).numFmt = "#,##0";
  }

  [20, 20, 25, 25, 20, 22, 35].forEach((w, i) => {
    wsConsume.getColumn(i + 1).width = w;
  });

  // ==========================================
  // 3. SHEET: Status & Utilisasi gedung
  // ==========================================
  const wsStatus = wb.addWorksheet("Status & Utilisasi gedung");

  addTableSectionHeader(wsStatus, "1. UTILISASI GEDUNG");
  addTableColumnsHeader(wsStatus, ["Site", "Status Gedung", "Jumlah Layanan", "Luas R.Layanan", "Total Seat layanan", "Used Seat", "Seat Idle", "Occupancy"]);
  const utilRows = await fetchSectionData("utilisasi", reportId, true);
  for (const r of utilRows) {
    const used = Number(r.usedSeats) || 0;
    const total = Number(r.totalSeats) || 0;
    const occ = total > 0 ? used / total : 0;
    const row = wsStatus.addRow([r.gedungName || gedungLabel, r.statusGedung || "Milik Sendiri", Number(r.jumlahLayanan) || 5, Number(r.usedAreaM2) || 0, total, used, Number(r.idleSeats) || 0, occ]);
    row.eachCell((c) => (c.border = BORDER));
    wsStatus.getCell(row.number, 4).numFmt = "#,##0";
    wsStatus.getCell(row.number, 5).numFmt = "#,##0";
    wsStatus.getCell(row.number, 6).numFmt = "#,##0";
    wsStatus.getCell(row.number, 7).numFmt = "#,##0";
    wsStatus.getCell(row.number, 8).numFmt = "0.0%";
  }
  wsStatus.addRow([]);

  const bookRows = await fetchSectionData("booking", reportId, true);
  if (bookRows.length === 0) {
    const bRow = wsStatus.addRow(["2. Booking status", "NIHIL"]);
    bRow.font = { bold: true };
  } else {
    addTableSectionHeader(wsStatus, "2. Booking status");
    addTableColumnsHeader(wsStatus, ["Ruangan", "Lantai", "Jumlah Seat", "Nama Pemesan", "Status", "Keterangan"]);
    for (const r of bookRows) {
      const row = wsStatus.addRow([r.roomLabel, r.floorLabel, r.seats, r.bookerName, r.bookingStatus, r.notes]);
      row.eachCell((c) => (c.border = BORDER));
    }
  }
  wsStatus.addRow([]);

  const churnRows = await fetchSectionData("churn", reportId, true);
  if (churnRows.length === 0) {
    const cRow = wsStatus.addRow(["3. Churn possibility", "NIHIL"]);
    cRow.font = { bold: true };
  } else {
    addTableSectionHeader(wsStatus, "3. Churn possibility");
    addTableColumnsHeader(wsStatus, ["Customer/Tenant", "Potensi Churn", "Probability", "Action Plan", "Keterangan"]);
    for (const r of churnRows) {
      const row = wsStatus.addRow([r.customerName, r.potentialDesc, r.probability, r.actionPlan, r.notes]);
      row.eachCell((c) => (c.border = BORDER));
    }
  }
  wsStatus.addRow([]);

  addTableSectionHeader(wsStatus, "4. KEAMANAN, KEBERSIHAN, ME");
  addTableColumnsHeader(wsStatus, ["Jasa", "Danru/UL", "Anggota", "Mitra"]);
  const secRows = await fetchSectionData("keamanan", reportId, true);
  for (const r of secRows) {
    const aspectName = r.aspect === "SECURITY" ? "Keamanan" : r.aspect === "CLEANING" ? "Kebersihan" : r.aspect === "ME" ? "ME" : String(r.aspect || "");
    const row = wsStatus.addRow([aspectName, r.supervisorCount ?? "", r.memberCount ?? "", r.mitraName || "GSD"]);
    row.eachCell((c) => (c.border = BORDER));
  }
  wsStatus.addRow([]);

  addTableSectionHeader(wsStatus, "5. LAYANAN AKTIF & JUMLAH SDM");
  addTableColumnsHeader(wsStatus, ["LAYANAN (USER)", "Luas (M2)", "Total Seat", "Used (seat)", "Idle (seat)", "Jumlah SDM"]);
  const srvRows = await fetchSectionData("layanan-aktif", reportId, true);
  let totLuas = 0, totSeats = 0, totUsed = 0, totIdle = 0, totSdm = 0;
  for (const r of srvRows) {
    const luas = Number(r.areaM2) || 0;
    const seat = Number(r.totalSeats) || 0;
    const uSeat = Number(r.usedSeats) || 0;
    const iSeat = Number(r.idleSeats) || 0;
    const sdm = Number(r.staffCount) || 0;
    totLuas += luas;
    totSeats += seat;
    totUsed += uSeat;
    totIdle += iSeat;
    totSdm += sdm;
    const row = wsStatus.addRow([r.serviceName, luas || "", seat || "", uSeat || "", iSeat || "", sdm || ""]);
    row.eachCell((c) => (c.border = BORDER));
  }
  if (srvRows.length > 0) {
    const totRow = wsStatus.addRow(["TOTAL", totLuas, totSeats, totUsed, totIdle, totSdm]);
    totRow.font = { bold: true };
    totRow.eachCell((c) => (c.border = BORDER));
  }
  wsStatus.addRow([]);

  addTableSectionHeader(wsStatus, "6. JUMLAH KARYAWAN");
  addTableColumnsHeader(wsStatus, ["Layanan/Support", "Jumlah Karyawan"]);
  const empRows = await fetchSectionData("karyawan", reportId, true);
  let totKaryawan = 0;
  for (const r of empRows) {
    const jml = Number(r.activeCount) || 0;
    totKaryawan += jml;
    const row = wsStatus.addRow([r.unitName, jml]);
    row.eachCell((c) => (c.border = BORDER));
  }
  if (empRows.length > 0) {
    const totRow = wsStatus.addRow(["TOTAL", totKaryawan]);
    totRow.font = { bold: true };
    totRow.eachCell((c) => (c.border = BORDER));
  }
  wsStatus.addRow([]);

  [40, 20, 20, 20, 20, 20, 25].forEach((w, i) => {
    wsStatus.getColumn(i + 1).width = w;
  });

  // ==========================================
  // 4. SHEET: Invoice & Finansial
  // ==========================================
  const wsInv = wb.addWorksheet("Invoice & Finansial");

  const titleInv = wsInv.addRow(["IV.", "INVOICE & FINANSIAL"]);
  titleInv.font = { bold: true, size: 14 };
  wsInv.addRow([]);

  // 1. OPEN INVOICE
  addTableSectionHeader(wsInv, "1. OPEN INVOICE");
  addTableColumnsHeader(wsInv, ["No.", "No Invoice", "Vendor", "Site/Gedung", "Jenis Layanan", "Periode Invoice", "Tanggal Invoice", "Due Date", "Nilai Invoice", "Aging (Hari)", "Status", "Kendala", "Keterangan"]);
  const openRows = await fetchSectionData("open-invoice", reportId, true);
  for (const r of openRows) {
    const row = wsInv.addRow([
      r.no, r.invoiceNo, r.vendorName, r.gedungName, r.serviceType,
      r.invoicePeriod, r.invoiceDate instanceof Date ? r.invoiceDate.toLocaleDateString("id-ID") : r.invoiceDate,
      r.dueDate instanceof Date ? r.dueDate.toLocaleDateString("id-ID") : r.dueDate,
      r.amount ? Number(r.amount) : "", r.agingDays, r.status, r.issueNotes, r.notes
    ]);
    row.eachCell((c) => (c.border = BORDER));
    if (r.amount) wsInv.getCell(row.number, 9).numFmt = "#,##0";
  }
  wsInv.addRow([]);

  // 2. INVOICE PROSES
  addTableSectionHeader(wsInv, "2. INVOICE PROSES");
  addTableColumnsHeader(wsInv, ["No.", "No Invoice", "Vendor", "Site/Gedung", "Jenis Layanan", "Periode", "Nilai Invoice", "Tanggal Diterima", "Tanggal Diproses", "Lama Proses (Hari)", "Status", "Keterangan"]);
  const procRows = await fetchSectionData("invoice-proses", reportId, true);
  for (const r of procRows) {
    const row = wsInv.addRow([
      r.no, r.invoiceNo, r.vendorName, r.gedungName, r.serviceType,
      r.invoicePeriod, r.amount ? Number(r.amount) : "",
      r.receivedAt instanceof Date ? r.receivedAt.toLocaleDateString("id-ID") : r.receivedAt,
      r.processedAt instanceof Date ? r.processedAt.toLocaleDateString("id-ID") : r.processedAt,
      r.processDurationDays, r.status, r.notes
    ]);
    row.eachCell((c) => (c.border = BORDER));
    if (r.amount) wsInv.getCell(row.number, 7).numFmt = "#,##0";
  }
  wsInv.addRow([]);

  // 3. INVOICE PAID
  addTableSectionHeader(wsInv, "3. INVOICE PAID");
  addTableColumnsHeader(wsInv, ["No.", "No Invoice", "Vendor", "Site/Gedung", "Jenis Layanan", "Periode", "Nilai Invoice", "Due Date", "Tanggal Paid", "Lama Pembayaran", "Status", "Keterangan"]);
  const paidRows = await fetchSectionData("invoice-paid", reportId, true);
  for (const r of paidRows) {
    const row = wsInv.addRow([
      r.no, r.invoiceNo, r.vendorName, r.gedungName, r.serviceType,
      r.invoicePeriod, r.amount ? Number(r.amount) : "",
      r.dueDate instanceof Date ? r.dueDate.toLocaleDateString("id-ID") : r.dueDate,
      r.paidAt instanceof Date ? r.paidAt.toLocaleDateString("id-ID") : r.paidAt,
      r.paymentDurationDays, r.status, r.notes
    ]);
    row.eachCell((c) => (c.border = BORDER));
    if (r.amount) wsInv.getCell(row.number, 7).numFmt = "#,##0";
  }
  wsInv.addRow([]);

  // 4. INCIDENT PETTY CASH
  addTableSectionHeader(wsInv, "4. INCIDENT PETTY CASH");
  addTableColumnsHeader(wsInv, ["Tanggal", "No. Transaksi", "Jenis Pengeluaran", "Deskripsi", "Nilai", "Budget", "Selisih", "Status", "Keterangan"]);
  const pcRows = await fetchSectionData("petty-cash", reportId, true);
  for (const r of pcRows) {
    const row = wsInv.addRow([
      r.spentAt instanceof Date ? r.spentAt.toLocaleDateString("id-ID") : r.spentAt,
      r.transactionNo, r.expenseType, r.description,
      r.amount ? Number(r.amount) : "", r.budgetAmount ? Number(r.budgetAmount) : "",
      r.selisih ? Number(r.selisih) : "", r.status, r.notes
    ]);
    row.eachCell((c) => (c.border = BORDER));
    if (r.amount) wsInv.getCell(row.number, 5).numFmt = "#,##0";
    if (r.budgetAmount) wsInv.getCell(row.number, 6).numFmt = "#,##0";
    if (r.selisih) wsInv.getCell(row.number, 7).numFmt = "#,##0";
  }
  wsInv.addRow([]);

  // 5. TARGET RKAP / PENYERAPAN ANGGARAN
  addTableSectionHeader(wsInv, "5. TARGET RKAP / PENYERAPAN ANGGARAN");
  addTableColumnsHeader(wsInv, ["Jenis", "Kategori", "Total Anggaran (Rp)", "Realisasi (Rp)", "Sisa Budget", "Target Penyerapan (%)", "Penyerapan (%)", "Status", "Keterangan"]);
  const rkapRows = await fetchSectionData("penyerapan", reportId, true);
  for (const r of rkapRows) {
    const row = wsInv.addRow([
      r.jenis, r.categoryName, r.rkapBudget ? Number(r.rkapBudget) : "",
      r.realization ? Number(r.realization) : "", r.sisaBudget ? Number(r.sisaBudget) : "",
      r.targetAbsorptionPct, r.penyerapanPct, r.status, r.notes
    ]);
    row.eachCell((c) => (c.border = BORDER));
    if (r.rkapBudget) wsInv.getCell(row.number, 3).numFmt = "#,##0";
    if (r.realization) wsInv.getCell(row.number, 4).numFmt = "#,##0";
    if (r.sisaBudget) wsInv.getCell(row.number, 5).numFmt = "#,##0";
  }

  [15, 20, 25, 20, 20, 18, 18, 18, 20, 15, 15, 25, 25].forEach((w, i) => {
    wsInv.getColumn(i + 1).width = w;
  });
}

export async function buildReportWorkbook(
  reportId: string,
  user?: SessionUser | { roleCode: string; siteIds: string[] }
): Promise<{ buffer: Buffer; filename: string }> {
  const report = await db.monthlyReport.findUniqueOrThrow({
    where: { id: reportId },
    include: { site: { include: { region: { select: { name: true } } } } },
  });

  if (user && (user.roleCode === "PIC" || user.roleCode === "SUPPORT") && !user.siteIds.includes(report.siteId)) {
    throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengunduh laporan site ini.");
  }

  // Context values injected for virtual fields (periode, gedungName)
  const MONTH_NAMES_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const periodLabel = `${MONTH_NAMES_ID[report.periodMonth - 1]} ${report.periodYear}`;
  const gedungLabel = `${report.site.code} — ${report.site.name}`;

  const wb = new ExcelJS.Workbook();
  wb.creator = "AMRS Infomedia";
  wb.created = new Date();

  // ---------- RINGKASAN ----------
  const sum = wb.addWorksheet("RINGKASAN");
  sum.columns = [
    { width: 28 }, { width: 46 }, { width: 18 },
  ];
  sum.mergeCells("A1:C1");
  const t = sum.getCell("A1");
  t.value = "INFOMEDIA NUSANTARA — MONTHLY ASSET MANAGEMENT REPORT";
  t.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  t.fill = BRAND_FILL;
  t.alignment = { horizontal: "center", vertical: "middle" };
  sum.getRow(1).height = 26;
  const info: Array<[string, CellValue]> = [
    ["Site", `${report.site.code} — ${report.site.name}`],
    ["Kota", report.site.city ?? "-"],
    ["Periode", `${String(report.periodMonth).padStart(2, "0")}/${report.periodYear}`],
    ["Status Laporan", report.status],
    ["Disubmit", report.submittedAt ?? null],
    ["Direview", report.reviewedAt ?? null],
    ["Digenerate", new Date()],
  ];
  let row = 3;
  for (const [k, v] of info) {
    sum.getCell(row, 1).value = k;
    sum.getCell(row, 1).font = { bold: true };
    sum.getCell(row, 1).fill = LIGHT_FILL;
    sum.getCell(row, 1).border = BORDER;
    const c = sum.getCell(row, 2);
    c.value = v instanceof Date && k !== "Digenerate" ? v.toLocaleDateString("id-ID") : v;
    c.border = BORDER;
    row++;
  }

  // ---------- SHEET PER SECTION ----------

  const sectionsToExport = SECTIONS;
  for (const section of sectionsToExport) {
    const data = await fetchSectionData(section.key, reportId);
    if (data.length === 0) continue;

    const safeName = section.title.slice(0, 31).replace(/[\\/*?:[\]]/g, "");
    const ws = wb.addWorksheet(safeName);

    const fields = section.fields.filter((f) => !(section.special === "aset-ab" && f.name === "qty"));

    const headers = fields.map((f) => f.label);
    ws.addRow(headers).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = BRAND_FILL;
      c.border = BORDER;
      c.alignment = { vertical: "middle", wrapText: true };
    });
    ws.getRow(1).height = 24;

    fields.forEach((f, i) => {
      ws.getColumn(i + 1).width = f.type === "textarea" ? 40 : Math.max(12, Math.min(30, f.label.length + 6));
    });

    data.forEach((r, idx) => {
      const values: CellValue[] = fields.map((f) => {
        if (f.name === "periodeLabel") return (r["periodeLabel"] as string) || periodLabel;
        if (f.name === "gedungName") return (r["gedungName"] as string) || gedungLabel;
        if (f.contextFill && f.name === "periode") return periodLabel;
        return cellOut(f.type, r[f.name]);
      });
      const added = ws.addRow(values);
      added.eachCell((c) => {
        c.border = BORDER;
        if (idx % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F8FD" } };
      });
      fields.forEach((f, i) => {
        if (f.type === "money") money(ws, i + 1, added.number);
        if (f.type === "date") ws.getCell(added.number, i + 1).numFmt = "dd/mm/yyyy";
      });
    });

    if (data.length > 0) {
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
      ws.views = [{ state: "frozen", ySplit: 1 }];
    }
  }

  // ---------- PKS ----------
  const contracts = await db.pksContract.findMany({
    where: { siteId: report.siteId },
    orderBy: { endDate: "asc" },
  });
  if (contracts.length > 0) {
    const ws = wb.addWorksheet("Kontrak PKS");
    ws.addRow(["No. Kontrak", "Jenis PKS", "Mulai", "Berakhir", "Sisa Hari", "Status"]).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = BRAND_FILL;
      c.border = BORDER;
    });
    [16, 14, 12, 12, 10, 14].forEach((w, i) => (ws.getColumn(i + 1).width = w));
    for (const c of contracts) {
      const sisa = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000);
      const status = sisa < 0 ? "EXPIRED" : sisa <= 90 ? "EXPIRING SOON" : "AKTIF";
      const added = ws.addRow([
        c.contractNo,
        c.jenisPks,
        c.startDate ?? null,
        c.endDate,
        Math.abs(sisa),
        status,
      ]);
      added.eachCell((cell) => (cell.border = BORDER));
      ws.getCell(added.number, 3).numFmt = "dd/mm/yyyy";
      ws.getCell(added.number, 4).numFmt = "dd/mm/yyyy";
    }
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const filename = `Laporan_${report.site.code}_${report.periodYear}-${String(report.periodMonth).padStart(2, "0")}.xlsx`;
  return { buffer, filename };
}

export async function buildMonthlyWorkbook(
  year: number,
  month: number,
  regionId?: string,
  user?: SessionUser | { roleCode: string }
) {
  if (user && (user.roleCode === "PIC" || user.roleCode === "SUPPORT")) {
    throw new Error("Akses ditolak: Hanya HQ yang dapat mengunduh rekap wilayah atau nasional.");
  }

  let regionName: string | null = null;
  const whereClause: Record<string, unknown> = { periodYear: year, periodMonth: month };

  if (regionId && regionId !== "all") {
    const reg = await db.region.findUnique({ where: { id: regionId } });
    if (reg) {
      regionName = reg.name;
      whereClause.site = { regionId };
    }
  }

  const [sites, reports] = await Promise.all([
    db.site.findMany({
      where: regionId && regionId !== "all" ? { regionId } : {},
      include: { region: true },
      orderBy: [{ region: { name: "asc" } }, { code: "asc" }],
    }),
    db.monthlyReport.findMany({
      where: whereClause,
      include: {
        site: {
          include: { region: true },
        },
      },
      orderBy: [{ site: { region: { name: "asc" } } }, { site: { code: "asc" } }],
    }),
  ]);

  const reportMap = new Map(reports.map((r) => [r.siteId, r]));
  const reportIds = reports.map((r) => r.id);

  const wb = new ExcelJS.Workbook();
  wb.creator = "AMRS Infomedia";

  const MONTH_NAMES_ID_LOCAL = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const periodTitle = `${MONTH_NAMES_ID_LOCAL[month - 1]} ${year}`;

  // ---------- COVER / REKAP RINGKASAN ----------
  const cover = wb.addWorksheet("RINGKASAN");
  cover.columns = [
    { width: 10 }, { width: 28 }, { width: 34 }, { width: 18 }, { width: 20 },
  ];
  cover.mergeCells("A1:E1");
  const ct = cover.getCell("A1");
  ct.value = regionName
    ? `INFOMEDIA NUSANTARA — REKAP ${regionName.toUpperCase()} (${periodTitle.toUpperCase()})`
    : `INFOMEDIA NUSANTARA — REKAP NASIONAL SEMUA WILAYAH (${periodTitle.toUpperCase()})`;
  ct.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  ct.fill = BRAND_FILL;
  ct.alignment = { horizontal: "center", vertical: "middle" };
  cover.getRow(1).height = 28;

  cover.addRow(["No.", "Wilayah / Area", "Site / Gedung", "Periode", "Status Laporan"]).eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = BRAND_FILL;
    c.border = BORDER;
  });

  sites.forEach((s, idx) => {
    const r = reportMap.get(s.id);
    const statusText = r ? r.status : "BELUM DIBUAT";
    const added = cover.addRow([
      idx + 1,
      s.region?.name || "Wilayah",
      `${s.code} — ${s.name}`,
      periodTitle,
      statusText,
    ]);
    added.eachCell((c) => {
      c.border = BORDER;
      if (idx % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F8FD" } };
    });
  });

  // ---------- DATA PER SECTION (BATCHED CONSOLIDATED QUERIES) ----------
  for (const section of SECTIONS) {
    // Single batched query for all reports in this section
    const sectionDataMap = await fetchBatchSectionData(section.key, reportIds);
    if (sectionDataMap.size === 0) continue;

    let sectionHasRows = false;
    const safeName = `${section.title}`.slice(0, 28).replace(/[\\/*?:[\]]/g, "");
    const ws = wb.addWorksheet(safeName);
    const fields = section.fields.filter((f) => !(section.special === "aset-ab" && f.name === "qty"));

    ws.addRow(["Site", ...fields.map((f) => f.label)]).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = BRAND_FILL;
      c.border = BORDER;
      c.alignment = { vertical: "middle", wrapText: true };
    });
    ws.getRow(1).height = 24;
    ws.getColumn(1).width = 16;
    fields.forEach((f, i) => {
      ws.getColumn(i + 2).width = f.type === "textarea" ? 36 : Math.max(12, Math.min(30, f.label.length + 6));
    });

    for (const report of reports) {
      const data = sectionDataMap.get(report.id) ?? [];
      if (data.length === 0) continue;
      sectionHasRows = true;

      const periodLabel = `${MONTH_NAMES_ID_LOCAL[report.periodMonth - 1]} ${report.periodYear}`;
      const gedungLabel = report.site.name;

      data.forEach((r) => {
        const vals: CellValue[] = [report.site.code];
        for (const f of fields) {
          if (f.name === "periodeLabel") {
            vals.push((r["periodeLabel"] as string) || periodLabel);
            continue;
          }
          if (f.name === "gedungName") {
            vals.push((r["gedungName"] as string) || gedungLabel);
            continue;
          }
          if (f.name === "areaWilayah") {
            vals.push((r["areaWilayah"] as string) || report.site.region?.name || "Wilayah");
            continue;
          }
          vals.push(cellOut(f.type, r[f.name]));
        }

        const added = ws.addRow(vals);
        added.eachCell((c, colNum) => {
          c.border = BORDER;
          const f = fields[colNum - 2];
          if (f?.type === "money") money(ws, colNum, added.number);
          if (f?.type === "date") ws.getCell(added.number, colNum).numFmt = "dd/mm/yyyy";
        });
      });
    }

    if (sectionHasRows) {
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: fields.length + 1 } };
      ws.views = [{ state: "frozen", ySplit: 1 }];
    }
  }

  // ---------- KONTRAK PKS (CONSOLIDATED) ----------
  const siteIds = reports.map((r) => r.siteId);
  const contracts = await db.pksContract.findMany({
    where: { siteId: { in: siteIds } },
    include: { site: true },
    orderBy: [{ site: { code: "asc" } }, { endDate: "asc" }],
  });

  if (contracts.length > 0) {
    const ws = wb.addWorksheet("Kontrak PKS");
    ws.addRow(["Site", "Nama Site", "No. Kontrak", "Jenis PKS", "Tanggal Berakhir", "Sisa Hari", "Status", "PIC", "Keterangan"]).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = BRAND_FILL;
      c.border = BORDER;
    });
    [14, 24, 20, 18, 14, 12, 14, 16, 30].forEach((w, i) => (ws.getColumn(i + 1).width = w));

    for (const c of contracts) {
      const sisa = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000);
      const status = sisa < 0 ? "EXPIRED" : sisa <= 90 ? "NEAR EXPIRED" : "AKTIF";
      const added = ws.addRow([
        c.site.code,
        c.site.name,
        c.contractNo || "-",
        c.jenisPks || "-",
        c.endDate,
        Math.abs(sisa),
        status,
        c.picName || "-",
        c.notes || "-",
      ]);
      added.eachCell((cell) => (cell.border = BORDER));
      ws.getCell(added.number, 5).numFmt = "dd/mm/yyyy";
    }

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 9 } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const filename = regionName
    ? `Rekap_Wilayah_${regionName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}-${String(month).padStart(2, "0")}.xlsx`
    : `Rekap_Nasional_Semua_Wilayah_${year}-${String(month).padStart(2, "0")}.xlsx`;

  return { buffer, filename };
}
