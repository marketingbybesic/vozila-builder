# avto.net potpuna struktura — referenca za 1:1 paritet (2026-06-11)

Izvučeno iz screenshota /Users/zmaj/Downloads/Avto.net screenshots/ (2 paralelna agenta).

## NAVIGACIJSKA LOGIKA (ključno)
- `search_category.asp?SID=X` = **HUB stranica kategorije** → grid "Izberite podrubriko" tile-ova grupiranih po temama.
- Klik na podkategoriju tile → vodi na **filtriranu pretragu/rezultate** te podkategorije.
- `search.asp` / napredno = **puna forma** sa svim filterima.
- `results.asp` = lista rezultata (sortiranje, bez filter-forme).
- ZAKLJUČAK: kategorija-klik → HUB s podkategorijama (ne odmah svi oglasi); podkategorija-klik → pretraga/rezultati.

## avto.net FORM SCAFFOLD (isti za sve kategorije, redoslijed):
1. Tip ponudbe — radio: prodaja | najem
2. Starost (Stanje) — checkbox: novo | testno | rabljeno
3. Karoserija/Kategorija — icon grid (po kategoriji)
4. Znamka, model, tip — Znamka → Model (ovisni) → Tip (text) → "+ Dodaj znamko/model"
5. Cena (+ poračun DDV za gospodarska) — od/do + "prikaži brez cene"
6. Letnik, prevoženi km — Letnik 1.reg od/do · km od/do · garancija
7. Gorivo, motor, menjalnik — Prostornina ccm od/do · Moč kW od/do · Menjalnik · Gorivo (+moto: valji/takt/prenos)
8. Sedeži in vrata — broj sjedala od/do · zadnja vrata · stranska vrata
9. Dodatne opcije — GRUPIRANO:
   - Klimatizacija: klima, autom.klima, grijanje u mirovanju
   - Notranja oprema: grijanje sjedala, hlađenje sjedala, el.podešavanje, koža, Isofix, el.stakla, centralno, panorama, servo, multifunkc.volan, keyless, navigacija, HeadUp, Bluetooth, CarPlay, AndroidAuto
   - Varnost: ABS, ESP, Airbag, tempomat, aktivni tempomat, xenon, senzor kiše, LED, lane-assist, auto-kočenje
   - Pomoć pri parkiranju: park.asistent, kamera, senzori
   - Ostalo: alu felge, 4x4, vučna, krov.sani, produljena međuos., povišen krov, prilagođeno invalidu
   - Lastništvo: 1.vlasnik, servisna knjiga, domaće porijeklo, garažiran, moguća zamjena
   - Programi jamstva: dropdown
10. Barva zunanjosti — 15 swatch (katerakoli, bela, črna, srebrna, modra, siva, rumena, rdeča, zelena, turkizna, oranžna, rjava, beige, vijolična, zlata)
11. Tip barve — metalik | mat
12. Stanje vozila — karambolirani / poplavljeni / dirkalni / zaloga (dropdowns)
13. Starost oglasa, prodajalec — datum objave · prodavač (trgovac/fizička) · lokacija
14. Submit: "Iskanje vozil" + "Ali pa si oglejte zadnjih 100"

## PODKATEGORIJE PO RUBRICI (Slovenian → HR):

### MOTO (search_category SID=60000):
Izberite podrubriko: Motorna kolesa, Skuter/Maxi-scooter/3-4 kolesni, Mopedi/kolo z motorjem, 4-kolesnik/ATV/UTV/3-kolesnik, Minimoto, Oldtimer, Go-kart, Motorne sani, Ponudba za najem
E-mobilnost: E-kolo, E-skiro, Invalidski
Trikolesniki/Ape/Tuc Tuc: Za prevoz oseb, Dostavni, Pick-up
Deli: Moto deli in oprema, Moto pnevmatike, Poškodovana moto kolesa

### GOSPODARSKA (SID=20000):
Izberite: Dostavna vozila, Tovorna vozila, Avtobusi, Tovorna prikolica, UTV vozila, Počitniške za najem
Trikolesniki/Ape: Za tovorno cesto, Dostavni, Pick-up
Deli: Kompleti, Deli in oprema, Priključki

### MEHANIZACIJA (SID=40000):
Izberite: Gradbena mehanizacija, Kmetijska mehanizacija, Viličar, Gozdarska mehanizacija, Komunalna mehanizacija, Počitniške za najem
Deli: Za gradbeno mehanizacijo, Za kmetijsko mehanizacijo, Tovorna prikolica

### PROSTI ČAS (SID=30000):
Izberite: Avtodom, Počitniška prikolica, Mobilna hišica, Snemljivi bivalnik, Šotorska prikolica, Ponudba za najem, Navtika, E-kolo, E-skiro
Camping: Camping oprema

### DELI IN OPREMA (SID=70000) — 12 grupa:
Avto deli, Avto.dodatna oprema, Multimedija, Moto deli in oprema, Za gospodarska vozila, Za gradbeno mehanizacijo, Za kmetijsko mehanizacijo, Za viličarje, Servisna oprema, Pnevmatike, Platišča, Olja in tekočine

## ŠTO NAM VEĆ POSTOJI (category-filters.ts):
- Equipment grupe: climate/interior/safety/parking/otherEquipment/ownership ✓
- Tip boje (metalik/mat) ✓ · offerType (prodaja/najam) ✓
- Snaga/obujam range, vrata, sjedala, EURO ✓

## GAP (za 1:1):
- Tip ponude (prodaja/najam) kao PRVO polje u formi
- avto.net grupiranje opreme s točnim labelama (Klimatizacija/Notranja oprema/...)
- Barva kao swatch grid (vizualno) umjesto chip-ova
- Karoserija kao icon grid umjesto chipova
- Podkategorija tiles na category hub stranici (umjesto direktnog popisa)
