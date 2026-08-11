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

  // ⚠️ Karlo 11.08.2026: `min-w-[200px]` je bio bezuvjetan pa je s aktivnim
  // filtrom (tad dolazi i "Spremi pretragu") traka virila 146 px van na 320 px.
  // Pustiti sort da se slobodno skuplja NE valja — guta ga susjed pa ostane
  // prazan okvir bez ijednog slova (mjereno 7 px na 390 px). Zato fiksnih
  // 112 px na mobitelu: stane "Najnovi…" s elipsom, a ostatak nose ikone.
  // Redak NE smije dobiti `flex-wrap` — Karlo ga reklamirao 05.08.
  return (
    <div className="w-[112px] shrink-0 sm:w-auto sm:min-w-[200px]">
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
