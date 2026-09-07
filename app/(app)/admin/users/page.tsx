import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, CardHeader, Table, EmptyRow } from "@/components/ui";
import InlineForm from "@/components/admin/inline-form";
import DeleteUserButton from "@/components/admin/delete-user-button";
import { createUser, toggleUserActive } from "@/lib/admin-actions";

export const metadata = { title: "Manajemen User" };

const ROLE_OPTS = [
  { value: "SUPER_ADMIN", label: "Super Administrator" },
  { value: "ADMIN", label: "Admin HQ Asset Management" },
  { value: "PIC", label: "PIC Site" },
  { value: "SUPPORT", label: "Support Area / Site" },
];

export default async function UsersPage() {
  const currentUser = await requirePermission("user:manage");

  const [users, sites] = await Promise.all([
    db.user.findMany({
      orderBy: { email: "asc" },
      include: {
        role: true,
        siteAssignments: { include: { site: { select: { code: true } } } },
        _count: { select: { submittedReports: true } },
      },
    }),
    db.site.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Manajemen User</h1>
        <p className="text-sm text-slate-500">Kelola akun, role, dan penugasan PIC / Support.</p>
      </div>

      <Card>
        <CardHeader title={`User Terdaftar (${users.length})`} />
        <Table head={["Email", "Nama", "Role", "Site Ditugaskan", "Laporan Disubmit", "Status", "Aksi"]}>
          {users.map((u) => (
            <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
              <td className="px-4 py-2 font-medium">{u.email}</td>
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2">
                <Badge tone={u.role.code === "SUPER_ADMIN" ? "blue" : u.role.code === "ADMIN" ? "amber" : u.role.code === "SUPPORT" ? "purple" : "gray"}>
                  {u.role.code}
                </Badge>
              </td>
              <td className="max-w-[220px] px-4 py-2 text-xs text-slate-500">
                {u.siteAssignments.length === 0
                  ? "-"
                  : u.siteAssignments.map((a) => a.site.code).join(", ")}
              </td>
              <td className="px-4 py-2">{u._count.submittedReports}</td>
              <td className="px-4 py-2">
                <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "AKTIF" : "NONAKTIF"}</Badge>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <form action={toggleUserActive}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      disabled={u.id === currentUser.id}
                      className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                    >
                      {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                  <DeleteUserButton id={u.id} email={u.email} isSelf={u.id === currentUser.id} />
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 ? <EmptyRow colSpan={7} /> : null}
        </Table>
      </Card>

      <Card>
        <CardHeader title="Tambah User Baru" description="PIC dan Support dapat diberi beberapa site sekaligus." />
        <div className="border-t border-slate-100 px-5 py-4">
          <InlineForm
            action={createUser}
            fields={[
              { name: "email", label: "Email", type: "email", required: true },
              { name: "name", label: "Nama", required: true },
              { name: "password", label: "Password (min 8)", type: "password", required: true },
              { name: "roleCode", label: "Role", type: "select", options: ROLE_OPTS, required: true },
            ]}
            submitLabel="+ User"
            extra={
              <fieldset className="col-span-full">
                <legend className="mb-1.5 block text-xs font-medium text-slate-600">Penugasan Site (khusus PIC & Support)</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {sites.map((s) => (
                    <label key={s.id} className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" name="siteIds" value={s.id} className="accent-brand-600" />
                      {s.code}
                    </label>
                  ))}
                </div>
              </fieldset>
            }
          />
        </div>
      </Card>
    </div>
  );
}
