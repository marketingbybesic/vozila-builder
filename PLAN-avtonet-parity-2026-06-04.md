# Vozila.hr — avto.net pretraga PARITET + čišćenje slovenskog

**Datum:** 2026-06-04 · **Projekt:** /Users/zmaj/Projects/auti-hr
**Cilj:** logika pretraživanja IDENTIČNA kao avto.net, ali naš moderni UI. Ikone preuzeti s interneta/Envata (NE generirati vektore). Sve slovensko → legitiman hrvatski.

---

## FAZA 1 — TEHNIČKA ANALIZA: što nam fali vs avto.net

### avto.net napredna pretraga — kako radi (potvrđeno: URL `search_category.asp?SID=10000..70000`, domensko znanje)
avto.net flow:
1. Odabir rubrike (Avto/Moto/...) → otvara naprednu formu te rubrike
2. **Marka (znamka) dropdown** → onChange povlači **Model dropdown filtriran na tu marku** (AJAX/ovisni izbornik)
3. Brojni filteri: cijena od/do, letnik (godina) od/do, prijeđeni km od/do, gorivo, mjenjač, oblika karoserije, snaga kW od/do, obujam, vrata, sjedala, boja, emisijska norma, oprema (grupe), lokacija (regija)
4. **Živi brojač**: dok mijenjaš filtere prikazuje "Najdenih: N vozil" prije nego klikneš
5. Submit → lista rezultata s istim filterima u URL-u
6. **Spremljene pretrage** + email obavijest na nove oglase

### ŠTO MI VEĆ IMAMO (zadržati — tu smo jednaki ili bolji)
- ✓ Kategorija → napredna forma preselektirana (avto.net logika)
- ✓ Podkategorija preselect + deep filteri po kategoriji (6 kategorija)
- ✓ Cijena/godina/km rasponi, gorivo, mjenjač, karoserija, snaga, obujam, boja, oprema grupe
- ✓ Atributi po kategoriji (dijelovi: gume/felge/ulja; mehanizacija: radni sati/doseg)
- ✓ Moderni UI, mobilni paritet, čišći od avto.net
- ✓ URL-state serializacija filtera

### ŠTO NAM FALI (tehnički gap vs avto.net)
| # | Gap | avto.net ima | mi imamo | Prioritet |
|---|---|---|---|---|
| G1 | **Ovisni Model dropdown** | marka→model AJAX filtrirano | model = slobodan text u naprednoj | VISOK (core avto.net feel) |
| G2 | **Živi brojač rezultata** | "Najdenih: 523" prije submita | brojač tek na rezultatima | VISOK |
| G3 | **Raspon snage/obujma od-do** | kW od-do, ccm od-do | imamo (range) ali provjeriti UI | SREDNJI |
| G4 | **Multi-model select** | može više modela | jedan text | NIZAK |
| G5 | **Spremljena pretraga + email alarm** | da | gumb bez pipeline | NIZAK (kasnije) |
| G6 | **Regija/lokacija kao na avto.net** | regija dropdown | županija dropdown | OK (ekvivalent) |
| G7 | **Slovenski ostaci** | (N/A) | value slugovi + nameOrig komentari | VISOK (tražено) |

### MARKE/MODELI podaci
- `src/data/makes.ts` — provjeriti ima li model-liste po marki (za ovisni dropdown). Brza pretraga (hero-search) VEĆ radi ovisni model (`selectedMake.models`), pa podaci postoje za auto. Treba prenijeti u naprednu.

---

## FAZA 2 — PLAN IMPLEMENTACIJE

### Korak 1 — Ovisni Model dropdown u naprednoj (G1)
- `napredno-form.tsx`: Model promijeniti iz `<input text>` u `<select>` koji se puni iz `makeOptions` → `selectedMake.models` (isto kao hero-search radi)
- Za ne-auto kategorije gdje nema model-liste: fallback na text input
- Datoteka: `src/components/napredno-form.tsx`, čita `src/data/makes.ts`

