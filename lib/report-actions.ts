"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { deleteFile } from "@/lib/storage";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSection, CONTEXT_VIRTUAL_FIELDS, isWilayah1 } from "@/lib/section-config";
import {
  canEditReport,
  getAccessibleSiteIds,
  type SectionRow,
} from "@/lib/report-service";

import { sendRevisionNotification } from "@/lib/email-service";

export type ActionState = { error?: string; success?: string };

const DATE_FIELDS = new Set(["workDate", "plannedDate", "completedAt", "occurredAt", "targetResolutionDate", "closedAt", "bookingDate", "replacedAt", "invoiceDate", "receivedAt", "processedAt", "dueDate", "paidAt", "spentAt", "mutationDate", "effectiveDate", "checkedAt", "targetFollowUpDate", "procurementTargetDate", "updatedAt",
  // area section date fields
  "tglKerja", "tglSelesai", "tglLog", "tgl"]);
const NUMBER_FIELDS = new Set(["seats", "totalAreaM2", "usedAreaM2", "idleAreaM2", "totalSeats", "usedSeats", "idleSeats", "areaM2", "staffCount", "totalCount", "activeCount", "estimatedCost", "supervisorCount", "memberCount", "meterPrev", "meterCurr", "usageValue", "billAmount", "operatingHours", "usageLiters", "refillQty", "pricePerLiter", "liters", "odometerStart", "odometerEnd", "distanceKm", "cost", "qty", "quantity", "amount", "budgetAmount", "progressPct", "rkapBudget", "realization", "targetAbsorptionPct", "acquiredValue", "proposalYear", "estimatedValue", "valueAtMutation", "totalAssets", "checkedAssets", "matchedAssets", "unmatchedAssets", "selisih", "sisaHari", "totalBiaya", "totalJarak", "sisaBudget", "penyerapanPct", "variancePct", "assetUnchecked", "assetMismatched", "utilitasPct", "no", "agingDays", "processDurationDays", "paymentDurationDays", "capexValue", "realizationValue", "accrueValue",
  // area section number fields
  "luasM2", "jumlahSeat", "jumlahSdm", "jumlahSecurity", "jumlahDriver", "jumlahMe", "jumlahMailBoy", "jumlahCs", "totalTenaga", "jumlahMaterial", "jamKerjaMenit", "durasiMenit", "kmAwal", "kmAkhir", "jarakKm", "literBbm", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "grandTotal", "totalAmount", "permintaanGalon", "realisasiGalon", "hargaSatuan", "totalPerBulan", "totalRealisasi", "jumlahLayanan",
  // bbm fields
  "durasiPerjalananMenit", "efektifKerjaJam", "durasiPerjalananJam", "jarakTempuh", "pengisianLiter", "hargaBbm", "totalBbm"]);
const BOOLEAN_FIELDS = new Set<string>([]);

function parseIndoNumber(rawStr: string): number | null {
  const str = rawStr.replace(/[^0-9,.-]/g, "").trim();
  if (!str) return null;
  if (str.includes(".") && str.includes(",")) {
    const n = Number(str.replace(/\./g, "").replace(/,/g, "."));
    return Number.isNaN(n) ? null : n;
  }
  if (str.includes(".")) {
    const parts = str.split(".");
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      const n = Number(str.replace(/\./g, ""));
      return Number.isNaN(n) ? null : n;
    }
  }
  if (str.includes(",")) {
    const parts = str.split(",");
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      const n = Number(str.replace(/,/g, ""));
      return Number.isNaN(n) ? null : n;
    }
    const n = Number(str.replace(/,/g, "."));
    return Number.isNaN(n) ? null : n;
  }
  const n = Number(str);
  return Number.isNaN(n) ? null : n;
}

