"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserPermanently } from "@/lib/admin-actions";

export default function DeleteUserButton({
  id,
  email,
  isSelf,
}: {
  id: string;
  email: string;
  isSelf?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isSelf) return null;

  return (
    <button
      type="button"
      disabled={pending}
      title="Hapus Permanen"
      onClick={() => {
        if (
          confirm(
            `Yakin ingin MENGHAPUS PERMANEN user "${email}"?\n\nSemua penugasan site akan dilepas dan user ini tidak akan bisa login lagi ke sistem.\n\nTindakan ini TIDAK DAPAT DIBATALKAN.`
          )
        ) {
          startTransition(async () => {
            const fd = new FormData();
            fd.append("id", id);
            await deleteUserPermanently(fd);
          });
        }
      }}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
    >
      <Trash2 size={13} />
      <span>{pending ? "Menghapus…" : "Hapus Permanen"}</span>
    </button>
  );
}
