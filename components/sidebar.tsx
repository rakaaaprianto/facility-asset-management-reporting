"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardCheck,
  BarChart3,
  Building2,
  FileText,
  Users,
  ScrollText,
  LogOut,
  Settings,
  ChevronRight,
} from "lucide-react";
import { logout } from "@/lib/auth-actions";
import { useTranslation } from "@/lib/i18n/language-context";

export type MenuItem = { href: string; label: string; icon: string };

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  dashboard: LayoutDashboard,
  reports: FileSpreadsheet,
  approvals: ClipboardCheck,
  monitoring: BarChart3,
  sites: Building2,
  pks: FileText,
  users: Users,
  audit: ScrollText,
  settings: Settings,
};

export default function Sidebar({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col lg:sticky lg:top-0"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo / Brand */}
      <div
        className="flex h-16 items-center gap-3 px-4"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Image
          src="/logo/infomedia_logo.webp"
          alt="Infomedia"
          width={120}
          height={32}
          className="h-auto w-auto max-h-8 object-contain"
          style={{ filter: "var(--sidebar-logo-filter)" }}
        />
      </div>

      {/* Nav Label */}
      <div className="px-4 pt-5 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-text-muted)" }}>
          {t.nav.menu}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const label = ((t.nav as unknown as Record<string, string>)[item.icon] ?? item.label);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "text-white"
                  : "hover:text-white"
              }`}
              style={
                active
                  ? {
                      background: "var(--sidebar-active-bg)",
                      color: "var(--sidebar-active-text)",
                      boxShadow: "0 2px 8px rgba(227,30,45,0.4)",
                    }
                  : {
                      color: "var(--sidebar-text)",
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--sidebar-bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }
              }}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {active && (
                <ChevronRight size={14} className="shrink-0 opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <form
        action={logout}
        className="p-2"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={{ color: "var(--sidebar-text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--sidebar-bg-hover)";
            (e.currentTarget as HTMLElement).style.color =
              "var(--sidebar-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color =
              "var(--sidebar-text-muted)";
          }}
        >
          <LogOut size={15} className="shrink-0" />
          {t.common.logout}
        </button>
      </form>
    </aside>
  );
}
