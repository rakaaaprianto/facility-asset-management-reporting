import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import AppShell from "@/components/app-shell";
import type { MenuItem } from "@/components/sidebar";

const FULL_MENU: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/reports", label: "Laporan Bulanan", icon: "reports" },
  { href: "/monitoring", label: "Monitoring Nasional", icon: "monitoring" },
  { href: "/approvals", label: "Persetujuan", icon: "approvals" },
  { href: "/master/sites", label: "Master Data", icon: "sites" },
  { href: "/admin/users", label: "Manajemen User", icon: "users" },
  { href: "/admin/audit", label: "Audit Log", icon: "audit" },
  { href: "/settings", label: "Pengaturan", icon: "settings" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const isHq = user.roleCode === "SUPER_ADMIN" || user.roleCode === "ADMIN";

  const items = FULL_MENU.filter((item) => {
    switch (item.href) {
      case "/monitoring":
      case "/approvals":
      case "/master/sites":
        return isHq;
      case "/admin/users":
      case "/admin/audit":
        return user.roleCode === "SUPER_ADMIN";
      default:
        return true;
    }
  });

  return (
    <AppShell items={items} userLine1={user.name} userLine2={`${user.employeeTitle ?? user.roleName} · ${user.roleName}`}>
      {children}
    </AppShell>
  );
}
