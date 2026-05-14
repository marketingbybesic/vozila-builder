"use client";

import { useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { adminDeleteListingAction, adminToggleFeaturedAction } from "@/actions/admin";
import { cn } from "@/lib/utils";

export function AdminListingRowActions({
  listingId,
  featured,
  status,
}: {
  listingId: string;
  featured: boolean;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  const toggleFeatured = () => {
    startTransition(async () => {
      await adminToggleFeaturedAction(listingId, !featured);
    });
  };

  const remove = () => {
    if (status === "deleted") return;
    if (!confirm("Sigurno obrisati ovaj oglas? Ova akcija se zapisuje u dnevnik.")) return;
    startTransition(async () => {
      await adminDeleteListingAction(listingId);
    });
  };

  return (
    <div className="inline-flex gap-1 items-center" aria-busy={pending}>
      <button
        type="button"
        onClick={toggleFeatured}
        disabled={pending}
        title={featured ? "Ukloni Izdvojeno" : "Postavi kao Izdvojeno"}
        className={cn(
          "size-8 grid place-items-center rounded-md transition-colors",
          featured
            ? "text-[var(--color-accent-dark)] bg-[var(--color-accent)]/15"
            : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
        )}
      >
        <Star className={cn("size-4", featured && "fill-current")} />
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending || status === "deleted"}
        title="Obriši oglas"
        className="size-8 grid place-items-center rounded-md text-[var(--color-muted)] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
