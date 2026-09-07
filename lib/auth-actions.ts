"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const headerList = await headers();
  const rawIp = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "127.0.0.1";
  const ipKey = `ip:${rawIp}`;
  const emailKey = `email:${email}`;

  // Check rate limit for IP and email
  const ipLimit = checkRateLimit(ipKey);
  if (!ipLimit.allowed) {
    const mins = Math.ceil((ipLimit.retryAfterSeconds ?? 900) / 60);
    return { error: `Terlalu banyak percobaan gagal dari IP ini. Silakan coba lagi dalam ${mins} menit.` };
  }

  const emailLimit = checkRateLimit(emailKey);
  if (!emailLimit.allowed) {
    const mins = Math.ceil((emailLimit.retryAfterSeconds ?? 900) / 60);
    return { error: `Akun ini terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${mins} menit.` };
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { role: true },
  });

  const passwordMatch = user && user.isActive ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !user.isActive || !passwordMatch) {
    const ipRes = recordFailedAttempt(ipKey);
    const emailRes = recordFailedAttempt(emailKey);
    const remaining = Math.min(ipRes.remainingAttempts, emailRes.remainingAttempts);

    if (remaining === 0) {
      return { error: "Terlalu banyak percobaan gagal. Akun dikunci sementara selama 15 menit." };
    }

    return { error: `Kredensial tidak valid. Sisa percobaan: ${remaining} kali.` };
  }

  // Reset rate limit on successful authentication
  resetRateLimit(ipKey);
  resetRateLimit(emailKey);

  const store = await cookies();
  const token = await createSessionToken(user.id, user.role.code);
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
  await db.auditLog.create({
    data: { actorId: user.id, action: "LOGIN", entityType: "User", entityId: user.id, ipAddress: rawIp },
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
