import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MONTH_NAMES_ID } from "@/lib/section-config";
import { Badge, Card, CardHeader, Table, EmptyRow } from "@/components/ui";

export const metadata = { title: "Persetujuan" };

export default async function ApprovalsPage() {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
    return <p className="text-sm text-slate-500">Hanya HQ yang dapat mengakses halaman ini.</p>;
  }

  const submitted = await db.monthlyReport.findMany({
    where: { status: "SUBMITTED" },
    orderBy: [{ submittedAt: "asc" }],
    include: {
      site: { select: { code: true, name: true, city: true } },
      submittedBy: { select: { name: true } },
    },
  });

  const revised = await db.monthlyReport.findMany({
    where: { status: "NEEDS_REVISION" },
    orderBy: [{ reviewedAt: "desc" }],
    take: 10,
    include: {
      site: { select: { code: true, name: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Persetujuan Laporan</h1>
        <p className="text-sm text-slate-500">Review laporan yang menunggu persetujuan HQ.</p>
      </div>

      <Card>
        <CardHeader title={`Menunggu Review (${submitted.length})`} />
        <Table head={["Site", "Periode", "Disubmit Oleh", "Waktu Submit", "Aksi"]}>
          {submitted.length === 0 ? (
            <EmptyRow colSpan={5} label="Tidak ada laporan menunggu review." />
          ) : (
            submitted.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <span className="font-semibold">{r.site.code}</span>
                  <span className="ml-2 text-xs text-slate-500">{r.site.name}</span>
                </td>
                <td className="px-4 py-2.5">
                  {MONTH_NAMES_ID[r.periodMonth - 1]} {r.periodYear}
                </td>
                <td className="px-4 py-2.5">{r.submittedBy?.name ?? "-"}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {r.submittedAt
                    ? new Date(r.submittedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB"
                    : "-"}
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/reports/${r.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      <Card>
        <CardHeader title="Baru Saja Diminta Revisi" />
        <Table head={["Site", "Periode", "Direview Oleh", "Catatan", ""]}>
          {revised.length === 0 ? (
            <EmptyRow colSpan={5} label="Tidak ada riwayat revisi terkini." />
          ) : (
            revised.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 font-semibold">{r.site.code}</td>
                <td className="px-4 py-2.5">
                  {MONTH_NAMES_ID[r.periodMonth - 1]} {r.periodYear}
                </td>
                <td className="px-4 py-2.5">{r.reviewedBy?.name ?? "-"}</td>
                <td className="max-w-[320px] truncate px-4 py-2.5">
                  <Badge tone="red">{r.reviewNote ?? "-"}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/reports/${r.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                    Buka
                  </Link>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
}
