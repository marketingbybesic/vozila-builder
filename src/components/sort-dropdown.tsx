"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/select";

const OPTIONS: { value: string; label: string }[] = [
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
    <Select
      className="w-auto min-w-[200px]"
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.value === "newest") next.delete("sort");
        else next.set("sort", e.target.value);
        next.delete("page");
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </Select>
  );
}
