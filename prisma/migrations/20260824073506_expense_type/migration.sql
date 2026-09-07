/*
  Warnings:

  - Changed the type of `expenseType` on the `PettyCashExpense` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('CASH_ADVANCE', 'REIMBURSE');

-- AlterTable
ALTER TABLE "PettyCashExpense" DROP COLUMN "expenseType",
ADD COLUMN     "expenseType" "ExpenseType" NOT NULL;
