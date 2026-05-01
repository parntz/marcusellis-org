import { getDb } from "./client";
import {
  articles,
  donationLinks,
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

const db = getDb();

async function seed() {
  await db.delete(donationLinks);
  await db.delete(navigationLinks);

  for (const setting of seedSettings) {
    await db
      .insert(siteSettings)
      .values(setting)
      .onConflictDoUpdate({ target: siteSettings.key, set: setting });
  }

  for (const page of seedPages) {
    await db
      .insert(pages)
      .values(page)
      .onConflictDoUpdate({ target: pages.slug, set: page });
  }

  for (const article of seedArticles) {
    await db
      .insert(articles)
      .values(article)
      .onConflictDoUpdate({ target: articles.slug, set: article });
  }

  for (const video of seedVideos) {
    await db
      .insert(videos)
      .values(video)
      .onConflictDoUpdate({ target: videos.slug, set: video });
  }

  for (const product of seedProducts) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({ target: products.slug, set: product });
  }

  for (const link of seedDonationLinks) {
    await db.insert(donationLinks).values(link);
  }

  for (const link of seedNavigation) {
    await db.insert(navigationLinks).values(link);
  }

  console.log("Seeded Gabriel resource site content.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
