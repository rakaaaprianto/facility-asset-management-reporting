"use client";

import { useState, useActionState, useTransition } from "react";
import Link from "next/link";
import { Trash2, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { Badge, Button, Card, CardHeader, Table, EmptyRow, statusTone } from "@/components/ui";
import { deleteReportsBulk, deleteReportsByMonth, type ActionState } from "@/lib/report-actions";
import DeleteReportButton from "./delete-report-button";
import { useTranslation } from "@/lib/i18n/language-context";

export type ReportItem = {
  id: string;
  status: string;
  updatedAt: string | Date | null;
  site: {
    id: string;
    code: string;
    name: string;
  };
};

export type SiteItem = {
  id: string;
  code: string;
  name: string;
};

const initial: ActionState = {};

export default function ReportsBulkManager({
  sites,
  reports,
  year,
  month,
  monthName,
  isSuperAdminOrAdmin,
}: {
  sites: SiteItem[];
  reports: ReportItem[];
  year: number;
  month: number;
  monthName: string;
  isSuperAdminOrAdmin: boolean;
}) {
  const { t, locale } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkState, bulkAction, bulkPending] = useActionState(deleteReportsBulk, initial);
  const [monthState, monthAction, monthPending] = useActionState(deleteReportsByMonth, initial);
  const [isPending, startTransition] = useTransition();

  const reportMap = new Map(reports.map((r) => [r.site.id, r]));
  const existingReportIds = reports.map((r) => r.id);

  const isAllSelected =
    existingReportIds.length > 0 && existingReportIds.every((id) => selectedIds.includes(id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...existingReportIds]);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const msg = locale === "en"
      ? `⚠️ WARNING:\n\nAre you sure you want to delete ${selectedIds.length} selected reports?\n\nAll associated sections & attachments will be permanently deleted and cannot be recovered.`
      : `⚠️ PERINGATAN:\n\nApakah Anda yakin ingin menghapus ${selectedIds.length} laporan terpilih?\n\nSemua data section & lampiran terkait akan terhapus permanen dan tidak dapat dikembalikan.`;
    if (!confirm(msg)) return;

    const fd = new FormData();
    fd.append("reportIds", JSON.stringify(selectedIds));
    startTransition(async () => {
      await bulkAction(fd);
      setSelectedIds([]);
    });
  }

  function handleDeleteMonth() {
    if (reports.length === 0) {
      alert(locale === "en" ? "No reports found for this month to delete." : "Tidak ada laporan pada bulan ini untuk dihapus.");
      return;
    }
    const msg = locale === "en"
      ? `🚨 WARNING DELETE ALL REPORTS THIS MONTH:\n\nYou will permanently delete ALL (${reports.length}) reports for period:\n📅 ${monthName} ${year}\n\nAll sheet data, entries, and attachments across all sites for this month will be PERMANENTLY REMOVED!\n\nClick OK if you are completely sure you want to proceed.`
      : `🚨 PERINGATAN HAPUS SEKALIGUS BULAN INI:\n\nAnda akan menghapus SEMUA (${reports.length}) laporan pada periode:\n📅 ${monthName} ${year}\n\nSemua data sheet, isian, dan lampiran di seluruh site pada bulan ini akan DIHAPUS PERMANEN!\n\nKetik 'OK' atau klik OK jika Anda benar-benar yakin ingin melanjutkan.`;
    if (!confirm(msg)) return;

    const fd = new FormData();
    fd.append("year", String(year));
    fd.append("month", String(month));
    startTransition(async () => {
      await monthAction(fd);
      setSelectedIds([]);
    });
  }

  const showSuccess = bulkState.success || monthState.success;
  const showError = bulkState.error || monthState.error;

  return (
    <div className="space-y-4">
      {showError ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{showError}</p>
      ) : null}
      {showSuccess ? (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {showSuccess}
        </p>
      ) : null}

      {/* Action bar for bulk delete */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {existingReportIds.length > 0 ? (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-600 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare size={16} className="text-brand-600" />
              ) : (
                <Square size={16} className="text-slate-400" />
              )}
              {isAllSelected ? t.common.deselectAll : t.common.selectAll}
            </button>
          ) : null}

          {selectedIds.length > 0 ? (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {selectedIds.length} {t.common.selectedCount}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 ? (
            <Button
              type="button"
              variant="danger"
              onClick={handleBulkDelete}
              disabled={bulkPending || isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 size={14} />{" "}
              {bulkPending || isPending
                ? t.common.deleting
                : `${t.common.deleteSelected} (${selectedIds.length})`}
            </Button>
          ) : null}

          {isSuperAdminOrAdmin && reports.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteMonth}
              disabled={monthPending || isPending}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 text-xs"
            >
              <AlertTriangle size={13} className="text-red-500" />{" "}
              {monthPending || isPending
                ? t.common.deleting
                : `${t.reports.deleteMonthReports} (${reports.length})`}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader
          title={
            locale === "en"
              ? `Status of ${sites.length} Sites (${reports.length} filled)`
              : `Status ${sites.length} Site (${reports.length} terisi)`
          }
          description={t.reports.clickRowHint}
        />
        <Table
          head={[
            ...(existingReportIds.length > 0 ? [""] : []),
            t.common.site,
            t.common.siteName,
            t.common.status,
            t.common.lastModified,
            t.common.actions,
          ]}
        >
          {sites.length === 0 ? (
            <EmptyRow colSpan={6} label={t.reports.noAccessibleSites} />
          ) : (
            sites.map((s) => {
              const r = reportMap.get(s.id);
              const isSelected = r ? selectedIds.includes(r.id) : false;

              return (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50 transition ${
                    isSelected ? "bg-red-50/40" : ""
                  }`}
                >
                  {existingReportIds.length > 0 ? (
                    <td className="px-3 py-2.5 text-center w-8">
                      {r ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(r.id)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      ) : (
                        <span className="inline-block w-4" />
                      )}
                    </td>
                  ) : null}
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{s.code}</td>
                  <td className="px-4 py-2.5 text-slate-700">{s.name}</td>
                  <td className="px-4 py-2.5">
                    {r ? (
                      <Badge tone={statusTone[r.status]}>
                        {t.status[r.status as keyof typeof t.status] ?? r.status}
                      </Badge>
                    ) : (
                      <Badge>{t.status.NOT_CREATED}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {r?.updatedAt
                      ? new Date(r.updatedAt).toLocaleString(locale === "en" ? "en-US" : "id-ID", { timeZone: "Asia/Jakarta" }) + " WIB"
                      : "-"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {r ? (
                        <>
                          <Link
                            href={`/reports/${r.id}`}
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            {t.common.open}
                          </Link>
                          <DeleteReportButton
                            reportId={r.id}
                            confirmText={
                              locale === "en"
                                ? `Delete report for ${s.code} (${monthName} ${year})? All sections & attachments will be lost.`
                                : `Hapus laporan ${s.code} ${monthName} ${year}? Semua data section & lampiran ikut terhapus dan tidak dapat dikembalikan.`
                            }
                          />
                        </>
                      ) : (
                        <Link
                          href={`/reports/new?site=${s.id}&year=${year}&month=${month}`}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          {t.common.create}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      </Card>
    </div>
  );
}
