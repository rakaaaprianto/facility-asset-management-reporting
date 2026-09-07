-- Migration: area_report_models
-- Adds isArea/areaCode to Site, creates 7 area-specific report tables

ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "isArea" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "areaCode" TEXT;
CREATE INDEX IF NOT EXISTS "Site_isArea_idx" ON "Site"("isArea");

CREATE TABLE IF NOT EXISTS "AreaLayananEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "periodeLabel" TEXT,
    "areaWilayah" TEXT,
    "gedungName" TEXT,
    "divisi" TEXT,
    "layanan" TEXT,
    "klien" TEXT,
    "luasM2" DECIMAL(12,2),
    "jumlahSeat" INTEGER,
    "jumlahSdm" INTEGER,
    "lantai" TEXT,
    "notes" TEXT,
    "picName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AreaLayananEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AreaLayananEntry_reportId_idx" ON "AreaLayananEntry"("reportId");
ALTER TABLE "AreaLayananEntry" DROP CONSTRAINT IF EXISTS "AreaLayananEntry_reportId_fkey";
ALTER TABLE "AreaLayananEntry" ADD CONSTRAINT "AreaLayananEntry_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AreaIdleSeatEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "periodeLabel" TEXT,
    "areaWilayah" TEXT,
    "gedungName" TEXT,
    "layananName" TEXT,
    "luasM2" DECIMAL(12,2),
    "jumlahSeat" INTEGER,
    "lantai" TEXT,
    "notes" TEXT,
    "picName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AreaIdleSeatEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AreaIdleSeatEntry_reportId_idx" ON "AreaIdleSeatEntry"("reportId");
ALTER TABLE "AreaIdleSeatEntry" DROP CONSTRAINT IF EXISTS "AreaIdleSeatEntry_reportId_fkey";
ALTER TABLE "AreaIdleSeatEntry" ADD CONSTRAINT "AreaIdleSeatEntry_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AreaSdmEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "periodeLabel" TEXT,
    "areaWilayah" TEXT,
    "gedungName" TEXT,
    "jumlahSecurity" INTEGER NOT NULL DEFAULT 0,
    "jumlahDriver" INTEGER NOT NULL DEFAULT 0,
    "jumlahMe" INTEGER NOT NULL DEFAULT 0,
    "jumlahMailBoy" INTEGER NOT NULL DEFAULT 0,
    "jumlahCs" INTEGER NOT NULL DEFAULT 0,
    "totalTenaga" INTEGER,
    "notes" TEXT,
    "picName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AreaSdmEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AreaSdmEntry_reportId_idx" ON "AreaSdmEntry"("reportId");
ALTER TABLE "AreaSdmEntry" DROP CONSTRAINT IF EXISTS "AreaSdmEntry_reportId_fkey";
ALTER TABLE "AreaSdmEntry" ADD CONSTRAINT "AreaSdmEntry_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AreaMaintenanceEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "tglKerja" DATE,
    "gedungName" TEXT,
    "lantai" TEXT,
    "jenisKerusakan" TEXT,
    "dikerjakanFam" BOOLEAN NOT NULL DEFAULT false,
    "dikerjakanLayanan" BOOLEAN NOT NULL DEFAULT false,
    "dikerjakanBmGedung" BOOLEAN NOT NULL DEFAULT false,
    "dikerjakanVendor" BOOLEAN NOT NULL DEFAULT false,
    "tglSelesai" DATE,
    "material" TEXT,
    "jumlahMaterial" DECIMAL(10,2),
    "satuan" TEXT,
    "notes" TEXT,
    "picName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AreaMaintenanceEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AreaMaintenanceEntry_reportId_idx" ON "AreaMaintenanceEntry"("reportId");
CREATE INDEX IF NOT EXISTS "AreaMaintenanceEntry_tglKerja_idx" ON "AreaMaintenanceEntry"("tglKerja");
ALTER TABLE "AreaMaintenanceEntry" DROP CONSTRAINT IF EXISTS "AreaMaintenanceEntry_reportId_fkey";
ALTER TABLE "AreaMaintenanceEntry" ADD CONSTRAINT "AreaMaintenanceEntry_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AreaVehicleLogEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "tglLog" DATE,
    "gedungName" TEXT,
    "namaDriver" TEXT,
    "nopol" TEXT,
    "tujuan" TEXT,
    "dept" TEXT,
    "jamDatang" TEXT,
    "jamPergi" TEXT,
    "jamPulang" TEXT,
    "jamKerjaMenit" INTEGER,
    "durasiMenit" INTEGER,
    "kmAwal" INTEGER,
    "kmAkhir" INTEGER,
    "jarakKm" DECIMAL(10,2),
    "jenisBbm" TEXT,
    "literBbm" DECIMAL(10,2),
    "penumpang" TEXT,
    "notes" TEXT,
    "picName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AreaVehicleLogEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AreaVehicleLogEntry_reportId_idx" ON "AreaVehicleLogEntry"("reportId");
CREATE INDEX IF NOT EXISTS "AreaVehicleLogEntry_tglLog_idx" ON "AreaVehicleLogEntry"("tglLog");
ALTER TABLE "AreaVehicleLogEntry" DROP CONSTRAINT IF EXISTS "AreaVehicleLogEntry_reportId_fkey";
ALTER TABLE "AreaVehicleLogEntry" ADD CONSTRAINT "AreaVehicleLogEntry_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AreaMandatoryCostEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "periodeLabel" TEXT,
    "areaWilayah" TEXT,
    "gedungName" TEXT,
    "jenisBeban" TEXT,
    "jan" DECIMAL(18,2),
    "feb" DECIMAL(18,2),
    "mar" DECIMAL(18,2),
    "apr" DECIMAL(18,2),
    "may" DECIMAL(18,2),
    "jun" DECIMAL(18,2),
    "jul" DECIMAL(18,2),
    "aug" DECIMAL(18,2),
    "sep" DECIMAL(18,2),
    "oct" DECIMAL(18,2),
    "nov" DECIMAL(18,2),
    "dec" DECIMAL(18,2),
    "grandTotal" DECIMAL(18,2),
    "notes" TEXT,
    "picName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AreaMandatoryCostEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AreaMandatoryCostEntry_reportId_idx" ON "AreaMandatoryCostEntry"("reportId");
CREATE INDEX IF NOT EXISTS "AreaMandatoryCostEntry_gedungName_idx" ON "AreaMandatoryCostEntry"("gedungName");
ALTER TABLE "AreaMandatoryCostEntry" DROP CONSTRAINT IF EXISTS "AreaMandatoryCostEntry_reportId_fkey";
ALTER TABLE "AreaMandatoryCostEntry" ADD CONSTRAINT "AreaMandatoryCostEntry_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AreaWaterConsumptionEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "periodeLabel" TEXT,
    "areaWilayah" TEXT,
    "siteName" TEXT,
    "permintaanGalon" INTEGER,
    "realisasiGalon" INTEGER,
    "hargaSatuan" DECIMAL(12,2),
    "totalPerBulan" DECIMAL(18,2),
    "totalRealisasi" DECIMAL(18,2),
    "keterangan" TEXT,
    "notes" TEXT,
    "picName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AreaWaterConsumptionEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AreaWaterConsumptionEntry_reportId_idx" ON "AreaWaterConsumptionEntry"("reportId");
ALTER TABLE "AreaWaterConsumptionEntry" DROP CONSTRAINT IF EXISTS "AreaWaterConsumptionEntry_reportId_fkey";
ALTER TABLE "AreaWaterConsumptionEntry" ADD CONSTRAINT "AreaWaterConsumptionEntry_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
