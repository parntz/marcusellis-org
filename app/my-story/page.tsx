import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { CinematicHero } from "@/components/CinematicHero";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { MarcusGuideCard } from "@/components/MarcusGuideCard";
import { PullQuote } from "@/components/PullQuote";
import { SectionHeading } from "@/components/SectionHeading";
import { SplitImageTextSection } from "@/components/SplitImageTextSection";
import { VideoCard } from "@/components/VideoCard";
import { getVideos } from "@/db/queries";

export const metadata: Metadata = {
  title: "My Story",
  description: "Marcus Ellis's personal story, timeline, and carefully framed next steps."
};

export default async function MyStoryPage() {
  const videos = await getVideos();
  const myStoryVideo = videos.find((video) => video.slug === "my-story-ttac") ?? videos[0];

  return (
    <>
      <CinematicHero
        eyebrow="Personal story"
        title="A story carried by courage, questions, and the road not taken."
        subtitle="This page is personal narrative and reflection. It is not medical advice, diagnosis, treatment, or a substitute for licensed care."
        image={assets.clientSpeaking}
        primaryCta={{ label: "Watch the Story", href: "#story-video" }}
        secondaryCta={{ label: "Contact Marcus Ellis", href: "/contact" }}
      />
      <section id="story-video" className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-[1fr_0.7fr] md:px-8">
        <VideoCard video={myStoryVideo} />
        <div className="grid gap-6">
          <DisclaimerBox type="medical" />
          <MarcusGuideCard />
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8">
        <PullQuote quote="Two roads diverged in a wood, and the deeper question was how to walk with courage and care." attribution="Inspired by Robert Frost" />
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <SectionHeading eyebrow="Timeline" title="Moments along the path." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {["A question appears", "A story is shared", "A library begins"].map((title, index) => (
            <div key={title} className="rounded-[2rem] border border-ivory/10 bg-ivory/[0.04] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold-200">0{index + 1}</p>
              <h3 className="mt-3 font-serif text-3xl">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-ivory/68">
                A reflective placeholder for the client&apos;s verified story details, written carefully without treatment claims or prescriptive guidance.
              </p>
            </div>
          ))}
        </div>
      </section>
      <SplitImageTextSection image={assets.forestPathHero} eyebrow="The road not taken" title="The path is a metaphor, not a prescription.">
        <p>
          The forest path returns as a visual reminder that difficult choices deserve humility, trusted counsel, and thoughtful pacing. Visitors are invited to ask deeper questions while continuing to consult qualified professionals.
        </p>
      </SplitImageTextSection>
    </>
  );
}
