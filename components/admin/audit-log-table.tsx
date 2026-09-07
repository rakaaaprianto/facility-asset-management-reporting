"use client";

import { useState, useTransition, useActionState } from "react";
import { Trash2, CheckSquare } from "lucide-react";
import { Badge, Button, Card, CardHeader, Table, EmptyRow } from "@/components/ui";
import { deleteAuditLog, deleteAuditLogsBulk, clearAllAuditLogs } from "@/lib/admin-actions";

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
  isSuperAdmin,
  totalCount,
}: {
  logs: AuditLogRow[];
  isSuperAdmin: boolean;
  totalCount: number;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkState, bulkAction, bulkPending] = useActionState(deleteAuditLogsBulk, {});
  const [clearState, clearAction, clearPending] = useActionState(clearAllAuditLogs, {});
  const [singlePending, startSingleTransition] = useTransition();

  const isAllSelected = logs.length > 0 && selectedIds.length === logs.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < logs.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map((l) => l.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSingle = (id: string, actionName: string) => {
    if (!confirm(`Hapus log aktivitas "${actionName}" ini?`)) return;
    startSingleTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      await deleteAuditLog(fd);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    });
  };

  return (
    <Card>
      <CardHeader
        title={`Aktivitas Terkini (${logs.length} ditampilkan ${
          totalCount > logs.length ? `dari ${totalCount} total` : ""
        })`}
        description="Pencatatan riwayat audit keamanan dan perubahan data."
        action={
          isSuperAdmin && totalCount > 0 ? (
            <form
              action={clearAction}
              onSubmit={(e) => {
                if (
                  !confirm(
                    `⚠️ PERINGATAN SUPER ADMIN ⚠️\n\nApakah Anda yakin ingin MENGOSONGKAN SELURUH ${totalCount} AUDIT LOG di database?\n\nSemua riwayat log akan dihapus permanen untuk menghemat kuota memori database.\n\nTindakan ini TIDAK DAPAT DIBATALKAN.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <Button
                type="submit"
                variant="secondary"
                disabled={clearPending || bulkPending || singlePending}
                className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={14} className="mr-1" />
                {clearPending ? "Mengosongkan…" : "Kosongkan Semua Log"}
              </Button>
            </form>
          ) : null
        }
      />

      {/* Feedback Messages */}
      {bulkState.error ? (
        <div className="mx-5 mt-3 rounded-md bg-red-50 p-2.5 text-xs text-red-700">
          {bulkState.error}
        </div>
      ) : null}
      {bulkState.success ? (
        <div className="mx-5 mt-3 rounded-md bg-emerald-50 p-2.5 text-xs text-emerald-700">
          {bulkState.success}
        </div>
      ) : null}
      {clearState.error ? (
        <div className="mx-5 mt-3 rounded-md bg-red-50 p-2.5 text-xs text-red-700">
          {clearState.error}
        </div>
      ) : null}
      {clearState.success ? (
        <div className="mx-5 mt-3 rounded-md bg-emerald-50 p-2.5 text-xs text-emerald-700">
          {clearState.success}
        </div>
      ) : null}

      {/* Bulk Action Toolbar */}
      {isSuperAdmin && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-brand-50/70 px-5 py-2.5 text-xs text-brand-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckSquare size={16} className="text-brand-700" />
            <span>{selectedIds.length} log dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <form
              action={bulkAction}
              onSubmit={(e) => {
                if (!confirm(`Hapus ${selectedIds.length} log aktivitas yang dipilih?`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="ids" value={JSON.stringify(selectedIds)} />
              <Button
                type="submit"
                disabled={bulkPending || clearPending || singlePending}
                className="bg-red-600 text-xs text-white hover:bg-red-700"
              >
                <Trash2 size={13} className="mr-1" />
                {bulkPending ? "Menghapus…" : `Hapus Terpilih (${selectedIds.length})`}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded px-2 py-1 text-slate-600 hover:bg-white"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      <Table
        head={[
          isSuperAdmin ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isSomeSelected;
                }}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-600"
                title="Pilih Semua Log"
              />
            </div>
          ) : (
            "#"
          ),
          "Waktu",
          "Aktor",
          "Aksi",
          "Entity",
          "Entity ID",
          "Detail",
          isSuperAdmin ? "Aksi" : "",
        ].filter(Boolean)}
      >
        {logs.length === 0 ? (
          <EmptyRow colSpan={isSuperAdmin ? 8 : 6} label="Belum ada catatan aktivitas audit." />
        ) : (
          logs.map((l) => {
            const isSelected = selectedIds.includes(l.id);
            return (
              <tr
                key={l.id}
                className={isSelected ? "bg-brand-50/60" : "hover:bg-slate-50"}
              >
                {isSuperAdmin ? (
                  <td className="w-8 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(l.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-600"
                    />
                  </td>
                ) : (
                  <td className="w-8 px-4 py-2 text-xs text-slate-400">•</td>
                )}
                <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-600">
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
                <td className="max-w-[240px] truncate px-4 py-2 text-[11px] text-slate-500">
                  {l.afterStr ?? "-"}
                </td>
                {isSuperAdmin ? (
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={singlePending || bulkPending || clearPending}
                      onClick={() => handleDeleteSingle(l.id, l.action)}
                      title="Hapus log ini"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })
        )}
      </Table>
    </Card>
  );
}
