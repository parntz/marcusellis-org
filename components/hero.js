import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="section-tag">Welcome</p>
        <h1>
          Source-driven Next.js starting point.
        </h1>
        <p className="hero-text">
          This React starting point keeps the familiar navigation and visual
          tone of the source site while moving the project into reusable
          Next.js templates and generated content.
        </p>
        <div className="hero-actions">
          <Link href="/join" className="button button-primary">
            Join Now
          </Link>
          <Link href="/news" className="button button-secondary">
            Latest News & Events
          </Link>
        </div>
      </div>
      <div className="hero-media">
        <div className="media-card">
          <Image
            src="/images/stage-photo.jpg"
            alt="Stage performance"
            fill
            sizes="(max-width: 900px) 100vw, 40vw"
            className="hero-image"
          />
        </div>
        <div className="seal-card">
          <Image
            src="/images/slide-learn-more.png"
            alt="Learn more"
            width={129}
            height={29}
          />
          <p>
            Built as a component-based starting point that stays much closer to
            the original client-facing experience.
          </p>
        </div>
      </div>
    </section>
  );
}
