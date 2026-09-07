import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { getSection } from "@/lib/section-config";

export const EDITABLE_STATUSES = ["DRAFT", "NEEDS_REVISION"] as const;

export const getAccessibleSiteIds = cache(async (user: SessionUser): Promise<string[]> => {
  if (user.roleCode !== "PIC" && user.roleCode !== "SUPPORT") {
    const sites = await db.site.findMany({ select: { id: true } });
    return sites.map((s) => s.id);
  }

  const assignedSiteIds = new Set(user.siteIds);

  // Jika user ditugaskan di site manapun dalam suatu region yang memiliki virtual site area (isArea = true),
  // otomatis berikan akses ke site area tersebut
  if (user.siteIds.length > 0) {
    const userSites = await db.site.findMany({
      where: { id: { in: user.siteIds } },
      select: { regionId: true },
    });
    const regionIds = [...new Set(userSites.map((s) => s.regionId).filter(Boolean))] as string[];
    if (regionIds.length > 0) {
      const areaSites = await db.site.findMany({
        where: { regionId: { in: regionIds }, isArea: true, isActive: true },
        select: { id: true },
      });
      for (const a of areaSites) {
        assignedSiteIds.add(a.id);
      }
    }
  }

  return [...assignedSiteIds];
});

export async function canEditReport(
  reportId: string,
  user: SessionUser
): Promise<{ ok: true; report: ReportRow } | { ok: false; reason: string }> {
  const report = await db.monthlyReport.findUnique({
    where: { id: reportId },
    include: { site: { select: { id: true, code: true, name: true, isArea: true, regionId: true } } },
  });
  if (!report) return { ok: false, reason: "Laporan tidak ditemukan." };
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
    const accessible = await getAccessibleSiteIds(user);
    if (!accessible.includes(report.siteId)) {
      return { ok: false, reason: "Anda tidak ditugaskan pada site/area ini." };
    }
  }
  if (!EDITABLE_STATUSES.includes(report.status as (typeof EDITABLE_STATUSES)[number])) {
    return { ok: false, reason: `Laporan berstatus ${report.status} dan tidak dapat diubah.` };
  }
  return { ok: true, report };
}

export type ReportRow = NonNullable<Awaited<ReturnType<typeof db.monthlyReport.findFirst>>>;

export type SectionRow = Record<string, unknown> & { id: string };

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

function serializeRows(rows: SectionRow[]): SectionRow[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = { id: r.id };
    for (const [k, v] of Object.entries(r)) {
      if (k === "id") continue;
      out[k] = serializeValue(v);
    }
    return out as SectionRow;
  });
}

export async function loadSectionRows(sectionKey: string, reportId: string, isW1: boolean = false): Promise<SectionRow[]> {
  const section = getSection(sectionKey, isW1);
  if (!section || section.special === "aset-ab") return [];
  const model = (
    db as unknown as Record<string, {
      findMany(args: { where: Record<string, unknown>; orderBy?: Record<string, string> }): Promise<SectionRow[]>;
    }>
  )[section.model];
  const fixed = section.fixedValues ?? {};

  let whereClause: Record<string, unknown> = { reportId, ...fixed };
  if (section.model === "invoice" && fixed.sheetKey) {
    if (fixed.sheetKey === "open-invoice") {
      whereClause = {
        reportId,
        OR: [
          { sheetKey: "open-invoice" },
          { sheetKey: null, status: { notIn: ["IN_PROCESS", "PAID"] } },
        ],
      };
    } else if (fixed.sheetKey === "invoice-proses") {
      whereClause = {
        reportId,
        OR: [
          { sheetKey: "invoice-proses" },
          { sheetKey: null, status: "IN_PROCESS" },
        ],
      };
    } else if (fixed.sheetKey === "invoice-paid") {
      whereClause = {
        reportId,
        OR: [
          { sheetKey: "invoice-paid" },
          { sheetKey: null, status: "PAID" },
        ],
      };
    }
  }

  const raw = await model.findMany({
    where: whereClause,
    orderBy: section.model === "invoiceFinancialEntry" ? { no: "asc" } : { createdAt: "asc" },
  });
  return serializeRows(raw);
}

