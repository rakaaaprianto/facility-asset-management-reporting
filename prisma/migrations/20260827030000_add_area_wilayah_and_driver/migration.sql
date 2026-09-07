-- Migration: Add areaWilayah to all section tables + DRIVER to FacilityAspect enum
-- Date: 2026-08-27

-- 1. Add DRIVER to FacilityAspect enum
ALTER TYPE "FacilityAspect" ADD VALUE IF NOT EXISTS 'DRIVER';

-- 2. Add areaWilayah to all section tables
ALTER TABLE "BuildingUtilization" ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "RkapProjectEntry"    ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "MaintenanceWork"     ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "NearMissIncident"    ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "UtilityUsage"        ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "GensetUsage"         ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "VehicleFuelUsage"    ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "MaterialReplacement" ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "RoomBooking"         ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "ChurnRisk"           ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "SecurityHeadcount"   ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "ActiveServiceEntry"  ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "EmployeeCountEntry"  ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "PettyCashExpense"    ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "BudgetAbsorption"    ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "NewCapexProposal"    ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "InventoryVerification" ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
