import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildReportWorkbook } from "@/lib/excel-export";
import { getAccessibleSiteIds } from "@/lib/report-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await context.params;

  const report = await db.monthlyReport.findUnique({ where: { id }, select: { siteId: true } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
    const accessible = await getAccessibleSiteIds(user);
    if (!accessible.includes(report.siteId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { buffer, filename } = await buildReportWorkbook(id, user);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
