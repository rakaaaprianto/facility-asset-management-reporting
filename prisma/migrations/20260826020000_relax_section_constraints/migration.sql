-- Relax constraints on SecurityHeadcount, RoomBooking, AssetMutation
DROP INDEX IF EXISTS "SecurityHeadcount_reportId_aspect_key";
ALTER TABLE "SecurityHeadcount" ALTER COLUMN "aspect" DROP NOT NULL;

ALTER TABLE "RoomBooking" ALTER COLUMN "roomLabel" DROP NOT NULL;
ALTER TABLE "RoomBooking" ALTER COLUMN "bookerName" DROP NOT NULL;
ALTER TABLE "RoomBooking" ALTER COLUMN "bookingStatus" DROP NOT NULL;

ALTER TABLE "AssetMutation" ALTER COLUMN "assetId" DROP NOT NULL;
ALTER TABLE "AssetMutation" ALTER COLUMN "mutationDate" DROP NOT NULL;
ALTER TABLE "AssetMutation" ALTER COLUMN "reason" DROP NOT NULL;
ALTER TABLE "AssetMutation" ALTER COLUMN "status" DROP NOT NULL;
ALTER TABLE "AssetMutation" ADD COLUMN IF NOT EXISTS "assetTagInput" TEXT;
