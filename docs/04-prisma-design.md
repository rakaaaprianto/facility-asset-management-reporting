# TAHAP 4 — Desain Prisma (Implementasi)

> Implementasi penuh ada di `prisma/schema.prisma` (**valid** terhadap Prisma 7.9.1). Dokumen ini menjelaskan keputusan.

## 1. Ringkasan

| Aspek | Keputusan |
|---|---|
| Generator | `prisma-client` → output `app/generated/prisma` (Prisma 7, typed client) |
| Datasource | `postgresql` (Neon); URL via `prisma.config.ts` → `DATABASE_URL` |
| ID | `String @id @default(uuid(7))` — UUID v7: unik + sortable waktu (index B-tree ramah insert volume besar) |
| Timestamp | `createdAt @default(now())` + `updatedAt @updatedAt` di semua tabel |
| Uang | `Decimal @db.Decimal(18, 2)`; rasio `Decimal(5..12, n)` |
| Enum | 13 enum PostgreSQL untuk nilai yang menggerakkan logika/workflow |
| Referensi dinamis | Model `RefOption` (padanan sheet `00_MASTER`) — admin bisa tambah opsi tanpa migrasi |
| Soft delete | `deletedAt?` hanya di master (`User`, `Site`, `Building`, `Service`, `Asset`, `PksContract`) |
| Cascade | Section laporan → `onDelete: Cascade` dari `MonthlyReport`; FK opsional → `SetNull`/nullable tanpa cascade |

## 2. Model Workflow

```
DRAFT ──submit──▶ SUBMITTED ──approve──▶ APPROVED (locked)
   ▲                   │
   └── NEEDS_REVISION ◀┘── request revision
```

- Satu baris `MonthlyReport` per `(siteId, periodYear, periodMonth)` — `@@unique`.
- Setiap perubahan status tercatat di `ReportStatusLog` (+ aktor + catatan).
- Saat `APPROVED`: service memblokir mutasi section (`lockedAt`).

## 3. Pemetaan Sheet Excel → Model

| Sheet | Model | Catatan |
|---|---|---|
| 00_MASTER | `RefOption` | seed idempoten |
| 01_PKS | `PksContract` | sisa hari/status = computed |
| 02_RKAP_PROJECT | `RkapProjectEntry` | |
| 03_MAINTENANCE | `MaintenanceWork` | kategori via RefOption |
| 04_NEAR MISS_INCIDENT | `NearMissIncident` | severity enum |
| 05+08 LISTRIK/PDAM | `UtilityUsage` | satu tabel, `type` enum |
| 06_SOLAR_GENSET | `GensetUsage` | total biaya = computed |
| 07_BBM_KENDARAAN | `VehicleFuelUsage` | |
| 09_MATERIAL_REPLACEMENT | `MaterialReplacement` | unit enum |
| 10_UTILISASI_GEDUNG | `BuildingUtilization` | % = computed; unik per building/report |
| 11_BOOKING | `RoomBooking` | ruangan snapshot + optional Room FK |
| 12_CHURN | `ChurnRisk` | |
| 13_KEAMANAN_KEBERSIHAN | `SecurityHeadcount` | jumlah = computed; unik per aspect/report |
| 14_LAYANAN_AKTIF | `ActiveServiceEntry` + master `Service` | nama disimpan snapshot agar export identik |
| 15_JUMLAH KARYAWAN | `EmployeeCountEntry` | |
| 16–18 INVOICE | `Invoice` | satu lifecycle, status enum; export memfilter jadi 3 sheet |
| 19_INCIDENT_PETTY_CASH | `PettyCashExpense` | |
| 20_PENYERAPAN_RKAP_CAPEX_OPEX | `BudgetAbsorption` | sisa/%/variance = computed |
| 21_AB / 23_MUTASI_CAPEX | `Asset`, `AssetAcquisition`, `AssetMutation` | asset tag unik |
| 22_NEW_CAPEX | `NewCapexProposal` | |
| 24_INVENTORY | `InventoryVerification` | progress = computed |

## 4. Index Strategi (sudah ditulis di schema)

1. **Semua kolom FK ber-index** (Prisma tidak membuat otomatis).
2. Komposit: `@@unique(siteId, periodYear, periodMonth)`, `(reportId, buildingId)`, `(reportId, aspect)`, `(invoiceNo, siteId)`.
3. Pencarian & dashboard: `MonthlyReport(status)`, `(periodYear, periodMonth)`, `PksContract(endDate)` (alert jatuh tempo), `Invoice(dueDate)`.
4. Audit: `AuditLog(createdAt DESC)` untuk halaman log + retensi arsip.

## 5. Langkah Migrasi (penting)

Migrasi lama `20260824065901_init` hanya berisi placeholder User. Karena database belum produksi:

```bash
# opsi A (disarankan): reset lokal/dev
npx prisma migrate reset
npx prisma migrate dev --name enterprise_baseline

# opsi B: produksi pertama kali
npx prisma migrate deploy
npx prisma db seed   # seed.ts: Role, Permission matrix, RefOption (00_MASTER), Site dari data Excel
```

## 6. Runtime Client (lib/db.ts)

```ts
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
export const db = new PrismaClient({ adapter });   // singleton global di dev
```

Gunakan connection string **pooled** (`-pooler`) Neon untuk runtime, dan **direct** untuk `migrate`.
