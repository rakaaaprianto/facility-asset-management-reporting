"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, Globe, MapPin, Building2, X, CheckCircle2 } from "lucide-react";
import { Button, Card, CardHeader, Select, Label } from "@/components/ui";

export type ExportRegion = {
  id: string;
  name: string;
};

export type ExportSite = {
  id: string;
  code: string;
  name: string;
  reportId?: string;
};

export default function ExportDialog({
  year,
  month,
  monthName,
  regions,
  sites,
}: {
  year: number;
  month: number;
  monthName: string;
  regions: ExportRegion[];
  sites: ExportSite[];
}) {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<"all" | "region" | "site">("all");
  const [selectedRegionId, setSelectedRegionId] = useState(regions[0]?.id ?? "");
  const [selectedSiteReportId, setSelectedSiteReportId] = useState(
    sites.find((s) => s.reportId)?.reportId ?? ""
  );
  const [downloading, setDownloading] = useState(false);

  const existingSites = sites.filter((s) => s.reportId);

  function handleDownload() {
    setDownloading(true);
    let url = "";

    if (exportType === "all") {
      url = `/api/export/monthly?year=${year}&month=${month}`;
    } else if (exportType === "region") {
      url = `/api/export/monthly?year=${year}&month=${month}&regionId=${selectedRegionId}`;
    } else if (exportType === "site") {
      if (!selectedSiteReportId) {
        alert("Pilih site yang memiliki laporan terlebih dahulu.");
        setDownloading(false);
        return;
      }
      url = `/api/reports/${selectedSiteReportId}/export`;
    }

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      setOpen(false);
    }, 1500);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-700 font-medium"
      >
        <FileSpreadsheet size={16} className="text-emerald-600" /> Export Excel
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Export Laporan ke Excel</h3>
                  <p className="text-xs text-slate-500">
                    Periode: {monthName} {year}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pilih Cakupan Export:
              </p>

              {/* Option 1: All Regions (National Consolidated) */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
                  exportType === "all"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === "all"}
                  onChange={() => setExportType("all")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Globe size={15} className="text-emerald-600" />
                    Export Gabungan Nasional (Semua Wilayah)
                  </div>
                  <p className="mt-1 text-slate-500">
                    Menyatukan seluruh data 23 site dari seluruh wilayah ke dalam 1 file Excel master
                    lengkap dengan 25 sheet.
                  </p>
                </div>
              </label>

              {/* Option 2: Per Region / Area */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
                  exportType === "region"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="region"
                  checked={exportType === "region"}
                  onChange={() => setExportType("region")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin size={15} className="text-emerald-600" />
                    Export Per Wilayah (Area Tertentu)
                  </div>
                  <p className="mt-1 text-slate-500">
                    Menggabungkan seluruh site yang berada di wilayah/area yang Anda pilih.
                  </p>

                  {exportType === "region" ? (
                    <div className="mt-3">
                      <Label htmlFor="sel-reg" className="text-xs text-slate-700">
                        Pilih Wilayah:
                      </Label>
                      <Select
                        id="sel-reg"
                        value={selectedRegionId}
                        onChange={(e) => setSelectedRegionId(e.target.value)}
                        className="mt-1 h-9 text-xs"
                      >
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : null}
                </div>
              </label>

              {/* Option 3: Per Site Individual */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
                  exportType === "site"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="site"
                  checked={exportType === "site"}
                  onChange={() => setExportType("site")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Building2 size={15} className="text-emerald-600" />
                    Export Per Site Individual (Single Site)
                  </div>
                  <p className="mt-1 text-slate-500">
                    Mengunduh workbook Excel khusus untuk 1 site yang dipilih.
                  </p>

                  {exportType === "site" ? (
                    <div className="mt-3">
                      <Label htmlFor="sel-site" className="text-xs text-slate-700">
                        Pilih Site:
                      </Label>
                      <Select
                        id="sel-site"
                        value={selectedSiteReportId}
                        onChange={(e) => setSelectedSiteReportId(e.target.value)}
                        className="mt-1 h-9 text-xs"
                      >
                        {existingSites.length === 0 ? (
                          <option value="">— Belum ada laporan terisi pada bulan ini —</option>
                        ) : (
                          existingSites.map((s) => (
                            <option key={s.id} value={s.reportId}>
                              [{s.code}] {s.name}
                            </option>
                          ))
                        )}
                      </Select>
                    </div>
                  ) : null}
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
                disabled={downloading || (exportType === "site" && !selectedSiteReportId)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Download size={15} />
                {downloading ? "Menyiapkan File Excel…" : "Unduh File Excel"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
