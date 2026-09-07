"use client";

import { useState, type ReactNode } from "react";
import { Menu, X, Bell } from "lucide-react";
import Sidebar, { type MenuItem } from "@/components/sidebar";

export default function AppShell({
  items,
  userLine1,
  userLine2,
  children,
}: {
  items: MenuItem[];
  userLine1: string;
  userLine2: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  /* Avatar initials */
  const initials = userLine1
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar items={items} />
      </div>

      {/* ── Mobile drawer overlay ────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={() => setOpen(false)}
      >
        <Sidebar items={items} />
      </div>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top Header */}
        <header
          className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
          }}
        >
          {/* Left: hamburger + page title */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              className="cursor-pointer rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 lg:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 tracking-tight">
                Facility and Asset Management Reporting
              </p>
              <p className="hidden text-[11px] text-slate-400 sm:block font-medium">
                Infomedia Nusantara — Monthly Report System
              </p>
            </div>
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifikasi"
              className="hidden cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 sm:flex"
            >
              <Bell size={18} />
            </button>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">
                  {userLine1}
                </p>
                <p className="text-[11px] text-slate-400">{userLine2}</p>
              </div>
              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--brand-600)" }}
                aria-label={userLine1}
              >
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