export async function hasSectionRows(sectionKey: string, reportId: string, isW1: boolean = false): Promise<boolean> {
  const section = getSection(sectionKey, isW1);
  if (!section) return false;
  const model = (
    db as unknown as Record<string, {
      findFirst(args: { where: Record<string, unknown>; select: { id: boolean } }): Promise<{ id: string } | null>;
    }>
  )[section.model];
  if (!model) return false;
  const fixed = section.fixedValues ?? {};

  let whereClause: Record<string, unknown> = { reportId, ...fixed };
  if (section.model === "invoice" && fixed.sheetKey) {
    if (fixed.sheetKey === "open-invoice") {
      whereClause = {
        reportId,
        OR: [
          { sheetKey: "open-invoice" },
          { sheetKey: null, status: { notIn: ["IN_PROCESS", "PAID"] } },
        ],
      };
    } else if (fixed.sheetKey === "invoice-proses") {
      whereClause = {
        reportId,
        OR: [
          { sheetKey: "invoice-proses" },
          { sheetKey: null, status: "IN_PROCESS" },
        ],
      };
    } else if (fixed.sheetKey === "invoice-paid") {
      whereClause = {
        reportId,
        OR: [
          { sheetKey: "invoice-paid" },
          { sheetKey: null, status: "PAID" },
        ],
      };
    }
  }

  const found = await model.findFirst({
    where: whereClause,
    select: { id: true },
  });
  return found !== null;
}

