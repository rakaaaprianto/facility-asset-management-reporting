"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button, Input, Label, Select } from "@/components/ui";

export type ActionFn = (prev: { error?: string; success?: string }, formData: FormData) => Promise<{ error?: string; success?: string }>;

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "password" | "email" | "select" | "file";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
};

export default function InlineForm({
  action,
  fields,
  hidden,
  submitLabel = "Simpan",
  extra,
}: {
  action: ActionFn;
  fields: FieldSpec[];
  hidden?: Record<string, string>;
  submitLabel?: string;
  extra?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      {hidden
        ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      {extra}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => (
          <div key={f.name}>
            <Label htmlFor={`if-${f.name}`}>{f.label}{f.required ? " *" : ""}</Label>
            {f.type === "select" ? (
              <Select id={`if-${f.name}`} name={f.name} required={f.required} defaultValue="">
                <option value="">— pilih —</option>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            ) : (
              <Input
                id={`if-${f.name}`}
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                step={f.step}
                min={f.min}
              />
            )}
          </div>
        ))}
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>{pending ? "…" : submitLabel}</Button>
        </div>
      </div>
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
