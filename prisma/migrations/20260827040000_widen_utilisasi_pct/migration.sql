-- Fix numeric overflow for utilitasPct and totalSeats/usedSeats/idleSeats
-- utilitasPct Decimal(5,2) -> Decimal(8,2): now supports up to 999999.99%
ALTER TABLE "BuildingUtilization" ALTER COLUMN "utilitasPct" TYPE DECIMAL(8,2);
