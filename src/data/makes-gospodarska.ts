// Gospodarska vozila — marke + modeli, avto.net pokrivenost (HR tržište).
// Karlo 27.07: dostavna/kamioni/autobusi/prikolice moraju listati iste
// marke i modele kao avto.net, ne 13 imena bez modela.
import type { CarMake } from "@/lib/types";

const M = (slug: string, name: string, country: string, models: string[]): CarMake => ({
  slug, name, country, models,
});

export const GOSPODARSKA_MAKES: CarMake[] = [
  M("citroen", "Citroën", "Francuska", ["Berlingo", "Jumpy", "Jumper", "Nemo", "ë-Berlingo", "ë-Jumpy", "ë-Jumper"]),
  M("daf", "DAF", "Nizozemska", ["LF", "CF", "XF", "XD", "XG", "XG+", "XB", "95 XF", "105 XF"]),
  M("dacia", "Dacia", "Rumunjska", ["Dokker Van", "Logan Van", "Duster Van"]),
  M("fiat", "Fiat", "Italija", ["Doblo Cargo", "Fiorino", "Scudo", "Talento", "Ducato", "E-Ducato", "E-Scudo", "E-Doblo", "Strada", "Fullback"]),
  M("ford", "Ford", "SAD", [
    "Transit", "Transit Custom", "Transit Connect", "Transit Courier", "Tourneo Custom",
    "E-Transit", "E-Transit Custom", "Ranger", "Ranger Raptor", "Cargo",
  ]),
  M("hyundai", "Hyundai", "Južna Koreja", ["H-1", "H350", "Staria Van", "Porter", "H100"]),
  M("isuzu", "Isuzu", "Japan", ["D-Max", "N-Series", "NPR", "NQR", "F-Series", "Forward"]),
  M("iveco", "Iveco", "Italija", [
    "Daily", "eDaily", "Eurocargo", "Stralis", "S-Way", "Trakker", "T-Way", "X-Way",
    "EuroTech", "EuroStar", "Massif", "Crossway", "Urbanway",
  ]),
  M("man", "MAN", "Njemačka", [
    "TGE", "TGL", "TGM", "TGS", "TGX", "TGA", "L2000", "M2000", "F2000",
    "Lion's City", "Lion's Coach", "Lion's Regio",
  ]),
  M("mercedes-benz", "Mercedes-Benz", "Njemačka", [
    "Citan", "Vito", "eVito", "V-klasa", "Sprinter", "eSprinter", "Vario",
    "Atego", "Axor", "Actros", "eActros", "Antos", "Arocs", "Econic", "Unimog",
    "Citaro", "Tourismo", "Intouro", "Sprinter City", "X-klasa",
  ]),
  M("mitsubishi", "Mitsubishi", "Japan", ["L200", "Canter", "Fuso Canter", "eCanter", "L300"]),
  M("nissan", "Nissan", "Japan", ["NV200", "e-NV200", "NV250", "NV300", "NV400", "Primastar", "Interstar", "Townstar", "Navara", "Cabstar", "Atleon"]),
  M("opel", "Opel", "Njemačka", ["Combo Cargo", "Combo-e", "Vivaro", "Vivaro-e", "Movano", "Movano-e", "Zafira Life"]),
  M("peugeot", "Peugeot", "Francuska", ["Partner", "e-Partner", "Rifter", "Expert", "e-Expert", "Traveller", "Boxer", "e-Boxer", "Bipper", "Landtrek"]),
  M("renault", "Renault", "Francuska", ["Kangoo", "Kangoo E-Tech", "Express Van", "Trafic", "Trafic E-Tech", "Master", "Master E-Tech", "Alaskan"]),
  M("renault-trucks", "Renault Trucks", "Francuska", ["D", "D Wide", "C", "K", "T", "T High", "E-Tech D", "E-Tech T", "Midlum", "Premium", "Magnum", "Kerax"]),
  M("scania", "Scania", "Švedska", ["P-serija", "G-serija", "R-serija", "S-serija", "L-serija", "94", "114", "124", "144", "164", "Irizar", "Touring", "Interlink"]),
  M("ssangyong", "SsangYong", "Južna Koreja", ["Musso", "Musso Grand", "Korando Van", "Rexton Sports"]),
  M("setra", "Setra", "Njemačka", ["S 415", "S 416", "S 417", "S 431", "S 515", "S 516", "S 517", "ComfortClass", "TopClass"]),
  M("solaris", "Solaris", "Poljska", ["Urbino 8.9", "Urbino 12", "Urbino 18", "InterUrbino", "Trollino"]),
  M("tatra", "Tatra", "Češka", ["Phoenix", "Force", "Terra", "T815"]),
  M("toyota", "Toyota", "Japan", ["Proace", "Proace City", "Proace Verso", "Hilux", "Dyna", "Land Cruiser Van"]),
  M("volkswagen", "Volkswagen", "Njemačka", [
    "Caddy Cargo", "Caddy Maxi", "Transporter T5", "Transporter T6", "Transporter T6.1", "Transporter T7",
    "ID. Buzz Cargo", "Caravelle", "Multivan", "California", "Crafter", "e-Crafter", "Amarok", "LT", "Constellation",
  ]),
  M("volvo", "Volvo", "Švedska", ["FL", "FE", "FM", "FMX", "FH", "FH16", "F10", "F12", "FL6", "7900", "9700", "9900"]),
  M("schmitz-cargobull", "Schmitz Cargobull", "Njemačka", ["S.KO Cool", "S.CS Universal", "S.KI Kipper", "S.CF", "M.KO"]),
  M("krone", "Krone", "Njemačka", ["Profi Liner", "Cool Liner", "Mega Liner", "Box Liner", "Dry Liner"]),
  M("kogel", "Kögel", "Njemačka", ["Cargo", "Mega", "Trailer Light", "Box", "Tipper"]),
  M("wielton", "Wielton", "Poljska", ["Curtainsider", "Tipper", "Master", "Strong Master"]),
  M("schwarzmuller", "Schwarzmüller", "Austrija", ["Curtainsider", "Tipper", "Platform", "Tank"]),
  M("humbaur", "Humbaur", "Njemačka", ["HA", "HTK", "Steelbox", "Notos", "Xanthos"]),
  M("pongratz", "Pongratz", "Austrija", ["EPA", "LPA", "L-AT", "RK", "PHK"]),
  M("brenderup", "Brenderup", "Danska", ["1205", "1305", "2260", "3251", "4260", "5375"]),
  M("tiki-treler", "Tiki Treler", "Norveška", ["CP 200", "CP 300", "CH 350", "Cargo"]),
  M("ostalo", "Ostalo", "—", []),
];
