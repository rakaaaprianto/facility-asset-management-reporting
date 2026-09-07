import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAccessibleSiteIds } from "@/lib/report-service";
import NewReportForm from "./new-report-form";

export const metadata = { title: "Laporan Baru" };

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; year?: string; month?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const siteIds = await getAccessibleSiteIds(user);
  const now = new Date();

  const allAccessibleSites = await db.site.findMany({
    where: { id: { in: siteIds }, isActive: true },
    include: { region: true },
    orderBy: [{ isArea: "desc" }, { code: "asc" }],
  });

  // Region yang sudah memiliki site level area (misal AREA 2)
  const areaRegionIds = new Set(
    allAccessibleSites.filter((s) => s.isArea && s.regionId).map((s) => s.regionId!)
  );

  // Jika suatu region memiliki site area (isArea = true), sembunyikan site individu dari region tersebut
  // agar PIC langsung membuat laporan satu area sekaligus
  const reportableSites = allAccessibleSites.filter((s) => {
    if (s.isArea) return true;
    if (s.regionId && areaRegionIds.has(s.regionId)) return false;
    return true;
  });

  // Always default to the previous month (reporting period)
  // now.getMonth() is 0-indexed: e.g. August = 7, so getMonth() = 7 = previous month (August) in 1-indexed
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  // If only 1 reportable site, auto-select it as default
  const defaultSelectedSite = sp.site || (reportableSites.length === 1 ? reportableSites[0].id : undefined);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-bold">Buat Laporan Baru</h1>
      <NewReportForm
        sites={reportableSites.map((s) => ({
          value: s.id,
          label: s.isArea ? `[AREA] ${s.name}` : `${s.code} — ${s.name}`,
        }))}
        defaultSite={defaultSelectedSite}
        year={prevYear}
        month={prevMonth}
      />
    </div>
  );
}
