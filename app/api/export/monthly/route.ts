import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildMonthlyWorkbook } from "@/lib/excel-export";

export async function GET(request: Request) {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") {
    return NextResponse.json({ error: "Hanya HQ dapat mengunduh rekap nasional." }, { status: 403 });
  }

  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1;
  const regionId = url.searchParams.get("regionId") || undefined;

  const { buffer, filename } = await buildMonthlyWorkbook(year, month, regionId, user);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
