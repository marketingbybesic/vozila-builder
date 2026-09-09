import fs from "node:fs";

const src = fs.readFileSync(new URL("../src/components/filter-sidebar.tsx", import.meta.url), "utf8");

// Find the vrstaFields.map(...) render block and confirm it special-cases
// kamping-oprema (isKampingOprema) to render a single-select SelectField
// (matching napredno-form.tsx's `(isKampingOprema || isGumeFelge) && vrstaGroup`
// SelectField branch), not the generic MultiSelect branch.
const hasIsKampingOpremaGuardOnVrsta = /isKampingOprema[\s\S]{0,400}SelectField/.test(src) || /vrstaFields[\s\S]{0,50}isKampingOprema/.test(src);
const hasSelectFieldForVrsta = /label="Vrsta"[\s\S]{0,300}placeholder="Sve vrste"/.test(src);

if (hasSelectFieldForVrsta) {
  console.log("KAMPING_OPREMA_VRSTA_OK");
  process.exit(0);
} else {
  console.error("FAIL: no single-select 'Vrsta' SelectField with 'Sve vrste' placeholder found in filter-sidebar.tsx");
  process.exit(1);
}
