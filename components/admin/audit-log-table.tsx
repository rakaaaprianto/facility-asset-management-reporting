"use client";

import { ShieldCheck } from "lucide-react";
import { Badge, Card, CardHeader, Table, EmptyRow } from "@/components/ui";

export type AuditLogRow = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string | null;
  afterStr: string | null;
};

export default function AuditLogTable({
  logs,
  totalCount,
}: {
  logs: AuditLogRow[];
  isSuperAdmin?: boolean;
  totalCount: number;
}) {
  return (
    <Card>
      <CardHeader
        title={`Aktivitas Terkini (${logs.length} ditampilkan ${
          totalCount > logs.length ? `dari ${totalCount} total` : ""
        })`}
        description="Pencatatan riwayat audit keamanan dan perubahan data."
        action={
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Audit Trail Terkunci (Immutable)</span>
          </div>
        }
      />

      <Table
        head={[
          "#",
          "Waktu",
          "Aktor",
          "Aksi",
          "Entity",
          "Entity ID",
          "Detail Perubahan",
        ]}
      >
        {logs.length === 0 ? (
          <EmptyRow colSpan={7} label="Belum ada catatan aktivitas audit." />
        ) : (
          logs.map((l, idx) => (
            <tr key={l.id} className="hover:bg-slate-50 transition-colors">
              <td className="w-8 px-4 py-2 font-mono text-xs text-slate-400">
                {idx + 1}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-600 font-mono">
                {l.createdAt}
              </td>
              <td className="px-4 py-2 text-xs">
                <span className="font-medium text-slate-800">{l.actorEmail}</span>
                {l.ipAddress ? (
                  <span className="block font-mono text-[10px] text-slate-400">
                    IP: {l.ipAddress}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-2">
                <Badge
                  tone={
                    l.action.includes("DELETE") || l.action.includes("REVISE")
                      ? "red"
                      : l.action.includes("APPROVE") || l.action.includes("CREATE")
                      ? "green"
                      : l.action.includes("UPDATE") || l.action.includes("SET")
                      ? "blue"
                      : "gray"
                  }
                >
                  {l.action}
                </Badge>
              </td>
              <td className="px-4 py-2 text-xs font-medium text-slate-700">{l.entityType}</td>
              <td className="max-w-[140px] truncate px-4 py-2 font-mono text-[10px] text-slate-400">
                {l.entityId}
              </td>
              <td className="max-w-[280px] truncate px-4 py-2 text-[11px] text-slate-500 font-mono">
                {l.afterStr ?? "-"}
              </td>
            </tr>
          ))
        )}
      </Table>
    </Card>
  );
}
