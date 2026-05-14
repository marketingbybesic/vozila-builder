# Auti.hr — Path to Production

**Last updated:** 2026-05-14
**Stack:** Next.js 16.2.6 + React 19 + Drizzle ORM + Supabase Postgres + Vercel

Everything below is **stuff only Dino can do** (account creation, API keys, payments). I (the agent) cannot autonomously create accounts or paste secrets — but the code is already wired so each step is short.

Order matters. Stop at any step if something fails; the rest depend on it.

---

## 0. Local sanity check (1 min, verify state)

```bash
cd ~/Projects/auti-hr
npm run build
```

Expected: `Compiled successfully`, ~75 routes listed, exit 0.
If this fails, fix it before going further. Don't push broken code to Vercel.

The dev site works fully offline against the in-memory adapter:
```bash
npm run dev    # http://localhost:3000
```

Demo users you can use locally:
- `demo@auti.hr` (regular user, owns the 52 seed listings)
- `admin@auti.hr` (admin role, can reach `/admin`)

Both have no password set, so local-only signup with another email is the realistic test flow.

---

## 1. Create the Supabase project (5 min)

1. Go to https://supabase.com/dashboard → **New project**
2. Name: `auti-hr-prod` (or `auti-hr`)
3. Region: **Frankfurt (eu-central-1)** — closest to Croatia, GDPR-friendly
4. Database password: generate a strong one (Supabase suggests one). Save it to keychain:
   ```bash
   security add-generic-password -s "supabase_auti_db_password" -a "dino" -w
   # paste password, press Enter twice
   ```
5. Wait ~2 min for provisioning.
6. Settings → API → copy these values:
   - `Project URL` (e.g. `https://xyzabc.supabase.co`)
   - `anon public` key (long JWT)
   - `service_role secret` key (long JWT, **never** ship to client)
7. Settings → Database → Connection string → **URI** tab → switch to **Transaction** mode (port `6543`). Copy this. It's the value of `DATABASE_URL`. Replace `[YOUR-PASSWORD]` placeholder with the password from step 4.

