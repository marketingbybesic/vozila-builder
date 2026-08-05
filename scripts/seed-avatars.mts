/**
 * Logotipi za trgovce + profilne slike za privatne korisnike.
 *
 * Dino 05.08.2026: "kreiraj logotipe, ne moraju biti lijepi ali da izgledaju
 * kao pravi računi; za privatne korisnike stavi stock slike kao profilnu".
 *
 * ⚠️ Zašto SVG data-URI, a ne Cloudflare/Envato:
 *  - Cloudflare Images je CDN za HOSTANJE slika, ne generator logotipa; njihov
 *    Workers AI radi fotografije, a ne čiste vektorske znakove s tekstom.
 *  - Envato preview slike nose WATERMARK (već provjereno 30.07.) → neupotrebljivo
 *    bez kupnje po stavci.
 *  Zato se logotipi crtaju kao SVG (monogram + ime u boji marke) i spremaju kao
 *  data-URI: nula vanjskih zahtjeva, nula troška, radi offline i ne može puknuti
 *  404. Za privatne korisnike koriste se besplatne Unsplash portretne fotke.
 *
 * Usage: npx tsx --env-file=.env.local scripts/seed-avatars.mts
 * Idempotentno — preskače korisnike koji već imaju avatar.
 */
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[avatars] DATABASE_URL nije postavljen.");
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { max: 1, prepare: false });

/** Paleta u duhu stranice — tamnoplava baza + jedna naglasna boja po trgovcu. */
const PALETA = [
  { bg: "#0A1628", fg: "#F5A524" },
  { bg: "#12233D", fg: "#E85D2A" },
  { bg: "#0F1D33", fg: "#3FA9F5" },
  { bg: "#141F33", fg: "#4CAF50" },
  { bg: "#1A1A2E", fg: "#E94560" },
  { bg: "#0D1B2A", fg: "#FFC947" },
];

/** Monogram: prva slova prvih dviju riječi ("Autohaus Rijeka" → "AR"). */
function monogram(ime: string): string {
  return ime.split(/\s+/).filter(Boolean).slice(0, 2).map((r) => r[0]?.toUpperCase() ?? "").join("");
}

/**
 * Logotip: kvadrat sa zaobljenim rubom, monogram i kosa crta koja podsjeća na
 * cestu — dovoljno da izgleda kao znak auto-kuće, bez pretenzija na dizajn.
 */
function logoSvg(ime: string, i: number): string {
  const { bg, fg } = PALETA[i % PALETA.length];
  const m = monogram(ime);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
<rect width="128" height="128" rx="24" fill="${bg}"/>
<path d="M0 96 L128 64 L128 128 L0 128 Z" fill="${fg}" opacity="0.14"/>
<path d="M18 104 L110 78" stroke="${fg}" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
<text x="64" y="70" font-family="Helvetica,Arial,sans-serif" font-size="46" font-weight="700"
      fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">${m}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Besplatne Unsplash portretne fotografije (stabilni ID-evi, provjereni). */
const PORTRETI = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=faces",
];

// ── Trgovci ──────────────────────────────────────────────────────────────
const trgovci = await sql<{ id: string; first_name: string }[]>`
  select id, first_name from users
  where seller_type = 'Trgovac' and (avatar_url is null or avatar_url = '')
  order by created_at
`;
let logotipi = 0;
for (const [i, t] of trgovci.entries()) {
  await sql`update users set avatar_url = ${logoSvg(t.first_name ?? "Auto", i)} where id = ${t.id}`;
  logotipi++;
}

// ── Privatni ─────────────────────────────────────────────────────────────
const privatni = await sql<{ id: string }[]>`
  select id from users
  where seller_type <> 'Trgovac' and (avatar_url is null or avatar_url = '')
  order by created_at
`;
let profilne = 0;
for (const [i, p] of privatni.entries()) {
  await sql`update users set avatar_url = ${PORTRETI[i % PORTRETI.length]} where id = ${p.id}`;
  profilne++;
}

console.log(`[avatars] Gotovo. Logotipi trgovaca: ${logotipi}, profilne privatnih: ${profilne}`);
await sql.end();
