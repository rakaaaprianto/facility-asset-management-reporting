"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Card, CardHeader, Input, Label, Select, Table, EmptyRow } from "@/components/ui";
import type { ActionFn, FieldSpec } from "@/components/admin/inline-form";

export type CrudItem = Record<string, unknown> & { id: string };

function initialFor(fields: FieldSpec[], item?: CrudItem): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = item?.[f.name];
    out[f.name] = v == null ? "" : String(v);
  }
  return out;
}

function FieldInputs({
  fields,
  values,
  idPrefix,
}: {
  fields: FieldSpec[];
  values: Record<string, string>;
  idPrefix: string;
}) {
  return (
    <>
      {fields.map((f) => (
        <div key={f.name}>
          <Label htmlFor={`${idPrefix}-${f.name}`}>{f.label}{f.required ? " *" : ""}</Label>
          {f.type === "select" ? (
            <Select id={`${idPrefix}-${f.name}`} name={f.name} required={f.required} defaultValue={values[f.name] ?? ""}>
              <option value="">— pilih —</option>
              {(f.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          ) : (
            <Input
              id={`${idPrefix}-${f.name}`}
              name={f.name}
              type={f.type ?? "text"}
              required={f.required}
              placeholder={f.placeholder}
              step={f.step}
              defaultValue={values[f.name] ?? ""}
            />
          )}
        </div>
      ))}
    </>
  );
}

export default function CrudCard({
  title,
  description,
  items,
  columns,
  createFields,
  editFields,
  createAction,
  updateAction,
  deleteAction,
}: {
  title: string;
  description?: string;
  items: CrudItem[];
  columns: Array<{ key: string; label: string }>;
  createFields: FieldSpec[];
  editFields: FieldSpec[];
  createAction: ActionFn;
  updateAction: ActionFn;
  deleteAction: ActionFn;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editingId ? items.find((i) => i.id === editingId) : undefined;

  return (
    <Card>
      <CardHeader title={`${title} (${items.length})`} description={description} />

      {editing ? (
        <div className="border-b border-brand-100 bg-brand-50 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-700">Edit: {String(editing[columns[0]?.key] ?? editing.id)}</p>
            <button type="button" onClick={() => setEditingId(null)} className="rounded p-1 text-slate-500 hover:bg-white">
              <X size={16} />
            </button>
          </div>
          <EditForm
            key={editing.id}
            action={updateAction}
            fields={editFields}
            item={editing}
            onDone={() => setEditingId(null)}
          />
        </div>
      ) : null}

      <Table head={[...columns.map((c) => c.label), "Aksi"]}>
        {items.length === 0 ? (
          <EmptyRow colSpan={columns.length + 1} />
        ) : (
          items.map((item) => (
            <tr key={item.id} className={item.id === editingId ? "bg-brand-50" : "hover:bg-slate-50"}>
              {columns.map((c) => (
                <td key={c.key} className="max-w-[240px] truncate px-4 py-2">
                  {item[c.key] == null || item[c.key] === "" ? "-" : String(item[c.key])}
                </td>
              ))}
              <td className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => setEditingId(item.id)}
                    className="rounded p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Pencil size={15} />
                  </button>
                  <DeleteButton action={deleteAction} id={item.id} />
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      <div className="border-t border-slate-100 px-5 py-4">
        <CreateForm action={createAction} fields={createFields} />
      </div>
    </Card>
  );
}

function CreateForm({ action, fields }: { action: ActionFn; fields: FieldSpec[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FieldInputs fields={fields} values={{}} idPrefix="create" />
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>
            <Plus size={15} /> {pending ? "…" : "Tambah"}
          </Button>
        </div>
      </div>
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}

function EditForm({
  action,
  fields,
  item,
  onDone,
}: {
  action: ActionFn;
  fields: FieldSpec[];
  item: CrudItem;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={item.id} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FieldInputs fields={fields} values={initialFor(fields, item)} idPrefix={`edit-${item.id}`} />
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={pending}>{pending ? "…" : "Simpan Perubahan"}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Batal</Button>
        </div>
      </div>
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">{state.error}</p> : null}
    </form>
  );
}

function DeleteButton({ action, id }: { action: ActionFn; id: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <div className="inline-flex items-center">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm("Yakin hapus data ini? Tindakan tidak dapat dibatalkan.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          title="Hapus"
          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={15} />
        </button>
      </form>
      {state.error ? (
        <span className="ml-1 text-[11px] text-red-600" title={state.error}>
          ⚠️ {state.error}
        </span>
      ) : null}
    </div>
  );
}
