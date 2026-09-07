import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAccessibleSiteIds } from "@/lib/report-service";
import { MONTH_NAMES_ID } from "@/lib/section-config";
import { LinkButton } from "@/components/ui";
import ReportsBulkManager from "@/components/report/reports-bulk-manager";
import ExportDialog from "@/components/report/export-dialog";

export const metadata = { title: "Laporan Bulanan" };

function shiftMonth(year: number, month: number, delta: number): [number, number] {
  const d = new Date(year, month - 1 + delta, 1);
  return [d.getFullYear(), d.getMonth() + 1];
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const siteIds = await getAccessibleSiteIds(user);
  const [sites, reports, regions] = await Promise.all([
    db.site.findMany({ where: { id: { in: siteIds } }, orderBy: { code: "asc" } }),
    db.monthlyReport.findMany({
      where: { siteId: { in: siteIds }, periodYear: year, periodMonth: month },
      include: {
        site: { select: { id: true, code: true, name: true } },
      },
    }),
    db.region.findMany({ orderBy: { name: "asc" } }),
  ]);

  const reportBySite = new Map(reports.map((r) => [r.siteId, r.id]));
  const sitesForExport = sites.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    reportId: reportBySite.get(s.id),
  }));

  const [prevY, prevM] = shiftMonth(year, month, -1);
  const [nextY, nextM] = shiftMonth(year, month, 1);
  const qs = (y: number, m: number) => `/reports?year=${y}&month=${m}`;

  const isSuperAdminOrAdmin = user.roleCode === "SUPER_ADMIN" || user.roleCode === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Laporan Bulanan</h1>
          <p className="text-sm text-slate-500">
            {MONTH_NAMES_ID[month - 1]} {year}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton href={qs(prevY, prevM)} variant="outline">← Sebelumnya</LinkButton>
          <LinkButton href={qs(nextY, nextM)} variant="outline">Berikutnya →</LinkButton>
          <ExportDialog
            year={year}
            month={month}
            monthName={MONTH_NAMES_ID[month - 1]}
            regions={regions}
            sites={sitesForExport}
          />
          <LinkButton href="/reports/new">+ Laporan Baru</LinkButton>
        </div>
      </div>

      <ReportsBulkManager
        sites={sites}
        reports={reports}
        year={year}
        month={month}
        monthName={MONTH_NAMES_ID[month - 1]}
        isSuperAdminOrAdmin={isSuperAdminOrAdmin}
      />
    </div>
  );
}
