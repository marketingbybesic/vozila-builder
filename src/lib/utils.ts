import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eurFmt = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(eur: number): string {
  return eurFmt.format(eur);
}

const kmFmt = new Intl.NumberFormat("hr-HR");

export function formatKm(km: number): string {
  return `${kmFmt.format(km)} km`;
}

export function formatPower(kw: number): string {
  const hp = Math.round(kw * 1.359);
  return `${kw} kW (${hp} KS)`;
}

const dateFmt = new Intl.DateTimeFormat("hr-HR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(d: string | Date): string {
  return dateFmt.format(new Date(d));
}

export function timeAgo(d: string | Date): string {
  const date = new Date(d);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "upravo sad";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `prije ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `prije ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `prije ${days} ${days === 1 ? "dan" : "dana"}`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `prije ${weeks} ${weeks === 1 ? "tjedan" : "tjedna"}`;
  }
  return formatDate(date);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/č|ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
