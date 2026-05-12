"use client";

import { useState, useTransition } from "react";
import { Pencil, Pause, Play, Trash2 } from "lucide-react";
import { setListingStatusAction, deleteListingAction } from "@/actions/listings";

export function ListingRowActions({ id, status }: { id: string; status: "active" | "paused" | "sold" }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const togglePause = () => {
    setErr(null);
    start(async () => {
      const res = await setListingStatusAction({ id, status: status === "paused" ? "active" : "paused" });
      if (!res.ok) setErr(res.error);
    });
  };

  const remove = () => {
    if (!confirm("Obrisati oglas? Ova akcija se ne može poništiti.")) return;
    setErr(null);
    start(async () => {
      await deleteListingAction(id);
    });
  };

  return (
    <>
      <ActionButton icon={<Pencil className="size-3.5" />} label="Uredi" />
      <ActionButton
        icon={status === "paused" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        label={status === "paused" ? "Aktiviraj" : "Pauziraj"}
        onClick={togglePause}
        disabled={pending}
      />
      <ActionButton
        icon={<Trash2 className="size-3.5" />}
        label="Obriši"
        danger
        onClick={remove}
        disabled={pending}
      />
      {err && <span className="text-xs text-[var(--color-danger)] ml-2">{err}</span>}
    </>
  );
}

function ActionButton({
  icon,
  label,
  danger,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 " +
        (danger
          ? "text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/50 hover:text-[var(--color-ink)]")
      }
    >
      {icon}
      {label}
    </button>
  );
}
