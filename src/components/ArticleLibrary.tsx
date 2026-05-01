"use client";

import { useMemo, useState } from "react";
import type { Article } from "@/db/schema";
import { uniqueValues } from "@/lib/utils";
import { ArticleCard } from "./ArticleCard";
import { SearchAndFilterBar } from "./SearchAndFilterBar";

export function ArticleLibrary({ articles }: { articles: Partial<Article>[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => uniqueValues(articles, (article) => article.category ?? ""), [articles]);

  const filtered = articles.filter((article) => {
    const haystack = [article.title, article.subtitle, article.category, article.author].join(" ").toLowerCase();
    return (category === "All" || article.category === category) && haystack.includes(search.toLowerCase());
  });

  return (
    <div className="grid gap-8">
      <SearchAndFilterBar categories={categories} activeCategory={category} search={search} onSearch={setSearch} onCategory={setCategory} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
