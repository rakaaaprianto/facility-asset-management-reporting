import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  canEditReport,
  collectOptionNeeds,
  loadSectionRows,
  getReportSectionStatusMap,
  resolveDynamicOptions,
  loadKnownInvoices,
  getAccessibleSiteIds,
} from "@/lib/report-service";
import { SECTIONS, MONTH_NAMES_ID, getSection, getSectionsForReport, getSectionsForWilayah1, isWilayah1, WILAYAH1_SHEETS, WILAYAH1_SECTIONS } from "@/lib/section-config";
import { Card, Table } from "@/components/ui";
import SectionPanel from "@/components/report/section-panel";
import { ReviewForm, SubmitReportForm } from "@/components/report/workflow-buttons";
import DeleteReportButton from "@/components/report/delete-report-button";
import PksPanel from "@/components/report/pks-panel";

export const metadata = { title: "Detail Laporan" };

async function PksTab({ siteId, reportId, editable }: { siteId: string; reportId: string; editable: boolean }) {
  const contracts = await db.pksContract.findMany({
    where: { siteId },
    orderBy: { endDate: "asc" },
  });

  return <PksPanel siteId={siteId} reportId={reportId} contracts={contracts} editable={editable} />;
}

async function SectionTab({
  reportId,
  siteId,
  sectionKey,
  editable,
  siteName,
  periodLabel,
  userArea,
  isW1 = false,
}: {
  reportId: string;
  siteId: string;
  sectionKey: string;
  editable: boolean;
  siteName?: string;
  periodLabel?: string;
  userArea?: string;
  isW1?: boolean;
}) {
  const section = getSection(sectionKey, isW1);
  if (!section) return null;

  const needs = collectOptionNeeds(section.fields);
  const isInvoiceSection = section.model === "invoice" || sectionKey.includes("invoice");

  const [{ dynamic, refs }, rows, knownInvoices] = await Promise.all([
    resolveDynamicOptions(needs.sources, siteId, { refCategories: needs.refCategories }),
    section.special === "aset-ab" ? loadAsetAbRows(reportId) : loadSectionRows(sectionKey, reportId, isW1),
    isInvoiceSection ? loadKnownInvoices(siteId, reportId) : Promise.resolve([]),
  ]);

  return (
    <SectionPanel
      reportId={reportId}
      section={section}
      rows={rows}
      optMaps={{ dynamic, refs }}
      editable={editable}
      siteName={siteName}
      periodLabel={periodLabel}
      userArea={userArea}
      knownInvoices={knownInvoices}
    />
  );
}

