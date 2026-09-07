# TAHAP 1 — Analisis Project & Rekomendasi Arsitektur

> Infomedia Monthly Asset Management Reporting System
> Target skala: **500+ site, ribuan laporan/bulan** (enterprise, scalable)

---

## 1. Kondisi Saat Ini (Hasil Audit)

| Aspek | Status | Catatan |
|---|---|---|
| Framework | Next.js **16.3.2** App Router | ⚠️ Bukan 15 — Middleware sudah berganti nama menjadi **Proxy** (`proxy.ts`), params async, ada `refresh()`/`updateTag`, Cache Components (`use cache`) |
| React | 19.2.8 | Server Components + Server Actions stabil |
| TypeScript | 5.x strict | `@/*` → root project |
| Prisma | **7.9.1** | Generator `prisma-client` → output `app/generated/prisma`; `prisma.config.ts` sudah ada; driver adapter wajib di v7 |
| Database | PostgreSQL Neon | Siap pakai, `DATABASE_URL` di `.env` |
| Auth | next-auth **4.24.15** + bcrypt | Credentials provider; perlu penanganan khusus di App Router |
| UI | Tailwind CSS 4, lucide-react, recharts | Shadcn UI **belum ter-install** |
| Lainnya | exceljs + xlsx, react-hook-form, zod v4 | ExcelJS dipakai untuk export template-fidelity |
| Migrasi awal | `20260824065901_init` (User + Role enum) | Schema placeholder — akan didesain ulang |
| Branding | `public/logo/infomedia_logo.webp` | Dipakai di login, sidebar, export Excel header |

## 2. Folder Structure Enterprise (Rekomendasi)

```
infomedia-monthly-report/
├─ app/                          # Routing saja (App Router)
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  └─ layout.tsx              # Layout tanpa sidebar + logo branding
│  ├─ (app)/                     # Route group: semua halaman ber-auth
│  │  ├─ layout.tsx              # Sidebar + topbar (server component, baca session)
│  │  ├─ dashboard/page.tsx
│  │  ├─ monitoring/page.tsx     # Compliance matrix antar site
│  │  ├─ reports/
│  │  │  ├─ page.tsx             # Daftar laporan (scoped per role)
│  │  │  └─ [reportId]/
│  │  │     ├─ layout.tsx        # Tab navigasi antar section
│  │  │     ├─ pks/page.tsx      # 16 section sesuai sheet Excel
│  │  │     ├─ maintenance/page.tsx
│  │  │     └─ ...
│  │  ├─ master-data/
│  │  │  ├─ sites/page.tsx
│  │  │  ├─ buildings/page.tsx
│  │  │  ├─ services/page.tsx
│  │  │  └─ users/page.tsx       # Admin & Super Admin only
│  │  ├─ approvals/page.tsx      # Antrian review Admin/Super Admin
│  │  ├─ audit-logs/page.tsx     # Super Admin only
│  │  └─ settings/page.tsx
│  ├─ api/
│  │  ├─ auth/[...nextauth]/route.ts
│  │  ├─ reports/[reportId]/export/route.ts   # Streaming xlsx
│  │  └─ attachments/route.ts
│  ├─ actions/                   # "use server" — thin controller
│  │  ├─ report-actions.ts
│  │  ├─ master-data-actions.ts
│  │  └─ approval-actions.ts
│  ├─ generated/prisma/          # Prisma Client v7 (jangan diedit)
│  ├─ layout.tsx                 # Root layout + font + metadata
│  └─ globals.css
├─ proxy.ts                      # Pengganti middleware.ts di Next 16 (optimistic auth redirect)
├─ services/                     # SERVICE LAYER — seluruh business logic
│  ├─ reports/
│  │  ├─ report.service.ts       # Workflow submit/approve/revise
│  │  ├─ sections/*.service.ts   # CRUD per section (maintenance, listrik, ...)
│  │  └─ compliance.service.ts   # Monitoring matrix
│  ├─ master-data/{site,building,service,user}.service.ts
│  ├─ exports/excel-export.service.ts
│  └─ audit/audit.service.ts
├─ lib/
│  ├─ db.ts                      # PrismaClient singleton + Neon driver adapter
│  ├─ auth.ts                    # NextAuth options (JWT strategy)
│  ├─ session.ts                 # getServerSession helper + requireRole()
│  ├─ rbac.ts                    # Permission matrix + can(user, action, resource)
│  └─ utils.ts                   # cn(), formatters (Rupiah, tanggal)
├─ validations/                  # Zod schema — single source of truth
│  ├─ report-schemas.ts          # Per section, dipakai RHF + server action
│  └─ master-data-schemas.ts
├─ components/
│  ├─ ui/                        # Shadcn primitives (button, table, dialog, ...)
│  ├─ layouts/{sidebar,topbar}.tsx
│  ├─ features/                  # Komponen per domain (report-form, data-table, ...)
│  └─ charts/                    # Recharts wrappers
├─ hooks/                        # useReportForm, usePermission, ...
├─ types/                        # Tiped domain (ReportSectionKey, SessionUser, ...)
├─ config/
│  ├─ navigation.ts              # Menu config per role
│  └─ constants.ts               # Bulan, warna status, batas file upload
├─ prisma/{schema.prisma, migrations/, seed.ts}
├─ docs/                         # Dokumen desain ini
└─ tests/                        # Vitest (unit service) + Playwright (e2e kritis)
```

