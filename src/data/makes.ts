// Marke + modeli — avto.net pokrivenost (HR tržište). 203 marke, abecedno po `name`.
// ⚠️ Karlo 12.08.2026: popis dopunjen sa 100 na 203 (avto.net "Vse znamke").
// Dodavati SAMO na kraj liste pa presortirati — postojeći slugovi se NE mijenjaju,
// inače oglasi u bazi s tom markom ispadnu iz filtera (enum drift).
import type { CarMake } from "@/lib/types";

export const MAKES: CarMake[] = [
  {
    slug: "abarth",
    name: "Abarth",
    country: "Italija",
    // ⚠️ Karlo 12.08.2026: njegov screenshot pokazuje 124/595/695, ali je
    // odrezan. "500" NE brišem — 6 živih oglasa na produkciji koristi baš taj
    // model, brisanje bi ih izbacilo iz filtera po modelu. Dodan "124".
    models: ["124", "500", "595", "695"],
  },
  {
    slug: "aeolus",
    name: "Aeolus",
    country: "Kina",
    // ⚠️ Karlo 12.08.2026: točan popis s avto.neta (poslao screenshot).
    models: ["A60", "A70", "AX7", "E70", "Haohan", "Haoji", "L7", "L8", "Sky EV01", "Yixuan", "Yixuan GS", "Yixuan Max"],
  },
  {
    slug: "aev",
    name: "AEV",
    country: "SAD",
    // ⚠️ Karlo 12.08.2026: na avto.netu AEV nema nijedan model — samo
    // "svi modeli" i "modela nema na listi". Prazan niz je namjeran.
    models: [],
  },
  {
    slug: "aito",
    name: "Aito",
    country: "Kina",
    models: ["M9"],
  },
  {
    slug: "aiways",
    name: "Aiways",
    country: "Kina",
    models: ["U5", "U6"],
  },
  {
    slug: "aixam",
    name: "Aixam",
    country: "Francuska",
    models: ["City", "Coupe", "Cross", "MinAuto", "Roadline", "Scouty R"],
  },
  {
    slug: "alfa-romeo",
    name: "Alfa Romeo",
    country: "Italija",
    models: ["145", "146", "147", "155", "156", "156 Sportwagon", "159", "159 Sportwagon", "164", "166", "1750", "33", "4C", "75", "8C", "90", "Alfasud", "Alfetta", "Brera", "Crosswagon", "Giulia", "Giulietta", "GT", "GTV", "Junior", "MiTo", "RZ", "Spider", "Sprint", "Stelvio", "SZ", "Tonale"],
  },
  {
    slug: "alpine",
    name: "Alpine",
    country: "Francuska",
    models: ["A110", "A290", "A390"],
  },
  {
    slug: "aro",
    name: "Aro",
    country: "Rumunjska",
    models: ["10", "24"],
  },
  {
    slug: "artega",
    name: "Artega",
    country: "Njemačka",
    models: [],
  },
  {
    slug: "aston-martin",
    name: "Aston Martin",
    country: "Velika Britanija",
    models: ["Cygnet", "DB", "DB11", "DB12", "DB7", "DB9", "DBS", "DBX", "Lagonda", "One-77", "Rapide", "V8", "Vanquish", "Vantage", "Virage", "Volante", "Zagato"],
  },
  {
    slug: "audi",
    name: "Audi",
    country: "Njemačka",
    models: ["100", "200", "50", "60", "80", "90", "A1", "A2", "A3", "A3 Cabriolet", "A4", "A4 Allroad", "A4 Avant", "A4 Cabriolet", "A5", "A5 Avant", "A5 Cabriolet", "A5 Sportback", "A6", "A6 Allroad", "A6 Avant", "A6 Avant e-tron", "A6 Sportback e-tron", "A7", "A8", "Cabriolet", "Coupe", "e-tron", "e-tron GT", "e-tron Sportback", "Q1", "Q2", "Q3", "Q3 Sportback", "Q4", "Q4 e-tron", "Q4 Sportback e-tron", "Q5", "Q5 Sportback", "Q6", "Q6 e-tron", "Q6 Sportback e-tron", "Q7", "Q8", "Q8 e-tron", "Q8 e-tron Sportback", "R8", "RS Q3", "RS Q3 Sportback", "RS Q8", "RS2", "RS3", "RS4", "RS4 Avant", "RS5", "RS5 Cabriolet", "RS6", "RS6 Avant", "RS7", "S1", "S2", "S3", "S3 Cabriolet", "S4", "S4 Cabriolet", "S5", "S5 Avant", "S5 Sportback", "S6", "S7", "S8", "SQ2", "SQ5", "SQ6 e-tron", "SQ6 Sportback e-tron", "SQ7", "SQ8", "TT", "TT RS", "TTS", "V8"],
  },
  {
    slug: "austin",
    name: "Austin",
    country: "Velika Britanija",
    models: ["Metro", "Mini"],
  },
  {
    slug: "autobianchi",
    name: "Autobianchi",
    country: "Italija",
    models: ["A112", "Bianchina", "Primula"],
  },
  {
    slug: "baic",
    name: "BAIC",
    country: "Kina",
    models: ["BJ30", "BJ40 PRO", "BJ60", "X55", "X7"],
  },
  {
    slug: "baw",
    name: "BAW",
    country: "Kina",
    models: ["212", "A00", "Brumby", "E6", "E7", "F7", "M7", "M8", "Warrior"],
  },
  {
    slug: "bellier",
    name: "Bellier",
    country: "Francuska",
    models: ["Asso", "Atoll", "B8", "Cabriolet", "Divane", "Jade", "Opale", "Sturdy", "VX"],
  },
  {
    slug: "bentley",
    name: "Bentley",
    country: "Velika Britanija",
    models: ["Arnage", "Azure", "Bentayga", "Brooklands", "Continental", "Eight", "Flying Spur", "Mulsanne", "Turbo"],
  },
  {
    slug: "bertone",
    name: "Bertone",
    country: "Italija",
    models: ["Freeclimber"],
  },
  {
    slug: "bestune",
    name: "Bestune",
    country: "Kina",
    models: ["T77", "T99", "B70"],
  },
  {
    slug: "bmw",
    name: "BMW",
    country: "Njemačka",
    models: ["1802", "1M Coupe", "2002", "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX2", "iX3", "M1", "M2", "M3", "M4", "M5", "M6", "M8", "Serija 1", "Serija 1 Cabrio", "Serija 1 Coupe", "Serija 2", "Serija 2 Active Tourer", "Serija 2 Cabrio", "Serija 2 Coupe", "Serija 2 Gran Coupe", "Serija 2 Gran Tourer", "Serija 3", "Serija 3 Cabrio", "Serija 3 Compact", "Serija 3 Coupe", "Serija 3 Gran Turismo", "Serija 3 Touring", "Serija 4", "Serija 4 Cabrio", "Serija 4 Coupe", "Serija 4 Gran Coupe", "Serija 5", "Serija 5 Gran Turismo", "Serija 5 Touring", "Serija 6", "Serija 6 Cabrio", "Serija 6 Coupe", "Serija 6 Gran Coupe", "Serija 6 Gran Turismo", "Serija 7", "Serija 8", "Serija 8 Cabrio", "Serija 8 Coupe", "Serija 8 Gran Coupe", "Serija X1", "Serija X2", "Serija X3", "Serija X4", "Serija X5", "Serija X6", "Serija X7", "X1", "X1 SDRIVE18D", "X3", "X3 XDRIVE20D", "XM", "Z1", "Z3", "Z4", "Z8"],
  },
  {
    slug: "borgward",
    name: "Borgward",
    country: "Njemačka",
    models: ["BX3", "BX5", "BX7"],
  },
  {
    slug: "brilliance",
    name: "Brilliance",
    country: "Kina",
    models: [],
  },
  {
    slug: "bugatti",
    name: "Bugatti",
    country: "Francuska",
    models: ["Chiron", "EB 110", "Veyron"],
  },
  {
    slug: "buick",
    name: "Buick",
    country: "SAD",
    models: [],
  },
  {
    slug: "byd",
    name: "BYD",
    country: "Kina",
    models: ["Atto 2", "Atto 3", "Dolphin Surf", "Han", "Leopard 8", "Seal", "Seal 6", "Seal U", "Sealion 5", "Sealion 7", "Tang"],
  },
  {
    slug: "cadillac",
    name: "Cadillac",
    country: "SAD",
    models: ["Allante", "ATS", "BLS", "CT5", "CT6", "CTS", "DeVille", "Eldorado", "Escalade", "Fleetwood", "Seville", "SRX", "STS", "XLR", "XTS"],
  },
  {
    slug: "casalini",
    name: "Casalini",
    country: "Italija",
    models: [],
  },
  {
    slug: "caterham",
    name: "Caterham",
    country: "Velika Britanija",
    models: ["Seven"],
  },
  {
    slug: "changan",
    name: "Changan",
    country: "Kina",
    models: ["CS55 Plus", "CS75 Plus", "Deepal S05", "Deepal S07"],
  },
  {
    slug: "chatenet",
    name: "Chatenet",
    country: "Francuska",
    models: ["Barooder", "CH", "Media", "Speedino", "Stella"],
  },
  {
    slug: "chevrolet",
    name: "Chevrolet",
    country: "SAD",
    models: ["Astro", "Avalanche", "Aveo", "Beretta", "Blazer", "Camaro", "Captiva", "Cavalier", "Corvette", "Cruze", "Epica", "Equinox", "Evanda", "HHR", "Kalos", "Lacetti", "Lumina", "Malibu", "Matiz", "Nubira", "Orlando", "Rezzo", "Spark", "Suburban", "Tacuma", "Tahoe", "TrailBlazer", "Trans Sport", "Trax", "Volt"],
  },
  {
    slug: "chrysler",
    name: "Chrysler",
    country: "SAD",
    models: ["300C", "300M", "Crossfire", "ES", "Grand Voyager", "Le Baron", "Neon", "New Yorker", "Pacifica", "PT Cruiser", "Saratoga", "Sebring", "Stratus", "Viper", "Vision", "Voyager"],
  },
  {
    slug: "citroen",
    name: "Citroën",
    country: "Francuska",
    models: ["2 CV", "Ami", "AX", "Berlingo", "BX", "C-Crosser", "C-Elysee", "C-Zero", "C1", "C2", "C3", "C3 Aircross", "C3 Picasso", "C3 Pluriel", "C4", "C4 Aircross", "C4 Cactus", "C4 Grand Picasso", "C4 Grand SpaceTourer", "C4 Picasso", "C4 SpaceTourer", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "C8", "CX", "DS", "DS3", "DS4", "DS5", "Dyane", "Evasion", "GS", "GSA", "Jumpy", "LN", "Lomax", "Nemo", "Saxo", "SM", "SpaceTourer", "Visa", "Xantia", "XM", "Xsara", "Xsara Picasso", "ZX"],
  },
  {
    slug: "cobra",
    name: "Cobra",
    country: "Velika Britanija",
    models: [],
  },
  {
    slug: "cupra",
    name: "Cupra",
    country: "Španjolska",
    models: ["Ateca", "Born", "Formentor", "Leon", "Raval", "Tavascan", "Terramar"],
  },
  {
    slug: "dacia",
    name: "Dacia",
    country: "Rumunjska",
    models: ["Bigster", "Dokker", "Duster", "Jogger", "Lodgy", "Logan", "Sandero", "Spring", "Striker"],
  },
  {
    slug: "daewoo",
    name: "Daewoo",
    country: "Južna Koreja",
    models: ["Chairman", "Espero", "Evanda", "Kalos", "Korando", "Lacetti", "Lanos", "Leganza", "Matiz", "Musso", "Nexia", "Nubira", "Racer", "Tacuma", "Tico"],
  },
  {
    slug: "daf",
    name: "DAF",
    country: "Nizozemska",
    models: ["Daffodil"],
  },
  {
    slug: "daihatsu",
    name: "Daihatsu",
    country: "Japan",
    models: ["Applause", "Charade", "Copen", "Cuore", "Feroza", "Freeclimber", "Gran Move", "Materia", "Move", "Rocky", "Sirion", "Terios", "Trevis", "YRV"],
  },
  {
    slug: "denza",
    name: "Denza",
    country: "Kina",
    models: ["D9", "N7", "N8", "Z9"],
  },
  {
    slug: "dfsk",
    name: "DFSK",
    country: "Kina",
    models: ["Seres 3", "Seres 5"],
  },
  {
    slug: "dkw",
    name: "DKW",
    country: "Njemačka",
    models: ["Junior"],
  },
  {
    slug: "dodge",
    name: "Dodge",
    country: "SAD",
    models: ["Avenger", "Caliber", "Caravan", "Challenger", "Charger", "Durango", "Journey", "Magnum", "Nitro", "RAM", "Stealth", "Viper"],
  },
  {
    slug: "dongfeng",
    name: "Dongfeng",
    country: "Kina",
    models: ["Box", "Huge", "M-Hero", "Mage", "Shine"],
  },
  {
    slug: "donkervoort",
    name: "Donkervoort",
    country: "Nizozemska",
    models: [],
  },
  {
    slug: "dr-automobiles",
    name: "DR",
    country: "Italija",
    models: ["City Cross", "DR 1", "DR 1.0", "DR 2", "DR 3", "DR 3.0", "DR 4", "DR 5", "DR 5.0", "DR 6", "DR 6.0", "DR 7", "DR 7.0", "DR EVO5", "DR F35", "DR PK8", "DR Zero"],
  },
  {
    slug: "ds-automobiles",
    name: "DS Automobiles",
    country: "Francuska",
    models: ["DS 3", "DS 3 Crossback", "DS 4", "DS 4 Crossback", "DS 5", "DS 7", "DS 7 Crossback", "DS 9", "N°4", "N°7", "N°8"],
  },
  {
    slug: "elaris",
    name: "Elaris",
    country: "Njemačka",
    models: [],
  },
  {
    slug: "ev",
    name: "EV",
    country: "Ostalo",
    models: [],
  },
  {
    slug: "evo-automobiles",
    name: "EVO",
    country: "Italija",
    models: ["Cross4", "EVO3", "EVO4", "EVO5", "EVO7"],
  },
  {
    slug: "exeed",
    name: "Exeed",
    country: "Kina",
    models: ["TXL", "VX", "LX", "RX"],
  },
  {
    slug: "ferrari",
    name: "Ferrari",
    country: "Italija",
    models: ["12 Cilindri", "208", "296", "308", "328", "348", "355", "360", "365", "400", "412", "430", "456", "458", "488", "512", "550 Maranello", "575", "599", "612 Scaglietti", "812", "Amalfi", "California", "Daytona SP3", "Dino", "Enzo", "F12", "F40", "F50", "F8", "F80", "FF", "GTC4Lusso", "GTO", "LaFerrari", "Luce", "Mondial", "Monza", "Portofino", "Purosangue", "Roma", "SF90", "Superamerica", "Testarossa"],
  },
  {
    slug: "fiat",
    name: "Fiat",
    country: "Italija",
    models: ["1100", "124", "124 Spider", "125", "126", "127", "130", "131", "132", "1500", "500", "500C", "500L", "500X", "600", "850", "Albea", "Argenta", "Barchetta", "Brava", "Bravo", "Campagnola", "Cinquecento", "Coupe", "Croma", "Dino", "Doblo", "DUCATO", "Freemont", "Fullback", "Grande Panda", "Grizzly", "Grizzly Fastback", "Idea", "Linea", "Marea", "Multipla", "Palio", "Panda", "Punto", "Qubo", "Regata", "Ritmo", "Scudo", "Sedici", "Seicento", "Spider", "Stilo", "Talento", "Tempra", "Tipo", "Topolino", "Ulysse", "Uno", "X 1/9"],
  },
  {
    slug: "fisker",
    name: "Fisker",
    country: "SAD",
    models: ["Karma", "Ocean"],
  },
  {
    slug: "ford",
    name: "Ford",
    country: "SAD",
    models: ["Aerostar", "B-Max", "Bronco", "C-Max", "Capri", "Cougar", "E-Tourneo Courier", "E-Tourneo Custom", "E-Transit Custom", "Ecosport", "Edge", "Escort", "Excursion", "Expedition", "Explorer", "Explorer EV", "F-150", "Fiesta", "Focus", "Fusion", "Galaxy", "Granada", "Grand C-Max", "GT", "Ka", "Kuga", "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Orion", "Probe", "Puma", "Ranger", "S-Max", "Scorpio", "Sierra", "StreetKa", "Taunus", "Taurus", "Thunderbird", "Tourneo", "Tourneo Connect", "Tourneo Courier", "Tourneo Custom", "Transit", "Transit Custom", "Windstar"],
  },
  {
    slug: "forthing",
    name: "Forthing",
    country: "Kina",
    models: ["S7", "T5 Evo", "T5 Evo EV", "U-Tour", "V9"],
  },
  {
    slug: "foton",
    name: "Foton",
    country: "Kina",
    models: ["ETunland", "Tunland G7", "Tunland V7", "Tunland V9"],
  },
  {
    slug: "geely",
    name: "Geely",
    country: "Kina",
    models: ["Atlas Pro", "CityRay", "CoolRay", "EX5", "Galaxy Cruiser 700", "Galaxy TT", "StarRay", "StarRay EM-i"],
  },
  {
    slug: "genesis",
    name: "Genesis",
    country: "Južna Koreja",
    models: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  },
  {
    slug: "gmc",
    name: "GMC",
    country: "SAD",
    models: [],
  },
  {
    slug: "greatwall",
    name: "Greatwall",
    country: "Kina",
    models: ["Hover"],
  },
  {
    slug: "grecav",
    name: "Grecav",
    country: "Italija",
    models: ["Sonique"],
  },
  {
    slug: "hansa",
    name: "Hansa",
    country: "Njemačka",
    models: [],
  },
  {
    slug: "haval",
    name: "Haval",
    country: "Kina",
    models: ["H2", "H6", "Jolion", "Dargo", "F7"],
  },
  {
    slug: "honda",
    name: "Honda",
    country: "Japan",
    models: ["Accord", "CB650R", "Civic", "Concerto", "CR-V", "CR-Z", "Crosstar", "CRX", "e", "FORZA", "FR-V", "HR-V", "Insight", "Integra", "Jazz", "Legend", "Logo", "NSX", "Odyssey", "Pilot", "Prelude", "S2000", "Shuttle", "Stream", "ZR-V"],
  },
  {
    slug: "hongqi",
    name: "Hongqi",
    country: "Kina",
    models: ["E-HS9", "EH7", "EHS7", "H5", "H9", "HS3", "HS5"],
  },
  {
    slug: "hummer",
    name: "Hummer",
    country: "SAD",
    models: ["H1", "H2", "H3"],
  },
  {
    slug: "hycan",
    name: "Hycan",
    country: "Kina",
    models: ["007", "Z03", "V09"],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    country: "Južna Koreja",
    models: ["Accent", "Atos", "Bayon", "Coupe", "Elantra", "Excel", "Galloper", "Genesis", "Getz", "Grand Santa Fe", "Grandeur", "H-1", "H100", "i10", "i20", "i30", "i30 Fastback", "i30 Wagon", "i40", "Inster", "Ioniq", "Ioniq 5", "Ioniq 6", "Ioniq 9", "ix20", "ix35", "ix55", "Kona", "Lantra", "Matrix", "Pony", "S-Coupe", "Santa Cruz", "Santa Fe", "Santamo", "Sonata", "Staria", "Terracan", "Trajet", "Tucson", "Veloster", "XG"],
  },
  {
    slug: "infiniti",
    name: "Infiniti",
    country: "Japan",
    models: ["EX", "FX", "G", "G Cabrio", "G Coupe", "JX", "M", "Q30", "Q50", "Q60", "Q70", "QX", "QX50", "QX55", "QX60", "QX70", "QX80"],
  },
  {
    slug: "iso",
    name: "Iso",
    country: "Italija",
    models: [],
  },
  {
    slug: "isuzu",
    name: "Isuzu",
    country: "Japan",
    models: ["Amigo", "Campo", "D-Max", "Gemini", "Mu", "Trooper"],
  },
  {
    slug: "iveco",
    name: "Iveco",
    country: "Italija",
    models: ["DAILY 70C18", "Massif"],
  },
  {
    slug: "jac",
    name: "JAC",
    country: "Kina",
    models: ["e-S4", "iEV7S"],
  },
  {
    slug: "jaecoo",
    name: "JAECOO",
    country: "Kina",
    models: ["5", "7", "7 SHS"],
  },
  {
    slug: "jaguar",
    name: "Jaguar",
    country: "Velika Britanija",
    models: ["Daimler", "E-Pace", "E-Type", "F-Pace", "F-Type", "I-Pace", "MK-II", "S-Type", "X-Type", "XE", "XF", "XJ", "XJS", "XK"],
  },
  {
    slug: "jba",
    name: "JBA",
    country: "Velika Britanija",
    models: [],
  },
  {
    slug: "jdm",
    name: "JDM",
    country: "Francuska",
    models: [],
  },
  {
    slug: "jeep",
    name: "Jeep",
    country: "SAD",
    models: ["Avenger", "Cherokee", "CJ", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Patriot", "Renegade", "Wagoneer", "Willys", "Wrangler"],
  },
  {
    slug: "jetour",
    name: "Jetour",
    country: "Kina",
    models: ["X70", "X90", "Dashing", "T2"],
  },
  {
    slug: "kaiyi",
    name: "Kaiyi",
    country: "Kina",
    models: ["E5", "X3", "X3 Pro"],
  },
  {
    slug: "karma",
    name: "Karma",
    country: "SAD",
    models: ["Revero", "GS-6"],
  },
  {
    slug: "kg-mobility",
    name: "KG Mobility",
    country: "Južna Koreja",
    models: ["Korando", "Musso", "Rexton", "Tivoli", "Torres"],
  },
  {
    slug: "kia",
    name: "Kia",
    country: "Južna Koreja",
    models: ["Carens", "Carnival", "Ceed", "Ceed SW", "Cerato", "Clarus", "Elan", "EV2", "EV3", "EV4", "EV5", "EV6", "EV9", "Forte", "Joice", "K4", "Magentis", "Niro", "Opirus", "Optima", "Picanto", "Pride", "Pro_Ceed", "Proceed", "PV5", "Retona", "Rio", "Rocsta", "Seltos", "Sephia", "Sorento", "Soul", "Spectra", "Sportage", "Stinger", "Stonic", "Venga", "XCeed"],
  },
  {
    slug: "koenigsegg",
    name: "Koenigsegg",
    country: "Švedska",
    models: ["CC8S", "CCX", "Agera", "Regera", "Jesko", "Gemera"],
  },
  {
    slug: "ktm",
    name: "KTM",
    country: "Austrija",
    models: ["DUKE 790", "SX", "X-Bow"],
  },
  {
    slug: "lada",
    name: "Lada",
    country: "Rusija",
    models: ["110", "111", "112", "1300", "1500", "Aleko", "Desetka", "Granta", "Kalina", "Karavan", "Niva", "Nova", "Samara", "Vesta"],
  },
  {
    slug: "lamborghini",
    name: "Lamborghini",
    country: "Italija",
    models: ["Aventador", "Countach", "Diablo", "Espada", "Fenomeno", "Gallardo", "Huracan", "Jalpa", "LM002", "Miura", "Murcielago", "Revuelto", "Temerario", "Urus"],
  },
  {
    slug: "lancia",
    name: "Lancia",
    country: "Italija",
    models: ["Beta", "Dedra", "Delta", "Flavia", "Fulvia", "Kappa", "Lybra", "Musa", "Phedra", "Prisma", "Stratos", "Thema", "Thesis", "Voyager", "Y", "Ypsilon", "Zeta"],
  },
  {
    slug: "land-rover",
    name: "Land Rover",
    country: "Velika Britanija",
    models: ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Evoque Convertible", "Range Rover Sport", "Range Rover Velar"],
  },
  {
    slug: "landwind",
    name: "LandWind",
    country: "Kina",
    models: [],
  },
  {
    slug: "leapmotor",
    name: "Leapmotor",
    country: "Kina",
    models: ["B10", "C10", "T03"],
  },
  {
    slug: "lexus",
    name: "Lexus",
    country: "Japan",
    models: ["CT", "ES", "GS", "GX", "IS", "LBX", "LC", "LFA", "LM", "LS", "LX", "NX", "RC", "RX", "RZ", "SC", "TZ", "UX"],
  },
  {
    slug: "ligier",
    name: "Ligier",
    country: "Francuska",
    models: ["162", "Ambra", "Be Sun", "Be Up", "IXO", "JS", "Myli", "Nova", "Optima", "Pulse", "X-Too"],
  },
  {
    slug: "lincoln",
    name: "Lincoln",
    country: "SAD",
    models: ["Aviator", "Continental", "Corsair", "MKZ", "Nautilus", "Navigator"],
  },
  {
    slug: "livan",
    name: "Livan",
    country: "Kina",
    models: ["X3 Pro", "7"],
  },
  {
    slug: "london-taxi",
    name: "London Taxi",
    country: "Velika Britanija",
    models: ["Fairway series", "FX series", "TX series"],
  },
  {
    slug: "lotus",
    name: "Lotus",
    country: "Velika Britanija",
    models: ["3-Eleven", "340R", "Elan", "Eletre", "Elise", "Emeya", "Emira", "Esprit", "Europa", "Evora", "Excel", "Exige", "Super seven"],
  },
  {
    slug: "luaz",
    name: "LuAZ",
    country: "Ukrajina",
    models: [],
  },
  {
    slug: "lucid",
    name: "Lucid",
    country: "SAD",
    models: ["Air", "Gravity"],
  },
  {
    slug: "lynk-co",
    name: "Lynk & Co",
    country: "Kina",
    models: ["01", "02", "08", "900"],
  },
  {
    slug: "mahindra",
    name: "Mahindra",
    country: "Indija",
    models: [],
  },
  {
    slug: "maruti",
    name: "Maruti",
    country: "Indija",
    models: [],
  },
  {
    slug: "maserati",
    name: "Maserati",
    country: "Italija",
    models: ["222", "224", "228", "418", "420", "422", "424", "430", "Biturbo", "Coupe", "Ghibli", "GranCabrio", "GranSport", "GranTurismo", "Grecale", "GT 3200", "Levante", "MC20", "Quattroporte", "Shamal", "Spyder"],
  },
  {
    slug: "maxus",
    name: "Maxus",
    country: "Kina",
    models: ["eTerron", "Euniq 6", "Mifa 9", "T60", "T90"],
  },
  {
    slug: "maybach",
    name: "Maybach",
    country: "Njemačka",
    models: ["57", "62", "Guard", "Landaulet"],
  },
  {
    slug: "mazda",
    name: "Mazda",
    country: "Japan",
    models: ["121", "3", "323", "626", "929", "BT-50", "CX-3", "CX-30", "CX-5", "CX-50", "CX-60", "CX-6e", "CX-7", "CX-80", "CX-9", "Demio", "Mazda2", "Mazda3", "Mazda5", "Mazda6", "Mazda6e", "MPV", "MX-3", "MX-30", "MX-5", "MX-6", "Premacy", "RX-7", "RX-8", "Tribute", "Xedos 6", "Xedos 9"],
  },
  {
    slug: "mclaren",
    name: "McLaren",
    country: "Velika Britanija",
    models: ["12C", "540C", "570S", "600LT", "620R", "675LT", "720S", "765LT", "Artura", "Elva", "F1", "GT", "P1", "Senna", "Speedtail"],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    country: "Njemačka",
    models: ["190", "A KLASA", "A-Razred", "AMG GT", "AMG GT 4-vratni Coupe", "AMG GT Coupe", "AMG GT R", "AMG GT Roadster", "AMG One", "B-Razred", "C 200", "C-Razred", "Citan", "CL-Razred", "CLA Shooting Brake", "CLA-Razred", "CLC-Razred", "CLE-Razred", "CLK-Razred", "CLS Shooting Brake", "CLS-Razred", "E KLASA", "E-Razred", "EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQT", "EQV", "G-Razred", "GL-Razred", "GLA", "GLA-Razred", "GLB-Razred", "GLC", "GLC coupe", "GLC-Razred", "GLE coupe", "GLE-Razred", "GLK-Razred", "GLS-Razred", "ML-Razred", "R-Razred", "S-Razred", "SL-Razred", "SLC-Razred", "SLK-Razred", "SLR-Razred", "SLS AMG", "SPRINTER", "SPRINTER 316 CDI", "T-Razred", "TOURISMO", "TOURISMO 17 RHD", "V-Razred", "Vaneo", "Viano", "Vito", "VLE-Razred", "W123", "X-Razred"],
  },
  {
    slug: "mg",
    name: "MG",
    country: "Kina",
    models: ["Cyberster", "EHS", "F", "GS", "HS", "IM5", "IM6", "Marvel R", "MG3", "MG4", "MG5", "MGS5 EV", "TF", "ZR", "ZS", "ZS EV"],
  },
  {
    slug: "microcar",
    name: "Microcar",
    country: "Francuska",
    models: ["ALCO", "Family Luxe", "Lyra", "M.GO", "NewStreet", "Pratic Luxe", "Virgo"],
  },
  {
    slug: "mini",
    name: "MINI",
    country: "Velika Britanija",
    models: ["Aceman", "Cabrio", "Clubman", "Cooper", "Countryman", "Coupe", "One", "Paceman", "Roadster"],
  },
  {
    slug: "mitsubishi",
    name: "Mitsubishi",
    country: "Japan",
    models: ["3000 GT", "ASX", "Carisma", "Colt", "Diamante", "Eclipse", "Eclipse Cross", "Galant", "Grandis", "i-MiEV", "L 200", "L 300", "Lancer", "Outlander", "Pajero", "Pajero Pinin", "Pajero Sport", "Sigma", "Space Gear", "Space Runner", "Space Star", "Space Wagon", "Starion"],
  },
  {
    slug: "morgan",
    name: "Morgan",
    country: "Velika Britanija",
    models: [],
  },
  {
    slug: "moskvic",
    name: "Moskvič",
    country: "Rusija",
    models: [],
  },
  {
    slug: "mpm-motors",
    name: "MPM Motors",
    country: "Francuska",
    models: ["Erelis", "PS160"],
  },
  {
    slug: "nanjing",
    name: "Nanjing",
    country: "Kina",
    models: ["Soyat"],
  },
  {
    slug: "neta",
    name: "Neta",
    country: "Kina",
    models: ["V", "U", "S", "GT"],
  },
  {
    slug: "nio",
    name: "Nio",
    country: "Kina",
    models: ["ES6", "ES8", "ET5", "ET7", "EL6", "EL7"],
  },
  {
    slug: "nissan",
    name: "Nissan",
    country: "Japan",
    models: ["100NX", "200SX", "280ZX", "300ZX", "350Z", "370Z", "Almera", "Almera Tino", "Altima", "Ariya", "Bluebird", "Cherry", "Cube", "e-NV200", "Evalia", "GT-R", "Juke", "King Cab", "Leaf", "Maxima", "Micra", "Micra CC", "Murano", "Navara", "Note", "NV200", "NV300", "Pathfinder", "Patrol", "Pick Up", "Pixo", "Prairie", "Primera", "Pulsar", "Qashqai", "Quest", "Serena", "Silvia", "Skyline", "Sunny", "Terrano", "Tiida", "Townstar", "Vanette", "X-Trail"],
  },
  {
    slug: "noble",
    name: "Noble",
    country: "Velika Britanija",
    models: ["M12", "M600", "M500"],
  },
  {
    slug: "nsu",
    name: "NSU",
    country: "Njemačka",
    models: ["Prinz", "RO-80"],
  },
  {
    slug: "oldsmobile",
    name: "Oldsmobile",
    country: "SAD",
    models: [],
  },
  {
    slug: "omoda",
    name: "Omoda",
    country: "Kina",
    models: ["4", "5", "5 EV", "5 SHS-H", "7", "9"],
  },
  {
    slug: "opel",
    name: "Opel",
    country: "Njemačka",
    models: ["Adam", "Agila", "Ampera", "Antara", "Ascona", "Astra", "Calibra", "Campo", "Cascada", "Combo", "Commodore", "Corsa", "Crossland", "Crossland X", "Diplomat", "Frontera", "Grandland", "Grandland X", "GT", "Insignia", "Kadett", "Karl", "Manta", "Meriva", "Mokka", "Mokka X", "Monterey", "Monza", "Olympia", "Omega", "Rekord", "Rocks-e", "Senator", "Signum", "Sintra", "Speedster", "Tigra", "Vectra", "Zafira"],
  },
  {
    slug: "ora",
    name: "Ora",
    country: "Kina",
    models: ["Funky Cat", "03", "07", "Good Cat"],
  },
  {
    slug: "overland",
    name: "Overland",
    country: "SAD",
    models: [],
  },
  {
    slug: "pagani",
    name: "Pagani",
    country: "Italija",
    models: ["Zonda", "Huayra", "Utopia"],
  },
  {
    slug: "panhard",
    name: "Panhard",
    country: "Francuska",
    models: ["Dyna", "24", "PL17"],
  },
  {
    slug: "perodua",
    name: "Perodua",
    country: "Malezija",
    models: ["Myvi", "Axia", "Kancil"],
  },
  {
    slug: "peugeot",
    name: "Peugeot",
    country: "Francuska",
    models: ["1007", "104", "106", "107", "108", "2008", "204", "205", "206", "207", "208", "3008", "301", "304", "305", "306", "307", "308", "309", "4007", "4008", "404", "405", "406", "407", "408", "5008", "504", "505", "508", "604", "605", "607", "806", "807", "Bipper", "E-3008", "E-5008", "Expert", "iOn", "Partner", "Pick Up", "RCZ", "Rifter", "Traveller"],
  },
  {
    slug: "piaggio",
    name: "Piaggio",
    country: "Italija",
    models: ["Porter Van", "ZIP"],
  },
  {
    slug: "plymouth",
    name: "Plymouth",
    country: "SAD",
    models: [],
  },
  {
    slug: "polestar",
    name: "Polestar",
    country: "Švedska",
    models: ["1", "2", "3", "4", "5"],
  },
  {
    slug: "pontiac",
    name: "Pontiac",
    country: "SAD",
    models: ["Bonneville", "Fiero", "Firebird", "Grand Am", "Grand Prix", "Trans Am", "Trans Sport"],
  },
  {
    slug: "porsche",
    name: "Porsche",
    country: "Njemačka",
    models: ["356", "718", "718 Boxster", "718 Cayman", "911", "911 Cabriolet", "911 Targa", "912", "914", "924", "928", "944", "959", "968", "Boxster", "Carrera GT", "Cayenne", "Cayenne Coupe", "Cayman", "Macan", "Panamera", "Panamera Sport Turismo", "Taycan", "Taycan Sport Turismo"],
  },
  {
    slug: "proton",
    name: "Proton",
    country: "Malezija",
    models: ["Persona", "Serija 300", "Serija 400"],
  },
  {
    slug: "puch",
    name: "Puch",
    country: "Austrija",
    models: ["G"],
  },
  {
    slug: "qoros",
    name: "Qoros",
    country: "Kina",
    models: ["3", "5", "7"],
  },
  {
    slug: "renault",
    name: "Renault",
    country: "Francuska",
    models: ["4 E-Tech", "5 E-Tech", "Alaskan", "Alpine", "Arkana", "Austral", "Avantime", "Captur", "Clio", "Espace", "Fluence", "Fuego", "Grand Espace", "Grand Kangoo", "Grand Modus", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Latitude", "Megane", "Megane Conquest", "Megane E-Tech", "Modus", "R 10", "R 11", "R 12", "R 14", "R 16", "R 18", "R 19", "R 20", "R 21", "R 25", "R 30", "R 4", "R 5", "R 8", "R 9", "Rafale", "Safrane", "Scenic", "Scenic E-Tech", "Sport Spider", "Symbioz", "Talisman", "Thalia", "Twingo", "Twizy", "Vel Satis", "Wind", "Zoe"],
  },
  {
    slug: "replica",
    name: "Replica",
    country: "Ostalo",
    models: [],
  },
  {
    slug: "riley",
    name: "Riley",
    country: "Velika Britanija",
    models: ["RM", "Elf", "Kestrel"],
  },
  {
    slug: "rimac",
    name: "Rimac",
    country: "Hrvatska",
    models: ["Concept One", "Nevera"],
  },
  {
    slug: "rivian",
    name: "Rivian",
    country: "SAD",
    models: ["R1T", "R1S"],
  },
  {
    slug: "rolls-royce",
    name: "Rolls-Royce",
    country: "Velika Britanija",
    models: ["Corniche", "Cullinan", "Dawn", "Flying Spur", "Ghost", "Park Ward", "Phantom", "Silver Cloud", "Silver Dawn", "Silver Seraph", "Silver Shadow", "Silver Spirit", "Silver Spur", "Wraith"],
  },
  {
    slug: "rosengart",
    name: "Rosengart",
    country: "Francuska",
    models: [],
  },
  {
    slug: "rover",
    name: "Rover",
    country: "Velika Britanija",
    models: ["25", "45", "75", "City Rover", "Metro", "Montego", "Serija 100", "Serija 200", "Serija 400", "Serija 600", "Serija 800", "Streetwise"],
  },
  {
    slug: "saab",
    name: "Saab",
    country: "Švedska",
    models: ["9-3", "9-3x", "9-4x", "9-5", "9-7x", "90", "900", "9000", "96", "99"],
  },
  {
    slug: "saturn",
    name: "Saturn",
    country: "SAD",
    models: [],
  },
  {
    slug: "seat",
    name: "Seat",
    country: "Španjolska",
    models: ["Alhambra", "Altea", "Altea Freetrack", "Altea XL", "Arona", "Arosa", "Ateca", "Cordoba", "Exeo", "Ibiza", "Inca", "Leon", "Malaga", "Marbella", "Mii", "Tarraco", "Toledo"],
  },
  {
    slug: "sehol",
    name: "Sehol",
    country: "Kina",
    models: ["E10X", "X8", "QX"],
  },
  {
    slug: "seres",
    name: "Seres",
    country: "Kina",
    models: ["3", "5", "7"],
  },
  {
    slug: "shuanghuan",
    name: "Shuanghuan",
    country: "Kina",
    models: ["Ceo"],
  },
  {
    slug: "simca",
    name: "Simca",
    country: "Francuska",
    models: [],
  },
  {
    slug: "singer",
    name: "Singer",
    country: "Velika Britanija",
    models: [],
  },
  {
    slug: "skoda",
    name: "Škoda",
    country: "Češka",
    models: ["Citigo", "Elroq", "Enyaq IV", "Epiq", "Fabia", "Favorit", "Felicia", "Forman", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Peaq", "Rapid", "Roomster", "S 105", "S 120", "Scala", "Superb", "Yeti"],
  },
  {
    slug: "skywell",
    name: "Skywell",
    country: "Kina",
    models: ["ET5", "BE11"],
  },
  {
    slug: "smart",
    name: "Smart",
    country: "Njemačka",
    models: ["#1", "#3", "#5", "city cabrio", "city coupe", "crossblade", "forfour", "fortwo", "fortwo cabrio", "roadster"],
  },
  {
    slug: "spyker",
    name: "Spyker",
    country: "Nizozemska",
    models: ["C8"],
  },
  {
    slug: "ssangyong",
    name: "SsangYong",
    country: "Južna Koreja",
    models: ["Actyon", "Korando", "Kyron", "Musso", "Rexton", "Rodius", "Tivoli", "Tivoli Grand", "Torres", "XLV"],
  },
  {
    slug: "standard",
    name: "Standard",
    country: "Velika Britanija",
    models: ["Eight", "Ten", "Vanguard"],
  },
  {
    slug: "studebaker",
    name: "Studebaker",
    country: "SAD",
    models: ["Champion", "Commander", "Avanti", "Hawk"],
  },
  {
    slug: "subaru",
    name: "Subaru",
    country: "Japan",
    models: ["700 SDX", "Ascent", "Baja", "BRZ", "Crosstrek", "E-Outback", "Forester", "Impreza", "Justy", "Legacy", "Leone", "Levorg", "Libero", "Outback", "Solterra", "SVX", "Trezia", "Tribeca", "Uncharted", "Vivio", "WRX", "XT", "XV"],
  },
  {
    slug: "suzuki",
    name: "Suzuki",
    country: "Japan",
    models: ["Across", "Alto", "Baleno", "Capuccino", "Celerio", "e Vitara", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "Maruti", "S-Cross", "Samurai", "Splash", "Swace", "Swift", "SX4", "SX4 S-Cross", "Vitara", "Wagon R", "X-90"],
  },
  {
    slug: "talbot",
    name: "Talbot",
    country: "Francuska",
    models: ["Horizon", "Samba", "Solara"],
  },
  {
    slug: "tata",
    name: "Tata",
    country: "Indija",
    models: ["Indica", "Indigo", "Nano", "Safari", "Xenon"],
  },
  {
    slug: "tavria",
    name: "Tavria",
    country: "Ukrajina",
    models: [],
  },
  {
    slug: "tazzari",
    name: "Tazzari",
    country: "Italija",
    models: ["Zero"],
  },
  {
    slug: "tesla",
    name: "Tesla",
    country: "SAD",
    models: ["Model 3", "Model S", "Model X", "Model Y", "Roadster"],
  },
  {
    slug: "tiger",
    name: "Tiger",
    country: "Velika Britanija",
    models: ["T03"],
  },
  {
    slug: "togg",
    name: "Togg",
    country: "Turska",
    models: ["T10X", "T10F"],
  },
  {
    slug: "toyota",
    name: "Toyota",
    country: "Japan",
    models: ["4-Runner", "Auris", "Avalon", "Avensis", "Avensis Verso", "Aygo", "Aygo X", "bZ4X", "C-HR", "C-HR+", "Camry", "Carina", "Celica", "Corolla", "Corolla Cross", "Corolla Verso", "Crown", "FJ", "GR Yaris", "GR86", "GT86", "HiAce", "Highlander", "Hilux", "IQ", "Land Cruiser", "LiteAce", "Mirai", "MR2", "Paseo", "Picnic", "Previa", "Prius", "Proace", "Proace City Verso", "Proace Verso", "RAV4", "Starlet", "Supra", "Tercel", "TONERO", "Urban Cruiser", "Verso", "Verso-S", "Yaris", "Yaris Cross", "Yaris Verso"],
  },
  {
    slug: "trabant",
    name: "Trabant",
    country: "Njemačka",
    models: ["601", "Cabrio"],
  },
  {
    slug: "triumph",
    name: "Triumph",
    country: "Velika Britanija",
    models: ["Dolomite", "Moss", "Spitfire", "TR3", "TR4", "TR5", "TR6", "TR7", "TR8"],
  },
  {
    slug: "tvr",
    name: "TVR",
    country: "Velika Britanija",
    models: [],
  },
  {
    slug: "uaz",
    name: "UAZ",
    country: "Rusija",
    models: [],
  },
  {
    slug: "ultima",
    name: "Ultima",
    country: "Velika Britanija",
    models: ["GTR", "Evolution", "RS"],
  },
  {
    slug: "unimog",
    name: "Uni",
    country: "Njemačka",
    models: ["Unimog"],
  },
  {
    slug: "vauxhall",
    name: "Vauxhall",
    country: "Velika Britanija",
    models: [],
  },
  {
    slug: "venturi",
    name: "Venturi",
    country: "Francuska",
    models: [],
  },
  {
    slug: "vinfast",
    name: "VinFast",
    country: "Vijetnam",
    models: ["VF6", "VF7", "VF8"],
  },
  {
    slug: "volga",
    name: "Volga",
    country: "Rusija",
    models: [],
  },
  {
    slug: "volkswagen",
    name: "Volkswagen",
    country: "Njemačka",
    models: ["Amarok", "Arteon", "Arteon Shooting Brake", "Beetle", "Bora", "Buggy", "Caddy", "California", "Caravelle", "CC", "Corrado", "Crossgolf", "CrossPolo", "CrossTouran", "Derby", "Eos", "Fox", "Golf", "Golf Plus", "Golf Sportsvan", "Golf Variant", "Hrošč", "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "ID.Polo", "Jetta", "Karmann Ghia", "Lupo", "Multivan", "Passat", "Passat Alltrack", "Passat CC", "Passat Variant", "Phaeton", "Polo", "Santana", "Scirocco", "Sharan", "Shuttle", "T-Cross", "T-Roc", "T-Roc Cabriolet", "Taigo", "Taro", "Tayron", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter", "up!", "Vento", "XL1"],
  },
  {
    slug: "volta",
    name: "Volta",
    country: "Ostalo",
    models: ["EV1", "EV2", "V1"],
  },
  {
    slug: "volvo",
    name: "Volvo",
    country: "Švedska",
    models: ["240", "340", "360", "440", "460", "480", "740", "760", "780", "850", "940", "960", "C30", "C40", "C70", "EM90", "ES90", "EX30", "EX60", "EX90", "FH", "S40", "S60", "S60 Cross Country", "S70", "S80", "S90", "V40", "V40 Cross Country", "V50", "V60", "V60 Cross Country", "V70", "V70 XC", "V90", "V90 Cross Country", "XC40", "XC60", "XC70", "XC90"],
  },
  {
    slug: "voyah",
    name: "Voyah",
    country: "Kina",
    models: ["Courage", "Free"],
  },
  {
    slug: "wartburg",
    name: "Wartburg",
    country: "Njemačka",
    models: [],
  },
  {
    slug: "westfield",
    name: "Westfield",
    country: "Velika Britanija",
    models: [],
  },
  {
    slug: "wey",
    name: "Wey",
    country: "Kina",
    models: ["VV5", "VV7", "Coffee 01"],
  },
  {
    slug: "wiesmann",
    name: "Wiesmann",
    country: "Njemačka",
    models: [],
  },
  {
    slug: "wolseley",
    name: "Wolseley",
    country: "Velika Britanija",
    models: ["Hornet", "1500", "6/110"],
  },
  {
    slug: "wuling",
    name: "Wuling",
    country: "Kina",
    models: ["Hongguang Mini EV", "Bingo", "Air EV"],
  },
  {
    slug: "xev",
    name: "XEV",
    country: "Italija",
    models: ["Yoyo"],
  },
  {
    slug: "xiaomi",
    name: "Xiaomi",
    country: "Kina",
    models: ["SU7"],
  },
  {
    slug: "xpeng",
    name: "Xpeng",
    country: "Kina",
    models: ["G6", "G9", "P7", "P7+", "X9"],
  },
  {
    slug: "yugo",
    name: "Yugo",
    country: "Srbija",
    models: ["45", "55", "65", "Koral", "Florida", "Tempo"],
  },
  {
    slug: "yunlong",
    name: "Yunlong",
    country: "Kina",
    models: [],
  },
  {
    slug: "zastava",
    name: "Zastava",
    country: "Srbija",
    models: ["101", "128", "1300", "1500", "750", "850", "Buggy", "Yugo", "Yugo Florida"],
  },
  {
    slug: "zaz",
    name: "ZAZ",
    country: "Ukrajina",
    models: [],
  },
  {
    slug: "zeekr",
    name: "Zeekr",
    country: "Kina",
    models: ["001", "7GT", "7X", "8X", "9X", "X"],
  },
  {
    slug: "zhidou",
    name: "Zhidou",
    country: "Kina",
    models: ["D1", "D2", "D2S", "D3"],
  },
  {
    slug: "zotye",
    name: "Zotye",
    country: "Kina",
    models: ["T600", "SR9", "Nomad"],
  },
];

// ⚠️ Karlo 12.08.2026: točno njegovih 10 sa screenshota avto.neta, abecedno
// (Citroën je unutra, Opel nije). Redoslijed je namjeran — tako se i prikazuje.
export const POPULAR_MAKE_SLUGS = [
  "audi", "bmw", "citroen", "ford", "mercedes-benz",
  "peugeot", "renault", "skoda", "toyota", "volkswagen",
];

export function getMake(slug: string): CarMake | undefined {
  return MAKES.find((m) => m.slug === slug);
}

/**
 * ⚠️ Karlo 12.08.2026: "Zadnja stavka kod svake marke na listi modela mora
 * stajati izbor 'modela nema na listi'." Vrijedi za SVAKU marku — i za one
 * bez ijednog modela (AEV), gdje je to jedini izbor uz "Svi modeli".
 *
 * Vrijednost je stabilan ključ (ne prijevod) jer završi u URL-u i u bazi kao
 * `model`. Ne mijenjati bez migracije postojećih oglasa.
 */
export const MODEL_NOT_LISTED = "__other__";
export const MODEL_NOT_LISTED_LABEL = "Modela nema na listi";

/** Modeli marke + obavezna zadnja stavka "Modela nema na listi". */
export function modelOptionsFor(models: string[]): { value: string; label: string }[] {
  return [
    ...models.map((m) => ({ value: m, label: m })),
    { value: MODEL_NOT_LISTED, label: MODEL_NOT_LISTED_LABEL },
  ];
}

/**
 * Marke za odabir: prvo najpopularnije, pa cijeli abecedni popis.
 * ⚠️ Karlo 12.08.2026: popularne se NAMJERNO ponavljaju u "Sve marke" — tako
 * radi i avto.net; tko traži "Audi" pod A mora ga tamo naći.
 * `header` nosi natuknicu grupe; `SelectField` ga renderira, a native `<select>`
 * ga pretvara u `<optgroup>`.
 */
export function makeOptionsGrouped(
  list: { slug: string; name: string }[] = MAKES,
): { value: string; label: string; header?: string }[] {
  const popular = POPULAR_MAKE_SLUGS
    .map((s) => list.find((m) => m.slug === s))
    .filter((m): m is { slug: string; name: string } => Boolean(m));

  const out: { value: string; label: string; header?: string }[] = [];
  popular.forEach((m, i) => {
    out.push({ value: m.slug, label: m.name, header: i === 0 ? "Najpopularnije marke" : undefined });
  });
  list.forEach((m, i) => {
    out.push({ value: m.slug, label: m.name, header: i === 0 ? "Sve marke" : undefined });
  });
  return out;
}
