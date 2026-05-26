import type { Metadata } from "next";
import { DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareBar } from "@/components/compare-button";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vozila.hr"),
  title: {
    default: "Vozila.hr — Oglasi rabljenih i novih vozila",
    template: "%s · Vozila.hr",
  },
  description:
    "Najveće tržište vozila u Hrvatskoj. Tisuće rabljenih i novih vozila — od privatnih prodavača i ovlaštenih trgovaca. Pretraži, usporedi i kupi sigurno.",
  keywords: [
    "rabljeni automobili",
    "polovni automobili",
    "auto oglasi",
    "novi automobili Hrvatska",
    "auti hr",
    "prodaja vozila",
    "kupnja auta",
  ],
  openGraph: {
    type: "website",
    locale: "hr_HR",
    siteName: "Vozila.hr",
    title: "Vozila.hr — Oglasi rabljenih i novih vozila",
    description:
      "Najveće tržište automobila u Hrvatskoj. Tisuće vozila spremnih za isporuku.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vozila.hr",
    description: "Oglasi rabljenih i novih vozila u Hrvatskoj.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="hr"
      className={`${dmSans.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CompareBar />
      </body>
    </html>
  );
}
