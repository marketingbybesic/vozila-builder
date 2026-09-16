/**
 * Dijeljena Vrsta-svjesna konfiguracija za Dijelovi i oprema, korištena i u
 * naprednoj pretrazi (napredno-form.tsx) i u bočnom filteru (filter-sidebar.tsx).
 *
 * ⚠️ Karlo 09.09.2026: bočni filter je imao SVOJU pojednostavljenu listu
 * polja, odvojenu od napredno-form.tsx gdje je odrađeno ~50 stavki Vrsta-
 * specifične prilagodbe (Dimenzije/Detalji iznad Cijene, promjenjivi Marka
 * nazivi i popisi, gušća Cijena ljestvica, itd.) — bočni filter nikad nije
 * pokupio nijednu od tih izmjena. Umjesto kopiranja cijele logike PO DRUGI PUT
 * (rizik razilaska dviju kopija, isti mehanizam koji je uzrokovao st.95b bug),
 * ova datoteka izvlači svu Vrsta-svjesnu logiku u čiste funkcije koje OBA
 * komponenta pozivaju — jedan izvor istine.
 */

import {
  TIRE_BRAND_MAKES, TERETNE_C_TIRE_BRAND_MAKES, MOTO_GUME_TIRE_BRAND_MAKES,
  QUAD_ATV_UTV_TIRE_BRAND_MAKES, ULJA_MAZIVA_BRAND_MAKES,
} from "@/data/categories";
import { MAKES } from "@/data/makes";
import type { CarMake } from "@/lib/types";

// ⚠️ Karlo 02.09.2026 (st.58) → 05.09.2026 (st.66-68) → 07.09.2026 (st.78):
// Vrste unutar Dijelovi/Gume i felge koje dobivaju PUNU formu (Marka=
// proizvođači guma/felgi, Dimenzije iznad Cijene, bez Model/OEM/Proizvođač
// dijela). Preostale 3 od 13 djece (tpms-senzori, distancijeri-prstenovi,
// gume-felge-ostalo) NISU u ovoj listi — ne dirati dok se izričito ne zatraži.
export const TIRE_FULL_FORM_VRSTE = [
  "ljetne-gume", "zimske-gume", "cjelogodisnje-gume",
  "teretne-c-gume", "moto-atv-gume", "agro-industrijske-gume",
  "aluminijske-felge", "celicne-felge", "kompleti-gume-felge", "ratkape",
  "quad-atv-utv-gume",
];

// ⚠️ Karlo 05.09.2026 (st.73): Vrste koje dijele Teretne i C gume's VLASTITE
// Marka/Dimenzije popise, različiti od preostalih 8 Vrsta u TIRE_FULL_FORM_VRSTE.
export const TERETNE_C_STYLE_VRSTE = ["teretne-c-gume", "agro-industrijske-gume"];

const FELGE_ZA_MARKU_VRSTE = ["aluminijske-felge", "celicne-felge", "kompleti-gume-felge", "ratkape"];

/** Je li ova kombinacija kategorija/podkategorija na "Auto dijelovi"-stilu (st.26, prošireno st.46 na cijelu kategoriju Dijelovi). */
export function isAutoDijeloviLayout(category: string): boolean {
  return category === "dijelovi";
}

/** Je li trenutna Vrsta jedna od "pune forme" guma/felgi (Marka=proizvođač, Dimenzije iznad Cijene, bez Model/OEM). */
export function isTireFullFormVrsta(category: string, subcategory: string, currentVrsta: string | undefined): boolean {
  return category === "dijelovi" && subcategory === "gume" && TIRE_FULL_FORM_VRSTE.includes(currentVrsta ?? "");
}

/** Ulja, maziva i aditivi + Autokozmetika i njega vozila dijele isti pojednostavljeni izbornik (st.107). */
export function isUljaMazivaLikeVrsta(currentVrsta: string | undefined): boolean {
  return currentVrsta === "ulja-maziva-aditivi" || currentVrsta === "autokozmetika-njega";
}

