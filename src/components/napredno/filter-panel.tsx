"use client";

/**
 * Full-screen panel s naprednom pretragom ("Više filtera").
 * Otvara se preko cijelog ekrana, sadrži NaprednoForm (pre-fill iz URL-a).
 * Submit primijeni filtere i zatvori panel.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { NaprednoForm } from "@/components/napredno-form";

export function FilterPanel({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-[var(--color-bg)] flex flex-col animate-fade-in">
      <header className="shrink-0 border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-4xl px-4 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl tracking-tight">Napredna pretraga</h2>
            <p className="text-xs text-[var(--color-muted)]">Svi filteri na jednom mjestu</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zatvori filtere"
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            <X className="size-4" /> Zatvori
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <NaprednoForm embedded onClose={onClose} />
        </div>
      </div>
    </div>,
    document.body
  );
}
