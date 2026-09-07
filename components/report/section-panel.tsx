"use client";

import { useActionState, useState, useCallback, useTransition, useEffect, memo } from "react";
import { Pencil, Plus, Trash2, Grid3x3, ClipboardList, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { saveRow, deleteRow, saveRowsBulk, type ActionState } from "@/lib/report-actions";
import { Badge, Button, Card, CardHeader, Input, Label, Select, Table, EmptyRow, Textarea, statusTone } from "@/components/ui";
import type { SectionConfig, SectionField } from "@/lib/section-config";

export type OptionItem = { value: string; label: string };
export type KnownInvoice = {
  invoiceNo: string;
  vendorName?: string;
  serviceType?: string;
  gedungName?: string;
  areaWilayah?: string;
  invoicePeriod?: string;
  amount?: number;
};
type RowRecord = Record<string, unknown> & { id: string };

const initial: ActionState = {};

function fmtDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCell(field: SectionField, value: unknown, optMaps: {
  dynamic: Record<string, OptionItem[]>;
  refs: Record<string, OptionItem[]>;
}): string {
  if (value == null || value === "") return "";
  if (field.type === "checkbox") {
    return value === true || value === "true" || value === 1 || value === "1" ? "✓ Ya" : "—";
  }
  if (field.type === "date") return fmtDate(value);
  if (field.type === "money") {
    const raw = typeof value === "number" ? value : Number(String(value).replace(/\./g, "").replace(/,/g, "."));
    return Number.isNaN(raw) ? String(value) : raw.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  }
  if (field.type === "select" || (field.type === "text" && field.dynamic)) {
    const src = field.dynamic ? optMaps.dynamic[field.dynamic] : undefined;
    const found = src?.find((o) => o.value === value);
    return found ? found.label : String(value);
  }
  if (field.type === "ref" && field.refCategory) {
    const found = optMaps.refs[field.refCategory]?.find((o) => o.value === value);
    return found?.label ?? String(value);
  }
  if (field.type === "number") return Number(value).toLocaleString("id-ID");
  return String(value);
}

function computeField(field: SectionField, row: Record<string, unknown>): string {
  if (!field.computeFrom || field.computeFrom.length === 0) return "";
  
  const parseVal = (v: unknown): number => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return v;
    const clean = String(v).replace(/\./g, "").replace(/,/g, ".");
    return Number(clean) || 0;
  };

  if (field.computeFormula === "divide_multiply") {
    // Formula: (a / b) * 100 — used for utilisasi ruangan and penyerapan anggaran
    const a = parseVal(row[field.computeFrom[0]]);
    const b = parseVal(row[field.computeFrom[1]]);
    if (b === 0) return "0";
    return String(Math.round((a / b) * 100 * 100) / 100); // round to 2 decimals
  }
  if (field.computeFormula === "multiply") {
    const prod = field.computeFrom.reduce((acc, fn, idx) => {
      const val = parseVal(row[fn]);
      return idx === 0 ? val : acc * val;
    }, 0);
    return String(Math.round(prod));
  }
  if (field.computeFormula === "subtract") {
    const a = parseVal(row[field.computeFrom[0]]);
    const b = parseVal(row[field.computeFrom[1]]);
    return String(Math.round((a - b) * 100) / 100);
  }
  const sum = field.computeFrom.reduce((acc, fn) => acc + parseVal(row[fn]), 0);
  return String(sum);
}

function formatMoneyNumber(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return "";
  const num = Number(clean);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("id-ID");
}

function MoneyCellInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  placeholder,
  className,
}: {
  id?: string;
  name?: string;
  value?: unknown;
  defaultValue?: unknown;
  onChange?: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [displayVal, setDisplayVal] = useState<string>(() => formatMoneyNumber(value ?? defaultValue));

  useEffect(() => {
    if (value !== undefined) {
      setDisplayVal(formatMoneyNumber(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMoneyNumber(e.target.value);
    setDisplayVal(formatted);
    if (onChange) {
      onChange(formatted);
    }
  };

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      value={displayVal}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      placeholder={placeholder || "0"}
      className={className}
    />
  );
}

function CellInput({
  field,
  value,
  onChange,
  optMaps,
  disabled,
  wide,
}: {
  field: SectionField;
  value: unknown;
  onChange?: (v: string) => void;
  optMaps: { dynamic: Record<string, OptionItem[]>; refs: Record<string, OptionItem[]> };
  disabled?: boolean;
  wide?: boolean;
}) {
  const id = `f-${field.name}`;
  let strValue = value == null ? "" : String(value);
  if (field.type === "date" && strValue) {
    if (strValue.includes("T")) {
      strValue = strValue.split("T")[0];
    } else if (strValue.length > 10) {
      strValue = strValue.slice(0, 10);
    }
  }
  const cls = wide ? "w-full min-w-[120px]" : undefined;

  if (field.type === "checkbox") {
    const isChecked = strValue === "true" || strValue === "1" || strValue === "on" || strValue === "yes";
    return (
      <div className="flex items-center justify-center py-1">
        <input
          id={id}
          name={field.name}
          type="checkbox"
          value="true"
          checked={onChange || disabled ? isChecked : undefined}
          defaultChecked={!onChange && !disabled ? isChecked : undefined}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.checked ? "true" : "false") : undefined}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
        />
      </div>
    );
  }

  if (field.type === "money") {
    return (
      <MoneyCellInput
        id={id}
        name={field.name}
        value={onChange || disabled ? strValue : undefined}
        defaultValue={!onChange && !disabled ? strValue : undefined}
        onChange={onChange}
        disabled={disabled}
        required={field.required}
        placeholder={field.placeholder || "0"}
        className={cls}
      />
    );
  }

  if (field.type === "textarea") {
    if (wide) {
      return (
        <Input
          id={id}
          name={field.name}
          type="text"
          placeholder={field.placeholder || "Keterangan"}
          value={onChange ? strValue : undefined}
          defaultValue={onChange ? undefined : strValue}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="w-full min-w-[160px]"
        />
      );
    }
    return (
      <Textarea
        id={id}
        name={field.name}
        value={onChange ? strValue : undefined}
        defaultValue={onChange ? undefined : strValue}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cls}
      />
    );
  }
  if (field.type === "select" || (field.type === "text" && field.dynamic)) {
    const opts = field.dynamic ? (optMaps.dynamic[field.dynamic] ?? []) : (field.options ?? []).map((o) => ({ value: o, label: o }));
    return (
      <Select
        id={id}
        name={field.name}
        value={onChange ? strValue : undefined}
        defaultValue={onChange ? undefined : strValue}
        disabled={disabled}
        required={field.required}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cls}
      >
        <option value="">— kosong / belum dipilih —</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    );
  }
  if (field.type === "ref" && field.refCategory) {
    const opts = optMaps.refs[field.refCategory] ?? [];
    return (
      <Select
        id={id}
        name={field.name}
        value={onChange ? strValue : undefined}
        defaultValue={onChange ? undefined : strValue}
        disabled={disabled}
        required={field.required}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cls}
      >
        <option value="">— kosong / belum dipilih —</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    );
  }
  const isInvoiceNoField = field.name === "invoiceNo" || field.name.endsWith("__invoiceNo");
  return (
    <Input
      id={id}
      name={field.name}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      step={field.step}
      placeholder={field.placeholder}
      list={isInvoiceNoField ? "known-invoices-datalist" : undefined}
      value={onChange || disabled ? strValue : undefined}
      defaultValue={!onChange && !disabled ? strValue : undefined}
      disabled={disabled}
      required={field.required}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={cls}
    />
  );
}

