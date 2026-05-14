"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSavedSearchAction } from "@/actions/saved-searches";

export function SavedSearchDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm("Obrisati ovu pretragu?")) return;
        startTransition(async () => {
          await deleteSavedSearchAction(id);
        });
      }}
      disabled={pending}
      className="size-9 grid place-items-center rounded-md text-[var(--color-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Obriši"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
