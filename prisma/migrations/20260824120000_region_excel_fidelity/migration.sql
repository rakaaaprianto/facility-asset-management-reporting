-- Region (Wilayah)
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Site" ADD COLUMN "regionId" TEXT;
ALTER TABLE "Site" ADD CONSTRAINT "Site_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Site_regionId_idx" ON "Site"("regionId");
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- Lepas referensi layanan sebelum hapus tabelnya
ALTER TABLE "ActiveServiceEntry" DROP COLUMN IF EXISTS "serviceId";
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "serviceId";
ALTER TABLE "InventoryVerification" DROP COLUMN IF EXISTS "serviceId";
DROP TABLE IF EXISTS "Service";

-- Kolom PIC untuk semua baris laporan
ALTER TABLE "PksContract" ADD COLUMN "picName" TEXT;
ALTER TABLE "RkapProjectEntry" ADD COLUMN "picName" TEXT;
ALTER TABLE "BuildingUtilization" ADD COLUMN "picName" TEXT;
ALTER TABLE "MaintenanceWork" ADD COLUMN "picName" TEXT;
ALTER TABLE "NearMissIncident" ADD COLUMN "picName" TEXT;
ALTER TABLE "UtilityUsage" ADD COLUMN "picName" TEXT;
ALTER TABLE "GensetUsage" ADD COLUMN "picName" TEXT;
ALTER TABLE "VehicleFuelUsage" ADD COLUMN "picName" TEXT;
ALTER TABLE "MaterialReplacement" ADD COLUMN "picName" TEXT;
ALTER TABLE "RoomBooking" ADD COLUMN "picName" TEXT;
ALTER TABLE "SecurityHeadcount" ADD COLUMN "picName" TEXT;
ALTER TABLE "ActiveServiceEntry" ADD COLUMN "picName" TEXT;
ALTER TABLE "EmployeeCountEntry" ADD COLUMN "picName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "picName" TEXT;
ALTER TABLE "PettyCashExpense" ADD COLUMN "picName" TEXT;
ALTER TABLE "BudgetAbsorption" ADD COLUMN "picName" TEXT;
ALTER TABLE "NewCapexProposal" ADD COLUMN "picName" TEXT;
ALTER TABLE "AssetMutation" ADD COLUMN "picName" TEXT;
ALTER TABLE "AssetAcquisition" ADD COLUMN "picName" TEXT;
ALTER TABLE "InventoryVerification" ADD COLUMN "picName" TEXT;
ALTER TABLE "ChurnRisk" ADD COLUMN "picName" TEXT;