### Korak 2 — Živi brojač rezultata (G2)
- Dodati lagani klijentski "preview count": dok korisnik bira filtere, izračunati broj rezultata iz `LISTINGS` (in-memory `applyFilters`) i prikazati "Pronađeno N vozila" na submit gumbu
- Implementacija: `useMemo` nad `applyFilters(LISTINGS, currentFilters)` → broj
- Datoteka: `napredno-form.tsx` + import `applyFilters` iz `src/lib/filter.ts`
- Oprez: filter funkcija očekuje ListingFilters oblik — mapirati form state na taj oblik

### Korak 3 — Čišćenje SVEG slovenskog (G7) — TRAŽENO
- `value:` slugovi: veriga→lanac (✓ već), jermen→remen (✓), direkten→direktan (✓), podaljsana-medosna→produljeni-meduosovinski, povisena-kabina→povisen-krov, kozni-presvlak→kozna-sjedala, stojeci-grijac→grijanje-mirovanje
- `nameOrig:` slovenski komentari u categories.ts → ukloniti ili prevesti (interni, ali traženo "sve slovensko")
- Provjeriti listings.ts attributes da ne referenciraju stare slugove (migrirati ako da)
- Skenirati cijeli src/ za slovenske riječi: piškotk, soglas, znamka, letnik, oblika, barva, menjalnik, prevoz, sedež, hišic, skiro, avtodom, kovček, vzmetenje
- Datoteke: `category-filters.ts`, `categories.ts`, provjera `listings.ts`

### Korak 4 — Ikone s interneta/Envata (NE generirati)
- Trenutno: lucide SVG (Construction/Caravan/Disc3). Korisnik traži preuzimanje s interneta ili Envata API.
- Envato API ključ u keychain `envato_api` (potvrđeno u MEMORY/skills)
- Plan: dohvatiti 6 kvalitetnih kategorijskih ikona (auto/moto/kamion/bager/kamper/dio) preko envato skilla ili besplatnih izvora (npr. SVG iz public CDN), spremiti u `public/icons/`, koristiti `<img src>` ili `<Image>`
- NAPOMENA: ovo je u sukobu s "ne generiraj vektore" samo ako bih crtao; preuzimanje gotovih je OK
- Datoteke: `public/icons/*`, `category-nav.tsx` icon map

### Korak 5 — Provjera raspona snage/obujma UI (G3)
- Potvrditi da napredna prikazuje kW od-do i ccm od-do kao parove (već postoje kao range AttrField/column)

---

## FAZA 3 — PROVJERA KODA (traženo "na kraju provjeri da je kod ok")
- `npm run build` čist od nule
- `npx tsc --noEmit` 0 grešaka
- Playwright: ovisni model radi (BMW→samo BMW modeli), brojač se mijenja, 0 slovenskih riječi u DOM-u (grep rendered text)
- Git diff pregled (ništa postojeće slomljeno)

---

## DEVIL'S ADVOCATE
1. Model dropdown za ne-auto kategorije nema podatke → mora graceful fallback na text, ne prazan select
2. Živi brojač nad cijelim LISTINGS na svaki keystroke = performanse; OK na ~90 mock, ali debounce/useMemo
3. Mijenjanje value slugova može orfanirati mock attribute → grep prije, migriraj
4. Envato ikone: licenca/format; ako API zeza, fallback na besplatne SVG s interneta (npr. lucide ostaje kao zadnja linija, ali korisnik traži eksterne)
5. applyFilters oblik mora točno primiti form-state; krivo mapiranje = krivi brojač
6. "Identično kao avto.net" ne znači ružno kao avto.net — zadržati naš UI (traženo)

## STATUS
- [ ] Korak 1 model dropdown
- [ ] Korak 2 živi brojač
- [ ] Korak 3 čišćenje slovenskog
- [ ] Korak 4 ikone eksterno
- [ ] Korak 5 range provjera
- [ ] Faza 3 provjera koda