/**
 * Popis marki za polje "Marka"/"Za marku"/"Za Marku" — ovisi o Vrsti, ne o
 * podkategoriji (Gume i felge ima 13 djece, svako s vlastitim ili dijeljenim
 * popisom marki/proizvođača). `null` znači "koristi standardni resolver
 * pozivatelja" (makesForSub/categoryDef.makes/MAKES).
 */
export function makeListForVrsta(currentVrsta: string | undefined): CarMake[] | null {
  if (currentVrsta === "moto-atv-gume") return MOTO_GUME_TIRE_BRAND_MAKES;
  if (currentVrsta === "quad-atv-utv-gume") return QUAD_ATV_UTV_TIRE_BRAND_MAKES;
  if (currentVrsta === "ulja-maziva-aditivi") return ULJA_MAZIVA_BRAND_MAKES;
  if (FELGE_ZA_MARKU_VRSTE.includes(currentVrsta ?? "")) return MAKES;
  if (TERETNE_C_STYLE_VRSTE.includes(currentVrsta ?? "")) return TERETNE_C_TIRE_BRAND_MAKES;
  // ⚠️ Karlo 15.09.2026 (st.127): preostale "pune forme" gume (Ljetne, Zimske,
  // Cjelogodišnje) dobivaju opći popis PROIZVOĐAČA GUMA (228 brendova). Bez
  // ovoga su padale na podkategorijski popis = marke VOZILA (Abarth, Audi…),
  // 204 stavke — Karlo prijavio za Ljetne gume.
  // Felge NAMJERNO nisu ovdje: njihovo "Za Marku" znači marku VOZILA za koje
  // felge pašu, pa im `MAKES` iz grane gore ostaje ispravan.
  if (TIRE_FULL_FORM_VRSTE.includes(currentVrsta ?? "")) return TIRE_BRAND_MAKES;
  return null;
}

/**
 * Treba li popis marki za ovu Vrstu biti PLOSNAT (bez grupe "Najpopularnije")
 * — Ljetne/Zimske/... gume i Ulja, maziva i aditivi imaju vlastite plosnate
 * popise, sve ostalo (uklj. opći Auto dijelovi popis marki vozila) grupira.
 */
export function makeListIsFlatForVrsta(category: string, subcategory: string, currentVrsta: string | undefined): boolean {
  if (isTireFullFormVrsta(category, subcategory, currentVrsta) && !FELGE_ZA_MARKU_VRSTE.includes(currentVrsta ?? "")) return true;
  if (currentVrsta === "ulja-maziva-aditivi") return true;
  return false;
}

/** Naziv polja "Marka" — mijenja se po Vrsti (Marka / Za marku / Za Marku). */
export function makeLabelForVrsta(usesPartsLayout: boolean, isTireFullForm: boolean, currentVrsta: string | undefined): string {
  if (currentVrsta === "ulja-maziva-aditivi") return "Marka";
  // ⚠️ Karlo 16.09.2026 (st.134): Plovila / Oprema za plovila — "Za Marku"
  // (oprema se kupuje ZA plovilo, kao i felge ZA vozilo), velikim M kako je
  // Karlo napisao i kako već stoji kod felgi.
  if (currentVrsta === "oprema-za-plovila") return "Za Marku";
  if (FELGE_ZA_MARKU_VRSTE.includes(currentVrsta ?? "")) return "Za Marku";
  if (usesPartsLayout && !isTireFullForm) return "Za marku";
  return "Marka";
}

/** Je li Marka slobodan tekstualni upis za ovu Vrstu (neovisno o freeTextMakeField na razini podkategorije). */
export function makeIsFreeTextForVrsta(currentVrsta: string | undefined): boolean {
  return currentVrsta === "autokozmetika-njega";
}

