"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import type { RoleCode } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { validatePasswordComplexity } from "@/lib/password-validator";

export type FormState = { error?: string; success?: string };

async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  after?: unknown,
  txClient?: Parameters<Parameters<typeof db.$transaction>[0]>[0]
) {
  const client = txClient ?? db;
  await client.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}

// ============ MASTER DATA: BUILDING ============

export async function updateBuilding(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "Nama gedung wajib diisi." };

  try {
    await db.building.update({
      where: { id },
      data: {
        name,
        totalAreaM2: formData.get("totalAreaM2") ? Number(formData.get("totalAreaM2")) : null,
        totalSeats: formData.get("totalSeats") ? Number(formData.get("totalSeats")) : null,
      },
    });
    await audit(user.id, "BUILDING_UPDATE", "Building", id, { name });
  } catch {
    return { error: "Gagal menyimpan gedung." };
  }
  revalidatePath("/master/sites");
  return { success: "Gedung diperbarui." };
}

export async function deleteBuilding(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const id = String(formData.get("id") ?? "");
  const counts = await db.building.findUnique({
    where: { id },
    include: { _count: { select: { rooms: true, utilizations: true } } },
  });
  if (!counts) return { error: "Gedung tidak ditemukan." };
  const blockers = [
    counts._count.rooms > 0 ? `${counts._count.rooms} ruangan` : "",
    counts._count.utilizations > 0 ? `${counts._count.utilizations} baris utilisasi laporan` : "",
  ].filter(Boolean);
  if (blockers.length > 0) return { error: `Tidak bisa dihapus — masih dipakai (${blockers.join(", ")}).` };
  const hasPks = await db.pksContract.count({ where: { buildingId: id } });
  if (hasPks > 0) return { error: `Tidak bisa dihapus — masih terikat ${hasPks} kontrak PKS.` };

  try {
    await db.building.delete({ where: { id } });
  } catch {
    return { error: "Gagal menghapus gedung." };
  }
  await audit(user.id, "BUILDING_DELETE", "Building", id);
  revalidatePath("/master/sites");
  return { success: "Gedung dihapus." };
}

// ============ PKS CONTRACTS ============

export async function createPksContract(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const siteId = String(formData.get("siteId") ?? "");
  const contractNo = String(formData.get("contractNo") ?? "").trim();
  const jenisPks = String(formData.get("jenisPks") ?? "").trim();
  const endDateStr = String(formData.get("endDate") ?? "");
  const picName = String(formData.get("picName") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!siteId || !endDateStr) return { error: "Site dan tanggal berakhir wajib diisi." };

  const endDate = new Date(endDateStr);
  if (Number.isNaN(endDate.getTime())) return { error: "Format tanggal tidak valid." };

  try {
    const contract = await db.pksContract.create({
      data: {
        siteId,
        contractNo: contractNo || null,
        jenisPks: jenisPks || null,
        endDate,
        picName: picName || null,
        notes: notes || null,
      },
    });
    await audit(user.id, "PKS_CREATE", "PksContract", contract.id);
  } catch {
    return { error: "Gagal menyimpan kontrak PKS." };
  }
  const reportId = String(formData.get("reportId") ?? "").trim();
  if (reportId) revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports/[id]", "page");
  revalidatePath("/reports");
  return { success: "Kontrak PKS ditambahkan." };
}
export async function updatePksContract(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const contractNo = String(formData.get("contractNo") ?? "").trim();
  const jenisPks = String(formData.get("jenisPks") ?? "").trim();
  const endDateStr = String(formData.get("endDate") ?? "");
  const picName = String(formData.get("picName") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || !endDateStr) return { error: "ID dan tanggal berakhir wajib diisi." };

  const endDate = new Date(endDateStr);
  if (Number.isNaN(endDate.getTime())) return { error: "Format tanggal tidak valid." };

  try {
    await db.pksContract.update({
      where: { id },
      data: {
        contractNo: contractNo || null,
        jenisPks: jenisPks || null,
        endDate,
        picName: picName || null,
        notes: notes || null,
      },
    });
    await audit(user.id, "PKS_UPDATE", "PksContract", id);
  } catch {
    return { error: "Gagal memperbarui kontrak PKS." };
  }
  const reportId = String(formData.get("reportId") ?? "").trim();
  if (reportId) revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports/[id]", "page");
  revalidatePath("/reports");
  return { success: "Kontrak PKS diperbarui." };
}

