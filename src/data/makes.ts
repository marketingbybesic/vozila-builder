import type { CarMake } from "@/lib/types";

export const MAKES: CarMake[] = [
  {
    slug: "volkswagen",
    name: "Volkswagen",
    country: "Njemačka",
    models: ["Golf", "Polo", "Passat", "Tiguan", "T-Roc", "Touareg", "Arteon", "ID.3", "ID.4", "Caddy", "Transporter"],
  },
  {
    slug: "audi",
    name: "Audi",
    country: "Njemačka",
    models: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  },
  {
    slug: "bmw",
    name: "BMW",
    country: "Njemačka",
    models: ["Serija 1", "Serija 2", "Serija 3", "Serija 4", "Serija 5", "Serija 7", "X1", "X3", "X5", "X6", "i3", "i4"],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    country: "Njemačka",
    models: ["A klasa", "B klasa", "C klasa", "E klasa", "S klasa", "CLA", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQC"],
  },
  {
    slug: "skoda",
    name: "Škoda",
    country: "Češka",
    models: ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  },
  {
    slug: "renault",
    name: "Renault",
    country: "Francuska",
    models: ["Clio", "Captur", "Megane", "Kadjar", "Arkana", "Austral", "Espace", "Zoe", "Twingo"],
  },
  {
    slug: "peugeot",
    name: "Peugeot",
    country: "Francuska",
    models: ["208", "308", "508", "2008", "3008", "5008", "e-208"],
  },
  {
    slug: "citroen",
    name: "Citroën",
    country: "Francuska",
    models: ["C3", "C4", "C5 Aircross", "Berlingo", "ë-C4"],
  },
  {
    slug: "opel",
    name: "Opel",
    country: "Njemačka",
    models: ["Corsa", "Astra", "Insignia", "Crossland", "Grandland", "Mokka"],
  },
  {
    slug: "ford",
    name: "Ford",
    country: "SAD",
    models: ["Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "Galaxy", "Ranger", "Mustang", "Mustang Mach-E"],
  },
  {
    slug: "toyota",
    name: "Toyota",
    country: "Japan",
    models: ["Yaris", "Corolla", "Camry", "C-HR", "RAV4", "Hilux", "Land Cruiser", "Prius", "bZ4X"],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    country: "Južna Koreja",
    models: ["i10", "i20", "i30", "Bayon", "Kona", "Tucson", "Santa Fe", "Ioniq 5", "Ioniq 6"],
  },
  {
    slug: "kia",
    name: "Kia",
    country: "Južna Koreja",
    models: ["Picanto", "Rio", "Ceed", "ProCeed", "Stonic", "Sportage", "Sorento", "EV6", "EV9"],
  },
  {
    slug: "fiat",
    name: "Fiat",
    country: "Italija",
    models: ["500", "Panda", "Tipo", "500X", "500e", "Doblo"],
  },
  {
    slug: "mazda",
    name: "Mazda",
    country: "Japan",
    models: ["2", "3", "6", "CX-3", "CX-5", "CX-30", "CX-60", "MX-5"],
  },
  {
    slug: "nissan",
    name: "Nissan",
    country: "Japan",
    models: ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya"],
  },
  {
    slug: "volvo",
    name: "Volvo",
    country: "Švedska",
    models: ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "EX30"],
  },
  {
    slug: "tesla",
    name: "Tesla",
    country: "SAD",
    models: ["Model 3", "Model Y", "Model S", "Model X"],
  },
  {
    slug: "dacia",
    name: "Dacia",
    country: "Rumunjska",
    models: ["Sandero", "Logan", "Duster", "Jogger", "Spring"],
  },
  {
    slug: "porsche",
    name: "Porsche",
    country: "Njemačka",
    models: ["911", "Cayenne", "Macan", "Panamera", "Taycan", "718 Cayman", "718 Boxster"],
  },
];

export const POPULAR_MAKE_SLUGS = ["volkswagen", "audi", "bmw", "mercedes-benz", "skoda", "renault", "peugeot", "toyota"];

export function getMake(slug: string): CarMake | undefined {
  return MAKES.find((m) => m.slug === slug);
}
