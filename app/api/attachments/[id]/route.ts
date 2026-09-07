import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { downloadFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await context.params;

  const att = await db.attachment.findUnique({
    where: { id },
    include: { report: { select: { siteId: true } } },
  });
  if (!att || !att.report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((user.roleCode === "PIC" || user.roleCode === "SUPPORT") && !user.siteIds.includes(att.report.siteId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await downloadFile(att.storageKey);
    const safeFilename = att.fileName.replace(/[\r\n"\\/]/g, "_");

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": att.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-transform, max-age=86400",
      },
    });
  } catch (error) {
    console.error(`[Attachment Route] Error downloading file "${att.storageKey}":`, error);
    return NextResponse.json({ error: "File tidak ditemukan di penyimpanan." }, { status: 404 });
  }
}
