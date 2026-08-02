import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      /**
       * Fotografije oglasa putuju kao base64 data-URL unutar server actiona.
       * Next je zadano ograničen na 1 MB → oglas s više/većih slika je tiho
       * padao ("mali oglasi prolaze, veliki ne", Dino 02.08.).
       * Klijent slike smanjuje (~700 KB svaka), ovo je sigurnosna granica za
       * do 10 slika. Ne dizati bez potrebe — štiti od zlouporabe.
       */
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
