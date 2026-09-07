export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-bold text-red-600">403 — Akses Ditolak</h1>
      <p className="text-sm text-slate-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
    </main>
  );
}
