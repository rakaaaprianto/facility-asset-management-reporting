# TAHAP 6 — Implementation Roadmap (Phase 1–8)

> Estimasi per phase untuk 1–2 engineer fullstack. Setiap phase diakhiri: lint + typecheck + build hijau + migrasi teruji.

## Phase 1 — Project Setup (3–4 hari)

- **Tujuan**: fondasi teknis siap, standar kode terkunci.
- **Deliverables**: Shadcn UI init; `lib/db.ts` (Prisma + Neon adapter); env schema (`@t3-oss/env-nextjs` atau zod manual); ESLint/Prettier/strict TS; konvensi commit; baseline migration; seed Role+Permission+RefOption+Site awal.
- **File**: `lib/db.ts`, `lib/env.ts`, `prisma/seed.ts`, `components/ui/*`, `docs/*` (sudah), `.env.example`.
- **Risiko**: driver adapter Neon vs Node runtime (pilih runtime nodejs pada route DB); kredensial bocor → wajib `.env.example` tanpa nilai.
- **Best practice**: semua script via npm scripts; `prisma migrate dev` hanya lokal; CI menjalankan `migrate deploy` ke staging.

## Phase 2 — Authentication (4–5 hari)

- **Tujuan**: login aman + sesi + guard route.
- **Deliverables**: NextAuth credentials (bcrypt cost 12, JWT session); halaman login branded; `proxy.ts` redirect optimistis; helper `requireSession()`, `requireRole()`; rate limit login.
- **File**: `lib/auth.ts`, `lib/session.ts`, `proxy.ts`, `app/(auth)/login/page.tsx`, `app/api/auth/[...nextauth]/route.ts`, `app/actions/auth-actions.ts`.
- **Risiko**: next-auth v4 + Next 16 compatibility → uji sejak dini; fallback: upgrade Auth.js v5 (terisolasi karena service layer).
- **Best practice**: tidak ada password hash di klaim JWT; cookie httpOnly+secure; pesan error generik ("email/password salah").

## Phase 3 — Master Data (5–7 hari)

- **Tujuan**: Site/Building/Service/User/RefOption dikelola sistem (bukan free-text Excel).
- **Deliverables**: CRUD sites/buildings/services (+ soft delete), users + assignment site, ref-options; komponen DataTable reusable (server pagination); Zod schemas.
- **File**: `services/master-data/*.service.ts`, `validations/master-data-schemas.ts`, `app/(app)/master-data/**`, `app/actions/master-data-actions.ts`.
- **Risiko**: duplikasi nama site saat import data Excel lama → sediakan normalizer + mapping table di seed.
- **Best practice**: server-side validation ganda; optimistic UI + `revalidatePath`; audit setiap mutasi master.

## Phase 4 — Monthly Reporting (2–3 minggu) ⭐ core

- **Tujuan**: PIC mengisi 16 section, submit; Admin review/approve/request revision.
- **Deliverables**: workflow report (create draft periode, isi section grid, submit, revise, approve, lock); status log; attachments upload; monitoring matriks compliance; email/notif in-app ringan.
- **File**: `services/reports/report.service.ts`, `sections/*.service.ts`, `validations/report-schemas.ts`, `app/(app)/reports/**` + tab sections, `app/actions/report-actions.ts`, `approval-actions.ts`, `app/(app)/approvals/page.tsx`, `app/(app)/monitoring/page.tsx`.
- **Risiko**: volume input besar → autosave draft + optimistic update; race condition double submit → transaksi + unique `(siteId,year,month)`; laporan approved salah edit → lock di service layer.
- **Best practice**: satu Server Action per mutasi section; selalu scope query by session siteIds; computed fields hanya dari service; `$transaction` data+audit.

## Phase 5 — Excel Export (1 minggu)

- **Tujuan**: output XLSX identik template lama (paritas penuh).
- **Deliverables**: generator per sheet dengan ExcelJS: header logo+judul, kolom & urutan sama, dropdown validation tetap tertanam, formula asli untuk TOTAL & kolom turunan; export multi-site multi-sheet; streaming response.
- **File**: `services/exports/excel-export.service.ts`, `services/exports/sheets/*.ts` (1 file per sheet), `app/api/reports/[reportId]/export/route.ts`.
- **Risiko**: memori pada export nasional → stream buffer + batasi range bulan; perbedaan format tanggal/angka → snapshot style dari template.
- **Best practice**: golden-file test (bandingkan output vs `Master_Data_Monthly_Report.xlsx`); filename standar `MonthlyReport_<SITE>_<YYYY-MM>.xlsx`.

## Phase 6 — Dashboard Analytics (1 minggu)

- **Tujuan**: insight nasional untuk Admin/Super Admin.
- **Deliverables**: KPI cards (compliance %, utilisasi seat/luas, invoice aging, PKS expiring ≤30 hari), grafik trend Recharts, drill-down ke laporan; caching `use cache`/`cacheTag` untuk agregat berat.
- **File**: `services/analytics/*.service.ts`, `components/charts/*`, `app/(app)/dashboard/page.tsx`.
- **Risiko**: query agregat lambat pada ribuan baris → view materialized / pre-aggregation harian.
- **Best practice**: agregat di SQL (groupBy), bukan JS; index mendukung (sudah dirancang); cache invalidation via tag saat report approved.

## Phase 7 — Audit Log & Hardening (3–4 hari)

- **Tujuan**: akuntabilitas penuh + pengerasan keamanan.
- **Deliverables**: audit service transaksional menyala di semua service; halaman audit logs (filter aktor/entitas/tanggal, pagination); retensi/arsip bulanan; security headers; rate limit global; review OWASP top 10.
- **File**: `services/audit/audit.service.ts`, `app/(app)/audit-logs/page.tsx`, `instrumentation.ts`, middleware headers di `next.config.ts`.
- **Risiko**: audit membuat transaksi lambat → tulis async post-commit (outbox sederhana) bila terasa; JSONB diff besar → simpan field yang berubah saja.
- **Best practice**: audit read-only (tanpa delete UI); PII tidak masuk log mentah.

## Phase 8 — Production Deployment (3–5 hari)

- **Tujuan**: rilis stabil, termonitoring, bisa rollback.
- **Deliverables**: pipeline CI/CD (lint→typecheck→test→build→migrate deploy→deploy), environment Neon branch (dev/staging/prod), health check `/api/health`, error tracking (Sentry), uptime monitor, backup strategy Neon PITR, runbook on-call, seeding produksi + import data historis Excel.
- **File**: `.github/workflows/ci.yml`, `Dockerfile`/platform config, `app/api/health/route.ts`, `scripts/import-excel-history.ts`.
- **Risiko**: migrasi destruktif di prod → wajib dry-run di staging + backup point-in-time; beban awal import → batch insert chunked.
- **Best practice**: feature flag untuk rollout bertahap per region; jadwal reminder submission (cron) tgl 1 & eskalasi tgl 5.

---

### Definition of Done Global
- Typecheck + lint bersih, build sukses
- Migrasi reversibel; seed idempoten
- Service layer teruji (Vitest) untuk workflow & computed fields
- Export lolos golden-file comparison
- Audit trail lengkap pada semua mutasi
