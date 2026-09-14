// Gospodarska vozila — marke PO PODKATEGORIJI, 1:1 s avto.net (22.08.2026).
// Dostavna/Kamioni/Prikolice/UTV skinuti UŽIVO s avto.netovih vlastitih
// <select name="znamka"> formi (Search.asp?SID=20000/41000/46000/68000).
// Autobusi nema vlastitu formu na avto.netu (samo rezultati bez padajućeg
// popisa) — kurirana lista poznatih proizvođača autobusa, PRIJAVLJENO Karlu
// kao best-effort, ne skinuto s izvora.
import type { CarMake } from "@/lib/types";

const M = (slug: string, name: string, country: string, models: string[] = []): CarMake => ({
  slug, name, country, models,
});

const sortHr = (list: CarMake[]): CarMake[] =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, "hr"));

// --- Dostavna vozila (avto.net SID=20000, 55 marki) ---------------------
const DOSTAVNA_RAW: CarMake[] = [
  // ⚠️ Karlo 14.09.2026: diktirao popise modela za 43 marke dostavnih vozila.
  // Odluka (kroz pitanje): SPOJI s postojećima + očisti očite duplikate.
  // Pravilo spajanja: isto vozilo pisano dvojako → Karlova grafija pobjeđuje
  // (Doblo Cargo→Doblo, Caddy Cargo/Maxi→Caddy, Combo Cargo→Combo, L200→L-200,
  // H100→H-100, Kangoo→Kangoo Express, Fuso Canter→Fuso, Musso→Musso Sports).
  // Električne izvedbe (ë-Berlingo, e-Crafter, eSprinter, E-Tech…) ZADRŽANE —
  // to su zasebni modeli, Karlo ih nije tražio maknuti nego ih samo nije nabrojao.
  M("alke", "Alke", "Italija", ["ATX", "ATEX"]),
  M("baw", "BAW", "Kina", ["F7", "T10", "Warrior"]),
  M("bellier", "Bellier", "Francuska", ["Docker"]),
  M("bonetti", "Bonetti", "Italija", ["F80"]),
  M("carello", "Carello", "Italija", ["Tauris", "TR10", "Eco-Rider"]),
  M("casalini", "Casalini", "Italija"),
  M("cenntro", "Cenntro", "Kina", ["Metro", "Logistar 100", "Logistar 200", "Logistar 260", "Teemak"]),
  M("chevrolet", "Chevrolet", "SAD", ["Harvester", "Captiva"]),
  M("citroen", "Citroën", "Francuska", ["Berlingo", "Berlingo Fugon", "C-15", "C-25", "C-35", "C1 / dostavni", "C2 / dostavni", "C3 / dostavni", "C4 / dostavni", "Jumpy", "Jumper", "Nemo", "Saxo / dostavni", "SpaceTourer", "ë-Berlingo", "ë-Jumpy", "ë-Jumper"]),
  M("dacia", "Dacia", "Rumunjska", ["Dokker", "Dokker Van", "Duster", "Duster Van", "Logan", "Logan Van", "Sandero"]),
  M("daihatsu", "Daihatsu", "Japan", ["Hi-Jet"]),
  M("daf", "DAF", "Nizozemska"),
  M("dfm", "DFM", "Kina", ["Dongfeng"]),
  M("elaris", "Elaris", "Njemačka", ["Caro S"]),
  M("farizon", "Farizon", "Kina", ["SV", "V6E", "V7E"]),
  M("fiat", "Fiat", "Italija", ["Doblo", "Ducato", "Fiorino", "Fullback", "Panda Van", "Punto Van", "Scudo", "Seicento Van", "Strada", "Talento", "E-Ducato", "E-Scudo", "E-Doblo"]),
  M("ford", "Ford", "SAD", ["Escort Van", "Fiesta Courier", "Fiesta Van", "Ranger", "Transit", "Transit Connect", "Transit Courier", "Transit Custom", "Tourneo", "Tourneo Connect", "Tourneo Courier", "Tourneo Custom", "E-Transit", "E-Transit Custom"]),
  M("fort", "Fort", "Kina"),
  M("foton", "Foton", "Kina", ["Aumark", "Cavan", "Mate", "Miler", "Toano", "Tunland", "View", "Wonder"]),
  M("gaz", "GAZ", "Rusija", ["Gazelle Next", "Gazelle Business", "Sobol Business"]),
  M("giotti-victoria", "Giotti Victoria", "Italija", ["Gladiator"]),
  M("goupil", "Goupil", "Francuska", ["G2", "G4", "G6"]),
  M("hyundai", "Hyundai", "Južna Koreja", ["Grace Van", "H-1", "H-100", "H350", "i20 Van", "Staria Van", "Porter"]),
  M("imv", "IMV", "Italija"),
  M("isuzu", "Isuzu", "Japan", ["D-Max", "M21", "Midi", "N-Series"]),
  M("iveco", "Iveco", "Italija", ["Daily", "eDaily", "Eurocargo"]),
  M("kia", "KIA", "Južna Koreja", ["Besta", "K-2500", "K-2700", "K-2900", "Pregio", "PV5"]),
  M("land-rover", "Land Rover", "Velika Britanija", ["Defender N1"]),
  // Karlo 22.08.2026: Ligier (mala električna dostavna vozila) falio je na
  // popisu dostavnih — jedina razlika prema njegovoj listi od 52 marke.
  M("ligier", "Ligier", "Francuska", ["X Pro"]),
  M("man", "MAN", "Njemačka", ["TGE"]),
  M("maxus", "Maxus", "Kina", ["DELIVER 34", "DELIVER 9", "eDELIVER 5", "eDELIVER 7", "eDELIVER 9", "eTerron", "EV80", "T60", "T90"]),
  M("mazda", "Mazda", "Japan", ["B-2200", "B-2500", "BT-50", "E-2200"]),
  M("mercedes-benz", "Mercedes-Benz", "Njemačka", ["Citan", "EQV", "MB-100", "Sprinter", "T-Razred", "Vito", "Vaneo", "Viano", "van V", "X-Razred", "eVito", "eSprinter", "V-klasa"]),
  M("mitsubishi", "Mitsubishi", "Japan", ["Fuso", "L-200", "L-300"]),
  M("nextem", "Nextem", "Italija", ["Minke", "Orca"]),
  M("nissan", "Nissan", "Japan", ["King Cab", "Navara", "NV 200", "NV 300", "Pick Up", "Primastar", "Townstar", "Trade", "Vanette", "e-NV200", "NV250", "NV400", "Interstar"]),
  M("om", "OM", "Italija"),
  M("opel", "Opel", "Njemačka", ["Astra Van", "Campo", "Combo", "Corsa Combo", "Corsavan", "Kadett Combo", "Movano", "Vivaro", "Combo-e", "Vivaro-e", "Movano-e"]),
  M("peugeot", "Peugeot", "Francuska", ["206 / dostavni", "207 / dostavni", "208 / dostavni", "307 / dostavni", "308 / dostavni", "Bipper", "Boxer", "Expert", "J-5", "Partner", "Rifter", "Traveller", "e-Partner", "e-Expert", "e-Boxer"]),
  M("piaggio", "Piaggio", "Italija", ["Porter"]),
  M("renault", "Renault", "Francuska", ["4 / dostavni", "5 Express", "Alaskan", "Clio / dostavni", "Express", "Kangoo Express", "Megane / dostavni", "Master", "Modus / dostavni", "Trafic", "Twingo Van", "Kangoo E-Tech", "Trafic E-Tech", "Master E-Tech"]),
  M("seat", "Seat", "Španjolska", ["Ibiza Van", "Inca", "Marbella / dostavni", "Terra"]),
  M("skoda", "Škoda", "Češka", ["Fabia N1", "Favorit Pick Up", "Felicia Pick Up", "Octavia Combi N1", "Pick Up", "Praktik", "Rapid", "Superb Combi N1"]),
  M("ssangyong", "SsangYong", "Južna Koreja", ["Korando Sports", "Musso Sports"]),
  M("suzuki", "Suzuki", "Japan", ["Carry Van", "Jimny"]),
  M("taylor-dunn", "Taylor-Dunn", "SAD"),
  M("toyota", "Toyota", "Japan", ["Hi-Ace", "Hilux", "Proace", "Proace City", "Proace Max", "Proace Verso", "Yaris Van"]),
  M("volkswagen", "Volkswagen", "Njemačka", ["Amarok", "Caddy", "Caravelle", "Crafter", "Golf / dostavni", "ID.Buzz Cargo", "LT", "LT-35", "Multivan", "Polo Van", "Transporter", "Transporter T6.1", "Transporter T7", "up! / dostavni", "e-Crafter"]),
  M("yugo", "Yugo", "Srbija", ["Poly"]),
  M("yunlong", "Yunlong", "Kina", ["Cargo Car", "Reach"]),
  M("zastava", "Zastava", "Srbija", ["Poly"]),
  M("ostalo", "Ostalo", "—"),
];
export const GOSPODARSKA_DOSTAVNA_MAKES: CarMake[] = [
  ...sortHr(DOSTAVNA_RAW.filter((m) => m.slug !== "ostalo")),
  ...DOSTAVNA_RAW.filter((m) => m.slug === "ostalo"),
];
export const popularDostavnaSlugs = ["citroen", "fiat", "ford", "mercedes-benz", "opel", "peugeot", "renault", "volkswagen"];

