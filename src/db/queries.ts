import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
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

export async function getNavigationLinks() {
  return getDb().query.navigationLinks.findMany({
    where: eq(navigationLinks.active, true),
    orderBy: asc(navigationLinks.sortOrder)
  });
}

export async function getArticles() {
  return getDb().query.articles.findMany({ orderBy: [desc(articles.featured), desc(articles.publishedAt)] });
}

export async function getFeaturedArticles() {
  const allArticles = await getArticles();
  return allArticles.filter((article) => article.featured);
}

export async function getArticleBySlug(slug: string) {
  return getDb().query.articles.findFirst({ where: eq(articles.slug, slug) });
}

export async function getVideos() {
  return getDb().query.videos.findMany({ orderBy: [desc(videos.featured), asc(videos.sortOrder)] });
}

export async function getFeaturedVideos() {
  const allVideos = await getVideos();
  return allVideos.filter((video) => video.featured);
}

export async function getProducts() {
  return getDb().query.products.findMany({ orderBy: [desc(products.featured), asc(products.sortOrder)] });
}

export async function getDonationLinks() {
  return getDb().query.donationLinks.findMany({
    where: eq(donationLinks.active, true),
    orderBy: asc(donationLinks.sortOrder)
  });
}

export async function getPage(slug: string) {
  return getDb().query.pages.findFirst({ where: eq(pages.slug, slug) });
}

export async function getSetting(key: string) {
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
  await getDb().insert(contactSubmissions).values(input);
}
