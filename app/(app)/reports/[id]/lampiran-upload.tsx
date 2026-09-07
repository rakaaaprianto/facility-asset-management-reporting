"use client";

import { useActionState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadAttachment, type FormState } from "@/lib/attachment-actions";
import { Button, Input } from "@/components/ui";

const initial: FormState = {};

export default function UploadForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(uploadAttachment, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <Input name="file" type="file" className="max-w-xs" />
      <Button type="submit" disabled={pending}>
        <UploadCloud size={15} /> {pending ? "Mengunggah…" : "Unggah"}
      </Button>
      {state.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-600">{state.success}</span> : null}
    </form>
  );
}
