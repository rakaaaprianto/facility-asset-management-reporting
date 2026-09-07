"use client";

import { useActionState } from "react";
import { createReport, type ActionState } from "@/lib/report-actions";
import { Button, Input, Label, Select } from "@/components/ui";
import type { OptionItem } from "@/lib/report-service";

const initial: ActionState = {};
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function NewReportForm({
  sites,
  defaultSite,
  year,
  month,
}: {
  sites: OptionItem[];
  defaultSite?: string;
  year: number;
  month: number;
}) {
  const [state, formAction, pending] = useActionState(createReport, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="siteId">Site *</Label>
        <Select id="siteId" name="siteId" defaultValue={defaultSite ?? ""} required>
          <option value="">— pilih site —</option>
          {sites.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="month_display">Bulan *</Label>
          {/* Disabled for display only — value submitted via hidden input */}
          <Select id="month_display" defaultValue={String(month)} disabled>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Select>
          <input type="hidden" name="month" value={month} />
          <p className="mt-1 text-xs text-slate-400">Bulan laporan otomatis (tidak dapat diubah)</p>
        </div>
        <div>
          <Label htmlFor="year_display">Tahun *</Label>
          {/* Disabled for display only — value submitted via hidden input */}
          <Input id="year_display" type="number" defaultValue={year} disabled />
          <input type="hidden" name="year" value={year} />
          <p className="mt-1 text-xs text-slate-400">Tahun laporan otomatis (tidak dapat diubah)</p>
        </div>
      </div>
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Membuat…" : "Buat Laporan"}
      </Button>
    </form>
  );
}
