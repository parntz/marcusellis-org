import { asc, desc, eq } from "drizzle-orm";
import { getDb, hasDatabaseEnv } from "./client";
import {
  articles,
  contactSubmissions,
  donationLinks,
  intakeSubmissions,
  navigationLinks,
  pages,
  products,
  siteSettings,
  videos
} from "./schema";
import type { Article, DonationLink, NavigationLink, Page, Product, Video } from "./schema";
import {
  seedArticles,
  seedDonationLinks,
  seedNavigation,
  seedPages,
  seedProducts,
  seedSettings,
  seedVideos
} from "./content";

const NOW = "2026-01-01T00:00:00.000Z";

function withTimestamps<T extends Record<string, unknown>>(items: T[]): Array<T & { id: number; createdAt: string; updatedAt: string }> {
  return items.map((item, index) => ({
    ...item,
    id: index + 1,
    createdAt: NOW,
    updatedAt: NOW
  }));
}

function fallbackArticles(): Article[] {
  return withTimestamps(seedArticles) as unknown as Article[];
}

function fallbackVideos(): Video[] {
  return withTimestamps(seedVideos) as unknown as Video[];
}

function fallbackProducts(): Product[] {
  return withTimestamps(seedProducts) as unknown as Product[];
}

function fallbackDonationLinks(): DonationLink[] {
  return withTimestamps(seedDonationLinks) as unknown as DonationLink[];
}

function fallbackNavigation(): NavigationLink[] {
  return seedNavigation.map((item, index) => ({ ...item, id: index + 1 })) as unknown as NavigationLink[];
}

function fallbackPages(): Page[] {
  return withTimestamps(seedPages) as unknown as Page[];
}

function fallbackSetting(key: string): string | undefined {
  return seedSettings.find((entry) => entry.key === key)?.value;
}

export async function getNavigationLinks() {
  if (!hasDatabaseEnv) {
    return fallbackNavigation()
      .filter((link) => link.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return getDb().query.navigationLinks.findMany({
    where: eq(navigationLinks.active, true),
    orderBy: asc(navigationLinks.sortOrder)
  });
}

export async function getArticles() {
  if (!hasDatabaseEnv) {
    return fallbackArticles().sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
    });
  }
  return getDb().query.articles.findMany({ orderBy: [desc(articles.featured), desc(articles.publishedAt)] });
}

export async function getFeaturedArticles() {
  const allArticles = await getArticles();
  return allArticles.filter((article) => article.featured);
}

export async function getArticleBySlug(slug: string) {
  if (!hasDatabaseEnv) {
    return fallbackArticles().find((article) => article.slug === slug);
  }
  return getDb().query.articles.findFirst({ where: eq(articles.slug, slug) });
}

export async function getVideos() {
  if (!hasDatabaseEnv) {
    return fallbackVideos().sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
  }
  return getDb().query.videos.findMany({ orderBy: [desc(videos.featured), asc(videos.sortOrder)] });
}

export async function getFeaturedVideos() {
  const allVideos = await getVideos();
  return allVideos.filter((video) => video.featured);
}

export async function getProducts() {
  if (!hasDatabaseEnv) {
    return fallbackProducts().sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
  }
  return getDb().query.products.findMany({ orderBy: [desc(products.featured), asc(products.sortOrder)] });
}

export async function getDonationLinks() {
  if (!hasDatabaseEnv) {
    return fallbackDonationLinks()
      .filter((link) => link.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return getDb().query.donationLinks.findMany({
    where: eq(donationLinks.active, true),
    orderBy: asc(donationLinks.sortOrder)
  });
}

export async function getPage(slug: string) {
  if (!hasDatabaseEnv) {
    return fallbackPages().find((page) => page.slug === slug);
  }
  return getDb().query.pages.findFirst({ where: eq(pages.slug, slug) });
}

export async function getSetting(key: string) {
  if (!hasDatabaseEnv) {
    return fallbackSetting(key);
  }
  const row = await getDb().query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
  return row?.value;
}

export async function requireSetting(key: string) {
  const value = await getSetting(key);
  if (!value) {
    throw new Error(`Missing required site setting "${key}" in Turso.`);
  }

  return value;
}

export async function getDisclaimerCopy(type?: string | null) {
  const settingKey =
    type === "financial"
      ? "disclaimer_financial"
      : type === "affiliate"
        ? "disclaimer_affiliate"
        : type === "general"
          ? "disclaimer_general"
          : "disclaimer_medical";

  return requireSetting(settingKey);
}

export async function createIntakeSubmission(input: {
  name: string;
  email: string;
  phone?: string;
  preferredContact: string;
  topic: string;
  reason: string;
  message: string;
  consent: boolean;
}) {
  if (!hasDatabaseEnv) {
    throw new Error("Database is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to accept submissions.");
  }
  await getDb().insert(intakeSubmissions).values({
    ...input,
    phone: input.phone || null
  });
}

export async function createContactSubmission(input: {
  name: string;
  email: string;
  message: string;
  consent: boolean;
}) {
  if (!hasDatabaseEnv) {
    throw new Error("Database is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to accept submissions.");
  }
  await getDb().insert(contactSubmissions).values(input);
}
