import Image from "next/image";
import LoginForm from "./login-form";

export const metadata = {
  title: "Masuk — Infomedia Monthly Report",
  description: "Facility and Asset Management Reporting System for Infomedia Nusantara",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden">
      {/* ── Background: dark + subtle red gradient ──────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0f0408 0%, #1e0a10 40%, #2d0b13 70%, #160608 100%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.3) 39px, rgba(255,255,255,0.3) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.3) 39px, rgba(255,255,255,0.3) 40px)",
        }}
      />

      {/* Radial glow accents */}
      <div
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(227, 30, 45, 0.18)" }}
      />
      <div
        className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(227, 30, 45, 0.10)" }}
      />

      {/* ── Left panel (branding) — visible on md+ ──────────────────── */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 items-center justify-center p-12">
        <div className="max-w-md space-y-8">
          <Image
            src="/logo/infomedia_logo.webp"
            alt="Infomedia"
            width={200}
            height={54}
            priority
            className="h-auto w-auto max-h-14"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
              Facility and Asset Management
              <br />
              <span style={{ color: "var(--brand-400)" }}>Reporting System</span>
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Platform pelaporan aset dan fasilitas bulanan terpusat untuk seluruh site Infomedia Nusantara.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              "Laporan bulanan per site terintegrasi",
              "Monitoring kontrak PKS & invoice real-time",
              "Export Excel multi-wilayah otomatis",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-3">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--brand-600)" }}
                >
                  ✓
                </span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {feat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel (form card) ──────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          {/* Mobile logo */}
          <div className="mb-6 flex flex-col items-center gap-4 md:hidden">
            <Image
              src="/logo/infomedia_logo.webp"
              alt="Infomedia"
              width={160}
              height={44}
              priority
            />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Selamat Datang</h2>
            <p className="mt-1 text-sm text-slate-500">
              Masuk untuk mengelola laporan bulanan site Anda
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Infomedia Nusantara — Asset & Facility Management
          </p>
        </div>
      </div>
    </main>
  );
}
