"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { adminResolveReportAction } from "@/actions/admin";

export function AdminReportRowActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();

  const resolve = (action: "resolved" | "dismissed") => {
    startTransition(async () => {
      await adminResolveReportAction(reportId, action);
    });
  };

  return (
    <div className="inline-flex gap-1" aria-busy={pending}>
      <button
        type="button"
        onClick={() => resolve("resolved")}
        disabled={pending}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[var(--color-ink)] text-white text-xs font-medium hover:bg-[var(--color-ink-soft)]"
      >
        <Check className="size-3.5" />
        Riješeno
      </button>
      <button
        type="button"
        onClick={() => resolve("dismissed")}
        disabled={pending}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--color-line)] text-xs font-medium hover:bg-[var(--color-line)]/40"
      >
        <X className="size-3.5" />
        Odbij
      </button>
    </div>
  );
}
