import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { getVideos } from "@/db/queries";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { ImageHero } from "@/components/ImageHero";
import { VideoLibrary } from "@/components/VideoLibrary";

export const metadata: Metadata = {
  title: "Video Library",
  description: "A searchable library of external interviews, personal story videos, and educational talks."
};

export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <>
      <ImageHero title="Video-forward stories, interviews, and atmospheric resources." subtitle="Search external talks, featured interviews, healing-related conversations, and keyboard performance material gathered for educational exploration." image={assets.myStoryThumb} eyebrow="Video library" />
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <DisclaimerBox type="medical" />
        <div className="mt-10">
          <VideoLibrary videos={videos} />
        </div>
      </section>
    </>
  );
}
