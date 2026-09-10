import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const url = process.env.DATABASE_URL!;
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg(new Pool({ connectionString: url }));
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding…");

  // ---------- Roles & Permissions ----------
  const roles = await Promise.all(
    (
      [
        ["SUPER_ADMIN", "Super Administrator", "Akses penuh sistem"],
        ["ADMIN", "Admin HQ Asset Management", "Review & approve laporan, kelola master data, monitoring nasional"],
        ["PIC", "PIC Site", "Mengisi & submit laporan bulanan"],
      ] as const
    ).map(([code, name, description]) =>
      db.role.upsert({ where: { code }, update: { name, description }, create: { code, name, description } })
    )
  );
  const roleByCode = Object.fromEntries(roles.map((r) => [r.code, r.id]));

  const permDefs = [
    "report:create", "report:update", "report:submit",
    "report:review", "export:run",
    "site:manage", "building:manage", "region:manage", "ref:manage",
    "user:manage", "audit:read", "attachment:manage",
  ];
  const perms = await Promise.all(
    permDefs.map((p) => {
      const [resource, action] = p.split(":");
      return db.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });
    })
  );
  const permByKey = Object.fromEntries(perms.map((p) => [`${p.resource}:${p.action}`, p.id]));

  const matrix: Record<string, string[]> = {
    SUPER_ADMIN: permDefs,
    ADMIN: ["report:create", "report:update", "report:submit", "report:review", "export:run",
      "site:manage", "building:manage", "region:manage", "ref:manage", "attachment:manage"],
    PIC: ["report:create", "report:update", "report:submit", "export:run", "attachment:manage"],
  };
  for (const [roleCode, keys] of Object.entries(matrix)) {
    for (const key of keys) {
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleByCode[roleCode], permissionId: permByKey[key] } },
        update: {},
        create: { roleId: roleByCode[roleCode], permissionId: permByKey[key] },
      });
    }
  }

  // ---------- Ref Options ----------
  const refData: Record<string, string[]> = {
    JENIS_PEKERJAAN: ["AC", "Karpet", "Atap", "Tangga", "Pagar", "Genset", "Lift", "Pest Kontrol", "Fire Alarm System", "Fire Suppression", "Toilet", "Lady Bin"],
    MATERIAL: ["Lampu", "Pintu", "Flexible house", "Jet Shower", "Kran", "Kabel", "Parquet", "Mobile Drawer"],
    KATEGORI_INSIDEN: ["Kejadian/Kerusakan", "Kerusakan Gedung", "Informasi Kerusakan Gedung", "Lain-lain"],
    JENIS_PKS: ["Sewa Gedung", "Cleaning", "Security", "Maintenance", "Lainnya"],
    JENIS_PENGELUARAN: ["Cash Advance", "Reimburse"],
    AREA_WILAYAH: ["Jakarta", "Tangerang", "Bogor", "Bandung", "Semarang", "Yogyakarta", "Surabaya", "Malang", "Medan"],
  };
  for (const [category, values] of Object.entries(refData)) {
    for (let i = 0; i < values.length; i++) {
      await db.refOption.upsert({
        where: { category_value: { category, value: values[i] } },
        update: { sortOrder: i },
        create: { category, value: values[i], sortOrder: i },
      });
    }
  }

  // ---------- Regions (Wilayah) ----------
  const regionDefs: Array<[string, number]> = [
    ["WILAYAH 1", 1],
    ["WILAYAH 2", 2],
    ["WILAYAH 3", 3],
    ["WILAYAH 4", 4],
    ["WILAYAH 5", 5],
  ];
  const regions: Record<string, string> = {};
  for (const [name, order] of regionDefs) {
    const r = await db.region.upsert({ where: { name }, update: { sortOrder: order }, create: { name, sortOrder: order } });
    regions[name] = r.id;
  }

  // ---------- Sites (Gedung) ----------
  const siteDefs: Array<[string, string, string, string | null, number | null, number | null]> = [
    // WILAYAH 1 — MEDAN
    ["GATSU-MDN", "Gatsu", "Medan", "WILAYAH 1", 698, 257],
    // WILAYAH 2 — JAKARTA / JABODETABEK
    ["HO-FATMAWATI", "Gedung Infomedia Fatmawati", "Jakarta Selatan", "WILAYAH 2", 877, 274],
    ["OPMC-TENDEAN", "OPMC Tendean", "Jakarta Selatan", "WILAYAH 2", null, null],
    ["GICC-TENDEAN", "GICC Tendean", "Jakarta Selatan", "WILAYAH 2", 2037, 609],
    ["GICC-MAMPANG", "GICC Mampang", "Jakarta Selatan", "WILAYAH 2", 872, 451],
    ["GIF", "Graha Infomedia GIF", "Jakarta Selatan", "WILAYAH 2", 571, 95],
    ["BSD", "OPMC BSD", "Tangerang Selatan", "WILAYAH 2", 1034, 290],
    ["OPMC-BOGOR", "Gedung OPMC Bogor", "Bogor", "WILAYAH 2", 891, 363],
    ["IDC-CIAWI", "IDC Ciawi", "Bogor", "WILAYAH 2", null, null],
    ["ITC-DEPOK-6", "ITC Depok Sewa No 6", "Depok", "WILAYAH 2", null, null],
    ["ITC-DEPOK-7", "ITC Depok Sewa No 7", "Depok", "WILAYAH 2", null, null],
    ["ITC-DEPOK-8", "ITC Depok Sewa No 8", "Depok", "WILAYAH 2", null, null],
    ["TBB-BDG", "Gedung TBB Bandung", "Bandung", "WILAYAH 2", null, null],
    // WILAYAH 3 — SEMARANG
    ["SRI-RATU", "Infomedia Sri Ratu Semarang", "Semarang", "WILAYAH 3", null, null],
    ["MAJAPAHIT-SMG", "Gedung Majapahit Semarang", "Semarang", "WILAYAH 3", null, null],
    ["RUKO-SRI-RATU", "Ruko Sri Ratu Semarang", "Semarang", "WILAYAH 3", null, null],
    // WILAYAH 4 — YOGYAKARTA
    ["GRHA-INTAN-YOG", "Graha Intan Yogyakarta", "Yogyakarta", "WILAYAH 4", null, null],
    ["KALBE-YOG", "Gedung Kalbe Yogyakarta", "Yogyakarta", "WILAYAH 4", null, null],
    // WILAYAH 5 — SURABAYA & SEKITARNYA
    ["GRHA-PENA-SBY", "Graha Pena Surabaya", "Surabaya", "WILAYAH 5", null, null],
    ["GRHA-PANGERAN-SBY", "Graha Pangeran Surabaya", "Surabaya", "WILAYAH 5", null, null],
    ["PLAZA-TLK-MLG", "Plaza Telkom Malang", "Malang", "WILAYAH 5", null, null],
    ["BASSURA-SBY", "Bassura Surabaya", "Surabaya", "WILAYAH 5", null, null],
  ];
  const sites: Record<string, string> = {};
  for (const [code, name, city, regionName, area, seats] of siteDefs) {
    const site = await db.site.upsert({
      where: { code },
      update: { name, city, regionId: regionName ? regions[regionName] : undefined },
      create: { code, name, city, regionId: regionName ? regions[regionName] : null },
    });
    sites[code] = site.id;
    await db.building.upsert({
      where: { siteId_name: { siteId: site.id, name } },
      update: {},
      create: { siteId: site.id, name, totalAreaM2: area ?? undefined, totalSeats: seats ?? undefined },
    });
  }

  // ---------- Rooms ----------
  const roomDefs: Array<[string, string, string, number | null, number | null]> = [
    ["BSD", "Meeting Room SRC", "Lt. 4", 12, 4],
    ["BSD", "Room SRC", "Lt. 4", 33.3, 20],
    ["OPMC-TENDEAN", "Ruangan FASSO", "Lt. 1", 80.4, 26],
    ["OPMC-TENDEAN", "Ruangan Damri", "Lt. 4", 28, 5],
    ["SRI-RATU", "Ruangan Pertamina", "Lt. 3", null, 57],
    ["GRHA-INTAN-YOG", "Ruangan BPJS", "Lt. B", 10, 5],
    ["GRHA-INTAN-YOG", "Ruangan Aladin", "Lt. 2", 84, 32],
  ];
  for (const [siteCode, name, floorLabel, area, seats] of roomDefs) {
    const b = await db.building.findFirstOrThrow({ where: { siteId: sites[siteCode] } });
    await db.room.upsert({
      where: { buildingId_name: { buildingId: b.id, name } },
      update: {},
      create: { buildingId: b.id, name, floorLabel, areaM2: area, seatCapacity: seats },
    });
  }

  // ---------- PKS Contracts ----------
  const pksDefs: Array<[string, string, string, string, string?]> = [
    ["TBB-BDG", "PKS/TBB/001", "2031-12-31", "Sewa Gedung", "KHAERUN N"],
    ["SRI-RATU", "PKS/SRR/002", "2030-12-31", "Sewa Gedung", "KHAERUN N"],
    ["BASSURA-SBY", "PKS/BSS/003", "2028-12-31", "Sewa Gedung", "KHAERUN N"],
    ["ITC-DEPOK-6", "PKS/ITC/006", "2028-12-31", "Sewa Gedung", "KHAERUN N"],
    ["ITC-DEPOK-7", "PKS/ITC/007", "2028-12-31", "Sewa Gedung", "KHAERUN N"],
    ["ITC-DEPOK-8", "PKS/ITC/008", "2028-12-31", "Sewa Gedung", "KHAERUN N"],
    ["MAJAPAHIT-SMG", "PKS/MJP/011", "2027-12-31", "Sewa Gedung", "KHAERUN N"],
    ["RUKO-SRI-RATU", "PKS/RSR/012", "2027-12-31", "Sewa Gedung", "KHAERUN N"],
    ["IDC-CIAWI", "PKS/CWI/013", "2026-09-30", "Maintenance", "KHAERUN N"],
    ["KALBE-YOG", "PKS/KLB/014", "2026-10-31", "Cleaning", "KHAERUN N"],
    ["GRHA-INTAN-YOG", "PKS/GIT/015", "2026-10-10", "Security", "KHAERUN N"],
    ["PLAZA-TLK-MLG", "PKS/PTM/016", "2026-12-17", "Sewa Gedung", "KHAERUN N"],
  ];
  for (const [code, no, end, jenis, pic] of pksDefs) {
    if (!sites[code]) continue;
    const exists = await db.pksContract.findFirst({ where: { siteId: sites[code], contractNo: no } });
    if (!exists) {
      await db.pksContract.create({
        data: { siteId: sites[code], contractNo: no, endDate: new Date(end), jenisPks: jenis, picName: pic ?? null, notes: "Data awal dari template Excel" },
      });
    }
  }

  // ---------- Users ----------
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const users: Record<string, string> = {};
  const userDefs: Array<[string, string, string, string, string[]]> = [
    ["superadmin@infomedia.co.id", "Super Admin", "SUPER_ADMIN", "System Administrator", []],
    ["admin@infomedia.co.id", "Admin HQ Asset Management", "ADMIN", "Asset Management HQ", []],
    ["dilla@infomedia.co.id", "DILLA", "PIC", "Site Admin BSD", ["BSD", "OPMC-TENDEAN"]],
    ["huda@infomedia.co.id", "HUDA", "PIC", "Site Admin Gatsu", ["GATSU-MDN", "HO-FATMAWATI"]],
    ["fam5@infomedia.co.id", "FAM 5", "PIC", "Facility Area Manager 5",
      ["GRHA-PENA-SBY", "GRHA-PANGERAN-SBY", "PLAZA-TLK-MLG", "KALBE-YOG", "GRHA-INTAN-YOG", "SRI-RATU"]],
  ];
  for (const [email, name, roleCode, title, assignedSites] of userDefs) {
    const user = await db.user.upsert({
      where: { email },
      update: { name, employeeTitle: title },
      create: { email, name, passwordHash, employeeTitle: title, roleId: roleByCode[roleCode] },
    });
    users[email] = user.id;
    for (const code of assignedSites) {
      await db.userSiteAssignment.upsert({
        where: { userId_siteId: { userId: user.id, siteId: sites[code] } },
        update: {},
        create: { userId: user.id, siteId: sites[code] },
      });
    }
  }
  await db.site.update({ where: { id: sites["BSD"] }, data: { primaryPicId: users["dilla@infomedia.co.id"] } });
  await db.site.update({ where: { id: sites["GATSU-MDN"] }, data: { primaryPicId: users["huda@infomedia.co.id"] } });

  // ---------- Sample Reports ----------
  const july = { periodYear: 2026, periodMonth: 7 };
  async function ensureReport(siteCode: string, status: "DRAFT" | "SUBMITTED" | "APPROVED") {
    return db.monthlyReport.upsert({
      where: { siteId_periodYear_periodMonth: { siteId: sites[siteCode], ...july } },
      update: { status, lockedAt: status === "APPROVED" ? new Date() : null, submittedAt: status !== "DRAFT" ? new Date() : null, reviewedAt: status === "APPROVED" ? new Date() : null },
      create: { siteId: sites[siteCode], ...july, status },
    });
  }
  const repBsd = await ensureReport("BSD", "APPROVED");
  const repGatsu = await ensureReport("GATSU-MDN", "SUBMITTED");

  const bsdBuilding = await db.building.findFirstOrThrow({ where: { siteId: sites["BSD"] } });
  const gatsuBuilding = await db.building.findFirstOrThrow({ where: { siteId: sites["GATSU-MDN"] } });

  const existBsd = await db.buildingUtilization.findFirst({ where: { reportId: repBsd.id, buildingId: bsdBuilding.id } });
  if (!existBsd) {
    await db.buildingUtilization.create({
      data: { reportId: repBsd.id, buildingId: bsdBuilding.id, totalAreaM2: 1034, usedAreaM2: 1034, idleAreaM2: 0, totalSeats: 290, usedSeats: 290, idleSeats: 0, picName: "DILLA" },
    });
  }
  const existGatsu = await db.buildingUtilization.findFirst({ where: { reportId: repGatsu.id, buildingId: gatsuBuilding.id } });
  if (!existGatsu) {
    await db.buildingUtilization.create({
      data: { reportId: repGatsu.id, buildingId: gatsuBuilding.id, totalAreaM2: 698, usedAreaM2: 621, idleAreaM2: 77, totalSeats: 257, usedSeats: 229, idleSeats: 28, picName: "All Site Manager" },
    });
  }

  // Active services as serviceName text only (no serviceId)
  const gatsuServiceNames = ["CC Bank Sumut Lt. 1", "HR SSO Lt. 1", "CC Bank Mestika Lt. 1"];
  for (const name of gatsuServiceNames) {
    const exists = await db.activeServiceEntry.findFirst({ where: { reportId: repGatsu.id, serviceName: name } });
    if (!exists) {
      await db.activeServiceEntry.create({
        data: { reportId: repGatsu.id, serviceName: name, areaM2: 120, totalSeats: 40, usedSeats: 38, idleSeats: 2, staffCount: 35, picName: "All Site Manager" },
      });
    }
  }

  // Maintenance
  const maintExists = await db.maintenanceWork.findFirst({ where: { reportId: repGatsu.id } });
  if (!maintExists) {
    await db.maintenanceWork.createMany({
      data: [
        { reportId: repGatsu.id, workDate: new Date("2026-07-29"), areaName: "Medan", workCategory: "AC", detail: "Kerusakan bearing AC cassette lantai 2", estimatedCost: 900000, status: "DONE" as const, picName: "HUDA" },
        { reportId: repGatsu.id, workDate: new Date("2026-07-11"), areaName: "Medan", workCategory: "Genset", detail: "Maintenance rutin bulanan", status: "DONE" as const, notes: "1 Bulan 2 kali", picName: "HUDA" },
      ],
    });
  }

  // Invoices (no serviceId)
  const invExists = await db.invoice.findFirst({ where: { invoicePeriod: "2026-07" } });
  if (!invExists) {
    await db.invoice.createMany({
      data: [
        { reportId: repBsd.id, invoiceNo: "INV/2026/07/001", vendorName: "PT Adhikara Cipta Karya", siteId: sites["BSD"], invoicePeriod: "2026-07", invoiceDate: new Date("2026-07-05"), dueDate: new Date("2026-08-04"), paidAt: new Date("2026-07-30"), amount: 45750000, status: "PAID" as const, picName: "JAMAL-RANIA" },
        { reportId: repGatsu.id, invoiceNo: "INV/2026/07/002", vendorName: "PT Mitra Properti Utama", siteId: sites["GATSU-MDN"], invoicePeriod: "2026-07", invoiceDate: new Date("2026-07-10"), dueDate: new Date("2026-08-09"), amount: 12875000, status: "IN_PROCESS" as const, picName: "JAMAL-RANIA" },
      ],
    });
  }

  // Status logs
  const logExists = await db.reportStatusLog.findFirst({ where: { reportId: repBsd.id } });
  if (!logExists) {
    await db.reportStatusLog.createMany({
      data: [
        { reportId: repBsd.id, fromStatus: null, toStatus: "SUBMITTED" as const, actedById: users["dilla@infomedia.co.id"], createdAt: new Date("2026-08-02T03:00:00Z"), note: "Submit laporan Juli" },
        { reportId: repBsd.id, fromStatus: "SUBMITTED" as const, toStatus: "APPROVED" as const, actedById: users["admin@infomedia.co.id"], createdAt: new Date("2026-08-04T06:30:00Z"), note: "Data lengkap & sesuai" },
        { reportId: repGatsu.id, fromStatus: null, toStatus: "SUBMITTED" as const, actedById: users["huda@infomedia.co.id"], createdAt: new Date("2026-08-05T02:15:00Z"), note: "Submit laporan Juli" },
      ],
    });
  }

  console.log("✅ Seed selesai.");
  console.log("   Login: superadmin@infomedia.co.id | admin@infomedia.co.id | dilla@infomedia.co.id | huda@infomedia.co.id | fam5@infomedia.co.id");
  console.log("   Password semua: Password123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