// --- Tovorna vozila / Kamioni (avto.net SID=41000, 60 marki) ------------
const KAMIONI_RAW: CarMake[] = [
  M("avia", "AVIA", "Češka"),
  M("awb-bedford", "AWB Bedford", "Velika Britanija"),
  M("blend", "Blend", "Turska"),
  M("caron", "Caron", "Francuska"),
  M("daf", "DAF", "Nizozemska", ["LF", "CF", "XF", "XD", "XG", "XG+", "XB"]),
  M("dennis", "Dennis", "Velika Britanija"),
  M("erf", "ERF", "Velika Britanija"),
  M("fap", "FAP", "Srbija"),
  M("faun", "Faun", "Njemačka"),
  M("fiat", "FIAT", "Italija"),
  M("foden", "Foden", "Velika Britanija"),
  M("ford", "Ford", "SAD", ["Cargo"]),
  M("foton", "Foton", "Kina"),
  M("gaz", "GAZ", "Rusija"),
  M("grove", "Grove", "SAD"),
  M("hino", "Hino", "Japan"),
  M("hyundai", "Hyundai", "Južna Koreja", ["H350"]),
  M("isuzu", "Isuzu", "Japan", ["N-Series", "NPR", "NQR", "F-Series", "Forward"]),
  M("iveco", "Iveco", "Italija", ["Eurocargo", "Stralis", "S-Way", "Trakker", "T-Way", "X-Way"]),
  M("kamaz", "KAMAZ", "Rusija"),
  M("kia", "KIA", "Južna Koreja"),
  M("leyland", "Leyland", "Velika Britanija"),
  M("liaz", "LIAZ", "Češka"),
  M("liebherr", "Liebherr", "Njemačka"),
  M("mack", "Mack", "SAD"),
  M("magirus-deutz", "Magirus Deutz", "Njemačka"),
  M("man", "MAN", "Njemačka", ["TGL", "TGM", "TGS", "TGX", "TGA"]),
  M("mazda", "Mazda", "Japan"),
  M("mercedes-benz", "Mercedes-Benz", "Njemačka", ["Atego", "Axor", "Actros", "eActros", "Antos", "Arocs", "Econic", "Unimog"]),
  M("mitsubishi", "Mitsubishi", "Japan", ["Canter", "Fuso Canter", "eCanter"]),
  M("multicar", "Multicar", "Njemačka"),
  M("nextem", "Nextem", "Italija"),
  M("nissan", "Nissan", "Japan", ["Atleon", "Cabstar"]),
  M("om", "OM", "Italija"),
  M("opel", "Opel", "Njemačka"),
  M("otokar", "Otokar", "Turska"),
  M("palfinger", "Palfinger", "Austrija"),
  M("pegaso", "Pegaso", "Španjolska"),
  M("peugeot", "Peugeot", "Francuska"),
  M("quantron", "Quantron", "Njemačka"),
  M("renault-trucks", "Renault Trucks", "Francuska", ["D", "D Wide", "C", "K", "T", "T High", "Midlum", "Premium", "Magnum"]),
  M("scania", "Scania", "Švedska", ["P-serija", "G-serija", "R-serija", "S-serija", "L-serija"]),
  M("seddon-atkinson", "Seddon Atkinson", "Velika Britanija"),
  M("sisu", "SISU", "Finska"),
  M("steyr", "Steyr", "Austrija"),
  M("tam", "TAM", "Slovenija"),
  M("tatra", "Tatra", "Češka", ["Phoenix", "Force", "Terra", "T815"]),
  M("taylor-dunn", "Taylor-Dunn", "SAD"),
  M("terberg", "Terberg", "Nizozemska"),
  M("torpedo", "Torpedo", "Srbija"),
  M("toyota", "Toyota", "Japan", ["Dyna"]),
  M("ural", "Ural", "Rusija"),
  M("unimog", "Unimog", "Njemačka"),
  M("volkswagen", "Volkswagen", "Njemačka", ["Constellation"]),
  M("volvo", "Volvo", "Švedska", ["FL", "FE", "FM", "FMX", "FH", "FH16"]),
  M("yanmar", "Yanmar", "Japan"),
  M("zastava", "Zastava", "Srbija"),
  M("zk", "ZK", "Kina"),
  M("ostalo", "Ostalo", "—"),
];
export const GOSPODARSKA_KAMIONI_MAKES: CarMake[] = [
  ...sortHr(KAMIONI_RAW.filter((m) => m.slug !== "ostalo")),
  ...KAMIONI_RAW.filter((m) => m.slug === "ostalo"),
];
export const popularKamioniSlugs = ["daf", "iveco", "man", "mercedes-benz", "renault-trucks", "scania", "volvo"];

