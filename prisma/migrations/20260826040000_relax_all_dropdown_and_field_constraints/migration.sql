-- Relax constraints on table columns so users/PICs can leave dropdowns and fields blank/empty without getting blocked
ALTER TABLE "MaintenanceWork" ALTER COLUMN "workCategory" DROP NOT NULL;
ALTER TABLE "MaintenanceWork" ALTER COLUMN "areaName" DROP NOT NULL;
ALTER TABLE "MaintenanceWork" ALTER COLUMN "detail" DROP NOT NULL;
ALTER TABLE "MaintenanceWork" ALTER COLUMN "workDate" DROP NOT NULL;
ALTER TABLE "MaintenanceWork" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "RkapProjectEntry" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "RkapProjectEntry" ALTER COLUMN "jenis" DROP NOT NULL;
ALTER TABLE "RkapProjectEntry" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "PettyCashExpense" ALTER COLUMN "expenseType" DROP NOT NULL;
ALTER TABLE "PettyCashExpense" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "PettyCashExpense" ALTER COLUMN "amount" DROP NOT NULL;
ALTER TABLE "PettyCashExpense" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "BudgetAbsorption" ALTER COLUMN "jenis" DROP NOT NULL;
ALTER TABLE "BudgetAbsorption" ALTER COLUMN "rkapBudget" DROP NOT NULL;
ALTER TABLE "BudgetAbsorption" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "MaterialReplacement" ALTER COLUMN "unit" DROP NOT NULL;
ALTER TABLE "MaterialReplacement" ALTER COLUMN "materialName" DROP NOT NULL;
ALTER TABLE "MaterialReplacement" ALTER COLUMN "areaName" DROP NOT NULL;
ALTER TABLE "MaterialReplacement" ALTER COLUMN "replacedAt" DROP NOT NULL;
ALTER TABLE "MaterialReplacement" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "ActiveServiceEntry" ALTER COLUMN "serviceName" DROP NOT NULL;
ALTER TABLE "EmployeeCountEntry" ALTER COLUMN "unitName" DROP NOT NULL;

ALTER TABLE "NearMissIncident" ALTER COLUMN "locationDesc" DROP NOT NULL;
ALTER TABLE "NearMissIncident" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "NearMissIncident" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "ChurnRisk" ALTER COLUMN "customerName" DROP NOT NULL;
ALTER TABLE "ChurnRisk" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "NewCapexProposal" ALTER COLUMN "capexName" DROP NOT NULL;
ALTER TABLE "NewCapexProposal" ALTER COLUMN "proposalYear" DROP NOT NULL;
ALTER TABLE "NewCapexProposal" ALTER COLUMN "status" DROP NOT NULL;
