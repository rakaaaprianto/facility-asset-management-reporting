-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PIC');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_REVISION', 'APPROVED');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ProbabilityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('PROJECT', 'RKAP', 'CAPEX', 'OPEX');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('ELECTRICITY', 'WATER');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('UNIT', 'BUAH', 'LITER', 'M3', 'KWH', 'SET', 'ORANG');

-- CreateEnum
CREATE TYPE "FacilityAspect" AS ENUM ('SECURITY', 'CLEANING', 'ME');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKING', 'DEAL', 'USED', 'ON_PROGRESS');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'IN_PROCESS', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'IDLE', 'MUTATED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "MutationStatus" AS ENUM ('DRAFT', 'APPROVED', 'EXECUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CapexStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'PROCUREMENT', 'DONE');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "employeeTitle" TEXT,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSiteAssignment" (
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSiteAssignment_pkey" PRIMARY KEY ("userId","siteId")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "address" TEXT,
    "primaryPicId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floorCount" INTEGER,
    "totalAreaM2" DECIMAL(12,2),
    "totalSeats" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floorLabel" TEXT,
    "areaM2" DECIMAL(10,2),
    "seatCapacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "value" DECIMAL(18,2),
    "source" TEXT,
    "acquiredAt" DATE,
    "acquisitionReportId" TEXT,
    "currentSiteId" TEXT,
    "currentLocation" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMutation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "mutationDate" DATE NOT NULL,
    "fromSiteId" TEXT,
    "fromLocation" TEXT,
    "toSiteId" TEXT,
    "toLocation" TEXT,
    "valueAtMutation" DECIMAL(18,2),
    "reason" TEXT NOT NULL,
    "effectiveDate" DATE,
    "status" "MutationStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMutation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefOption" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportStatusLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fromStatus" "ReportStatus",
    "toStatus" "ReportStatus" NOT NULL,
    "actedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "section" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PksContract" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "buildingId" TEXT,
    "contractNo" TEXT,
    "jenisPks" TEXT,
    "startDate" DATE,
    "endDate" DATE NOT NULL,
    "notes" TEXT,
    "picUserId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PksContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingUtilization" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "totalAreaM2" DECIMAL(12,2),
    "usedAreaM2" DECIMAL(12,2),
    "idleAreaM2" DECIMAL(12,2),
    "totalSeats" INTEGER,
    "usedSeats" INTEGER,
    "idleSeats" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingUtilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RkapProjectEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jenis" "BudgetType" NOT NULL,
    "targetDesc" TEXT,
    "progressPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "dueDate" DATE,
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RkapProjectEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWork" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "areaName" TEXT NOT NULL,
    "workCategory" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "plannedDate" DATE,
    "vendorName" TEXT,
    "estimatedCost" DECIMAL(18,2),
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NearMissIncident" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "occurredAt" DATE,
    "locationDesc" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "severity" "SeverityLevel",
    "initialAction" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "targetResolutionDate" DATE,
    "closedAt" DATE,
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NearMissIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityUsage" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" "UtilityType" NOT NULL,
    "meterNo" TEXT,
    "usageValue" DECIMAL(14,2) NOT NULL,
    "billAmount" DECIMAL(18,2),
    "meterPrev" DECIMAL(14,2),
    "meterCurr" DECIMAL(14,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GensetUsage" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "gensetCode" TEXT,
    "usageLiters" DECIMAL(12,2) NOT NULL,
    "operatingHours" DECIMAL(10,2),
    "refillQty" DECIMAL(12,2),
    "pricePerLiter" DECIMAL(14,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GensetUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleFuelUsage" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "plateNo" TEXT NOT NULL,
    "vehicleType" TEXT,
    "fuelType" TEXT,
    "liters" DECIMAL(12,2) NOT NULL,
    "odometerStart" INTEGER,
    "odometerEnd" INTEGER,
    "distanceKm" DECIMAL(12,2),
    "cost" DECIMAL(18,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleFuelUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialReplacement" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "replacedAt" DATE NOT NULL,
    "areaName" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "specification" TEXT,
    "qty" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "unit" "UnitOfMeasure" NOT NULL DEFAULT 'BUAH',
    "oldCondition" TEXT,
    "reason" TEXT,
    "estimatedCost" DECIMAL(18,2),
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialReplacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomBooking" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "bookingDate" DATE,
    "roomId" TEXT,
    "roomLabel" TEXT NOT NULL,
    "floorLabel" TEXT,
    "areaM2" DECIMAL(10,2),
    "seats" INTEGER,
    "bookerName" TEXT NOT NULL,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'BOOKING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurnRisk" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "serviceName" TEXT,
    "potentialDesc" TEXT,
    "indication" TEXT,
    "impact" TEXT,
    "probability" "ProbabilityLevel",
    "actionPlan" TEXT,
    "targetFollowUpDate" DATE,
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurnRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityHeadcount" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "aspect" "FacilityAspect" NOT NULL,
    "supervisorCount" INTEGER NOT NULL DEFAULT 0,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityHeadcount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveServiceEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "areaM2" DECIMAL(12,2),
    "totalSeats" INTEGER,
    "usedSeats" INTEGER,
    "idleSeats" INTEGER,
    "staffCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveServiceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCountEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "activeCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeCountEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "serviceId" TEXT,
    "reportId" TEXT,
    "invoicePeriod" TEXT,
    "invoiceDate" DATE,
    "receivedAt" DATE,
    "processedAt" DATE,
    "dueDate" DATE,
    "paidAt" DATE,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "issueNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashExpense" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "spentAt" DATE NOT NULL,
    "transactionNo" TEXT,
    "expenseType" "BudgetType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "budgetAmount" DECIMAL(18,2),
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAbsorption" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "jenis" "BudgetType" NOT NULL,
    "categoryName" TEXT,
    "rkapBudget" DECIMAL(18,2) NOT NULL,
    "realization" DECIMAL(18,2),
    "targetAbsorptionPct" DECIMAL(5,2),
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAbsorption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAcquisition" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "acquiredValue" DECIMAL(18,2),
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetAcquisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewCapexProposal" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "proposalYear" INTEGER NOT NULL,
    "capexName" TEXT NOT NULL,
    "category" TEXT,
    "justification" TEXT,
    "qty" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "estimatedValue" DECIMAL(18,2),
    "rkapBudget" DECIMAL(18,2),
    "vendorName" TEXT,
    "procurementTargetDate" DATE,
    "status" "CapexStatus" NOT NULL DEFAULT 'PROPOSED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewCapexProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryVerification" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "scopeLabel" TEXT,
    "serviceId" TEXT,
    "serviceName" TEXT,
    "totalAssets" INTEGER,
    "checkedAssets" INTEGER NOT NULL DEFAULT 0,
    "matchedAssets" INTEGER,
    "unmatchedAssets" INTEGER,
    "findings" TEXT,
    "checkedAt" DATE,
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "UserSiteAssignment_siteId_idx" ON "UserSiteAssignment"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Site_name_key" ON "Site"("name");

-- CreateIndex
CREATE INDEX "Site_primaryPicId_idx" ON "Site"("primaryPicId");

-- CreateIndex
CREATE INDEX "Site_isActive_idx" ON "Site"("isActive");

-- CreateIndex
CREATE INDEX "Building_siteId_idx" ON "Building"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Building_siteId_name_key" ON "Building"("siteId", "name");

-- CreateIndex
CREATE INDEX "Room_buildingId_idx" ON "Room"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_buildingId_name_key" ON "Room"("buildingId", "name");

-- CreateIndex
CREATE INDEX "Service_siteId_idx" ON "Service"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_siteId_name_key" ON "Service"("siteId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");

-- CreateIndex
CREATE INDEX "Asset_currentSiteId_idx" ON "Asset"("currentSiteId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_acquisitionReportId_idx" ON "Asset"("acquisitionReportId");

-- CreateIndex
CREATE INDEX "AssetMutation_assetId_idx" ON "AssetMutation"("assetId");

-- CreateIndex
CREATE INDEX "AssetMutation_fromSiteId_idx" ON "AssetMutation"("fromSiteId");

-- CreateIndex
CREATE INDEX "AssetMutation_toSiteId_idx" ON "AssetMutation"("toSiteId");

-- CreateIndex
CREATE INDEX "RefOption_category_isActive_idx" ON "RefOption"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RefOption_category_value_key" ON "RefOption"("category", "value");

-- CreateIndex
CREATE INDEX "MonthlyReport_status_idx" ON "MonthlyReport"("status");

-- CreateIndex
CREATE INDEX "MonthlyReport_periodYear_periodMonth_idx" ON "MonthlyReport"("periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "MonthlyReport_submittedById_idx" ON "MonthlyReport"("submittedById");

-- CreateIndex
CREATE INDEX "MonthlyReport_reviewedById_idx" ON "MonthlyReport"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_siteId_periodYear_periodMonth_key" ON "MonthlyReport"("siteId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "ReportStatusLog_reportId_createdAt_idx" ON "ReportStatusLog"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportStatusLog_actedById_idx" ON "ReportStatusLog"("actedById");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storageKey_key" ON "Attachment"("storageKey");

-- CreateIndex
CREATE INDEX "Attachment_reportId_idx" ON "Attachment"("reportId");

-- CreateIndex
CREATE INDEX "PksContract_siteId_idx" ON "PksContract"("siteId");

-- CreateIndex
CREATE INDEX "PksContract_buildingId_idx" ON "PksContract"("buildingId");

-- CreateIndex
CREATE INDEX "PksContract_endDate_idx" ON "PksContract"("endDate");

-- CreateIndex
CREATE INDEX "BuildingUtilization_buildingId_idx" ON "BuildingUtilization"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingUtilization_reportId_buildingId_key" ON "BuildingUtilization"("reportId", "buildingId");

-- CreateIndex
CREATE INDEX "RkapProjectEntry_reportId_idx" ON "RkapProjectEntry"("reportId");

-- CreateIndex
CREATE INDEX "RkapProjectEntry_dueDate_idx" ON "RkapProjectEntry"("dueDate");

-- CreateIndex
CREATE INDEX "MaintenanceWork_reportId_idx" ON "MaintenanceWork"("reportId");

-- CreateIndex
CREATE INDEX "MaintenanceWork_workCategory_idx" ON "MaintenanceWork"("workCategory");

-- CreateIndex
CREATE INDEX "MaintenanceWork_status_idx" ON "MaintenanceWork"("status");

-- CreateIndex
CREATE INDEX "NearMissIncident_reportId_idx" ON "NearMissIncident"("reportId");

-- CreateIndex
CREATE INDEX "NearMissIncident_severity_idx" ON "NearMissIncident"("severity");

-- CreateIndex
CREATE INDEX "NearMissIncident_status_idx" ON "NearMissIncident"("status");

-- CreateIndex
CREATE INDEX "UtilityUsage_reportId_idx" ON "UtilityUsage"("reportId");

-- CreateIndex
CREATE INDEX "UtilityUsage_type_idx" ON "UtilityUsage"("type");

-- CreateIndex
CREATE INDEX "GensetUsage_reportId_idx" ON "GensetUsage"("reportId");

-- CreateIndex
CREATE INDEX "VehicleFuelUsage_reportId_idx" ON "VehicleFuelUsage"("reportId");

-- CreateIndex
CREATE INDEX "MaterialReplacement_reportId_idx" ON "MaterialReplacement"("reportId");

-- CreateIndex
CREATE INDEX "MaterialReplacement_materialName_idx" ON "MaterialReplacement"("materialName");

-- CreateIndex
CREATE INDEX "RoomBooking_reportId_idx" ON "RoomBooking"("reportId");

-- CreateIndex
CREATE INDEX "RoomBooking_roomId_idx" ON "RoomBooking"("roomId");

-- CreateIndex
CREATE INDEX "RoomBooking_bookingStatus_idx" ON "RoomBooking"("bookingStatus");

-- CreateIndex
CREATE INDEX "ChurnRisk_reportId_idx" ON "ChurnRisk"("reportId");

-- CreateIndex
CREATE INDEX "ChurnRisk_probability_idx" ON "ChurnRisk"("probability");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityHeadcount_reportId_aspect_key" ON "SecurityHeadcount"("reportId", "aspect");

-- CreateIndex
CREATE INDEX "ActiveServiceEntry_reportId_idx" ON "ActiveServiceEntry"("reportId");

-- CreateIndex
CREATE INDEX "ActiveServiceEntry_serviceId_idx" ON "ActiveServiceEntry"("serviceId");

-- CreateIndex
CREATE INDEX "EmployeeCountEntry_reportId_idx" ON "EmployeeCountEntry"("reportId");

-- CreateIndex
CREATE INDEX "Invoice_siteId_idx" ON "Invoice"("siteId");

-- CreateIndex
CREATE INDEX "Invoice_serviceId_idx" ON "Invoice"("serviceId");

-- CreateIndex
CREATE INDEX "Invoice_reportId_idx" ON "Invoice"("reportId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_siteId_key" ON "Invoice"("invoiceNo", "siteId");

-- CreateIndex
CREATE INDEX "PettyCashExpense_reportId_idx" ON "PettyCashExpense"("reportId");

-- CreateIndex
CREATE INDEX "BudgetAbsorption_reportId_idx" ON "BudgetAbsorption"("reportId");

-- CreateIndex
CREATE INDEX "BudgetAbsorption_jenis_idx" ON "BudgetAbsorption"("jenis");

-- CreateIndex
CREATE INDEX "AssetAcquisition_assetId_idx" ON "AssetAcquisition"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetAcquisition_reportId_assetId_key" ON "AssetAcquisition"("reportId", "assetId");

-- CreateIndex
CREATE INDEX "NewCapexProposal_reportId_idx" ON "NewCapexProposal"("reportId");

-- CreateIndex
CREATE INDEX "NewCapexProposal_status_idx" ON "NewCapexProposal"("status");

-- CreateIndex
CREATE INDEX "InventoryVerification_reportId_idx" ON "InventoryVerification"("reportId");

-- CreateIndex
CREATE INDEX "InventoryVerification_serviceId_idx" ON "InventoryVerification"("serviceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSiteAssignment" ADD CONSTRAINT "UserSiteAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSiteAssignment" ADD CONSTRAINT "UserSiteAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_primaryPicId_fkey" FOREIGN KEY ("primaryPicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_acquisitionReportId_fkey" FOREIGN KEY ("acquisitionReportId") REFERENCES "MonthlyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_currentSiteId_fkey" FOREIGN KEY ("currentSiteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMutation" ADD CONSTRAINT "AssetMutation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMutation" ADD CONSTRAINT "AssetMutation_fromSiteId_fkey" FOREIGN KEY ("fromSiteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMutation" ADD CONSTRAINT "AssetMutation_toSiteId_fkey" FOREIGN KEY ("toSiteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportStatusLog" ADD CONSTRAINT "ReportStatusLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportStatusLog" ADD CONSTRAINT "ReportStatusLog_actedById_fkey" FOREIGN KEY ("actedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PksContract" ADD CONSTRAINT "PksContract_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PksContract" ADD CONSTRAINT "PksContract_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PksContract" ADD CONSTRAINT "PksContract_picUserId_fkey" FOREIGN KEY ("picUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingUtilization" ADD CONSTRAINT "BuildingUtilization_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingUtilization" ADD CONSTRAINT "BuildingUtilization_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RkapProjectEntry" ADD CONSTRAINT "RkapProjectEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWork" ADD CONSTRAINT "MaintenanceWork_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearMissIncident" ADD CONSTRAINT "NearMissIncident_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityUsage" ADD CONSTRAINT "UtilityUsage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GensetUsage" ADD CONSTRAINT "GensetUsage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleFuelUsage" ADD CONSTRAINT "VehicleFuelUsage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReplacement" ADD CONSTRAINT "MaterialReplacement_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurnRisk" ADD CONSTRAINT "ChurnRisk_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityHeadcount" ADD CONSTRAINT "SecurityHeadcount_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveServiceEntry" ADD CONSTRAINT "ActiveServiceEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveServiceEntry" ADD CONSTRAINT "ActiveServiceEntry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCountEntry" ADD CONSTRAINT "EmployeeCountEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashExpense" ADD CONSTRAINT "PettyCashExpense_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAbsorption" ADD CONSTRAINT "BudgetAbsorption_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAcquisition" ADD CONSTRAINT "AssetAcquisition_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAcquisition" ADD CONSTRAINT "AssetAcquisition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewCapexProposal" ADD CONSTRAINT "NewCapexProposal_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryVerification" ADD CONSTRAINT "InventoryVerification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryVerification" ADD CONSTRAINT "InventoryVerification_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
