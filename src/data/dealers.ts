export type Dealer = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  city: string;
  county: string;
  listings: DealerListing[];
};

export type DealerListing = {
  title: string;
  price: number;
  image: string;
  slug: string;
};

export const FEATURED_DEALERS: Dealer[] = [
  {
    id: "dealer-1",
    name: "Auto Centar Zagreb",
    slug: "auto-centar-zagreb",
    logoUrl: "",
    city: "Zagreb",
    county: "Grad Zagreb",
    listings: [
      { title: "Volkswagen Golf 8 1.5 TSI", price: 24900, image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&h=300&fit=crop", slug: "volkswagen-golf-8-1-5-tsi-2023-zagreb-lst-d001" },
      { title: "BMW Serija 3 320d", price: 32500, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop", slug: "bmw-serija-3-320d-2022-zagreb-lst-d002" },
      { title: "Audi A4 40 TDI", price: 29900, image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=300&fit=crop", slug: "audi-a4-40-tdi-2021-zagreb-lst-d003" },
      { title: "Mercedes C 200", price: 35900, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop", slug: "mercedes-c-200-2022-zagreb-lst-d004" },
      { title: "Skoda Octavia 2.0 TDI", price: 22500, image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=300&fit=crop", slug: "skoda-octavia-2-0-tdi-2021-zagreb-lst-d005" },
      { title: "Toyota RAV4 2.5 Hybrid", price: 38900, image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop", slug: "toyota-rav4-2-5-hybrid-2023-zagreb-lst-d006" },
    ],
  },
  {
    id: "dealer-2",
    name: "Premium Motors Split",
    slug: "premium-motors-split",
    logoUrl: "",
    city: "Split",
    county: "Splitsko-dalmatinska",
    listings: [
      { title: "Peugeot 3008 1.5 BlueHDi", price: 26700, image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=300&fit=crop", slug: "peugeot-3008-1-5-bluehdi-2022-split-lst-d007" },
      { title: "Renault Captur TCe 130", price: 19800, image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop", slug: "renault-captur-tce-130-2022-split-lst-d008" },
      { title: "Ford Kuga 2.0 EcoBlue", price: 27500, image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop", slug: "ford-kuga-2-0-ecoblue-2021-split-lst-d009" },
      { title: "Hyundai Tucson 1.6 CRDi", price: 28900, image: "https://images.unsplash.com/photo-1628956719520-4b0a1e5ebf0e?w=400&h=300&fit=crop", slug: "hyundai-tucson-1-6-crdi-2022-split-lst-d010" },
      { title: "Opel Grandland 1.5D", price: 23400, image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop", slug: "opel-grandland-1-5d-2021-split-lst-d011" },
      { title: "Mazda CX-5 2.2D AWD", price: 31200, image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop", slug: "mazda-cx-5-2-2d-awd-2022-split-lst-d012" },
    ],
  },
  {
    id: "dealer-3",
    name: "Autohaus Rijeka",
    slug: "autohaus-rijeka",
    logoUrl: "",
    city: "Rijeka",
    county: "Primorsko-goranska",
    listings: [
      { title: "Volvo XC60 B4 AWD", price: 42500, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop", slug: "volvo-xc60-b4-awd-2023-rijeka-lst-d013" },
      { title: "Kia Sportage 1.6 T-GDI", price: 29900, image: "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=400&h=300&fit=crop", slug: "kia-sportage-1-6-tgdi-2022-rijeka-lst-d014" },
      { title: "Citroen C5 Aircross", price: 24300, image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop", slug: "citroen-c5-aircross-2021-rijeka-lst-d015" },
      { title: "Fiat 500X 1.3 FireFly", price: 18900, image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop", slug: "fiat-500x-1-3-firefly-2021-rijeka-lst-d016" },
      { title: "Nissan Qashqai 1.3 DIG-T", price: 26800, image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop", slug: "nissan-qashqai-1-3-digt-2022-rijeka-lst-d017" },
      { title: "Dacia Duster 1.5 dCi", price: 16500, image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop", slug: "dacia-duster-1-5-dci-2021-rijeka-lst-d018" },
    ],
  },
  {
    id: "dealer-4",
    name: "Euro Auto Osijek",
    slug: "euro-auto-osijek",
    logoUrl: "",
    city: "Osijek",
    county: "Osjecko-baranjska",
    listings: [
      { title: "VW Passat 2.0 TDI DSG", price: 27800, image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop", slug: "vw-passat-2-0-tdi-dsg-2022-osijek-lst-d019" },
      { title: "Seat Leon 1.5 TSI FR", price: 23400, image: "https://images.unsplash.com/photo-1612825173281-9a193378527e?w=400&h=300&fit=crop", slug: "seat-leon-1-5-tsi-fr-2022-osijek-lst-d020" },
      { title: "Tesla Model 3 Long Range", price: 39900, image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop", slug: "tesla-model-3-lr-2023-osijek-lst-d021" },
      { title: "Porsche Macan S", price: 54900, image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&h=300&fit=crop", slug: "porsche-macan-s-2021-osijek-lst-d022" },
      { title: "Toyota Corolla 1.8 Hybrid", price: 21500, image: "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400&h=300&fit=crop", slug: "toyota-corolla-1-8-hybrid-2022-osijek-lst-d023" },
      { title: "BMW X3 xDrive20d", price: 41200, image: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=400&h=300&fit=crop", slug: "bmw-x3-xdrive20d-2022-osijek-lst-d024" },
    ],
  },
  {
    id: "dealer-5",
    name: "Dalmatina Auto",
    slug: "dalmatina-auto",
    logoUrl: "",
    city: "Zadar",
    county: "Zadarska",
    listings: [
      { title: "Seat Arona 1.0 TSI FR", price: 19500, image: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&h=300&fit=crop", slug: "seat-arona-1-0-tsi-fr-2022-zadar-lst-d025" },
      { title: "VW T-Roc 1.5 TSI Sport", price: 28400, image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=300&fit=crop", slug: "vw-t-roc-1-5-tsi-sport-2022-zadar-lst-d026" },
      { title: "Audi Q3 35 TDI", price: 34700, image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=300&fit=crop", slug: "audi-q3-35-tdi-2022-zadar-lst-d027" },
      { title: "Mercedes GLA 200", price: 31900, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop", slug: "mercedes-gla-200-2023-zadar-lst-d028" },
      { title: "BMW X1 sDrive18d", price: 29800, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop", slug: "bmw-x1-sdrive18d-2022-zadar-lst-d029" },
      { title: "Skoda Kamiq 1.0 TSI", price: 21200, image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop", slug: "skoda-kamiq-1-0-tsi-2022-zadar-lst-d030" },
    ],
  },
  {
    id: "dealer-6",
    name: "Slavonija Motors",
    slug: "slavonija-motors",
    logoUrl: "",
    city: "Slavonski Brod",
    county: "Brodsko-posavska",
    listings: [
      { title: "Renault Megane E-Tech", price: 33500, image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop", slug: "renault-megane-etech-2023-sb-lst-d031" },
      { title: "Peugeot 308 1.5 BlueHDi", price: 24800, image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=300&fit=crop", slug: "peugeot-308-1-5-bluehdi-2022-sb-lst-d032" },
      { title: "Citroen C4 PureTech 130", price: 22100, image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop", slug: "citroen-c4-puretech-130-2022-sb-lst-d033" },
      { title: "Opel Astra 1.2 Turbo", price: 23700, image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop", slug: "opel-astra-1-2-turbo-2022-sb-lst-d034" },
      { title: "Ford Focus 1.0 EcoBoost", price: 20400, image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop", slug: "ford-focus-1-0-ecoboost-2022-sb-lst-d035" },
      { title: "Hyundai i30 1.5 DPI", price: 19800, image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop", slug: "hyundai-i30-1-5-dpi-2022-sb-lst-d036" },
    ],
  },
];
