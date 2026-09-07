import "dotenv/config";
import { getReportSectionStatusMap } from "../lib/report-service";
import { db } from "../lib/db";

async function main() {
  const reportId = "01a06543-fd6b-7419-a328-8a300b7b4436";
  // Argumen ke-2 bernilai true karena ini adalah laporan Area (Area 2)
  const statusMap = await getReportSectionStatusMap(reportId, true);
  console.log("Section statuses for Report Area 2:");
  let filledCount = 0;
  for (const [key, filled] of statusMap.entries()) {
    console.log(`- ${key}: ${filled ? "FILLED" : "EMPTY"}`);
    if (filled) filledCount++;
  }
  console.log(`Total filled: ${filledCount} / ${statusMap.size}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
