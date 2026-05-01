import { assets } from "@/lib/assets";
import { getFeaturedArticles, getFeaturedVideos } from "@/db/queries";
import { ArticleCard } from "@/components/ArticleCard";
import { CinematicHero } from "@/components/CinematicHero";
import { FeaturedResourceGrid } from "@/components/FeaturedResourceGrid";
import { GabrielGuideCard } from "@/components/GabrielGuideCard";
import { PathwayNavigation } from "@/components/PathwayNavigation";
import { SectionHeading } from "@/components/SectionHeading";
import { SplitImageTextSection } from "@/components/SplitImageTextSection";

export default async function HomePage() {
  const [articles, videos] = await Promise.all([getFeaturedArticles(), getFeaturedVideos()]);

  return (
    <>
      <CinematicHero
        eyebrow="The path less traveled"
        title="A different path through healing, story, and truth."
        subtitle="Explore personal stories, research links, interviews, resources, and reflections gathered for people asking deeper questions."
        image={assets.forestPathHero}
        primaryCta={{ label: "Watch My Story", href: "/videos" }}
        secondaryCta={{ label: "Explore Resources", href: "/articles" }}
        tertiaryCta={{ label: "Contact", href: "/contact" }}
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-[1fr_0.8fr] md:px-8">
        <div>
          <SectionHeading eyebrow="Gabriel as guide" title="A human guide through questions, story, and next steps.">
            <p>
              Gabriel is your guide through this collection, helping you find the story, articles, videos, and resources most relevant to your next step without turning curiosity into medical advice.
            </p>
          </SectionHeading>
        </div>
        <GabrielGuideCard />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <SectionHeading eyebrow="Featured media" title="Begin with the story, then follow the threads.">
          <p>Video cards use client-provided imagery as part of the site language, with external links clearly framed as educational resources.</p>
        </SectionHeading>
        <div className="mt-10">
          <FeaturedResourceGrid articles={articles} videos={videos} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <SectionHeading eyebrow="Pathways" title="Choose the door that meets your moment." />
        <div className="mt-10">
          <PathwayNavigation
            pathways={[
              { title: "My Story", href: "/my-story", description: "A personal narrative with video and reflective timeline moments.", image: assets.clientSpeaking },
              { title: "Videos", href: "/videos", description: "Interviews, talks, and musical pieces gathered for careful exploration.", image: assets.myStoryThumb },
              { title: "Articles", href: "/articles", description: "Editorial resources, research links, and questions worth exploring.", image: assets.icelandWater },
              { title: "Products & Affiliations", href: "/products", description: "External resources framed carefully without medical claims.", image: assets.businessPhotoOne },
              { title: "Intake", href: "/intake", description: "A simple, consent-based form that avoids unnecessary health details.", image: assets.clientPortrait },
              { title: "Donations", href: "/donations", description: "Support the library, interviews, hosting, and editorial care.", image: assets.businessPhotoTwo }
            ]}
          />
        </div>
      </section>

      <SplitImageTextSection image={assets.icelandWater} eyebrow="Movement and clarity" title="Water keeps moving. So can the questions.">
        <p>
          The Iceland water motif carries the feeling of renewal, flow, and a patient search for clarity. The aim is not to promise outcomes, but to help visitors move from overwhelm toward grounded questions and qualified counsel.
        </p>
      </SplitImageTextSection>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <SectionHeading eyebrow="Editorial library" title="Featured articles for discernment and reflection." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </>
  );
}
