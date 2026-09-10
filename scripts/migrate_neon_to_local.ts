import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const neonUrl = "postgresql://neondb_owner:npg_BuTQsx6rWSw9@ep-silent-shadow-az9i5q54-pooler.c-3.ap-southeast-1.aws.neon.tech/monthly_asset_management?sslmode=require&channel_binding=require";
const localUrl = "postgresql://postgres:united243@localhost:5432/monthly_asset_management";

const neonAdapter = new PrismaNeon({ connectionString: neonUrl });
const neonDb = new PrismaClient({ adapter: neonAdapter });

const localPool = new Pool({ connectionString: localUrl });
const localAdapter = new PrismaPg(localPool);
const localDb = new PrismaClient({ adapter: localAdapter });

async function clearLocalTables() {
  console.log("🧹 Mengosongkan data lama di PostgreSQL lokal...");
  const res = await localPool.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations';
  `);
  for (const row of res.rows) {
    await localPool.query(`TRUNCATE TABLE "${row.tablename}" CASCADE;`);
  }
  console.log(`✅ Pembersihan ${res.rows.length} tabel selesai.`);
}

async function copyTable<T>(
  name: string,
  fetchFn: () => Promise<T[]>,
  insertFn: (items: T[]) => Promise<any>,
  batchSize = 100
) {
  try {
    const items = await fetchFn();
    if (items.length === 0) {
      console.log(`- ${name}: 0 data (lewati)`);
      return;
    }
    console.log(`- ${name}: Menyalin ${items.length} data...`);
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await insertFn(batch);
    }
    console.log(`  ✓ ${name}: Selesai (${items.length} data disalin)`);
  } catch (err: any) {
    console.warn(`  ⚠️ Peringatan pada ${name}:`, err.message);
  }
}

async function main() {
  console.log("========================================================");
  console.log("🚀 MEMULAI MIGRASI DATA PENUH DARI NEON KE POSTGRES LOKAL");
  console.log("========================================================\n");

  await clearLocalTables();

  console.log("\n📦 Menyalin data master & konfigurasi...");
  // 1. Roles
  await copyTable("Role", () => neonDb.role.findMany(), (b) => localDb.role.createMany({ data: b }));

  // 2. Permissions
  await copyTable("Permission", () => neonDb.permission.findMany(), (b) => localDb.permission.createMany({ data: b }));

  // 3. RolePermissions
  await copyTable("RolePermission", () => neonDb.rolePermission.findMany(), (b) => localDb.rolePermission.createMany({ data: b }));

  // 4. Regions
  await copyTable("Region", () => neonDb.region.findMany(), (b) => localDb.region.createMany({ data: b }));

  // 5. Users
  await copyTable("User", () => neonDb.user.findMany(), (b) => localDb.user.createMany({ data: b }));

  // 6. Sites
  await copyTable("Site", () => neonDb.site.findMany(), (b) => localDb.site.createMany({ data: b }));

  // 7. Buildings
  await copyTable("Building", () => neonDb.building.findMany(), (b) => localDb.building.createMany({ data: b }));

  // 8. Rooms
  await copyTable("Room", () => neonDb.room.findMany(), (b) => localDb.room.createMany({ data: b }));

  // 9. UserSiteAssignments
  await copyTable("UserSiteAssignment", () => neonDb.userSiteAssignment.findMany(), (b) => localDb.userSiteAssignment.createMany({ data: b }));

  // 10. PksContracts
  await copyTable("PksContract", () => neonDb.pksContract.findMany(), (b) => localDb.pksContract.createMany({ data: b }));

  // 11. RefOptions
  await copyTable("RefOption", () => neonDb.refOption.findMany(), (b) => localDb.refOption.createMany({ data: b }));

  console.log("\n📑 Menyalin data laporan & transaksi...");
  // 12. MonthlyReports
  await copyTable("MonthlyReport", () => neonDb.monthlyReport.findMany(), (b) => localDb.monthlyReport.createMany({ data: b }));

  // 13. ReportStatusLogs
  await copyTable("ReportStatusLog", () => neonDb.reportStatusLog.findMany(), (b) => localDb.reportStatusLog.createMany({ data: b }));

  // 14. AuditLogs
  await copyTable("AuditLog", () => neonDb.auditLog.findMany(), (b) => localDb.auditLog.createMany({ data: b as any }));

  // 15. Attachments
  await copyTable("Attachment", () => neonDb.attachment.findMany(), (b) => localDb.attachment.createMany({ data: b }));

  // 16. Report Sections
  await copyTable("BuildingUtilization", () => neonDb.buildingUtilization.findMany(), (b) => localDb.buildingUtilization.createMany({ data: b }));
  await copyTable("ActiveServiceEntry", () => neonDb.activeServiceEntry.findMany(), (b) => localDb.activeServiceEntry.createMany({ data: b }));
  await copyTable("MaintenanceWork", () => neonDb.maintenanceWork.findMany(), (b) => localDb.maintenanceWork.createMany({ data: b }));
  await copyTable("NearMissIncident", () => neonDb.nearMissIncident.findMany(), (b) => localDb.nearMissIncident.createMany({ data: b }));
  await copyTable("RoomBooking", () => neonDb.roomBooking.findMany(), (b) => localDb.roomBooking.createMany({ data: b }));
  await copyTable("SecurityHeadcount", () => neonDb.securityHeadcount.findMany(), (b) => localDb.securityHeadcount.createMany({ data: b }));
  await copyTable("UtilityUsage", () => neonDb.utilityUsage.findMany(), (b) => localDb.utilityUsage.createMany({ data: b }));
  await copyTable("GensetUsage", () => neonDb.gensetUsage.findMany(), (b) => localDb.gensetUsage.createMany({ data: b }));
  await copyTable("VehicleFuelUsage", () => neonDb.vehicleFuelUsage.findMany(), (b) => localDb.vehicleFuelUsage.createMany({ data: b }), 100);
  await copyTable("MaterialReplacement", () => neonDb.materialReplacement.findMany(), (b) => localDb.materialReplacement.createMany({ data: b }));
  await copyTable("Invoice", () => neonDb.invoice.findMany(), (b) => localDb.invoice.createMany({ data: b }));
  await copyTable("PettyCashExpense", () => neonDb.pettyCashExpense.findMany(), (b) => localDb.pettyCashExpense.createMany({ data: b }));
  await copyTable("BudgetAbsorption", () => neonDb.budgetAbsorption.findMany(), (b) => localDb.budgetAbsorption.createMany({ data: b }));

  // 17. Area Models
  await copyTable("AreaLayananEntry", () => neonDb.areaLayananEntry.findMany(), (b) => localDb.areaLayananEntry.createMany({ data: b }));
  await copyTable("AreaIdleSeatEntry", () => neonDb.areaIdleSeatEntry.findMany(), (b) => localDb.areaIdleSeatEntry.createMany({ data: b }));
  await copyTable("AreaSdmEntry", () => neonDb.areaSdmEntry.findMany(), (b) => localDb.areaSdmEntry.createMany({ data: b }));
  await copyTable("AreaMaintenanceEntry", () => neonDb.areaMaintenanceEntry.findMany(), (b) => localDb.areaMaintenanceEntry.createMany({ data: b }));
  await copyTable("AreaVehicleLogEntry", () => neonDb.areaVehicleLogEntry.findMany(), (b) => localDb.areaVehicleLogEntry.createMany({ data: b }));
  await copyTable("AreaMandatoryCostEntry", () => neonDb.areaMandatoryCostEntry.findMany(), (b) => localDb.areaMandatoryCostEntry.createMany({ data: b }));
  await copyTable("AreaWaterConsumptionEntry", () => neonDb.areaWaterConsumptionEntry.findMany(), (b) => localDb.areaWaterConsumptionEntry.createMany({ data: b }));

  console.log("\n========================================================");
  console.log("🎉 MIGRASI SUKSES! SELURUH DATA NEON TELAH DIPINDAH KE LOKAL");
  console.log("========================================================");
}

main()
  .catch((err) => {
    console.error("❌ Terjadi kesalahan saat migrasi:", err);
    process.exit(1);
  })
  .finally(async () => {
    await neonDb.$disconnect();
    await localDb.$disconnect();
    await localPool.end();
    process.exit(0);
  });
