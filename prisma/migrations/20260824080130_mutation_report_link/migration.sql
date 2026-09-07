-- AlterTable
ALTER TABLE "AssetMutation" ADD COLUMN     "reportId" TEXT;

-- CreateIndex
CREATE INDEX "AssetMutation_reportId_idx" ON "AssetMutation"("reportId");

-- AddForeignKey
ALTER TABLE "AssetMutation" ADD CONSTRAINT "AssetMutation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
