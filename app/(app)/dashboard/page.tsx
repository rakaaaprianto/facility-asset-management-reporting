import Link from "next/link";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardHeader,
  Badge,
  Table,
  EmptyRow,
  LinkButton,
  statusTone,
} from "@/components/ui";
import {
  Building2,
  Package,
  FileText,
  ArrowRight,
  Clock,
} from "lucide-react";
import { getDictionary, getShortMonthName, type Locale } from "@/lib/i18n";

export const metadata = { title: "Dashboard — Infomedia AMRS" };

export default async function DashboardPage() {
  const [user, cookieStore] = await Promise.all([
    requireUser(),
    cookies(),
  ]);

  const locale: Locale = cookieStore.get("app_locale")?.value === "en" ? "en" : "id";
  const t = getDictionary(locale);

  const isFieldUser = user.roleCode === "PIC" || user.roleCode === "SUPPORT";

  const where =
    isFieldUser && user.siteIds.length > 0
      ? { siteId: { in: user.siteIds } }
      : isFieldUser
        ? { id: "___none___" }
        : {};

  const [totalSites, totalAssets, reportCount, recent] = await Promise.all([
    db.site.count(),
    db.asset.count(),
    db.monthlyReport.count({ where }),
    db.monthlyReport.findMany({
      where,
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      take: 10,
      include: {
        site: { select: { code: true, name: true } },
      },
    }),
  ]);

  const stats = [
    {
      label: t.dashboard.registeredSites,
      value: totalSites,
      icon: Building2,
      color: "brand",
      desc: t.dashboard.activeLocations,
    },
    {
      label: t.dashboard.recordedAssets,
      value: totalAssets,
      icon: Package,
      color: "emerald",
      desc: t.dashboard.totalAssets,
    },
    {
      label: isFieldUser ? t.dashboard.myReports : t.dashboard.totalReports,
      value: reportCount,
      icon: FileText,
      color: "amber",
      desc: t.dashboard.allPeriods,
    },
  ];

  const colorMap: Record<string, { icon: string; num: string; ring: string }> = {
    brand: {
      icon: "bg-brand-50 text-brand-600",
      num: "text-brand-700",
      ring: "ring-brand-100",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      num: "text-emerald-700",
      ring: "ring-emerald-100",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      num: "text-amber-700",
      ring: "ring-amber-100",
    },
  };

  const dateStr = new Date().toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Page Title ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.common.welcome},{" "}
            <span style={{ color: "var(--brand-600)" }}>{user.name.split(" ")[0]}</span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {t.dashboard.welcomeSubtitle} · {dateStr}
          </p>
        </div>
        <LinkButton href="/reports" variant="primary" className="self-start gap-2 sm:self-auto">
          <FileText size={15} />
          {t.dashboard.createNewReport}
        </LinkButton>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const colors = colorMap[s.color];
          const Icon = s.icon;
          return (
            <Card key={s.label} className="flex items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-4 ${colors.icon} ${colors.ring}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {s.label}
                </p>
                <p className={`mt-0.5 text-3xl font-extrabold tabular-nums ${colors.num}`}>
                  {s.value.toLocaleString(locale === "en" ? "en-US" : "id-ID")}
                </p>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Recent Reports Table ─────────────────────────────────────── */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Clock size={15} className="text-slate-400" />
              {t.dashboard.recentReports}
            </span>
          }
          description={t.dashboard.recentReportsDesc}
          action={
            <LinkButton href="/reports" variant="outline" className="gap-1.5 text-xs">
              {t.dashboard.allReports}
              <ArrowRight size={13} />
            </LinkButton>
          }
        />
        <Table head={[t.common.period, t.common.site, t.common.status, t.common.actions]}>
          {recent.length === 0 ? (
            <EmptyRow colSpan={4} label={t.dashboard.noReportsYet} />
          ) : (
            recent.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3 font-mono text-sm font-medium tabular-nums text-slate-700">
                  {getShortMonthName(r.periodMonth, locale)} {r.periodYear}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-slate-800">{r.site.code}</span>
                  <span className="ml-2 text-xs text-slate-400">{r.site.name}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[r.status] ?? "gray"}>
                    {t.status[r.status as keyof typeof t.status] ?? r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/reports/${r.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:underline"
                    style={{ color: "var(--brand-600)" }}
                  >
                    {t.common.open}
                    <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
}
