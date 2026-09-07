"use client";

import { useState, useActionState, useTransition, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Grid3x3, ClipboardList, Save } from "lucide-react";
import { Badge, Button, Card, CardHeader, Input, Label, Select, Table, Textarea } from "@/components/ui";
import { createPksContract, updatePksContract, deletePksContract, savePksBulk, type FormState } from "@/lib/admin-actions";

export type PksItem = {
  id?: string;
  contractNo?: string | null;
  jenisPks?: string | null;
  endDate?: string | Date | null;
  notes?: string | null;
  picName?: string | null;
};

function daysUntil(dateStr?: string | Date | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const JENIS_PKS_OPTIONS = [
  "Sewa Gedung",
  "Cleaning Service",
  "Keamanan / Security",
  "Maintenance / ME",
  "Pest Control",
  "Lift",
  "Genset",
  "Lainnya",
];

const initial: FormState = {};

export default function PksPanel({
  siteId,
  contracts,
  editable,
  reportId,
}: {
  siteId: string;
  contracts: PksItem[];
  editable: boolean;
  reportId?: string;
}) {
  const [mode, setMode] = useState<"grid" | "form">("grid");
  const [editing, setEditing] = useState<PksItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const [createState, createAction, createPending] = useActionState(createPksContract, initial);
  const [editState, editAction, editPending] = useActionState(updatePksContract, initial);
  const [bulkState, bulkAction, bulkPending] = useActionState(savePksBulk, initial);
  const [isPending, startTransition] = useTransition();

  // Grid rows state
  const [gridRows, setGridRows] = useState<PksItem[]>(() => {
    if (contracts.length > 0) return contracts.map((c) => ({ ...c }));
    return [{}];
  });

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setGridRows((prev) => {
      if (contracts.length === 0 && prev.length === 1 && Object.keys(prev[0]).length === 0) return prev;
      if (contracts.length === 0) return [{}];
      return contracts.map((c) => ({ ...c }));
    });
  }, [contracts]);

  const addRow = useCallback(() => {
    setGridRows((prev) => [...prev, {}]);
    setDirty(true);
  }, []);

  const removeRow = useCallback(
    (idx: number) => {
      const row = gridRows[idx];
      if (row?.id) {
        const fd = new FormData();
        fd.append("id", row.id);
        if (reportId) fd.append("reportId", reportId);
        deletePksContract(fd);
      }
      setGridRows((prev) => prev.filter((_, i) => i !== idx));
      setDirty(true);
    },
    [gridRows]
  );

  const changeField = useCallback((rowIdx: number, fieldName: keyof PksItem, value: string) => {
    setGridRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [fieldName]: value };
      return next;
    });
    setDirty(true);
  }, []);

  function handleBulkSave() {
    setClientError(null);

    // Validate rows
    for (let i = 0; i < gridRows.length; i++) {
      const r = gridRows[i];
      const hasAnyData = Object.entries(r).some(
        ([k, v]) => k !== "id" && v !== undefined && v !== null && String(v).trim() !== ""
      );

      if (hasAnyData || r.id || gridRows.length === 1) {
        if (!r.endDate || String(r.endDate).trim() === "") {
          const errMsg = `Tanggal Berakhir wajib diisi pada baris ke-${i + 1}.`;
          setClientError(errMsg);
          alert(`⚠️ Peringatan:\n${errMsg}`);
          return;
        }
      }
    }

    const payload = gridRows.map((r) => ({
      id: r.id,
      contractNo: r.contractNo || undefined,
      jenisPks: r.jenisPks || undefined,
      endDate: typeof r.endDate === "string" ? r.endDate : r.endDate ? new Date(r.endDate).toISOString().slice(0, 10) : undefined,
      picName: r.picName || undefined,
      notes: r.notes || undefined,
    }));

    const fd = new FormData();
    fd.append("siteId", siteId);
    if (reportId) fd.append("reportId", reportId);
    fd.append("rows", JSON.stringify(payload));
    startTransition(() => {
      bulkAction(fd);
    });
  }

  const showError = clientError || bulkState.error || createState.error || editState.error;
  const showSuccess = bulkState.success || createState.success || editState.success;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Kontrak PKS</h3>
        </div>

        {editable ? (
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-slate-200 bg-white text-xs">
              <button
                type="button"
                onClick={() => setMode("grid")}
                className={`flex items-center gap-1 rounded-l-md px-2.5 py-1.5 transition ${
                  mode === "grid" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Grid3x3 size={13} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setMode("form")}
                className={`flex items-center gap-1 rounded-r-md px-2.5 py-1.5 transition ${
                  mode === "form" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ClipboardList size={13} /> Form
              </button>
            </div>

            {mode === "form" && !showAdd && !editing ? (
              <Button type="button" onClick={() => setShowAdd(true)}>
                <Plus size={15} /> Tambah PKS
              </Button>
            ) : mode === "grid" ? (
              <Button type="button" onClick={addRow} variant="secondary">
                <Plus size={15} /> Baris Baru
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {showError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{showError}</p> : null}
      {showSuccess ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{showSuccess}</p> : null}

      {/* Mode Form - Add */}
      {mode === "form" && showAdd && editable ? (
        <Card className="border-brand-200">
          <CardHeader title="Tambah Kontrak PKS" />
          <form
            action={async (fd) => {
              await createAction(fd);
              setShowAdd(false);
            }}
            className="space-y-4 px-5 py-4"
          >
            <input type="hidden" name="siteId" value={siteId} />
            {reportId ? <input type="hidden" name="reportId" value={reportId} /> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-no">No. Kontrak</Label>
                <Input id="c-no" name="contractNo" placeholder="cth: 001/PKS/2026" />
              </div>
              <div>
                <Label htmlFor="c-jenis">Jenis PKS</Label>
                <Input id="c-jenis" name="jenisPks" placeholder="cth: Sewa Gedung / Cleaning / ME" />
              </div>
              <div>
                <Label htmlFor="c-date">Tanggal Berakhir *</Label>
                <Input id="c-date" name="endDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="c-pic">PIC</Label>
                <Input id="c-pic" name="picName" placeholder="cth: Raka" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-notes">Keterangan</Label>
                <Textarea id="c-notes" name="notes" placeholder="Catatan kontrak..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createPending}>
                {createPending ? "Menyimpan…" : "Simpan PKS"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* Mode Form - Edit */}
      {mode === "form" && editing && editable ? (
        <Card className="border-brand-200">
          <CardHeader title="Edit Kontrak PKS" />
          <form
            action={async (fd) => {
              await editAction(fd);
              setEditing(null);
            }}
            className="space-y-4 px-5 py-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            {reportId ? <input type="hidden" name="reportId" value={reportId} /> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="e-no">No. Kontrak</Label>
                <Input id="e-no" name="contractNo" defaultValue={editing.contractNo ?? ""} />
              </div>
              <div>
                <Label htmlFor="e-jenis">Jenis PKS</Label>
                <Input id="e-jenis" name="jenisPks" defaultValue={editing.jenisPks ?? ""} />
              </div>
              <div>
                <Label htmlFor="e-date">Tanggal Berakhir *</Label>
                <Input
                  id="e-date"
                  name="endDate"
                  type="date"
                  required
                  defaultValue={
                    typeof editing.endDate === "string"
                      ? editing.endDate.slice(0, 10)
                      : editing.endDate
                      ? new Date(editing.endDate).toISOString().slice(0, 10)
                      : ""
                  }
                />
              </div>
              <div>
                <Label htmlFor="e-pic">PIC</Label>
                <Input id="e-pic" name="picName" defaultValue={editing.picName ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="e-notes">Keterangan</Label>
                <Textarea id="e-notes" name="notes" defaultValue={editing.notes ?? ""} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={editPending}>
                {editPending ? "Menyimpan…" : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* Mode GRID (Editable) */}
      {mode === "grid" && editable ? (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 w-12">No.</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 min-w-[160px]">No. Kontrak</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 min-w-[160px]">Jenis PKS</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 min-w-[140px]">Tanggal Berakhir *</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 min-w-[100px]">Sisa Hari</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 min-w-[110px]">Status</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 min-w-[140px]">PIC</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 min-w-[200px]">Keterangan</th>
                  <th className="px-2 py-2.5 text-left text-xs font-medium text-slate-600 w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gridRows.map((row, idx) => {
                  const sisa = daysUntil(row.endDate);
                  const dateVal = typeof row.endDate === "string"
                    ? row.endDate.slice(0, 10)
                    : row.endDate
                    ? new Date(row.endDate).toISOString().slice(0, 10)
                    : "";

                  return (
                    <tr key={row.id ?? `new-${idx}`} className={!row.id ? "bg-emerald-50/50" : "hover:bg-slate-50"}>
                      <td className="px-2 py-1.5 text-center text-xs text-slate-500">{idx + 1}</td>
                      <td className="px-1.5 py-1.5">
                        <Input
                          placeholder="cth: 001/PKS/2026"
                          value={row.contractNo ?? ""}
                          onChange={(e) => changeField(idx, "contractNo", e.target.value)}
                          className="h-8 text-xs min-w-[150px]"
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Input
                          placeholder="cth: Sewa Gedung / ME"
                          value={row.jenisPks ?? ""}
                          onChange={(e) => changeField(idx, "jenisPks", e.target.value)}
                          className="h-8 text-xs min-w-[150px]"
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Input
                          type="date"
                          required
                          value={dateVal}
                          onChange={(e) => changeField(idx, "endDate", e.target.value)}
                          className="h-8 text-xs min-w-[130px]"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-xs whitespace-nowrap">
                        {sisa === null ? (
                          <span className="text-slate-400">-</span>
                        ) : sisa < 0 ? (
                          <span className="text-red-600 font-medium">{Math.abs(sisa)} hari lalu</span>
                        ) : (
                          `${sisa} hari`
                        )}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {sisa === null ? (
                          <span className="text-slate-400 text-xs">-</span>
                        ) : (
                          <Badge tone={sisa < 0 ? "red" : sisa <= 90 ? "amber" : "green"}>
                            {sisa < 0 ? "EXPIRED" : sisa <= 90 ? "NEAR EXPIRED" : "AKTIF"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Input
                          placeholder="cth: Raka"
                          value={row.picName ?? ""}
                          onChange={(e) => changeField(idx, "picName", e.target.value)}
                          className="h-8 text-xs min-w-[120px]"
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Input
                          placeholder="Catatan kontrak..."
                          value={row.notes ?? ""}
                          onChange={(e) => changeField(idx, "notes", e.target.value)}
                          className="h-8 text-xs min-w-[180px]"
                        />
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <button
                          type="button"
                          title="Hapus baris"
                          onClick={() => removeRow(idx)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button type="button" onClick={addRow} variant="secondary">
                <Plus size={13} /> Baris Baru
              </Button>
              <Button
                type="button"
                onClick={handleBulkSave}
                disabled={bulkPending || isPending || gridRows.length === 0}
              >
                <Save size={14} /> {bulkPending || isPending ? "Menyimpan…" : `Simpan Semua (${gridRows.length} baris)`}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              {gridRows.length} baris{dirty ? " • ada perubahan" : ""}
            </p>
          </div>
        </div>
      ) : null}

      {/* Mode FORM / Read-Only List */}
      {(mode === "form" && !editing && !showAdd) || !editable ? (
        contracts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Tidak ada kontrak PKS untuk site ini.</p>
        ) : (
          <Table
            head={[
              "No.",
              "No. Kontrak",
              "Jenis PKS",
              "Tanggal Berakhir",
              "Sisa Hari",
              "Status",
              "Keterangan",
              "PIC",
              ...(editable ? ["Aksi"] : []),
            ]}
          >
            {contracts.map((c, idx) => {
              const endDate = c.endDate ? new Date(c.endDate) : null;
              const sisa = daysUntil(endDate);
              return (
                <tr key={c.id ?? idx}>
                  <td className="px-4 py-2.5 text-center text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{c.contractNo || "-"}</td>
                  <td className="px-4 py-2.5 text-xs">{c.jenisPks || "-"}</td>
                  <td className="px-4 py-2.5">{endDate ? endDate.toLocaleDateString("id-ID") : "-"}</td>
                  <td className="px-4 py-2.5">
                    {sisa === null ? (
                      "-"
                    ) : sisa < 0 ? (
                      <span className="text-red-600 font-medium">{Math.abs(sisa)} hari lalu</span>
                    ) : (
                      `${sisa} hari`
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {sisa === null ? (
                      "-"
                    ) : (
                      <Badge tone={sisa < 0 ? "red" : sisa <= 90 ? "amber" : "green"}>
                        {sisa < 0 ? "EXPIRED" : sisa <= 90 ? "NEAR EXPIRED" : "AKTIF"}
                      </Badge>
                    )}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 text-slate-500 text-xs">{c.notes || "-"}</td>
                  <td className="px-4 py-2.5 text-xs">{c.picName || "-"}</td>
                  {editable ? (
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          title="Edit Kontrak"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <form action={deletePksContract}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            title="Hapus Kontrak"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </Table>
        )
      ) : null}
    </div>
  );
}