export async function deletePksContract(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await db.pksContract.delete({ where: { id } });
    await audit(user.id, "PKS_DELETE", "PksContract", id);
  } catch (e) {
    console.error("deletePksContract error:", e);
  }
  const reportId = String(formData.get("reportId") ?? "").trim();
  if (reportId) revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports/[id]", "page");
  revalidatePath("/reports");
}

export async function savePksBulk(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const siteId = String(formData.get("siteId") ?? "");
  const rowsJson = String(formData.get("rows") ?? "[]");

  if (!siteId) return { error: "Site ID tidak valid." };

  let rows: Array<{
    id?: string;
    contractNo?: string;
    jenisPks?: string;
    endDate?: string;
    picName?: string;
    notes?: string;
  }>;
  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return { error: "Data tidak valid." };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Tidak ada data untuk disimpan." };
  }

  let saved = 0;
  try {
    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.endDate) {
          throw new Error(`Tanggal Berakhir wajib diisi pada baris ke-${i + 1}.`);
        }
        const endDate = new Date(r.endDate);
        if (Number.isNaN(endDate.getTime())) {
          throw new Error(`Format Tanggal Berakhir tidak valid pada baris ke-${i + 1}.`);
        }

        if (r.id) {
          await tx.pksContract.update({
            where: { id: r.id },
            data: {
              contractNo: r.contractNo || null,
              jenisPks: r.jenisPks || null,
              endDate,
              picName: r.picName || null,
              notes: r.notes || null,
            },
          });
          await tx.auditLog.create({
            data: { actorId: user.id, action: "PKS_UPDATE", entityType: "PksContract", entityId: r.id },
          });
        } else {
          const created = await tx.pksContract.create({
            data: {
              siteId,
              contractNo: r.contractNo || null,
              jenisPks: r.jenisPks || null,
              endDate,
              picName: r.picName || null,
              notes: r.notes || null,
            },
          });
          await tx.auditLog.create({
            data: { actorId: user.id, action: "PKS_CREATE", entityType: "PksContract", entityId: created.id },
          });
        }
        saved++;
      }
    });
  } catch (e) {
    console.error("savePksBulk error:", e);
    return { error: `Gagal menyimpan kontrak PKS: ${e instanceof Error ? e.message : String(e)}` };
  }

  const reportId = String(formData.get("reportId") ?? "").trim();
  if (reportId) revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports/[id]", "page");
  revalidatePath("/reports");
  return { success: `${saved} kontrak PKS berhasil disimpan.` };
}


export async function createRegion(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const name = String(formData.get("name") ?? "").trim().toUpperCase();
  if (!name) return { error: "Nama wilayah wajib diisi." };

  try {
    const r = await db.region.create({ data: { name } });
    await audit(user.id, "REGION_CREATE", "Region", r.id);
  } catch {
    return { error: `Wilayah "${name}" sudah ada.` };
  }
  revalidatePath("/master/sites");
  return { success: `Wilayah ${name} ditambahkan.` };
}

export async function updateRegion(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().toUpperCase();
  if (!id || !name) return { error: "Nama wilayah wajib diisi." };

  try {
    await db.region.update({ where: { id }, data: { name } });
    await audit(user.id, "REGION_UPDATE", "Region", id, { name });
  } catch {
    return { error: "Gagal menyimpan wilayah." };
  }
  revalidatePath("/master/sites");
  return { success: "Wilayah diperbarui." };
}

export async function deleteRegion(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const id = String(formData.get("id") ?? "");
  const siteCount = await db.site.count({ where: { regionId: id } });
  if (siteCount > 0) {
    return { error: `Tidak bisa dihapus — masih ada ${siteCount} site di wilayah ini.` };
  }
  try {
    await db.region.delete({ where: { id } });
  } catch {
    return { error: "Gagal menghapus wilayah." };
  }
  await audit(user.id, "REGION_DELETE", "Region", id);
  revalidatePath("/master/sites");
  return { success: "Wilayah dihapus." };
}

export async function createSite(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "").trim() || null;
  if (!code || !name || !city) return { error: "Kode, nama, dan kota wajib diisi." };

  try {
    const site = await db.site.create({
      data: {
        code,
        name,
        city,
        regionId,
        buildings: {
          create: {
            name: `${name} (Gedung Utama)`,
          },
        },
      },
    });
    await audit(user.id, "SITE_CREATE", "Site", site.id);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      const meta = (e as { meta?: { target?: string[] } }).meta;
      if (meta?.target?.includes("code")) {
        return { error: `Kode site "${code}" sudah terdaftar.` };
      }
      if (meta?.target?.includes("name")) {
        return { error: `Nama site "${name}" sudah terdaftar.` };
      }
    }
    return { error: `Gagal menambahkan site: ${e instanceof Error ? e.message : String(e)}` };
  }
  revalidatePath("/master/sites");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: `Site ${code} ditambahkan.` };
}

