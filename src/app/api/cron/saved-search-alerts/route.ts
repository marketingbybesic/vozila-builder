import { NextResponse } from "next/server";
import { db } from "@/db";
import { sendSavedSearchAlert, isEmailConfigured } from "@/lib/email";
import { buildQueryString } from "@/lib/filter";
import type { ListingFilters } from "@/lib/types";

// Email-alarm engine. Pokreće ga Vercel Cron (vidi vercel.json) ili ručni poziv
// s ispravnim CRON_SECRET. Za svaku spremljenu pretragu s uključenim obavijestima:
//   1. izvrši filtere → dobij trenutni broj rezultata
//   2. usporedi s lastSeenCount
//   3. ako ima novih → pošalji email + ažuriraj lastSeenCount
//
// Dynamic jer čita bazu i šalje email; nikad se ne prerenderira.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://auti-hr.vercel.app";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // bez secreta ruta je zaključana
  // Vercel Cron šalje "Authorization: Bearer <CRON_SECRET>"
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // dopusti i ?secret= za ručno testiranje
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const database = db();
  const started = Date.now();

  let checked = 0;
  let withNew = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  try {
    const searches = await database.listSavedSearchesForAlerts();
    for (const search of searches) {
      checked++;
      try {
        const filters = search.filterJson as ListingFilters;
        const { items, total } = await database.listListings({ ...filters, page: 1 });
        const newCount = total - search.lastSeenCount;

        if (newCount > 0) {
          withNew++;
          if (!dryRun) {
            const searchUrl = `${SITE_URL}/oglasi?${buildQueryString(filters)}`;
            const res = await sendSavedSearchAlert({
              to: search.userEmail,
              firstName: search.userFirstName,
              searchName: search.name,
              newCount,
              listings: items, // najnoviji prvo (listListings sortira newest)
              searchUrl,
            });
            if (res.sent) emailsSent++;
            else if (res.error) errors.push(`${search.id}: ${res.error}`);
            // ažuriraj brojač bez obzira na ishod emaila da ne spamamo
            await database.updateSavedSearchSeenCount(search.id, total);
          }
        }
      } catch (e) {
        errors.push(`${search.id}: ${e instanceof Error ? e.message : "greška"}`);
      }
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "DB greška" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    emailConfigured: isEmailConfigured(),
    checked,
    withNew,
    emailsSent,
    errors,
    ms: Date.now() - started,
  });
}
