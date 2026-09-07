import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MONTH_NAMES_ID } from "@/lib/section-config";
import { Card, CardHeader, Table, EmptyRow } from "@/components/ui";
import ExportDialog from "@/components/report/export-dialog";

export const metadata = { title: "Monitoring Nasional" };

const STATUS_DOT: Record<string, string> = {
  APPROVED: "bg-emerald-500",
  SUBMITTED: "bg-amber-500",
  NEEDS_REVISION: "bg-red-500",
  DRAFT: "bg-slate-300",
};

async function loadMonitoringData(year: number) {
  const [sites, reports, regions] = await Promise.all([
    db.site.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true, city: true } }),
    db.monthlyReport.findMany({
      where: { periodYear: year },
      select: { siteId: true, periodMonth: true, status: true, id: true },
    }),
    db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const byStatus = { APPROVED: 0, SUBMITTED: 0, NEEDS_REVISION: 0, DRAFT: 0 };
  for (const r of reports) {
    if (r.status in byStatus) byStatus[r.status as keyof typeof byStatus]++;
  }
  const now = new Date();
  const pksExpiring = await db.pksContract.count({
    where: { endDate: { lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), gte: now } },
  });

  return { sites, reports, regions, byStatus, pksExpiring };
}

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
    return <p className="text-sm text-slate-500">Hanya HQ yang dapat mengakses halaman ini.</p>;
  }

  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || 12;
  const { sites, reports, regions, byStatus, pksExpiring } = await loadMonitoringData(year);

  const matrix = new Map<string, Map<number, { status: string; id: string }>>();
  for (const r of reports) {
    if (!matrix.has(r.siteId)) matrix.set(r.siteId, new Map());
    matrix.get(r.siteId)!.set(r.periodMonth, { status: r.status, id: r.id });
  }

  const sitesForExport = sites.map((s) => {
    const reportForMonth = reports.find((r) => r.siteId === s.id && r.periodMonth === month);
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      reportId: reportForMonth?.id,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Monitoring Nasional {year}</h1>
          <p className="text-sm text-slate-500">Kepatuhan pelaporan bulanan seluruh site.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a href={`/monitoring?year=${year - 1}`} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50">← {year - 1}</a>
          <a href={`/monitoring?year=${year + 1}`} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50">{year + 1} →</a>
          <ExportDialog
            year={year}
            month={month}
            monthName={MONTH_NAMES_ID[month - 1]}
            regions={regions}
            sites={sitesForExport}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {Object.entries(byStatus).map(([status, count]) => (
          <Card key={status} className="flex items-center gap-3 p-4">
            <span className={`inline-block h-3 w-3 rounded-full ${STATUS_DOT[status]}`} />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{status.replace("_", " ")}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <p className="text-sm text-slate-600">
          Kontrak PKS berakhir ≤ 90 hari: <span className="font-bold text-accent">{pksExpiring}</span> kontrak
        </p>
      </Card>

      <Card>
        <CardHeader title="Matriks Kepatuhan" description="Klik sel untuk membuka laporan." />
        <Table head={["Site", ...MONTH_NAMES_ID.map((m) => m.slice(0, 3))]}>
          {sites.length === 0 ? (
            <EmptyRow colSpan={13} />
          ) : (
            sites.map((s) => {
              const months = matrix.get(s.id);
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2 text-xs font-semibold">{s.code}</td>
                  {MONTH_NAMES_ID.map((_, i) => {
                    const cell = months?.get(i + 1);
                    return (
                      <td key={i} className="px-2 py-2 text-center">
                        {cell ? (
                          <Link
                            href={`/reports/${cell.id}`}
                            title={`${s.code} · ${MONTH_NAMES_ID[i]} · ${cell.status}`}
                            className={`inline-block h-4 w-4 rounded-full ${STATUS_DOT[cell.status] ?? "bg-slate-200"} hover:ring-2 hover:ring-brand-300`}
                          />
                        ) : (
                          <span className="inline-block h-4 w-4 rounded-full border border-dashed border-slate-300" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </Table>
        <div className="flex flex-wrap gap-4 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT.APPROVED}`} /> Approved</span>
          <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT.SUBMITTED}`} /> Submitted</span>
          <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT.NEEDS_REVISION}`} /> Revisi</span>
          <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT.DRAFT}`} /> Draft</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-slate-400" /> Belum dibuat</span>
        </div>
      </Card>
    </div>
  );
}
