"use client";

import { useTransition } from "react";
import { ShieldOff, ShieldCheck, Ban, Undo2 } from "lucide-react";
import { adminSetUserRoleAction, adminToggleBanAction } from "@/actions/admin";

export function AdminUserRowActions({
  userId,
  role,
  banned,
  isSelf,
}: {
  userId: string;
  role: "user" | "admin" | "moderator";
  banned: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const toggleRole = () => {
    if (isSelf) {
      alert("Ne možeš si mijenjati ulogu.");
      return;
    }
    const next = role === "admin" ? "user" : "admin";
    if (!confirm(`Promijeniti ulogu u "${next}"?`)) return;
    startTransition(async () => {
      await adminSetUserRoleAction(userId, next);
    });
  };

  const toggleBan = () => {
    if (isSelf) {
      alert("Ne možeš blokirati samog sebe.");
      return;
    }
    if (!confirm(banned ? "Odblokirati korisnika?" : "Blokirati korisnika?")) return;
    startTransition(async () => {
      await adminToggleBanAction(userId, !banned);
    });
  };

  return (
    <div className="inline-flex gap-1 items-center" aria-busy={pending}>
      <button
        type="button"
        onClick={toggleRole}
        disabled={pending || isSelf}
        title={role === "admin" ? "Smanji u korisnika" : "Promaknu u admin"}
        className="size-8 grid place-items-center rounded-md text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors disabled:opacity-30"
      >
        {role === "admin" ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
      </button>
      <button
        type="button"
        onClick={toggleBan}
        disabled={pending || isSelf}
        title={banned ? "Odblokiraj" : "Blokiraj"}
        className="size-8 grid place-items-center rounded-md text-[var(--color-muted)] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
      >
        {banned ? <Undo2 className="size-4" /> : <Ban className="size-4" />}
      </button>
    </div>
  );
}
