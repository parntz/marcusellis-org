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
import {
  seedArticles,
  seedDonationLinks,
  seedNavigation,
  seedPages,
  seedProducts,
  seedSettings,
  seedVideos
} from "./content";

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasDatabaseEnv) {
    return fallback;
  }

  try {
    return await query();
  } catch (error) {
    console.error("Database query failed; using bundled content fallback.", error);
    return fallback;
  }
}

export async function getNavigationLinks() {
  return safeQuery(
    () => getDb().query.navigationLinks.findMany({
      where: eq(navigationLinks.active, true),
      orderBy: asc(navigationLinks.sortOrder)
    }),
    seedNavigation
  );
}

export async function getArticles() {
  return safeQuery(
    () => getDb().query.articles.findMany({ orderBy: [desc(articles.featured), desc(articles.publishedAt)] }),
    seedArticles
  );
}

export async function getFeaturedArticles() {
  const allArticles = await getArticles();
  return allArticles.filter((article) => article.featured);
}

export async function getArticleBySlug(slug: string) {
  return safeQuery(
    () => getDb().query.articles.findFirst({ where: eq(articles.slug, slug) }),
    seedArticles.find((article) => article.slug === slug)
  );
}

export async function getVideos() {
  return safeQuery(
    () => getDb().query.videos.findMany({ orderBy: [desc(videos.featured), asc(videos.sortOrder)] }),
    seedVideos
  );
}

export async function getFeaturedVideos() {
  const allVideos = await getVideos();
  return allVideos.filter((video) => video.featured);
}

export async function getProducts() {
  return safeQuery(
    () => getDb().query.products.findMany({ orderBy: [desc(products.featured), asc(products.sortOrder)] }),
    seedProducts
  );
}

export async function getDonationLinks() {
  return safeQuery(
    () => getDb().query.donationLinks.findMany({
      where: eq(donationLinks.active, true),
      orderBy: asc(donationLinks.sortOrder)
    }),
    seedDonationLinks
  );
}

export async function getPage(slug: string) {
  return safeQuery(
    () => getDb().query.pages.findFirst({ where: eq(pages.slug, slug) }),
    seedPages.find((page) => page.slug === slug)
  );
}

export async function getSetting(key: string) {
  const fallback = seedSettings.find((setting) => setting.key === key)?.value;
  if (!hasDatabaseEnv) {
    return fallback;
  }

  try {
    const row = await getDb().query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
    return row?.value ?? fallback;
  } catch (error) {
    console.error("Setting query failed; using bundled content fallback.", error);
    return fallback;
  }
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
    throw new Error("The intake form requires Turso database configuration.");
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
    throw new Error("The contact form requires Turso database configuration.");
  }

  await getDb().insert(contactSubmissions).values(input);
}