const GridRow = memo(function GridRow({
  fields,
  row,
  rowIndex,
  isNew,
  optMaps,
  onChangeField,
  onRemove,
  computeValues,
}: {
  fields: SectionField[];
  row: Record<string, unknown>;
  rowIndex: number;
  isNew: boolean;
  optMaps: { dynamic: Record<string, OptionItem[]>; refs: Record<string, OptionItem[]> };
  onChangeField: (rowIdx: number, fieldName: string, value: string) => void;
  onRemove: (rowIdx: number) => void;
  computeValues: Record<string, string>;
}) {
  return (
    <tr className={isNew ? "bg-emerald-50/50" : "hover:bg-slate-50"}>
      {fields.map((f) => {
        const isCompute = !!f.computeFrom;
        const val = isCompute ? (computeValues[f.name] ?? "") : (row[f.name] ?? "");

        return (
          <td key={f.name} className="px-1.5 py-1.5 bg-white">
            <CellInput
              field={f}
              value={val}
              onChange={isCompute ? undefined : (v) => onChangeField(rowIndex, f.name, v)}
              optMaps={optMaps}
              disabled={isCompute}
              wide
            />
          </td>
        );
      })}
      <td className="px-1.5 py-1.5 whitespace-nowrap bg-white text-center">
        <button
          type="button"
          title="Hapus baris"
          onClick={() => onRemove(rowIndex)}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
});

export default function SectionPanel({
  reportId,
  section,
  rows,
  optMaps,
  editable,
  siteName,
  periodLabel,
  userArea,
  knownInvoices,
}: {
  reportId: string;
  section: SectionConfig;
  rows: RowRecord[];
  optMaps: { dynamic: Record<string, OptionItem[]>; refs: Record<string, OptionItem[]> };
  editable: boolean;
  siteName?: string;
  periodLabel?: string;
  userArea?: string;
  knownInvoices?: KnownInvoice[];
}) {
  const [editing, setEditing] = useState<{ row: RowRecord | null } | null>(null);
  const [state, formAction, pending] = useActionState(saveRow, initial);
  const [bulkState, bulkAction, bulkPending] = useActionState(saveRowsBulk, initial);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"grid" | "form">("grid");

  const displayFields = section.fields;
  const gridFields = section.fields;

  const summaryLabel =
    section.fields.find((f) => f.name === section.summaryField)?.label ?? displayFields[0]?.label ?? "";

  const createDefaultRow = useCallback((index = 0) => {
    const r: Record<string, unknown> = {};
    if (section.fields.some((f) => f.name === "no")) {
      r.no = index + 1;
    }
    if (userArea && section.fields.some((f) => f.name === "areaWilayah")) {
      r.areaWilayah = userArea;
    }
    if (periodLabel && section.fields.some((f) => f.name === "periodeLabel")) {
      r.periodeLabel = periodLabel;
    }
    if (periodLabel && section.fields.some((f) => f.name === "invoicePeriod")) {
      r.invoicePeriod = periodLabel;
    }
    if (siteName && section.fields.some((f) => f.name === "gedungName")) {
      r.gedungName = siteName;
    }
    if (section.fields.some((f) => f.name === "status")) {
      const statusField = section.fields.find((f) => f.name === "status");
      if (statusField?.defaultValue) {
        r.status = statusField.defaultValue;
      }
    }
    return r;
  }, [userArea, periodLabel, siteName, section.fields]);

  const [gridRows, setGridRows] = useState<Record<string, unknown>[]>(() => {
    if (rows.length > 0) {
      return rows.map((r, idx) => ({
        ...r,
        no: r.no ?? (idx + 1),
        areaWilayah: r.areaWilayah || userArea || "",
        periodeLabel: r.periodeLabel || periodLabel || "",
        gedungName: r.gedungName || siteName || "",
      }));
    }
    return [createDefaultRow(0)];
  });

  useEffect(() => {
    setGridRows((prev) => {
      if (rows.length === 0 && prev.length === 1 && (!prev[0].id) && Object.keys(prev[0]).length <= 4) return prev;
      if (rows.length === 0) return [createDefaultRow(0)];
      return rows.map((r, idx) => ({
        ...r,
        no: r.no ?? (idx + 1),
        areaWilayah: r.areaWilayah || userArea || "",
        periodeLabel: r.periodeLabel || periodLabel || "",
        gedungName: r.gedungName || siteName || "",
      }));
    });
  }, [rows, userArea, periodLabel, siteName, createDefaultRow]);

  const [dirty, setDirty] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Pagination for editable grid
  const totalRows = gridRows.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = pageSize === -1 ? 0 : (activePage - 1) * pageSize;
  const endIdx = pageSize === -1 ? totalRows : Math.min(startIdx + pageSize, totalRows);
  const displayedRows = gridRows.slice(startIdx, endIdx);

  // Pagination for readonly grid
  const totalReadonlyRows = rows.length;
  const totalReadonlyPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalReadonlyRows / pageSize));
  const activeReadonlyPage = Math.min(currentPage, totalReadonlyPages);
  const startReadonlyIdx = pageSize === -1 ? 0 : (activeReadonlyPage - 1) * pageSize;
  const endReadonlyIdx = pageSize === -1 ? totalReadonlyRows : Math.min(startReadonlyIdx + pageSize, totalReadonlyRows);
  const displayedReadonlyRows = rows.slice(startReadonlyIdx, endReadonlyIdx);

  const computeValuesForRow = useCallback(
    (row: Record<string, unknown>) => {
      const result: Record<string, string> = {};
      for (const f of gridFields) {
        if (f.computeFrom) {
          result[f.name] = computeField(f, row);
        }
      }
      return result;
    },
    [gridFields]
  );

  const addRow = useCallback(() => {
    setGridRows((prev) => {
      const next = [...prev, createDefaultRow(prev.length)];
      if (pageSize !== -1) {
        const nextTotalPages = Math.ceil(next.length / pageSize);
        setCurrentPage(nextTotalPages);
      }
      return next;
    });
    setDirty(true);
  }, [createDefaultRow, pageSize]);

  const removeRow = useCallback((idx: number) => {
    const row = gridRows[idx];
    if (row?.id) {
      const fd = new FormData();
      fd.append("__reportId", reportId);
      fd.append("__section", section.key);
      fd.append("__rowId", row.id as string);
      deleteRow(fd);
    }
    setGridRows((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }, [gridRows, reportId, section.key]);

  const changeField = useCallback((rowIdx: number, fieldName: string, value: string) => {
    setGridRows((prev) => {
      const next = [...prev];
      const updatedRow = { ...next[rowIdx], [fieldName]: value };

      // Auto-fill common fields when typing invoiceNo in Invoice sections
      if (fieldName === "invoiceNo" && knownInvoices && knownInvoices.length > 0 && value.trim()) {
        const match = knownInvoices.find(
          (inv) => inv.invoiceNo.trim().toLowerCase() === value.trim().toLowerCase()
        );
        if (match) {
          if (match.vendorName) updatedRow.vendorName = match.vendorName;
          if (match.serviceType) updatedRow.serviceType = match.serviceType;
          if (match.gedungName) updatedRow.gedungName = match.gedungName;
          if (match.areaWilayah) updatedRow.areaWilayah = match.areaWilayah;
          if (match.invoicePeriod) updatedRow.invoicePeriod = match.invoicePeriod;
          if (match.amount != null && match.amount > 0) updatedRow.amount = match.amount;
        }
      }

      next[rowIdx] = updatedRow;
      return next;
    });
    setDirty(true);
  }, [knownInvoices]);

  function closeForm() {
    setEditing(null);
  }

  function handleBulkSave() {
    setClientError(null);
    
    // Client-side validation: Check all required fields across all rows
    for (let i = 0; i < gridRows.length; i++) {
      const r = gridRows[i];
      const hasAnyData = Object.entries(r).some(
        ([k, v]) => k !== "id" && k !== "areaWilayah" && v !== undefined && v !== null && String(v).trim() !== ""
      );

      // Validate if row has data, or is an existing row, or is the single active row
      if (hasAnyData || r.id || gridRows.length === 1) {
        for (const f of gridFields) {
          if (f.computeFrom) continue;
          if (f.required) {
            const val = r[f.name];
            if (val === undefined || val === null || String(val).trim() === "") {
              const errMsg = `Kolom "${f.label}" wajib diisi pada baris ke-${i + 1}.`;
              setClientError(errMsg);
              alert(`⚠️ Peringatan:\n${errMsg}`);
              return;
            }
          }
        }
      }
    }

    const payload = gridRows.map((r) => {
      const id = r.id as string | undefined;
      const data: Record<string, unknown> = {};
      const cv = computeValuesForRow(r);
      for (const [k, v] of Object.entries(r)) {
        if (k === "id") continue;
        if (v !== null && v !== undefined && v !== "") data[k] = v;
      }
      for (const [k, v] of Object.entries(cv)) {
        if (v !== "" && v !== undefined && v !== null) data[k] = v;
      }
      return { id, data };
    });
    const fd = new FormData();
    fd.append("__reportId", reportId);
    fd.append("__section", section.key);
    fd.append("__rows", JSON.stringify(payload));
    startTransition(() => {
      bulkAction(fd);
    });
  }

  const showSuccess = bulkState.success || state.success;
  const showError = clientError || bulkState.error || state.error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{section.title}</h3>
        </div>
        {editable ? (
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-slate-200 bg-white text-xs">
              <button
                type="button"
                onClick={() => setMode("grid")}
                className={`flex items-center gap-1 rounded-l-md px-2.5 py-1.5 transition ${mode === "grid" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Grid3x3 size={13} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setMode("form")}
                className={`flex items-center gap-1 rounded-r-md px-2.5 py-1.5 transition ${mode === "form" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <ClipboardList size={13} /> Form
              </button>
            </div>
            {mode === "form" ? (
              <Button type="button" onClick={() => setEditing({ row: null })}>
                <Plus size={15} /> Tambah Baris
              </Button>
            ) : (
              <Button type="button" onClick={addRow} variant="secondary">
                <Plus size={15} /> Baris Baru
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {showError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{showError}</p>
      ) : null}
      {showSuccess ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{showSuccess}</p>
      ) : null}

      {editable && editing ? (
        <Card>
          <CardHeader title={editing.row ? "Edit Baris" : "Tambah Baris"} />
          <form action={formAction} onReset={closeForm} className="space-y-4 px-5 py-4">
            <input type="hidden" name="__reportId" value={reportId} />
            <input type="hidden" name="__section" value={section.key} />
            {editing.row ? <input type="hidden" name="__rowId" value={editing.row.id} /> : null}
            {/* Context fields info banner - removed, fields are now editable inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((f) => {
                const isCompute = !!f.computeFrom;
                const val = isCompute
                  ? computeField(f, editing.row ?? {})
                  : editing.row?.[f.name];
                return (
                  <div key={f.name} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
                    <Label htmlFor={`f-${f.name}`}>
                      {f.label}
                      {f.required ? " *" : ""}
                    </Label>
                    <CellInput field={f} value={val} optMaps={optMaps} disabled={isCompute} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="reset" variant="secondary">Batal</Button>
              <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {mode === "grid" && editable ? (
        <div className="space-y-3">
          <div className="overflow-auto max-h-[600px] rounded-lg border border-slate-200 shadow-inner relative">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <tr>
                  {gridFields.map((f) => (
                    <th
                      key={f.name}
                      className="sticky top-0 z-20 bg-slate-100 px-2.5 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap border-b border-slate-300"
                    >
                      {f.label}{f.required ? " *" : ""}
                    </th>
                  ))}
                  <th className="sticky top-0 z-20 bg-slate-100 px-2 py-2.5 text-center text-xs font-semibold text-slate-700 w-12 border-b border-slate-300">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={gridFields.length + 1} className="px-4 py-8 text-center text-sm text-slate-400 bg-white">
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, relIdx) => {
                    const actualIdx = startIdx + relIdx;
                    const cv = computeValuesForRow(row);
                    return (
                      <GridRow
                        key={(row.id as string) ?? `new-${actualIdx}`}
                        fields={gridFields}
                        row={row}
                        rowIndex={actualIdx}
                        isNew={!row.id}
                        optMaps={optMaps}
                        onChangeField={changeField}
                        onRemove={removeRow}
                        computeValues={cv}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalRows > 25 || totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-500">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                  <option value={-1}>Semua baris ({totalRows})</option>
                </select>
                <span className="text-slate-300">|</span>
                <span>
                  Menampilkan <strong className="text-slate-800">{totalRows === 0 ? 0 : startIdx + 1}</strong> – <strong className="text-slate-800">{endIdx}</strong> dari <strong className="text-slate-800">{totalRows}</strong> baris
                </span>
              </div>

              {pageSize !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activePage <= 1}
                    className="flex items-center gap-0.5 rounded border border-slate-300 bg-white px-2 py-1 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span className="px-1.5 font-semibold text-slate-700">
                    Hal {activePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage >= totalPages}
                    className="flex items-center gap-0.5 rounded border border-slate-300 bg-white px-2 py-1 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button type="button" onClick={addRow} variant="secondary">
                <Plus size={13} /> Baris Baru
              </Button>
              <Button type="button" onClick={handleBulkSave} disabled={bulkPending || isPending || gridRows.length === 0}>
                <Save size={14} /> {bulkPending || isPending ? "Menyimpan…" : `Simpan Semua (${gridRows.length} baris)`}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Total {gridRows.length} baris{dirty ? " • ada perubahan belum disimpan" : ""}
            </p>
          </div>
        </div>
      ) : null}

      {mode === "grid" && !editable ? (
        <div className="space-y-3">
          <div className="overflow-auto max-h-[600px] rounded-lg border border-slate-200 shadow-inner relative">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <tr>
                  {gridFields.map((f) => (
                    <th
                      key={f.name}
                      className="sticky top-0 z-20 bg-slate-100 px-4 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap border-b border-slate-300"
                    >
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.length === 0 ? (
                  <tr><td colSpan={gridFields.length} className="px-4 py-8 text-center text-sm text-slate-400 bg-white">Belum ada data.</td></tr>
                ) : (
                  displayedReadonlyRows.map((row) => {
                    const cv = computeValuesForRow(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        {gridFields.map((f) => {
                          let raw: unknown;
                          if (f.computeFrom) {
                            raw = cv[f.name] ?? "";
                          } else {
                            raw = row[f.name];
                          }

                          let content: React.ReactNode;
                          if (f.name === "status" || f.name === "severity" || f.name === "probability" || f.name === "impact" || f.name === "assetStatus") {
                            const v = String(raw ?? "");
                            const tone = statusTone[v] ?? (v === "LOW" ? "green" : v === "MEDIUM" ? "amber" : v === "HIGH" || v === "CRITICAL" ? "red" : "gray");
                            content = v ? <Badge tone={tone}>{v.replace(/_/g, " ")}</Badge> : "";
                          } else {
                            content = <span>{fmtCell(f, raw, optMaps)}</span>;
                          }
                          return (
                            <td key={f.name} className="max-w-[240px] truncate px-4 py-2.5 text-sm bg-white">
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalReadonlyRows > 25 || totalReadonlyPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-500">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                  <option value={-1}>Semua baris ({totalReadonlyRows})</option>
                </select>
                <span className="text-slate-300">|</span>
                <span>
                  Menampilkan <strong className="text-slate-800">{totalReadonlyRows === 0 ? 0 : startReadonlyIdx + 1}</strong> – <strong className="text-slate-800">{endReadonlyIdx}</strong> dari <strong className="text-slate-800">{totalReadonlyRows}</strong> baris
                </span>
              </div>
              {pageSize !== -1 && totalReadonlyPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activeReadonlyPage <= 1}
                    className="flex items-center gap-0.5 rounded border border-slate-300 bg-white px-2 py-1 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span className="px-1.5 font-semibold text-slate-700">
                    Hal {activeReadonlyPage} / {totalReadonlyPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalReadonlyPages, p + 1))}
                    disabled={activeReadonlyPage >= totalReadonlyPages}
                    className="flex items-center gap-0.5 rounded border border-slate-300 bg-white px-2 py-1 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "form" && !editing ? (
        <div className="overflow-x-auto">
          <Table head={[...displayFields.map((f) => f.label), ...(editable ? ["Aksi"] : [])]}>
            {rows.length === 0 ? (
              <EmptyRow colSpan={displayFields.length + (editable ? 1 : 0)} />
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {displayFields.map((f) => {
                    let raw: unknown;
                    if (f.computeFrom) {
                      raw = computeField(f, row);
                    } else {
                      raw = row[f.name];
                    }

                    let content: React.ReactNode;
                    if (f.name === "status" || f.name === "severity" || f.name === "probability" || f.name === "impact" || f.name === "assetStatus") {
                      const v = String(raw ?? "");
                      const tone = statusTone[v] ?? (v === "LOW" ? "green" : v === "MEDIUM" ? "amber" : v === "HIGH" || v === "CRITICAL" ? "red" : "gray");
                      content = v ? <Badge tone={tone}>{v.replace(/_/g, " ")}</Badge> : "";
                    } else {
                      content = <span>{fmtCell(f, raw, optMaps)}</span>;
                    }
                    return (
                      <td key={f.name} className="max-w-[240px] truncate px-4 py-2.5 text-sm">
                        {content}
                      </td>
                    );
                  })}
                  {editable ? (
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => setEditing({ row })}
                          className="rounded p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                        >
                          <Pencil size={15} />
                        </button>
                        <form
                          action={async (fd) => {
                            await deleteRow(fd);
                            setEditing(null);
                          }}
                        >
                          <input type="hidden" name="__reportId" value={reportId} />
                          <input type="hidden" name="__section" value={section.key} />
                          <input type="hidden" name="__rowId" value={row.id} />
                          <button type="submit" title="Hapus" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={15} />
                          </button>
                        </form>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </Table>
        </div>
      ) : null}

      {!editable && rows.length === 0 ? (
        <p className="text-xs text-slate-400">Belum diisi.</p>
      ) : null}
      <p className="sr-only">{summaryLabel}</p>

      {knownInvoices && knownInvoices.length > 0 ? (
        <datalist id="known-invoices-datalist">
          {knownInvoices.map((inv) => (
            <option
              key={inv.invoiceNo}
              value={inv.invoiceNo}
              label={`${inv.vendorName}${inv.serviceType ? ` • ${inv.serviceType}` : ""}${inv.amount ? ` • Rp ${Number(inv.amount).toLocaleString("id-ID")}` : ""}`}
            />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
