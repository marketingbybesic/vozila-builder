/**
 * Seed demo listings for non-auto categories (moto, gospodarska, mehanizacija,
 * prosti-cas, dijelovi) so every category tile on home leads to real content.
 *
 * Usage: npx tsx --env-file=.env.local scripts/seed-cross-categories.mts
 * Idempotent: skips on slug conflict.
 */
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

type SeedSpec = {
  category: string;
  subcategory: string;
  make: string;
  model: string;
  year: number;
  priceEur: number;
  km: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  drive: string;
  color: string;
  condition: string;
  engineCc: number;
  powerKw: number;
  doors: number;
  seats: number;
  city: string;
  county: string;
  description: string;
  features: string[];
  image: string; // single image URL placeholder
  sellerName: string;
  sellerType: string;
  sellerPhone: string;
  daysAgo: number;
};

const SPECS: SeedSpec[] = [
  // ─── MOTO ─────────────────────────────────────────────────────────────
  {
    category: "moto", subcategory: "motocikl", make: "Honda", model: "CB650R",
    year: 2022, priceEur: 7900, km: 12400, fuel: "Benzin", transmission: "Ručni",
    bodyType: "Coupe", drive: "Stražnji", color: "Crna", condition: "Rabljeno",
    engineCc: 649, powerKw: 70, doors: 2, seats: 2, city: "Zagreb", county: "Grad Zagreb",
    description: "Honda CB650R Neo Sports Cafe. Servisirana, ABS, Quickshifter. Jedan vlasnik.",
    features: ["ABS", "Quickshifter", "LED svjetla", "TFT zaslon", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80&auto=format&fit=crop",
    sellerName: "MotoPlus", sellerType: "Trgovac", sellerPhone: "+385 91 234 5678", daysAgo: 4,
  },
  {
    category: "moto", subcategory: "motocikl", make: "Yamaha", model: "MT-07",
    year: 2021, priceEur: 6500, km: 18900, fuel: "Benzin", transmission: "Ručni",
    bodyType: "Coupe", drive: "Stražnji", color: "Plava", condition: "Rabljeno",
    engineCc: 689, powerKw: 55, doors: 2, seats: 2, city: "Split", county: "Splitsko-dalmatinska županija",
    description: "Yamaha MT-07 2021. Akrapovič ispuh, R&G kavez. Garažiran.",
    features: ["ABS", "Akrapovič ispuh", "R&G kavez", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600&q=80&auto=format&fit=crop",
    sellerName: "Ivan Kovačević", sellerType: "Privatni", sellerPhone: "+385 98 765 4321", daysAgo: 2,
  },
  {
    category: "moto", subcategory: "skuter", make: "Vespa", model: "GTS 300",
    year: 2023, priceEur: 5200, km: 4200, fuel: "Benzin", transmission: "Automatski",
    bodyType: "Coupe", drive: "Stražnji", color: "Bijela", condition: "Rabljeno",
    engineCc: 278, powerKw: 17, doors: 2, seats: 2, city: "Rijeka", county: "Primorsko-goranska županija",
    description: "Vespa GTS 300 Super. Praktički nova, savršen za grad.",
    features: ["ABS", "Keyless go", "USB punjač"],
    image: "https://images.unsplash.com/photo-1580310614720-c45e9e8d3def?w=1600&q=80&auto=format&fit=crop",
    sellerName: "ScooterShop", sellerType: "Trgovac", sellerPhone: "+385 51 234 567", daysAgo: 7,
  },
  {
    category: "moto", subcategory: "motocikl", make: "Ducati", model: "Monster 821",
    year: 2019, priceEur: 9800, km: 22500, fuel: "Benzin", transmission: "Ručni",
    bodyType: "Coupe", drive: "Stražnji", color: "Crvena", condition: "Rabljeno",
    engineCc: 821, powerKw: 80, doors: 2, seats: 2, city: "Zagreb", county: "Grad Zagreb",
    description: "Ducati Monster 821 sa Termignoni ispuhom. Termin za servis odrađen.",
    features: ["ABS", "Riding modes", "Termignoni ispuh", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1517846693597-826b29610acf?w=1600&q=80&auto=format&fit=crop",
    sellerName: "Filip Jurić", sellerType: "Privatni", sellerPhone: "+385 99 234 5678", daysAgo: 10,
  },
  {
    category: "moto", subcategory: "atv-utv", make: "Polaris", model: "Sportsman 570",
    year: 2022, priceEur: 8500, km: 1200, fuel: "Benzin", transmission: "Automatski",
    bodyType: "Terenac", drive: "4x4", color: "Zelena", condition: "Rabljeno",
    engineCc: 567, powerKw: 32, doors: 0, seats: 2, city: "Varaždin", county: "Varaždinska županija",
    description: "Polaris Sportsman 570 EFI. 4x4, EPS, namijenjen za teški teren.",
    features: ["4x4", "EPS", "Vučna kuka", "Vitlo"],
    image: "https://images.unsplash.com/photo-1626068864513-a89b4c6c0cf2?w=1600&q=80&auto=format&fit=crop",
    sellerName: "OffroadCenter", sellerType: "Trgovac", sellerPhone: "+385 42 345 6789", daysAgo: 5,
  },
  {
    category: "moto", subcategory: "e-skuter", make: "NIU", model: "MQi+",
    year: 2024, priceEur: 2400, km: 800, fuel: "Električni", transmission: "Automatski",
    bodyType: "Coupe", drive: "Stražnji", color: "Bijela", condition: "Rabljeno",
    engineCc: 0, powerKw: 3, doors: 2, seats: 2, city: "Zagreb", county: "Grad Zagreb",
    description: "NIU MQi+ električni skuter, doseg 70km. Aplikacija, GPS.",
    features: ["GPS", "Aplikacija", "Otkljucavanje karticom"],
    image: "https://images.unsplash.com/photo-1564898044693-4ca5b6e5f87a?w=1600&q=80&auto=format&fit=crop",
    sellerName: "Marko Bilić", sellerType: "Privatni", sellerPhone: "+385 91 987 6543", daysAgo: 3,
  },

  // ─── GOSPODARSKA (commercial vehicles) ────────────────────────────────
  {
    category: "gospodarska", subcategory: "dostavna", make: "Mercedes-Benz", model: "Sprinter 316 CDI",
    year: 2020, priceEur: 24500, km: 142000, fuel: "Dizel", transmission: "Ručni",
    bodyType: "Kombi", drive: "Stražnji", color: "Bijela", condition: "Rabljeno",
    engineCc: 2143, powerKw: 120, doors: 5, seats: 3, city: "Zagreb", county: "Grad Zagreb",
    description: "Mercedes Sprinter 316 CDI L2H2. Srednje šasija, klimatiziran. Idealan za dostavu.",
    features: ["Klima", "Tempomat", "Senzori parkiranja", "Bluetooth", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1600&q=80&auto=format&fit=crop",
    sellerName: "VanCenter Zagreb", sellerType: "Trgovac", sellerPhone: "+385 1 234 5678", daysAgo: 6,
  },
  {
    category: "gospodarska", subcategory: "kamioni", make: "MAN", model: "TGX 18.500",
    year: 2019, priceEur: 58900, km: 480000, fuel: "Dizel", transmission: "Automatski",
    bodyType: "Kombi", drive: "Stražnji", color: "Plava", condition: "Rabljeno",
    engineCc: 12419, powerKw: 368, doors: 2, seats: 2, city: "Slavonski Brod", county: "Brodsko-posavska županija",
    description: "MAN TGX 18.500 4x2. EURO 6, zračni ovjes, navigacija. Spreman za rad.",
    features: ["EURO 6", "Zračni ovjes", "Navigacija", "Tempomat", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80&auto=format&fit=crop",
    sellerName: "TransLog d.o.o.", sellerType: "Trgovac", sellerPhone: "+385 35 234 567", daysAgo: 8,
  },
  {
    category: "gospodarska", subcategory: "dostavna", make: "Ford", model: "Transit Custom 2.0 TDCi",
    year: 2021, priceEur: 19900, km: 86000, fuel: "Dizel", transmission: "Ručni",
    bodyType: "Kombi", drive: "Prednji", color: "Siva", condition: "Rabljeno",
    engineCc: 1996, powerKw: 96, doors: 5, seats: 3, city: "Split", county: "Splitsko-dalmatinska županija",
    description: "Ford Transit Custom L1H1. Klimatiziran, kamera unatrag.",
    features: ["Klima", "Bluetooth", "Kamera unatrag", "Apple CarPlay", "Senzori parkiranja"],
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&q=80&auto=format&fit=crop",
    sellerName: "Marko Tomić", sellerType: "Privatni", sellerPhone: "+385 21 234 567", daysAgo: 4,
  },
  {
    category: "gospodarska", subcategory: "kamioni", make: "Iveco", model: "Daily 70C18",
    year: 2018, priceEur: 27500, km: 215000, fuel: "Dizel", transmission: "Ručni",
    bodyType: "Kombi", drive: "Stražnji", color: "Bijela", condition: "Rabljeno",
    engineCc: 2998, powerKw: 132, doors: 2, seats: 3, city: "Osijek", county: "Osječko-baranjska županija",
    description: "Iveco Daily 70C18 sa cerada platformom. Nosivost 3.5t.",
    features: ["EURO 6", "Bluetooth", "Tempomat", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=1600&q=80&auto=format&fit=crop",
    sellerName: "BrzaDostavaHR", sellerType: "Trgovac", sellerPhone: "+385 31 234 567", daysAgo: 11,
  },
  {
    category: "gospodarska", subcategory: "autobusi", make: "Mercedes-Benz", model: "Tourismo 17 RHD",
    year: 2017, priceEur: 165000, km: 720000, fuel: "Dizel", transmission: "Automatski",
    bodyType: "Kombi", drive: "Stražnji", color: "Bijela", condition: "Rabljeno",
    engineCc: 10677, powerKw: 315, doors: 2, seats: 49, city: "Zagreb", county: "Grad Zagreb",
    description: "Mercedes Tourismo 17 RHD 49+1+1. WC, kuhinja, klima, retarder.",
    features: ["WC", "Kuhinja", "Klima", "Retarder", "Tempomat", "EURO 6"],
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1600&q=80&auto=format&fit=crop",
    sellerName: "BusLine Zagreb", sellerType: "Trgovac", sellerPhone: "+385 1 567 8901", daysAgo: 14,
  },

  // ─── MEHANIZACIJA (machinery) ─────────────────────────────────────────
  {
    category: "mehanizacija", subcategory: "traktori", make: "John Deere", model: "6120M",
    year: 2020, priceEur: 78500, km: 1850, fuel: "Dizel", transmission: "Automatski",
    bodyType: "Terenac", drive: "4x4", color: "Zelena", condition: "Rabljeno",
    engineCc: 4525, powerKw: 88, doors: 2, seats: 2, city: "Vinkovci", county: "Vukovarsko-srijemska županija",
    description: "John Deere 6120M. 4x4, klimatizirana kabina, prednji utovarivač H310 uključen.",
    features: ["4x4", "Klimatizirana kabina", "Prednji utovarivač", "GPS spreman", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1605338198618-bf52ad24a4fa?w=1600&q=80&auto=format&fit=crop",
    sellerName: "AgroPlus", sellerType: "Trgovac", sellerPhone: "+385 32 234 567", daysAgo: 9,
  },
  {
    category: "mehanizacija", subcategory: "bageri", make: "Caterpillar", model: "320 GC",
    year: 2019, priceEur: 92000, km: 4200, fuel: "Dizel", transmission: "Automatski",
    bodyType: "Terenac", drive: "4x4", color: "Žuta", condition: "Rabljeno",
    engineCc: 7010, powerKw: 89, doors: 2, seats: 1, city: "Zagreb", county: "Grad Zagreb",
    description: "CAT 320 GC gusjeničar. 21t klasa, klima, izvanredno stanje.",
    features: ["Klima", "Radio", "Kamera unatrag", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1582489935344-31a8b89dca85?w=1600&q=80&auto=format&fit=crop",
    sellerName: "GradMehHR", sellerType: "Trgovac", sellerPhone: "+385 1 345 6789", daysAgo: 12,
  },
  {
    category: "mehanizacija", subcategory: "utovarivaci", make: "JCB", model: "3CX Eco",
    year: 2021, priceEur: 68500, km: 2100, fuel: "Dizel", transmission: "Automatski",
    bodyType: "Terenac", drive: "4x4", color: "Žuta", condition: "Rabljeno",
    engineCc: 4400, powerKw: 81, doors: 2, seats: 1, city: "Rijeka", county: "Primorsko-goranska županija",
    description: "JCB 3CX Eco backhoe utovarivač. 4x4, klimatizirana kabina, povratni utovarivač.",
    features: ["4x4", "Klima", "Telematics", "Servisna knjižica"],
    image: "https://images.unsplash.com/photo-1581094488379-c52e6e1b4ff8?w=1600&q=80&auto=format&fit=crop",
    sellerName: "Damir Horvat", sellerType: "Privatni", sellerPhone: "+385 99 876 5432", daysAgo: 6,
  },
  {
    category: "mehanizacija", subcategory: "viljuskari", make: "Kubota", model: "FB18",
    year: 2022, priceEur: 18900, km: 650, fuel: "Električni", transmission: "Automatski",
    bodyType: "Terenac", drive: "Prednji", color: "Plava", condition: "Rabljeno",
    engineCc: 0, powerKw: 9, doors: 0, seats: 1, city: "Zagreb", county: "Grad Zagreb",
    description: "Kubota FB18 električni viljuškar, nosivost 1.8t. Punjač uključen.",
    features: ["Punjač uključen", "LED svjetla", "Sigurnosni pojas"],
    image: "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=1600&q=80&auto=format&fit=crop",
    sellerName: "LogiCentar", sellerType: "Trgovac", sellerPhone: "+385 1 678 9012", daysAgo: 3,
  },

  // ─── PROSTI-CAS (leisure: campers, caravans, boats) ───────────────────
  {
    category: "prosti-cas", subcategory: "kamperi", make: "Adria", model: "Coral XL Plus 670 DK",
    year: 2022, priceEur: 78900, km: 18500, fuel: "Dizel", transmission: "Automatski",
    bodyType: "Kombi", drive: "Prednji", color: "Bijela", condition: "Rabljeno",
    engineCc: 2287, powerKw: 130, doors: 4, seats: 6, city: "Zagreb", county: "Grad Zagreb",
    description: "Adria Coral XL Plus 670 DK. 6 spavanja, kupaonica, kuhinja. Spreman za putovanje.",
    features: ["Klima", "Solarni panel", "TV", "Bojler", "Cyrki za ovjes", "Markiza"],
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80&auto=format&fit=crop",
    sellerName: "AdriaCenter", sellerType: "Trgovac", sellerPhone: "+385 1 789 0123", daysAgo: 7,
  },
  {
    category: "prosti-cas", subcategory: "kamperi", make: "Hymer", model: "B-Klasa MasterLine 580",
    year: 2021, priceEur: 89500, km: 32000, fuel: "Dizel", transmission: "Automatski",
    bodyType: "Kombi", drive: "Prednji", color: "Bijela", condition: "Rabljeno",
    engineCc: 2287, powerKw: 130, doors: 4, seats: 4, city: "Split", county: "Splitsko-dalmatinska županija",
    description: "Hymer B-Klasa MasterLine 580. Integralni kamper, 4 spavanja, premium oprema.",
    features: ["Klima", "Grijanje", "Solar", "Markiza", "Sat-TV", "Aluminijske felge"],
    image: "https://images.unsplash.com/photo-1543395136-93dab68a02cc?w=1600&q=80&auto=format&fit=crop",
    sellerName: "Petar Marić", sellerType: "Privatni", sellerPhone: "+385 91 345 6789", daysAgo: 5,
  },
  {
    category: "prosti-cas", subcategory: "kamp-prikolice", make: "Hobby", model: "On Tour 460 UFe",
    year: 2023, priceEur: 21500, km: 0, fuel: "Benzin", transmission: "Ručni",
    bodyType: "Kombi", drive: "Prednji", color: "Bijela", condition: "Novo",
    engineCc: 0, powerKw: 0, doors: 1, seats: 4, city: "Zadar", county: "Zadarska županija",
    description: "Hobby On Tour 460 UFe kamp prikolica, 4 spavanja. Niska visina, lako vučenje.",
    features: ["Solar", "Tuš", "Bojler", "Markiza"],
    image: "https://images.unsplash.com/photo-1597289124948-688478b7e4cd?w=1600&q=80&auto=format&fit=crop",
    sellerName: "HobbyHrvatska", sellerType: "Trgovac", sellerPhone: "+385 23 234 567", daysAgo: 2,
  },
  {
    category: "prosti-cas", subcategory: "plovila", make: "Quicksilver", model: "Activ 605 Open",
    year: 2022, priceEur: 32500, km: 0, fuel: "Benzin", transmission: "Automatski",
    bodyType: "Cabrio", drive: "Stražnji", color: "Bijela", condition: "Rabljeno",
    engineCc: 0, powerKw: 110, doors: 0, seats: 7, city: "Pula", county: "Istarska županija",
    description: "Quicksilver Activ 605 Open. Mercury 150HP. Spreman za sezonu, opremljen elektrikom.",
    features: ["GPS", "Echo sounder", "Tuš na palubi", "Stol", "Markiza"],
    image: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1600&q=80&auto=format&fit=crop",
    sellerName: "Adria Nautica", sellerType: "Trgovac", sellerPhone: "+385 52 234 567", daysAgo: 9,
  },
  {
    category: "prosti-cas", subcategory: "kamperi", make: "Dethleffs", model: "Trend T 7057 EB",
    year: 2020, priceEur: 62000, km: 45000, fuel: "Dizel", transmission: "Ručni",
    bodyType: "Kombi", drive: "Prednji", color: "Siva", condition: "Rabljeno",
    engineCc: 2287, powerKw: 110, doors: 4, seats: 4, city: "Rijeka", county: "Primorsko-goranska županija",
    description: "Dethleffs Trend T 7057 EB. Bračni krevet, garaža, prostrana kupaonica.",
    features: ["Klima", "Grijanje", "Solar", "Markiza", "Bojler"],
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80&auto=format&fit=crop",
    sellerName: "CamperLife", sellerType: "Trgovac", sellerPhone: "+385 51 345 6789", daysAgo: 11,
  },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/č|ć/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 4, idle_timeout: 5 });
  console.log("[seed-cross] Connecting…");
  await sql`select 1`;
  console.log("[seed-cross] Connected.");

  let inserted = 0;
  let skipped = 0;
  let counter = 100;
  for (const s of SPECS) {
    counter++;
    const slug = `${slugify(`${s.make}-${s.model}-${s.year}-${s.city}`)}-lst-${String(counter).padStart(4, "0")}`;
    const title = `${s.make} ${s.model} · ${s.year}.`;
    const createdAt = new Date(Date.now() - s.daysAgo * 86400_000).toISOString();
    const views = Math.floor(Math.random() * 500) + 50;
    const exists = await sql`select 1 from listings where slug = ${slug} limit 1`;
    if (exists.length > 0) {
      skipped++;
      continue;
    }
    await sql`
      insert into listings (
        slug, user_id, title, category, subcategory, make, model,
        year, price_eur, km, fuel, transmission, body_type, drive, color, condition,
        engine_cc, power_kw, doors, seats,
        city, county, description, features, images,
        status, featured, views, phone_reveals, created_at, updated_at
      ) values (
        ${slug}, ${DEMO_USER_ID}, ${title}, ${s.category}, ${s.subcategory},
        ${s.make}, ${s.model},
        ${s.year}, ${s.priceEur}, ${s.km},
        ${s.fuel}, ${s.transmission}, ${s.bodyType}, ${s.drive}, ${s.color}, ${s.condition},
        ${s.engineCc}, ${s.powerKw}, ${s.doors}, ${s.seats},
        ${s.city}, ${s.county}, ${s.description},
        ${sql.json(s.features)}, ${sql.json([s.image])},
        'active', false, ${views}, 0,
        ${createdAt}, ${createdAt}
      )
    `;
    inserted++;
  }

  const counts = await sql`select category, count(*)::int as n from listings group by category order by category`;
  console.log(`[seed-cross] ${inserted} inserted, ${skipped} skipped.`);
  console.log("[seed-cross] Final per-category counts:", counts);

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