// --- Teretne prikolice (avto.net SID=46000 "Tovorne prikolice", 271 marki) --
// Ravna abeceda, avto.net NEMA "popularne" grupiranje za prikolice.
const PRIKOLICE_NAMES: string[] = [
  "Access Ranger Trailers", "Acerbi", "Ackermann", "Agados", "AgroFSMS", "Ahlmann", "Akyel", "Algema", "Alunad", "Amigo",
  "Annaburger", "Anssems", "Auwoerter", "Avtotreiding", "Azur", "Balhanger", "Barthau", "Bateson", "Belluci-Rossini", "Benalu",
  "Berger", "BERGERecotrail", "Besttrailers", "Beta Trailer", "Bicchi", "Bijol", "Blomenrohr", "Blomert", "Blumhardt", "Blyss",
  "BMF", "Boeckmann", "Bonsegna", "Borco-Huhns", "Boro", "Boselli", "Brenderup", "Brian James", "Broshuis", "Bulthuis",
  "Bunge", "Burg", "Cantoni", "Carnehl", "CBS", "Chereau", "Cheval Liberte", "Contar", "Country", "Cresci",
  "CTC", "CynkoMet", "D-Tec", "Dapa", "De Angelis", "Dehkatrailer", "Demmler", "Dinkel", "Doll", "Dutch trailers",
  "Eduard", "Ellebi", "Enria", "Eurotrailer", "Fami Forest", "Faro", "FAST", "Fautras", "Faymonville", "FB Bossini",
  "Feldbinder", "Ferrel", "FGS", "Fitzel", "Fliegl", "Floor", "For-One", "Francini", "Fratelli CUM", "Fruehauf",
  "Fuhrmann", "General Trailer", "Gergen", "Gniotpol", "Gofa", "Goldhofer", "Gorica", "Gourdon", "Groenewegen", "Gsodam",
  "Hangler", "Hapert", "Harbeck", "Heinemann", "Hendricks", "Henra", "Hexagona", "Hittner", "Hobur", "Hoffmann",
  "Honkhaus", "Homar", "Hotra", "HTT", "Huffermann", "Huifkar", "Humbaur", "Humer", "Hummel", "Hydrofast",
  "IDB", "Ifor Williams", "ITAS-CAS", "Jung Homburg", "Kaiser", "Kassbohrer", "Kautec", "Kempf", "Kiesling", "King Trailers",
  "Klaeser", "KML", "Knapen", "Knežev Trailers", "Koch", "Koegel", "Koluman", "Kotschenreuther", "Kraker", "Kroeger",
  "Krone", "Krukenmeier", "Lafaro", "LAG", "Lamberet", "Langendorf", "Lecinena", "Legras", "Leško", "Ley",
  "Leci", "LinTrailers", "Lohr", "Lorries", "Majevica", "Marchner", "Marpol", "Martz", "MAX Trailer", "MEGA",
  "Meierling", "Meiller", "MERCERON", "Menci", "Metal", "Meusburger", "MEV", "MF-CT", "Mirofret", "Moere Maskiner",
  "Molgjer", "Montracon", "Möslein", "MP International", "Mrak", "MS Dorse", "Muldy", "Muller-Mitteltal", "Närko", "Neptun",
  "NETAM-Fruehauf", "Niewiadow", "Nokka", "Nopa", "Noteboom", "Novatecno", "Novatrail", "NUGENT", "Obermaier", "Omar",
  "OMEPS", "OMT", "Orten", "Orthaus", "Ozsan Treyler", "Pacton", "Palfinger", "Pavelli", "Peecon", "Peischl",
  "Pichon", "Pongratz", "Puhringer", "Ranger", "Reis Trailer", "Reisch", "Reja Treyler", "Renders", "Reuter", "Rohr",
  "Romsan", "Ruthmann", "Samro", "Saris", "Sawo", "Scandic", "Scantrax", "Scheuerle", "Schmidt", "Schmitz Cargobull",
  "Schwarzmuller", "Schwingenschlogel", "Setra/Kaesbohrer", "Sigg", "Silver Car", "Sluis", "Sommer", "Snedker", "Sorelpol", "Spitzer",
  "Stas", "Stema", "Stetzl", "Svan", "TA-NO", "Talson", "Tema", "Temared", "Thiel", "Thomas Trailers",
  "Tirsan", "Tomplan", "TPV", "Trailor", "Tranders", "Trigano", "Trouillet", "Umega", "UNI Track", "Unimog",
  "Unsinn", "Vaia", "VanHool", "Vega Trailer", "Varig", "Vesta Trailers", "Vlemmix", "Vocol", "Wackenhut",
  "Wagner", "Wark", "Wecon", "Weimer", "Westfalia", "Widpol", "Wielton", "Wiola", "Wormann", "Woz",
  "WM Meyer", "Z-Trailer", "Zaccaria", "Zagroda", "Zandt Cargo", "Zaslaw", "Zingaro", "Zonta", "Zorzi", "ZVVZ",
];
const SLUG_P = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PRIKOLICE_RAW: CarMake[] = [
  ...PRIKOLICE_NAMES.map((n) => M(SLUG_P(n), n, "—")),
  M("ostalo", "Ostalo", "—"),
];
export const GOSPODARSKA_PRIKOLICE_MAKES: CarMake[] = [
  ...sortHr(PRIKOLICE_RAW.filter((m) => m.slug !== "ostalo")),
  ...PRIKOLICE_RAW.filter((m) => m.slug === "ostalo"),
];

