-- Add areaWilayah and serviceType to Invoice table
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "areaWilayah" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "serviceType" TEXT;
