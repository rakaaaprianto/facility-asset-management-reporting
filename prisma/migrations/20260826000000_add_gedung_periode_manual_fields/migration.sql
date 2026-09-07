-- Migration: add gedungName and periodeLabel columns for manual input
-- Safe: only ADD COLUMN IF NOT EXISTS (no data loss)
-- Generated: 2026-08-26

ALTER TABLE "BuildingUtilization"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "ActiveServiceEntry"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "EmployeeCountEntry"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "MaintenanceWork"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "NearMissIncident"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "RoomBooking"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "SecurityHeadcount"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "UtilityUsage"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "GensetUsage"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "VehicleFuelUsage"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "MaterialReplacement"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "RkapProjectEntry"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "BudgetAbsorption"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "ChurnRisk"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "NewCapexProposal"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "InventoryVerification"
  ADD COLUMN IF NOT EXISTS "periodeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;

ALTER TABLE "PettyCashExpense"
  ADD COLUMN IF NOT EXISTS "gedungName"   TEXT;
