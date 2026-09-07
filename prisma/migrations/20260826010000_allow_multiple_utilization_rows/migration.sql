DROP INDEX IF EXISTS "BuildingUtilization_reportId_buildingId_key";
ALTER TABLE "BuildingUtilization" ALTER COLUMN "buildingId" DROP NOT NULL;
