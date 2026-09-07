"use client";

import { useActionState } from "react";
import { changeOwnPassword, type FormState } from "@/lib/admin-actions";
import { Button, Input, Label } from "@/components/ui";

const initial: FormState = {};

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPassword, initial);

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <div>
        <Label htmlFor="currentPassword">Password Saat Ini</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">Password Baru (min 8)</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Ganti Password"}
      </Button>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
    </form>
  );
}
