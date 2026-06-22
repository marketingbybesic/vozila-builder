"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/filter-sidebar";

export function MobileFilterToggle({ count }: { count: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filtri{count > 0 ? ` (${count})` : ""}
      </Button>

      {open && (
        <div className="lg:hidden">
          <FilterSidebar mobile onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
