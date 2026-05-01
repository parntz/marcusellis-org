import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
};

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  ...timestamps
});

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  body: text("body").notNull(),
  heroImage: text("hero_image"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ...timestamps
});

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  author: text("author"),
  category: text("category").notNull(),
  body: text("body").notNull(),
  heroImage: text("hero_image"),
  externalSourceUrl: text("external_source_url"),
  disclaimerType: text("disclaimer_type").notNull().default("medical"),
  publishedAt: text("published_at"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  ...timestamps
});

export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  speaker: text("speaker"),
  sourceName: text("source_name"),
  externalUrl: text("external_url"),
  embedUrl: text("embed_url"),
  thumbnailImage: text("thumbnail_image"),
  backdropImage: text("backdrop_image"),
  disclaimerType: text("disclaimer_type").notNull().default("medical"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  externalUrl: text("external_url"),
  image: text("image"),
  affiliate: integer("affiliate", { mode: "boolean" }).notNull().default(false),
  disclaimer: text("disclaimer"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps
});

export const intakeSubmissions = sqliteTable("intake_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  preferredContact: text("preferred_contact").notNull(),
  topic: text("topic").notNull(),
  reason: text("reason").notNull(),
  message: text("message").notNull(),
  consent: integer("consent", { mode: "boolean" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
});

export const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  consent: integer("consent", { mode: "boolean" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
});

export const donationLinks = sqliteTable("donation_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  provider: text("provider").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps
});

export const navigationLinks = sqliteTable("navigation_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  href: text("href").notNull(),
  external: integer("external", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true)
});

export const articleRelations = relations(articles, ({ many }) => ({
  related: many(articles)
}));

export type Article = typeof articles.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Product = typeof products.$inferSelect;
export type DonationLink = typeof donationLinks.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type NavigationLink = typeof navigationLinks.$inferSelect;