async function loadAsetAbRows(reportId: string): Promise<Array<Record<string, unknown> & { id: string }>> {
  const acqs = await db.assetAcquisition.findMany({
    where: { report: { id: reportId } },
    include: {
      report: {
        include: {
          site: {
            include: { region: true },
          },
        },
      },
      asset: {
        select: {
          name: true, assetTag: true, category: true, brand: true,
          model: true, serialNumber: true, currentLocation: true,
          acquiredAt: true, status: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return acqs.map((a, idx) => ({
    id: a.id,
    no: idx + 1,
    areaWilayah: a.areaWilayah || a.report?.site?.region?.name || "",
    periodeLabel: a.periodeLabel || (a.report ? `${MONTH_NAMES_ID[a.report.periodMonth - 1]} ${a.report.periodYear}` : ""),
    gedungName: a.gedungName || a.report?.site?.name || "",
    acquiredAt: a.asset?.acquiredAt ?? a.createdAt,
    assetTag: a.asset?.assetTag,
    name: a.asset?.name,
    category: a.asset?.category,
    brand: a.asset?.brand,
    model: a.asset?.model,
    serialNumber: a.asset?.serialNumber,
    quantity: a.quantity ?? 1,
    acquiredValue: typeof a.acquiredValue === "object" && a.acquiredValue !== null && "toNumber" in a.acquiredValue
      ? Number((a.acquiredValue as { toNumber: () => number }).toNumber())
      : a.acquiredValue,
    source: a.source,
    picName: a.picName,
    assetStatus: a.asset?.status,
    notes: a.notes,
  }));
}

function SectionTableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse py-2">
      <div className="flex items-center justify-between">
        <div className="h-5 w-44 rounded bg-slate-200" />
        <div className="h-8 w-28 rounded bg-slate-200" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="h-9 w-full rounded bg-slate-100" />
        <div className="h-10 w-full rounded bg-slate-50" />
        <div className="h-10 w-full rounded bg-slate-50" />
        <div className="h-10 w-full rounded bg-slate-50" />
        <div className="h-10 w-full rounded bg-slate-50" />
      </div>
    </div>
  );
}

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const user = await requireUser();

  const report = await db.monthlyReport.findUnique({
    where: { id },
    include: { site: true },
  });
  if (!report) notFound();

  // Paralelkan semua query yang tidak saling bergantung setelah report ditemukan
  const [accessibleSiteIds, access, siteWithRegion, filledMap, logs] = await Promise.all([
    getAccessibleSiteIds(user),
    canEditReport(id, user),
    db.site.findUnique({
      where: { id: report.siteId },
      include: { region: { select: { name: true } } },
    }),
    getReportSectionStatusMap(id, false, report.site.id),
    db.reportStatusLog.findMany({
      where: { reportId: id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actedBy: { select: { name: true } } },
    }),
  ]);

  if ((user.roleCode === "PIC" || user.roleCode === "SUPPORT") && !accessibleSiteIds.includes(report.siteId)) {
    notFound();
  }

  const editable = access.ok;
  const canReview = user.roleCode === "SUPER_ADMIN" || user.roleCode === "ADMIN";

  // Get user's area/region name from the site's region for auto-fill
  const userArea = siteWithRegion?.region?.name ?? undefined;

  const currentSections = SECTIONS;
  const currentTabs = [
    ...currentSections.map((s) => ({ key: s.key, title: s.title })),
    { key: "pks", title: "Kontrak PKS" },
  ];

  const activeKey = currentTabs.some((t) => t.key === tab)
    ? (tab as string)
    : currentTabs[0].key;

  const relevantKeys = new Set(currentTabs.map((t) => t.key));
  const filled = [...filledMap.entries()].filter(([k, v]) => relevantKeys.has(k) && v).length;

  return (
    <div className="space-y-5">
      <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Kembali ke daftar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {report.site.code} — {report.site.name}
          </h1>
          <p className="text-sm text-slate-500">
            Periode {MONTH_NAMES_ID[report.periodMonth - 1]} {report.periodYear}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <a
            href={`/api/reports/${id}/export`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <FileDown size={15} /> Export Excel
          </a>
          <DeleteReportButton
            reportId={report.id}
            confirmText={`Hapus laporan ${report.site.code} periode ${MONTH_NAMES_ID[report.periodMonth - 1]} ${report.periodYear}? Semua data section ikut terhapus dan tidak dapat dikembalikan.`}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          />
        </div>
      </div>

      {(editable || canReview || logs.length > 0) && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Progress pengisian:{" "}
              <span className="font-semibold text-brand-700">
                {filled}/{currentTabs.length}
              </span>{" "}
              section terisi
            </p>
            {editable ? <SubmitReportForm reportId={id} /> : null}
          </div>
          {report.status === "SUBMITTED" && canReview ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <ReviewForm reportId={id} />
            </div>
          ) : null}
          {logs.length > 0 ? (
            <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {logs.map((l) => (
                <li key={l.id}>
                  <span className="font-medium text-slate-700">{new Date(l.createdAt).toLocaleString("id-ID")}</span> —{" "}
                  {l.fromStatus ?? "(baru)"} → {l.toStatus} oleh {l.actedBy?.name ?? "sistem"}
                  {l.note ? ` · "${l.note}"` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      )}

      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-2">
          {currentTabs.map((t) => {
            const done = filledMap.get(t.key);
            const isActive = t.key === activeKey;
            return (
              <Link
                key={t.key}
                href={`/reports/${id}?tab=${t.key}`}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-semibold text-brand-700 shadow-[inset_0_-2px_0_0_var(--brand-600)]"
                    : "whitespace-nowrap rounded-t-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
                }
              >
                {done ? <span className="mr-1 text-emerald-600">✓</span> : null}
                {t.title}
              </Link>
            );
          })}
        </div>

        <div className="px-5 py-5">
          <Suspense key={activeKey} fallback={<SectionTableSkeleton />}>
            {activeKey === "pks" ? (
              <PksTab siteId={report.site.id} reportId={id} editable={editable} />
            ) : (
              <SectionTab
                reportId={id}
                siteId={report.site.id}
                sectionKey={activeKey}
                editable={editable}
                siteName={`${report.site.code} — ${report.site.name}`}
                periodLabel={`${MONTH_NAMES_ID[report.periodMonth - 1]} ${report.periodYear}`}
                userArea={userArea}
              />
            )}
          </Suspense>
        </div>
      </Card>
    </div>
  );
}