// --- UTV vozila (avto.net SID=68000, 119 marki) --------------------------
const UTV_NAMES: string[] = [
  "Access Motor", "Adly", "Aeon", "Aixam", "Alke", "Apache", "Apollo", "Arctic Cat", "Argo", "ATV",
  "Barossa", "Barton", "Bashan", "Benda", "Bombardier", "BRC", "Can-Am", "Carello", "Cectek", "CF Moto",
  "Chatenet", "Club Car", "Columbia", "Corvus", "CPI", "Cushman", "DFM", "Dinli", "E-Ton", "E-Z-GO",
  "EGL moto", "eMover", "Estrima", "Explorer", "Fangpower", "Garia", "Generic", "Gilera", "Goes", "Goupil",
  "HDK", "Hisun", "Honda", "Hyosung", "Irbis", "Italjet", "JCB", "John Deere", "Jonway", "Kangchao",
  "Kawasaki", "Kayo", "KeeWay", "Kingwell", "Kinroad", "Kioti", "KTM", "Kubota", "Kymco", "LEM",
  "Lifan", "Ligier", "Linhai", "lintex", "Lizhong", "Loncin", "Melex", "Microcar", "Odes", "Orion",
  "ParCar", "PGO", "Piaggio", "Pilotcar", "Pioneer", "Pitsterpro", "Polaris", "QJMotor", "Quadix", "Reinmech",
  "Romet", "Segway", "Shineray", "Skygo", "Skyteam", "SMC", "Stark", "Stels", "Stomp", "Suzuki",
  "Sym", "Taylor-Dunn", "Tao Motor", "Textron", "TGB", "Thumpstar", "TMS", "Tomberlin", "Toro", "Triton",
  "UPmoto", "Ural", "UTV", "Volta", "Vonroad", "Xingyue", "Xmotos", "Yamaha",
];
const UTV_RAW: CarMake[] = [
  ...UTV_NAMES.map((n) => M(SLUG_P(n), n, "—")),
  M("ostalo", "Ostalo", "—"),
];
export const GOSPODARSKA_UTV_MAKES: CarMake[] = [
  ...sortHr(UTV_RAW.filter((m) => m.slug !== "ostalo")),
  ...UTV_RAW.filter((m) => m.slug === "ostalo"),
];

