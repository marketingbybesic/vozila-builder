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
