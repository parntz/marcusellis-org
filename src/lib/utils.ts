import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  return new URL(path, base).toString();
}

export function uniqueValues<T>(items: T[], getValue: (item: T) => string) {
  return Array.from(new Set(items.map(getValue))).filter(Boolean);
}