**Alasan keputusan utama**

1. **`app/` murni routing, logika di luar.** File konvensi Next (`page`, `route`, `layout`) hanya sebagai entry; business logic tidak boleh hidup di dalam route agar mudah dites dan dipindah.
2. **Route group `(auth)` vs `(app)`** memisahkan shell UI tanpa mengubah URL; dua layout root-level berbeda (login full-screen branded vs dashboard bersidebar).
3. **`services/` = service layer** (lihat §3) — Server Action tetap tipis: parse input → panggil service → return state.
4. **`validations/` terpusat**: satu schema Zod dipakai client (react-hook-form `zodResolver`) *dan* server (action) — menghilangkan duplikasi aturan.
5. **Prisma output ke `app/generated/prisma`** mengikuti setup yang sudah ada; ditambah `.gitignore` jika perlu.

## 3. Clean Architecture & Service Layer

```
Request (Server Action / Route Handler / Page RSC)
   │  1. AUTHENTICATION  : session valid? (lib/session.ts)
   │  2. AUTHORIZATION   : role + scope site (lib/rbac.ts)
   │  3. VALIDATION      : Zod parse (validations/)
   ▼
Service Layer (services/**)            ← SATU-SATUNYA tempat business rule
   │  - workflow report (submit/approve/lock)
   │  - perhitungan turunan (utilisasi %, sisa hari, aging, variance)
   │  - audit logging (transaksional dengan mutasi data)
   │  - revalidatePath/tag setelah mutasi
   ▼
Data Access (lib/db.ts + query helpers) ← hanya Prisma, tanpa if bisnis
   ▼
PostgreSQL (Neon)
```

Aturan keras:
- **Server Action/Route Handler tidak boleh memanggil `db` langsung** — wajib lewat service, supaya authorization & audit tidak bisa ter-lewat.
- **Kolom turunan TIDAK di-input user** (`Sisa Hari`, `Utilisasi %`, `Jumlah = Danru+Anggota`, `Total Biaya = harga×liter`, `Aging`, `Penyerapan %`). Dihitung di service saat read/export — sama seperti formula di Excel aslinya.
- **Audit trail transaksional**: setiap mutasi laporan dibungkus `$transaction` (tulis data + tulis `AuditLog` atomik).

## 4. Database Architecture

- **Neon + pooled connection**: gunakan connection string `-pooler` + Prisma 7 driver adapter (`@prisma/adapter-neon`) di singleton `lib/db.ts`; mencegah habisnya koneksi saat ribuan request.
- **UUID v7 PK** (`@default(uuid(7))`) — unik, time-sortable, index-friendly untuk volume besar.
- **Soft delete** hanya pada master data (`Site`, `Building`, `Service`, `Asset`, `User`) via `deletedAt`; transaction data immutable (pakai workflow status).
- **Immutability laporan approved**: setelah `APPROVED`, edit diblokir service; revisi = buka periode baru `NEEDS_REVISION`.
- **Partisi & retensi (siap scale)**: `AuditLog` diarsipkan bulanan (cron/instrumentation); index komposit pada `(reportId)`, `(siteId, periodYear, periodMonth)`, `(createdAt)`.
- **Migrasi**: `prisma migrate dev` di lokal → `migrate deploy` di CI/production; seed idempoten (`seed.ts`): Role, Permission, RefOption dari 00_MASTER.

## 5. Authentication Architecture

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Library | NextAuth v4 (Credentials + bcrypt) | Sudah ter-install; password hash `bcrypt` cost 12 |
| Session | **JWT** (cookie httpOnly, sameSite lax) | Tanpa lookup DB per request — penting untuk Neon serverless; klaim: id, name, role, siteIds |
| Enforce point | ① `proxy.ts` (optimistic redirect `/login`) ② **setiap** service/action cek ulang session ③ layout `(app)` guard | Proxy **bukan** mekanisme otorisasi (dok Next 16), hanya UX; keamanan di layer service |
| Password policy | Zod: min 8, huruf+angka+simbol; rate limit login (upstash/memory) | Standar enterprise dasar |
| Roadmap auth | SSO Telkom/OpenID saat naik skala | NextAuth v4 → Auth.js v5 migrasi mudah karena service layer terisolasi |

## 6. Authorization Architecture (RBAC + Site Scoping)

Dua dimensi:

1. **Role-based** (apa boleh dilakukan) — tabel `Role` + `Permission` + `RolePermission`:
   - `SUPER_ADMIN`: semua resource + kelola user/role/permission + audit log.
   - `ADMIN` (HQ Asset Management): approve/reject semua laporan, kelola master data, monitoring nasional, export gabungan.
   - `PIC`: buat/edit laporan site-nya sendiri, submit, upload attachment, lihat status review.
2. **Scope-based** (data mana yang terlihat) — `UserSiteAssignment` (N:M User↔Site). PIC hanya melihat baris milik situsnya; query service **selalu** menyuntik filter `siteId IN (...)` dari session, tidak dari parameter client.

Helper tunggal: `can(session, "monthly_report:approve")` + `assertSiteAccess(session, siteId)` — dipanggil di service sebelum query pertama.

---

Lanjutan: `02-excel-analysis.md`
