// Moto marke + modeli — avto.net pokrivenost (HR tržište).
// Karlo 27.07: moto marke/modeli moraju biti identični avto.net listi,
// ne 14 hardkodiranih imena bez modela.
import type { CarMake } from "@/lib/types";

const M = (slug: string, name: string, country: string, models: string[]): CarMake => ({
  slug, name, country, models,
});

const MOTO_MAKES_RAW: CarMake[] = [
  M("aeon", "Aeon", "Tajvan", ["Cobra", "Revo", "Elite", "Urban", "My350"]),
  M("aprilia", "Aprilia", "Italija", [
    "RS 125", "RS 660", "RSV4", "Tuono 125", "Tuono 660", "Tuono V4", "Shiver 900",
    "Dorsoduro 900", "Caponord 1200", "Pegaso 650", "SR 50", "SR GT 125", "SR GT 200",
    "SXR 50", "SXR 125", "Scarabeo 100", "Scarabeo 200", "Mana 850", "Tuareg 660",
  ]),
  M("bajaj", "Bajaj", "Indija", ["Pulsar 125", "Pulsar 200", "Dominar 400", "Avenger"]),
  M("benelli", "Benelli", "Italija", [
    "TNT 125", "TNT 249", "TNT 600", "Leoncino 250", "Leoncino 500", "Leoncino 800",
    "TRK 251", "TRK 502", "TRK 702", "502 C", "Imperiale 400",
  ]),
  M("beta", "Beta", "Italija", ["RR 125", "RR 250", "RR 300", "RR 350", "RR 390", "RR 430", "RR 480", "Xtrainer", "Evo"]),
  M("bmw", "BMW", "Njemačka", [
    "C 400 GT", "C 400 X", "C 650 GT", "C evolution", "CE 04", "CE 02",
    "F 650 GS", "F 700 GS", "F 750 GS", "F 800 GS", "F 850 GS", "F 900 GS", "F 900 R", "F 900 XR",
    "G 310 R", "G 310 GS", "G 650 GS", "K 1600 GT", "K 1600 GTL", "K 1300 S",
    "R 1100 GS", "R 1150 GS", "R 1200 GS", "R 1250 GS", "R 1300 GS", "R 1200 R", "R 1250 R",
    "R 1200 RT", "R 1250 RT", "R 18", "R nineT", "S 1000 R", "S 1000 RR", "S 1000 XR", "M 1000 RR",
  ]),
  M("cf-moto", "CF Moto", "Kina", [
    "150 NK", "300 NK", "400 NK", "650 NK", "650 MT", "700 CL-X", "800 MT", "450 SR",
    "CForce 450", "CForce 520", "CForce 625", "CForce 850", "CForce 1000",
    "UForce 600", "UForce 1000", "ZForce 800", "ZForce 950",
  ]),
  M("daelim", "Daelim", "Južna Koreja", ["Daystar", "Roadwin", "S1", "S2", "S3", "Besbi", "Cordi"]),
  M("derbi", "Derbi", "Španjolska", ["Senda 50", "Senda 125", "GPR 50", "GPR 125", "Terra 125", "Boulevard"]),
  M("ducati", "Ducati", "Italija", [
    "Monster 620", "Monster 696", "Monster 797", "Monster 821", "Monster 937", "Monster 1200",
    "Panigale V2", "Panigale V4", "899 Panigale", "959 Panigale", "1199 Panigale", "1299 Panigale",
    "Multistrada 950", "Multistrada 1200", "Multistrada V2", "Multistrada V4",
    "Streetfighter V2", "Streetfighter V4", "Hypermotard 796", "Hypermotard 950",
    "Diavel", "XDiavel", "Scrambler Icon", "Scrambler Desert Sled", "DesertX", "SuperSport 950",
  ]),
  M("fantic", "Fantic", "Italija", ["Caballero 125", "Caballero 500", "XEF 250", "XEF 450", "XX 125", "XX 250"]),
  M("gasgas", "GasGas", "Španjolska", ["EC 250", "EC 300", "MC 125", "MC 250", "MC 450", "ES 700", "SM 700", "TXT Racing"]),
  M("gilera", "Gilera", "Italija", ["Runner 50", "Runner 125", "Runner 200", "Nexus 250", "Nexus 500", "Fuoco 500", "GP 800"]),
  M("harley-davidson", "Harley-Davidson", "SAD", [
    "Sportster 883", "Sportster 1200", "Sportster S", "Iron 883", "Forty-Eight", "Nightster",
    "Street 750", "Street Bob", "Fat Bob", "Fat Boy", "Low Rider", "Softail Standard",
    "Heritage Classic", "Breakout", "Road King", "Road Glide", "Street Glide", "Electra Glide",
    "Ultra Limited", "Pan America", "V-Rod", "LiveWire",
  ]),
  M("honda", "Honda", "Japan", [
    "CB 125 R", "CB 300 R", "CB 500 F", "CB 500 X", "CB 650 R", "CB 750 Hornet", "CB 1000 R",
    "CBR 125 R", "CBR 250 R", "CBR 500 R", "CBR 600 RR", "CBR 650 R", "CBR 1000 RR",
    "CRF 250 L", "CRF 300 L", "CRF 450 L", "CRF 1000 Africa Twin", "CRF 1100 Africa Twin",
    "NC 700", "NC 750 X", "NT 1100", "VFR 800", "VFR 1200", "Rebel 300", "Rebel 500", "Rebel 1100",
    "Gold Wing", "X-ADV", "Forza 125", "Forza 300", "Forza 350", "Forza 750",
    "SH 125", "SH 150", "SH 300", "PCX 125", "PCX 150", "Vision 110", "Dio", "Monkey", "Grom", "MSX 125",
  ]),
  M("husqvarna", "Husqvarna", "Švedska", [
    "Svartpilen 125", "Svartpilen 250", "Svartpilen 401", "Svartpilen 701",
    "Vitpilen 125", "Vitpilen 250", "Vitpilen 401", "Vitpilen 701",
    "FE 250", "FE 350", "FE 450", "FE 501", "TE 150", "TE 250", "TE 300",
    "FC 250", "FC 350", "FC 450", "TC 125", "TC 250", "Norden 901", "701 Enduro", "701 Supermoto",
  ]),
  M("hyosung", "Hyosung", "Južna Koreja", ["GT 125", "GT 250", "GT 650", "GV 125", "GV 250", "GV 650", "Aquila"]),
  M("indian", "Indian", "SAD", ["Scout", "Scout Bobber", "Chief", "Chieftain", "Springfield", "Roadmaster", "FTR 1200", "Challenger"]),
  M("kawasaki", "Kawasaki", "Japan", [
    "Ninja 125", "Ninja 250", "Ninja 300", "Ninja 400", "Ninja 500", "Ninja 650",
    "Ninja ZX-6R", "Ninja ZX-10R", "Ninja H2", "Ninja 1000 SX",
    "Z 125", "Z 300", "Z 400", "Z 500", "Z 650", "Z 750", "Z 800", "Z 900", "Z 1000", "Z H2",
    "Versys 300", "Versys 650", "Versys 1000", "Vulcan S", "Vulcan 900", "Vulcan 1700",
    "KLX 230", "KLX 300", "KX 250", "KX 450", "W800", "Eliminator 500",
  ]),
  M("keeway", "Keeway", "Kina", ["RKF 125", "RKS 125", "Superlight 125", "Vieste 125", "K-Light 202", "Cityblade"]),
  M("ktm", "KTM", "Austrija", [
    "125 Duke", "200 Duke", "250 Duke", "390 Duke", "690 Duke", "790 Duke", "890 Duke", "990 Duke", "1290 Super Duke",
    "RC 125", "RC 390", "RC 8",
    "125 SX", "250 SX", "250 SX-F", "350 SX-F", "450 SX-F",
    "150 EXC", "250 EXC", "300 EXC", "350 EXC-F", "450 EXC-F", "500 EXC-F",
    "390 Adventure", "790 Adventure", "890 Adventure", "1050 Adventure", "1090 Adventure",
    "1190 Adventure", "1290 Super Adventure", "690 SMC R", "690 Enduro R", "450 Rally",
  ]),
  M("kymco", "Kymco", "Tajvan", [
    "Agility 50", "Agility 125", "Agility 300", "People 125", "People 250", "People S 300",
    "Downtown 125", "Downtown 350", "Xciting 400", "Xciting 500", "Super 8", "Like 125", "Like 200",
    "AK 550", "CV3", "MXU 300", "MXU 550", "MXU 700", "UXV 450", "UXV 700",
  ]),
  M("lambretta", "Lambretta", "Italija", ["V50", "V125", "V200", "X300", "G350"]),
  M("linhai", "Linhai", "Kina", ["ATV 300", "ATV 400", "M550", "M565", "Hunter 550"]),
  M("malaguti", "Malaguti", "Italija", ["F12", "F15", "Madison 125", "Madison 250", "Dune 125", "Monte Pro 125"]),
  M("moto-guzzi", "Moto Guzzi", "Italija", ["V7", "V9", "V85 TT", "V100 Mandello", "California", "Griso", "Norge", "Breva", "Stelvio"]),
  M("moto-morini", "Moto Morini", "Italija", ["Seiemmezzo", "X-Cape 650", "Calibro", "Corsaro"]),
  M("mv-agusta", "MV Agusta", "Italija", ["Brutale 675", "Brutale 800", "Brutale 1000", "F3 675", "F3 800", "F4", "Dragster 800", "Turismo Veloce", "Rush"]),
  M("peugeot", "Peugeot", "Francuska", ["Speedfight 50", "Speedfight 125", "Kisbee 50", "Tweet 125", "Tweet 200", "Django 125", "Metropolis 400", "Satelis 125"]),
  M("piaggio", "Piaggio", "Italija", [
    "Beverly 125", "Beverly 300", "Beverly 400", "Liberty 50", "Liberty 125", "Liberty 150",
    "Medley 125", "Medley 150", "MP3 300", "MP3 400", "MP3 500", "Zip 50", "Typhoon 50", "Typhoon 125",
    "X7", "X8", "X9", "X10", "Fly 125", "1 (električni)",
  ]),
  M("polaris", "Polaris", "SAD", ["Sportsman 570", "Sportsman 850", "Sportsman 1000", "Scrambler 850", "Scrambler 1000", "RZR 570", "RZR 900", "RZR 1000", "Ranger 570", "Ranger 1000", "General 1000"]),
  M("rieju", "Rieju", "Španjolska", ["MRT 50", "MRT 125", "Marathon 125", "Century 125", "Tango 250"]),
  M("royal-enfield", "Royal Enfield", "Indija", ["Classic 350", "Classic 500", "Bullet 350", "Bullet 500", "Meteor 350", "Hunter 350", "Himalayan", "Interceptor 650", "Continental GT 650", "Super Meteor 650", "Shotgun 650"]),
  M("sherco", "Sherco", "Francuska", ["SE 125", "SE 250", "SE 300", "SEF 250", "SEF 300", "SEF 450", "ST Trial"]),
  M("suzuki", "Suzuki", "Japan", [
    "GSX-R 125", "GSX-R 600", "GSX-R 750", "GSX-R 1000", "GSX-S 125", "GSX-S 750", "GSX-S 950", "GSX-S 1000",
    "GSX-8R", "GSX-8S", "SV 650", "SV 1000", "Bandit 600", "Bandit 650", "Bandit 1200", "Bandit 1250",
    "V-Strom 250", "V-Strom 650", "V-Strom 800", "V-Strom 1000", "V-Strom 1050",
    "Burgman 125", "Burgman 200", "Burgman 400", "Burgman 650", "Address 110",
    "DR 650", "DR-Z 400", "RM-Z 250", "RM-Z 450", "Intruder", "Boulevard", "Hayabusa", "Katana",
    "KingQuad 400", "KingQuad 500", "KingQuad 750",
  ]),
  M("sym", "SYM", "Tajvan", ["Symphony 50", "Symphony 125", "Symphony 200", "Jet 14", "Jet X", "Cruisym 125", "Cruisym 300", "Joymax 300", "Maxsym 400", "Maxsym TL 500", "Fiddle 125", "Fiddle 200"]),
  M("triumph", "Triumph", "Velika Britanija", [
    "Street Triple 660", "Street Triple 675", "Street Triple 765", "Speed Triple 1050", "Speed Triple 1200",
    "Speed Twin 900", "Speed Twin 1200", "Bonneville T100", "Bonneville T120", "Bonneville Bobber", "Speedmaster",
    "Scrambler 400", "Scrambler 900", "Scrambler 1200", "Speed 400",
    "Tiger 660", "Tiger 800", "Tiger 850", "Tiger 900", "Tiger 1200", "Trident 660",
    "Daytona 675", "Daytona 765", "Rocket 3", "Thruxton",
  ]),
  M("ural", "Ural", "Rusija", ["Gear Up", "cT", "Ranger", "Sportsman"]),
  M("vespa", "Vespa", "Italija", [
    "Primavera 50", "Primavera 125", "Primavera 150", "Sprint 50", "Sprint 125", "Sprint 150",
    "GTS 125", "GTS 150", "GTS 250", "GTS 300", "GTV 300", "LX 50", "LX 125", "LXV 125",
    "PX 125", "PX 150", "PX 200", "S 50", "S 125", "946", "Elettrica",
  ]),
  M("yamaha", "Yamaha", "Japan", [
    "YZF-R1", "YZF-R3", "YZF-R6", "YZF-R7", "YZF-R125", "R15",
    "MT-03", "MT-07", "MT-09", "MT-10", "MT-125", "XSR 125", "XSR 700", "XSR 900",
    "Tracer 700", "Tracer 900", "Tracer 9", "FZ6", "FZ1", "FZ8",
    "Tenere 700", "Super Tenere 1200", "XT 660", "WR 125", "WR 250", "WR 450", "YZ 125", "YZ 250", "YZ 450",
    "TMAX 500", "TMAX 530", "TMAX 560", "XMAX 125", "XMAX 300", "XMAX 400", "NMAX 125", "NMAX 155",
    "Aerox 50", "Aerox 155", "D'elight 125", "Majesty", "Bolt", "V-Max", "Drag Star",
    "Kodiak 450", "Kodiak 700", "Grizzly 700", "Raptor 700", "YFZ 450",
  ]),
  M("zontes", "Zontes", "Kina", ["125 U", "125 X", "310 R", "310 T", "310 X", "350 T", "350 X", "703 F"]),
  M("zero", "Zero Motorcycles", "SAD", ["S", "SR", "SR/F", "SR/S", "DS", "DSR", "DSR/X", "FX", "FXE"]),
  M("ostalo", "Ostalo", "—", []),
];

/**
 * Karlo 29.07: marke MORAJU biti po abecedi (bilo je "Zontes" prije "Zero",
 * "DAF" prije "Dacia", prikolični brendovi nabacani na kraj).
 * Sortira se u kodu hrvatskim collationom pa novi unosi ne mogu razbiti red.
 * "Ostalo" uvijek ostaje na dnu.
 */
export const MOTO_MAKES: CarMake[] = [
  ...MOTO_MAKES_RAW.filter((m) => m.slug !== "ostalo")
    .sort((a, b) => a.name.localeCompare(b.name, "hr")),
  ...MOTO_MAKES_RAW.filter((m) => m.slug === "ostalo"),
];
