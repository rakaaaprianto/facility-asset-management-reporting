"use client";

import { useActionState } from "react";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";
import { reviewReport, submitReport, type ActionState } from "@/lib/report-actions";
import { Button, Label, Textarea } from "@/components/ui";

const initial: ActionState = {};

export function SubmitReportForm({ reportId }: { reportId: string }) {
  return (
    <form
      action={submitReport}
      onSubmit={(e) => {
        if (!confirm("Submit laporan untuk direview HQ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="reportId" value={reportId} />
      <Button type="submit">
        <Send size={15} /> Submit ke HQ
      </Button>
    </form>
  );
}

export function ReviewForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(reviewReport, initial);

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="reportId" value={reportId} />
        <input type="hidden" name="decision" value="NEEDS_REVISION" />
        <div>
          <Label htmlFor="rev-note">Catatan revisi (wajib bila minta revisi)</Label>
          <Textarea id="rev-note" name="note" rows={2} placeholder="Tuliskan bagian yang perlu diperbaiki…" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="danger" disabled={pending}>
            <RotateCcw size={15} /> Minta Revisi
          </Button>
        </div>
      </form>
      <form action={formAction}>
        <input type="hidden" name="reportId" value={reportId} />
        <input type="hidden" name="decision" value="APPROVED" />
        <Button
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (!confirm("Setujui & kunci laporan ini?")) e.preventDefault();
          }}
        >
          <CheckCircle2 size={15} /> Setujui & Kunci
        </Button>
      </form>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
    </div>
  );
}
