"use client";

import { deleteReport } from "@/lib/report-actions";

export default function DeleteReportButton({
  reportId,
  confirmText,
  className = "text-sm font-medium text-slate-400 hover:text-red-600",
  children = "Hapus",
}: {
  reportId: string;
  confirmText: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={deleteReport}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="reportId" value={reportId} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
