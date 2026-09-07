import { readFileSync } from "node:fs";
import * as XLSX from "C:/Project/infomedia-monthly-report/node_modules/xlsx/xlsx.mjs";

const wb = XLSX.read(readFileSync("C:/Project/infomedia-monthly-report/docs/references/Master_Data_Monthly_Report.xlsx"), { type: "buffer" });
const which = process.argv[2];
for (const name of wb.SheetNames) {
  if (which && !name.toLowerCase().includes(which.toLowerCase())) continue;
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  console.log(`\n=== ${name} ===`);
  for (let i = 0; i < Math.min(rows.length, 4); i++) {
    console.log(JSON.stringify(rows[i]));
  }
}
