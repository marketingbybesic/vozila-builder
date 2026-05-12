"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        if (typeof window === "undefined") return;
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
            return;
          } catch {}
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
      className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md border border-[var(--color-line)] text-sm hover:border-[var(--color-ink)] transition-colors"
    >
      {copied ? <Check className="size-4 text-[var(--color-success)]" /> : <Share2 className="size-4" />}
      {copied ? "Kopirano" : "Podijeli"}
    </button>
  );
}
