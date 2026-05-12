import type { Metadata } from "next";
import { Inbox } from "@/components/inbox";

export const metadata: Metadata = { title: "Poruke" };

export default function PorukePage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Poruke</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Razgovori s prodavačima i kupcima.
        </p>
      </header>

      <Inbox />
    </div>
  );
}
