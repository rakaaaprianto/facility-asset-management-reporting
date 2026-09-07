import { db } from "../lib/db";

async function main() {
  const sites = await db.site.findMany({
    include: {
      region: true,
      users: { include: { user: true } },
    },
    orderBy: { code: "asc" },
  });
  console.log(`Found ${sites.length} sites:`);
  for (const s of sites) {
    const pics = s.users.map((u) => u.user.name).join(", ");
    console.log(`- [${s.code}] ${s.name} (${s.region?.name ?? "No Region"}) - PICs: ${pics || "None"}`);
  }

  const admin = await db.user.findFirst({
    where: { role: { code: { in: ["ADMIN", "SUPER_ADMIN"] } } },
  });
  console.log("Admin user:", admin?.name, admin?.email);
}

main().catch(console.error).finally(() => process.exit(0));
