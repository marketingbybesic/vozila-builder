"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SelectField } from "@/components/napredno/controls";

const OPTIONS = [
  { value: "newest", label: "Najnoviji prvi" },
  { value: "price-asc", label: "Cijena: najniža" },
  { value: "price-desc", label: "Cijena: najviša" },
  { value: "km-asc", label: "Kilometraža: najniža" },
  { value: "year-desc", label: "Godina: najnovija" },
];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  return (
    <div className="w-auto min-w-[200px]">
      <SelectField
        value={current === "newest" ? "" : current}
        placeholder="Najnoviji prvi"
        options={OPTIONS.filter((o) => o.value !== "newest")}
        onChange={(v) => {
          const next = new URLSearchParams(params.toString());
          if (!v || v === "newest") next.delete("sort");
          else next.set("sort", v);
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`, { scroll: false });
        }}
      />
    </div>
  );
}