export async function getReportSectionStatusMap(
  reportId: string,
  isAreaReport: boolean,
  siteId?: string
): Promise<Map<string, boolean>> {
  const statusMap = new Map<string, boolean>();

  try {
    if (isAreaReport) {
      const res = await db.$queryRaw<Array<{
        has_layanan: boolean;
        has_idle: boolean;
        has_sdm: boolean;
        has_maint: boolean;
        has_mobil: boolean;
        has_mand: boolean;
        has_air: boolean;
        has_listrik: boolean;
        has_genset: boolean;
        has_bbm: boolean;
        has_pdam: boolean;
      }>>`
        SELECT
          EXISTS(SELECT 1 FROM "AreaLayananEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_layanan,
          EXISTS(SELECT 1 FROM "AreaIdleSeatEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_idle,
          EXISTS(SELECT 1 FROM "AreaSdmEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_sdm,
          EXISTS(SELECT 1 FROM "AreaMaintenanceEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_maint,
          EXISTS(SELECT 1 FROM "AreaVehicleLogEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_mobil,
          EXISTS(SELECT 1 FROM "AreaMandatoryCostEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_mand,
          EXISTS(SELECT 1 FROM "AreaWaterConsumptionEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_air,
          EXISTS(SELECT 1 FROM "UtilityUsage" WHERE "reportId" = ${reportId} AND "type" = 'ELECTRICITY' LIMIT 1) AS has_listrik,
          EXISTS(SELECT 1 FROM "GensetUsage" WHERE "reportId" = ${reportId} LIMIT 1) AS has_genset,
          EXISTS(SELECT 1 FROM "VehicleFuelUsage" WHERE "reportId" = ${reportId} LIMIT 1) AS has_bbm,
          EXISTS(SELECT 1 FROM "UtilityUsage" WHERE "reportId" = ${reportId} AND "type" = 'WATER' LIMIT 1) AS has_pdam
      `;

      const r = res[0] ?? {};
      statusMap.set("area-layanan", !!r.has_layanan);
      statusMap.set("area-idle-seat", !!r.has_idle);
      statusMap.set("area-sdm", !!r.has_sdm);
      statusMap.set("area-kerusakan", !!r.has_maint);
      statusMap.set("area-mobil", !!r.has_mobil);
      statusMap.set("area-mandatory-cost", !!r.has_mand);
      statusMap.set("area-air-minum", !!r.has_air);
      statusMap.set("listrik", !!r.has_listrik);
      statusMap.set("genset", !!r.has_genset);
      statusMap.set("bbm", !!r.has_bbm);
      statusMap.set("pdam", !!r.has_pdam);
      return statusMap;
    }

    const res = await db.$queryRaw<Array<{
      has_utilisasi: boolean;
      has_layanan_aktif: boolean;
      has_karyawan: boolean;
      has_maintenance: boolean;
      has_incident: boolean;
      has_booking: boolean;
      has_keamanan: boolean;
      has_listrik: boolean;
      has_pdam: boolean;
      has_mandatory_gedung: boolean;
      has_genset: boolean;
      has_bbm: boolean;
      has_material: boolean;
      has_open_invoice: boolean;
      has_invoice_proses: boolean;
      has_invoice_paid: boolean;
      has_petty_cash: boolean;
      has_rkap_project: boolean;
      has_penyerapan: boolean;
      has_aset_ab: boolean;
      has_capex_baru: boolean;
      has_mutasi_aset: boolean;
      has_inventory: boolean;
      has_churn: boolean;
      has_invoice_financial: boolean;
      has_pks: boolean;
    }>>`
      SELECT
        EXISTS(SELECT 1 FROM "BuildingUtilization" WHERE "reportId" = ${reportId} LIMIT 1) AS has_utilisasi,
        EXISTS(SELECT 1 FROM "ActiveServiceEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_layanan_aktif,
        EXISTS(SELECT 1 FROM "EmployeeCountEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_karyawan,
        EXISTS(SELECT 1 FROM "MaintenanceWork" WHERE "reportId" = ${reportId} LIMIT 1) AS has_maintenance,
        EXISTS(SELECT 1 FROM "NearMissIncident" WHERE "reportId" = ${reportId} LIMIT 1) AS has_incident,
        EXISTS(SELECT 1 FROM "RoomBooking" WHERE "reportId" = ${reportId} LIMIT 1) AS has_booking,
        EXISTS(SELECT 1 FROM "SecurityHeadcount" WHERE "reportId" = ${reportId} LIMIT 1) AS has_keamanan,
        EXISTS(SELECT 1 FROM "UtilityUsage" WHERE "reportId" = ${reportId} AND "type" = 'ELECTRICITY' LIMIT 1) AS has_listrik,
        EXISTS(SELECT 1 FROM "UtilityUsage" WHERE "reportId" = ${reportId} AND "type" = 'WATER' LIMIT 1) AS has_pdam,
        EXISTS(SELECT 1 FROM "BuildingMandatoryEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_mandatory_gedung,
        EXISTS(SELECT 1 FROM "GensetUsage" WHERE "reportId" = ${reportId} LIMIT 1) AS has_genset,
        EXISTS(SELECT 1 FROM "VehicleFuelUsage" WHERE "reportId" = ${reportId} LIMIT 1) AS has_bbm,
        EXISTS(SELECT 1 FROM "MaterialReplacement" WHERE "reportId" = ${reportId} LIMIT 1) AS has_material,
        EXISTS(SELECT 1 FROM "Invoice" WHERE "reportId" = ${reportId} AND ("sheetKey" = 'open-invoice' OR ("sheetKey" IS NULL AND "status" NOT IN ('IN_PROCESS', 'PAID'))) LIMIT 1) AS has_open_invoice,
        EXISTS(SELECT 1 FROM "Invoice" WHERE "reportId" = ${reportId} AND ("sheetKey" = 'invoice-proses' OR ("sheetKey" IS NULL AND "status" = 'IN_PROCESS')) LIMIT 1) AS has_invoice_proses,
        EXISTS(SELECT 1 FROM "Invoice" WHERE "reportId" = ${reportId} AND ("sheetKey" = 'invoice-paid' OR ("sheetKey" IS NULL AND "status" = 'PAID')) LIMIT 1) AS has_invoice_paid,
        EXISTS(SELECT 1 FROM "PettyCashExpense" WHERE "reportId" = ${reportId} LIMIT 1) AS has_petty_cash,
        EXISTS(SELECT 1 FROM "RkapProjectEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_rkap_project,
        EXISTS(SELECT 1 FROM "BudgetAbsorption" WHERE "reportId" = ${reportId} LIMIT 1) AS has_penyerapan,
        EXISTS(SELECT 1 FROM "NewCapexProposal" WHERE "reportId" = ${reportId} AND "category" = 'AB_BALANCE' LIMIT 1) AS has_aset_ab,
        EXISTS(SELECT 1 FROM "NewCapexProposal" WHERE "reportId" = ${reportId} AND "category" = 'CAPEX_BARU' LIMIT 1) AS has_capex_baru,
        EXISTS(SELECT 1 FROM "AssetMutation" WHERE "reportId" = ${reportId} LIMIT 1) AS has_mutasi_aset,
        EXISTS(SELECT 1 FROM "InventoryVerification" WHERE "reportId" = ${reportId} LIMIT 1) AS has_inventory,
        EXISTS(SELECT 1 FROM "ChurnRisk" WHERE "reportId" = ${reportId} LIMIT 1) AS has_churn,
        EXISTS(SELECT 1 FROM "InvoiceFinancialEntry" WHERE "reportId" = ${reportId} LIMIT 1) AS has_invoice_financial,
        EXISTS(SELECT 1 FROM "PksContract" WHERE "siteId" = (SELECT "siteId" FROM "MonthlyReport" WHERE "id" = ${reportId} LIMIT 1) LIMIT 1) AS has_pks
    `;

    const r = res[0] ?? {};
    statusMap.set("utilisasi", !!r.has_utilisasi);
    statusMap.set("layanan-aktif", !!r.has_layanan_aktif);
    statusMap.set("karyawan", !!r.has_karyawan);
    statusMap.set("maintenance", !!r.has_maintenance);
    statusMap.set("incident", !!r.has_incident);
    statusMap.set("booking", !!r.has_booking);
    statusMap.set("keamanan", !!r.has_keamanan);
    statusMap.set("listrik", !!r.has_listrik);
    statusMap.set("pdam", !!r.has_pdam);
    statusMap.set("mandatory-gedung", !!r.has_mandatory_gedung);
    statusMap.set("genset", !!r.has_genset);
    statusMap.set("bbm", !!r.has_bbm);
    statusMap.set("material", !!r.has_material);
    statusMap.set("open-invoice", !!r.has_open_invoice);
    statusMap.set("invoice-proses", !!r.has_invoice_proses);
    statusMap.set("invoice-paid", !!r.has_invoice_paid);
    statusMap.set("petty-cash", !!r.has_petty_cash);
    statusMap.set("rkap-project", !!r.has_rkap_project);
    statusMap.set("penyerapan", !!r.has_penyerapan);
    statusMap.set("aset-ab", !!r.has_aset_ab);
    statusMap.set("capex-baru", !!r.has_capex_baru);
    statusMap.set("mutasi-aset", !!r.has_mutasi_aset);
    statusMap.set("inventory", !!r.has_inventory);
    statusMap.set("churn", !!r.has_churn);
    statusMap.set("invoice-financial", !!r.has_invoice_financial);
    statusMap.set("pks", !!r.has_pks);
  } catch (err) {
    console.error("getReportSectionStatusMap error, fallback to empty map:", err);
  }

  return statusMap;
}

