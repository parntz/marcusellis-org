import type { Article, Video } from "@/db/schema";
import { ArticleCard } from "./ArticleCard";
import { VideoCard } from "./VideoCard";

export function FeaturedResourceGrid({
  articles,
  videos
}: {
  articles: Partial<Article>[];
  videos: Partial<Video>[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      {articles[0] ? <ArticleCard article={articles[0]} featured /> : null}
      <div className="grid gap-5">
        {videos.slice(0, 2).map((video) => (
          <VideoCard key={video.slug} video={video} />
        ))}
      </div>
    </div>
  );
}
