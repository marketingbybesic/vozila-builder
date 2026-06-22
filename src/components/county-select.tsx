"use client";

import { useState } from "react";
import { SelectField } from "@/components/napredno/controls";
import { COUNTIES } from "@/data/locations";

/** Klijentski county dropdown (ujednačeni custom stil) za postavke i sl. */
export function CountySelect({ defaultValue = "", label }: { defaultValue?: string; label?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <SelectField
      label={label}
      value={value}
      onChange={setValue}
      placeholder="Odaberi županiju"
      options={COUNTIES.map((c) => ({ value: c, label: c }))}
    />
  );
}
