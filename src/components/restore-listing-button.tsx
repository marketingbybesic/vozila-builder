"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { setListingStatusAction } from "@/actions/listings";

/**
 * Vraćanje obrisanog oglasa (Karlo 05.08.2026, stavka 10).
 *
 * Brisanje je MEKO (`status = 'deleted'`, redak ostaje u bazi), pa je povrat
 * samo promjena statusa natrag u `active`. Nova server akcija nije potrebna —
 * `setListingStatusAction` to već podržava i provjerava vlasništvo.
 *
 * ⚠️ Vraća se kao PAUZIRAN, ne aktivan: oglas je nekad namjerno obrisan, pa
 * neka ga vlasnik svjesno objavi ponovno umjesto da odmah iskoči u pretrazi.
 */
export function RestoreListingButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const restore = () => {
    setErr(null);
    start(async () => {
      const res = await setListingStatusAction({ id, status: "paused" });
      if (!res.ok) setErr(res.error);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={restore}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/50 hover:text-[var(--color-ink)] disabled:opacity-50"
      >
        <RotateCcw className="size-3.5" />
        {pending ? "Vraćam..." : "Vrati oglas"}
      </button>
      {err && <span className="text-xs text-[var(--color-danger)] ml-2">{err}</span>}
    </>
  );
}
