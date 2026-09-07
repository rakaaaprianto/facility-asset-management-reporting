import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, CardHeader } from "@/components/ui";
import CrudCard, { type CrudItem } from "@/components/admin/crud-card";
import InlineForm from "@/components/admin/inline-form";
import {
  createRegion, updateRegion, deleteRegion,
  createSite, updateSite, deleteSite,
  createRefOption, deleteRefOption,
} from "@/lib/admin-actions";

export const metadata = { title: "Master Data" };

function toItems(rows: Array<Record<string, unknown>>): CrudItem[] {
  return rows.map((r) => ({ ...r, id: String(r.id) }));
}

export default async function MasterPage() {
  await requirePermission("site:manage");

  const [regions, sites, refOptions] = await Promise.all([
    db.region.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, sortOrder: true } }),
    db.site.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true, city: true, regionId: true } }),
    db.refOption.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
  ]);

  const regionOpts = regions.map((r) => ({ value: r.id, label: r.name }));

  const siteRows = sites.map((s) => ({
    ...s,
    regionName: regions.find((r) => r.id === s.regionId)?.name ?? "-",
  }));

  const refGroups = new Map<string, typeof refOptions>();
  for (const o of refOptions) {
    if (!refGroups.has(o.category)) refGroups.set(o.category, []);
    refGroups.get(o.category)!.push(o);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Master Data</h1>
        <p className="text-sm text-slate-500">
          Kelola daftar wilayah, site/gedung kantor, dan opsi referensi. Klik ikon pensil untuk mengubah, tong sampah untuk menghapus.
        </p>
      </div>

      <CrudCard
        title="Wilayah"
        description={`Total ${regions.length} wilayah terdaftar.`}
        items={toItems(regions)}
        columns={[
          { key: "name", label: "Nama Wilayah" },
          { key: "sortOrder", label: "Urutan" },
        ]}
        createFields={[
          { name: "name", label: "Nama Wilayah", required: true, placeholder: "WILAYAH 6" },
        ]}
        editFields={[
          { name: "name", label: "Nama Wilayah", required: true },
        ]}
        createAction={createRegion}
        updateAction={updateRegion}
        deleteAction={deleteRegion}
      />

      <CrudCard
        title="Site / Gedung"
        description={`Total ${sites.length} lokasi kantor terdaftar.`}
        items={toItems(siteRows)}
        columns={[
          { key: "code", label: "Kode" },
          { key: "name", label: "Nama Site / Gedung" },
          { key: "city", label: "Kota" },
          { key: "regionName", label: "Wilayah" },
        ]}
        createFields={[
          { name: "code", label: "Kode Site", required: true, placeholder: "JKT-01" },
          { name: "name", label: "Nama Site / Gedung", required: true, placeholder: "Gedung Infomedia Fatmawati" },
          { name: "city", label: "Kota", required: true, placeholder: "Jakarta Selatan" },
          { name: "regionId", label: "Wilayah", type: "select", options: regionOpts },
        ]}
        editFields={[
          { name: "code", label: "Kode Site", required: true },
          { name: "name", label: "Nama Site / Gedung", required: true },
          { name: "city", label: "Kota", required: true },
          { name: "regionId", label: "Wilayah", type: "select", options: regionOpts },
        ]}
        createAction={createSite}
        updateAction={updateSite}
        deleteAction={deleteSite}
      />

      <Card>
        <CardHeader title="Opsi Referensi (Dropdown)" description="Padanan sheet 00_MASTER." />
        <div className="grid gap-5 px-5 py-4 md:grid-cols-2 xl:grid-cols-3">
          {[...refGroups.entries()].map(([cat, opts]) => (
            <div key={cat} className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">{cat}</p>
              <ul className="space-y-1">
                {opts.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{o.value}</span>
                    <form action={deleteRefOption}>
                      <input type="hidden" name="id" value={o.id} />
                      <button type="submit" className="text-xs text-slate-400 hover:text-red-600">hapus</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <RefOptionForm />
        </div>
      </Card>

      <Badge tone="blue">Total {refOptions.length} opsi referensi</Badge>
    </div>
  );
}

function RefOptionForm() {
  return (
    <InlineForm
      action={createRefOption}
      fields={[
        { name: "category", label: "Kategori", required: true, placeholder: "mis. JENIS_PEKERJAAN" },
        { name: "value", label: "Nilai", required: true },
      ]}
      submitLabel="+ Opsi"
    />
  );
}