/** Placeholder primjer za slobodni upis Marke, po Vrsti. */
export function makeFreeTextPlaceholderForVrsta(category: string, subcategory: string, currentVrsta: string | undefined): string {
  if (category === "dijelovi" && subcategory === "servisna-oprema") return "npr. Bosch, Facom, Snap-on...";
  if (currentVrsta === "autokozmetika-njega") return "npr. Sonax, Meguiar's, Turtle Wax...";
  return "npr. Jeanneau, Bavaria...";
}

/** Je li polje Model potpuno uklonjeno za ovu Vrstu (bez obzira na showsModelField/freeTextModelField). */
export function modelHiddenForVrsta(category: string, subcategory: string, currentVrsta: string | undefined): boolean {
  if (isTireFullFormVrsta(category, subcategory, currentVrsta)) return true;
  if (currentVrsta === "distancijeri-prstenovi" || currentVrsta === "tpms-senzori") return true;
  if (isUljaMazivaLikeVrsta(currentVrsta)) return true;
  return false;
}

/** Je li OEM / Proizvođač dijela (brandPart) polje skriveno za ovu Vrstu. */
export function oemBrandPartHiddenForVrsta(category: string, subcategory: string, currentVrsta: string | undefined): boolean {
  return isTireFullFormVrsta(category, subcategory, currentVrsta) || isUljaMazivaLikeVrsta(currentVrsta);
}

/** Je li Garancija-gumb skriven za ovu Vrstu. */
export function warrantyHiddenForVrsta(currentVrsta: string | undefined): boolean {
  return isUljaMazivaLikeVrsta(currentVrsta);
}

/** Je li "Stanje predmeta" (umjesto "Stanje vozila") skriveno u potpunosti za ovu Vrstu. */
export function stanjePredmetaHiddenForVrsta(currentVrsta: string | undefined): boolean {
  return isUljaMazivaLikeVrsta(currentVrsta);
}

/** Treba li ova (kategorija, podkategorija, Vrsta) kombinacija gušću Cijena ljestvicu (25€ koraci) umjesto grube (500€ koraci). */
export function usesDenseCijenaSteps(category: string, subcategory: string, currentVrsta: string | undefined): boolean {
  return category === "dijelovi" && (subcategory === "multimedija" || subcategory === "gume" || isUljaMazivaLikeVrsta(currentVrsta));
}

/**
 * ⚠️ Karlo 16.09.2026 (st.130/131/132): rubrike u kojima "Naziv ponude" (polje
 * `variant`) NIJE dodatak nego GLAVNI podatak — to je ono što korisnik prodaje.
 * Ondje naziv ide PRVI: u formi ispred Marke (st.130/131) i u NASLOVU objavljenog
 * oglasa (st.132: "mora biti u objavljenom oglasu u naslovu na prvom mjestu tako
 * da oglas ima smisla").
 *
 * "Gume i felge" su izričito izuzete — ondje je Marka (proizvođač gume) glavni
 * podatak, pa naslov ostaje standardni `marka model izvedba`.
 *
 * Koristi se i na klijentu (objava) i na serveru (supabase-adapter pri
 * sastavljanju naslova), zato živi ovdje a ne u komponenti.
 */
export function offerTitleFirst(category: string, subcategory: string | undefined): boolean {
  if (category === "dijelovi") return Boolean(subcategory) && subcategory !== "gume";
  return category === "prosti-cas" && subcategory === "kamping-oprema";
}

/**
 * Naslov oglasa. Za rubrike iz `offerTitleFirst` naziv ponude ide na početak
 * ("Tenda Fiamma F45s — Fiamma F45s"), inače standardno `marka model izvedba`.
 */
export function buildListingTitle(input: {
  category?: string; subcategory?: string;
  make: string; model: string; variant?: string; year: number | string;
}): string {
  const { make, model, variant, year } = input;
  const rest = `${make} ${model}`.trim();
  if (offerTitleFirst(input.category ?? "", input.subcategory) && variant?.trim()) {
    return `${variant.trim()}${rest ? ` — ${rest}` : ""} · ${year}.`;
  }
  return `${make} ${model}${variant ? " " + variant : ""} · ${year}.`;
}
