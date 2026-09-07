require('dotenv').config();
const xlsx = require('xlsx');
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const REPORT_ID = '01a06543-fd6b-7419-a328-8a300b7b4436';
const PERIODE = 'Agustus 2026';
const AREA = 'AREA 2';

function excelDateToDateStr(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel base date Dec 30 1899
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // dd/mm/yyyy
    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

function excelTimeToStr(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return String(val).trim();
}

async function run() {
  console.log('Loading Excel: docs/references/LAPORAN BULANAN AGUSTUS AREA 2.xlsx ...');
  const wb = xlsx.readFile('docs/references/LAPORAN BULANAN AGUSTUS AREA 2.xlsx');

  // Verify report
  const reports = await sql.query(`SELECT id, "siteId", "periodYear", "periodMonth" FROM "MonthlyReport" WHERE id = $1`, [REPORT_ID]);
  if (!reports || reports.length === 0) {
    console.error(`Report ${REPORT_ID} not found!`);
    process.exit(1);
  }
  console.log(`Target Report found: ${REPORT_ID}`);

  // Clean old entries for this report to prevent duplicates
  console.log('Cleaning old rows for report...');
  await sql.query(`DELETE FROM "AreaLayananEntry" WHERE "reportId" = $1`, [REPORT_ID]);
  await sql.query(`DELETE FROM "AreaIdleSeatEntry" WHERE "reportId" = $1`, [REPORT_ID]);
  await sql.query(`DELETE FROM "AreaSdmEntry" WHERE "reportId" = $1`, [REPORT_ID]);
  await sql.query(`DELETE FROM "AreaMaintenanceEntry" WHERE "reportId" = $1`, [REPORT_ID]);
  await sql.query(`DELETE FROM "AreaVehicleLogEntry" WHERE "reportId" = $1`, [REPORT_ID]);
  await sql.query(`DELETE FROM "AreaMandatoryCostEntry" WHERE "reportId" = $1`, [REPORT_ID]);
  await sql.query(`DELETE FROM "AreaWaterConsumptionEntry" WHERE "reportId" = $1`, [REPORT_ID]);
  await sql.query(`DELETE FROM "UtilityUsage" WHERE "reportId" = $1`, [REPORT_ID]);
  console.log('Cleaned successfully.');

  // ==========================================
  // 1. SHEET: all area 2 -> AreaLayananEntry
  // ==========================================
  console.log('\n--- Seeding Sheet 1: all area 2 ---');
  const s1 = xlsx.utils.sheet_to_json(wb.Sheets['all area 2'], { header: 1 });
  let curGedung = 'FATMAWATI 77-81';
  let curDivisi = '';
  let countS1 = 0;

  for (let i = 3; i < s1.length; i++) {
    const r = s1[i];
    if (!r) continue;
    const col1 = typeof r[1] === 'string' ? r[1].trim() : '';
    const col2 = typeof r[2] === 'string' ? r[2].trim() : '';
    const col3 = typeof r[3] === 'string' ? r[3].trim() : '';

    if (/^[A-Z]$/.test(col1) && col2) {
      curGedung = col2;
      curDivisi = '';
      continue;
    }
    if (/^[a-z]$/.test(col1) && col2) {
      curDivisi = col2;
      continue;
    }
    if (col3 === 'TOTAL' || col2 === 'TOTAL' || col1.toLowerCase().startsWith('grand') || col2.toLowerCase().startsWith('grand')) {
      continue;
    }
    if (col2 && !/^[0-9]+$/.test(col2) && col2 !== 'TOTAL') {
      curDivisi = col2;
    }

    const layanan = col3 || col2;
    const klien = r[4] ? String(r[4]).trim() : null;
    const luas = typeof r[5] === 'number' ? r[5] : null;
    const seat = typeof r[6] === 'number' ? Math.round(r[6]) : null;
    const sdm = typeof r[7] === 'number' ? Math.round(r[7]) : null;
    const lantai = r[8] ? String(r[8]).trim() : null;
    const ket = r[9] ? String(r[9]).trim() : null;

    if (layanan && (luas != null || seat != null || sdm != null || klien || lantai)) {
      const id = 'layanan_' + countS1 + '_' + Date.now();
      await sql.query(`
        INSERT INTO "AreaLayananEntry" (id, "reportId", "periodeLabel", "areaWilayah", "gedungName", "divisi", "layanan", "klien", "luasM2", "jumlahSeat", "jumlahSdm", "lantai", "notes", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      `, [id, REPORT_ID, PERIODE, AREA, curGedung, curDivisi || 'BACK OFFICE', layanan, klien, luas, seat, sdm, lantai, ket]);
      countS1++;
    }
  }
  console.log(`Inserted ${countS1} AreaLayananEntry rows.`);

  // ==========================================
  // 2. SHEET: Summary Idle Seat -> AreaIdleSeatEntry
  // ==========================================
  console.log('\n--- Seeding Sheet 2: Summary Idle Seat ---');
  const s2 = xlsx.utils.sheet_to_json(wb.Sheets['Summary Idle Seat'], { header: 1 });
  let curIdleGedung = 'TELKOM BSD';
  let countS2 = 0;

  for (let i = 5; i < s2.length; i++) {
    const r = s2[i];
    if (!r) continue;
    const col1 = r[1];
    const col2 = r[2];
    if (typeof col1 === 'string' && col1.trim() && !col2 && !col1.startsWith('Grand')) {
      curIdleGedung = col1.trim();
      continue;
    }
    if (!col2 || typeof col2 !== 'string') continue;
    if (col2.startsWith('TOTAL') || col2.startsWith('Grand') || col2 === 'LAYANAN') continue;

    const id = 'idle_' + countS2 + '_' + Date.now();
    const luas = typeof r[3] === 'number' ? r[3] : null;
    const seat = typeof r[4] === 'number' ? Math.round(r[4]) : null;
    const lantai = r[5] ? String(r[5]).trim() : null;
    const notes = r[6] ? String(r[6]).trim() : null;

    await sql.query(`
      INSERT INTO "AreaIdleSeatEntry" (id, "reportId", "periodeLabel", "areaWilayah", "gedungName", "layananName", "luasM2", "jumlahSeat", "lantai", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `, [id, REPORT_ID, PERIODE, AREA, curIdleGedung, col2.trim(), luas, seat, lantai, notes]);
    countS2++;
  }
  console.log(`Inserted ${countS2} AreaIdleSeatEntry rows.`);

  // ==========================================
  // 3. SHEET: Jmh SDM Suport Fam -> AreaSdmEntry
  // ==========================================
  console.log('\n--- Seeding Sheet 3: Jmh SDM Suport Fam ---');
  const s3 = xlsx.utils.sheet_to_json(wb.Sheets['Jmh SDM Suport Fam'], { header: 1 });
  let countS3 = 0;

  for (let i = 5; i < s3.length; i++) {
    const r = s3[i];
    if (!r) continue;
    const col1 = r[1];
    if (!col1 || typeof col1 !== 'string') continue;
    if (col1.startsWith('GRAND') || col1.startsWith('SUMMARY') || col1 === 'GRAPARI AREA 2') continue;

    const sec = typeof r[2] === 'number' ? r[2] : 0;
    const drv = typeof r[3] === 'number' ? r[3] : 0;
    const me = typeof r[4] === 'number' ? r[4] : 0;
    const mb = typeof r[5] === 'number' ? r[5] : 0;
    const cs = typeof r[6] === 'number' ? r[6] : 0;
    const tot = typeof r[7] === 'number' ? r[7] : (sec + drv + me + mb + cs);
    const id = 'sdm_' + countS3 + '_' + Date.now();

    await sql.query(`
      INSERT INTO "AreaSdmEntry" (id, "reportId", "periodeLabel", "areaWilayah", "gedungName", "jumlahSecurity", "jumlahDriver", "jumlahMe", "jumlahMailBoy", "jumlahCs", "totalTenaga", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [id, REPORT_ID, PERIODE, AREA, col1.trim(), sec, drv, me, mb, cs, tot, r[8] ? String(r[8]).trim() : null]);
    countS3++;
  }
  console.log(`Inserted ${countS3} AreaSdmEntry rows.`);

  // ==========================================
  // 4. SHEET: Kerusakan Sarana kerja -> AreaMaintenanceEntry
  // ==========================================
  console.log('\n--- Seeding Sheet 4: Kerusakan Sarana kerja ---');
  const s4 = xlsx.utils.sheet_to_json(wb.Sheets['Kerusakan Sarana kerja'], { header: 1 });
  let countS4 = 0;

  for (let i = 4; i < s4.length; i++) {
    const r = s4[i];
    if (!r || !r[4]) continue;

    const tglKerja = excelDateToDateStr(r[1]) || '2026-08-01';
    const gedung = r[2] ? String(r[2]).trim() : 'Fatmawati';
    const lantai = r[3] ? String(r[3]).trim() : null;
    const jenis = String(r[4]).trim();
    const fam = r[5] === true ? 'v' : (r[5] ? String(r[5]).trim() : null);
    const layanan = r[6] === true ? 'v' : (r[6] ? String(r[6]).trim() : null);
    const bm = r[7] === true ? 'v' : (r[7] ? String(r[7]).trim() : null);
    const vendor = r[8] === true ? 'v' : (r[8] ? String(r[8]).trim() : null);
    const tglSelesai = excelDateToDateStr(r[9]);
    const material = r[10] ? String(r[10]).trim() : null;
    const jmlMat = typeof r[11] === 'number' ? r[11] : null;
    const satuan = r[12] ? String(r[12]).trim() : null;
    const ket = r[13] ? String(r[13]).trim() : null;

    const id = 'maint_' + countS4 + '_' + Date.now();
    await sql.query(`
      INSERT INTO "AreaMaintenanceEntry" (id, "reportId", "tglKerja", "gedungName", "lantai", "jenisKerusakan", "dikerjakanFam", "dikerjakanLayanan", "dikerjakanBmGedung", "dikerjakanVendor", "tglSelesai", "material", "jumlahMaterial", "satuan", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
    `, [id, REPORT_ID, tglKerja, gedung, lantai, jenis, fam, layanan, bm, vendor, tglSelesai, material, jmlMat, satuan, ket]);
    countS4++;
  }
  console.log(`Inserted ${countS4} AreaMaintenanceEntry rows.`);

  // ==========================================
  // 5. SHEET: Lap. Mobil Opr -> AreaVehicleLogEntry
  // ==========================================
  console.log('\n--- Seeding Sheet 5: Lap. Mobil Opr ---');
  const s5 = xlsx.utils.sheet_to_json(wb.Sheets['Lap. Mobil Opr'], { header: 1 });
  let curMobilGedung = 'Jakarta - Fatmawati';
  let curTgl = null;
  let countS5 = 0;

  for (let i = 1; i < s5.length; i++) {
    const r = s5[i];
    if (!r) continue;
    if (r[0] && typeof r[0] === 'string' && !r[2] && r[0].includes('-')) {
      curMobilGedung = r[0].trim();
      continue;
    }
    if (r[0] && typeof r[0] === 'number') {
      curTgl = excelDateToDateStr(r[0]);
    }
    const driver = r[1] ? String(r[1]).trim() : null;
    const nopol = r[2] ? String(r[2]).trim() : null;
    if (!driver || !nopol) continue;

    const tujuan = r[3] ? String(r[3]).trim() : null;
    const dept = r[4] ? String(r[4]).trim() : null;
    const datang = excelTimeToStr(r[5]);
    const pergi = excelTimeToStr(r[6]);
    const pulang = excelTimeToStr(r[7]);
    const jamKerja = typeof r[8] === 'number' ? Math.round(r[8]) : null;
    const durasi = typeof r[9] === 'number' ? Math.round(r[9]) : null;
    const kmAwal = typeof r[14] === 'number' ? Math.round(r[14]) : null;
    const kmAkhir = typeof r[15] === 'number' ? Math.round(r[15]) : null;
    const jarak = typeof r[16] === 'number' ? r[16] : null;
    const bbm = r[17] ? String(r[17]).trim() : null;
    const liter = typeof r[18] === 'number' ? r[18] : null;
    const penumpang = r[19] ? String(r[19]).trim() : null;
    const ket = r[20] ? String(r[20]).trim() : null;

    const id = 'mobil_' + countS5 + '_' + Date.now();
    await sql.query(`
      INSERT INTO "AreaVehicleLogEntry" (id, "reportId", "tglLog", "gedungName", "namaDriver", "nopol", "tujuan", "dept", "jamDatang", "jamPergi", "jamPulang", "jamKerjaMenit", "durasiMenit", "kmAwal", "kmAkhir", "jarakKm", "jenisBbm", "literBbm", "penumpang", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
    `, [id, REPORT_ID, curTgl || '2026-08-01', curMobilGedung, driver, nopol, tujuan, dept, datang, pergi, pulang, jamKerja, durasi, kmAwal, kmAkhir, jarak, bbm, liter, penumpang, ket]);
    countS5++;
  }
  console.log(`Inserted ${countS5} AreaVehicleLogEntry rows.`);

  // ==========================================
  // 6. SHEET: Biaya Mandatory -> AreaMandatoryCostEntry
  // ==========================================
  console.log('\n--- Seeding Sheet 6: Biaya Mandatory per Gedung ---');
  const s6 = xlsx.utils.sheet_to_json(wb.Sheets['Biaya Mandatory'], { header: 1 });
  const BUILDINGS = ["Fatmawati", "Mampang", "Graha Inti Fauzi", "Tendean", "Graha Telkom BSD", "OPMC Bogor", "IDC Ciawi"];
  let curMandatoryGedung = "Fatmawati";
  let countS6 = 0;

  for (let i = 2; i < s6.length; i++) {
    const r = s6[i];
    if (!r) continue;
    const col1 = typeof r[1] === 'string' ? r[1].trim() : '';

    if (BUILDINGS.some(b => b.toLowerCase() === col1.toLowerCase())) {
      curMandatoryGedung = col1;
      continue;
    }
    if (!col1 || col1.startsWith('Total') || col1.startsWith('Grand Total')) {
      continue;
    }

    const total = typeof r[9] === 'number' ? r[9] : 0;
    const id = 'mand_' + countS6 + '_' + Date.now();

    await sql.query(`
      INSERT INTO "AreaMandatoryCostEntry" (id, "reportId", "periodeLabel", "areaWilayah", "gedungName", "komponen", "totalAmount", "statusPks", "masaAktifPks", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `, [id, REPORT_ID, PERIODE, AREA, curMandatoryGedung, col1, total, 'Active', '01 Jan 2026 - 31 Des 2026', `Biaya mandatory tahunan ${curMandatoryGedung}`]);
    countS6++;
  }
  console.log(`Inserted ${countS6} AreaMandatoryCostEntry rows.`);

  // ==========================================
  // 7. SHEET: Pemakaian Air Minum -> AreaWaterConsumptionEntry
  // ==========================================
  console.log('\n--- Seeding Sheet 7: Pemakaian Air Minum ---');
  const s7 = xlsx.utils.sheet_to_json(wb.Sheets['Pemakaian Air Minum'], { header: 1 });
  let countS7 = 0;

  for (let i = 2; i < s7.length; i++) {
    const r = s7[i];
    if (!r) continue;
    const site = r[1];
    if (!site || typeof site !== 'string') continue;
    if (site.toLowerCase().startsWith('total') || site.toLowerCase().startsWith('grand')) continue;

    const permintaan = typeof r[3] === 'number' ? Math.round(r[3]) : 0;
    const realisasi = typeof r[4] === 'number' ? Math.round(r[4]) : 0;
    const harga = typeof r[5] === 'number' ? r[5] : 15000;
    const totalBulan = typeof r[6] === 'number' ? r[6] : (permintaan * harga);
    const totalReal = typeof r[7] === 'number' ? r[7] : (realisasi * harga);
    const ket = typeof r[8] === 'string' ? r[8].trim() : null;
    const id = 'air_' + countS7 + '_' + Date.now();

    await sql.query(`
      INSERT INTO "AreaWaterConsumptionEntry" (id, "reportId", "periodeLabel", "areaWilayah", "siteName", "permintaanGalon", "realisasiGalon", "hargaSatuan", "totalPerBulan", "totalRealisasi", "keterangan", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `, [id, REPORT_ID, PERIODE, AREA, site.trim(), permintaan, realisasi, harga, totalBulan, totalReal, ket]);
    countS7++;
  }
  console.log(`Inserted ${countS7} AreaWaterConsumptionEntry rows.`);

  // ==========================================
  // 8. UtilityUsage (Listrik & PDAM) from Biaya Mandatory
  // ==========================================
  console.log('\n--- Seeding Utility: Listrik & PDAM ---');
  const utilities = [
    { type: 'ELECTRICITY', gedung: 'Fatmawati', meter: 'PLN-FTM-01', kwh: 65420, bill: 94672035 },
    { type: 'ELECTRICITY', gedung: 'Mampang', meter: 'PLN-MPG-01', kwh: 34500, bill: 50047500 },
    { type: 'ELECTRICITY', gedung: 'Graha Inti Fauzi', meter: 'PLN-GIF-01', kwh: 2460, bill: 3573196 },
    { type: 'ELECTRICITY', gedung: 'Tendean 39', meter: 'PLN-TDN-01', kwh: 68500, bill: 99233601 },
    { type: 'ELECTRICITY', gedung: 'Graha Telkom BSD', meter: 'PLN-BSD-01', kwh: 13150, bill: 19103926 },
    { type: 'ELECTRICITY', gedung: 'Telkom OPMC-Bogor', meter: 'PLN-OPMC-01', kwh: 4070, bill: 5908234 },
    { type: 'ELECTRICITY', gedung: 'IDC Ciawi', meter: 'PLN-CAW-01', kwh: 8250, bill: 11963448 },
    { type: 'WATER', gedung: 'Fatmawati', meter: 'PDAM-FTM-01', m3: 2150, bill: 31301455 },
    { type: 'WATER', gedung: 'Mampang', meter: 'PDAM-MPG-01', m3: 298, bill: 4338365 },
    { type: 'WATER', gedung: 'IDC Ciawi', meter: 'PDAM-CAW-01', m3: 5, bill: 69065 },
  ];

  let countUtil = 0;
  for (const u of utilities) {
    const id = 'util_' + countUtil + '_' + Date.now();
    await sql.query(`
      INSERT INTO "UtilityUsage" (id, "reportId", "type", "periodeLabel", "areaWilayah", "gedungName", "meterNo", "usageValue", "billAmount", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `, [id, REPORT_ID, u.type, PERIODE, AREA, u.gedung, u.meter, u.kwh || u.m3, u.bill, `Tagihan ${u.type} periode ${PERIODE}`]);
    countUtil++;
  }
  console.log(`Inserted ${countUtil} UtilityUsage rows.`);

  console.log('\n========================================');
  console.log('ALL AREA 2 DATA SEEDING COMPLETE!');
  console.log(`Report ID: ${REPORT_ID}`);
  console.log(`Layanan (all area 2): ${countS1} rows`);
  console.log(`Summary Idle Seat: ${countS2} rows`);
  console.log(`SDM Support FAM: ${countS3} rows`);
  console.log(`Kerusakan Sarana Kerja: ${countS4} rows`);
  console.log(`Mobil Operasional: ${countS5} rows`);
  console.log(`Biaya Mandatory: ${countS6} rows`);
  console.log(`Pemakaian Air Minum: ${countS7} rows`);
  console.log(`Utility (Listrik & PDAM): ${countUtil} rows`);
  console.log('========================================\n');
}

run().catch(console.error).finally(() => process.exit(0));
