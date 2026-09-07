const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'docs', 'references', 'Master_Data_Monthly_Report.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheets = ['16_OPEN_INVOICE', '17_INVOICE_PROSES', '18_INVOICE_PAID'];
  for (const name of sheets) {
    const ws = wb.getWorksheet(name);
    if (!ws) {
      console.log('Sheet not found:', name);
      continue;
    }
    console.log('=== ' + name + ' ===');
    for (let r = 1; r <= 8; r++) {
      const row = ws.getRow(r);
      const vals = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        vals[colNumber] = cell.value;
      });
      if (vals.some(v => v !== undefined && v !== null && v !== '')) {
        console.log(`Row ${r}:`, JSON.stringify(vals));
      }
    }
  }
}

run().catch(console.error);
