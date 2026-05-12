export const FEATURE_CATEGORIES = [
  {
    name: "Sigurnost",
    items: ["ABS", "ESP", "Adaptivni tempomat", "Asistent praćenja trake", "Prepoznavanje znakova", "Senzori parkiranja prednji", "Senzori parkiranja stražnji", "Kamera unatrag", "360° kamera", "Slijepi kut asistent", "Automatsko kočenje u nuždi", "Head-up displej"],
  },
  {
    name: "Udobnost",
    items: ["Klima uređaj", "Automatska klima", "Dvozonska klima", "Trozonska klima", "Grijanje sjedala", "Ventilacija sjedala", "Električno podešavanje sjedala", "Memorija sjedala", "Grijani volan", "Bežično punjenje telefona", "Keyless go", "Električni prtljažnik"],
  },
  {
    name: "Multimedija",
    items: ["Apple CarPlay", "Android Auto", "Navigacija", "Bluetooth", "DAB radio", "Premium audio", "USB-C", "Dodirni zaslon", "Glasovne komande"],
  },
  {
    name: "Eksterijer",
    items: ["LED prednja svjetla", "Matrix LED", "Xenon svjetla", "LED maglenke", "Panoramski krov", "Električni krov", "Aluminijske felge 17\"", "Aluminijske felge 18\"", "Aluminijske felge 19\"", "Aluminijske felge 20\"", "Tonirana stakla", "Krovne šine"],
  },
  {
    name: "Pogon",
    items: ["Servisna knjižica", "Servis u ovlaštenom servisu", "Garažirano", "Prvi vlasnik", "Nepušač", "Nedimljen", "Zimske gume", "Ljetne gume", "Tempomat", "Start/stop sistem", "Sport način vožnje", "Eco način vožnje"],
  },
];

export const ALL_FEATURES = FEATURE_CATEGORIES.flatMap((c) => c.items);
