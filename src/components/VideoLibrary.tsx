"use client";

import { useMemo, useState } from "react";
import type { Video } from "@/db/schema";
import { uniqueValues } from "@/lib/utils";
import { SearchAndFilterBar } from "./SearchAndFilterBar";
import { VideoCard } from "./VideoCard";

export function VideoLibrary({ videos }: { videos: Partial<Video>[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => uniqueValues(videos, (video) => video.category ?? ""), [videos]);

  const filtered = videos.filter((video) => {
    const haystack = [video.title, video.description, video.category, video.speaker, video.sourceName].join(" ").toLowerCase();
    return (category === "All" || video.category === category) && haystack.includes(search.toLowerCase());
  });

  return (
    <div className="grid gap-8">
      <SearchAndFilterBar categories={categories} activeCategory={category} search={search} onSearch={setSearch} onCategory={setCategory} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((video) => (
          <VideoCard key={video.slug} video={video} />
        ))}
      </div>
    </div>
  );
}
