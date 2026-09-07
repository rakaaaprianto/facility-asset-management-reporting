import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });
const q = (s: string) => db.$executeRawUnsafe(s);

async function main() {
  await q('DELETE FROM "_prisma_migrations" WHERE migration_name = \'20260824120000_region_excel_fidelity\'');
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
}).finally(() => process.exit(0));
