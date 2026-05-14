"use client";

import { useState } from "react";
import { BookmarkPlus, X } from "lucide-react";
import { createSavedSearchAction } from "@/actions/saved-searches";
import type { ListingFilters } from "@/lib/types";

export function SaveSearchButton({ filters }: { filters: ListingFilters }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await createSavedSearchAction({
        name: name.trim() || "Moja pretraga",
        filterJson: filters as Record<string, unknown>,
        notifyEmail: notify,
      });
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setName("");
      }, 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Greška";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-medium hover:bg-[var(--color-line)]/40"
      >
        <BookmarkPlus className="size-3.5" />
        Spremi pretragu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">Spremi pretragu</h3>
              <button onClick={() => setOpen(false)} className="size-8 grid place-items-center rounded-md hover:bg-[var(--color-line)]/40">
                <X className="size-4" />
              </button>
            </div>

            {done ? (
              <div className="text-sm text-[var(--color-success)] py-2">Spremljeno!</div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Naziv</span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="npr. BMW serija 3 do 20.000€"
                    className="w-full h-10 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)]"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="size-4"
                  />
                  Pošalji mi email kad se pojavi novi oglas
                </label>
                {err && <p className="text-xs text-red-600">{err}</p>}
                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-10 px-4 rounded-md bg-[var(--color-ink)] text-white text-sm font-medium disabled:opacity-50"
                  >
                    {busy ? "Spremam..." : "Spremi"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-10 px-4 rounded-md border border-[var(--color-line)] text-sm font-medium hover:bg-[var(--color-line)]/40"
                  >
                    Odustani
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
