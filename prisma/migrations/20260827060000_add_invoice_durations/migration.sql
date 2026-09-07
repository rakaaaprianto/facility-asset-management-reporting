-- Add agingDays, processDurationDays, paymentDurationDays to Invoice table
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "agingDays" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "processDurationDays" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentDurationDays" INTEGER;
