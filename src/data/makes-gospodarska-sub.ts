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
  M("alke", "Alke", "Italija"),
  M("baw", "BAW", "Kina"),
  M("bellier", "Bellier", "Francuska"),
  M("bonetti", "Bonetti", "Italija"),
  M("carello", "Carello", "Italija"),
  M("casalini", "Casalini", "Italija"),
  M("cenntro", "Cenntro", "Kina"),
  M("chevrolet", "Chevrolet", "SAD"),
  M("citroen", "Citroën", "Francuska", ["Berlingo", "Jumpy", "Jumper", "Nemo", "ë-Berlingo", "ë-Jumpy", "ë-Jumper"]),
  M("dacia", "Dacia", "Rumunjska", ["Dokker Van", "Logan Van", "Duster Van"]),
  M("daihatsu", "Daihatsu", "Japan"),
  M("daf", "DAF", "Nizozemska"),
  M("dfm", "DFM", "Kina"),
  M("elaris", "Elaris", "Njemačka"),
  M("farizon", "Farizon", "Kina"),
  M("fiat", "Fiat", "Italija", ["Doblo Cargo", "Fiorino", "Scudo", "Talento", "Ducato", "E-Ducato", "E-Scudo", "E-Doblo"]),
  M("ford", "Ford", "SAD", ["Transit", "Transit Custom", "Transit Connect", "Transit Courier", "E-Transit", "E-Transit Custom"]),
  M("fort", "Fort", "Kina"),
  M("foton", "Foton", "Kina"),
  M("gaz", "GAZ", "Rusija"),
  M("giotti-victoria", "Giotti Victoria", "Italija"),
  M("goupil", "Goupil", "Francuska"),
  M("hyundai", "Hyundai", "Južna Koreja", ["H-1", "H350", "Staria Van", "Porter", "H100"]),
  M("imv", "IMV", "Italija"),
  M("isuzu", "Isuzu", "Japan", ["D-Max", "N-Series"]),
  M("iveco", "Iveco", "Italija", ["Daily", "eDaily"]),
  M("kia", "KIA", "Južna Koreja"),
  M("land-rover", "Land Rover", "Velika Britanija"),
  M("man", "MAN", "Njemačka", ["TGE"]),
  M("maxus", "Maxus", "Kina"),
  M("mazda", "Mazda", "Japan"),
  M("mercedes-benz", "Mercedes-Benz", "Njemačka", ["Citan", "Vito", "eVito", "V-klasa", "Sprinter", "eSprinter"]),
  M("mitsubishi", "Mitsubishi", "Japan", ["L200", "L300"]),
  M("nextem", "Nextem", "Italija"),
  M("nissan", "Nissan", "Japan", ["NV200", "e-NV200", "NV250", "NV300", "NV400", "Townstar"]),
  M("om", "OM", "Italija"),
  M("opel", "Opel", "Njemačka", ["Combo Cargo", "Combo-e", "Vivaro", "Vivaro-e", "Movano", "Movano-e"]),
  M("peugeot", "Peugeot", "Francuska", ["Partner", "e-Partner", "Rifter", "Expert", "e-Expert", "Boxer", "e-Boxer"]),
  M("piaggio", "Piaggio", "Italija"),
  M("renault", "Renault", "Francuska", ["Kangoo", "Kangoo E-Tech", "Express Van", "Trafic", "Trafic E-Tech", "Master", "Master E-Tech"]),
  M("seat", "Seat", "Španjolska"),
  M("skoda", "Škoda", "Češka"),
  M("ssangyong", "SsangYong", "Južna Koreja"),
  M("suzuki", "Suzuki", "Japan"),
  M("taylor-dunn", "Taylor-Dunn", "SAD"),
  M("toyota", "Toyota", "Japan", ["Proace", "Proace City", "Proace Verso"]),
  M("volkswagen", "Volkswagen", "Njemačka", ["Caddy Cargo", "Caddy Maxi", "Transporter T6.1", "Transporter T7", "ID. Buzz Cargo", "Crafter", "e-Crafter"]),
  M("yugo", "Yugo", "Srbija"),
  M("yunlong", "Yunlong", "Kina"),
  M("zastava", "Zastava", "Srbija"),
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
  "Unsinn", "Vaia", "VanHool", "Vega Trailer", "Varig", "Vesta Trailers", "Vlemmix", "Vocol", "Volkan", "Wackenhut",
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
  M("ford", "Ford", "SAD"),
  M("iveco", "Iveco", "Italija", ["Crossway", "Urbanway"]),
  M("man", "MAN", "Njemačka", ["Lion's City", "Lion's Coach", "Lion's Regio"]),
  M("mercedes-benz", "Mercedes-Benz", "Njemačka", ["Citaro", "Tourismo", "Intouro", "Sprinter City"]),
  M("neoplan", "Neoplan", "Njemačka"),
  M("otokar", "Otokar", "Turska"),
  M("renault", "Renault", "Francuska"),
  M("scania", "Scania", "Švedska", ["Irizar", "Touring", "Interlink"]),
  M("setra", "Setra", "Njemačka", ["S 415", "S 416", "S 417", "S 431", "S 515", "ComfortClass", "TopClass"]),
  M("solaris", "Solaris", "Poljska", ["Urbino 8.9", "Urbino 12", "Urbino 18", "InterUrbino", "Trollino"]),
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