function coerce(sectionKey: string, name: string, raw: FormDataEntryValue | null): unknown {
  if (raw === null) return undefined;
  const str = String(raw).trim();
  if (str === "") return null;
  const section = getSection(sectionKey);
  const field = section?.fields.find((f) => f.name === name);

  if (field?.type === "checkbox" || BOOLEAN_FIELDS.has(name)) {
    return str === "true" || str === "1" || str === "on" || str === "yes";
  }
  if (DATE_FIELDS.has(name) || field?.type === "date") {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (NUMBER_FIELDS.has(name) || field?.type === "number" || field?.type === "money") {
    return parseIndoNumber(str);
  }
  return str;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function audit(actorId: string, action: string, entityType: string, entityId: string, after?: unknown, client: any = db) {
  try {
    await client.auditLog.create({
      data: { actorId, action, entityType, entityId, after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)) },
    });
  } catch (e) {
    console.warn("Audit log creation skipped:", e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function delegate(modelName: string, client: any = db) {
  const model = (
    client as unknown as Record<
      string,
      {
        findFirst(args: { where: Record<string, unknown>; include?: Record<string, boolean> }): Promise<SectionRow | null>;
        create(args: { data: Record<string, unknown> }): Promise<SectionRow>;
        update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<SectionRow>;
        delete(args: { where: Record<string, unknown> }): Promise<unknown>;
      }
    >
  )[modelName];
  if (!model) throw new Error(`Model tidak dikenal: ${modelName}`);
  return model;
}

export async function createReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const siteId = String(formData.get("siteId") ?? "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (!siteId || !year || !month) return { error: "Site, tahun, dan bulan wajib dipilih." };

  const accessible = await getAccessibleSiteIds(user);
  if (!accessible.includes(siteId)) return { error: "Anda tidak memiliki akses ke site ini." };

  const existing = await db.monthlyReport.findUnique({
    where: { siteId_periodYear_periodMonth: { siteId, periodYear: year, periodMonth: month } },
  });
  if (existing) return { error: `Laporan untuk periode tersebut sudah ada (${existing.status}).` };

  const report = await db.monthlyReport.create({
    data: { siteId, periodYear: year, periodMonth: month, status: "DRAFT" },
  });
  await audit(user.id, "REPORT_CREATE", "MonthlyReport", report.id, { siteId, year, month });
  revalidatePath("/reports");
  redirect(`/reports/${report.id}`);
}

export async function saveRow(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const reportId = String(formData.get("__reportId") ?? "");
  const sectionKey = String(formData.get("__section") ?? "");
  const rowId = formData.get("__rowId") ? String(formData.get("__rowId")) : null;

  const access = await canEditReport(reportId, user);
  if (!access.ok) return { error: access.reason };
  const report = access.report;

  const siteWithRegion = await db.site.findUnique({
    where: { id: report.siteId },
    include: { region: { select: { name: true } } },
  });
  const isW1 = isWilayah1(siteWithRegion?.region?.name, siteWithRegion?.code);
  const section = getSection(sectionKey, isW1);
  if (!section) return { error: `Section tidak dikenal: ${sectionKey}` };

  // ---- validasi & kumpulkan data
  const data: Record<string, unknown> = { ...(section.fixedValues ?? {}) };
  for (const f of section.fields) {
    if (CONTEXT_VIRTUAL_FIELDS.has(f.name) && section.model !== "invoiceFinancialEntry") continue;
    if (f.contextFill) continue;
    if (f.computeFrom) continue;
    if (section.special === "aset-ab" && f.name === "qty") continue;
    
    const raw = formData.get(f.name);
    if (f.required && (raw === null || raw === undefined || String(raw).trim() === "")) {
      return { error: `Kolom "${f.label}" wajib diisi.` };
    }
    
    const value = coerce(sectionKey, f.name, raw);
    if (value === undefined) continue;
    if (f.required && (value === null || value === "")) {
      return { error: `Kolom "${f.label}" wajib diisi.` };
    }
    data[f.name] = value;
  }

  // Textarea fields default to "" so Prisma NOT NULL columns don't fail
  for (const f of section.fields) {
    if (f.type === "textarea" && !(f.name in data)) {
      data[f.name] = "";
    }
  }

  // Kolom wajib non-form
  data.reportId = reportId;
  if (section.model === "invoice" || section.key.includes("invoice")) data.siteId = report.siteId;

  // Auto-fill buildingId for utilisasi from site's first building or create fallback
  if (section.key === "utilisasi" && !data.buildingId) {
    let b = await db.building.findFirst({ where: { siteId: report.siteId }, orderBy: { createdAt: "asc" } });
    if (!b) {
      const site = await db.site.findUnique({ where: { id: report.siteId } });
      b = await db.building.create({
        data: { siteId: report.siteId, name: (data.gedungName as string) || site?.name || "Gedung Utama" },
      });
    }
    data.buildingId = b.id;
  }

  // Server-side compute for computeFrom fields
  for (const f of section.fields) {
    if (f.computeFrom && f.computeFrom.length > 0 && !(f.name in data)) {
      if (f.computeFormula === "divide_multiply") {
        const a = Number(data[f.computeFrom[0]]) || 0;
        const b = Number(data[f.computeFrom[1]]) || 0;
        data[f.name] = b !== 0 ? Math.round((a / b) * 100 * 100) / 100 : 0;
      } else if (f.computeFormula === "multiply") {
        const prod = f.computeFrom.reduce((acc, fn, idx) => {
          const val = Number(data[fn]) || 0;
          return idx === 0 ? val : acc * val;
        }, 0);
        data[f.name] = Math.round(prod);
      } else if (f.computeFormula === "subtract") {
        const a = Number(data[f.computeFrom[0]]) || 0;
        const b = Number(data[f.computeFrom[1]]) || 0;
        data[f.name] = a - b;
      } else {
        const sum = f.computeFrom.reduce((acc, fn) => acc + (Number(data[fn]) || 0), 0);
        data[f.name] = sum;
      }
    }
  }

  // Sync BBM legacy fields if needed
  if (section.key === "bbm") {
    if (data.nopol && !data.plateNo) data.plateNo = data.nopol;
    if (data.totalBbm !== undefined && data.cost === undefined) data.cost = data.totalBbm;
    if (data.pengisianLiter !== undefined && data.liters === undefined) data.liters = data.pengisianLiter;
    if (data.jarakTempuh !== undefined && data.distanceKm === undefined) data.distanceKm = data.jarakTempuh;
    if (data.keterangan && !data.notes) data.notes = data.keterangan;
    if (data.pic && !data.picName) data.picName = data.pic;
    if (data.jenisBbm && !data.fuelType) data.fuelType = data.jenisBbm;
    if (data.area && !data.areaWilayah) data.areaWilayah = data.area;
  }

  // Buang nilai null agar tidak menimpa kolom NOT NULL / default database
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) clean[k] = v;
  }

  try {
    if (section.special === "aset-ab") {
      await handleAsetAb(report, user, formData, clean, rowId);
    } else if (section.uniqueScope) {
      const scopeWhere: Record<string, unknown> = { reportId };
      for (const k of section.uniqueScope) scopeWhere[k] = clean[k] ?? null;
      const model = delegate(section.model);
      const existingRow = await model.findFirst({ where: scopeWhere });
      if (existingRow && existingRow.id !== rowId) {
        await model.update({ where: { id: existingRow.id }, data: clean });
        await audit(user.id, `ROW_UPDATE`, section.model, existingRow.id, clean);
      } else if (existingRow) {
        await model.update({ where: { id: existingRow.id }, data: clean });
        await audit(user.id, `ROW_UPDATE`, section.model, existingRow.id, clean);
      } else {
        const created = await model.create({ data: clean });
        await audit(user.id, "ROW_CREATE", section.model, created.id, clean);
      }
    } else {
      const model = delegate(section.model);
      if (rowId) {
        await model.update({ where: { id: rowId }, data: clean });
        await audit(user.id, "ROW_UPDATE", section.model, rowId, clean);
      } else {
        const created = await model.create({ data: clean });
        await audit(user.id, "ROW_CREATE", section.model, created.id, clean);
      }
    }
  } catch (e) {
    console.error("saveRow error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if ((e as { code?: string }).code === "P2002") {
      return { error: "Data dengan nomor/kombinasi yang sama sudah ada di laporan ini." };
    }
    if ((e as { code?: string }).code === "P2003") {
      return { error: "Relasi data tidak valid. Pastikan semua field terisi dengan benar." };
    }
    return { error: `Gagal menyimpan: ${msg.slice(0, 200)}` };
  }

  revalidatePath(`/reports/${reportId}`);
  return { success: "Tersimpan." };
}

async function handleAsetAb(
  report: { id: string; siteId: string; periodYear: number; periodMonth: number },
  user: { id: string },
  formData: FormData,
  data: Record<string, unknown>,
  rowId: string | null
) {
  const acquisition = delegate("assetAcquisition");
  if (rowId) {
    await acquisition.update({
      where: { id: rowId },
      data: {
        areaWilayah: data.areaWilayah ? String(data.areaWilayah) : undefined,
        periodeLabel: data.periodeLabel ? String(data.periodeLabel) : undefined,
        gedungName: data.gedungName ? String(data.gedungName) : undefined,
        acquiredValue: data.acquiredValue !== undefined ? Number(data.acquiredValue) || 0 : undefined,
        source: data.source ? String(data.source) : undefined,
        notes: data.notes ? String(data.notes) : undefined,
        quantity: data.quantity ? Number(data.quantity) || 1 : undefined,
      },
    });
    await audit(user.id, "ROW_UPDATE", "assetAcquisition", rowId, data);
    return;
  }

  const qty = Math.min(20, Math.max(1, Number(String(formData.get("quantity") || formData.get("qty") || "1")) || 1));
  const baseTag = String(formData.get("assetTag") ?? "").trim();
  const total = Number(data.acquiredValue ?? 0) || 0;
  const unitValue = qty > 1 ? total / qty : total;
  const periodCode = `${report.periodYear}${String(report.periodMonth).padStart(2, "0")}`;

  let firstAssetId: string | null = null;
  for (let i = 0; i < qty; i++) {
    const suffix = String(i + 1).padStart(2, "0");
    const tag = baseTag
      ? qty > 1
        ? `${baseTag}-${suffix}`
        : baseTag
      : `AB-${periodCode}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const asset = await db.asset.create({
      data: {
        assetTag: tag,
        name: String(data.name ?? "Aset Baru"),
        category: (data.category as string) || null,
        brand: (data.brand as string) || null,
        model: (data.model as string) || null,
        serialNumber: (data.serialNumber as string) || null,
        value: unitValue,
        source: (data.source as string) || null,
        acquiredAt: new Date(),
        currentSiteId: report.siteId,
        currentLocation: (data.currentLocation as string) || null,
        status: "ACTIVE",
        acquisitionReportId: report.id,
      },
    });
    if (!firstAssetId) firstAssetId = asset.id;
  }

  const createdAcq = await acquisition.create({
    data: {
      reportId: report.id,
      assetId: firstAssetId!,
      areaWilayah: data.areaWilayah ? String(data.areaWilayah) : null,
      periodeLabel: data.periodeLabel ? String(data.periodeLabel) : null,
      gedungName: data.gedungName ? String(data.gedungName) : null,
      quantity: qty,
      acquiredValue: total,
      source: (data.source as string) || null,
      notes: (data.notes as string) || null,
      picName: (data.picName as string) || null,
    },
  });
  await audit(user.id, "ROW_CREATE", "assetAcquisition", createdAcq.id, { qty, total });
}

export async function deleteRow(formData: FormData): Promise<void> {
  const user = await requireUser();
  const reportId = String(formData.get("__reportId") ?? "");
  const sectionKey = String(formData.get("__section") ?? "");
  const rowId = String(formData.get("__rowId") ?? "");

  const section = getSection(sectionKey);
  if (!section) return;
  const access = await canEditReport(reportId, user);
  if (!access.ok) return;

  if (section.special !== "aset-ab") {
    const model = delegate(section.model);
    await model.delete({ where: { id: rowId } });
  } else {
    const acq = await db.assetAcquisition.findUnique({ where: { id: rowId } });
    if (acq) {
      await db.assetAcquisition.delete({ where: { id: rowId } });
      if (acq.assetId) {
        await db.asset.delete({ where: { id: acq.assetId } }).catch(() => {});
      }
    }
  }
  await audit(user.id, "ROW_DELETE", section.model, rowId);
  revalidatePath(`/reports/${reportId}`);
}

export async function submitReport(formData: FormData): Promise<void> {
  const user = await requireUser();
  const reportId = String(formData.get("reportId") ?? "");
  const access = await canEditReport(reportId, user);
  if (!access.ok) return;

  await db.monthlyReport.update({
    where: { id: reportId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  await db.reportStatusLog.create({
    data: {
      reportId,
      fromStatus: access.report.status as never,
      toStatus: "SUBMITTED",
      actedById: user.id,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  await audit(user.id, "REPORT_SUBMIT", "MonthlyReport", reportId);
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
}

export async function reviewReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Hanya HQ yang dapat mereview laporan." };

  const reportId = String(formData.get("reportId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const report = await db.monthlyReport.findUnique({ where: { id: reportId } });
  if (!report) return { error: "Laporan tidak ditemukan." };
  if (report.status !== "SUBMITTED") return { error: "Laporan tidak dalam status SUBMITTED." };
  if (decision === "NEEDS_REVISION" && !note) return { error: "Catatan revisi wajib diisi." };

  const now = new Date();
  await db.monthlyReport.update({
    where: { id: reportId },
    data:
      decision === "APPROVED"
        ? { status: "APPROVED", reviewedAt: now, reviewedById: user.id, lockedAt: now }
        : { status: "NEEDS_REVISION", reviewedAt: now, reviewedById: user.id },
  });
  await db.reportStatusLog.create({
    data: {
      reportId,
      fromStatus: "SUBMITTED",
      toStatus: decision === "APPROVED" ? "APPROVED" : "NEEDS_REVISION",
      actedById: user.id,
      note: note || null,
    },
  });
  await audit(user.id, decision === "APPROVED" ? "REPORT_APPROVE" : "REPORT_REVISE", "MonthlyReport", reportId, { note });

  // Send email notification to PIC when revision is requested
  if (decision === "NEEDS_REVISION") {
    await sendRevisionNotification(reportId, note);
  }

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/approvals");
  revalidatePath("/reports");
  return { success: decision === "APPROVED" ? "Laporan disetujui." : "Revisi diminta. Notifikasi email dikirim ke PIC." };
}

// ============ HAPUS LAPORAN ============

export async function deleteReport(formData: FormData): Promise<void> {
  const user = await requireUser();
  const reportId = String(formData.get("reportId") ?? "");

  const report = await db.monthlyReport.findUnique({
    where: { id: reportId },
    select: { siteId: true, periodMonth: true },
  });
  if (!report) redirect("/reports");

  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
    const allowed = await db.userSiteAssignment.count({ where: { userId: user.id, siteId: report.siteId } });
    if (allowed === 0) redirect("/forbidden");
  }

  const filesToUnlink: string[] = [];

  await db.$transaction(async (tx) => {
    // Cari semua aset yang terikat dengan laporan ini (dari AssetAcquisition atau direct acquisitionReportId)
    const acquisitions = await tx.assetAcquisition.findMany({
      where: { reportId },
      select: { assetId: true },
    });
    const assetIds = acquisitions.map((a) => a.assetId).filter((id): id is string => id !== null);

    const directAssets = await tx.asset.findMany({
      where: { acquisitionReportId: reportId },
      select: { id: true },
    });
    const allAssetIds = [...new Set([...assetIds, ...directAssets.map((a) => a.id)])];

    // Hapus mutasi & akuisisi terkait
    await tx.assetMutation.deleteMany({ where: { OR: [{ reportId }, { assetId: { in: allAssetIds } }] } });
    await tx.assetAcquisition.deleteMany({ where: { OR: [{ reportId }, { assetId: { in: allAssetIds } }] } });

    // Hapus aset fisik yang didaftarkan dari laporan ini
    if (allAssetIds.length > 0) {
      await tx.asset.deleteMany({ where: { id: { in: allAssetIds } } });
    }

    // Hapus lampiran
    const atts = await tx.attachment.findMany({ where: { reportId }, select: { storageKey: true } });
    for (const a of atts) {
      filesToUnlink.push(a.storageKey);
    }

    // Explicitly delete invoices belonging to this report
    await tx.invoice.deleteMany({ where: { reportId } });

    await tx.monthlyReport.delete({ where: { id: reportId } });
    await audit(user.id, "REPORT_DELETE", "MonthlyReport", reportId, { periodMonth: report.periodMonth }, tx);
  });

  for (const storageKey of filesToUnlink) {
    await deleteFile(storageKey);
  }

  revalidatePath("/reports");
  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
  redirect("/reports");
}

export async function deleteReportsBulk(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const reportIdsJson = String(formData.get("reportIds") ?? "[]");

  let reportIds: string[];
  try {
    reportIds = JSON.parse(reportIdsJson);
  } catch {
    return { error: "Daftar ID laporan tidak valid." };
  }

  if (!Array.isArray(reportIds) || reportIds.length === 0) {
    return { error: "Tidak ada laporan yang dipilih." };
  }

  let deleted = 0;
  const filesToUnlink: string[] = [];

  try {
    await db.$transaction(async (tx) => {
      for (const reportId of reportIds) {
        const report = await tx.monthlyReport.findUnique({
          where: { id: reportId },
          select: { siteId: true, periodMonth: true, periodYear: true },
        });
        if (!report) continue;

        if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
          const allowed = await tx.userSiteAssignment.count({ where: { userId: user.id, siteId: report.siteId } });
          if (allowed === 0) continue;
        }

        // Cari semua aset yang terikat dengan laporan ini
        const acquisitions = await tx.assetAcquisition.findMany({
          where: { reportId },
          select: { assetId: true },
        });
        const assetIds = acquisitions.map((a) => a.assetId).filter((id): id is string => id !== null);

        const directAssets = await tx.asset.findMany({
          where: { acquisitionReportId: reportId },
          select: { id: true },
        });
        const allAssetIds = [...new Set([...assetIds, ...directAssets.map((a) => a.id)])];

        await tx.assetMutation.deleteMany({ where: { OR: [{ reportId }, { assetId: { in: allAssetIds } }] } });
        await tx.assetAcquisition.deleteMany({ where: { OR: [{ reportId }, { assetId: { in: allAssetIds } }] } });

        if (allAssetIds.length > 0) {
          await tx.asset.deleteMany({ where: { id: { in: allAssetIds } } });
        }

        // Hapus invoices
        await tx.invoice.deleteMany({ where: { reportId } });

        // Hapus lampiran
        const atts = await tx.attachment.findMany({ where: { reportId }, select: { storageKey: true } });
        for (const a of atts) {
          filesToUnlink.push(a.storageKey);
        }

        await tx.monthlyReport.delete({ where: { id: reportId } });
        await audit(
          user.id,
          "REPORT_DELETE_BULK",
          "MonthlyReport",
          reportId,
          {
            periodMonth: report.periodMonth,
            periodYear: report.periodYear,
          },
          tx
        );
        deleted++;
      }
    });
  } catch (e) {
    console.error("deleteReportsBulk error:", e);
    return { error: `Gagal menghapus laporan: ${e instanceof Error ? e.message : String(e)}` };
  }

  for (const storageKey of filesToUnlink) {
    await deleteFile(storageKey);
  }

  revalidatePath("/reports");
  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
  return { success: `${deleted} laporan berhasil dihapus.` };
}

export async function deleteReportsByMonth(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
    return { error: "Hanya Admin / Superadmin yang dapat menghapus seluruh laporan per bulan." };
  }

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!year || !month) return { error: "Tahun dan bulan tidak valid." };

  const reports = await db.monthlyReport.findMany({
    where: { periodYear: year, periodMonth: month },
    select: { id: true, periodMonth: true, periodYear: true },
  });

  if (reports.length === 0) {
    return { error: "Tidak ada laporan pada bulan ini untuk dihapus." };
  }

  let deleted = 0;
  const filesToUnlink: string[] = [];

  try {
    await db.$transaction(async (tx) => {
      for (const report of reports) {
        const reportId = report.id;

        // Cari semua aset yang terikat dengan laporan ini
        const acquisitions = await tx.assetAcquisition.findMany({
          where: { reportId },
          select: { assetId: true },
        });
        const assetIds = acquisitions.map((a) => a.assetId).filter((id): id is string => id !== null);

        const directAssets = await tx.asset.findMany({
          where: { acquisitionReportId: reportId },
          select: { id: true },
        });
        const allAssetIds = [...new Set([...assetIds, ...directAssets.map((a) => a.id)])];

        await tx.assetMutation.deleteMany({ where: { OR: [{ reportId }, { assetId: { in: allAssetIds } }] } });
        await tx.assetAcquisition.deleteMany({ where: { OR: [{ reportId }, { assetId: { in: allAssetIds } }] } });

        if (allAssetIds.length > 0) {
          await tx.asset.deleteMany({ where: { id: { in: allAssetIds } } });
        }

        // Hapus invoices
        await tx.invoice.deleteMany({ where: { reportId } });

        const atts = await tx.attachment.findMany({ where: { reportId }, select: { storageKey: true } });
        for (const a of atts) {
          filesToUnlink.push(a.storageKey);
        }

        await tx.monthlyReport.delete({ where: { id: reportId } });
        await audit(user.id, "REPORT_DELETE_MONTH", "MonthlyReport", reportId, { year, month }, tx);
        deleted++;
      }
    });
  } catch (e) {
    console.error("deleteReportsByMonth error:", e);
    return { error: `Gagal menghapus laporan: ${e instanceof Error ? e.message : String(e)}` };
  }

  for (const storageKey of filesToUnlink) {
    await deleteFile(storageKey);
  }

  revalidatePath("/reports");
  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
  return { success: `Semua ${deleted} laporan periode ${month}/${year} berhasil dihapus.` };
}

export type BulkRow = { id?: string; data: Record<string, unknown> };

export async function saveRowsBulk(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const reportId = String(formData.get("__reportId") ?? "");
  const sectionKey = String(formData.get("__section") ?? "");
  const rowsJson = String(formData.get("__rows") ?? "[]");

  const access = await canEditReport(reportId, user);
  if (!access.ok) return { error: access.reason };

  const siteWithRegion = await db.site.findUnique({
    where: { id: access.report.siteId },
    include: { region: { select: { name: true } } },
  });
  const isW1 = isWilayah1(siteWithRegion?.region?.name, siteWithRegion?.code);
  const section = getSection(sectionKey, isW1);
  if (!section) return { error: `Section tidak dikenal: ${sectionKey}` };

  let rows: BulkRow[];
  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return { error: "Data baris tidak valid." };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Tidak ada data untuk disimpan." };
  }

  if (rows.length > 5000) {
    return { error: "Maksimal 5000 baris per sekali simpan." };
  }

  const preparedRows: Array<{ id?: string; clean: Record<string, unknown>; originalIndex: number }> = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    // Auto-skip newly added empty rows (user clicked + Baris Baru but didn't fill anything)
    if (!row.id) {
      const hasUserContent = section.fields.some((f) => {
        if (
          (CONTEXT_VIRTUAL_FIELDS.has(f.name) && section.model !== "invoiceFinancialEntry") ||
          f.contextFill ||
          f.computeFrom ||
          f.name === "areaWilayah" ||
          f.name === "periodeLabel" ||
          f.name === "gedungName" ||
          f.name === "buildingName"
        ) {
          return false;
        }
        const val = row.data[f.name];
        return val !== undefined && val !== null && String(val).trim() !== "";
      });

      if (!hasUserContent) {
        continue;
      }
    }

    const data: Record<string, unknown> = { ...(section.fixedValues ?? {}) };
    for (const f of section.fields) {
      if (CONTEXT_VIRTUAL_FIELDS.has(f.name) && section.model !== "invoiceFinancialEntry") continue;
      if (f.contextFill) continue;
      if (f.computeFrom) continue;
      if (section.special === "aset-ab" && (f.name === "qty" || f.name === "quantity")) {
        const rawQ = row.data[f.name];
        if (rawQ !== undefined && rawQ !== null && rawQ !== "") {
          data.quantity = Number(rawQ) || 1;
        }
        continue;
      }

      const raw = row.data[f.name];
      if (f.required && (raw === undefined || raw === null || String(raw).trim() === "")) {
        return { error: `Kolom "${f.label}" wajib diisi pada baris ke-${rowIndex + 1}.` };
      }

      if (raw === undefined || raw === null || raw === "") continue;
      const value = coerce(sectionKey, f.name, String(raw));
      if (value === undefined) continue;
      if (f.required && (value === null || value === "")) {
        return { error: `Kolom "${f.label}" wajib diisi pada baris ke-${rowIndex + 1}.` };
      }
      data[f.name] = value;
    }

    // Textarea fields default to "" so Prisma NOT NULL columns don't fail
    for (const f of section.fields) {
      if (f.type === "textarea" && !(f.name in data)) {
        data[f.name] = "";
      }
    }

    data.reportId = reportId;
    if (section.model === "invoice" || section.key.includes("invoice")) {
      data.siteId = (access as { report: { siteId: string } }).report.siteId;
      if (data.amount === undefined || data.amount === null) {
        data.amount = 0;
      }
    }

    // Server-side compute for computeFrom fields
    for (const f of section.fields) {
      if (f.computeFrom && f.computeFrom.length > 0 && !(f.name in data)) {
        if (f.computeFormula === "divide_multiply") {
          const a = Number(data[f.computeFrom[0]]) || 0;
          const b = Number(data[f.computeFrom[1]]) || 0;
          data[f.name] = b !== 0 ? Math.round((a / b) * 100 * 100) / 100 : 0;
        } else if (f.computeFormula === "multiply") {
          const prod = f.computeFrom.reduce((acc, fn, idx) => {
            const val = Number(data[fn]) || 0;
            return idx === 0 ? val : acc * val;
          }, 0);
          data[f.name] = Math.round(prod);
        } else if (f.computeFormula === "subtract") {
          const a = Number(data[f.computeFrom[0]]) || 0;
          const b = Number(data[f.computeFrom[1]]) || 0;
          data[f.name] = a - b;
        } else {
          const sum = f.computeFrom.reduce((acc, fn) => acc + (Number(data[fn]) || 0), 0);
          data[f.name] = sum;
        }
      }
    }

    // Sync BBM legacy fields if needed
    if (section.key === "bbm") {
      if (data.nopol && !data.plateNo) data.plateNo = data.nopol;
      if (data.totalBbm !== undefined && data.cost === undefined) data.cost = data.totalBbm;
      if (data.pengisianLiter !== undefined && data.liters === undefined) data.liters = data.pengisianLiter;
      if (data.jarakTempuh !== undefined && data.distanceKm === undefined) data.distanceKm = data.jarakTempuh;
      if (data.keterangan && !data.notes) data.notes = data.keterangan;
      if (data.pic && !data.picName) data.picName = data.pic;
      if (data.jenisBbm && !data.fuelType) data.fuelType = data.jenisBbm;
      if (data.area && !data.areaWilayah) data.areaWilayah = data.area;
    }

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== null && v !== undefined) clean[k] = v;
    }

    if (section.key === "booking") {
      if (!clean.bookingStatus) clean.bookingStatus = "BOOKING";
    }
    if (section.key === "keamanan") {
      if (!clean.aspect) clean.aspect = "SECURITY";
    }
    if (section.key === "mutasi-aset") {
      if (!clean.status) clean.status = "DRAFT";
    }
    if (section.key === "capex-baru") {
      if (!clean.status) clean.status = "PROPOSED";
    }

    preparedRows.push({ id: row.id, clean, originalIndex: rowIndex });
  }

  if (preparedRows.length === 0) {
    return { error: "Tidak ada data baru yang diisi untuk disimpan." };
  }

  // Auto-fill buildingId for utilisasi if needed
  if (section.key === "utilisasi") {
    const targetSiteId = (access as { report: { siteId: string } }).report.siteId;
    let b = await db.building.findFirst({ where: { siteId: targetSiteId }, orderBy: { createdAt: "asc" } });
    if (!b) {
      const site = await db.site.findUnique({ where: { id: targetSiteId } });
      b = await db.building.create({
        data: { siteId: targetSiteId, name: site?.name || "Gedung Utama" },
      });
    }
    for (const item of preparedRows) {
      if (!item.clean.buildingId) {
        item.clean.buildingId = b.id;
      }
    }
  }

  let saved = 0;

  try {
    if (section.special === "aset-ab") {
      for (const item of preparedRows) {
        const { id, clean } = item;
        if (id) {
          const acq = await db.assetAcquisition.findUnique({
            where: { id },
            include: { asset: true },
          });
          if (acq) {
            await db.assetAcquisition.update({
              where: { id },
              data: {
                areaWilayah: clean.areaWilayah ? String(clean.areaWilayah) : undefined,
                periodeLabel: clean.periodeLabel ? String(clean.periodeLabel) : undefined,
                gedungName: clean.gedungName ? String(clean.gedungName) : undefined,
                acquiredValue: clean.acquiredValue !== undefined ? Number(clean.acquiredValue) || 0 : undefined,
                source: clean.source as string | undefined,
                notes: clean.notes as string | undefined,
                picName: clean.picName as string | undefined,
                quantity: clean.quantity !== undefined ? Number(clean.quantity) || 1 : undefined,
              },
            });
            if (acq.assetId) {
              await db.asset.update({
                where: { id: acq.assetId },
                data: {
                  name: clean.name ? String(clean.name) : undefined,
                  assetTag: clean.assetTag ? String(clean.assetTag) : undefined,
                  category: clean.category !== undefined ? (clean.category as string) || null : undefined,
                  brand: clean.brand !== undefined ? (clean.brand as string) || null : undefined,
                  model: clean.model !== undefined ? (clean.model as string) || null : undefined,
                  serialNumber: clean.serialNumber !== undefined ? (clean.serialNumber as string) || null : undefined,
                },
              });
            }
          }
        } else {
          const qty = Math.min(20, Math.max(1, Number(clean.quantity) || 1));
          const baseTag = String(clean.assetTag ?? "").trim();
          const total = Number(clean.acquiredValue ?? 0) || 0;
          const unitValue = qty > 1 ? total / qty : total;
          const reportObj = (access as { report: { siteId: string; periodYear: number; periodMonth: number } }).report;
          const periodCode = `${reportObj.periodYear}${String(reportObj.periodMonth).padStart(2, "0")}`;

          const tag = baseTag || `AB-${periodCode}-${randomUUID().slice(0, 8).toUpperCase()}`;
          const asset = await db.asset.create({
            data: {
              assetTag: tag,
              name: String(clean.name ?? "Aset Baru"),
              category: (clean.category as string) || null,
              brand: (clean.brand as string) || null,
              model: (clean.model as string) || null,
              serialNumber: (clean.serialNumber as string) || null,
              value: unitValue,
              source: (clean.source as string) || null,
              acquiredAt: new Date(),
              currentSiteId: reportObj.siteId,
              currentLocation: (clean.currentLocation as string) || null,
              status: "ACTIVE",
              acquisitionReportId: reportId,
            },
          });
          await db.assetAcquisition.create({
            data: {
              reportId,
              assetId: asset.id,
              areaWilayah: clean.areaWilayah ? String(clean.areaWilayah) : null,
              periodeLabel: clean.periodeLabel ? String(clean.periodeLabel) : null,
              gedungName: clean.gedungName ? String(clean.gedungName) : null,
              quantity: qty,
              acquiredValue: total,
              source: (clean.source as string) || null,
              notes: (clean.notes as string) || null,
              picName: (clean.picName as string) || null,
            },
          });
        }
        saved++;
      }
    } else {
      const model = delegate(section.model, db);
      const CHUNK_SIZE = 100;
      const allChunks: (typeof preparedRows)[] = [];
      for (let i = 0; i < preparedRows.length; i += CHUNK_SIZE) {
        allChunks.push(preparedRows.slice(i, i + CHUNK_SIZE));
      }

      // Execute chunks in parallel waves of 5 concurrent transactions to maximize throughput safely
      const CONCURRENCY = 5;
      for (let i = 0; i < allChunks.length; i += CONCURRENCY) {
        const wave = allChunks.slice(i, i + CONCURRENCY);
        await Promise.all(
          wave.map((chunk) => {
            const batch = chunk.map((item) => {
              if (item.id) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (model as any).update({ where: { id: item.id }, data: item.clean });
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (model as any).create({ data: item.clean });
              }
            });
            return db.$transaction(batch);
          })
        );
        saved += wave.reduce((acc, c) => acc + c.length, 0);
      }
    }

    // Record one single bulk audit log entry
    await audit(user.id, "ROW_BULK_SAVE", section.model, reportId, {
      section: section.key,
      savedCount: saved,
    });
  } catch (e) {
    console.error("saveRowsBulk error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if ((e as { code?: string }).code === "P2002") {
      return { error: "Data duplikat ditemukan saat menyimpan baris." };
    }
    if ((e as { code?: string }).code === "P2003") {
      return { error: "Relasi data tidak valid. Pastikan semua kolom terisi dengan benar." };
    }
    if (msg.includes("PrismaClientValidationError") || msg.includes("Invalid `prisma.") || msg.includes("Argument `")) {
      return { error: "Gagal menyimpan data: Mohon lengkapi kolom data yang diperlukan." };
    }
    return { error: `Gagal menyimpan data: ${msg.slice(0, 150)}` };
  }

  if (saved === 0) {
    return { error: "Tidak ada data baru yang diisi untuk disimpan." };
  }

  revalidatePath(`/reports/${reportId}`);
  return { success: `${saved} baris berhasil disimpan.` };
}