### Save all 4 to keychain (one shot)
```bash
security add-generic-password -s "supabase_auti_url" -a "dino" -w "https://xyzabc.supabase.co"
security add-generic-password -s "supabase_auti_anon" -a "dino" -w "eyJhbGciOi..."
security add-generic-password -s "supabase_auti_service" -a "dino" -w "eyJhbGciOi..."
security add-generic-password -s "supabase_auti_db" -a "dino" -w "postgresql://postgres.xyz:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

Verify all 4 stored:
```bash
for k in supabase_auti_url supabase_auti_anon supabase_auti_service supabase_auti_db; do
  v=$(security find-generic-password -s "$k" -w 2>/dev/null)
  [ ${#v} -gt 0 ] && echo "$k: OK (${#v} chars)" || echo "$k: MISSING"
done
```

---

## 2. Write `.env.local` (30 sec)

```bash
cd ~/Projects/auti-hr
cat > .env.local <<EOF
DB_DRIVER=supabase
DATABASE_URL=$(security find-generic-password -s supabase_auti_db -w)
SUPABASE_URL=$(security find-generic-password -s supabase_auti_url -w)
SUPABASE_ANON_KEY=$(security find-generic-password -s supabase_auti_anon -w)
SUPABASE_SERVICE_ROLE=$(security find-generic-password -s supabase_auti_service -w)
SESSION_SECRET=$(openssl rand -hex 32)
INITIAL_ADMIN_EMAIL=dino@marketingbybesic.com
EOF
chmod 600 .env.local
```

`.env.local` is gitignored. Never commit it.

---

## 3. Push schema + seed listings (2 min)

```bash
cd ~/Projects/auti-hr

# Push all 9 tables from src/db/schema.ts
npx tsx --env-file=.env.local node_modules/drizzle-kit/bin.cjs push
# (drizzle-kit will ask "Are you sure?" — type y)

# Seed the demo user + 52 listings
npx tsx --env-file=.env.local scripts/seed-supabase.mts
```

Expected last line of seed: `[seed] Final counts: { users: 1, listings: 52, active: 52 }`.

If you ran it twice by accident, it's idempotent — second run says `52 skipped`.

---

## 4. Local verify (5 min)

```bash
DB_DRIVER=supabase npm run build
DB_DRIVER=supabase npm run dev   # http://localhost:3000
```

Walk these manually:
- `/` — homepage should show 6 featured cars from Supabase
- `/oglasi` — 52 listings, filters work, sort works, pagination works
- `/oglasi/[any-slug]` — detail page, gallery, contact card render
- Sign up with `dino@marketingbybesic.com` (or whatever you set as `INITIAL_ADMIN_EMAIL`) — that account auto-promotes to admin
- Reload after signup → you should STAY logged in (this is the bug we're fixing)
- `/admin` — should be reachable; KPIs show real counts from Supabase
- `/moj-racun` — your dashboard

If anything is broken, fix locally before pushing to Vercel.

---

## 5. Vercel env vars (3 min)

```bash
cd ~/Projects/auti-hr
vercel env add DB_DRIVER production    # type: supabase
vercel env add DATABASE_URL production # paste the URL from step 1
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE production
vercel env add SESSION_SECRET production            # paste openssl rand -hex 32 output
vercel env add INITIAL_ADMIN_EMAIL production       # paste your email
```

Optional: same for `preview` and `development` environments if you want previews to use Supabase too.

---

## 6. Redeploy to Vercel (1 min)

```bash
vercel --prod
```

Wait ~60 seconds for build. Vercel will print the production URL. Open it.

Walk the same checklist from step 4 but against the live URL:
- Sign up → reload → still signed in (no more session expired)
- Listings persist
- Admin can ban/promote users (test against a throwaway second signup)

---

## 7. (Optional) Supabase Storage for real photo uploads (10 min)

Right now `src/actions/uploads.ts` writes to `public/uploads/` — works in dev, **does NOT persist on Vercel** (read-only filesystem at runtime). Until this is swapped, listings shipped via `/objavi` keep their photos as base64 data-URLs in DB (works but bloats DB).

To swap:
1. Supabase → Storage → New bucket → name `listings` → Public bucket: YES
2. Bucket policies → allow `authenticated` role to upload (paste this SQL via Supabase SQL Editor):
   ```sql
   create policy "listings_owners_can_upload"
   on storage.objects for insert to authenticated
   with check (bucket_id = 'listings');

   create policy "listings_public_read"
   on storage.objects for select to public
   using (bucket_id = 'listings');
   ```
3. Edit `src/actions/uploads.ts` — replace the `writeFile` body with a Supabase Storage call using `@supabase/supabase-js` and `SUPABASE_SERVICE_ROLE`. Return the public URL of the uploaded object.
4. Redeploy.

---

## 8. (Optional) Email notifications (15 min, Resend)

Saved-search alerts and listing-report acknowledgements need SMTP. Cheapest: **Resend** (free tier: 100 emails/day).

1. https://resend.com → Sign up
2. Create API key → save to keychain: `security add-generic-password -s resend_api -a dino -w`
3. Verify your sending domain (`auti.hr`) — Resend gives you DNS records to paste into Hostinger
4. Add to Vercel:
   ```bash
   vercel env add RESEND_API_KEY production
   vercel env add EMAIL_FROM production    # noreply@auti.hr
   ```
5. Wire `src/lib/email.ts` (not built yet — create when ready).

Without this, saved-search "notify by email" is stored but never delivers. The UI says "obavijesti uključene" but the cron that actually sends isn't running.

---

## 9. (Optional) Stripe for boosts (20 min)

`/objavi` could later expose a "Boost ovaj oglas — 5€" button. The DB already has `listings.boostedUntil` column.

1. https://stripe.com → register HR business
2. Get publishable + secret keys → keychain
3. `vercel env add STRIPE_SECRET_KEY production` and `STRIPE_PUBLISHABLE_KEY` (also for preview)
4. Webhook secret → keychain
5. Create products in Stripe dashboard: "Boost — 7 dana" (5€), "Boost — 30 dana" (15€)
6. New action: `src/actions/payments.ts` (not built yet) — `createBoostCheckout(listingId, plan)`
7. New webhook route: `src/app/api/stripe/webhook/route.ts` — sets `boostedUntil` on payment success

Until this is wired, the schema column exists but no UI exposes it.

---

## 10. Custom domain (5 min)

When ready to go public:

1. Vercel → Project → Settings → Domains → Add `auti.hr` and `www.auti.hr`
2. Vercel gives you DNS records. Paste them into Hostinger (or whoever hosts auti.hr DNS).
3. Wait for DNS propagation (5-30 min).
4. Verify TLS auto-issues.
5. Update Next.js `metadataBase` in `src/app/layout.tsx` if you used anything other than `https://auti.hr`.

---

## Health check at the end

After all the above, this should be true:

- [ ] Build green: `npm run build` exits 0
- [ ] DB_DRIVER=supabase locally renders 52 listings on /oglasi
- [ ] Signup → reload → still signed in (production!)
- [ ] /admin reachable for the email in INITIAL_ADMIN_EMAIL
- [ ] /admin/oglasi shows 52 rows, featuring + deleting works, action lands in /admin/dnevnik
- [ ] /admin/korisnici can ban/promote (test against a second signup, not yourself)
- [ ] /admin/prijave queue empty until somebody submits via /oglasi/[slug]/prijavi
- [ ] /moj-racun/pretrage can save current /oglasi filter combo + delete it
- [ ] /usporedi side-by-side compare loads 2-4 cars
- [ ] /oglasi/napredno full filter form submits to /oglasi
- [ ] /marke A-Z directory shows live counts
- [ ] /oglasi/najnoviji shows last 100 by createdAt
- [ ] Header global search routes to /oglasi?q=…
- [ ] Listing card "Compare" + "Save" buttons work, sticky compare bar appears with 2+ items

---

## What's still NOT in production parity with avto.net

Things I deferred to keep scope under control. These can each become a small follow-up loop:

1. **Email-confirmation on signup** — currently signup just creates the session. Should send a verify-email link before granting full posting.
2. **Phone reveal logging** — schema has `phoneReveals` column, no UI calls it yet.
3. **Boost paid placement** — schema ready, no Stripe wiring.
4. **Multi-vertical** (Moto/Gospodarska/Mehanizacija/Prosti čas/Deli) — avto.net has 6 verticals. Auti.hr is cars-only.
5. **Saved-search email cron** — needs a daily/hourly job. Vercel Cron or n8n on Hermes.
6. **VIN history lookup** — needs HAK API integration (or just a link out for now).
7. **OG image generator** — currently uses listing's first photo. Could generate branded card via `next/og`.
8. **Real photo upload** — see step 7 above.

---

## Failure recovery

If something goes wrong:

- **Vercel build fails after env vars set:** check Vercel build logs for which env var is missing. `DATABASE_URL` is the most common — make sure it's the **pooler URL** (port 6543) not the direct URL (port 5432) for serverless.
- **Local build fine, Vercel build fails:** Vercel sometimes caches `node_modules`. Try **Redeploy without cache** from the dashboard.
- **Schema push complains "relation already exists":** that's fine, `drizzle-kit push` is idempotent on the schema side but won't drop columns. If you renamed a column, you may need to `npx drizzle-kit generate` + `migrate` instead.
- **Seed script complains about UUID conflicts:** also fine, idempotent. Re-running should say `52 skipped`.
- **`supabase` lib complains about `prepare: false`:** keep the `prepare: false` flag on the postgres-js client — Supabase pooler does not support PostgreSQL prepared statements.