export async function updateSite(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "").trim() || null;

  if (!id || !code || !name || !city) return { error: "Kode, nama, dan kota wajib diisi." };

  try {
    const existing = await db.site.findUnique({ where: { id } });
    if (!existing) return { error: "Site tidak ditemukan." };

    await db.site.update({
      where: { id },
      data: { code, name, city, regionId },
    });
    await audit(user.id, "SITE_UPDATE", "Site", id, { code, name, city, regionId });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      const meta = (e as { meta?: { target?: string[] } }).meta;
      if (meta?.target?.includes("code")) {
        return { error: `Kode site "${code}" sudah terdaftar pada site lain.` };
      }
      if (meta?.target?.includes("name")) {
        return { error: `Nama site "${name}" sudah terdaftar pada site lain.` };
      }
    }
    return { error: `Gagal memperbarui site: ${e instanceof Error ? e.message : String(e)}` };
  }

  revalidatePath("/master/sites");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: `Site ${code} berhasil diperbarui.` };
}

export async function deleteSite(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Site ID tidak valid." };

  const reportCount = await db.monthlyReport.count({ where: { siteId: id } });
  if (reportCount > 0) {
    return { error: `Tidak bisa dihapus — masih ada ${reportCount} laporan bulanan yang terhubung dengan site ini.` };
  }

  const assetCount = await db.asset.count({ where: { currentSiteId: id } });
  if (assetCount > 0) {
    return { error: `Tidak bisa dihapus — masih ada ${assetCount} aset yang berada di site ini.` };
  }

  try {
    await db.$transaction(async (tx) => {
      const buildings = await tx.building.findMany({ where: { siteId: id }, select: { id: true } });
      const buildingIds = buildings.map((b) => b.id);
      const rooms = await tx.room.findMany({ where: { buildingId: { in: buildingIds } }, select: { id: true } });
      const roomIds = rooms.map((r) => r.id);

      if (roomIds.length > 0) {
        await tx.roomBooking.deleteMany({ where: { roomId: { in: roomIds } } });
        await tx.room.deleteMany({ where: { id: { in: roomIds } } });
      }
      if (buildingIds.length > 0) {
        await tx.buildingUtilization.deleteMany({ where: { buildingId: { in: buildingIds } } });
        await tx.building.deleteMany({ where: { id: { in: buildingIds } } });
      }
      await tx.userSiteAssignment.deleteMany({ where: { siteId: id } });
      await tx.pksContract.deleteMany({ where: { siteId: id } });
      await tx.invoice.deleteMany({ where: { siteId: id } });
      await tx.site.delete({ where: { id } });
      await audit(user.id, "SITE_DELETE", "Site", id);
    });
  } catch (e) {
    console.error("deleteSite error:", e);
    return { error: `Gagal menghapus site: ${e instanceof Error ? e.message : String(e)}` };
  }

  revalidatePath("/master/sites");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: "Site berhasil dihapus." };
}

