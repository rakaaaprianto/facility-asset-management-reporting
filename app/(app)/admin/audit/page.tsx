import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import AuditLogTable from "@/components/admin/audit-log-table";

export const metadata = { title: "Audit Log" };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const user = await requirePermission("audit:read");
  const isSuperAdmin = user.roleCode === "SUPER_ADMIN";

  const sp = await searchParams;
  const actionFilter = sp.action?.trim();

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where: actionFilter ? { action: { contains: actionFilter } } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { actor: { select: { name: true, email: true } } },
    }),
    db.auditLog.count({
      where: actionFilter ? { action: { contains: actionFilter } } : {},
    }),
  ]);

  const serializedLogs = logs.map((l) => ({
    id: l.id,
    createdAt: new Date(l.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
    actorEmail: l.actor?.email ?? "sistem",
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    ipAddress: l.ipAddress,
    afterStr: l.after ? JSON.stringify(l.after) : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Audit Log</h1>
          <p className="text-sm text-slate-500">
            Riwayat pencatatan keamanan dan aktivitas sistem.
          </p>
        </div>
      </div>

      <AuditLogTable
        logs={serializedLogs}
        isSuperAdmin={isSuperAdmin}
        totalCount={totalCount}
      />
    </div>
  );
}
