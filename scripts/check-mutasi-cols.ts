import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const cols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'AssetMutation'
  `;
  console.log("AssetMutation columns:", cols.map((c: any) => c.column_name));
}

main().catch(console.error).finally(() => process.exit(0));
