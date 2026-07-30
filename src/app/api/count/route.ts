import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { parseFilters } from "@/lib/filter";

/**
 * Živi brojač rezultata za naprednu pretragu.
 *
 * Prije je `napredno-form.tsx` računao broj klijentski nad `LISTINGS` iz
 * `src/data/listings.ts` — a to je 52-člani DEMO seed, ne živa baza od 1.224
 * oglasa. Gumb je dakle pokazivao izmišljen broj ("Prikaži 7 vozila" dok je
 * stvarni rezultat bio 180), a uz to je cijeli 866 KB modul putovao u klijentski
 * bundle. Sada brojanje radi server nad pravim podacima.
 */
export async function GET(req: NextRequest) {
  const sp: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    sp[k] = v;
  });

  try {
    const filters = parseFilters(sp);
    // `page` ne smije sužavati broj — zanima nas ukupan pogodak, ne stranica.
    const { total } = await db().listListings({ ...filters, page: 1 });
    return NextResponse.json({ total });
  } catch (err) {
    console.warn("[api/count] failed:", err);
    // Brojač je pomoćna informacija — ne rušimo formu ako baza zakaže.
    return NextResponse.json({ total: null }, { status: 200 });
  }
}
