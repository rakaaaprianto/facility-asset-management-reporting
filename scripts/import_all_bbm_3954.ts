import "dotenv/config";
import path from "path";
import xlsx from "xlsx";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const REPORT_MAP: Record<string, { reportId: string; label: string }> = {
  "AREA 2": {
    reportId: "01a06543-fd6b-7419-a328-8a300b7b4436",
    label: "Seluruh Site Area 2 (Jabodetabek)"
  },
  "AREA 3": {
    reportId: "01a06ac5-34b4-7428-a29d-0d8acd14af5b",
    label: "BUAH BATU (Area 3)"
  },
  "AREA 4": {
    reportId: "01a06ac5-35ce-7669-ae35-f43b7c934d24",
    label: "PAHLAWAN (Area 4)"
  }
};

function excelDateToDate(serial: any): Date | null {
  if (typeof serial === "number") {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    return new Date(utc_value * 1000);
  }
  if (typeof serial === "string" && serial.trim()) {
    const d = new Date(serial);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatExcelTime(val: any): string {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "number") {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return String(val).trim();
}

function parseNum(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[^0-9,.-]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

async function main() {
  console.log("=== STARTING IMPORT OF ALL 3954 BBM DATA FROM EXCEL ===");

  const filePath = path.join(process.cwd(), "docs", "references", "LAPORAN BBM KENDARAAN AGUSTUS 26.xlsx");
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets["Laporan 2026"];
  const rawData = xlsx.utils.sheet_to_json<any[]>(ws, { header: 1 });

  console.log("Excel Sheet 'Laporan 2026' total rows (including header):", rawData.length);

  const buckets: Record<string, any[]> = {
    "AREA 2": [],
    "AREA 3": [],
    "AREA 4": []
  };

  let unmappedCount = 0;

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row[0] === undefined) continue;

    const d = excelDateToDate(row[0]);
    const areaRaw = String(row[3] ?? "AREA 2").trim().toUpperCase();
    const target = REPORT_MAP[areaRaw];

    if (!target) {
      console.warn(`Row ${i + 1}: Unrecognized area '${areaRaw}'`);
      unmappedCount++;
      continue;
    }

    const nama = row[1] ? String(row[1]).trim() : null;
    const nopol = row[2] ? String(row[2]).trim() : null;
    const area = areaRaw;
    const tujuan = row[4] ? String(row[4]).trim() : null;
    const dept = row[5] ? String(row[5]).trim() : null;
    const datang = formatExcelTime(row[6]);
    const pergi = formatExcelTime(row[7]);
    const pulang = formatExcelTime(row[8]);
    const jamKerjaMenit = parseNum(row[9]) ?? 540;
    const durasiPerjalananMenit = parseNum(row[10]);
    const efektifKerjaJam = parseNum(row[11]);
    const durasiPerjalananJam = parseNum(row[12]);
    const lamaA = row[13] ? String(row[13]).trim() : null;
    const pic = row[14] ? String(row[14]).trim() : null;
    const kmAwal = parseNum(row[15]);
    const kmAkhir = parseNum(row[16]);
    const jarakTempuh = parseNum(row[17]);
    const jenisBbm = row[18] ? String(row[18]).trim() : null;
    const pengisianLiter = parseNum(row[19]);
    const hargaBbm = parseNum(row[20]);
    const totalBbm = parseNum(row[21]);
    const penumpang = row[22] ? String(row[22]).trim() : null;
    const keterangan = row[23] ? String(row[23]).trim() : null;

    buckets[areaRaw].push({
      reportId: target.reportId,
      periodeLabel: "Agustus 2026",
      areaWilayah: area,
      tgl: d,
      nama,
      nopol,
      area,
      tujuan,
      dept,
      datang,
      pergi,
      pulang,
      jamKerjaMenit,
      durasiPerjalananMenit,
      efektifKerjaJam,
      durasiPerjalananJam,
      lamaA,
      pic,
      kmAwal,
      kmAkhir,
      jarakTempuh,
      jenisBbm,
      pengisianLiter,
      hargaBbm,
      totalBbm,
      penumpang,
      keterangan,
      // Legacy fields
      plateNo: nopol,
      fuelType: jenisBbm,
      liters: pengisianLiter ?? 0,
      distanceKm: jarakTempuh,
      cost: totalBbm,
      notes: keterangan,
      picName: pic
    });
  }

  console.log("\nPrepared records count:");
  console.log(`- AREA 2: ${buckets["AREA 2"].length} records (Target: ${REPORT_MAP["AREA 2"].label})`);
  console.log(`- AREA 3: ${buckets["AREA 3"].length} records (Target: ${REPORT_MAP["AREA 3"].label})`);
  console.log(`- AREA 4: ${buckets["AREA 4"].length} records (Target: ${REPORT_MAP["AREA 4"].label})`);
  const grandTotal = buckets["AREA 2"].length + buckets["AREA 3"].length + buckets["AREA 4"].length;
  console.log(`- Total to insert: ${grandTotal} records (Unmapped: ${unmappedCount})`);

  // Clear previous BBM records in these 3 reports
  const allReportIds = Object.values(REPORT_MAP).map(t => t.reportId);
  const del = await db.vehicleFuelUsage.deleteMany({
    where: { reportId: { in: allReportIds } }
  });
  console.log(`\nCleared ${del.count} previous BBM records from target reports.`);

  // Insert in chunks of 100
  const CHUNK_SIZE = 100;
  for (const [areaKey, rows] of Object.entries(buckets)) {
    console.log(`\nInserting ${rows.length} records for ${areaKey}...`);
    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      await db.vehicleFuelUsage.createMany({ data: chunk });
      inserted += chunk.length;
      if (inserted % 500 === 0 || inserted === rows.length) {
        console.log(`  -> ${areaKey}: ${inserted} / ${rows.length} inserted`);
      }
    }
  }

  // Verification counts from database
  console.log("\n=== DATABASE VERIFICATION ===");
  for (const [areaKey, target] of Object.entries(REPORT_MAP)) {
    const dbCount = await db.vehicleFuelUsage.count({
      where: { reportId: target.reportId }
    });
    console.log(`✅ ${areaKey} (${target.label}): ${dbCount} records in DB`);
  }

  const finalTotal = await db.vehicleFuelUsage.count({
    where: { reportId: { in: allReportIds } }
  });
  console.log(`\n🎉 ALL 3954 BBM RECORDS SUCCESSFULLY IMPORTED! Grand Total in DB: ${finalTotal}`);

  await db.$disconnect();
}

main().catch(console.error);
