import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareBar } from "@/components/compare-button";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://auti.hr"),
  title: {
    default: "Auti.hr — Oglasi rabljenih i novih automobila",
    template: "%s · Auti.hr",
  },
  description:
    "Najveće tržište automobila u Hrvatskoj. Tisuće rabljenih i novih vozila — od privatnih prodavača i ovlaštenih trgovaca. Pretraži, usporedi i kupi sigurno.",
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
    siteName: "Auti.hr",
    title: "Auti.hr — Oglasi rabljenih i novih automobila",
    description:
      "Najveće tržište automobila u Hrvatskoj. Tisuće vozila spremnih za isporuku.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auti.hr",
    description: "Oglasi rabljenih i novih automobila u Hrvatskoj.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="hr"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
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
