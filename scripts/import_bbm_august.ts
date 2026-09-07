import "dotenv/config";
import path from "path";
import xlsx from "xlsx";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const REPORT_ID = "01a06543-fd6b-7419-a328-8a300b7b4436"; // Area 2 Agustus 2026

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
  console.log("Importing BBM Kendaraan data for Report ID:", REPORT_ID);

  const filePath = path.join(process.cwd(), "docs", "references", "LAPORAN BBM KENDARAAN AGUSTUS 26.xlsx");
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets["Laporan 2026"];
  const rawData = xlsx.utils.sheet_to_json<any[]>(ws, { header: 1 });

  const rowsToInsert: any[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row[0] === undefined) continue;
    const d = excelDateToDate(row[0]);
    if (!d) continue;
    const isoDate = d.toISOString().split("T")[0];

    // Filter August 2026
    if (isoDate.startsWith("2026-08")) {
      const nama = row[1] ? String(row[1]).trim() : null;
      const nopol = row[2] ? String(row[2]).trim() : null;
      const area = row[3] ? String(row[3]).trim() : "AREA 2";
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

      rowsToInsert.push({
        reportId: REPORT_ID,
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
        // Legacy fields synchronization
        plateNo: nopol,
        fuelType: jenisBbm,
        liters: pengisianLiter ?? 0,
        distanceKm: jarakTempuh,
        cost: totalBbm,
        notes: keterangan,
        picName: pic,
      });
    }
  }

  console.log(`Found ${rowsToInsert.length} rows to insert.`);

  // Delete previous BBM data for this report
  const deleted = await db.vehicleFuelUsage.deleteMany({
    where: { reportId: REPORT_ID },
  });
  console.log(`Deleted ${deleted.count} old BBM rows.`);

  // Insert in chunks of 50 to prevent parameter limit issues
  const chunkSize = 50;
  let insertedTotal = 0;
  for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
    const chunk = rowsToInsert.slice(i, i + chunkSize);
    await db.vehicleFuelUsage.createMany({
      data: chunk,
    });
    insertedTotal += chunk.length;
    console.log(`Inserted ${insertedTotal} / ${rowsToInsert.length} rows...`);
  }

  console.log("Successfully imported all August BBM rows!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
