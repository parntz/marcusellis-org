import type { MetadataRoute } from "next";
import { getArticles } from "@/db/queries";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  const routes = [
    "",
    "/my-story",
    "/videos",
    "/articles",
    "/products",
    "/donations",
    "/intake",
    "/contact",
    "/patient-flow-websites",
    "/privacy",
    "/cookies",
    "/disclaimer"
  ];

  return [
    ...routes.map((route) => ({ url: absoluteUrl(route), lastModified: new Date() })),
    ...articles.map((article) => ({ url: absoluteUrl(`/articles/${article.slug}`), lastModified: new Date(article.publishedAt ?? Date.now()) }))
  ];
}
