export type Location = {
  county: string;
  cities: string[];
};

export const HR_LOCATIONS: Location[] = [
  { county: "Grad Zagreb", cities: ["Zagreb"] },
  {
    county: "Zagrebačka županija",
    cities: ["Velika Gorica", "Samobor", "Zaprešić", "Sveti Ivan Zelina", "Dugo Selo", "Vrbovec", "Sveta Nedelja"],
  },
  { county: "Splitsko-dalmatinska županija", cities: ["Split", "Solin", "Kaštela", "Trogir", "Sinj", "Omiš", "Makarska", "Imotski"] },
  { county: "Primorsko-goranska županija", cities: ["Rijeka", "Opatija", "Crikvenica", "Krk", "Mali Lošinj", "Delnice"] },
  { county: "Osječko-baranjska županija", cities: ["Osijek", "Đakovo", "Našice", "Beli Manastir", "Valpovo"] },
  { county: "Istarska županija", cities: ["Pula", "Poreč", "Rovinj", "Pazin", "Umag", "Labin", "Buzet"] },
  { county: "Zadarska županija", cities: ["Zadar", "Biograd na Moru", "Benkovac", "Pag", "Nin"] },
  { county: "Šibensko-kninska županija", cities: ["Šibenik", "Vodice", "Knin", "Drniš", "Skradin"] },
  { county: "Dubrovačko-neretvanska županija", cities: ["Dubrovnik", "Metković", "Ploče", "Korčula"] },
  { county: "Karlovačka županija", cities: ["Karlovac", "Ogulin", "Duga Resa", "Slunj"] },
  { county: "Sisačko-moslavačka županija", cities: ["Sisak", "Petrinja", "Kutina", "Novska", "Glina"] },
  { county: "Varaždinska županija", cities: ["Varaždin", "Ivanec", "Ludbreg", "Novi Marof"] },
  { county: "Koprivničko-križevačka županija", cities: ["Koprivnica", "Križevci", "Đurđevac"] },
  { county: "Krapinsko-zagorska županija", cities: ["Krapina", "Zabok", "Donja Stubica", "Pregrada"] },
  { county: "Međimurska županija", cities: ["Čakovec", "Prelog", "Mursko Središće"] },
  { county: "Bjelovarsko-bilogorska županija", cities: ["Bjelovar", "Daruvar", "Garešnica"] },
  { county: "Brodsko-posavska županija", cities: ["Slavonski Brod", "Nova Gradiška"] },
  { county: "Vukovarsko-srijemska županija", cities: ["Vukovar", "Vinkovci", "Županja", "Ilok"] },
  { county: "Požeško-slavonska županija", cities: ["Požega", "Pleternica", "Pakrac"] },
  { county: "Virovitičko-podravska županija", cities: ["Virovitica", "Slatina", "Orahovica"] },
  { county: "Ličko-senjska županija", cities: ["Gospić", "Otočac", "Senj", "Novalja"] },
];

export const ALL_CITIES = HR_LOCATIONS.flatMap((l) =>
  l.cities.map((c) => ({ city: c, county: l.county }))
);

export const COUNTIES = HR_LOCATIONS.map((l) => l.county);