export async function createBuilding(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const siteId = String(formData.get("siteId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!siteId || !name) return { error: "Site dan nama gedung wajib diisi." };

  try {
    const b = await db.building.create({
      data: {
        siteId,
        name,
        totalAreaM2: formData.get("totalAreaM2") ? Number(formData.get("totalAreaM2")) : null,
        totalSeats: formData.get("totalSeats") ? Number(formData.get("totalSeats")) : null,
      },
    });
    await audit(user.id, "BUILDING_CREATE", "Building", b.id);
  } catch {
    return { error: "Gedung dengan nama tersebut sudah ada di site ini." };
  }
  revalidatePath("/master/sites");
  return { success: "Gedung ditambahkan." };
}



export async function createRefOption(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return { error: "Tidak diizinkan." };

  const category = String(formData.get("category") ?? "").trim().toUpperCase();
  const value = String(formData.get("value") ?? "").trim();
  if (!category || !value) return { error: "Kategori dan nilai wajib diisi." };

  try {
    const opt = await db.refOption.create({ data: { category, value, sortOrder: 99 } });
    await audit(user.id, "REF_CREATE", "RefOption", opt.id);
  } catch {
    return { error: "Nilai tersebut sudah ada untuk kategori ini." };
  }
  revalidatePath("/master/sites");
  return { success: "Opsi referensi ditambahkan." };
}

export async function deleteRefOption(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.roleCode === "PIC" || user.roleCode === "SUPPORT") return;
  const id = String(formData.get("id") ?? "");
  await db.refOption.delete({ where: { id } }).catch(() => null);
  await audit(user.id, "REF_DELETE", "RefOption", id);
  revalidatePath("/master/sites");
}


export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireUser();
  if (actor.roleCode !== "SUPER_ADMIN") return { error: "Hanya Super Admin dapat menambah user." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleCode = String(formData.get("roleCode") ?? "");
  if (!email || !name || !roleCode) {
    return { error: "Lengkapi semua field yang wajib diisi." };
  }
  const check = validatePasswordComplexity(password);
  if (!check.ok) {
    return { error: check.reason };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Format email tidak valid." };

  const role = await db.role.findUnique({ where: { code: roleCode as RoleCode } });
  if (!role) return { error: "Role tidak dikenal." };

  const hash = await bcrypt.hash(password, 12);
  try {
    const u = await db.user.create({ data: { email, name, passwordHash: hash, roleId: role.id } });
    const siteIds = formData.getAll("siteIds").map(String).filter(Boolean);
    for (const siteId of siteIds) {
      await db.userSiteAssignment.create({ data: { userId: u.id, siteId } }).catch(() => null);
    }
    await audit(actor.id, "USER_CREATE", "User", u.id);
  } catch {
    return { error: "Email sudah terdaftar." };
  }
  revalidatePath("/admin/users");
  return { success: `User ${email} dibuat.` };
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const actor = await requireUser();
  if (actor.roleCode !== "SUPER_ADMIN") return;
  const id = String(formData.get("id") ?? "");
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.id === actor.id) return;
  await db.user.update({ where: { id }, data: { isActive: !target.isActive } });
  await audit(actor.id, target.isActive ? "USER_DEACTIVATE" : "USER_ACTIVATE", "User", id);
  revalidatePath("/admin/users");
}

export async function deleteUserPermanently(formData: FormData): Promise<void> {
  const actor = await requireUser();
  if (actor.roleCode !== "SUPER_ADMIN") return;

  const id = String(formData.get("id") ?? "");
  if (!id || id === actor.id) return; // Tidak boleh menghapus akun yang sedang login

  const target = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!target) return;

  await db.$transaction(async (tx) => {
    // 1. Lepas penugasan site
    await tx.userSiteAssignment.deleteMany({ where: { userId: id } });

    // 2. Lepas referensi Primary PIC di Site
    await tx.site.updateMany({ where: { primaryPicId: id }, data: { primaryPicId: null } });

    // 3. Lepas referensi PIC di PKS
    await tx.pksContract.updateMany({ where: { picUserId: id }, data: { picUserId: null } });

    // 4. Lepas referensi di laporan bulanan & status log
    await tx.monthlyReport.updateMany({ where: { submittedById: id }, data: { submittedById: null } });
    await tx.monthlyReport.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } });
    await tx.reportStatusLog.updateMany({ where: { actedById: id }, data: { actedById: null } });

    // 5. Reassign uploader lampiran ke Super Admin
    await tx.attachment.updateMany({ where: { uploadedById: id }, data: { uploadedById: actor.id } });

    // 6. Lepas referensi actor di AuditLog
    await tx.auditLog.updateMany({ where: { actorId: id }, data: { actorId: null } });

    // 7. Hapus user secara permanen
    await tx.user.delete({ where: { id } });

    // 8. Catat audit log penghapusan permanen
    await audit(actor.id, "USER_DELETE_PERMANENT", "User", id, {
      deletedEmail: target.email,
      deletedName: target.name,
    }, tx);
  });

  revalidatePath("/admin/users");
}

export async function setUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireUser();
  if (actor.roleCode !== "SUPER_ADMIN") return { error: "Tidak diizinkan." };
  const id = String(formData.get("id") ?? "");
  const roleCode = String(formData.get("roleCode") ?? "");
  const role = await db.role.findUnique({ where: { code: roleCode as RoleCode } });
  if (!id || !role) return { error: "Data tidak valid." };
  await db.user.update({ where: { id }, data: { roleId: role.id } });
  await audit(actor.id, "USER_SET_ROLE", "User", id, { roleCode });
  revalidatePath("/admin/users");
  return { success: "Role diperbarui." };
}

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const check = validatePasswordComplexity(next);
  if (!check.ok) return { error: check.reason };

  const me = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare(current, me.passwordHash))) {
    return { error: "Password saat ini salah." };
  }
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });
  await audit(user.id, "PASSWORD_CHANGE", "User", user.id);
  return { success: "Password berhasil diganti." };
}