// --- Avtobusi (avto.net nema vlastitu formu — kurirano, PRIJAVLJENO Karlu) -
const AUTOBUSI_RAW: CarMake[] = [
  // Karlo 22.08.2026: njegov popis autobusa — dodani AVTOBUS, BMC, FIAT;
  // maknut Solaris (nije na popisu, 0 oglasa u bazi).
  M("avtobus", "AVTOBUS", "—"),
  M("bmc", "BMC", "Turska"),
  M("fiat", "FIAT", "Italija"),
  M("ford", "Ford", "SAD"),
  M("iveco", "Iveco", "Italija", ["Crossway", "Urbanway"]),
  M("man", "MAN", "Njemačka", ["Lion's City", "Lion's Coach", "Lion's Regio"]),
  M("mercedes-benz", "Mercedes-Benz", "Njemačka", ["Citaro", "Tourismo", "Intouro", "Sprinter City"]),
  M("neoplan", "Neoplan", "Njemačka"),
  M("otokar", "Otokar", "Turska"),
  M("renault", "Renault", "Francuska"),
  M("scania", "Scania", "Švedska", ["Irizar", "Touring", "Interlink"]),
  M("setra", "Setra", "Njemačka", ["S 415", "S 416", "S 417", "S 431", "S 515", "ComfortClass", "TopClass"]),
  M("tam", "TAM", "Slovenija"),
  M("temsa", "Temsa", "Turska"),
  M("vanhool", "VanHool", "Belgija"),
  M("volvo", "Volvo", "Švedska", ["7900", "9700", "9900"]),
  M("ostalo", "Ostalo", "—"),
];
export const GOSPODARSKA_AUTOBUSI_MAKES: CarMake[] = [
  ...sortHr(AUTOBUSI_RAW.filter((m) => m.slug !== "ostalo")),
  ...AUTOBUSI_RAW.filter((m) => m.slug === "ostalo"),
];
