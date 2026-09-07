import { requireUser } from "@/lib/auth";
import { Card, CardHeader } from "@/components/ui";
import PasswordForm from "./password-form";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Pengaturan</h1>
        <p className="text-sm text-slate-500">Akun & preferensi.</p>
      </div>

      <Card className="p-5">
        <p className="text-sm text-slate-500">Masuk sebagai</p>
        <p className="mt-1 font-semibold">{user.email}</p>
        <p className="text-sm text-slate-600">
          {user.name} · {user.roleName}
          {user.siteIds.length > 0 ? ` · ${user.siteIds.length} site` : ""}
        </p>
      </Card>

      <Card>
        <CardHeader title="Ganti Password" />
        <div className="px-5 py-4">
          <PasswordForm />
        </div>
      </Card>
    </div>
  );
}
