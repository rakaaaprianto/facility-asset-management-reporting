import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  employeeTitle: string | null;
  roleCode: string;
  roleName: string;
  permissions: Set<string>;
  siteIds: string[];
};

async function loadUser(userId: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      siteAssignments: { select: { siteId: true } },
    },
  });
  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    employeeTitle: user.employeeTitle,
    roleCode: user.role.code,
    roleName: user.role.name,
    permissions: new Set(user.role.permissions.map((p) => `${p.permission.resource}:${p.permission.action}`)),
    siteIds: user.siteAssignments.map((s) => s.siteId),
  };
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const payload = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return loadUser(payload.uid);
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(key: string): Promise<SessionUser> {
  const user = await requireUser();
  if (user.roleCode === "SUPER_ADMIN") return user;
  if (!user.permissions.has(key)) redirect("/forbidden");
  return user;
}
