"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";
import { Button, Input, Label } from "@/components/ui";
import { Mail, Lock, AlertCircle } from "lucide-react";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction} className="space-y-5">
      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@infomedia.co.id"
            className="pl-9"
            required
            autoFocus
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="pl-9"
            required
          />
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      <Button type="submit" className="w-full py-2.5 text-base" disabled={pending}>
        {pending ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Memproses…
          </span>
        ) : (
          "Masuk"
        )}
      </Button>
    </form>
  );
}
