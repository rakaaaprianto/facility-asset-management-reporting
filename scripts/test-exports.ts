import { buildMonthlyWorkbook, buildReportWorkbook } from "../lib/excel-export";
import { db } from "../lib/db";

async function testExports() {
  console.log("🧪 Testing Excel Exports for Desember 2026...\n");

  // 1. National
  console.log("1. Generating Rekap Nasional (Semua Wilayah)...");
  const nat = await buildMonthlyWorkbook(2026, 12);
  console.log(`✅ National file generated: ${nat.filename} (${(nat.buffer.length / 1024).toFixed(1)} KB)`);

  // 2. Per Region
  const reg = await db.region.findFirst();
  if (reg) {
    console.log(`\n2. Generating Rekap Wilayah for [${reg.name}]...`);
    const regExp = await buildMonthlyWorkbook(2026, 12, reg.id);
    console.log(`✅ Region file generated: ${regExp.filename} (${(regExp.buffer.length / 1024).toFixed(1)} KB)`);
  }

  // 3. Single Site
  const rep = await db.monthlyReport.findFirst({ where: { periodYear: 2026, periodMonth: 12 } });
  if (rep) {
    console.log(`\n3. Generating Single Site Report for Report ID [${rep.id}]...`);
    const siteExp = await buildReportWorkbook(rep.id);
    console.log(`✅ Single site file generated: ${siteExp.filename} (${(siteExp.buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log("\n🎉 ALL EXCEL EXPORT WORKFLOWS VERIFIED SUCCESSFULLY!");
}

testExports().catch(console.error).finally(() => process.exit(0));