export type OptionItem = { value: string; label: string };

export async function resolveDynamicOptions(
  sources: Set<string>,
  siteId: string,
  extra?: { refCategories?: string[] }
): Promise<{
  dynamic: Record<string, OptionItem[]>;
  refs: Record<string, OptionItem[]>;
}> {
  const dynamic: Record<string, OptionItem[]> = {};
  const refs: Record<string, OptionItem[]> = {};

  if (sources.has("building")) {
    const rows = await db.building.findMany({
      where: { siteId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    dynamic.building = rows.map((r) => ({ value: r.id, label: r.name }));
  }

  if (sources.has("room")) {
    const rooms = await db.room.findMany({
      where: { building: { siteId } },
      select: { id: true, name: true, floorLabel: true },
      orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
    });
    dynamic.room = rooms.map((r) => ({
      value: r.id,
      label: r.floorLabel ? `${r.name} (${r.floorLabel})` : r.name,
    }));
  }
  if (sources.has("asset")) {
    const rows = await db.asset.findMany({
      where: { currentSiteId: siteId },
      select: { id: true, assetTag: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    });
    dynamic.asset = rows.map((r) => ({ value: r.id, label: `${r.name}${r.assetTag ? ` [${r.assetTag}]` : ""}` }));
  }
  if (sources.has("site")) {
    const rows = await db.site.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } });
    dynamic.site = rows.map((r) => ({ value: r.id, label: `${r.code} — ${r.name}` }));
  }

  for (const cat of extra?.refCategories ?? []) {
    const opts = await db.refOption.findMany({
      where: { category: cat, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    refs[cat] = opts.map((o) => ({ value: o.value, label: o.value }));
  }

  return { dynamic, refs };
}

/** kumpulkan kebutuhan opsi dinamis/ref dari konfigurasi section */
export function collectOptionNeeds(fields: Array<{ dynamic?: string; type: string; refCategory?: string }>) {
  const sources = new Set<string>();
  const refCategories = new Set<string>();
  for (const f of fields) {
    if (f.dynamic) sources.add(f.dynamic);
    if (f.type === "ref" && f.refCategory) refCategories.add(f.refCategory);
  }
  return { sources, refCategories: [...refCategories] };
}

export type KnownInvoice = {
  invoiceNo: string;
  vendorName?: string;
  serviceType?: string;
  gedungName?: string;
  areaWilayah?: string;
  invoicePeriod?: string;
  amount?: number;
};

export async function loadKnownInvoices(siteId: string, reportId: string): Promise<KnownInvoice[]> {
  const rows = await db.invoice.findMany({
    where: {
      OR: [{ reportId }, { siteId }],
    },
    select: {
      invoiceNo: true,
      vendorName: true,
      serviceType: true,
      gedungName: true,
      areaWilayah: true,
      invoicePeriod: true,
      amount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  const list: KnownInvoice[] = [];
  for (const r of rows) {
    const key = r.invoiceNo?.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push({
      invoiceNo: r.invoiceNo!,
      vendorName: r.vendorName ?? undefined,
      serviceType: r.serviceType ?? undefined,
      gedungName: r.gedungName ?? undefined,
      areaWilayah: r.areaWilayah ?? undefined,
      invoicePeriod: r.invoicePeriod ?? undefined,
      amount: r.amount ? Number(r.amount) : 0,
    });
  }
  return list;
}
