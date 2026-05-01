"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/db/schema";
import { uniqueValues } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { SearchAndFilterBar } from "./SearchAndFilterBar";

export function ProductDirectory({ products }: { products: Partial<Product>[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => uniqueValues(products, (product) => product.category ?? ""), [products]);

  const filtered = products.filter((product) => {
    const haystack = [product.name, product.description, product.category].join(" ").toLowerCase();
    return (category === "All" || product.category === category) && haystack.includes(search.toLowerCase());
  });

  return (
    <div className="grid gap-8">
      <SearchAndFilterBar categories={categories} activeCategory={category} search={search} onSearch={setSearch} onCategory={setCategory} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
