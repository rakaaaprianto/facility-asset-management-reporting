"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditReport } from "@/lib/report-service";
import { uploadFile, deleteFile } from "@/lib/storage";
import { validateMagicBytes } from "@/lib/magic-bytes";

export type FormState = { error?: string; success?: string };

const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".xlsx",
  ".xls",
  ".doc",
  ".docx",
  ".zip",
  ".csv",
]);

export async function uploadAttachment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const reportId = String(formData.get("reportId") ?? "");

  const access = await canEditReport(reportId, user);
  if (!access.ok) return { error: access.reason };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file terlebih dahulu." };
  if (file.size > MAX_SIZE) return { error: "Ukuran file maksimal 10 MB." };

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      error: `Ekstensi file "${ext || "tanpa ekstensi"}" tidak diizinkan. Format yang didukung: PDF, Excel, Word, Gambar (PNG/JPG), ZIP, CSV.`,
    };
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const storedName = `${randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const magicCheck = validateMagicBytes(bytes, ext);
  if (!magicCheck.valid) {
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ATTACHMENT_SECURITY_REJECT",
        entityType: "Attachment",
        entityId: reportId,
      },
    });
    return {
      error: `Validasi keamanan biner gagal: ${magicCheck.reason ?? "Format berkas tidak sesuai dengan tipe berkas aslinya."}`,
    };
  }

  const safeMime = magicCheck.detectedType || file.type || "application/octet-stream";
  const storageKey = `reports/${reportId}/${storedName}`;

  await uploadFile(storageKey, bytes, safeMime);

  const att = await db.attachment.create({
    data: {
      reportId,
      fileName: file.name,
      storageKey,
      mimeType: safeMime,
      sizeBytes: BigInt(file.size),
      uploadedById: user.id,
    },
  });

  await db.auditLog.create({
    data: { actorId: user.id, action: "ATTACHMENT_UPLOAD", entityType: "Attachment", entityId: att.id },
  });
  revalidatePath(`/reports/${reportId}`);
  return { success: `File "${file.name}" terunggah.` };
}

export async function deleteAttachment(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("attachmentId") ?? "");
  const reportId = String(formData.get("reportId") ?? "");

  const att = await db.attachment.findUnique({ where: { id } });
  if (!att) return;

  const access = await canEditReport(reportId, user);
  if (!access.ok && (user.roleCode === "PIC" || user.roleCode === "SUPPORT")) return;

  await db.attachment.delete({ where: { id } }).catch(() => null);
  await deleteFile(att.storageKey);

  await db.auditLog.create({
    data: { actorId: user.id, action: "ATTACHMENT_DELETE", entityType: "Attachment", entityId: id },
  });
  revalidatePath(`/reports/${reportId}`);
}
