"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40 transition-colors"
      >
        <LogOut className="size-4" />
        Odjava
      </button>
    </form>
  );
}
