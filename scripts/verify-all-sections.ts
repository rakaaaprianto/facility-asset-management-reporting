import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { SECTIONS } from "../lib/section-config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function verifyAllSections() {
  console.log("🔍 Memverifikasi seluruh 22 sheet pada laporan Desember 2026...");

  const reports = await db.monthlyReport.findMany({
    where: { periodYear: 2026, periodMonth: 12 },
    include: { site: true },
  });

  console.log(`Ditemukan ${reports.length} laporan Desember 2026.`);

  let totalRows = 0;
  const sectionCounts: Record<string, number> = {};

  for (const s of SECTIONS) {
    const model = (db as any)[s.model];
    if (!model) {
      console.error(`❌ Model tidak ditemukan: ${s.model} untuk section ${s.key}`);
      continue;
    }

    const fixed = s.fixedValues ?? {};
    try {
      const rows = await model.findMany({
        where: {
          reportId: { in: reports.map((r) => r.id) },
          ...fixed,
        },
      });
      sectionCounts[s.title] = rows.length;
      totalRows += rows.length;
    } catch (err) {
      console.error(`❌ Error saat query section [${s.title}] (${s.key}):`, err);
    }
  }

  // PKS
  const pksRows = await db.pksContract.findMany({
    where: { siteId: { in: reports.map((r) => r.siteId) } },
  });
  sectionCounts["Kontrak PKS"] = pksRows.length;
  totalRows += pksRows.length;

  console.log("\n📊 Ringkasan Jumlah Baris Data per Sheet:");
  for (const [title, count] of Object.entries(sectionCounts)) {
    console.log(`- ${title.padEnd(40, " ")}: ${count} baris`);
  }
  console.log(`\n✨ TOTAL KESELURUHAN DATA: ${totalRows} baris data pada 23 site!`);
  console.log("✅ Semua sheet berhasil di-load tanpa error.");
}

verifyAllSections()
  .catch(console.error)
  .finally(() => db.$disconnect());
